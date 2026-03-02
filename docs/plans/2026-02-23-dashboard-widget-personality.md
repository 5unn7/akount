# Dashboard Widget Personality System

## Context

The overview dashboard currently has a mix of widget styles — some with thick rows, some with glass cards, some bare-bones. After successfully redesigning **RecentTransactions** (compact rows, grouped by date, thin glass scrollbar, bottom fade) and **UpcomingPayments** (compact rows with pagination, color-coded direction), the user wants to extend this consistency *without* just stamping the same compact-row pattern everywhere.

The user's exact direction: *"are there better ways to do things that would bring our creativity even more? let's bring out us in this."*

**Goal:** Give each widget a unique visual personality that serves its specific data purpose, while maintaining a unified Akount aesthetic. Not a uniform grid of identical rows — a **command center** where each panel tells its story differently.

---

## Design Philosophy: "Same Language, Different Voices"

Every widget shares the same **vocabulary** (glass surfaces, semantic tokens, mono numbers, muted labels, 120ms transitions) but speaks with a **different voice** based on what it communicates:

| Data Type | Voice | Visual Expression |
|-----------|-------|-------------------|
| Lists (transactions, payments) | Scannable feed | Compact rows with colored bars |
| Urgency (action items) | Alert system | Priority lanes with urgency pulse |
| AI/Intelligence (insights, briefs) | Advisor whisper | Italic serif text, accent borders, confidence dots |
| Analytics (expenses, spending) | Data visualization | Charts with compact legends |
| Status (entities, accounts) | Health dashboard | Compact cards with progress indicators |

---

## Phase 1: Shared Foundation (Do First)

### 1A. Extract `CompactRow` Component

**File:** `apps/web/src/components/ui/compact-row.tsx`

Extract the proven single-line pattern from RecentTransactions/UpcomingPayments into a reusable component:

```
[colored bar] [icon] [label...] [meta] [value]
```

**Props:**
- `barColor` — Tailwind bg class for the side indicator
- `icon` — Lucide icon component + color class
- `label` — Primary text (truncates)
- `meta` — Secondary text (optional, muted, shrink-0)
- `value` — Right-aligned mono text + color class
- `href` — Optional link wrapper
- `onClick` — Optional click handler

**Used by:** RecentTransactions, UpcomingPayments, ActionItems (refactored)

**Files to modify:**
- Create: `apps/web/src/components/ui/compact-row.tsx`
- Refactor: `apps/web/src/components/dashboard/RecentTransactions.tsx` (use CompactRow)
- Refactor: `apps/web/src/components/dashboard/UpcomingPayments.tsx` (use CompactRow)

### 1B. Extract `WidgetShell` Component

**File:** `apps/web/src/components/ui/widget-shell.tsx`

Shared outer wrapper for all dashboard widgets:

```
[glass rounded-xl p-4 h-full flex flex-col]
  [header: title + optional action link]
  [flex-1 min-h-0 children]
  [optional: bottom fade gradient]
```

**Props:**
- `title` — Widget heading (10px uppercase muted label)
- `action` — Optional { label, href } for "View all" link
- `fade` — Boolean to add bottom gradient fade (for scrollable widgets)
- `className` — Additional classes
- `children`

**Used by:** All 6 widgets + RecentTransactions + CashFlowChart

---

## Phase 2: Widget Redesigns (Independent — Can Parallelize)

### 2A. ActionItems — "Priority Lanes"

**Current:** Thick icon+text rows (~40px each) with colored icon boxes. Works but wastes space.

**Creative Redesign:** Compact rows using CompactRow, but grouped into **urgency lanes** with visual urgency encoding:

- **Urgent items** (overdue): Get a `bg-ak-red-dim` lane header + subtle left red glow
- **Normal items** (upcoming): Get a standard lane header

**Visual concept:**
```
┌─ Action Items ──────────────── 5 items ─┐
│                                          │
│ ⚠ OVERDUE                               │
│ ▌ ⚠ Invoice #1042 — Maple Co    3d late │
│ ▌ ⚠ Bill #887 — AWS hosting     7d late │
│                                          │
│ NEEDS ATTENTION                          │
│ ▌ ◉ 12 unreconciled transactions  →     │
│ ▌ ◉ 3 invoices pending approval   →     │
│ ▌ ◉ Review bank statement import  →     │
└──────────────────────────────────────────┘
```

