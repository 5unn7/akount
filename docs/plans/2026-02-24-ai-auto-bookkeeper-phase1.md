# AI Auto-Bookkeeper (Phase 1) — Implementation Plan

**Created:** 2026-02-24
**Status:** Ready (amended with multi-agent review findings 2026-02-25)
**Review:** [Review Plan](../../.claude/plans/zany-wibbling-clarke.md)
**Brainstorm:** [docs/brainstorms/2026-02-24-ai-autonomous-bookkeeper-brainstorm.md](docs/brainstorms/2026-02-24-ai-autonomous-bookkeeper-brainstorm.md)

## Context

Basis AI just hit $1.15B validating the agent-first accounting approach. Akount already has 40% of the AI infrastructure built (chat, categorization, 3 Prisma models). Phase 1 bridges the gap from "AI that suggests categories" to "AI that drafts your journal entries and lets you approve them in one click."

**Goal:** Import bank data → AI categorizes → AI drafts JEs → user batch-approves → books closed.
**Metric:** "Close your books in 10 minutes."

## Success Criteria

- [ ] AI categorizes transactions with GL account resolution (not just category names)
- [ ] AI drafts balanced DRAFT journal entries from categorized transactions
- [ ] Action Feed shows all AI suggestions with confidence badges
- [ ] Users can batch-approve high-confidence actions in one click
- [ ] Dashboard widget shows pending AI action count
- [ ] All JEs pass double-entry validation (SUM debits === SUM credits)
- [ ] Full test coverage on financial paths
- [ ] Multi-currency handling works (4-field money pattern)

---

## Architecture Decisions

**D1: Category → GL Mapping** — Add optional `defaultGLAccountId` FK on Category model + name-based COA code fallback + default to code 5990 (Other Expenses). Simple, no new join table.

**D2: AIAction Model** — New Prisma model to track every AI suggestion lifecycle (PENDING → APPROVED/REJECTED). Payload field (JSON) holds type-specific data. Single table for all action types.

**D3: JE Creation** — Follow existing `posting.service.ts` pattern exactly. All JEs created as DRAFT with `sourceType: AI_SUGGESTION`. Existing `approveEntry()` handles posting.

**D4: Multi-Provider** — Add Claude provider via `@anthropic-ai/sdk`. Use Haiku for speed/cost. Existing `AIProvider` interface requires zero changes.

---

## Tasks (16 tasks, 4 sprints)

### Sprint 1a: Enhanced Categorization (Tasks 1-4)

#### Task 1: Add `defaultGLAccountId` FK to Category model
**Files:** `packages/db/prisma/schema.prisma`, new migration
**What:** Add optional `defaultGLAccountId String?` on Category → GLAccount relation. Add index.
**Depends on:** none
**Success:** Migration runs, Prisma regenerates, existing tests pass
**Review:** `prisma-migration-reviewer`

#### Task 2: Add `AI_SUGGESTION` to JournalEntrySourceType enum
**Files:** `packages/db/prisma/schema.prisma`, new migration
**What:** Additive enum value. No data migration needed.
**Depends on:** none (parallel with Task 1)
**Success:** Enum available in Prisma client

#### Task 3: Enhance categorization with GL resolution + confidence tiers
**Files:** `apps/api/src/domains/ai/services/categorization.service.ts`
**What:**
- Add `resolvedGLAccountId` and `confidenceTier` (high/medium/low) to `CategorySuggestion`
- New function `resolveGLAccountForCategory(categoryId, categoryName, entityId)` with fallback chain: Category.defaultGLAccountId → name-based COA code match → code 5990
- Add `CATEGORY_TO_COA_CODE` mapping constant (~15 well-known mappings from existing keyword patterns)
- Accept `entityId` in `categorizeTransactions()` for GL resolution
- Backward compatible — new fields are optional
**Depends on:** Task 1
**Risk:** high (must not break existing import pipeline)
**Success:** Categorization returns GL account IDs; import pipeline still works unchanged
**Review:** `financial-data-validator`

