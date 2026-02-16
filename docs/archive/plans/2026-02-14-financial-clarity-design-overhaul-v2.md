# Financial Clarity Design Overhaul v2 — Revised Plan

**Created:** 2026-02-14
**Supersedes:** `docs/plans/2026-02-13-financial-clarity-design-overhaul.md`
**Status:** In Progress — Slice 0 + 1 + 2 + 3 complete (23/30 tasks)
**Design Reference:** `brand/explorations/html/` (visual lookbook only)
**Design Tokens Reference:** `brand/explorations/html/styles/design-system.css`
**Aesthetic Rules:** `.claude/rules/design-aesthetic.md`

## Context

The HTML prototype at `brand/explorations/html/` is a **visual lookbook** — we study it for what things should look like, what features and labels exist, and what interactive patterns to implement. We do NOT convert its CSS structure or break our existing design system.

**Philosophy:** Evolve existing shadcn/ui + Tailwind v4 + glass-ui components to match the visual target. Restyle, don't rebuild. Keep the HSL token system intact. Add new `--ak-*` tokens alongside it.

**Review findings addressed:** All 6 P1 issues and 7 P2 issues from the 2026-02-14 multi-agent review.

---

## Current State vs Reference

| Aspect | Current | Reference (Prototype) | Gap | V2 Approach |
|--------|---------|-----------|-----|-------------|
| Sidebar | 288px wide, text labels, collapsible groups | 68px icon-only, expand on hover, tooltips, badge counts | ✅ DONE | 240px, text labels, badges + profile card |
| Topbar | Theme toggle + Clerk avatar only | Entity selector, breadcrumb, search (Cmd+K), sync, notifications | ✅ DONE | Entity selector, breadcrumb, search trigger |
| Layout | Flex-based, sidebar + main | CSS Grid: 68px 1fr x 56px 1fr | ✅ DONE | Flex preserved, widths adjusted |
| Overview | Title + onboarding + entities + 4 metric cards | Liquidity Matrix, sparklines, Cash Flow canvas, Expense chart, AI Brief, Quick Actions | ✅ DONE | LiquidityHero + SparkCards + Charts + AI Brief + TwoColumnLayout |
| Banking | Balance hero + account rows in GlowCards | Account card grid, recon bar, rich transaction table | ✅ DONE | StatsGrid + DomainTabs + accent borders |
| Transactions | Basic table + filters | Stats grid, checkboxes, AI badges, expanded filter tabs, pagination | ✅ DONE | StatsGrid + AI badges + expanded filters |
| Invoicing | Placeholder page | Stats grid, AR Aging bar, invoice/bills tables | New build | Build with shared components, mock data |
| Accounting | Basic COA list + journal entries | COA table with debit/credit/balance, trial balance sidebar | Enhancement | **Restyle** existing, add TwoColumnLayout |
| AI Advisor | Placeholder page | Intelligence Brief, expandable insight cards | New build | Build new components |
| Clients/Vendors | Placeholder pages | Stats grid, directory table with avatar + contact | New build | Build with shared components, mock data |
| Command Palette | None | Cmd+K overlay with categories, keyboard nav | New feature | New component, lazy-loaded |
| Detail Panel | None | 420px slide-out right panel | ✅ DONE | URL state (searchParams), lazy-loaded |
| Animations | None | Staggered fade-in (fi1-fi6), hover lifts | ✅ DONE | CSS keyframes + fi1-fi6 classes |
| Domain Tabs | None | Per-domain sub-navigation pills | ✅ DONE | DomainTabs component + banking layout |

## Success Criteria

- [x] App shell: 240px sidebar (restyled), 56px topbar (enriched), flex layout preserved
- [x] Overview: Liquidity hero, entity matrix, spark cards, charts, AI brief, two-column layout
- [x] Banking: Account cards with accent borders, StatsGrid, DomainTabs, transaction table with AI badges
- [x] All active pages: Domain sub-tabs, stats grids, staggered fade-in animations
- [ ] Command palette (Cmd+K) with navigation and search
- [x] Detail slide-out panel for transactions/invoices/accounts (URL-driven state)
- [x] Design tokens: `--ak-*` namespace added alongside shadcn HSL vars
- [x] Glass utilities updated (no blur on cards, blur only on shell + overlays)
- [x] All existing functionality preserved (auth, onboarding, API connections)
- [x] Dark mode matches reference aesthetic
- [x] Mobile responsive (sidebar → sheet, topbar adapts, tables scroll horizontally)

---

## Slice 0: Token & Utility Foundation

### Task 0.1: Add `--ak-*` Token Namespace
**Modify:** `apps/web/src/app/globals.css`

Add inside `.dark {}` block (alongside existing shadcn HSL vars — do NOT touch `--background`, `--primary`, etc.):