**Key changes:**
- Replace 8x8 icon boxes with CompactRow (3x3 icon, colored bar)
- Group by urgency: `urgent` (overdue — red bar/glow) vs `attention` (normal — amber bar)
- Lane headers: tiny uppercase labels with count
- Urgent lane gets subtle `bg-ak-red-dim/30` background wash
- Each row is a Link (preserves current clickable behavior)
- Arrow icon appears on hover (existing pattern)

**Files:**
- Modify: `apps/web/src/components/dashboard/ActionItems.tsx`
- Uses: CompactRow, WidgetShell

### 2B. InsightCards — "Advisor Ticker"

**Current:** 3-column grid of glass cards with accent top bars. Clean but static — the 3-card grid takes up a full row.

**Creative Redesign:** Single-row **scrolling ticker** that cycles through insights with a typewriter-like reveal:

**Visual concept:**
```
┌─────────────────────────────────────────────────────┐
│ ● Financial   "Your SaaS spend rose 23% this month  │
│               — mostly driven by new AI tools."      │
│                                              Feb 23  │
│                                     ● ○ ○   ──────  │
└─────────────────────────────────────────────────────┘
```

**Key changes:**
- Single glass card instead of 3-card grid (saves vertical space)
- Shows one insight at a time with smooth crossfade transition (180ms)
- Type-colored accent: left border (green=financial, blue=learning, amber=tax)
- Pulse dot + type label in header
- Body text in `font-heading italic` (Newsreader — signals AI interpretation)
- Navigation dots at bottom + auto-cycle every 8s (pauses on hover)
- Optional meta line in mono for numbers/dates
- When only 1 insight: no dots, no auto-cycle
- Empty state: existing Sparkles placeholder (keep as-is)

**Files:**
- Modify: `apps/web/src/components/dashboard/InsightCards.tsx`
- Uses: WidgetShell, existing cardConfig colors

### 2C. ExpenseChart — "Spending Pulse"

**Current:** Stacked bar chart with period toggle, legend, and 3-stat summary footer. Already quite rich.

**Creative Redesign:** Keep the stacked bars (they work well) but tighten the layout and add a **donut ring summary** alongside the bars:

**Visual concept:**
```
┌─ Expense Breakdown ──── [D W M Q Y] ───┐
│                                          │
│  $12.4K total          ┃████████┃        │
│                        ┃█████   ┃        │
│   ◉ 42% SaaS          ┃████████┃        │
│   ◉ 28% Marketing     ┃███████ ┃        │
│   ◉ 18% Office         Jan Feb Mar      │
│   ◉ 12% Travel                          │
│                                          │
│ Top: SaaS · Avg: $2.1K · Total: $12.4K  │
└──────────────────────────────────────────┘
```

**Key changes:**
- Replace the flexbox legend with a compact **inline legend** (colored dot + name + percentage) on the left side
- Keep stacked bars on the right
- Tighten padding: p-5 → p-4
- Keep period toggle but reduce button size
- Keep 3-stat footer but make it single-line
- Use `formatCompact` from existing code (already there)
- Replace hardcoded `backgroundColor` in stacked bars with semantic token mapping where possible

**Files:**
- Modify: `apps/web/src/components/dashboard/ExpenseChart.tsx`
- Uses: WidgetShell

### 2D. EntitiesSection — "Entity Health Cards"

**Current:** Shows entity cards with name and basic info.

**Creative Redesign:** Compact **health indicator cards** showing entity status at a glance:

**Visual concept (per entity):**
```
┌─ Maple Corp ──────── 🇨🇦 CAD ─┐
│ ■■■■■■■□□□ 72% reconciled     │
│ 3 accounts · 142 transactions  │
└────────────────────────────────┘
```

**Key changes:**
- Add a mini progress bar showing reconciliation health
- Show key stats inline (accounts, transactions, outstanding)
- Currency flag/badge
- Keep existing entity selection behavior

**Files:**
- Modify: `apps/web/src/components/dashboard/EntitiesSection.tsx`
- Modify: `apps/web/src/components/dashboard/EntitiesList.tsx` (if exists)

### 2E. AIBrief — "Whisper Card" (Polish)

**Current:** Glass card with purple left border, pulse dot, italic text. Already good.

