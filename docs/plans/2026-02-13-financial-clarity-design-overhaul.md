# Financial Clarity Design Overhaul — Implementation Plan

**Created:** 2026-02-13
**Status:** Draft (Awaiting Approval)
**Design Reference:** `brand/explorations/html/` (50+ pages, full app design)
**Design Tokens Reference:** `brand/explorations/html/styles/design-system.css`
**Aesthetic Rules:** `.claude/rules/design-aesthetic.md`

## Overview

Transform the Akount frontend from its current functional-but-basic state to match the full "Financial Clarity" design system across all 50+ pages. The exploration HTML prototype defines the complete visual language: 68px icon sidebar, rich topbar with entity selector, glass morphism cards, staggered animations, command palette, detail slide-out panel, and page-specific layouts for all 8 domains.

**Scope:** Frontend-only. No backend changes. All existing API connections, auth, and functionality preserved.

## Expert Analysis Summary

**Architecture Strategist:** Phase order is correct. Shell first, then pages. Extract shared components (StatsGrid, DataTable, PageHeader, SectionTabs) early to avoid duplication across 50+ pages. Sidebar should use React state (not CSS-only) for accessibility and mobile pinning.

**Design System Enforcer:** Token reconciliation needed — exploration CSS has slightly different glass/border values than current globals.css. Exploration should be canonical. New layout tokens needed (--sidebar, --topbar, animation easings). Update globals.css in Phase 0.

**Next.js Reviewer:** Sidebar expand = React state + CSS transition (not CSS-only hover). Entity selector = Zustand store (already used for onboarding). Breadcrumb = `usePathname()`. Command Palette = Portal in layout. Detail Panel = component state (not parallel routes — too complex). Stagger animations = CSS classes + Suspense boundaries.

**Performance Oracle:** Limit `backdrop-filter: blur()` to max 5-6 elements visible simultaneously. Use `will-change: transform` on animated elements. Throttle mousemove for GlowCard to 16ms (requestAnimationFrame). Lazy-load chart components. Canvas charts are fine for performance.

---

## Current State vs Reference

| Aspect | Current | Reference | Gap |
|--------|---------|-----------|-----|
| Sidebar | 288px wide, text labels, collapsible groups | 68px icon-only, expand to 240px on hover, tooltips, badge counts | **Major rebuild** |
| Topbar | Theme toggle + Clerk avatar only | Entity selector, breadcrumb, search (Cmd+K), theme toggle, sync, notifications, help | **Major rebuild** |
| Layout | Flex-based, sidebar + main | CSS Grid: `68px 1fr` x `56px 1fr`, sidebar spans full height | **Structural change** |
| Overview | Title + onboarding + entities + 4 metric cards | Liquidity Matrix (entity cards), Performance sparklines (5 cards), Cash Flow canvas, Expense chart, AI Brief, Quick Actions, Action Items, Upcoming, Quick Stats | **Full redesign** |
| Banking | Balance hero + account rows in cards | Account cards grid (auto-fill), Reconciliation progress bar, Rich transaction table with filters/tabs | **Significant rework** |
| Transactions | Basic table + filters | Stats grid (4 cards), Checkboxes, Entity column, AI categorization badges, Pagination | **Enhancement** |
| Invoicing | Placeholder page | Stats grid, AR Aging bar, Invoice table with collection progress bars, Bills table | **New build** |
| Accounting | Placeholder page | Chart of Accounts table (debit/credit/balance), Journal Entries table, Trial Balance sidebar, Tax Summary, Month-End Checklist | **New build** |
| AI Advisor | Placeholder page | Intelligence Brief (gradient card), Expandable insight cards (4 types: saving/growth/warning/risk), Confidence bars | **New build** |
| Clients | Placeholder page | Stats grid, Client directory table with avatar, contact, entity, balance | **New build** |
| Command Palette | None | Cmd+K overlay with categories (Search/Actions/Navigate/Ask AI), keyboard nav | **New feature** |
| Detail Panel | None | 420px slide-out right panel with overlay, configurable content | **New feature** |
| Animations | None | Staggered fade-in (fi1-fi6), hover lifts, transitions | **New system** |
| Domain Tabs | None | Per-domain sub-navigation tabs (e.g., Banking: Accounts/Transactions/Reconciliation/Imports/Transfers) | **New pattern** |

## Success Criteria