#### Task 4: Batch categorize API endpoint
**Files:** `apps/api/src/domains/ai/routes.ts`, new `schemas/categorization.schema.ts`
**What:**
- Extract inline Zod schemas to schema file
- New `POST /api/ai/categorize/batch` — accepts `{ transactionIds, entityId }`, returns suggestions with GL mapping
- Enhance existing `/categorize` response to include GL + confidence tier
**Depends on:** Task 3
**Success:** Batch endpoint categorizes up to 100 transactions with GL resolution

---

### Sprint 1b: AI JE Drafting (Tasks 5-7)

#### Task 5: Add Claude (Anthropic) provider
**Files:** new `providers/claude.provider.ts`, modify `ai.service.ts`, `apps/api/package.json`
**What:**
- Install `@anthropic-ai/sdk`
- `ClaudeProvider` implementing existing `AIProvider` interface
- Default model: `claude-3-5-haiku-latest` (speed + cost)
- Register when `ANTHROPIC_API_KEY` present
**Depends on:** none (parallel with Sprint 1a)
**Success:** `aiService.chat(msgs, { provider: 'claude' })` works
**Review:** `security-sentinel`

#### Task 6: JE suggestion service (core)
**Files:** new `services/je-suggestion.service.ts`, new `services/je-suggestion.types.ts`
**What:**
- `JESuggestionService.draftJournalEntries(transactionIds, entityId)`
  1. Load transactions with account, entity, categorization
  2. Auto-categorize uncategorized transactions first
  3. Resolve GL accounts via fallback chain (Task 3)
  4. Build JE lines: DR bank GL / CR target GL (or vice versa based on amount sign)
  5. Handle multi-currency (4-field pattern, existing FX rate lookup)
  6. Validate double-entry balance
  7. Create via `JournalEntryService.createEntry()` with `sourceType: AI_SUGGESTION`
  8. Link transaction to JE
- Skip already-posted transactions
- Fiscal period validation
- Source document snapshot includes AI metadata (confidence, provider, model)
**Depends on:** Tasks 1, 2, 3, 5
**Risk:** high (financial data, double-entry bookkeeping)
**Success:** Creates balanced DRAFT JEs with full audit trail
**Review:** `financial-data-validator`, `security-sentinel`

#### Task 7: JE suggestion API + tests
**Files:** new `routes/je-suggestions.ts`, new `schemas/je-suggestion.schema.ts`, refactor `routes.ts` → `routes/index.ts`, tests
**What:**
- `POST /api/ai/journal-entries/draft` — drafts JEs for transaction IDs (max 50)
- `GET /api/ai/journal-entries/preview` — dry-run preview without persisting
- Refactor monolithic `routes.ts` into `routes/` directory (chat, categorize, je-suggestions, index)
- Tests: happy path, multi-currency, already-posted skip, tenant isolation, double-entry assertions
**Depends on:** Task 6
**Risk:** high
**Success:** Endpoints create/preview JE drafts; all financial invariants pass
**Review:** `financial-data-validator`, `fastify-api-reviewer`

---

### Sprint 1c: Action Feed (Tasks 8-12)

#### Task 8: Create AIAction Prisma model
**Files:** `packages/db/prisma/schema.prisma`, new migration
**What:**
- Enums: `AIActionType` (CATEGORIZATION, JE_DRAFT, RULE_SUGGESTION, INSIGHT, ALERT), `AIActionStatus` (PENDING, APPROVED, REJECTED, MODIFIED, EXPIRED)
- Model: id, entityId, type, title, description?, status, confidence(Float?), priority, payload(Json), aiProvider?, aiModel?, metadata(Json?), reviewedAt?, reviewedBy?, expiresAt?, timestamps
- Indexes: `[entityId, status]`, `[entityId, type, status]`, `[entityId, createdAt]`, `[status, expiresAt]`
- Relation on Entity
**Depends on:** none (parallel with Sprint 1b)
**Success:** Migration runs, model usable
**Review:** `prisma-migration-reviewer`

