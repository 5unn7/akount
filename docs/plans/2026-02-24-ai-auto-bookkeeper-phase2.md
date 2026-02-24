# AI Auto-Bookkeeper Phase II: Smart Rules Engine — Implementation Plan

**Created:** 2026-02-24
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-02-24-ai-autonomous-bookkeeper-brainstorm.md](docs/brainstorms/2026-02-24-ai-autonomous-bookkeeper-brainstorm.md) (Phase 2, lines 79-118)
**Prerequisite:** [Phase 1 Plan](docs/plans/2026-02-24-ai-auto-bookkeeper-phase1.md) (DEV-185 to DEV-200)

## Context

Phase I builds the "AI suggests, you approve" pipeline (categorization → JE drafting → Action Feed → batch approve). Phase II closes the learning loop: the system detects patterns from user corrections, suggests automation rules, and once approved, those rules auto-apply to future transactions — reducing manual work over time.

**Goal:** Learn → Suggest → Automate. After 2 weeks of corrections, 80%+ of recurring transactions auto-categorized by rules.
**Metric:** Rule coverage rate (% of imported transactions matched by rules vs keywords/AI).

## Success Criteria

- [ ] Users can create, edit, delete, toggle rules via UI at `/insights/rules`
- [ ] Rules evaluated BEFORE keywords in categorization pipeline (priority ordering)
- [ ] User corrections trigger pattern detection (3+ similar corrections = suggestion)
- [ ] Pattern detection creates RuleSuggestion + AIAction (RULE_SUGGESTION type)
- [ ] Rule suggestions appear in Action Feed with approve/reject/edit
- [ ] Approving a suggestion creates an active rule automatically
- [ ] Visual condition builder for creating/editing rule conditions
- [ ] Rule execution stats tracked (count, success rate)
- [ ] Existing import pipeline still works unchanged
- [ ] All tests pass, zero TS errors

---

## Architecture Decisions

**D1: No Schema Migrations Needed** — Rule and RuleSuggestion models already exist in Prisma with all needed fields, enums (RuleSource, RuleSuggestionStatus), and indexes.

**D2: Rule Conditions Schema** — JSON stored in `Rule.conditions`:
```json
{
  "operator": "AND",
  "conditions": [
    { "field": "description", "op": "contains", "value": "starbucks" },
    { "field": "amount", "op": "gt", "value": -10000 }
  ]
}
```
Supported fields: `description`, `amount`, `accountId`. Ops: `contains`, `eq`, `gt`, `lt`, `gte`, `lte`, `matches` (regex).

**D3: Rule Action Schema** — JSON stored in `Rule.action`:
```json
{ "setCategoryId": "cat_xxx", "setGLAccountId": "gl_xxx", "flagForReview": false }
```

**D4: Execution Priority** — First match wins, ordered:
1. `USER_MANUAL` rules (confidence 95)
2. `AI_SUGGESTED` rules with `userApprovedAt` set (confidence 90)
3. `SYSTEM_DEFAULT` rules (confidence 85)
4. Keyword patterns (existing, confidence 85)
5. AI fallback — Perplexity/Claude (confidence 60-75)

**D5: Pattern Detection Threshold** — 3+ similar corrections (same keyword → same category) triggers a rule suggestion. "Similar" = shares non-trivial keyword (>3 chars, not a stop word).

**D6: Integration with Phase 1 AIAction** — Rule suggestions create AIAction with `type: RULE_SUGGESTION`. Approval delegates to `RuleSuggestionService.approveSuggestion()` which creates the Rule.

---

## Tasks (12 tasks, 3 sprints)

### Sprint 2a: Rules CRUD + Engine (Tasks 1-4)