- [ ] App shell: 68px sidebar, rich topbar, CSS Grid layout
- [ ] Overview: Liquidity Matrix, spark cards, charts, two-column layout
- [ ] Banking: Account card grid, reconciliation bar, transaction table
- [ ] All pages: Domain sub-tabs, stats grids, staggered fade-in animations
- [ ] Command palette (Cmd+K) with navigation and search
- [ ] Detail slide-out panel for transactions/invoices/accounts
- [ ] Design tokens reconciled (exploration values = canonical)
- [ ] All existing functionality preserved (auth, onboarding, API connections)
- [ ] Dark mode matches reference exactly
- [ ] Mobile responsive (sidebar → sheet, topbar adapts)

---

## Phase 0: Design Token Reconciliation (Pre-requisite)

### Task 0.1: Update globals.css Tokens
**File:** `apps/web/src/app/globals.css`
**What:** Reconcile CSS variables with exploration design-system.css. Key changes:
- Glass tiers: `0.025 → 0.035`, `0.04 → 0.06`, `0.06 → 0.09`
- Border tiers: `0.06 → 0.09`, `0.09 → 0.14`, `0.13 → 0.20`
- Add layout tokens: `--sidebar: 68px`, `--topbar: 56px`, `--r: 16px`, `--r-sm: 10px`, `--r-xs: 6px`
- Add easing tokens: `--ease: cubic-bezier(.16,1,.3,1)`, `--ease2: cubic-bezier(.4,0,.2,1)`
- Add animation keyframes: `fi` (fade-in), `dd-in` (dropdown), `pb` (pulse breathing), `pr` (pulse ring)
- Add stagger delay utilities: `.fi1` through `.fi6`
- Add `--pri-text: #FFB02E`, `--pri-active: rgba(245,158,11,0.25)`
**Depends on:** none
**Success:** Token values match exploration CSS exactly, stagger animation classes work

---

## Phase 1: Shell Architecture (Foundation)

Everything else depends on this. The sidebar, topbar, and layout grid define the structural frame.

### Task 1.1: Sidebar Rebuild
**Files:** Rewrite `apps/web/src/components/layout/Sidebar.tsx`
**What:**
- 68px collapsed icon-only sidebar, expand to 240px on hover via React state + CSS transition
- Each domain: 40x40 icon button with tooltip (on collapsed) or text label (on expanded)
- Sub-navigation items appear on domain expand (accordion, only one open at a time)
- Active state: amber dim background + left border
- Badge counts on Banking (unmatched txns), Business (overdue), AI (new insights)
- Dividers between domain groups
- Logo at top: "A" gradient orb (34x34)
- User profile card at bottom: avatar + name + plan tier
- Mobile: Sheet drawer (existing pattern preserved), icon-only style
- React state for: expanded/collapsed, active domain, open sub-nav
- Keyboard: 1-8 number keys for domain switching (stretch goal)
**Depends on:** Task 0.1
**Success:** Sidebar is 68px collapsed, expands on hover, icons + tooltips work, active state matches reference, mobile sheet works

### Task 1.2: Rich Topbar
**Files:** Rewrite `apps/web/src/components/layout/Navbar.tsx`, create `apps/web/src/components/layout/EntitySelector.tsx`, create `apps/web/src/components/layout/TopbarBreadcrumb.tsx`
**What:**
- 56px height, glass background + bottom border
- **Left:** Entity selector dropdown (color dot + name + type + chevron → dropdown with entity list, active checkmark). Store selected entity in Zustand (shared with API calls).
- **Center-left:** Breadcrumb trail using `usePathname()` (domain / sub-page)
- **Center:** Search input (read-only, click → opens Command Palette). Shows `/` keyboard hint.
- **Right:** Theme toggle, sync button, help button, notification bell (with dot indicator)
- Entity dropdown: glass background, entity items with dot + name + meta + checkmark. "Add Entity" at bottom.
**Depends on:** Task 0.1
**Success:** Topbar shows entity name, breadcrumb updates on navigation, search input opens command palette, all buttons functional

