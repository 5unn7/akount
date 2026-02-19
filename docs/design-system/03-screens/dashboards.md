# Dashboard Specifications

> **Consolidates:** `dashboard-founder.md` + `dashboard-accountant.md` + `dashboard-individual.md`
>
> **Last Updated:** 2026-02-04

## Overview

The Dashboard is not just another page. It is the **home base** of Akount—the place that answers, in under 10 seconds:

> "Am I financially okay?"

However, the answer depends entirely on who's asking. Different user types need fundamentally different dashboards serving different purposes.

### Shared Principles

- Entity-aware display (show which entity/entities are in scope)
- Real-time data updates
- AI insights and anomaly detection
- Mobile-responsive layouts
- Read-only by default (observation, not manipulation)
- Uses shared components from design system

---

## 1. Founder Dashboard

### Target User

Business owner, entrepreneur, operator, freelancer, founder running a global business

### Core Purpose

Answers: **"Am I financially okay — globally?"**

Provides **situational awareness** through role-appropriate KPIs and insights.

### Mental Model

The dashboard answers 5 subconscious questions:

1. How much money do I have?
2. Where is it (accounts, countries, entities)?
3. What changed recently?
4. Is anything wrong or risky?
5. What should I look at next?

### Emotional Outcome

> "I understand my financial position — globally — in seconds."

Not: "Where do I start?"

### Layout Structure

```
────────────────────────────────
Top Context (Entity • Time • FX)
────────────────────────────────
Primary Financial Snapshot (Hero)
────────────────────────────────
Accounts & Balances
────────────────────────────────
Cash Flow & Trends
────────────────────────────────
AI Insights & Attention
────────────────────────────────
```

**Key:** Vertical rhythm > dense grids.

### Components

#### 1. Top Context Strip

Display explicit context to prevent misinterpretation:

```
Viewing: 🇨🇦 Corp + 🇺🇸 LLC • Jan 2026 • Converted to USD
```

Controls (already designed):

- Entity scope
- Time range
- Currency mode

#### 2. Primary Financial Snapshot (The Hero)

This is the **emotional anchor**.

| Metric            | Why              |
| ----------------- | ---------------- |
| Total Cash        | Liquidity        |
| Net Worth         | Long-term health |
| Income (period)   | Momentum         |
| Expenses (period) | Burn             |

**Design Rules:**

- Large numbers
- Monospace amounts
- Finance semantic colors
- Small variance indicator vs previous period

Example:

```
Net Worth
$182,400
↑ 6.2% vs last month
```

**Key:** No charts here. Just truth.

#### 3. Accounts Overview

Grouped by:

- Entity
- Country
- Currency

**Account Card Anatomy:**

```
RBC Business Chequing
🇨🇦 Canadian Corp
Balance: $42,300 CAD
Last synced: 2 min ago
[View Transactions]
```

**UX Rules:**

- Always show currency
- Show sync health (freshness)
- Transfers link from here
- Builds confidence in data freshness

#### 4. Cash Flow Snapshot

One compact visualization showing:

- Inflow vs outflow
- Period-based comparison
- Minimal labels

Purpose: *"Is money coming in faster than it's going out?"*

Click → Analytics page for deeper dive.

#### 5. AI Insights & Attention (Critical Section)

This is where Akount feels alive.

**Prioritized Cards (Max 3–4):**

Types:

- ⚠ Needs attention
- 💡 Optimization
- 📊 Observation

Example:
> "Your US LLC burn rate increased 18% this quarter."

Each card:

- Shows entity
- Shows impact
- Has 1 clear CTA

**Key:** No scrolling wall of insights.

#### 6. Action Shortcuts (Subtle, Not Loud)

Contextual actions placed **after insights**, not at top:

- Add transaction
- Review uncategorized
- Reconcile accounts
- View reports

Why: We want users to **see reality** before acting.

---

## 2. Accountant Dashboard

### Target User

Professional accountant, bookkeeper, tax preparer, audit specialist

### Core Purpose

Answers: **"Are the books clean? What needs my attention?"**

Provides **assurance** through verification-focused KPIs and controls.

### Mental Model

> "Pre-audit checklist meets financial cockpit."

**Not:** Analytics dashboard.

### Core Job

The accountant dashboard must answer:

1. Are the books **complete**?
2. Are they **accurate**?
3. Are they **reconciled**?
4. Are there **risks or blockers**?
5. What must be done **before filing**?

**Key:** This is about **readiness**, not insight.

### Emotional Outcome

> "This is clean. I can rely on this."

Not: "I need to export this to Excel to be sure."

### Layout Structure

```
────────────────────────────────
Context & Scope (Dense, Professional)
────────────────────────────────
Financial Integrity Status
────────────────────────────────
Reconciliation & Exceptions
────────────────────────────────
Posting & Locking Status
────────────────────────────────
Open Tasks & Collaboration
────────────────────────────────
```

