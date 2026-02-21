# PRD: Akount Insights — AI-Powered Financial Intelligence

**Created:** 2026-02-20
**Status:** Brainstorm / Vision Document
**Inspiration:** AltSpace OS design language (separate product — AI operating system for solopreneurs)
**Domain:** `/insights` (Phase 7 — AI Advisor, evolved)

---

## Context: Two Products, One Ecosystem

**AltSpace** is a separate company — an AI operating system where solopreneurs command fleets of AI agents across their entire business (code, design, content, marketing, operations). Think of it as macOS for the AI-native solopreneur.

**Akount** is a standalone financial intelligence app. It does one thing deeply: help solopreneurs understand and manage their money. Akount works independently — no AltSpace required.

**The integration story:** Akount will eventually be one of the apps that plugs into AltSpace, just like Figma, Slack, or Linear would. AltSpace's agent fleet could include an "Akount Agent" that surfaces financial insights, processes approvals, and answers money questions — all within the AltSpace command center. But Akount must be excellent on its own first.

**What this PRD covers:** The optimal standalone UI for Akount's `/insights` domain, *inspired by* AltSpace's UX patterns but designed for a focused financial context, not a general-purpose OS.

---

## Executive Summary

Akount Phases 1-5 built the **data layer** — transactions, GL, invoices, bills, reports. Phase 6 hardens it for launch. But the data is inert. Users have to pull insights out of tables manually.

Phase 7 adds the **intelligence layer** — AI that watches your financial data continuously and tells you what matters, what's wrong, and what to do about it. The user's relationship with Akount shifts from "I go look at my numbers" to "My numbers come talk to me."

The AltSpace prototype demonstrates key UX patterns for this shift: proactive intelligence, human-in-the-loop decisions, natural language queries, and a "living system" feel. This PRD adapts those patterns for a focused financial product.

---

## The Problem

Today's solopreneur financial workflow:

1. **Reactive, not proactive** — You see your P&L only when you go look at it. No one taps you on the shoulder to say "your SaaS spend increased 23% this month."
2. **Numbers without narrative** — Akount shows $14,200 in expenses. But is that good? Bad? Normal for February? The numbers don't talk.
3. **Manual pattern detection** — Recurring charges, seasonal trends, client payment habits — humans have to spot these in tables of data.
4. **Scattered intelligence** — Cash flow forecast is one page, spending breakdown is another, anomalies are nowhere. There's no unified "here's what you need to know."
5. **No learning loop** — The system doesn't get smarter over time. Day 1 and Day 365 give you the same dumb tables.

---

## Design Inspiration: What AltSpace's Patterns Teach Us

AltSpace is designed as a general-purpose AI operating system. Six of its UX patterns are directly transferable to a focused financial context — but they need to be **narrowed and deepened** for money:

| AltSpace Pattern | AltSpace Context (general OS) | Akount Adaptation (financial focus) |
|-----------------|-------------------------------|-------------------------------------|
| Agent Fleet (4 agents) | Claude Code, Gemini, ChatGPT, Perplexity doing code/design/content/research | Financial Insight Agents: Categorizer, Anomaly Detector, Forecaster, Advisor |
| Approval Queue | "Claude wants to run a migration" — generic agent permissions | Financial Decision Queue: categorization reviews, anomaly confirmations, overdue invoice actions |
| Command Palette | Universal `Cmd+K` for navigation + agent commands across all tools | Financial Query Bar: natural language questions about your money, scoped to financial data |
| Status Bar | Generic metrics (agents running, tasks, commits) | Financial Health Metrics: net worth, cash runway, pending approvals, overdue items |
| Activity Feed | Cross-tool agent activity (commits, designs, drafts) | Financial Event Timeline: categorizations, payments received, anomalies detected, forecasts updated |
| Workspace Cards | Code Studio, Design Lab, Content Desk, Growth Engine | Financial Lenses: Cash Mode, AR/AP Mode, Tax Mode, Growth Mode |

**The key difference:** AltSpace is horizontal (breadth across all business functions). Akount Insights is vertical (depth in financial intelligence). AltSpace shows you "Claude committed code." Akount tells you "your cash runway dropped to 3.8 months because Acme Corp hasn't paid Invoice #1042."

---

## Feature Design