### Task 1.3: Layout Grid
**File:** `apps/web/src/app/(dashboard)/layout.tsx`
**What:**
- Replace flex layout with CSS Grid: `grid-template-columns: var(--sidebar) 1fr; grid-template-rows: var(--topbar) 1fr`
- Sidebar: `grid-row: 1 / -1` (spans full height)
- Topbar: `grid-column: 2`, `grid-row: 1`
- Main: `grid-column: 2`, `grid-row: 2`, `overflow-y: auto` with custom scrollbar (5px, border color)
- Preserve: auth check, onboarding redirect, ReactQuery provider, API error handling
- Responsive: Below `md` breakpoint, single column (no sidebar), mobile hamburger
**Depends on:** Task 1.1, Task 1.2
**Success:** Shell matches reference grid, scrolling works in main area, mobile responsive

### Task 1.4: Staggered Animation System
**Files:** `apps/web/src/app/globals.css` (keyframes already in Task 0.1), optionally create `apps/web/src/components/shared/FadeIn.tsx`
**What:**
- CSS `@keyframes fi`: `opacity: 0, translateY(10px)` → `opacity: 1, translateY(0)`, 0.45s ease
- Utility classes `.fi` (base) + `.fi1` through `.fi6` (delay stages: 0s, 0.06s, 0.12s, 0.18s, 0.24s, 0.32s)
- Optional `<FadeIn stage={1}>` wrapper component for cleaner JSX
- Page transitions: fade-out (0.18s) → content swap → fade-in with stagger
- Use `Suspense` boundaries for natural loading states
**Depends on:** Task 0.1
**Success:** Elements fade in with stagger on page load/navigation

---

## Phase 2: Shared Components (Reusable Across All Pages)

Extract patterns that repeat across 50+ pages BEFORE building individual pages.

### Task 2.1: PageHeader Component
**File:** Create `apps/web/src/components/shared/PageHeader.tsx`
**What:** Reusable page header used on every page. Props: `title`, `subtitle`, `actions` (button array). Matches reference `.page-hdr` pattern: title in Newsreader serif, subtitle in muted gray, right-aligned action buttons.
**Depends on:** Phase 1
**Success:** Component renders matching all exploration page headers

### Task 2.2: DomainTabs Component
**File:** Create `apps/web/src/components/shared/DomainTabs.tsx`
**What:** Sub-navigation tabs within a domain (e.g., Banking → Accounts | Transactions | Reconciliation | Imports | Transfers). Glass background pill tabs, active state with dark bg + white text. Props: `tabs[]` with `label`, `href`, `active`. Uses `usePathname()` for active detection.
**Depends on:** Phase 1
**Success:** Tabs render for all 8 domains matching reference

### Task 2.3: StatsGrid Component
**File:** Create `apps/web/src/components/shared/StatsGrid.tsx`
**What:** Reusable 3/4/5-column stats grid used on Banking, Transactions, Invoicing, Accounting, Clients, etc. Props: `stats[]` with `label` (uppercase tiny), `value` (mono font), `trend` (up/down/flat + text), `color?`. Glass card per stat, hover lift effect.
**Depends on:** Phase 1
**Success:** Component renders matching all exploration stats grids (stats-3, stats-4, stats-5 variants)

### Task 2.4: DataTable Component
**File:** Create `apps/web/src/components/shared/DataTable.tsx`
**What:** Reusable table with sticky header, row hover, click handler, optional checkbox column. Column types: `date` (mono), `description` (icon + text + subtitle), `tag` (colored badge), `account` (tiny text), `status` (dot + label), `amount` (mono, color-coded), `progress` (mini bar). Pagination footer. Uncategorized row indicator (amber left border).
**Depends on:** Phase 1
**Success:** Table matches reference txn-table and inv-table styling across all pages

### Task 2.5: Command Palette
**File:** Create `apps/web/src/components/shared/CommandPalette.tsx`
**What:**
- Cmd+K / Ctrl+K opens overlay (blur background, centered 520px dialog at 16vh top)
- Search input with category tabs (All / Search / Actions / Navigate / Ask AI)
- Result items: icon + name + description + keyboard shortcut
- AI suggestion row at bottom (dot + italic Newsreader text)
- Footer with keyboard hints (arrows, Enter, Tab, Esc)
- Wire to: page navigation (all 50+ routes), basic search
- Escape or overlay click to close
- Portal rendered in layout.tsx
**Depends on:** Phase 1
**Success:** Cmd+K opens palette, navigation works, keyboard accessible

