# Command Center Dashboard Redesign — Implementation Plan

**Status:** Draft
**Created:** 2026-02-20

## Context

**Problem:** The current dashboard uses a 3-rail flex layout (Left Rail stats + Center content + Right Rail AI/actions) that wastes horizontal space, hides Quick Stats behind scroll, limits AI Insights to 1 card, and breaks down poorly on tablet/mobile.

**Solution:** Transform into a **Command Center** CSS grid layout (4-col desktop, 2-col tablet, 1-col mobile) where all content flows in a single responsive grid. Quick Actions become horizontal pill buttons, AI Insights expand to 3 card types, and all 7 Quick Stats are visible without scroll.

**Reference Mockup:** [dashboard-redesign-concepts.html](docs/design-system/03-screens/dashboard-redesign-concepts.html)

**Scope:** Start with Overview page (Sprint 1), then normalize layouts app-wide (Sprint 2), then mobile optimization (Sprint 3). Screen-by-screen approach per user's request.

---

## Sprint 1: Overview Page — Command Center Grid (8 tasks)

### Task 1: Extract StatCard into standalone component
**File:** `apps/web/src/components/dashboard/StatCard.tsx` (NEW)
**What:** Extract the StatCard logic from `DashboardLeftRail.tsx:47-86` (glow tracking via RAF, MiniSparkline, trend indicator, ArrowUp/Down icons) into a reusable component. This is the core building block for Quick Stats.
**Reuse:** `MiniSparkline.tsx` (keep as-is), `constants.ts` (add `'teal'` to SparkColor type)
**Depends on:** none
**Success:** `StatCard` renders identically to current Left Rail cards. Imports from `constants.ts`.

### Task 2: Create QuickActionPills component
**File:** `apps/web/src/components/dashboard/QuickActionPills.tsx` (NEW)
**What:** Horizontal row of pill-shaped buttons with Lucide SVG icons. 6 actions: Invoice, New Bill, Scan Receipt, Record Payment, Transfer, Journal Entry. Each pill: `glass-2` bg, `border-ak-border`, 8px radius, `hover:-translate-y-px`, `hover:glass-3`. Mobile: horizontal scroll with `-webkit-overflow-scrolling: touch`.
**Delete after:** `QuickActions.tsx` (old 2x2 grid version)
**Depends on:** none
**Success:** Pills render as horizontal wrapping row, hover lifts, mobile scrolls horizontally.

### Task 3: Create InsightCards component
**File:** `apps/web/src/components/dashboard/InsightCards.tsx` (NEW)
**What:** 3-card row for AI Insights — **Financial Insight** (green accent), **Did You Know?** (blue accent), **Tax Tip** (amber/primary accent). Each card has: colored top accent line (2px gradient), pulsing dot, SVG icon, italic Newsreader body, mono meta line. Desktop: 3-col grid. Mobile: stacked.
**Delete after:** `AIBrief.tsx` (old single-card version)
**Depends on:** none
**Success:** 3 insight cards render in a row, each with distinct color accent. Body text uses `font-heading italic`.

### Task 4: Create CommandCenterGrid CSS utility
**File:** `apps/web/src/app/globals.css` (MODIFY — add utility)
**What:** Add Tailwind v4 `@utility` for the responsive grid, OR use inline responsive Tailwind classes directly (preferred for simplicity). The grid structure:
- Mobile (default): `grid-cols-1`
- Tablet (md:): `grid-cols-2`, hero and insights span full width
- Desktop (xl:): `grid-cols-4`, hero spans cols 1-2, right panel spans cols 3-4, chart spans 1-2, activity spans 3-4

**Depends on:** none
**Success:** Grid breakpoints match mockup at 375px, 768px, 1200px.

### Task 5: Modify NetWorthHero for Command Center
**File:** `apps/web/src/components/dashboard/NetWorthHero.tsx` (MODIFY)
**What:**
- Add gradient background: `bg-gradient-to-br from-primary/[0.08] to-ak-purple/[0.05]` with `border-primary/15`
- Add `runway` prop (display as 3rd sub-item alongside Cash and Debt)
- Remove outer `space-y-3` wrapper and `h-8` alignment div (no longer aligning with side rails)
- Greeting and date stay inside the hero card itself
**Depends on:** none
**Success:** Hero card has subtle amber-to-purple gradient, shows Cash/Debt/Runway row.