#### Task 9: AIAction service + AI domain error handler
**Files:** new `services/ai-action.service.ts`, new `errors.ts`
**What:**
- CRUD: createAction, listActions (cursor pagination + filters), getAction, approveAction, rejectAction, modifyAction
- Batch: batchApprove, batchReject
- Stats: getStats (pending counts by type for dashboard widget)
- Lifecycle: expireStaleActions (expiresAt < now)
- All operations tenant-isolated
- Audit logging on approve/reject/modify
- AI domain `errors.ts` with `AIError` class + `handleAIError()` (following accounting pattern)
**Depends on:** Task 8
**Success:** Full CRUD lifecycle with tenant isolation

#### Task 10: Action Feed API routes + tests
**Files:** new `routes/actions.ts`, new `schemas/action.schema.ts`, route + service tests
**What:**
- `GET /api/ai/actions` — list with filters (type, status, confidence, date), cursor pagination
- `GET /api/ai/actions/:id` — single action detail
- `POST /api/ai/actions/:id/approve` — approve single
- `POST /api/ai/actions/:id/reject` — reject single
- `POST /api/ai/actions/batch/approve` — batch approve (body: `{ actionIds }`)
- `POST /api/ai/actions/batch/reject` — batch reject
- `GET /api/ai/actions/stats` — pending counts for dashboard
- RBAC: `ai.actions.VIEW` / `ai.actions.ACT`
- Tests: CRUD, tenant isolation, batch with partial failure
**Depends on:** Task 9
**Review:** `fastify-api-reviewer`, `security-sentinel`

#### Task 11: Wire JE/categorization services to create AIActions
**Files:** modify `je-suggestion.service.ts`, modify `categorization.service.ts`
**What:**
- After `draftJournalEntries()` creates JEs → create `JE_DRAFT` AIActions with payload `{ journalEntryId, transactionId, lines, confidence }`
- After batch categorization → create `CATEGORIZATION` AIAction (one per batch, not per transaction)
- Group actions: batch of 50 txns = 1 CATEGORIZATION action + N JE_DRAFT actions
- AIAction creation wrapped in try/catch (must not fail the main operation)
- Priority: amount > $1000 = high, otherwise medium
- ExpiresAt: 30 days
**Depends on:** Tasks 6, 9
**Success:** Every AI suggestion creates an AIAction; feed shows items after batch operations

#### Task 12: Frontend Action Feed UI
**Files:** new `insights/actions/page.tsx` + `loading.tsx` + `error.tsx`, new `components/ai/action-feed.tsx` + `action-card.tsx` + `confidence-badge.tsx`, modify `navigation.ts`, modify `api/ai.ts`
**What:**
- Add AIAction types to `api/ai.ts`: `AIAction`, `AIActionType`, `AIActionStatus`, + CRUD functions
- Add "Actions" nav item to insights domain in `navigation.ts` (icon: `Zap`)
- `ActionFeed` client component:
  - Glass cards per action with confidence badge (green/amber/red)
  - Inline approve/reject buttons
  - "Approve All High-Confidence" batch button
  - Expand to show JE preview (debit/credit lines in `font-mono`)
  - Filters: type, status, confidence tier
  - Optimistic state (Strategy 1: useState, no router.refresh)
  - 30-second polling for new actions