```css
/* ── Akount Design Tokens (parallel namespace) ── */
--ak-pri: #F59E0B;          --ak-pri-hover: #FBBF24;
--ak-pri-dim: rgba(245,158,11,0.18);   --ak-pri-glow: rgba(245,158,11,0.12);
--ak-pri-text: #FFB02E;     --ak-pri-active: rgba(245,158,11,0.25);

--ak-green: #34D399;   --ak-green-dim: rgba(52,211,153,0.18);
--ak-red: #F87171;     --ak-red-dim: rgba(248,113,113,0.18);
--ak-blue: #60A5FA;    --ak-blue-dim: rgba(96,165,250,0.18);
--ak-purple: #A78BFA;  --ak-purple-dim: rgba(167,139,250,0.18);
--ak-teal: #2DD4BF;    --ak-teal-dim: rgba(45,212,191,0.18);

--ak-bg-0: #09090F;  --ak-bg-1: #0F0F17;  --ak-bg-2: #15151F;
--ak-bg-3: #1A1A26;  --ak-bg-4: #22222E;

--ak-glass: rgba(255,255,255,0.035);   --ak-glass-2: rgba(255,255,255,0.06);
--ak-glass-3: rgba(255,255,255,0.09);
--ak-border: rgba(255,255,255,0.09);   --ak-border-2: rgba(255,255,255,0.14);
--ak-border-3: rgba(255,255,255,0.20);

--ak-t1: #FFFFFF;  --ak-t2: #A1A1AA;  --ak-t3: #71717A;  --ak-t4: #52525B;

--ak-sidebar: 240px;  --ak-topbar: 56px;
--ak-r: 16px;  --ak-r-sm: 10px;  --ak-r-xs: 6px;
--ak-ease: cubic-bezier(0.16,1,0.3,1);
--ak-ease2: cubic-bezier(0.4,0,0.2,1);
```

### Task 0.2: Update Glass Utilities + Add `glass-blur`
**Modify:** `apps/web/src/app/globals.css`