### 1. Morning Brief (The Signature Element)

**What:** An AI-generated narrative that synthesizes your financial state into a paragraph a human CFO would write. Generated daily at 6 AM in the user's timezone.

**Why this matters:** No accounting app does this. QuickBooks shows you a dashboard of widgets. Xero shows charts. Nobody writes you a **letter about your money.** This is the single most differentiated feature.

**UX:**
- Top of the `/insights` page and optionally surfaced on the Dashboard
- Glass card with subtle amber gradient border (signals: AI-generated, important)
- Body text in Newsreader italic — the serif font signals "interpreted, not raw data"
- Key metrics inline as mono-formatted numbers
- "Read more" expands to section-by-section breakdown (Cash, AR/AP, Spending, Forecast)
- Dismissible — once read, it collapses to a one-line summary until tomorrow

**Example:**

> *Good morning, Sunny. Here's your financial snapshot for Thursday, Feb 20.*
>
> *Net worth: $142,800 (+2.3% this week). Cash position: $34,200 with 4.2 months runway. Three items need your attention: Acme Corp's $8,500 invoice is 15 days overdue, your Adobe subscription jumped from $59 to $299 (Creative Cloud upgrade?), and 12 new transactions from yesterday are auto-categorized (3 need review).*

**Sections on expand:**
- **Cash Position** — balances, runway, upcoming large payments
- **Receivables** — overdue invoices, expected payments this week
- **Spending Trends** — vs last month, vs 3-month average, anomalies
- **Forecast** — 30-day cash projection, key assumptions

### 2. Decision Queue (Human-in-the-Loop)

**What:** A prioritized list of decisions the AI needs your input on. Inspired by AltSpace's approval system but scoped to financial actions.

**Why this matters:** This is what turns Akount from passive to proactive. Instead of the user going hunting for problems, problems come to the user — pre-analyzed, with recommended actions and one-tap resolution.

**Decision Types:**

| Type | Example | Actions |
|------|---------|---------|
| Categorization Review | "3 transactions need manual category assignment (low AI confidence)" | Approve suggested / Reassign / Skip |
| Anomaly Alert | "Adobe charge increased 407% ($59 → $299). Expected?" | Confirm (expected) / Flag (investigate) / Dismiss |
| Overdue Action | "Invoice #1042 is 15 days overdue ($8,500). Send reminder?" | Send reminder / Snooze 7 days / Mark as disputed |
| Forecast Warning | "Cash runway dropped below 4 months. Set budget alert?" | Create alert / Adjust forecast / Dismiss |
| Reconciliation | "5 bank transactions don't match any recorded entries" | Review matches / Auto-reconcile / Skip |

**UX:**
- Card-based queue, sorted by priority (critical at top)
- Each card shows: AI agent that flagged it, confidence level, time ago, context snippet
- Primary action button (green "Approve" / "Confirm"), secondary options (gray "Dismiss" / "Review")
- Badge count on sidebar nav item: `Insights (3)` — clear when resolved
- Empty state: "All clear — your AI agents have nothing that needs your attention"

### 3. Financial Query Bar

**What:** Natural language interface to your financial data. Ask questions, get structured answers — not chat bubbles, but rendered data cards.

**AltSpace inspiration:** The `Cmd+K` command palette. But where AltSpace's palette navigates between tools and agents, Akount's is focused entirely on financial queries.

**Why it's not a chatbot:** Chatbots are slow, imprecise, and feel like talking to a customer service bot. The query bar is a **search engine for your money** — you type a question, you get a data card with numbers, charts, and breakdowns. Instant. Precise. Structured.

**Example Queries:**

| Query | Result Card |
|-------|-------------|
| "SaaS spend this year" | Pie chart + vendor breakdown + trend vs last year |
| "Cash runway" | Single metric card: "4.2 months at current burn rate" + sparkline |
| "Overdue invoices" | Table: client, amount, days overdue, last contact |
| "Compare Q4 to Q3 expenses" | Side-by-side comparison with category-level diff |
| "Biggest expense categories" | Ranked bar chart + % of total |
| "How much does Acme Corp owe me?" | AR summary for one client + payment history |

