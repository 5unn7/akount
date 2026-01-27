# Accounts Overview

## Overview

Accounts Overview is the financial command center and default home view for Akount. It displays consolidated net worth and cash position across all accounts with elegant multi-currency handling, clear entity context, and actionable insights instead of overwhelming dashboard metrics.

## User Flows

- **First-time user (no accounts connected):** Lands on empty state → sees primary CTA "Connect your first bank account" → clicks to begin onboarding
- **Returning user, daily check:** Opens app → glances at net worth and cash position → reviews insights → clicks insight to navigate to filtered view
- **Multi-entity financial review:** Selects specific entity from filter → all cards update to show only that entity's position → switches back to "All Entities"
- **Multi-currency toggle:** Views accounts in native currencies by default → clicks toggle to "View all in CAD" → all amounts convert to single base currency
- **Account deep-dive:** Scans account list → notices "needs recon" badge → clicks account → navigates to reconciliation with filters applied

## UI Components

- **Top control bar:** Entity selector dropdown, base currency toggle, date range selector
- **Net worth card:** Total assets minus debts with percentage change, trend sparkline
- **Cash position card:** Cash on hand vs. debt, visually separated with totals
- **Insight cards (2-3):** AI-generated or rule-based insights linking to detailed views
- **Call-to-action strip:** Context-aware action buttons (connect bank, review transactions, etc.)
- **Account list with groups:** Collapsible groups by type (Banks, Credit Cards, Loans, Assets)
- **Per-account badges:** Country flag, entity name, reconciliation status indicator
- **Multi-currency presentation:** Primary amount in native currency, converted amount below when toggled
- **Empty state:** Illustration with "Connect your first bank account" button
- **Deep linking:** All elements navigate to relevant filtered views with context preserved

## Design Notes

- Entity filter at top right controls what's displayed across entire page
- Currency toggle switches between native currencies (default) and single base currency conversion
- Net worth sparkline shows trend over selected period (month/quarter/year)
- Insight severity colors: positive=green, warning=amber, info=blue, negative=red
- Account badges show entity name, country, and "X unmatched" when reconciliation needed
- Clicking any insight navigates to linked view with filters applied
- Empty state is critical for new user experience
- All navigation preserves entity filter and currency selection

## Files

- `types.ts` - TypeScript interface definitions
- `sample-data.json` - Sample data for development and testing
- `tests.md` - Comprehensive test specifications
- `components/` - Reference React components (if included)

## Implementation Notes

This section establishes patterns for multi-currency display, entity filtering, and context-aware navigation that will be reused throughout the application. Build this section first after the foundation milestone.

**Key challenges:**
- Currency conversion with FxRates
- Entity filtering that updates all cards simultaneously
- Linking to other sections while preserving context
- Responsive collapsible groups on mobile

**Reference:** See full specification in original `product/sections/accounts-overview/spec.md`
