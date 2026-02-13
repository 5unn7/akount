# Design System Figma Build Brainstorm

**Date:** 2026-02-07
**Status:** Brainstormed
**Related:** `docs/design-system/`, `docs/design-system/05-governance/figma-organization.md`, `packages/design-tokens/`

## Problem Statement

Akount has a fully documented design system (100% docs) but only ~35-40% code implementation and 0% Figma implementation. We need to build the complete design system in Figma to serve as the visual source of truth, enable design iteration, and keep design-code parity.

## User Needs

- **Designers:** Need a Figma component library to design new screens and iterate
- **Engineers:** Need Figma specs to implement screens accurately
- **Stakeholders:** Need visual reference for the full product scope
- **New team members:** Need onboarding material showing the full system

## Proposed Approach

**Figma-first, foundation-up** using Figma's native Variables API.

### Phase 1: Foundation & Tokens (Variables API)

Build all design tokens as Figma Variables with Light/Dark modes:

**Variable Collections:**

1. **Core Colors** - 7 color families (orange, violet, slate, green, red, amber, blue) with all shades
2. **Semantic Colors** - bg, text, border, action, state, finance, ai, focus (with Light/Dark modes)
3. **Component Colors** - button, table, badge specific tokens
4. **Spacing** - 7 values (4px, 8px, 12px, 16px, 24px, 32px, 48px)
5. **Border Radius** - 4 values (6px, 10px, 14px, 18px)

**Text Styles (Figma native):**

- Headings: Newsreader (h1=30px, h2=24px, h3=20px) semibold, tight line-height
- Body: Manrope (default=16px, muted=14px) regular, normal line-height
- Mono: JetBrains Mono (amount=14px) medium, normal line-height

**Effect Styles:**

- Elevation: none, sm (1px blur), md (6px/18px blur), lg (16px/40px blur)

### Phase 2: Figma Page Structure (8-Domain Sitemap)

Create full page structure per `figma-organization.md`:

| Page | Purpose |
|------|---------|
| Sitemap | 8-column domain map (read-only reference) |
| Foundations | Color swatches, type scale, spacing, radius, elevation |
| Components | All 31 component variants |
| Domain 1: Overview | Dashboard screens |
| Domain 2: Money Movement | Accounts, Transactions, Reconciliation, Transfers |
| Domain 3: Business Operations | Clients, Vendors, Invoices, Bills, Payments |
| Domain 4: Accounting | Journal Entries, COA, Assets, Tax, Fiscal Periods |
| Domain 5: Planning & Analytics | Reports, Budgets, Forecasts, Goals |
| Domain 6: AI Advisor | Insight Feed, Policy Alerts, AI History |
| Domain 7: Services | Accountant Collab, Bookkeeping, Documents |
| Domain 8: System | Entities, Integrations, Rules, Users, Audit, Security, Filing |
| Global | Entity Switcher, Period Selector, Currency View, Search, AI Panel |

### Phase 3: Component Library

Build all 31 components as Figma components with variants:

**Primitives (6):** Button, Input, Select, Badge, Chip, Icon
**Data Display (6):** Card, DataTable, EmptyState, LoadingState, Accordion, List
**Feedback (5):** Alert, ConfirmDialog, Modal, Toast, Progress
**Financial (15):** MoneyAmount, MoneyInput, GLAccountSelector, EntityBadge, AccountCard, KPICard, JournalEntryPreview, TransactionRow, BudgetCard, InvoiceRow, BalanceSheetItem, FiscalPeriodStatus, AuditTrailEntry, BalanceValidator, DuplicateDetector
**AI (7):** InsightCard, InsightDetail, SuggestionChip, ConfidenceBadge, CriticalAlert, AIPanel, FeedbackComponent

### Phase 4: Screen Assembly

Compose components into full screen designs for all 8 domains.

## Key Token Values (Source of Truth)

From `akount.tokens.json`:

| Token | Value |
|-------|-------|
| Primary (Orange) | #F97316 |
| Secondary/AI (Violet) | #8B5CF6 |
| Slate 50 | #F8FAFC |
| Slate 100 | #F1F5F9 |
| Slate 300 | #CBD5E1 |
| Slate 500 | #64748B |
| Slate 700 | #334155 |
| Slate 900 | #0F172A |
| Success/Income (Green) | #10B981 |
| Error/Expense (Red) | #EF4444 |
| Warning/Liability (Amber) | #F59E0B |
| Info/Transfer (Blue) | #3B82F6 |
| Equity (Teal) | #14B8A6 |
| Heading Font | Newsreader |
| Body Font | Manrope |
| Mono Font | JetBrains Mono |
| Spacing Scale | 4/8/12/16/24/32/48px |
| Radius Scale | 6/10/14/18px |

## Constraints

- Must use Figma Variables API (not Token Studio plugin)
- Must support Light and Dark modes
- Must follow 8-domain sitemap structure exactly
- Financial components must show amounts in integer cents format
- All components must be tenant-aware in their design (entity badges, multi-currency)

## Alternatives Considered

### Token Studio Plugin Import

**Why Not:** User chose native Variables API for tighter Figma integration and no plugin dependency.

### Code-First Approach

**Why Not:** User wants visual design iteration before code completion. Figma-first enables faster design exploration.

### Manual Styles Only

**Why Not:** Variables API provides better mode support (light/dark), aliasing, and future scalability.

## Open Questions

- [ ] Should we create a separate Figma file or work within the existing `akount-app` file?
- [ ] Do we need to set up Figma branching for design reviews?
- [ ] Should components be built as Figma Component Sets (with variants) or individual components?

## Next Steps

- [ ] Create detailed implementation plan (`/processes:plan`)
- [ ] Phase 1: Set up Variable Collections in Figma
- [ ] Phase 2: Create page structure
- [ ] Phase 3: Build component library
- [ ] Phase 4: Assemble screens