#### Task 1: Rule service — CRUD operations
**Files:** new `apps/api/src/domains/ai/services/rule.service.ts`, new `__tests__/rule.service.test.ts`
**What:**
- `RuleService` class (constructor: tenantId, userId) following `CategoryService` pattern
- Methods: `listRules` (cursor pagination + filters), `getRule`, `createRule` (validates conditions/action JSON, FK ownership for categoryId/glAccountId), `updateRule`, `deleteRule` (hard delete — rules are config, not financial), `toggleRule`, `incrementExecution` (atomic count + successRate recalc)
- Zod validation helpers: `validateConditions()`, `validateAction()` for JSON structure
- All operations tenant-isolated via `entity: { tenantId }`
- Audit logging on mutations
**Depends on:** none (Rule model exists)
**Success:** CRUD lifecycle with tenant isolation, FK validation

#### Task 2: Rule evaluation engine
**Files:** new `services/rule-engine.service.ts`, new `__tests__/rule-engine.service.test.ts`
**What:**
- `evaluateRules(transaction, entityId, tenantId)` — load active rules ordered by priority, evaluate conditions, return first match
- `evaluateRulesBatch(transactions, entityId, tenantId)` — single DB query, evaluate each transaction
- Condition evaluation: `contains` (case-insensitive substring), `eq`, `gt/lt/gte/lte` (integer cents), `matches` (regex with 100ms timeout, max 200 chars)
- AND/OR operator support at root level
- Return `RuleMatch { ruleId, categoryId, glAccountId, confidence, matchReason }`
- Async `incrementExecution()` call on match (non-blocking)
- Types: `RuleCondition`, `RuleConditions`, `RuleAction`, `RuleMatch`
**Depends on:** Task 1
**Success:** All operators work, priority ordering correct, first-match-wins, batch uses single query
**Review:** `financial-data-validator` (amount comparisons in cents)

#### Task 3: Rules API routes + Zod schemas
**Files:** new `routes/rules.ts`, new `schemas/rule.schema.ts`, new `__tests__/rules.routes.test.ts`, modify `routes/index.ts`
**What:**
- `GET /api/ai/rules` — list with filters (entityId, isActive, source, search), cursor pagination
- `GET /api/ai/rules/:id` — single rule
- `POST /api/ai/rules` — create (body: CreateRuleSchema)
- `PATCH /api/ai/rules/:id` — update (body: UpdateRuleSchema)
- `DELETE /api/ai/rules/:id` — delete
- `POST /api/ai/rules/:id/toggle` — toggle active
- `GET /api/ai/rules/stats` — total, active count, top 5 by execution
- Zod schemas: `RuleConditionSchema`, `RuleConditionsSchema`, `RuleActionSchema`, `CreateRuleSchema`, `UpdateRuleSchema`, `ListRulesSchema`
- Uses `handleAIError()` from Phase 1
- Tests: CRUD, tenant isolation, invalid conditions rejected, FK ownership
**Depends on:** Tasks 1, 2
**Review:** `fastify-api-reviewer`, `security-sentinel`

#### Task 4: Hook rules into autoCategorize pipeline
**Files:** modify `categorization.service.ts`, modify tests
**What:**
- In `categorizeTransaction()`: call `ruleEngine.evaluateRules()` BEFORE keyword matching. If match, return immediately.
- In `categorizeTransactions()`: call `evaluateRulesBatch()` first, keyword-match only unmatched transactions.
- Add optional `entityId` param (backward compatible — rules skipped if not provided)
- Update `CategorySuggestion` type: add optional `ruleId` field
- Update callers: `import.service.ts` `autoCategorize()` passes `entityId`, AI routes pass `entityId`
**Depends on:** Task 2, Phase 1 DEV-187 (enhanced categorization with entityId)
**Risk:** high (modifying import pipeline — must be backward compatible)
**Success:** Rules preempt keywords, import still works, existing tests pass
**Review:** `financial-data-validator`, `architecture-strategist`

---

### Sprint 2b: Pattern Detection + Suggestions (Tasks 5-8)