- Update `glass` background `0.025→0.035`, border `0.06→0.09`
- Update `glass-2` background `0.04→0.06`, border `0.09→0.14`
- Update `glass-3` background `0.06→0.09`, border `0.13→0.20`
- **REMOVE** `backdrop-filter: blur(16px)` from all 3 glass utilities (cards don't need blur on `#09090F` bg — performance P1 fix)
- **ADD** new `@utility glass-blur` with `backdrop-filter: blur(16px)` + `-webkit-backdrop-filter: blur(16px)` for sidebar/topbar/overlays only

### Task 0.3: Animation Keyframes + Stagger Classes
**Modify:** `apps/web/src/app/globals.css`

- `@keyframes fi` (fade-in): `from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none }`, 0.45s var(--ak-ease)
- `.fi` base class: `opacity:0; transform:translateY(10px); animation: fi 0.45s var(--ak-ease) forwards`
- `.fi1`–`.fi6` delay stages: 0.06s, 0.12s, 0.20s, 0.28s, 0.36s, 0.44s
- `@keyframes dd-in` (dropdown appear): `from { opacity:0; translateY(-4px) } to { opacity:1; transform:none }`
- `@keyframes pb` (pulse breathing): scale 1→1.06→1, box-shadow pulse
- `@keyframes pr` (pulse ring): scale 1→1.07→1, opacity 0.4→0.9

### Task 0.4: GlowCard rAF Throttle
**Modify:** `apps/web/src/components/ui/glow-card.tsx`

Wrap `handleMouseMove` in `requestAnimationFrame` throttle using a ref (`frameRef`). Cancel pending frame on unmount via cleanup in `useEffect`.

**Reference:** `brand/explorations/html/styles/design-system.css` for token values
**Depends on:** Nothing
**Verifies:** Glass cards render without blur, `--ak-*` tokens usable in `var()`, stagger animations work, GlowCard smooth on 120Hz

---

## Slice 1: Shell Polish

### Task 1.1: Sidebar Restyle
**Modify:** `apps/web/src/components/layout/Sidebar.tsx`
**Modify:** `apps/web/src/app/(dashboard)/layout.tsx` (width: `md:w-72`→`md:w-60`, `md:pl-72`→`md:pl-60`)

- Sidebar from 288px to 240px. Add `glass-blur` bg class.
- Active domain: `bg-[var(--ak-pri-dim)]` + 2px left border `border-l-primary`
- Add thin dividers between domain groups (`border-b border-[var(--ak-border)]`)
- Logo at top: Restyle "Akount" text as `text-primary font-heading text-lg` (or small gradient orb 34x34)
- **Badge counts** on domains: Banking (unmatched txns count), Business (overdue count), AI (new insights count). Pass as props from layout data.
- Add user profile card at bottom (below SidebarProgressIndicator): Clerk `useUser()` → initials avatar circle + name + plan tier badge
- Add `aria-label` on all domain buttons, `aria-expanded` on collapsible triggers
- Focus retention: when collapsing, focus stays on trigger
- Keep existing domain expand/collapse behavior (multiple open) and MobileSidebar Sheet
- Keyboard 1-8 domain switching (stretch goal)

### Task 1.2: Topbar Enrichment
**Modify:** `apps/web/src/components/layout/Navbar.tsx` (currently 35 lines, very minimal)
**Create:** `apps/web/src/components/layout/EntitySelector.tsx`

- Set height to 56px (`h-14`), add `glass-blur` + bottom border
- **Left:** EntitySelector — uses URL `searchParams` (`?entityId=X`) via `router.push()` (**NOT Zustand** — P1 fix). Local `useState` for dropdown open/close only. Shows: colored dot + entity name + entity type + chevron → dropdown with entity list + active checkmarks + "Add Entity" at bottom.
- **Center-left:** Breadcrumb from `usePathname()` — parse path segments, capitalize, link each (domain / sub-page)
- **Center:** Read-only search input "Search... Cmd+K" — click opens CommandPalette (wired in Slice 6)
- **Right:** Sync button (rotate icon), theme toggle, help button, notification bell (amber dot indicator, static), Clerk UserButton
- Responsive: entity selector collapses to icon on small screens, search hides below md

### Task 1.3: DomainTabs + Banking Layout
**Create:** `apps/web/src/components/shared/DomainTabs.tsx`
**Create:** `apps/web/src/app/(dashboard)/banking/layout.tsx`

- DomainTabs: `{ label, href }[]`, `usePathname()` for active detection. Glass pill tabs container: active = `bg-[var(--ak-bg-4)] text-white`, inactive = `text-[var(--ak-t3)] hover:text-[var(--ak-t2)]`. Horizontal scroll on mobile.
- Banking layout wraps children with DomainTabs: Accounts | Transactions | Reconciliation | Imports | Transfers
- Reusable: other domain layouts (business, accounting, etc.) pass different tab configs

### Task 1.4: Layout Spacing
**Modify:** `apps/web/src/app/(dashboard)/layout.tsx`

- Update sidebar width refs (`md:w-60`, `md:pl-60`)
- Add custom scrollbar on main content area (5px width, border color, rounded)
- Ensure consistent page padding (`p-6` or `px-8 py-6`)
- Keep flex layout — **NO grid switch** (P1 fix: compatibility preserved)

**Reference:** `brand/explorations/html/styles/layout.css` for visual target
**Depends on:** Slice 0
**Verifies:** Sidebar 240px with badges + profile card, topbar has entity selector + breadcrumb + search, banking pages show DomainTabs

---

## Slice 2: Banking Vertical (Extract Shared Components Here)

Build banking pages first (highest traffic), extract shared components FROM this work.

### Task 2.1: StatsGrid Component
**Create:** `apps/web/src/components/shared/StatsGrid.tsx`

Props: `stats: Array<{ label: string; value: string; trend?: { direction: 'up'|'down'|'flat'; text: string }; color?: string }>`, `columns?: 3|4|5`.
Responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`). Each stat card: glass (no blur), uppercase 10px tracking-wide label (muted), mono value (text-lg), colored trend text + arrow. Hover: border brightens, subtle `translateY(-2px)`. Stagger: each card gets `.fi` class.

### Task 2.2: SectionHeader Component
**Create:** `apps/web/src/components/shared/SectionHeader.tsx`

Props: `title` (serif font-heading), `meta?` (mono, muted, right-aligned), `actions?` (ReactNode, far right), `tabs?` (inline section-level tabs). Thin bottom border. Flex layout with gap.

### Task 2.3: Enhance PageHeader
**Modify:** `apps/web/src/components/shared/PageHeader.tsx` (currently breadcrumbs-only, 48 lines)

Add optional `title` + `subtitle` props. When provided: render Newsreader heading (`font-heading text-2xl`) + muted subtitle (`text-sm text-[var(--ak-t3)]`) below existing breadcrumbs. Keep existing breadcrumb + actions behavior.

### Task 2.4: Restyle Banking Accounts Page
**Modify:** `apps/web/src/app/(dashboard)/banking/accounts/page.tsx`
**Modify:** `apps/web/src/components/accounts/AccountsPageHeader.tsx`
**Modify:** `apps/web/src/components/accounts/AccountRow.tsx`
**Modify:** `apps/web/src/components/accounts/AccountsBalanceHero.tsx`

- PageHeader: Use enhanced PageHeader with title "Banking" + subtitle "N accounts, N currencies, Synced N min ago" + Sync All + Import CSV buttons
- Add StatsGrid above account list (Total Accounts, Total Balance, Currencies, Unreconciled)
- AccountRow: add 2px bottom accent border by account type (amber=chequing, blue=savings, purple=credit card). Already uses GlowCard — keep, just add accent.
- ReconciliationBar: add progress bar below stats (title + "X of Y matched" + gradient bar amber→green + percentage)
- Wrap sections in `.fi .fi1`–`.fi4` stagger classes
- DomainTabs inherited from `banking/layout.tsx`

### Task 2.5: Restyle Transactions Page
**Modify:** `apps/web/src/app/(dashboard)/banking/transactions/page.tsx`
**Modify:** `apps/web/src/components/accounts/TransactionsTableClient.tsx`
**Modify:** `apps/web/src/components/accounts/TransactionsToolbar.tsx`

- Add PageHeader with title "Transactions" + subtitle "N transactions · Month Year · All entities"
- Add StatsGrid (4 cols: Total, Categorized, Uncategorized, Reconciled)
- TransactionsToolbar: Expand tab filters: All | Uncategorized | Categorized | Reconciled | Exceptions | AI Suggestions. Add account filter pills (pill-shaped, active = amber dim bg + amber text).
- TransactionsTableClient enhancements:
  - Optional checkbox column (30px wide)
  - Date column: mono, muted
  - Description: icon cell (30x30 rounded, colored bg) + text + AI subtitle (9px, confidence hint)
  - Entity column (if multi-entity): small flag + name
  - Category tag: colored badge (uncategorized=amber, matched=green, AI=purple) — 11px, uppercase, bold
  - Account: 10px muted (bank name + last-4)
  - Reconciled: status dot (6px) + label (pending=amber, matched=green, none=grey)
  - Amount: mono, right-aligned, green for inflow, white for outflow
  - Uncategorized rows: 2px amber left border
- Keep existing pagination

### Task 2.6: Restyle Imports Page
**Modify:** Banking imports page + components

- Add PageHeader + StatsGrid (3 cols: Last Import, Success Rate, Records Processed)
- Style import history table: date, filename, account, records count, status badge (colored), view button
- Preserve existing ImportUploadForm, FileListEditor, UploadProgressList, BatchImportResults

### Task 2.7: Restyle Reconciliation Page
**Modify:** `apps/web/src/app/(dashboard)/banking/reconciliation/page.tsx`

- Add DomainTabs (Reconciliation active) + PageHeader + StatsGrid
- Restyle existing ReconciliationDashboard to match aesthetic (glass cards, correct border/bg)
- Preserve existing matching logic and API connections

### Task 2.8: DetailPanel (Transaction Detail)
**Create:** `apps/web/src/components/shared/DetailPanel.tsx`

- 420px slide-from-right panel. `position: fixed`, `translateX(100%)` → `translateX(0)` animation (0.25s ease)
- Dark overlay behind (45% opacity `rgba(9,9,15,0.45)`), click-to-close
- Close button (top right, 28x28 rounded), Escape key handler
- State via URL `searchParams` (`?panel=txn_{id}`) — **NOT Zustand** (P2 fix)
- Lazy-load via `next/dynamic({ ssr: false })` (bundle splitting)
- Content structure: badge (status) → title (serif 1.3rem) → subtitle → amount (mono 1.6rem + currency) → detail rows (label + value pairs, border-bottom) → action buttons
- Pre-built templates: TransactionDetail, InvoiceDetail, AccountDetail, ClientDetail

**Reference:** `brand/explorations/html/pages/banking-new.html`, `transactions.html`, `imports.html`, `reconciliation.html`
**Depends on:** Slice 1 (DomainTabs)
**Verifies:** All 4 banking pages have StatsGrid + DomainTabs + styled content, detail panel slides in on row click

---

## Slice 3: Overview Redesign

### Task 3.1: Greeting + LiquidityHero
**Create:** `apps/web/src/components/dashboard/LiquidityHero.tsx`

- Greeting: "Good [morning/afternoon/evening], [firstName]" + formatted date. Clerk user data.
- Liquidity card: GlowCard with gradient accent, large mono balance ($1.4M CAD eq), trend indicator (+6.8% + net change), currency breakdown pills (USD/GBP/INR/CAD with percentages).
- Fetch from existing Overview API metrics.

### Task 3.2: Entity/Account Matrix
**Modify:** `apps/web/src/components/dashboard/EntitiesList.tsx`

Transform to grid of entity cards (`auto-fill, minmax(260px)`). Each card: glass bg + border, entity name + icon + account count header → account list rows (bank logo abbreviation + name + balance in mono). Grouped by entity with total liquid amount. Click-through to account detail.

### Task 3.3: SparkCards
**Create:** `apps/web/src/components/dashboard/SparkCards.tsx`

5 KPI cards in responsive row: Revenue, Expenses, Profit, Receivables, Runway. Each: glass card (no blur), uppercase label (11px, muted), mono value (18px), trend indicator (green/red + text), inline SVG sparkline (polyline + gradient fill, 24px height). Responsive: wraps on smaller screens. Mock data initially.

### Task 3.4: Charts (Lazy-loaded)
**Create:** `apps/web/src/components/dashboard/CashFlowChart.tsx`
**Create:** `apps/web/src/components/dashboard/ExpenseChart.tsx`

Both via `next/dynamic({ ssr: false })`.
- CashFlowChart: Canvas/SVG area chart, 170px height, 60-day projection, "Today" vertical gradient line at ~42%, hover tooltip (dark bg, mono value + date), x-axis labels (9px).
- ExpenseChart: Stacked bar chart with period tabs (Day/Week/Month), legend with category dots, hover tooltips, total amount in header, bottom 3-column summary (Top Category / Top Vendor / Largest Increase).
- Mock data initially. Wire to real API when available.

### Task 3.5: Quick Actions + Action Items
**Create:** `apps/web/src/components/dashboard/QuickActions.tsx`
**Create:** `apps/web/src/components/dashboard/ActionItems.tsx`

- QuickActions: 2x2 grid of CTA buttons (Invoice, Scan Receipt, Bill, Transfer). Glass buttons with icons.
- ActionItems: List of 3-5 actionable items. Each: colored icon cell (34x34), title, meta (amount + context), action button (Send/Review/Impact). Selected state: amber border + glow. Click opens detail panel or navigates.

### Task 3.6: Right Column Components
**Create:** `apps/web/src/components/dashboard/AIBrief.tsx`
**Create:** `apps/web/src/components/dashboard/UpcomingPayments.tsx`
**Create:** `apps/web/src/components/dashboard/QuickStats.tsx`
**Create:** `apps/web/src/components/shared/TwoColumnLayout.tsx`

- AIBrief: Gradient card (orange→purple at 6% opacity), border `rgba(245,158,11,0.08)`, dot + "AI ADVISOR" label (11px orange uppercase) + date, Newsreader italic body with bold highlights.
- UpcomingPayments: List with date box (36px glass-2) + info (name + meta) + amount (mono, color-coded).
- QuickStats: Row pairs (label + value), border-bottom separators.
- TwoColumnLayout: `grid-cols-1 lg:grid-cols-[1fr_340px]` gap-6. Stacks below lg breakpoint.

### Task 3.7: Overview Assembly
**Modify:** `apps/web/src/app/(dashboard)/overview/page.tsx`

Assemble all components with stagger:
1. PageHeader (greeting + date) `.fi .fi1`
2. LiquidityHero `.fi .fi1`
3. SectionHeader "Liquidity Matrix" `.fi .fi2`
4. Entity/Account Matrix `.fi .fi2`
5. SectionHeader "Performance" `.fi .fi3`
6. SparkCards `.fi .fi3`
7. TwoColumnLayout `.fi .fi4`:
   - Left: CashFlowChart + ExpenseChart (Suspense boundaries)
   - Right: QuickActions + AIBrief + ActionItems + UpcomingPayments + QuickStats
8. Preserve OnboardingHeroCard (conditional, above everything)

**Reference:** `brand/explorations/html/pages/overview-new.html`
**Depends on:** Slice 2 (shared components)
**Verifies:** Overview renders all sections, stagger animations, charts lazy-load, responsive stacking, onboarding card still works

---

## Slice 4: Business Pages

### Task 4.1: Business Domain Layout + Invoicing
**Create:** `apps/web/src/app/(dashboard)/business/layout.tsx` (DomainTabs)
**Create:** `apps/web/src/components/invoicing/AgingBar.tsx`
**Modify:** `apps/web/src/app/(dashboard)/business/invoices/page.tsx`

- DomainTabs: Invoices | Bills | Clients | Vendors | Payments
- PageHeader "Invoicing & Bills" + AR/AP summary subtitle
- StatsGrid (4 cols: Outstanding AR, Collected (Feb), Outstanding AP, Overdue)
- AgingBar: Segmented horizontal bar (Current=green, 1-30d=amber, 31-60d=red, 60+=dark red) with legend below (dot + label + $amount)
- Invoice table: number (mono), client (+subtitle), entity, amount+currency (mono right), status badge (paid=green, sent=blue, pending=amber, overdue=red, draft=muted), due date (red if late), collection progress bar (48x3px, colored fill)
- Bills table below (same pattern for AP items)
- Mock data until backend built

### Task 4.2: Clients + Vendors Pages
**Modify:** `apps/web/src/app/(dashboard)/business/clients/page.tsx`
**Modify:** `apps/web/src/app/(dashboard)/business/vendors/page.tsx`

- Clients: StatsGrid (4: Total Clients, Active Projects, Avg Retainer, Revenue YTD) + directory table (name+subtitle, contact with initials avatar + name + email, entity, open invoices, balance due, status badge, view button). Search input in SectionHeader.
- Vendors: Mirror clients pattern with vendor-specific metrics. Mock data.

**Reference:** `brand/explorations/html/pages/invoicing.html`, `clients.html`, `vendors.html`
**Depends on:** Slice 2

---

## Slice 5: Accounting Pages

### Task 5.1: Accounting Hub (COA)
**Create:** `apps/web/src/app/(dashboard)/accounting/layout.tsx` (DomainTabs)
**Modify:** `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/page.tsx`

- DomainTabs: Chart of Accounts | Journal Entries | Assets | Tax Rates | Fiscal Periods
- PageHeader "Accounting" + action buttons (Trial Balance, P&L Report, New Entry)
- StatsGrid (4: Total Assets, Total Liabilities, Equity, Journal Entries count)
- TwoColumnLayout:
  - Left: COA table (code in mono, account name with type icon A/L/R/E, type badge colored, debit column, credit column, balance column, totals footer row) + Recent Journal Entries table below
  - Right: Trial Balance summary (debits=credits check), Fiscal Period info, Tax Summary, Month-End Checklist

### Task 5.2: Journal Entries Page
**Modify:** `apps/web/src/app/(dashboard)/accounting/journal-entries/page.tsx`

- PageHeader + DomainTabs (Journal Entries active)
- Journal entries table: entry# (mono, amber), date, description (icon + text + Dr/Cr detail below), source badge (Auto-Bank/Manual/Auto-Recurring), amount (mono), posted status (dot + label)
- Click opens DetailPanel with full line items (debit/credit per GL account)

**Reference:** `brand/explorations/html/pages/accounting-new.html`, `journal-entries.html`
**Depends on:** Slice 2 (shared components), Slice 3 (TwoColumnLayout)

---

## Slice 6: AI Advisor + Command Palette + ComingSoon

### Task 6.1: Command Palette
**Create:** `apps/web/src/components/shared/CommandPalette.tsx`
**Modify:** `apps/web/src/app/(dashboard)/layout.tsx` (add portal render)

- Cmd+K / Ctrl+K opens overlay (blur background, centered 520px dialog at 16vh from top)
- Search input with category tabs (All | Search | Actions | Navigate | Ask AI) — active tab = amber dim + amber text
- Result items: icon (26px glass square) + name (12px) + description (9px muted) + keyboard shortcut hint (mono, 9px, right)
- Section labels: 9px uppercase, muted, tracking-wide
- AI suggestion row at bottom: gradient bg (orange+purple 4%), serif italic, dot
- Footer with keyboard hints (up/down Navigate, Enter Select, Tab Category, Esc Close)
- Wire to: page navigation (all routes from `navigation.ts`), basic search
- Escape or overlay click to close
- Lazy-load via `next/dynamic({ ssr: false })`
- Wire the search trigger in Navbar (Task 1.2) to open this

### Task 6.2: AI Advisor Hub
**Create:** `apps/web/src/app/(dashboard)/ai-advisor/layout.tsx` (DomainTabs)
**Create:** `apps/web/src/components/ai/IntelligenceBrief.tsx`
**Create:** `apps/web/src/components/ai/InsightCard.tsx`
**Modify:** `apps/web/src/app/(dashboard)/ai-advisor/insights/page.tsx`

- DomainTabs: Insights | Policy Alerts | History
- IntelligenceBrief: Gradient card (orange→purple 6%), dot + "Weekly Intelligence Brief" label (11px orange uppercase) + date, Newsreader italic body with bold highlights, radial glow pseudo-element
- InsightCard (expandable): Type badge (Cost Saving=green, Growth=blue, Attention=amber, Risk=red), title (13px white), confidence bar (50px x 2px track + colored fill + percentage text), chevron toggle, peek text (collapsed) vs full body + action button (expanded). CSS toggle expand with smooth animation.
- Mock insight data

### Task 6.3: ComingSoon Placeholder
**Create:** `apps/web/src/components/shared/ComingSoon.tsx`

- Centered layout, Newsreader italic heading, description text, decorative SVG, gentle `.fi` fade-in
- Props: `title`, `description`
- Apply to ALL pages without backend: Net Worth, Cash Flow, Transfers, Bills, Payments, Assets, Tax Rates, Fiscal Periods, Reports, Budgets, Goals, Forecasts, Policy Alerts, AI History, Accountant, Bookkeeping, Documents, Entities, Integrations, Rules, Users, Audit Log, Security, Settings (~24 pages)

**Reference:** `brand/explorations/html/pages/ai-new.html`
**Depends on:** Slice 1

---

## Key Architectural Decisions (Review P1 Fixes)

| Issue | Wrong Approach (V1) | Correct Approach (V2) |
|-------|---------------------|----------------------|
| Entity selector state | Zustand store | URL `searchParams` + `router.push()` — SSR-compatible |
| Token system | Overwrite shadcn HSL vars | Parallel `--ak-*` namespace — nothing breaks |
| Layout structure | Switch to CSS Grid | Keep flex, adjust widths — no page breakage |
| Sidebar expand | Animate width 68→240px | Keep 240px, restyle in place — no relayout jank |
| Glass blur budget | `backdrop-filter` on every card | Remove from cards, keep on shell + overlays only |
| Detail panel state | Zustand store | URL `searchParams` (`?panel=...`) — SSR-compatible, deep-linkable |
| Domain tabs | Re-render on every page | Domain `layout.tsx` renders once — no re-mount |
| Stagger + streaming | CSS staggers on Suspense content | Staggers on non-streaming only; simple fade for Suspense |

---

## Edge Cases

- **Mobile responsive:** Sidebar → Sheet drawer (existing pattern). Topbar: entity selector collapses to icon. TwoColumnLayout stacks vertically. Tables get horizontal scroll. DomainTabs get horizontal scroll.
- **No data state:** Spark cards show "—", charts show "No data" message, tables show empty state with CTA button (existing pattern from banking pages).
- **API unavailable:** Existing error handling preserved in layout.tsx (connection error screen). Layout renders without data.
- **Onboarding in progress:** Hero card still shows above overview content (conditional, existing logic preserved).
- **Light mode:** Secondary priority — dark-first. Reference has `.light` class variant with full token set. Implement after dark mode is polished. V2 doesn't touch light mode tokens.
- **50+ pages with no backend:** Use ComingSoon placeholder (Task 6.3). Only build full UI for pages with API support: Overview, Banking (4 sub-pages), Invoicing, Clients, Vendors, COA, Journal Entries, AI Advisor.

## Performance Considerations

- **Glass blur:** Removed from card-level glass utilities. Only sidebar + topbar + command palette overlay + detail panel overlay use `glass-blur`. Max 3-4 blur elements visible simultaneously.
- **GlowCard mousemove:** Throttled to requestAnimationFrame (Task 0.4). Only tracks on hover.
- **Charts:** Lazy-loaded via `next/dynamic({ ssr: false })`. Canvas rendering off main thread.
- **CommandPalette + DetailPanel:** Lazy-loaded, 0 cost until first use.
- **Fonts:** Already loaded (Newsreader, Manrope, JetBrains Mono). No changes needed.
- **Animations:** CSS-only (no JS library). No `will-change` on static elements (browser auto-promotes during animation).
- **DOM count:** Overview is heaviest (~200 elements). Virtualize long lists only if >100 rows.
- **Stagger + streaming conflict:** CSS staggers fire on paint. Use staggers only for non-Suspense content. Suspense children get simple opacity fade on mount.

## Testing Strategy

- **Visual regression:** Open app in browser, compare side-by-side with `brand/explorations/html/index.html`
- **Responsive:** Test at 768px, 1024px, 1440px, 1920px breakpoints
- **Navigation:** Sidebar links navigate correctly, DomainTabs switch pages, breadcrumb updates, entity selector persists via URL
- **Interaction:** Command palette opens/closes (Cmd+K), detail panel slides (row click), entity selector works, tooltips show
- **Existing functionality:** Onboarding flow, auth, API calls, account CRUD, import upload, reconciliation all still work
- **Accessibility:** Focus states visible, keyboard Tab navigation, Escape closes overlays, ARIA labels on sidebar buttons, `aria-expanded` on collapsibles
- **Performance:** Lighthouse score > 90 on overview, no jank on scroll/hover, < 5 blur elements visible
- **Build check:** `pnpm --filter web build` passes with no TypeScript errors after each slice

---

## Reference Files

| File | Purpose |
|------|---------|
| `brand/explorations/html/` | Canonical visual reference (50+ pages) |
| `brand/explorations/html/styles/design-system.css` | Token values (colors, glass, borders, animations) |
| `brand/explorations/html/styles/layout.css` | Shell layout patterns (sidebar, topbar) |
| `brand/explorations/html/styles/components.css` | Component styles (1,315 lines) |
| `brand/explorations/html/styles/pages.css` | Page-specific patterns |
| `brand/explorations/html/js/router.js` | Domain → page mapping |
| `.claude/rules/design-aesthetic.md` | Design aesthetic rules |
| `apps/web/src/app/globals.css` | Current CSS tokens (to update) |
| `apps/web/src/components/layout/Sidebar.tsx` | Current sidebar (to restyle) |
| `apps/web/src/components/layout/Navbar.tsx` | Current navbar (to enrich) |
| `apps/web/src/lib/navigation.ts` | Navigation domain definitions (8 domains, 50+ routes) |
| `apps/web/src/components/ui/glow-card.tsx` | Existing glow card (to fix throttle) |
| `apps/web/src/components/shared/PageHeader.tsx` | Existing page header (to enhance) |
| `apps/web/src/components/shared/StatPill.tsx` | Existing stat pill (to keep, inform StatsGrid design) |

## Component Organization (Final State)

```
apps/web/src/components/
  layout/
    Sidebar.tsx           (Slice 1 — restyle)
    Navbar.tsx            (Slice 1 — enrich)
    EntitySelector.tsx    (Slice 1 — new)
  shared/
    PageHeader.tsx        (Slice 2 — enhance existing)
    StatPill.tsx          (existing, keep as-is)
    DomainTabs.tsx        (Slice 1 — new)
    StatsGrid.tsx         (Slice 2 — new)
    SectionHeader.tsx     (Slice 2 — new)
    TwoColumnLayout.tsx   (Slice 3 — new)
    DetailPanel.tsx       (Slice 2 — new)
    CommandPalette.tsx    (Slice 6 — new)
    ComingSoon.tsx        (Slice 6 — new)
  dashboard/
    LiquidityHero.tsx     (Slice 3 — new)
    SparkCards.tsx         (Slice 3 — new)
    CashFlowChart.tsx     (Slice 3 — new)
    ExpenseChart.tsx       (Slice 3 — new)
    QuickActions.tsx       (Slice 3 — new)
    ActionItems.tsx        (Slice 3 — new)
    AIBrief.tsx            (Slice 3 — new)
    UpcomingPayments.tsx   (Slice 3 — new)
    QuickStats.tsx         (Slice 3 — new)
    EntitiesList.tsx       (Slice 3 — restyle)
    DashboardMetrics.tsx   (existing, restyle)
    OnboardingHeroCard.tsx (existing, keep)
  accounts/ (existing)     (Slice 2 — restyle)
  invoicing/
    AgingBar.tsx           (Slice 4 — new)
  ai/
    IntelligenceBrief.tsx  (Slice 6 — new)
    InsightCard.tsx        (Slice 6 — new)
  ui/ (existing shadcn — minimal changes)
    glow-card.tsx          (Slice 0 — throttle fix only)
```

## Estimated Scope

| Slice | Tasks | Sessions | Priority |
|-------|-------|----------|----------|
| 0: Token Foundation | 4 | 1 | P0 |
| 1: Shell Polish | 4 | 2 | P0 |
| 2: Banking Vertical | 8 | 3-4 | P0 |
| 3: Overview Redesign | 7 | 3-4 | P1 |
| 4: Business Pages | 2 | 1-2 | P2 |
| 5: Accounting Pages | 2 | 1-2 | P2 |
| 6: AI + Extras | 3 | 2 | P2 |
| **Total** | **30** | **13-17** | |

## Progress

- [x] Slice 0: Token Foundation
  - [x] Task 0.1: Add `--ak-*` token namespace
  - [x] Task 0.2: Update glass utilities + glass-blur
  - [x] Task 0.3: Animation keyframes + stagger classes
  - [x] Task 0.4: GlowCard rAF throttle
- [x] Slice 1: Shell Polish
  - [x] Task 1.1: Sidebar restyle
  - [x] Task 1.2: Topbar enrichment
  - [x] Task 1.3: DomainTabs + banking layout
  - [x] Task 1.4: Layout spacing
- [x] Slice 2: Banking Vertical
  - [x] Task 2.1: StatsGrid component
  - [x] Task 2.2: SectionHeader component
  - [x] Task 2.3: Enhance PageHeader
  - [x] Task 2.4: Restyle banking accounts page
  - [x] Task 2.5: Restyle transactions page
  - [x] Task 2.6: Restyle imports page
  - [x] Task 2.7: Restyle reconciliation page
  - [x] Task 2.8: DetailPanel (transaction detail)
- [x] Slice 3: Overview Redesign
  - [x] Task 3.1: Greeting + LiquidityHero
  - [x] Task 3.2: Entity/Account Matrix
  - [x] Task 3.3: SparkCards
  - [x] Task 3.4: Charts (lazy-loaded)
  - [x] Task 3.5: Quick Actions + Action Items
  - [x] Task 3.6: Right column (AI Brief + Upcoming + QuickStats)
  - [x] Task 3.7: Overview assembly
- [ ] Slice 4: Business Pages
  - [ ] Task 4.1: Business layout + invoicing
  - [ ] Task 4.2: Clients + vendors pages
- [ ] Slice 5: Accounting Pages
  - [ ] Task 5.1: Accounting hub (COA)
  - [ ] Task 5.2: Journal entries page
- [ ] Slice 6: AI + Extras
  - [ ] Task 6.1: Command palette
  - [ ] Task 6.2: AI advisor hub
  - [ ] Task 6.3: ComingSoon placeholder