### Task 2.6: Detail Slide-Out Panel
**File:** Create `apps/web/src/components/shared/DetailPanel.tsx`
**What:**
- Fixed right panel (420px), translateX slide-in animation
- Dark overlay (45% opacity) behind panel
- Close button (top right), Escape key handler
- Configurable content via render prop or slots
- Pre-built detail templates: TransactionDetail, InvoiceDetail, AccountDetail, ClientDetail
- Badge, title, subtitle, amount display, row pairs (label + value), action buttons
- Zustand store for open/close state + content type + data
**Depends on:** Phase 1
**Success:** Panel slides in from right, shows detail content, closes on Escape/overlay click

### Task 2.7: SectionHeader Component
**File:** Create `apps/web/src/components/shared/SectionHeader.tsx`
**What:** Section header with title (Newsreader serif) + meta text + optional inline tabs. Matches reference `.sec-h` pattern. Used in every section within pages.
**Depends on:** Phase 1
**Success:** Component renders matching all exploration section headers

### Task 2.8: TwoColumnLayout Component
**File:** Create `apps/web/src/components/shared/TwoColumnLayout.tsx`
**What:** Two-column layout (main content | 340px right column). Responsive: stacks vertically below 1100px. Used in Overview, Accounting, and other pages with sidebar content.
**Depends on:** Phase 1
**Success:** Layout matches reference `.two-col` pattern with responsive breakpoint

---

## Phase 3: Overview Page Redesign

The overview is the first page users see — the most dramatic transformation.

### Task 3.1: Greeting Header + Liquidity Hero
**File:** Create `apps/web/src/components/dashboard/LiquidityHero.tsx`
**What:** Greeting ("Good evening, Sunny" + date). Below: Total Global Liquidity card with gradient background, large mono amount ($1.4M CAD eq), trend indicator (+6.8%), net change, currency breakdown (USD/GBP/INR/CAD with percentages).
**Depends on:** Phase 2
**Success:** Hero renders with real data from API (total balance, currency breakdown)

### Task 3.2: Liquidity Matrix
**File:** Create `apps/web/src/components/dashboard/LiquidityMatrix.tsx`
**What:** Grid of entity cards (auto-fill, minmax 260px). Each card: entity name + icon + account count → account list rows (bank logo abbreviation + name + balance in mono). Grouped by entity with total liquid amount. Cards are glass with border, click-through to account detail.
**Depends on:** Phase 2
**Success:** Matrix shows entities with accounts, matches reference layout

### Task 3.3: Spark Cards Row
**File:** Create `apps/web/src/components/dashboard/SparkCards.tsx`
**What:** 5-card horizontal row (Revenue, Expenses, Profit, Receivables, Runway). Each card: glass bg, uppercase label (11px), mono value (18px), trend indicator, inline SVG sparkline (24px height, polyline + gradient fill). Responsive: wraps on smaller screens.
**Depends on:** Phase 2
**Success:** 5 cards with sparklines render, trend indicators show correctly

### Task 3.4: Cash Flow River Chart
**File:** Create `apps/web/src/components/dashboard/CashFlowRiver.tsx`
**What:** Canvas-based area chart (170px height) showing 60-day cash flow projection. "Today" vertical gradient line at ~42%. Hover tooltip (dark bg, mono value + date). X-axis labels (9px). Section wrapper with SectionHeader. Lazy-loaded via dynamic import.
**Depends on:** Phase 2
**Success:** Canvas renders smooth area chart, tooltip follows mouse, Today marker visible

### Task 3.5: Expense Breakdown Chart
**File:** Create `apps/web/src/components/dashboard/ExpenseChart.tsx`
**What:** Stacked bar chart with period tabs (Day/Week/Month). Legend with category dots + labels. Interactive columns with hover tooltip. Total amount + period label in header. Bottom: Top Category / Top Vendor / Largest Increase summary (3-column grid). Lazy-loaded.
**Depends on:** Phase 2
**Success:** Chart renders with mock data, tab switching works, hover tooltips show

### Task 3.6: Quick Actions + Action Items
**Files:** Create `apps/web/src/components/dashboard/QuickActions.tsx`, `apps/web/src/components/dashboard/ActionItems.tsx`
**What:**
- Quick Actions: 2x2 grid of buttons (Invoice, Scan Receipt, Bill, Transfer)
- Action Items: List of 3-5 actionable items. Each: colored icon, title, meta (amount + context), action button (Send/Review/Impact). Selected state with amber border. Click opens detail panel or navigates.
**Depends on:** Phase 2
**Success:** Actions render with proper styling, buttons trigger navigation or toasts