#### Task 5: Pattern detection service
**Files:** new `services/pattern-detection.service.ts`, new `__tests__/pattern-detection.service.test.ts`
**What:**
- `detectPatterns(entityId, tenantId)` — scan last 90 days of categorized transactions, find common keywords (3+ occurrences) mapping to same category, filter by pattern strength >= 0.7, skip patterns already covered by active rules or pending suggestions
- `analyzeCorrection(transactionId, newCategoryId, entityId, tenantId)` — called per correction, checks if threshold now met for this keyword+category combo
- Returns `DetectedPattern { keyword, categoryId, categoryName, transactionCount, patternStrength, exampleTransactions, suggestedConditions, suggestedAction }`
- Keyword extraction: tokenize description, filter stop words, keep tokens >3 chars
- Deduplication: check existing active rules and pending RuleSuggestions before suggesting
**Depends on:** Task 2 (types)
**Success:** Detects patterns at 3+ threshold, skips existing rules, filters stop words

#### Task 6: Rule suggestion generation service
**Files:** new `services/rule-suggestion.service.ts`, new `__tests__/rule-suggestion.service.test.ts`
**What:**
- `RuleSuggestionService` class (tenantId, userId)
- `createSuggestion(pattern, entityId)` — creates RuleSuggestion + AIAction (type: RULE_SUGGESTION) with payload `{ ruleSuggestionId, suggestedRule, patternSummary, exampleTransactions, estimatedImpact }`
- `listSuggestions(entityId, status?)`, `approveSuggestion(id)` — creates Rule with `source: AI_SUGGESTED`, `userApprovedAt: now()`
- `rejectSuggestion(id, reason?)`, `expireStaleSuggestions()` — lifecycle management
- AIAction creation wrapped in try/catch (non-critical)
**Depends on:** Task 5, Phase 1 DEV-192/193 (AIAction model + service)
**Success:** Suggestion creates linked AIAction, approval creates active Rule
**Review:** `security-sentinel`

#### Task 7: Wire correction triggers + RULE_SUGGESTION executor handler
**Files:** modify `categorization.service.ts` (replace `learnFromCorrection` stub), modify `transaction.service.ts` (add trigger in `bulkCategorize`), modify Phase 1's `action-executor.service.ts` (add RULE_SUGGESTION case)
**What:**
- Replace `learnFromCorrection()` stub: new signature `(transactionId, newCategoryId, entityId, tenantId, userId)`, calls `patternDetection.analyzeCorrection()`, if pattern found → `suggestionService.createSuggestion()`. All in try/catch (non-blocking).
- Wire into `bulkCategorize()`: call `learnFromCorrection()` for each updated transaction
- Wire into single transaction PATCH: call on categoryId change
- Add `RULE_SUGGESTION` case to Action Executor: calls `suggestionService.approveSuggestion(payload.ruleSuggestionId)`
**Depends on:** Tasks 5, 6, Phase 1 DEV-198 (Action Executor)
**Risk:** high (modifying correction pipeline with side effects — must be non-blocking)
**Success:** Corrections trigger detection, suggestions appear in Action Feed, approval creates Rule
**Review:** `financial-data-validator`, `security-sentinel`

#### Task 8: Rule suggestion API routes + tests
**Files:** new `routes/rule-suggestions.ts`, new `schemas/rule-suggestion.schema.ts`, new `__tests__/rule-suggestions.routes.test.ts`, modify `routes/index.ts`
**What:**
- `GET /api/ai/rules/suggestions` — list for entity with status filter
- `GET /api/ai/rules/suggestions/:id` — single with examples
- `POST /api/ai/rules/suggestions/:id/approve` — approve (creates Rule)
- `POST /api/ai/rules/suggestions/:id/reject` — reject (optional reason)
- `POST /api/ai/rules/detect` — manual pattern detection scan
- Tests: CRUD, tenant isolation, approve creates rule, concurrent approval safety
**Depends on:** Tasks 5, 6, 7
**Review:** `fastify-api-reviewer`, `security-sentinel`

---

### Sprint 2c: Rules UI (Tasks 9-12)