**UX:**
- Accessible via `Cmd+K` (or click on search bar in topbar)
- Overlay modal (like AltSpace's command palette)
- Recent queries shown as suggestions
- Results render inline as cards (chart, table, or metric depending on query type)
- "Pin to dashboard" option — turns a query into a persistent widget

### 4. Insight Agents (Background Intelligence)

**What:** Specialized background processes that continuously analyze financial data and surface findings. Inspired by AltSpace's agent fleet, but these are internal processes — not external AI tools.

**Important distinction from AltSpace:** In AltSpace, agents are real external AI services (Claude, Gemini, etc.) doing diverse work. In Akount, agents are **internal analytical processes** — they could use LLMs under the hood, but to the user they're just "Akount's brain" watching different aspects of their finances.

| Agent | What It Watches | Output |
|-------|----------------|--------|
| **Categorizer** | New/uncategorized transactions | Auto-categorizations (high confidence) + review queue (low confidence) |
| **Sentinel** | All transactions + historical patterns | Anomaly alerts (duplicates, sudden increases, unusual vendors) |
| **Forecaster** | Cash flow + recurring patterns + AR/AP | 30/60/90 day cash projection, updated weekly |
| **Advisor** | Everything above + reports | Morning brief, cost-saving recommendations, tax hints |

**UX:**
- Status cards on `/insights` page showing each agent's state
- Minimal but alive: pulsing green dot = processing, gray = idle, amber = needs review
- Tappable to see agent's recent findings and history
- Not prominently featured — the agents are infrastructure, not the star. The Brief and Decision Queue are the user-facing outputs.

### 5. Financial Activity Timeline

**What:** Chronological feed of everything that happened with your money. Replaces checking 5 different pages.

**AltSpace parallel:** The live activity feed showing agent actions. Akount narrows this to financial events only.

**Event Types:**
- Transactions categorized (with category and confidence)
- Payments received / invoices paid
- Anomalies detected
- Forecasts updated
- Briefs generated
- User actions (approved, dismissed, queried)

**UX:**
- Scrollable feed on right side of `/insights` page
- Color-coded dots by event type (green=income, red=alert, blue=info, purple=AI action)
- Timestamps in JetBrains Mono
- Filter by event type
- "Today" / "This Week" / "This Month" time segments

### 6. Financial Lenses (Workspace Modes)

**What:** Pre-configured views that reorganize the Insights page for a specific financial mode.

**AltSpace parallel:** Workspace cards (Code Studio, Design Lab, etc.). But where AltSpace's workspaces switch between entirely different tool contexts, Akount's lenses are **filter + layout presets** over the same financial data.

| Lens | Keyboard | Focus | Key Metrics |
|------|----------|-------|-------------|
| **Cash** | `Cmd+1` | Liquidity, burn rate, runway | Cash position, 30-day inflows/outflows, runway months |
| **AR/AP** | `Cmd+2` | Money owed to/by you | Outstanding invoices, overdue bills, aging buckets, DSO |
| **Tax** | `Cmd+3` | Tax liability and deductions | Deductible expenses YTD, estimated quarterly payment, sales tax collected |
| **Growth** | `Cmd+4` | Revenue trends, margins | MRR/ARR, profit margin trend, client concentration, revenue per client |

**UX:**
- 4 cards at bottom of `/insights` page (glass, with lens-colored accent)
- Click or keyboard shortcut reconfigures: Brief shows lens-specific narrative, metrics change, timeline filters
- Active lens shown as pill in topbar: `Insights > Cash Mode`

---

## UI Architecture

### Page Layout

```
+------------------+----------------------------------------------+
|                  |  Topbar: Breadcrumb + Query Bar + Alerts     |
|   Sidebar        +----------------------------------------------+
|   (existing)     |                                              |
|                  |  Morning Brief (Newsreader italic, collapsible)|
|   Insights       |                                              |
|   > Dashboard    +---------------------+------------------------+
|   > Decisions    |                     |                        |
|   > Queries      | Financial Health    | Decision Queue         |
|   > Forecast     | Status Bar (6 KPIs) | (3 pending items)      |
|                  |                     |                        |
|                  +---------------------+------------------------+
|                  |                     |                        |
|                  | Agent Status        | Activity Timeline      |
|                  | (4 mini-cards)      | (chronological feed)   |
|                  |                     |                        |
|                  +---------------------+------------------------+
|                  |                                              |
|                  |  Financial Lenses (4 workspace cards)         |
|                  |  Cash | AR/AP | Tax | Growth                 |
+------------------+----------------------------------------------+
```

### Design Language

Akount's existing "Financial Clarity" system, not AltSpace's "Dark Monotone Zen":

| Element | Akount Token | Notes |
|---------|-------------|-------|
| Surfaces | `bg-0` through `bg-4` | Existing purple-tinted dark hierarchy |
| Glass | `glass`, `glass-2`, `glass-3` | Existing glass utilities |
| Primary | Amber (`primary`, `ak-pri-dim`) | Financial warmth — existing |
| Income | `ak-green` / `ak-green-dim` | Semantic — existing |
| Alerts | `ak-red` / `ak-red-dim` | Semantic — existing |
| Info/Forecast | `ak-blue` / `ak-blue-dim` | Semantic — existing |
| AI-generated | `ak-purple` / `ak-purple-dim` | Signals "AI interpreted this" |
| Headings | Newsreader (serif) | Financial elegance — existing |
| Body | Manrope (sans) | Clean readability — existing |
| Numbers | JetBrains Mono | Tabular precision — existing |
| Brief text | Newsreader italic | Signature: "interpreted, not raw" |
| Borders | `border-ak-border` tiers | Existing glass border system |

**No new design tokens needed.** The existing Financial Clarity system handles everything. The "AI purple" semantic is the only new conceptual mapping.

### AltSpace Integration Surface (Future)

When AltSpace integration is built, Akount exposes:

| Surface | What AltSpace Gets |
|---------|-------------------|
| **Agent Status API** | Agent health, current task, last finding — displayed in AltSpace's fleet view |
| **Decision Queue API** | Pending approvals — surfaced in AltSpace's approval stream alongside other app decisions |
| **Brief API** | Morning brief content — rendered in AltSpace's daily digest alongside briefs from other apps |
| **Query API** | NL query endpoint — AltSpace's `Cmd+K` can route financial questions to Akount's query engine |
| **Event Stream** | Financial events — merged into AltSpace's activity feed |
| **Webhook Receiver** | AltSpace commands → Akount actions (e.g., "approve this categorization" from AltSpace UI) |

This is a **read-mostly API surface**. AltSpace reads Akount's intelligence outputs and renders them in its own UI. The heavy lifting (analysis, categorization, forecasting) stays inside Akount.

**Protocol candidates:** REST for CRUD, SSE or WebSocket for real-time events, OAuth 2.0 for auth.

---

## Data Architecture

### What Already Exists (Phases 1-5)

| Data Source | What It Provides | Status |
|-------------|-----------------|--------|
| Transactions | Raw financial events | Built |
| Categories + AI categorization | Spending classification | Built |
| Journal Entries + GL | Double-entry accounting data | Built |
| Invoices + Bills | AR/AP with status tracking | Built |
| Reports (P&L, Balance Sheet, Cash Flow) | Aggregated financial statements | Built |
| FX rates | Multi-currency support | Built |
| Clients + Vendors | Counterparty data | Built |
| Import batches | Statement import history | Built |

### New Data Models

```prisma
model InsightBrief {
  id          String   @id @default(cuid())
  entityId    String
  entity      Entity   @relation(fields: [entityId], references: [id])
  date        DateTime @db.Date
  type        InsightBriefType  // DAILY, WEEKLY, MONTHLY
  sections    Json     // { cash: "...", arAp: "...", spending: "...", forecast: "..." }
  metrics     Json     // { netWorth: 14280000, cashRunway: 4.2, ... } (integer cents)
  generatedAt DateTime @default(now())
  model       String?  // AI model used
  tokenCount  Int?     // Cost tracking
  createdAt   DateTime @default(now())

  @@unique([entityId, date, type])
  @@index([entityId, date])
}

model InsightDecision {
  id           String   @id @default(cuid())
  entityId     String
  entity       Entity   @relation(fields: [entityId], references: [id])
  type         InsightDecisionType  // CATEGORIZATION, ANOMALY, OVERDUE_ACTION, FORECAST_WARNING, RECONCILIATION
  status       InsightDecisionStatus  // PENDING, APPROVED, DISMISSED, EXPIRED, SNOOZED
  priority     Int      @default(0)  // 0=low, 1=medium, 2=high, 3=critical
  title        String
  description  String
  payload      Json     // Type-specific data (transaction IDs, amounts, etc.)
  aiConfidence Float?   // 0.0-1.0
  agentSource  String   // Which agent created this
  resolvedAt   DateTime?
  resolvedBy   String?  // userId
  resolution   Json?    // What was decided + why
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([entityId, status])
  @@index([entityId, createdAt])
}

model InsightEvent {
  id        String   @id @default(cuid())
  entityId  String
  entity    Entity   @relation(fields: [entityId], references: [id])
  type      InsightEventType  // CATEGORIZED, ANOMALY_DETECTED, FORECAST_UPDATED, BRIEF_GENERATED, PAYMENT_RECEIVED, DECISION_RESOLVED, QUERY_EXECUTED
  source    String   // agent name or "user" or "system"
  title     String
  payload   Json     // Event-specific details
  createdAt DateTime @default(now())

  @@index([entityId, createdAt])
  @@index([entityId, type])
}

model FinancialQuery {
  id             String   @id @default(cuid())
  entityId       String
  entity         Entity   @relation(fields: [entityId], references: [id])
  userId         String
  naturalQuery   String   // "How much did I spend on SaaS?"
  parsedIntent   Json     // { type: "spending_breakdown", filters: { category: "SaaS" }, period: "YTD" }
  result         Json?    // Cached result
  resultType     String?  // "chart", "table", "metric", "comparison"
  latencyMs      Int?
  pinned         Boolean  @default(false)
  createdAt      DateTime @default(now())

  @@index([entityId, userId, createdAt])
}
```

### Agent Architecture

Agents are **background jobs** within Akount's API server, not separate services:

| Agent | Trigger | Frequency | Engine |
|-------|---------|-----------|--------|
| Categorizer | Transaction import event | On-event + nightly catchup | Perplexity API (existing) + rules fallback |
| Sentinel | Post-categorization | Nightly (2 AM) | SQL rules engine (duplicates, spikes, unusual amounts) + LLM for edge cases |
| Forecaster | Weekly + significant event | Weekly (Monday AM) + event-triggered | Exponential smoothing + AR/AP schedule → LLM narrative wrapper |
| Advisor | Daily | Daily (6 AM user TZ) | Aggregates all agent outputs → LLM narrative generation |

**Cost discipline:** Rules first, AI second. The Sentinel does 90% of its work with SQL queries (`WHERE amount > 2x avg for vendor`). The Forecaster uses statistical projection. LLMs are only for narrative generation and edge-case analysis. Estimated: **~$1.80/user/month**.

---

## Competitive Position

| Capability | QuickBooks | Xero | FreshBooks | Wave | **Akount** |
|-----------|-----------|------|------------|------|-----------|
| AI-narrated daily brief | No | No | No | No | **Yes** |
| Decision queue (human-in-loop) | No | No | No | No | **Yes** |
| Natural language financial queries | No | No | No | No | **Yes** |
| Automated anomaly detection | No | No | No | No | **Yes** |
| Cash flow forecasting | No | Short-term | No | No | **30/60/90 day** |
| Learning from corrections | No | No | No | No | **Yes** |
| Proactive in-app alerts | Email only | Email only | No | No | **In-app queue** |
| AltSpace integration | No | No | No | No | **API-ready** |

**Akount's positioning:** The only accounting app built for the AI era. The others digitized paper ledgers. Akount gives you a financial co-pilot.

**AltSpace amplifier:** When AltSpace launches, Akount becomes the financial brain in the solopreneur's AI operating system. Akount's agents report to AltSpace's command center. No competitor can match this because none have an integration surface designed for agent orchestration.

---

## UX Flow: A Day in the Life

### Morning (6:00 AM — Brief Generated)

User opens Akount. Instead of a grid of zeros and charts, they see:

> *Good morning, Sunny. Here's your financial snapshot for Thursday, Feb 20.*
>
> *Net worth: $142,800 (+2.3% this week). Cash position: $34,200 with 4.2 months runway. Three items need your attention: Acme Corp's $8,500 invoice is 15 days overdue, your Adobe subscription jumped from $59 to $299 (Creative Cloud upgrade?), and 12 new transactions from yesterday are auto-categorized (3 need review).*

### Mid-Morning (10:00 AM — Decisions)

Notification badge shows `Insights (3)`:

1. **Review Categorizations** — 3 low-confidence items. One-tap approve or reassign.
2. **Adobe Anomaly** — "This charge increased 407%. Expected?" → Confirm / Flag
3. **Overdue Invoice** — "Draft a payment reminder to Acme Corp?" → Approve / Snooze

### Afternoon (2:00 PM — Quick Query)

`Cmd+K` → "How much did I spend on contractors last quarter?"

Inline result card:

```
Contractor Spending — Q4 2025
Total: $18,750 (5 vendors)
├── TechFreelancer.io  $8,200  (43.7%)
├── DesignStudio LLC   $4,500  (24.0%)
├── ContentWriter Pro  $3,200  (17.1%)
├── MarketingGuru      $1,850   (9.9%)
└── Other              $1,000   (5.3%)
Trend: +12% vs Q3 ($16,720)
```

No page navigation. Just answer.

### Evening (AltSpace integration — future)

The solopreneur is in AltSpace, managing their whole business. In the AltSpace activity feed they see:

- **Akount Agent:** "Invoice #1043 paid by ClientB ($3,200) — auto-posted to GL"
- **Akount Agent:** "Cash runway updated: 4.2 months"

They `Cmd+K` in AltSpace: "What's my cash position?" → AltSpace routes to Akount's query API → same result card, rendered in AltSpace's UI.

Akount never lost its standalone value. AltSpace just gave it a bigger stage.

---

## Prioritization

### P0 — Insights MVP (Phase 7a)

| Feature | Effort | Value |
|---------|--------|-------|
| Morning Brief generation + UI | Medium | Highest — signature differentiator |
| Decision Queue (categorization reviews + anomaly confirmations) | Medium | Highest — proactive financial management |
| Activity Timeline | Small | High — unified view, low complexity |
| Agent status display (4 cards) | Small | Medium — "alive" feel, mostly presentational |

### P1 — Intelligence Depth (Phase 7b)

| Feature | Effort | Value |
|---------|--------|-------|
| Financial Query Bar (`Cmd+K`) | Large | High — powerful but complex (NLP parsing) |
| Cash Flow Forecast (30/60/90) | Medium | High — unique capability |
| Anomaly Detection engine | Medium | High — feeds decision queue |
| Financial Lenses (4 modes) | Small | Medium — layout presets, mostly frontend |

### P2 — Ecosystem

| Feature | Effort | Value |
|---------|--------|-------|
| AltSpace integration API surface | Medium | Strategic — ecosystem play |
| Learning loop (correction tracking) | Medium | Long-term accuracy improvement |
| Tax optimization hints | Medium | Seasonal value (Q1, Q3) |
| Scenario modeling ("what if") | Large | Premium feature, high perceived value |
| Natural language alerts | Medium | Convenience, low urgency |

---

## Open Questions

1. **MVP scope:** Is Morning Brief + Decision Queue + Timeline enough for Phase 7a, with Query Bar as P1?
2. **AI provider mix:** Claude Haiku for briefs? Perplexity for categorization (already integrated)? OpenAI for queries?
3. **Real-time vs batch:** Agents on schedules (cheaper) or event-triggered (fresher)?
4. **Page structure:** Single `/insights` page with all features, or sub-routes (`/insights/decisions`, `/insights/forecast`)?
5. **AltSpace timeline:** When does the integration API need to be ready? Does it influence Akount's API design now?
6. **Brief on Dashboard vs Insights:** Should the Morning Brief also appear on the main Dashboard, or is it Insights-exclusive?

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Brief engagement | 70%+ DAU read the brief | View tracking |
| Decision resolution rate | 80%+ within 24h | Status tracking |
| Query bar usage | 3+ queries/user/week (P1) | Query log |
| Time-to-insight | <5 seconds question-to-answer (P1) | Latency tracking |
| AI categorization acceptance | 85%+ auto-approved | Correction ratio |
| User retention (30-day) | +15% for Insights users vs non | Cohort analysis |
| AltSpace integration adoption | — | Future metric |

---

*Akount stands alone as a financial co-pilot. AltSpace makes it part of something bigger. Build the standalone product first — the integration surface is architectural foresight, not a dependency.*