### Task 6: Create CommandCenterRightPanel component
**File:** `apps/web/src/components/dashboard/CommandCenterRightPanel.tsx` (NEW)
**What:** Composition component wrapping `QuickActionPills` + `UpcomingPayments` in a single `glass` card that fills the grid column height. Uses `flex flex-col gap-3`, with Upcoming Payments pushed to bottom via `mt-auto`.
**Depends on:** Task 2 (QuickActionPills)
**Success:** Right panel fills grid cell, actions at top, payments at bottom.

### Task 7: Rewrite overview page.tsx with CSS grid layout
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx` (REWRITE)
**What:** Replace the 3-rail `flex gap-6` layout with Command Center grid:

```
Grid Row 1: [Hero (2 cols)] [Right Panel (2 cols)]
Grid Row 2: [AI Insights (full width, 3-card row)]
Grid Row 3: [Quick Stats (full width, 7-card row)]
Grid Row 4: [Cash Flow Chart (2 cols)] [Recent Activity (2 cols)]
Grid Row 5: [Entity Matrix (full width)]
```

**Components used:**
- `NetWorthHero` (modified) — grid area: hero
- `CommandCenterRightPanel` (new) — grid area: right panel
- `InsightCards` (new) — grid area: insights, full width
- `StatCard` (new, x7) — grid area: stats row, full width
- `DashboardCharts` (keep) — grid area: chart
- `RecentTransactions` (keep) — grid area: activity
- `EntitiesSection` (keep) — grid area: full width
- `OnboardingHeroCard` (keep) — conditional, above grid

**Remove imports:** `DashboardLeftRail`, `DashboardRightRail`, `SparkCards`

Quick Stats responsive grid:
- Desktop: `grid-cols-7` (all visible in single row)
- Tablet: `grid-cols-4` (2 rows)
- Mobile: `grid-cols-2` (4 rows)

**Depends on:** Tasks 1-6
**Success:** Dashboard renders as single CSS grid matching mockup. No left/right rails.

### Task 8: Update loading skeleton
**File:** `apps/web/src/app/(dashboard)/overview/loading.tsx` (MODIFY)
**What:** Update skeleton to match new grid layout (hero+right panel row, insights row, stats row, chart+activity row). Use same grid classes.
**Depends on:** Task 7
**Success:** Loading state shows grid-shaped skeletons matching content areas.

---

## Sprint 2: App-Wide Layout Normalization (3 tasks)

### Task 9: Normalize domain layout spacing
**Files:**
- `apps/web/src/app/(dashboard)/banking/layout.tsx` — currently `px-6 py-6 space-y-6`
- `apps/web/src/app/(dashboard)/business/layout.tsx` — currently `flex-1 space-y-6 p-6`
- `apps/web/src/app/(dashboard)/overview/layout.tsx` — currently `space-y-4`
**What:** Standardize all domain layouts to consistent spacing (`space-y-4` vertical gap, no extra padding since root `layout.tsx` already provides `px-4 md:px-6 py-4`). Remove redundant padding that causes double-stacking.
**Depends on:** Sprint 1 complete
**Success:** Consistent spacing across all domain pages. No double padding.

### Task 10: Evaluate Quick Actions for cross-domain placement
**File:** Research task
**What:** Determine which Quick Actions are contextual per domain vs global. For example: Banking page might show "Import Statement" pill, Invoicing page might show "New Invoice" pill prominently. Document decision for future sprints.
**Depends on:** Task 9
**Success:** Decision documented on whether Quick Actions are overview-only or app-wide.

**Decision (2026-02-20):** Quick Actions remain **overview-only**.
- Each domain page already has page-level action buttons (e.g., "Import Statement" on Banking, "New Invoice" on Invoicing)
- Overview pills serve as cross-domain shortcuts; within a domain, users are already contextually positioned
- Adding pills to domain pages would create visual clutter competing with existing header actions
- Future: If needed, domain pages could add 1-2 contextual pills to their own headers, but not the full 6-pill QuickActionPills component

### Task 11: Evaluate AI Insights for cross-domain placement
**File:** Research task
**What:** Determine if domain-specific insights make sense (e.g., Banking page shows account insights, Invoicing shows receivable trends). Document decision for future sprints.
**Depends on:** Task 9
**Success:** Decision documented on insight placement strategy.

**Decision (2026-02-20):** AI Insights remain **overview-only**.
- Overview InsightCards aggregate cross-domain intelligence (financial health, tax tips, learning) — not domain-specific
- Domain-specific alerts (e.g., "3 invoices overdue") are better served by inline alert banners at the top of domain pages, not a separate InsightCards component
- Future: Domain pages may get their own lightweight alert/insight components, but these would be a different pattern (inline banner) rather than reusing InsightCards

---

## Sprint 3: Mobile Optimization (4 tasks)

### Task 12: Mobile Quick Actions scroll behavior
**File:** `apps/web/src/components/dashboard/QuickActionPills.tsx` (MODIFY)
**What:** Fine-tune mobile scroll: fade edges with gradient masks, reduce pill padding at `sm:` breakpoint, ensure touch scrolling is smooth.
**Depends on:** Sprint 1 complete
**Success:** Quick Actions scroll smoothly on mobile, no content overflow.

### Task 13: Mobile stat card layout
**File:** Overview page responsive classes
**What:** Stats render as 2-col grid on mobile (matching mockup). 7 stats in 2-col = 3 rows + 1 remaining stat (left-aligned or full-width).
**Depends on:** Sprint 1 complete
**Success:** 2-col stat grid on mobile viewport.

### Task 14: Mobile insight stacking
**File:** `apps/web/src/components/dashboard/InsightCards.tsx` (MODIFY)
**What:** Insights stack vertically on mobile with condensed padding (12px) and smaller text (12px body, 9px type label). Fine-tune from initial responsive defaults.
**Depends on:** Sprint 1 complete
**Success:** Insights stack cleanly at 375px width.

### Task 15: Mobile hero sizing
**File:** `apps/web/src/components/dashboard/NetWorthHero.tsx` (MODIFY)
**What:** Responsive hero: reduce padding on mobile (`p-5 md:p-7`), smaller NW value (`text-3xl md:text-4xl`), compact sub-items.
**Depends on:** Sprint 1 complete
**Success:** Hero fits mobile viewport without cramping.

---

## Component Inventory

| Component | Action | Notes |
|-----------|--------|-------|
| `StatCard.tsx` | **NEW** | Extracted from DashboardLeftRail |
| `QuickActionPills.tsx` | **NEW** | Horizontal pills with Lucide SVG icons |
| `InsightCards.tsx` | **NEW** | 3-card AI insights (Financial, Learning, Tax) |
| `CommandCenterRightPanel.tsx` | **NEW** | QuickActionPills + UpcomingPayments |
| `NetWorthHero.tsx` | **MODIFY** | Gradient bg, runway prop, remove rail alignment |
| `page.tsx` (overview) | **REWRITE** | CSS grid replaces 3-rail flex |
| `loading.tsx` (overview) | **MODIFY** | Grid-shaped skeletons |
| `constants.ts` | **MODIFY** | Add 'teal' to SparkColor |
| `DashboardLeftRail.tsx` | **DELETE** | Replaced by inline StatCards |
| `DashboardRightRail.tsx` | **DELETE** | Replaced by CommandCenterRightPanel |
| `SparkCards.tsx` | **DELETE** | Mobile fallback no longer needed |
| `AIBrief.tsx` | **DELETE** | Replaced by InsightCards |
| `QuickActions.tsx` | **DELETE** | Replaced by QuickActionPills |
| `ActionItems.tsx` | **KEEP** | May reuse in future |
| `MiniSparkline.tsx` | **KEEP** | Reused by StatCard |
| `EntitiesSection.tsx` | **KEEP** | Full-width grid row |
| `DashboardCharts.tsx` | **KEEP** | 2-col grid area |
| `RecentTransactions.tsx` | **KEEP** | 2-col grid area |
| `UpcomingPayments.tsx` | **KEEP** | In CommandCenterRightPanel |
| `OnboardingHeroCard.tsx` | **KEEP** | Conditional, above grid |

---

## CSS Grid Layout Reference

```
Desktop (xl / 1200px+):              Tablet (md / 768px+):
+-------------+-------------+        +---------------------+
|  Hero (2)   | Right (2)   |        |     Hero (full)     |
+-------------+-------------+        +---------------------+
|   AI Insights (3 cards)   |        |   Right Panel       |
+---------------------------+        +---------------------+
|   Quick Stats (7 cards)   |        |   AI Insights (3)   |
+-------------+-------------+        +---------------------+
|  Chart (2)  |Activity (2) |        |   Stats (4-col)     |
+-------------+-------------+        +----------+----------+
|   Entity Matrix (full)    |        |  Chart   | Activity |
+---------------------------+        +----------+----------+