### Task 3.7: Right Column (AI Brief + Upcoming + Quick Stats)
**Files:** Create `apps/web/src/components/dashboard/AIBrief.tsx`, `apps/web/src/components/dashboard/UpcomingPayments.tsx`, `apps/web/src/components/dashboard/QuickStats.tsx`
**What:**
- AI Brief: Gradient background (orange→purple, 6%), dot + label + date, Newsreader italic body with bold highlights
- Upcoming: Date box (36px, glass-2) + info (name + meta) + amount (mono, color-coded)
- Quick Stats: Row pairs (label + value), border-bottom separators
**Depends on:** Phase 2
**Success:** All sections render in right column matching reference

### Task 3.8: Overview Page Assembly
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** Assemble all components with stagger classes:
1. PageHeader (greeting + date) `.fi1`
2. LiquidityHero `.fi1`
3. SectionHeader "Liquidity Matrix" `.fi2`
4. LiquidityMatrix `.fi2`
5. SectionHeader "Performance" `.fi3`
6. SparkCards `.fi3`
7. TwoColumnLayout `.fi4`:
   - Left: CashFlowRiver + ExpenseChart
   - Right: QuickActions + AIBrief + ActionItems + Upcoming + QuickStats
8. Preserve onboarding hero card (conditional, above everything)
**Depends on:** Tasks 3.1–3.7
**Success:** Overview matches reference layout, all sections load with stagger

---

## Phase 4: Banking Pages Polish

### Task 4.1: Banking Hub Page
**Files:** Refactor `apps/web/src/app/(dashboard)/banking/accounts/page.tsx`, create `apps/web/src/components/banking/AccountCardGrid.tsx`
**What:**
- PageHeader (Banking + "3 accounts, 2 currencies, Synced 2 min ago" + Sync All + Import CSV buttons)
- DomainTabs (Accounts | Transactions | Reconciliation | Imports | Transfers)
- Account Card Grid: auto-fill minmax(240px). Each card: glass bg, bank name (tiny uppercase), account name, balance (mono large), currency badge, footer (last-4-digits + sync dot). Bottom 2px accent border by type (chequing=amber, savings=blue, credit=purple). Click → account detail.
- ReconciliationBar: title + "X of Y matched" + gradient progress bar (amber→green) + percentage
- Inline transaction table (last 10 transactions from all accounts)
**Depends on:** Phase 2
**Success:** Banking hub matches reference with card grid, recon bar, and transactions

### Task 4.2: Transactions Page
**File:** Refactor `apps/web/src/app/(dashboard)/banking/transactions/page.tsx`
**What:**
- PageHeader + DomainTabs (Transactions active)
- StatsGrid (4 cols: Total, Categorized, Uncategorized, Reconciled)
- DataTable with: checkbox column, date, description (icon + text + subtitle with AI suggestion), entity, category tag (colored), account, reconciled status (dot + label), amount
- Tabs above table: All / Uncategorized / Categorized / Reconciled / Exceptions / AI Suggestions
- Account filter pills
- Pagination footer
**Depends on:** Phase 2
**Success:** Transaction table matches reference with all filter options

### Task 4.3: Imports Page
**File:** Refactor `apps/web/src/app/(dashboard)/banking/imports/page.tsx`
**What:**
- PageHeader + DomainTabs (Imports active)
- StatsGrid (3 cols: Last Import, Success Rate, Records Processed)
- Import history table (date, filename, account, records count, status badge, view button)
- Upload area preserved (existing ImportUploadForm)
**Depends on:** Phase 2
**Success:** Imports page matches reference with stats and history table

### Task 4.4: Reconciliation Page
**File:** Refactor `apps/web/src/app/(dashboard)/banking/reconciliation/page.tsx`
**What:** Restyle existing ReconciliationDashboard to match exploration design patterns (stats grid, domain tabs, glass styling). Preserve existing matching logic and API connections.
**Depends on:** Phase 2
**Success:** Reconciliation page uses shared components, matches design aesthetic

---

## Phase 5: Business Pages (Invoicing, Clients, Vendors)