**Creative Redesign:** Minor polish only — this widget already embodies the "advisor whisper" voice:
- Add subtle purple glow on hover using GlowCard
- Add "Based on last 30 days" meta text if not present
- Keep the italic Newsreader body (perfect for AI voice)

**Files:**
- Modify: `apps/web/src/components/dashboard/AIBrief.tsx`

---

## Phase 3: Consistency Pass (After Phase 2)

### 3A. Scrollable Widget Pattern

Apply the scrollbar-thin-glass + bottom-fade pattern to any widget that can overflow:
- ActionItems (if >5 items)
- Any future widget with variable-length lists

### 3B. Audit Remaining List Views Across App

After dashboard is polished, audit these non-dashboard lists for CompactRow adoption:
- `apps/web/src/app/(dashboard)/banking/transactions/` — transaction list
- `apps/web/src/app/(dashboard)/business/invoices/` — invoice list
- `apps/web/src/app/(dashboard)/business/bills/` — bills list

(This is a future phase — noted for tracking, not part of this plan.)

---

## Implementation Order

```
Phase 1A: CompactRow component     (foundation — blocks 2A)
Phase 1B: WidgetShell component    (foundation — blocks all Phase 2)
Phase 2A: ActionItems redesign     (depends on 1A, 1B)
Phase 2B: InsightCards redesign    (depends on 1B only)
Phase 2C: ExpenseChart polish      (depends on 1B only)
Phase 2D: EntitiesSection polish   (depends on 1B only)
Phase 2E: AIBrief polish           (no deps — minor)
Phase 3:  Consistency pass         (after Phase 2)
```

**2A-2E can run in parallel** after Phase 1 is complete. Estimated: ~6-8 focused edits.

---

## Critical Files

| File | Action |
|------|--------|
| `apps/web/src/components/ui/compact-row.tsx` | **CREATE** — shared compact row |
| `apps/web/src/components/ui/widget-shell.tsx` | **CREATE** — shared widget wrapper |
| `apps/web/src/components/dashboard/RecentTransactions.tsx` | REFACTOR to use CompactRow |
| `apps/web/src/components/dashboard/UpcomingPayments.tsx` | REFACTOR to use CompactRow |
| `apps/web/src/components/dashboard/ActionItems.tsx` | REDESIGN — priority lanes |
| `apps/web/src/components/dashboard/InsightCards.tsx` | REDESIGN — advisor ticker |
| `apps/web/src/components/dashboard/ExpenseChart.tsx` | POLISH — tighter layout |
| `apps/web/src/components/dashboard/EntitiesSection.tsx` | POLISH — health indicators |
| `apps/web/src/components/dashboard/AIBrief.tsx` | POLISH — subtle glow |
| `apps/web/src/app/globals.css` | May need new utilities |

## Existing Utilities to Reuse

| Utility | Location |
|---------|----------|
| `formatCurrency` | `apps/web/src/lib/utils/currency.ts` |
| `formatDate` | `apps/web/src/lib/utils/date.ts` |
| `MiniSparkline` | `apps/web/src/components/dashboard/MiniSparkline.tsx` |
| `GlowCard` | `apps/web/src/components/ui/glow-card.tsx` |
| `scrollbar-thin-glass` | `apps/web/src/app/globals.css` |
| `cn` | `apps/web/src/lib/utils.ts` |
| `cardConfig` (insight types) | `apps/web/src/components/dashboard/InsightCards.tsx` |
| `getIconConfig` (action types) | `apps/web/src/components/dashboard/ActionItems.tsx` |
| API client functions | `apps/web/src/lib/api/dashboard-client.ts` |

## Verification

1. **Visual check:** Run `cd apps/web && npm run dev` — inspect overview page at `/overview`
2. **TypeScript:** `cd apps/web && npx tsc --noEmit` — zero new errors
3. **Widget checklist per redesign:**
   - Empty state renders correctly (no data)
   - Loading skeleton renders (while fetching)
   - Data state renders with proper tokens (no hardcoded colors)
   - Hover interactions work (border brightening, row highlights)
   - Scrollable widgets have thin-glass scrollbar + bottom fade
   - Responsive: check at `md` and `xl` breakpoints
4. **No regressions:** Overview page grid layout unchanged (4-col grid, same row structure)