#### Task 9: Frontend API client + types for rules
**Files:** modify `apps/web/src/lib/api/ai.ts`
**What:**
- Add types: `Rule`, `RuleCondition`, `RuleConditions`, `RuleAction`, `RuleSuggestion`, `RuleStats`
- Add API functions: `listRules`, `getRule`, `createRule`, `updateRule`, `deleteRule`, `toggleRule`, `getRuleStats`, `listRuleSuggestions`, `approveSuggestion`, `rejectSuggestion`, `triggerPatternDetection`
- Uses `apiClient` pattern from existing ai.ts functions
**Depends on:** Tasks 3, 8
**Success:** Types match backend, all functions work

#### Task 10: Rules management page (`/insights/rules`)
**Files:** new `insights/rules/page.tsx` + `loading.tsx` + `error.tsx` + `rules-client.tsx` + `rule-sheet.tsx` + `rules-empty.tsx`, modify `navigation.ts`, modify `system/rules/page.tsx` (redirect)
**What:**
- Server Component → Client Component pattern (following tax-rates page)
- `rules-client.tsx`: search/filter bar, glass card list (name, source badge, active toggle, conditions summary, execution count, success rate), create/edit via Sheet
- `rule-sheet.tsx`: name input, condition builder (Task 11), action builder (category + GL dropdowns), isActive toggle, `key={rule?.id ?? 'create'}` for state reset
- Source badges: `text-ak-purple` AI_SUGGESTED, `text-primary` USER_MANUAL, `text-muted-foreground` SYSTEM_DEFAULT
- Execution stats in `font-mono`, glass cards with hover lift
- Add `{ label: 'Rules', icon: Workflow, href: '/insights/rules' }` to insights domain in navigation.ts
- Redirect `/system/rules` → `/insights/rules`
- loading.tsx + error.tsx (Invariant #6)
**Depends on:** Task 9
**Success:** Full CRUD works, search/filter work, navigation updated
**Review:** `design-system-enforcer`, `nextjs-app-router-reviewer`

#### Task 11: Rule condition builder component
**Files:** new `apps/web/src/components/ai/rule-condition-builder.tsx`
**What:**
- Visual condition builder: AND/OR toggle, condition rows (field dropdown, operator dropdown, value input)
- Add/remove conditions (max 10), preview text summary
- Amount values: display dollars, store cents (divide/multiply by 100)
- Props: `{ conditions: RuleConditions, onChange: (c) => void, entityId: string }`
- Glass card background, shadcn Select dropdowns, `font-mono` for amounts
- Semantic tokens only (no hardcoded hex)
**Depends on:** Task 10 (used in rule-sheet.tsx)
**Success:** Renders/edits conditions, amount conversion correct, AND/OR toggle works
**Review:** `design-system-enforcer`

#### Task 12: Rule suggestions in Action Feed
**Files:** modify Phase 1's `action-card.tsx` (DEV-196), modify `action-feed.tsx` (DEV-196)
**What:**
- RULE_SUGGESTION card: specialized rendering with AI reasoning, example transactions (collapsible), condition preview, "Create Rule" approve button, "Dismiss" reject, "Edit & Create" opens rule-sheet pre-populated
- Add RULE_SUGGESTION to type filter dropdown
- Uses existing `ConfidenceBadge` from Phase 1
**Depends on:** Tasks 9, 10, Phase 1 DEV-196 (Action Feed UI)
**Success:** Suggestions render in feed, approve creates rule, filter works

---

## Sprint Dependency Graph

```
PHASE 1 Prerequisites:
  DEV-187 (categorization) ───────────┐
  DEV-192 (AIAction model) ───────────┤
  DEV-193 (AIAction service) ─────────┤
  DEV-196 (Action Feed UI) ───────────┤
  DEV-198 (Action Executor) ──────────┘
                                       │
Sprint 2a:  T1 (no deps) ─────────────┤
            T2 ← T1                    │
            T3 ← T1, T2               │
            T4 ← T2, DEV-187          │
                                       │
Sprint 2b:  T5 ← T2 (types)           │
            T6 ← T5, DEV-192, DEV-193 │
            T7 ← T5, T6, DEV-198      │
            T8 ← T5, T6, T7           │
                                       │
Sprint 2c:  T9  ← T3, T8              │
            T10 ← T9                   │
            T11 ← T10                  │
            T12 ← T9, T10, DEV-196    │
```

**Parallelizable:** T1+T5 (start together), T3+T4, T10+T12

## Reference Files

| File | Pattern to Reuse |
|------|-----------------|
| `apps/api/src/domains/banking/services/category.service.ts` | Service class pattern (constructor tenantId/userId, tenant-isolated CRUD) |
| `apps/api/src/domains/accounting/services/tax-rate.service.ts` | CRUD with audit logging, FK validation |
| `apps/api/src/domains/accounting/routes/tax-rate.ts` | Route pattern (withPermission, validate*, handleError) |
| `apps/api/src/domains/accounting/schemas/tax-rate.schema.ts` | Zod schema pattern |
| `apps/api/src/domains/ai/services/categorization.service.ts` | File to modify: keyword patterns, learnFromCorrection stub (line 359) |
| `apps/api/src/domains/banking/services/import.service.ts` | autoCategorize pipeline (line 556) — hook point |
| `apps/api/src/domains/banking/services/transaction.service.ts` | bulkCategorize (line 412) — correction trigger |
| `apps/web/src/app/(dashboard)/accounting/tax-rates/` | Frontend CRUD page pattern (Server+Client+Sheet+Empty+loading+error) |
| `apps/web/src/lib/api/ai.ts` | Frontend API client pattern, existing stubs |

## Edge Cases

- **Conflicting rules:** First match wins (priority order). Document in UI.
- **Rule with deleted category:** Skip match (category lookup null), successRate degrades.
- **Regex injection (matches op):** 100ms timeout, max 200 chars, reject longer patterns.
- **Empty description:** Skip `contains` evaluation for empty fields.
- **Concurrent approval:** WHERE `status: PENDING` prevents double Rule creation.
- **Bulk correction mixed entities:** Feed pattern detection per transaction's entity.
- **Approval fails mid-transaction:** RuleSuggestion stays PENDING, error returned to user.
- **Stale suggestions:** `expireStaleSuggestions()` marks 30-day-old PENDING as EXPIRED.

## Domain Impact

- **Primary:** AI/Insights (new services + routes + UI), Banking (pipeline hook)
- **Adjacent:** Accounting (GL resolution via rules), System (redirect /system/rules)
- **Schema changes:** NONE (all models exist)

## Testing Strategy

- **Unit tests:** Rule CRUD, engine evaluation, pattern detection, suggestion lifecycle
- **Financial assertions:** Amount comparisons in integer cents, tenant isolation
- **Integration:** Import 20 txns → categorize 5 manually → detect pattern → approve suggestion → import 10 more → auto-categorized
- **Run per task:** `cd apps/api && npx vitest run`

## Estimated Effort

| Sprint | Tasks | Days | Risk |
|--------|-------|------|------|
| 2a: Rules CRUD + Engine | 4 | 3-4 | Medium |
| 2b: Pattern Detection | 4 | 3-4 | High |
| 2c: Rules UI | 4 | 3-4 | Low-Med |
| **Total** | **12** | **9-12** | |

---

## Progress

- [ ] Task 1: Rule service CRUD
- [ ] Task 2: Rule evaluation engine
- [ ] Task 3: Rules API routes + schemas
- [ ] Task 4: Hook rules into autoCategorize pipeline
- [ ] Task 5: Pattern detection service
- [ ] Task 6: Rule suggestion generation service
- [ ] Task 7: Wire correction triggers + executor handler
- [ ] Task 8: Rule suggestion API routes
- [ ] Task 9: Frontend API client + types
- [ ] Task 10: Rules management page
- [ ] Task 11: Rule condition builder component
- [ ] Task 12: Rule suggestions in Action Feed