- `ConfidenceBadge`: >=0.9 green "Recommended", 0.7-0.9 amber "Review", <0.7 red "Needs Review"
- Semantic tokens: `text-ak-purple` (AI), `text-ak-green`/`text-ak-red` for confidence
- Loading/error state files (Invariant #6)
**Depends on:** Task 10
**Success:** Feed page renders, filters work, approve/reject updates optimistically
**Review:** `design-system-enforcer`, `nextjs-app-router-reviewer`

---

### Sprint 1d: Batch Approve Workflow (Tasks 13-16)

#### Task 13: Batch JE approval endpoint (accounting domain)
**Files:** modify `journal-entry.service.ts`, modify `routes/journal-entries.ts`, modify schemas
**What:**
- `batchApproveEntries(entryIds)` — loads with tenant filter, validates DRAFT + fiscal period, approves each
- Partial success: per-entry result (success/fail with reason)
- `POST /api/accounting/journal-entries/batch/approve` — body `{ entryIds }` max 100
- Audit log per approval
- Tests: happy path, partial failure, already-posted, fiscal period closed
**Depends on:** none (builds on existing JournalEntryService)
**Risk:** high (financial)
**Success:** Batch approves valid DRAFTs, reports failures individually
**Review:** `financial-data-validator`, `security-sentinel`

#### Task 14: Wire AIAction approval to execution
**Files:** new `services/action-executor.service.ts`, modify `ai-action.service.ts`
**What:**
- `ActionExecutorService.executeAction(action)` — dispatches by type:
  - `JE_DRAFT`: calls `approveEntry()` for linked JE
  - `CATEGORIZATION`: applies suggested categories to transactions
- `approveAction()` calls executor after status update
- If execution fails → revert to PENDING with error message
- Handle: JE already approved/voided, transaction already categorized (idempotent), fiscal period closed
- `batchApprove()` executes each, reports per-action results
**Depends on:** Tasks 9, 11, 13
**Risk:** high (financial execution)
**Success:** Approving JE_DRAFT action posts the JE; failures reported without data corruption
**Review:** `financial-data-validator`, `security-sentinel`

#### Task 15: Dashboard AI Action widget
**Files:** new `components/dashboard/AIActionWidget.tsx`, modify dashboard layout, add `getActionStats()` to `api/ai.ts`
**What:**
- Glass card widget: pending count badge, latest 3 pending actions with confidence badges
- "View All" link to `/insights/actions`
- "Approve All Recommended" button (batch approve confidence >= 0.9)
- Loading skeleton + empty state following `ActionItems.tsx` pattern
- Wire into dashboard (right rail or dedicated row)
**Depends on:** Tasks 10, 12
**Success:** Widget shows on dashboard, quick-approve works

#### Task 16: Integration test — full workflow
**Files:** new `__tests__/auto-bookkeeper-e2e.test.ts`
**What:**
- End-to-end: seed entity + COA + bank account → import transactions → batch categorize → draft JEs → verify AIActions created → batch approve → verify JEs posted
- Financial invariant assertions throughout (integer cents, balanced, source preserved)
- Multi-currency test (entity CAD, transaction USD)
- Tenant isolation test
- Separation of duties test
**Depends on:** Tasks 7, 10, 13, 14
**Success:** Full pipeline test passes
**Review:** `financial-data-validator`

---

## Reference Files

| File | Pattern to Reuse |
|------|-----------------|
| `apps/api/src/domains/accounting/services/posting.service.ts` | JE creation: tenant check, GL validation, FX handling, balance check, entry number, audit log |
| `apps/api/src/domains/accounting/services/document-posting.service.ts` | `WELL_KNOWN_CODES`, `resolveGLAccountByCode()`, line.amount semantics |
| `apps/api/src/domains/accounting/utils/entry-number.ts` | `generateEntryNumber(tx, entityId)` — MUST use, never inline |
| `apps/api/src/domains/ai/services/categorization.service.ts` | Keyword patterns, batch optimization, category lookup |
| `apps/api/src/domains/ai/services/providers/perplexity.provider.ts` | Provider implementation pattern for Claude |
| `apps/web/src/components/dashboard/ActionItems.tsx` | Widget pattern: glass card, loading skeleton, empty state |
| `apps/web/src/app/(dashboard)/insights/chat-interface.tsx` | Client component pattern with `apiFetch`, optimistic state |

## Edge Cases

- **No GL mapping found:** Fall back to code 5990 (Other Expenses). Log warning for manual review.
- **Bank account has no GL mapping:** Skip transaction, include in "skipped" response count with reason.
- **Fiscal period closed:** AIAction created but execution blocked on approve. Error message explains.
- **Transaction already posted:** Skip silently in drafting. Idempotent on re-run.
- **AIAction expired:** `expireStaleActions()` marks EXPIRED. Linked DRAFT JEs remain (user can manually approve).
- **Concurrent approve/reject:** Use `status` check in WHERE clause — only update if still PENDING.
- **Claude API timeout:** 30s timeout, fall back to categorization-only (no JE drafting) with lower confidence.

## Domain Impact

- **Primary:** AI/Insights, Accounting (JE creation, batch approve)
- **Adjacent:** Banking (categorization in import pipeline), Overview (dashboard widget)
- **Schema changes:** 3 migrations (Category FK, enum value, AIAction model)

## Testing Strategy

- **Unit tests:** JE suggestion service (mocked Prisma), AI action service (mocked Prisma), categorization GL resolution
- **Route tests:** All new API endpoints with auth/tenant/RBAC mocking
- **Financial assertions:** `assertIntegerCents`, balanced JEs, source preservation (from `test-utils/financial-assertions.ts`)
- **Integration test:** Full pipeline end-to-end (Task 16)
- **Run after each task:** `cd apps/api && npx vitest run` to verify no regressions

## Verification

After all 16 tasks complete:
1. `cd apps/api && npx vitest run --reporter=verbose` — all tests pass
2. `cd apps/web && npx tsc --noEmit` — zero TS errors
3. Manual test: import 10 transactions → see categorization suggestions → see JE drafts in Action Feed → batch approve → verify JEs posted in accounting
4. Multi-currency test: create USD transaction in CAD entity → verify FX conversion in JE lines
5. Dashboard widget shows correct pending count

---

## Sprint Dependency Graph

```
Sprint 1a:  T1 ──┐   T2 ─────┐
            T3 ←─┘            │
            T4 ← T3           │
                               │
Sprint 1b:  T5 (parallel) ────┤
            T6 ← T1,T2,T3,T5 │
            T7 ← T6           │
                               │
Sprint 1c:  T8 (parallel) ────┤
            T9  ← T8          │
            T10 ← T9          │
            T11 ← T6,T9       │
            T12 ← T10         │
                               │
Sprint 1d:  T13 (parallel) ───┤
            T14 ← T9,T11,T13  │
            T15 ← T10,T12     │
            T16 ← T7,T10,T13,T14
```

**Parallelizable:** T1+T2, T5+T8, T12+T13, T15+T16

## Estimated Effort

| Sprint | Tasks | Days | Risk |
|--------|-------|------|------|
| 1a: Categorization | 4 | 2-3 | Low-Med |
| 1b: JE Drafting | 3 | 2-3 | High |
| 1c: Action Feed | 5 | 3-4 | Medium |
| 1d: Batch Approve | 4 | 2-3 | High |
| **Total** | **16** | **9-13** | |

---

## Progress

**Prerequisites:** SEC-28 (RBAC), INFRA-60 (rate limiting), DEV-202 (GL utility extraction)

- [ ] Task 1 (DEV-185): Category defaultGLAccountId FK + cross-scope FK documentation
- [ ] Task 2 (DEV-186): AI_SUGGESTION enum
- [ ] Task 3 (DEV-187): Enhanced categorization + GL resolution + sign-aware fallback
- [ ] Task 4 (DEV-188): Batch categorize API
- [ ] Task 5 (DEV-189): Claude provider + ANTHROPIC_API_KEY env validation
- [ ] Task 6 (DEV-190): JE suggestion service + transfer guard + zero-amount guard
- [ ] Task 7 (DEV-191): JE suggestion API + tests + JSON payload size limits
- [ ] Task 8 (DEV-192): AIAction Prisma model (no INSIGHT enum, Int confidence)
- [ ] Task 9 (DEV-193): AIAction service + error handler + expiresAt validation
- [ ] Task 10 (DEV-194): Action Feed API routes + entityId required + SEC-28 RBAC
- [ ] Task 11 (DEV-195): Wire services to create AIActions
- [ ] Task 12 (DEV-196): Frontend Action Feed UI
- [ ] Task 13 (DEV-197): Batch JE approval + per-entry $transaction atomicity
- [ ] Task 14 (DEV-198): Wire AIAction approval + DRAFT JE cleanup on rejection
- [ ] Task 15 (DEV-199): Dashboard AI Action widget
- [ ] Task 16 (DEV-200): Integration test