**Key:** No charts unless they prove correctness.

### Components

#### 1. Context & Scope (Non-Negotiable)

Pinned at top, always visible:

```
Workspace: Akount
Entities: 🇨🇦 Canadian Corp, 🇺🇸 US LLC
Period: FY 2025 (Jan–Dec)
Accounting Basis: Accrual
Standards: GAAP / IFRS
```

Prevents misinterpretation — critical for professionals.

#### 2. Financial Integrity Status (Hero Section)

Replaces "Net Worth" from founder dashboard.

**Integrity Cards (Binary, Clear):**

| Check                        | Status |
| ---------------------------- | ------ |
| All transactions categorized | ✓ / ⚠  |
| Debits = Credits             | ✓      |
| No orphan entries            | ✓      |
| FX differences resolved      | ⚠      |
| Intercompany balanced        | ✓      |

**Design Rules:**

- No percentages
- No fluff
- Green = safe, Amber = needs work

This tells an accountant if they can trust the data.

#### 3. Reconciliation & Exceptions

**Reconciliation Summary:**

```
Reconciliation Status
────────────────────
RBC CAD     ✓ Reconciled (Jan)
Chase USD  ⚠ 12 unmatched
Wise EUR   ✓ Reconciled
```

Clicking takes directly to **reconciliation mode**, not transactions.

**Exceptions List (High Signal):**

- Duplicate transactions detected
- Bank fee without category
- Large uncategorized amount
- Cross-entity posting flagged

This is where accountants spend time.

#### 4. Posting & Locking Status

Accountants care deeply about *when* things are final.

**Period Status Grid:**

| Period   | Status        | Action |
| -------- | ------------- | ------ |
| Jan 2025 | Locked        | —      |
| Feb 2025 | Ready to lock | Review |
| Mar 2025 | Open          | —      |

**Rules:**

- Clear lock indicators
- Explicit "ready" vs "locked"
- No accidental locking

#### 5. AI Confidence Signals (Accountant-Friendly)

AI appears **only as validation**, never authority.

Examples:

- "AI confidence: High (98%) on categorization"
- "3 transactions flagged for review by AI"

**No "optimization" language.** This builds professional trust.

#### 6. Open Tasks & Collaboration

Accountants need a task queue, not reminders.

**Task Types:**

- Review journal entry
- Clarify expense
- Approve reconciliation
- Prepare report

Each task shows:

- Entity
- Period
- Requester (Founder / AI)

This replaces email threads.

### Drill-Down Rules (Very Important)

From this dashboard, click **only** to fix problems:

- Never to explore trends
- Never to "browse"

Everything is action-oriented.

---

## 3. Individual Dashboard (Student/Freelancer)

### Target User

Freelancer, solopreneur, side-hustle operator, student, individual managing personal finances

### Core Purpose

Answers: **"Do I have enough? What can I spend?"**

Provides **security** through awareness and micro-habits.

### Mental Model

> "Dashboard = awareness surface"
> "Widgets = gentle helpers"

No widget should:

- Block anything
- Demand action
- Introduce a workflow

Each widget answers *one small question*.

### Emotional Outcome

> "I'm in control of my finances. No surprises."

### Layout Structure

Widget-based, modular:

```
────────────────────────────────
Header (Month, Balance, Mood)
────────────────────────────────
Primary Widgets (2-column)
────────────────────────────────
Secondary Widgets (1-column)
────────────────────────────────
Optional / Hidden Widgets
────────────────────────────────
```

Widgets are:

- reorderable
- removable
- collapsible

### Core Widgets (Always On)

#### 1. Balance Snapshot

> "How much money do I have?"

- Total balance
- Change since last month
- No account breakdown (tap to expand)

#### 2. This Month's Spending

> "Am I spending more or less?"

- Simple bar comparison
- Compared to last month
- No categories by default

#### 3. Budget Progress

> "Am I okay this month?"

- Top 3 categories only
- Progress bars
- Remaining amount highlighted

#### 4. Today's Small Step (Micro-Habits)

```
🌱 Today's Small Step
────────────────────
Check yesterday's spending

You spent ₹430 yesterday.
Looks normal 👍

[ Mark done ]
```

**Rules:**

- One habit only
- Disappears once done
- Reappears next day (new habit)
- If hidden, habits fully disabled

#### 5. Staying Aware (Streaks Widget)

```
✨ Staying Aware
───────────────
You've checked your money
5 days in a row 🌱
```

**Rules:**

- No numbers > 14 days
- No "broken" state
- Hidden if streak = 0 and user opted out
- **Never shames**

#### 6. Your Goals

```
🎯 Your Goals
────────────
💻 New Laptop
₹35,000 / ₹80,000
█████░░░░░░ 44%
```

**Rules:**

- Max 2 goals shown
- Most recent or nearest deadline
- Tap → full goals page

#### 7. Quick Tip (Education)