Mobile (< 768px):
+-----------+
|   Hero    |
+-----------+
|  Actions  |  <- horizontal scroll
+-----------+
| Insight 1 |
| Insight 2 |
| Insight 3 |
+-----------+
| Stat Stat |  <- 2-col grid
| Stat Stat |
| Stat Stat |
|   Stat    |
+-----------+
|  Chart    |
+-----------+
| Activity  |
+-----------+
| Entities  |
+-----------+
```

---

## Reference Files

- `docs/design-system/03-screens/dashboard-redesign-concepts.html` — Canonical mockup
- `apps/web/src/app/(dashboard)/overview/page.tsx` — Current page to rewrite
- `apps/web/src/components/dashboard/DashboardLeftRail.tsx` — StatCard source to extract
- `apps/web/src/lib/dashboard/constants.ts` — Shared types and color maps
- `apps/web/src/components/dashboard/MiniSparkline.tsx` — Reusable sparkline
- `apps/web/src/components/dashboard/UpcomingPayments.tsx` — Reuse in right panel
- `apps/web/src/app/(dashboard)/layout.tsx` — Root layout (`px-4 md:px-6 py-4`)
- `apps/web/src/app/globals.css` — Design tokens, glass utilities

---

## Edge Cases

- **No data:** Stats show "---" values (existing formatCurrency handles this)
- **No insights available:** InsightCards shows placeholder with Sparkles icon
- **Mobile overflow:** Quick Actions pills use `overflow-x-auto` with touch scrolling
- **Odd stat count:** 7 stats in 2-col mobile = last stat left-aligned
- **Entity collapse:** EntitiesSection keeps existing collapse/expand + keyboard shortcut

---

## Verification Plan

### Visual Testing
1. Open `http://localhost:3000/overview`
2. Desktop (1440px): 4-col grid — Hero+RightPanel, Insights row, Stats row, Chart+Activity
3. Tablet (768-1199px): 2-col grid — stacked hero/right panel, insights full width
4. Mobile (375px): Single column — hero, scrollable pills, stacked insights, 2x3 stats

### Design System Compliance
- [ ] All colors use semantic tokens (no hardcoded hex)
- [ ] Glass utilities used correctly (glass, glass-2, glass-3)
- [ ] Typography: Newsreader headings, Manrope body, JetBrains Mono numbers
- [ ] Hover states: `-translate-y-px` + `border-ak-border-2`
- [ ] Insight body text uses `font-heading italic`

---

## Estimated Effort

| Sprint | Tasks | Estimate |
|--------|-------|----------|
| Sprint 1 (Overview) | 8 tasks | 2-3 hours |
| Sprint 2 (App-wide) | 3 tasks | 1 hour |
| Sprint 3 (Mobile) | 4 tasks | 1 hour |
| **Total** | **15 tasks** | **4-5 hours** |

**Approach:** Complete Sprint 1, verify visually, commit. Then Sprint 2 and 3 as separate commits.
