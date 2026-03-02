# AI Autonomous Bookkeeper — Brainstorm

**Date:** 2026-02-24
**Status:** Brainstormed
**Competitive Context:** Basis AI hit $1.15B valuation (Feb 2026) with agent-first approach for accounting firms. Akount differentiates by targeting solopreneurs, owning the ledger, and multi-entity/multi-currency.

---

## Problem

Solopreneurs running multiple global businesses spend hours on bookkeeping — categorizing transactions, creating journal entries, reconciling accounts, and closing books monthly. This is repetitive, error-prone, and takes time away from revenue-generating work.

**Target metric:** "Close your books in 10 minutes" (vs. Basis's "15 days → 5 days" for firms).

---

## Chosen Approach: Phased Autonomous Bookkeeper

Three AI capability layers, built incrementally, unified through an **Action Feed** UX pattern and a **Suggest & Confirm** trust model.

### Trust Architecture: Suggest & Confirm

AI performs analysis and drafts actions, but NEVER commits changes without user approval. Everything flows through the Action Feed where users approve, reject, or modify AI suggestions.

**Confidence tiers (visual only — all require approval):**
- **High (>90%):** Green indicator, "Recommended" badge, prominent "Approve All" for batches
- **Medium (70-90%):** Amber indicator, individual review encouraged
- **Low (<70%):** Red indicator, "Needs Review" badge, expanded context shown

Over time, as trust builds, we can offer a "Confidence Threshold" mode where high-confidence actions auto-execute (opt-in per user). But MVP is always suggest & confirm.

---

## Phase 1: Auto-Bookkeeper (Core — Build First)

### Workflow: Bank Import → Books Done

1. **Import bank data** (CSV, Plaid, or manual) — already built
2. **AI categorizes all transactions** — keyword engine exists, needs confidence scoring + batch UI
3. **AI drafts journal entries** — NEW: generate JE suggestions from categorized transactions
4. **User reviews batch in Action Feed** — NEW: batch approve/reject/modify
5. **One-click approve → books posted** — wire to existing JE creation service

### Key Features

**Smart Categorization (enhance existing):**
- Current: keyword matching (~138 patterns) + Perplexity fallback
- Add: pattern learning from user corrections (Rule model exists)
- Add: confidence scores surfaced in UI
- Add: batch categorization review in Action Feed

**JE Draft Generation (new):**
- Analyze categorized transactions → generate draft JEs
- Map categories to GL accounts (Category → GLAccount linking exists)
- Handle multi-currency (4-field money pattern already built)
- Store as `status: DRAFT` journal entries with `sourceType: AI_SUGGESTION`
- Show debit/credit preview in Action Feed item

**Batch Approval UX (new):**
- Action Feed shows: "AI categorized 47 transactions and drafted 12 journal entries"
- Expand to see individual items with confidence indicators
- "Approve All High-Confidence" button (>90%)
- Individual approve/reject/modify for each item
- Modification opens inline editor (not a separate page)

### Technical Components

| Component | Location | Status |
|-----------|----------|--------|
| Categorization service | `domains/ai/services/categorization.service.ts` | Enhance |
| JE suggestion service | `domains/ai/services/je-suggestion.service.ts` | NEW |
| Action model | `packages/db/prisma/schema.prisma` | NEW |
| Action feed API | `domains/ai/routes/actions.ts` | NEW |
| Action feed UI | `apps/web/src/components/ai/action-feed.tsx` | NEW |
| Batch approval API | `domains/ai/routes/batch.ts` | NEW |

---

## Phase 2: Smart Rules Engine (Build Second)

### Workflow: Learn → Suggest → Automate

1. **AI analyzes transaction patterns** — "You categorized 15 Uber transactions as Transport"
2. **AI suggests a Rule** — "Create rule: description contains 'Uber' → categorize as Transport?"
3. **User approves rule** → stored in Rule model (already exists)
4. **Rules auto-apply to new transactions** — runs before AI categorization
5. **Rules feed into JE drafting** — categorized by rule = higher confidence

### Key Features

**Pattern Detection (new):**
- Analyze correction history: user overrides AI suggestion → detect pattern
- Frequency analysis: "12 of last 15 Netflix transactions categorized as Subscriptions"
- Amount-based patterns: "Transactions >$500 from Vendor X always go to Equipment"

**Rule Builder (new):**
- Conditions: description contains/matches, amount range, vendor/client match, date pattern
- Actions: set category, assign GL account, create JE draft, flag for review
- Use existing `Rule.conditions` (JSON) and `Rule.action` (JSON) schema
- `RuleSuggestion` model for AI-suggested rules pending approval

**Rule Execution Engine (new):**
- Evaluate rules in priority order against incoming transactions
- Track `executionCount` and `successRate` (fields exist on Rule model)
- Rules take precedence over AI categorization (faster, deterministic)

### Technical Components

| Component | Location | Status |
|-----------|----------|--------|
| Rule model | `packages/db/prisma/schema.prisma` | EXISTS |
| RuleSuggestion model | `packages/db/prisma/schema.prisma` | EXISTS |
| Rules CRUD service | `domains/ai/services/rules.service.ts` | NEW |
| Rules engine | `domains/ai/services/rules-engine.service.ts` | NEW |
| Pattern detection | `domains/ai/services/pattern-detection.service.ts` | NEW |
| Rule builder UI | `apps/web/src/app/(dashboard)/insights/rules/` | NEW |
| Rule suggestion UI | integrated into Action Feed | NEW |

---

## Phase 3: AI Financial Advisor (Build Third)

### Workflow: Analyze → Alert → Advise

1. **AI monitors financial data continuously** — cash flow, spending patterns, AR aging
2. **AI generates proactive insights** — "Cash runway: 3 months at current burn"
3. **AI surfaces alerts in Action Feed** — prioritized by impact and urgency
4. **User acts on insights** — click through to relevant page, dismiss, or snooze

### Key Features

**Insight Types (using existing Insight model):**

| Type | Example | Trigger |
|------|---------|---------|
| `cash_flow_warning` | "Cash drops below $5K in 2 weeks at current rate" | Daily cash flow projection |
| `spending_anomaly` | "SaaS spend up 40% vs 3-month average" | Category trend analysis |
| `duplicate_expense` | "Possible duplicate: $49.99 to Notion on Feb 1 and Feb 2" | Transaction similarity |
| `overdue_alert` | "3 invoices overdue totaling $4,200" | AR aging check |
| `tax_estimate` | "Estimated Q1 tax liability: $8,500" | Revenue/expense projection |
| `revenue_trend` | "Revenue down 15% month-over-month" | P&L trend analysis |
| `reconciliation_gap` | "42 unreconciled transactions in Chase account" | Account status check |
| `goal_progress` | "Emergency fund: 67% of target, on track for June" | Goal tracking |

**Insight Generation Triggers:**
- **On import:** After bank data import, generate spending/duplicate insights
- **Daily cron:** Cash flow projections, overdue checks, trend analysis
- **On event:** Payment received → update AR insight, JE posted → update GL insight

**Monthly Close Package (premium workflow):**
- AI pre-flight check: unreconciled items, missing JEs, anomalies
- Generates "Close Readiness" score (0-100%)
- Checklist of items to resolve before close
- One-click "Close Month" when score = 100%

### Technical Components

| Component | Location | Status |
|-----------|----------|--------|
| Insight model | `packages/db/prisma/schema.prisma` | EXISTS |
| Insight generation service | `domains/ai/services/insight-generator.service.ts` | NEW |
| Cash flow analyzer | `domains/ai/services/analyzers/cash-flow.ts` | NEW |
| Spending analyzer | `domains/ai/services/analyzers/spending.ts` | NEW |
| Anomaly detector | `domains/ai/services/analyzers/anomaly.ts` | NEW |
| Monthly close service | `domains/ai/services/monthly-close.service.ts` | NEW |
| Insights API | `domains/ai/routes/insights.ts` | STUB → implement |
| Insights UI | `apps/web/src/app/(dashboard)/insights/` | ENHANCE |

---

## AI Provider Strategy: Multi-Provider

| Provider | Use Case | Why |
|----------|----------|-----|
| **Claude (Anthropic)** | Complex reasoning: JE drafting, anomaly analysis, insight generation, monthly close | Best structured reasoning, tool use, financial analysis |
| **Lightweight model** | Fast categorization, pattern matching, rule evaluation | Speed + cost for high-volume ops |
| **Perplexity** | Web-aware chat (already built), market research, regulatory updates | Web access for real-time info |

**Architecture:** Provider abstraction layer (`AIProvider` interface already exists in `perplexity.provider.ts`). Add `ClaudeProvider` and a lightweight provider. Service layer picks provider based on task type.

---

## Action Feed: The Unifying UX Pattern

The Action Feed is the central nervous system for all AI features. It's a real-time, filterable stream of AI-generated actions.

### Action Model (NEW Prisma model)

```
AIAction {
  id            String
  entityId      String
  type          ActionType    // CATEGORIZATION, JE_DRAFT, RULE_SUGGESTION, INSIGHT, ALERT
  title         String        // "Categorized 23 transactions"
  description   String        // Details
  status        ActionStatus  // PENDING, APPROVED, REJECTED, MODIFIED, EXPIRED
  confidence    Float         // 0-1
  priority      String        // low, medium, high, critical
  payload       Json          // Type-specific data (transaction IDs, JE draft, etc.)
  aiProvider    String        // Which provider generated this
  aiModel       String        // Model version
  reviewedAt    DateTime?
  reviewedBy    String?
  createdAt     DateTime
  entity        Entity
}
```

### UX Layout

- **Dashboard widget:** Badge count of pending actions + latest 3 items
- **Full Action Feed page:** `/insights/actions` (or sidebar panel)
- **Filters:** By type, confidence, date, status
- **Batch operations:** "Approve All High-Confidence", "Dismiss All Expired"
- **Inline editing:** Modify AI suggestion without leaving the feed

### Action Feed Flow

```
AI Service generates action → Stored in AIAction table →
  Appears in Action Feed (real-time via polling or SSE) →
    User reviews → Approves/Rejects/Modifies →
      If approved: execute action (create JE, apply category, etc.) →
        Log to audit trail (sourceType: AI_ACTION, sourceId: action.id)
```

---

## Domain Impact

### Primary Domains Affected

- **AI/Insights** — Core domain: all new services, routes, models
- **Banking** — Categorization pipeline enhancement, reconciliation suggestions
- **Accounting** — JE drafting, auto-posting, monthly close
- **Overview** — Dashboard widget for Action Feed summary

### Adjacent Domain Effects

- **Business** — Invoice-to-cash automation (Phase 1b), payment matching
- **Planning** — Goal progress insights (Phase 3), budget vs actual alerts
- **System** — Audit trail for AI actions, entity-scoped AI settings

### Data Flow Changes

```
Current:    Import → Manual Categorize → Manual JE → Manual Reconcile
Phase 1:    Import → AI Categorize (suggest) → AI Draft JE (suggest) → Batch Approve
Phase 2:    Import → Rules Apply → AI Categorize (remaining) → AI Draft JE → Batch Approve
Phase 3:    Import → Rules + AI → Draft JEs → Insights Generated → Monthly Close Package
```

---

## Review Concerns (Pre-flagged)

- **Financial integrity:** AI-drafted JEs must pass double-entry validation before storing even as DRAFT. SUM(debits) === SUM(credits) enforced at service level.
- **Tenant isolation:** All AI actions scoped to entity → tenant. Provider calls must never leak tenant data.
- **Security:** AI provider API keys stored in env vars (already pattern). Provider responses validated before storing. No raw LLM output in financial fields.
- **Audit trail:** Every AI action stored with `sourceType: AI_ACTION` and full `sourceDocument` snapshot. Reversible — voiding an AI-approved JE uses existing void flow.
- **Multi-currency:** JE drafts must handle 4-field money pattern. AI must NOT do FX conversion — use existing exchange rate service.

---

## Alternatives Considered

- **Chat-only AI (current state):** Too passive. Users still do all the work. Doesn't differentiate from ChatGPT + spreadsheet.
- **Full autonomy (auto-execute everything):** Too risky for financial data. Users need trust before handing over control. Can be opt-in later.
- **Single provider (Claude only):** More expensive for high-volume categorization. Multi-provider lets us optimize cost vs capability.

---

## Open Questions

- [ ] Background job infrastructure — need BullMQ or similar for scheduled insight generation (ARCH-4 in TASKS.md)
- [ ] SSE/WebSocket for real-time Action Feed, or polling?
- [ ] AI cost model — how to price AI features (included in plan? usage-based? freemium tier?)
- [ ] Provider fallback — what happens when Claude API is down? Queue actions? Use fallback?
- [ ] Rate limiting on AI calls — per-tenant caps to prevent abuse?

---

## Implementation Priority

| # | Phase | Key Deliverable | Effort Est. | Deps |
|---|-------|----------------|-------------|------|
| 1a | Auto-Bookkeeper: Categorization | Enhanced categorization + confidence UI + batch review | 2-3 days | None |
| 1b | Auto-Bookkeeper: JE Drafting | AI generates draft JEs from categorized transactions | 2-3 days | 1a |
| 1c | Action Feed | AIAction model + feed API + feed UI + dashboard widget | 3-4 days | 1a |
| 1d | Auto-Bookkeeper: Batch Approve | Batch approve workflow wired to JE creation | 1-2 days | 1b, 1c |
| 2a | Rules Engine: CRUD | Rules service + API + management UI | 2-3 days | 1c |
| 2b | Rules Engine: Execution | Rule evaluation on new transactions | 1-2 days | 2a |
| 2c | Rules Engine: AI Suggestions | Pattern detection + rule suggestion flow | 2-3 days | 2a, 2b |
| 3a | Advisor: Insight Generation | Cash flow, spending, anomaly analyzers | 3-4 days | 1c |
| 3b | Advisor: Proactive Alerts | Daily/event-triggered insight creation | 2-3 days | 3a |
| 3c | Advisor: Monthly Close | Close readiness score + checklist + one-click close | 3-4 days | 1d, 3a |

**Total estimate:** ~25-35 days of focused work across all phases.

---

## Next Steps

- [ ] Create implementation plan: `/processes:plan ai-auto-bookkeeper` (Phase 1 first)
- [ ] Reserve task IDs for Phase 1 tasks
- [ ] Set up Claude provider in abstraction layer
- [ ] Design Action Feed Figma mockup

---

_Brainstorm captured: 2026-02-24. Informed by Basis $1.15B competitive analysis._