```
💡 Quick Tip
───────────
Small daily expenses often
matter more than big ones.

[ Got it ]
```

**Rules:**

- Appears 2–3x per week max
- Contextual
- Dismissible forever
- No "Learn more" rabbit holes

### Optional Widgets (Off By Default)

These are **opt-in:**

- 📅 Upcoming Bills
- 🔁 Subscriptions
- 🧾 Recent Transactions
- 🧠 AI Tips (Consumer tone only)

### Widget Settings UX

Accessible via: "Customize Dashboard"

Controls:

- Toggle widgets on/off
- Reorder via drag
- Reset to default

Language: > "Choose what helps you stay aware."

### Role-Based Safety

| Widget       | Individual | Founder      | Accountant |
| ------------ | ---------- | ------------ | ---------- |
| Micro-habits | ✅         | ❌            | ❌          |
| Streaks      | ✅         | ❌            | ❌          |
| Education    | ✅         | ❌            | ❌          |
| Budgets      | ✅         | ✅ (advanced) | ❌          |
| Goals        | ✅         | ✅            | ❌          |

Accountants **never see** behavior widgets.

### Graduation Path (Subtle)

As users mature:

- Widgets shrink
- Advanced widgets appear (cash flow, categories)
- Micro-habits fade naturally

No forced switch.

---

## Shared Components

All dashboards use reusable components:

### KPI Card Component

```
[Label]
[Large Number] [Color based on metric]
[Small comparison vs previous period]
```

Used in: All three dashboards

### Account Card Component

```
[Institution Name]
[Entity Badge] [Currency]
[Balance: Amount] [Sync Status]
[Action Link]
```

Used in: Founder dashboard

### Entity/Time/Currency Strip

Shared context controls at top of all dashboards.

Filters the entire dashboard.

### AI Insight Cards

```
[Icon] [Type: Warning/Suggestion/Info]
[Title]
[Description with entity + amount]
[One CTA]
[Dismiss]
```

Used in: Founder & Accountant dashboards

### Status Badge

Visual indicators:

- ✓ Complete / Reconciled
- ⚠ Needs attention
- ⏳ In progress

Used in: All three dashboards

---

## Data Loading Priority

1. **KPI cards** (critical path)
2. **Context strip** (above fold)
3. **Primary snapshot** (hero section)
4. **Accounts/Status tables** (structural)
5. **Insights/Widgets** (below fold)
6. **Historical charts** (on-demand)

---

## Performance Targets

- Initial paint: <200ms
- KPI data loaded: <500ms
- Full dashboard interactive: <1s
- Charts/Insights: Lazy load after visible

---

## Responsive Behavior

### Desktop (1280px+)

Full layout as specified above.

All sections visible.

Multi-column widgets.

### Tablet (768px–1279px)

- Primary snapshot: Full width
- Accounts: Stack vertically
- Insights: Single column
- Widgets: Single column

### Mobile (<768px)

- Cards: Full width, stacked
- Charts: Simplified or hidden
- Widgets: Stack vertically
- Priority: Balance, Budget, Most important insight

---

## Dark Mode

All dashboards adapt to dark mode:

Visual rules:

- Slightly elevated surfaces (card backgrounds darker)
- Maintain contrast for numbers
- Keep semantic colors consistent (green = income, red = expense)
- Avoid heavy contrast blocks (dashboards should feel calm)
- Financial tables: Zebra stripes more subtle in dark mode

---

## Implementation Notes

### Read-Only by Default

This is subtle but important.

- No inline editing
- No destructive actions
- Navigation-oriented

The dashboard is **observation**, not manipulation.

### Drill-Down Navigation

- Click accounts → Transaction list
- Click exceptions → Direct to issue
- Click insights → Detailed view
- Click widgets → Settings or detail view

Consistent and predictable.

### Accessibility

- All numbers readable with sufficient contrast
- Color not sole differentiator (use icons + text)
- Keyboard navigable
- ARIA labels on all elements

---

## Relationship to Other Systems

| System         | Dashboard Role        |
| -------------- | --------------------- |
| Transactions   | Entry point           |
| Reconciliation | Attention surfacing   |
| Insights       | Insight preview       |
| Reports        | Drill-down            |
| Planning       | Context for decisions |

The dashboard **orchestrates**, it doesn't compete.

---

## See Also

- [`../02-patterns/navigation.md`](../02-patterns/navigation.md) - Sidebar and top command bar
- [`../01-components/financial-components.md`](../01-components/financial-components.md) - KPI cards, entity badges
- [`../01-components/ai-components.md`](../01-components/ai-components.md) - AI insight cards
- [`../02-patterns/ai-interaction.md`](../02-patterns/ai-interaction.md) - AI patterns on dashboard
- [`../04-workflows/entity-selection.md`](../04-workflows/entity-selection.md) - Entity context switching
- [`../03-screens/`](../) - Other feature screens
