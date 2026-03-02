# Akount Design System — Complete Figma Build Plan

**Date:** 2026-02-07
**Status:** Approved
**Type:** Figma-first design system implementation
**File:** akount-app (Figma)

## Context

Akount has a fully documented design system (100% docs, 31+ component specs, 8-domain architecture) but 0% Figma implementation. The existing `akount-app` Figma file is completely empty (no components, variables, or styles). We need to build the entire design system in Figma as the visual source of truth, using the native Variables API with Light/Dark modes, following the glassmorphism + skeuomorphism visual direction already documented in the design philosophy.

**Design Direction:** Bloomberg Terminal sophistication x Notion clarity x Apple calm. Glassmorphism (frosted glass, backdrop-blur, layered transparency) blended with skeuomorphism (realistic shadows, physical depth, tactile feedback).

---

## Phase 0: File Preparation & Page Structure

**Goal:** Create the 14-page structure in the existing akount-app file.

| Step | Action | Tool |
|------|--------|------|
| 0.1 | Rename existing pages ("Page 1" -> "1. Sitemap", "Component" -> "2. Foundations") | `figma_execute` |
| 0.2 | Create 12 new pages: 3. Components, 4-11. Domain pages, 12. Global, 13. Dark Mode, 14. Archive | `figma_execute` |
| 0.3 | Screenshot to validate page list | `figma_capture_screenshot` |

**Pages:**

1. Sitemap -- Akount App
2. Foundations
3. Components
4. Overview
5. Money Movement
6. Business Operations
7. Accounting
8. Planning & Analytics
9. AI Advisor
10. Services
11. System
12. Global
13. Dark Mode Variants
14. Archive

---

## Phase 1: Design Token Variables

**Goal:** Create all tokens as Figma Variables with Light/Dark modes. Every component references these.

### 1.1 Core Colors Collection (16 variables, 1 mode)

| Token | Value |
|-------|-------|
| orange/50, 100, 500, 700 | #FFF7ED, #FFEDD5, #F97316, #C2410C |
| violet/500, 700 | #8B5CF6, #6D28D9 |
| slate/50, 100, 300, 500, 700, 900 | #F8FAFC, #F1F5F9, #CBD5E1, #64748B, #334155, #0F172A |
| green/500, red/500, amber/500, blue/500 | #10B981, #EF4444, #F59E0B, #3B82F6 |

**Tools:** `figma_create_variable_collection` + `figma_batch_create_variables`

### 1.2 Semantic Colors Collection (31+ variables, Light/Dark modes)