### Task 5.1: Invoicing Page
**Files:** Refactor `apps/web/src/app/(dashboard)/business/invoices/page.tsx`, create components as needed
**What:**
- PageHeader ("Invoicing & Bills" + AR/AP summary)
- DomainTabs (Invoices | Bills | Clients | Vendors | Payments)
- StatsGrid (4 cols: Outstanding AR, Collected, Outstanding AP, Overdue)
- AR Aging Bar: Segmented bar (Current green, 1-30d amber, 31-60d red, 60+ dark red) + legend
- Invoice table (DataTable): number, client (+sub), entity, amount+currency, status badge (paid/sent/pending/overdue/draft), due date (red if late), collection progress bar
- Bills table below (same pattern, AP items)
**Depends on:** Phase 2
**Success:** Invoicing page has stats grid, aging bar, and both tables matching reference

### Task 5.2: Clients Page
**Files:** Refactor `apps/web/src/app/(dashboard)/business/clients/page.tsx`
**What:**
- PageHeader + DomainTabs (Clients active)
- StatsGrid (4 cols: Total Clients, Active Projects, Avg Retainer, Total Revenue YTD)
- Client directory table: Name (+sub), Contact (avatar + name + email), Entity, Open Invoices, Balance Due, Status badge, View button
- Search input in section header
**Depends on:** Phase 2
**Success:** Clients page matches reference with directory table and stats

### Task 5.3: Vendors Page
**File:** Refactor `apps/web/src/app/(dashboard)/business/vendors/page.tsx`
**What:** Mirror clients page pattern for vendors. Stats + table with vendor-specific columns.
**Depends on:** Task 5.2 (reuses patterns)
**Success:** Vendors page matches reference

---

## Phase 6: Accounting Pages