- bg: primary, secondary, surface, elevated
- text: primary, secondary, muted, inverse
- border: default, subtle, strong
- action: primary (orange), secondary (violet), danger (red)
- state: success, warning, error, info
- finance: income (green), expense (red), transfer (blue), liability (amber), equity (teal #14B8A6)
- ai: primary, background, border
- focus: ring
- glass: light, medium, strong, border (with Light/Dark mode values)

**Glass Variable Values:**

| Variable | Light | Dark |
|----------|-------|------|
| glass/light | rgba(255,255,255,0.7) | rgba(15,23,42,0.4) |
| glass/medium | rgba(255,255,255,0.5) | rgba(15,23,42,0.6) |
| glass/strong | rgba(255,255,255,0.3) | rgba(15,23,42,0.8) |
| glass/border | rgba(255,255,255,0.3) | rgba(255,255,255,0.1) |

### 1.3 Component Colors Collection (13 variables, Light/Dark modes)

- button/primary (bg, text), button/secondary (bg, text)
- table/header (bg, text), table/row (hover, selected), table/border
- badge: success/bg, warning/bg, error/bg, ai/bg

### 1.4 Spacing Collection (11 variables, single mode, FLOAT)

- space/1=4, space/2=8, space/3=12, space/4=16, space/6=24, space/8=32, space/12=48
- component-padding=16, component-gap=12, layout-section=32, layout-page=48

### 1.5 Radius Collection (5 variables, single mode, FLOAT)

- sm=6, md=10, lg=14, xl=18, component=14

### 1.6 Validate with `figma_get_variables`

- 5 collections, ~75-80 total variables
- Semantic/Component collections have Light + Dark modes

---

## Phase 2: Foundations Page (Visual Reference)

**Goal:** Build "2. Foundations" as a living reference showing all tokens visually.

**6 sections in vertical auto-layout (gap 48px):**

| Section | Content |
|---------|---------|
| Colors | Swatch grid (64x64 squares) for core, semantic, glass, component colors with labels |
| Typography | Styled text samples: H1-H3 (Newsreader), Body (Manrope), Mono (JetBrains Mono) on glass cards |
| Spacing | Orange rectangles at each spacing value with labels |
| Border Radius | 5 squares (80x80) showing each radius |
| Elevation & Shadows | 4 cards showing none/sm/md/lg shadow levels |
| Glass Effects | 3 glass cards (light/medium/strong) over gradient background + dark mode variants |

**Glass/Skeuomorphism:** Typography samples and elevation demos placed on glass card containers.

---

## Phase 3: Component Library (41 components)

**Goal:** Build all components on "3. Components" page, organized in 6 sections.

### 3.1 Primitives (6 components)

| Component | Variants | Glass/Skeuo Treatment |
|-----------|----------|----------------------|
| **Button** | 4 types (Primary/Secondary/Ghost/Danger) x 3 sizes (sm/md/lg) x 4 states (Default/Hover/Pressed/Disabled) = 48 variants | Glass highlight border-top, skeuomorphic shadow, pressed depression |
| **Input** | 6 types x 5 states | Inner shadow for depth, glass border on focus |
| **Select** | Closed/Open states | Glass dropdown panel with shadow lg |
| **Badge** | 6 types (Success/Warning/Error/AI/Info/Neutral) x 2 sizes | Semi-transparent colored fill |
| **Chip** | 3 types (Suggestion/Filter/Action) | Violet glass tint for AI suggestion |
| **Icon** | 32 placeholder icons (24x24) | -- |

### 3.2 Data Display (6 components)

| Component | Variants | Glass/Skeuo Treatment |
|-----------|----------|----------------------|
| **Card** | Elevated/Flat/Interactive | Glass bg + glass border highlight + shadow md |
| **DataTable** | Header + data rows + selected row | Glass container, shadow md |
| **EmptyState** | Single | Glass card |
| **LoadingState** | Skeleton/Spinner | Pulsing opacity |
| **Accordion** | Expanded/Collapsed | Glass card |
| **List** | Simple/Grouped/Selectable | -- |

### 3.3 Feedback (5 components)

| Component | Variants | Glass/Skeuo Treatment |
|-----------|----------|----------------------|
| **Alert** | Info/Success/Warning/Error | Glass bg + colored left border |
| **ConfirmDialog** | Single | Dark overlay + glass dialog card, shadow xl |
| **Modal** | Small/Default/Large | Glass container + overlay |
| **Toast** | Success/Error/Warning/Info | Glass bg with state color tint |
| **Progress** | Linear/Circular/Steps | -- |

### 3.4 Financial (15 components)

| Component | Key Specs | Glass/Skeuo Treatment |
|-----------|-----------|----------------------|
| **MoneyAmount** | JetBrains Mono, color-coded (green/red/blue), sign + currency | -- |
| **MoneyInput** | Mono font, right-aligned, FX conversion row | Glass container |
| **GLAccountSelector** | Grouped dropdown, search, account codes | Glass dropdown |
| **EntityBadge** | Flag + name, hover tooltip | -- |
| **AccountCard** | Balance, trend, sync status | Glass card + shadow md |
| **KPICard** | 32px mono value, trend arrow, sparkline | Glass card |
| **JournalEntryPreview** | DR/CR table, balance indicator | Glass card |
| **TransactionRow** | 11-column row, status badges | -- |
| **BudgetCard** | Progress bar (green/amber/red) | Glass card |
| **InvoiceRow** | Invoice #, client, amount, status, due date | -- |
| **BalanceSheetItem** | Hierarchical, indented, mono amounts | -- |
| **FiscalPeriodStatus** | Locked/Review/Open/Future states | -- |
| **AuditTrailEntry** | Timeline entry with before/after | -- |
| **BalanceValidator** | DR/CR totals, balanced/unbalanced indicator | Glass card |
| **DuplicateDetector** | Warning card, match criteria, Yes/No buttons | Amber glass tint |

### 3.5 AI (7 components)

| Component | Variants | Glass/Skeuo Treatment |
|-----------|----------|----------------------|
| **InsightCard** | 4 types (Optimization/Alert/Observation/Confirmation) | Violet glass bg + border |
| **InsightDetail** | Full expanded panel | Glass panel, shadow xl |
| **SuggestionChip** | Single | Violet border-left accent |
| **ConfidenceBadge** | High/Medium/Low | Filled bar segments |
| **CriticalAlert** | Single | Amber/red glass tint |
| **AIPanel** | Side panel (400px) | Full glass bg, shadow xl, violet top accent |
| **FeedbackComponent** | Thumbs up/down | -- |

### 3.6 Navigation (2 components)

| Component | Variants | Glass/Skeuo Treatment |
|-----------|----------|----------------------|
| **Sidebar** | Expanded (240px) / Collapsed (80px) | Glass bg, shadow on right edge |
| **TopCommandBar** | Single (full-width, 60px height) | Glass bg, subtle bottom shadow |

### Validation: `figma_capture_screenshot` of each section

---

## Phase 4: Sitemap Page

**Goal:** Build the 9-column structural sitemap on "1. Sitemap".

- 8 domain columns + 1 Global column (300px each, 64px gap)
- Auto-layout vertical per column
- Content from `figma-organization.md`: all screens, tabs, subviews
- Neutral grays only (no brand colors)
- Governance notes at bottom
- **Tools:** `figma_execute` for layout + text creation

### Column Content Summary

1. **Overview:** Dashboard (Founder/Accountant), Net Worth, Cash Overview
2. **Money Movement:** Accounts (4 tabs), Transactions (5 tabs, 3 subviews), Reconciliation (4 tabs, 3 subviews), Transfers
3. **Business Operations:** Clients, Vendors, Invoices AR (6 tabs, 3 subviews), Bills AP (6 tabs, 3 subviews), Payments (4 tabs)
4. **Accounting:** Journal Entries (5 tabs, 3 subviews), Chart of Accounts (3 tabs, 2 subviews), Assets & Depreciation, Tax Rates, Fiscal Periods
5. **Planning & Analytics:** Reports (4 tabs, 5 standard reports), Budgets, Forecasts, Goals
6. **AI Advisor:** Insight Feed (4 tabs), Policy Alerts, AI History
7. **Services:** Accountant Collaboration, Bookkeeping Services, Document Requests
8. **System:** Entities, Integrations, Rules (4 tabs), Users & Permissions, Audit Logs, Security, Filing Readiness, Data Management
9. **Global:** Entity Switcher, Period Selector, Currency View, Global Search, Command Palette, Notifications, AI Side Panel

---

## Phase 5: Screen Assembly (8 Domain Pages + Global)

**Goal:** Compose components into full screen designs (1440x900 desktop viewport).

### Screen Template

- Sidebar (240px left) + TopCommandBar (60px top) + Content area (1200x840)

### Screens per Domain

| Domain | Key Screens |
|--------|-------------|
| **4. Overview** | Founder Dashboard (KPIs, Accounts, Cash Flow, AI Insights), Accountant Dashboard |
| **5. Money Movement** | Accounts List, Transaction List (with AI suggestions), Reconciliation, Transfers |
| **6. Business Ops** | Client List, Invoice List, Bill List |
| **7. Accounting** | Journal Entries (with BalanceValidator), Chart of Accounts, Fiscal Periods |
| **8. Planning** | Reports (P&L, Balance Sheet), Budget Grid |
| **9. AI Advisor** | Insight Feed, AI History |
| **10. Services** | Accountant Collaboration |
| **11. System** | Entities, Audit Log, Settings |
| **12. Global** | Entity Switcher, Period Selector, Currency View, Search Overlay, Command Palette, AI Panel |

### Glass treatment on screens

- Content areas use `bg/primary` with glass-treated cards floating above
- Sidebar and TopCommandBar use `glass/light` bg
- Modals/panels use `glass/medium` with dark overlay backdrop

---

## Phase 6: Dark Mode Variants

**Goal:** Create dark mode versions on "13. Dark Mode Variants".

| Step | Action |
|------|--------|
| Clone 4 key screens | Founder Dashboard, Transactions, AI Advisor, Components overview |
| Switch variable mode | `frame.setExplicitVariableModeForCollection(semanticCollection, darkModeId)` |
| Validate | Glass switches to dark glass, bg goes slate-900, text goes white, financial colors remain |

---

## Phase 7: Final Validation & Polish

**Goal:** Naming audit, component descriptions, comprehensive screenshots.

| Step | Action |
|------|--------|
| Verify all variables | `figma_get_variables` -- 5 collections, ~75-80 variables |
| Verify all components | `figma_search_components` -- 41 components |
| Naming audit | Pattern: `Category / Component / Variant` |
| Add descriptions | `figma_set_description` on each top-level component |
| Final screenshots | 10 screenshots covering all pages and key screens |

---

## Execution Order & Dependencies

```
Phase 0 (Pages) --> Phase 1 (Tokens) --> Phase 2 (Foundations)
                                      |-> Phase 3 (Components) --> Phase 5 (Screens)
                                      |-> Phase 4 (Sitemap)        --> Phase 6 (Dark Mode)
                                                                       --> Phase 7 (Polish)
```

**Phase 2 and Phase 4 can run in parallel with Phase 3.**

## Estimated Effort

| Phase | API Calls |
|-------|-----------|
| Phase 0: Pages | 15-20 |
| Phase 1: Tokens | 25-35 |
| Phase 2: Foundations | 40-55 |
| Phase 3: Components | 150-200 |
| Phase 4: Sitemap | 20-30 |
| Phase 5: Screens | 80-120 |
| Phase 6: Dark Mode | 15-25 |
| Phase 7: Polish | 15-25 |
| **Total** | **360-510** |

## Key Source Files

| File | Used In |
|------|---------|
| `docs/design-system/00-foundations/tokens/akount.tokens.json` | Phase 1 (all token values) |
| `docs/design-system/00-foundations/colors.md` | Phase 1-2 (glass tokens, shadow system) |
| `docs/design-system/00-foundations/philosophy.md` | All phases (glass + skeuo direction) |
| `docs/design-system/00-foundations/typography.md` | Phase 2 (font specs) |
| `docs/design-system/01-components/*.md` | Phase 3 (all component specs) |
| `docs/design-system/02-patterns/*.md` | Phase 3, 5 (composite patterns) |
| `docs/design-system/03-screens/*.md` | Phase 5 (screen layouts) |
| `docs/design-system/05-governance/figma-organization.md` | Phase 0, 4 (page structure, sitemap) |
| `docs/design-system/05-governance/information-architecture.md` | Phase 4, 5 (8-domain structure) |

## Verification

After each phase, validate using `figma_capture_screenshot`:

- Phase 0: Page list shows all 14 pages
- Phase 1: `figma_get_variables` returns correct collection/variable counts
- Phase 2: Foundations page shows all 6 sections with correct colors/fonts
- Phase 3: All 41 components visible with correct styling and glass effects
- Phase 4: 9-column sitemap readable with all screens listed
- Phase 5: Screens assemble correctly with sidebar, top bar, and content
- Phase 6: Dark mode colors switch properly, glass effects adapt
- Phase 7: Full audit passes -- naming, descriptions, completeness

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Fonts not available in Figma | Load Google Fonts via `figma_execute`, fall back to system fonts |
| Variable aliasing across collections not supported | Duplicate core values directly in semantic collection |
| RGBA alpha in variables | Use `figma_execute` with plugin API to set {r,g,b,a} directly |
| Background blur not settable via basic tools | Use `figma_execute` with `node.effects = [{type: 'BACKGROUND_BLUR', radius: 10}]` |
| Batch limits | Largest batch is ~31 variables, well within 100-variable limit |