### Task 6.1: Accounting Hub Page
**File:** Refactor `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/page.tsx`
**What:**
- PageHeader (Accounting + Trial Balance/P&L Report/New Entry buttons)
- DomainTabs (Chart of Accounts | Journal Entries | Assets | Tax Rates | Fiscal Periods)
- StatsGrid (4 cols: Total Assets, Total Liabilities, Equity, Journal Entries count)
- TwoColumnLayout:
  - Left: Chart of Accounts table (code in mono, account name with type icon A/L/R/E, type badge colored, debit, credit, balance columns, totals footer row)
  - Left below: Recent Journal Entries table (entry#, date, description with Dr/Cr detail, source badge, amount, posted status)
  - Right: Trial Balance summary (debits=credits check), Fiscal Period info, Tax Summary, Month-End Checklist
**Depends on:** Phase 2
**Risk:** high (financial data display — must show accurate debit/credit/balance)
**Success:** Accounting page matches reference with COA table, journal entries, and right-column summaries

### Task 6.2: Journal Entries Page
**File:** Refactor `apps/web/src/app/(dashboard)/accounting/journal-entries/page.tsx`
**What:** Full journal entries list with DataTable. Entry number (mono, amber), date, description (icon + text + Dr/Cr detail below), source badge (Auto-Bank/Manual/Auto-Recurring), amount, posted status. Click → detail panel with full line items.
**Depends on:** Phase 2
**Success:** Journal entries table matches reference

---

## Phase 7: AI Advisor Page

### Task 7.1: AI Advisor Hub
**Files:** Refactor `apps/web/src/app/(dashboard)/ai-advisor/insights/page.tsx`, create `apps/web/src/components/ai/InsightCard.tsx`, create `apps/web/src/components/ai/IntelligenceBrief.tsx`
**What:**
- PageHeader + DomainTabs (Insights | Policy Alerts | History)
- Intelligence Brief: Gradient card (orange→purple 6%), dot + "Weekly Intelligence Brief" + date, Newsreader italic body with bold highlights
- Insight cards (expandable): Type badge (Cost Saving=green, Growth=blue, Attention=orange, Risk=red), title, confidence bar (percentage + fill), chevron toggle, peek preview text, expanded body + action button
- Expand/collapse via CSS toggle (classList.toggle)
**Depends on:** Phase 2
**Success:** AI page has brief and expandable insight cards matching reference

---

## Phase 8: Remaining Pages (Coming Soon Pattern)

### Task 8.1: Zen Placeholder for Unbuilt Pages
**File:** Create `apps/web/src/components/shared/ComingSoon.tsx`
**What:** Elegant "Coming Soon" placeholder used for pages without backend support yet. Centered layout with Newsreader italic text, decorative lines + stones, gentle fade-in. Props: `title`, `description`.
**Applies to:** Net Worth, Cash Flow, Transfers, Bills, Payments, Assets, Tax Rates, Fiscal Periods, Reports, Budgets, Goals, Forecasts, Policy Alerts, AI History, Accountant, Bookkeeping, Documents, Entities, Integrations, Rules, Users, Audit Log, Security, Settings
**Depends on:** Phase 1
**Success:** All unbuilt pages show elegant placeholder instead of blank/broken content

---

## Reference Files

- `brand/explorations/html/` — THE canonical design reference (50+ pages)
- `brand/explorations/html/styles/design-system.css` — CSS tokens (canonical values)
- `brand/explorations/html/styles/layout.css` — Shell layout patterns
- `brand/explorations/html/styles/components.css` — Component styles (1,315 lines)
- `brand/explorations/html/styles/pages.css` — Page-specific patterns
- `brand/explorations/html/js/router.js` — Domain → page mapping
- `.claude/rules/design-aesthetic.md` — Design aesthetic rules
- `apps/web/src/app/globals.css` — Current CSS tokens (to update)
- `apps/web/src/components/layout/Sidebar.tsx` — Current sidebar (to rebuild)
- `apps/web/src/components/layout/Navbar.tsx` — Current navbar (to rebuild)
- `apps/web/src/lib/navigation.ts` — Navigation domain definitions
- `apps/web/src/components/ui/glow-card.tsx` — Existing glow card (to reuse)

## Component Organization

```
apps/web/src/components/
├── layout/
│   ├── Sidebar.tsx           (Task 1.1 — rebuild)
│   ├── Navbar.tsx            (Task 1.2 — rebuild)
│   ├── EntitySelector.tsx    (Task 1.2 — new)
│   └── TopbarBreadcrumb.tsx  (Task 1.2 — new)
├── shared/
│   ├── PageHeader.tsx        (Task 2.1)
│   ├── DomainTabs.tsx        (Task 2.2)
│   ├── StatsGrid.tsx         (Task 2.3)
│   ├── DataTable.tsx         (Task 2.4)
│   ├── CommandPalette.tsx    (Task 2.5)
│   ├── DetailPanel.tsx       (Task 2.6)
│   ├── SectionHeader.tsx     (Task 2.7)
│   ├── TwoColumnLayout.tsx   (Task 2.8)
│   ├── FadeIn.tsx            (Task 1.4)
│   └── ComingSoon.tsx        (Task 8.1)
├── dashboard/
│   ├── LiquidityHero.tsx     (Task 3.1)
│   ├── LiquidityMatrix.tsx   (Task 3.2)
│   ├── SparkCards.tsx        (Task 3.3)
│   ├── CashFlowRiver.tsx     (Task 3.4)
│   ├── ExpenseChart.tsx      (Task 3.5)
│   ├── QuickActions.tsx      (Task 3.6)
│   ├── ActionItems.tsx       (Task 3.6)
│   ├── AIBrief.tsx           (Task 3.7)
│   ├── UpcomingPayments.tsx  (Task 3.7)
│   └── QuickStats.tsx        (Task 3.7)
├── banking/
│   ├── AccountCardGrid.tsx   (Task 4.1)
│   └── ReconciliationBar.tsx (Task 4.1)
├── invoicing/
│   └── AgingBar.tsx          (Task 5.1)
├── ai/
│   ├── IntelligenceBrief.tsx (Task 7.1)
│   └── InsightCard.tsx       (Task 7.1)
└── ui/ (existing shadcn components — no changes)
```

## Edge Cases

- **Mobile responsive:** Sidebar → Sheet drawer (icon-only style). Topbar: entity selector collapses to icon. Two-column layouts stack vertically. Tables get horizontal scroll.
- **No data state:** Spark cards show "—", charts show "No data" message, tables show empty state with CTA.
- **API unavailable:** Existing error handling preserved. Layout renders without data, shows connection error.
- **Onboarding in progress:** Hero card still shows above overview content (conditional, existing logic preserved).
- **Light mode:** Reference has `.light` class variant. Secondary priority — dark-first. Implement after dark mode is perfect.
- **50+ pages with no backend:** Use ComingSoon placeholder. Only build full UI for pages with API support (Overview, Banking, Transactions, Imports, Reconciliation, Invoicing, Clients, Accounting, AI Advisor).

## Performance Considerations

- **Glass morphism:** Limit `backdrop-filter: blur(16px)` to max 5-6 simultaneously visible elements. Use on sidebar, topbar, command palette overlay — not on every card.
- **GlowCard mousemove:** Throttle to requestAnimationFrame (16ms). Only on hover (not tracking globally).
- **Charts:** Lazy-load CashFlowRiver and ExpenseChart via `next/dynamic` with `{ ssr: false }`.
- **Fonts:** Already loaded (Newsreader, Manrope, JetBrains Mono). Use `font-display: swap`.
- **Animations:** CSS-only (no JS animation library). `will-change: transform, opacity` on animated elements, removed after animation completes.
- **DOM count:** Overview page has most elements (~200). Virtualize long lists if they exceed 100 rows.

## Testing Strategy

- **Visual regression:** Open app in browser, compare side-by-side with `brand/explorations/html/index.html`
- **Responsive:** Test at 768px, 1024px, 1440px, 1920px breakpoints
- **Navigation:** All sidebar icons navigate correctly, domain tabs switch pages, breadcrumb updates
- **Interaction:** Command palette opens/closes, detail panel slides, tooltips show, entity selector works
- **Existing functionality:** Onboarding flow, auth, API calls, account CRUD, import upload all still work
- **Accessibility:** Focus states visible, keyboard navigation (Tab, Escape, Enter), ARIA labels on icon buttons
- **Performance:** Lighthouse score > 90 on overview page, no jank on sidebar expand/collapse

## Estimated Scope

| Phase | Tasks | Sessions | Priority |
|-------|-------|----------|----------|
| Phase 0: Token Reconciliation | 1 | 0.5 | P0 |
| Phase 1: Shell Architecture | 4 | 2-3 | P0 |
| Phase 2: Shared Components | 8 | 2-3 | P0 |
| Phase 3: Overview Page | 8 | 3-4 | P1 |
| Phase 4: Banking Pages | 4 | 2-3 | P1 |
| Phase 5: Business Pages | 3 | 2 | P2 |
| Phase 6: Accounting Pages | 2 | 1-2 | P2 |
| Phase 7: AI Advisor | 1 | 1 | P2 |
| Phase 8: Coming Soon | 1 | 0.5 | P1 |

**Total: ~32 tasks across 8 phases, ~14-19 sessions**

## Progress

- [ ] Phase 0: Token Reconciliation
  - [ ] Task 0.1: Update globals.css tokens
- [ ] Phase 1: Shell Architecture
  - [ ] Task 1.1: Sidebar rebuild
  - [ ] Task 1.2: Rich topbar
  - [ ] Task 1.3: Layout grid
  - [ ] Task 1.4: Staggered animation system
- [ ] Phase 2: Shared Components
  - [ ] Task 2.1: PageHeader component
  - [ ] Task 2.2: DomainTabs component
  - [ ] Task 2.3: StatsGrid component
  - [ ] Task 2.4: DataTable component
  - [ ] Task 2.5: Command Palette
  - [ ] Task 2.6: Detail Slide-Out Panel
  - [ ] Task 2.7: SectionHeader component
  - [ ] Task 2.8: TwoColumnLayout component
- [ ] Phase 3: Overview Page Redesign
  - [ ] Task 3.1: Greeting Header + Liquidity Hero
  - [ ] Task 3.2: Liquidity Matrix
  - [ ] Task 3.3: Spark Cards Row
  - [ ] Task 3.4: Cash Flow River Chart
  - [ ] Task 3.5: Expense Breakdown Chart
  - [ ] Task 3.6: Quick Actions + Action Items
  - [ ] Task 3.7: Right Column (AI Brief + Upcoming + Quick Stats)
  - [ ] Task 3.8: Overview Page Assembly
- [ ] Phase 4: Banking Pages
  - [ ] Task 4.1: Banking Hub Page
  - [ ] Task 4.2: Transactions Page
  - [ ] Task 4.3: Imports Page
  - [ ] Task 4.4: Reconciliation Page
- [ ] Phase 5: Business Pages
  - [ ] Task 5.1: Invoicing Page
  - [ ] Task 5.2: Clients Page
  - [ ] Task 5.3: Vendors Page
- [ ] Phase 6: Accounting Pages
  - [ ] Task 6.1: Accounting Hub Page
  - [ ] Task 6.2: Journal Entries Page
- [ ] Phase 7: AI Advisor
  - [ ] Task 7.1: AI Advisor Hub
- [ ] Phase 8: Coming Soon
  - [ ] Task 8.1: Zen Placeholder
