# Milestone 2: Accounts Overview

**Prerequisites:** Foundation milestone complete (routing, shell, auth, design system)

---

## Preamble

This milestone builds the financial command center - the home view that users see when they open Akount. It displays consolidated net worth, cash position, AI insights, context-aware actions, and a comprehensive list of all financial accounts. This section establishes patterns for multi-currency display, entity filtering, and linking to other views that you'll reuse throughout the app.

---

## Goal and Overview

Create the Accounts Overview page as the default home view. Users should be able to:
- See their total net worth and how it changed
- View cash on hand vs. debt breakdown
- Review 2-3 AI-generated insights about their finances
- See context-aware call-to-action buttons for pending tasks
- Browse all accounts organized by type (banks, credit cards, loans, assets)
- Filter by entity (personal vs. business accounts)
- Toggle between native currencies and a single base currency
- Click accounts to drill into transactions or reconciliation
- Connect new bank accounts

**Empty state:** If user has no accounts, show friendly empty state with "Connect your first bank account" button.

---

## Key Functionality

1. **Multi-Currency Display**
   - Default: Show each account in its native currency (CAD account shows CAD, USD shows USD)
   - Toggle: Convert all amounts to a single base currency using FxRates
   - Display converted amounts in smaller text when toggled

2. **Entity Filtering**
   - Dropdown to select "All Entities", "Personal", or specific business entities
   - Filter accounts, insights, and summary metrics based on selection
   - Persist selection across navigation

3. **Net Worth Calculation**
   - Total assets minus total debts
   - Show percentage change from previous period (month/quarter/year)
   - Display sparkline trend chart
   - All amounts in selected base currency

4. **Cash Position Breakdown**
   - Cash: Bank accounts + available credit card balance
   - Debt: Credit cards used + loans + mortgages
   - Show count of accounts in each category

5. **Insights Feed**
   - Display 2-3 most recent/relevant insights
   - Color-code by severity (positive=green, warning=amber, info=blue, negative=red)
   - Each insight links to a filtered view in another section
   - Click to navigate with context preserved

6. **Call-to-Action Buttons**
   - Context-aware based on user's current state
   - High priority: Orange background, prominent
   - Medium priority: White background, subtle
   - Examples: "Review 18 unmatched transactions", "Connect another bank", "Send an invoice"

7. **Accounts List**
   - Group by type: Bank Accounts, Credit Cards, Loans, Assets
   - Collapsible groups (expand/collapse)
   - Per account: name, institution, balance, currency, entity badge, country flag, "needs recon" indicator
   - Click account to navigate to transactions or reconciliation view
   - For credit cards: show available credit vs. limit
   - For loans: show interest rate and monthly payment

---

## TDD Approach

Before writing implementation code, write tests based on the test specifications in `sections/accounts-overview/tests.md`. This ensures your implementation meets all requirements and handles edge cases.

Key test categories:
- Empty state rendering
- Multi-currency conversion
- Entity filtering
- Navigation interactions
- Responsive layout

---

## Components to Build

Based on the reference designs in `sections/accounts-overview/components/`, you'll need:

### 1. AccountsOverview (Main Component)
Props-based container component that receives all data and callbacks via props.

**Props:**
```typescript
interface AccountsOverviewProps {
  entities: Entity[]
  accounts: Account[]
  currencies: Currency[]
  fxRates: FxRate[]
  insights: Insight[]
  summary: Summary
  callToActions: CallToAction[]
  selectedEntityId?: string
  selectedCurrency?: string
  onAccountClick?: (accountId: string) => void
  onInsightClick?: (linkedView: string) => void
  onCallToActionClick?: (action: string) => void
  onEntityChange?: (entityId?: string) => void
  onCurrencyToggle?: (currency?: string) => void
  onConnectBank?: () => void
}
```

### 2. NetWorthCard
Displays total net worth with change indicator and sparkline.

**Props:**
```typescript
interface NetWorthCardProps {
  netWorth: {
    total: number
    currency: string
    change: number
    changeAmount: number
    period: string
  }
  currency: string
}
```

### 3. CashPositionCard
Shows cash vs. debt breakdown with visual separation.

**Props:**
```typescript
interface CashPositionCardProps {
  cash: { total: number; currency: string; accounts: number }
  debt: { total: number; currency: string; accounts: number }
  currency: string
}
```

### 4. InsightCard
Compact card for a single insight with severity indicator.

**Props:**
```typescript
interface InsightCardProps {
  insight: Insight
  onClick: () => void
}
```

### 5. AccountsList
Accounts organized by type with collapsible groups.

**Props:**
```typescript
interface AccountsListProps {
  accounts: Account[]
  entities: Entity[]
  selectedEntityId?: string
  selectedCurrency?: string
  baseCurrency: string
  fxRates: FxRate[]
  onAccountClick: (accountId: string) => void
}
```

### 6. AccountRow
Single account row with badges and balance.

**Props:**
```typescript
interface AccountRowProps {
  account: Account
  entity: Entity
  displayCurrency: string
  convertedAmount?: number
  onAccountClick: (accountId: string) => void
}
```

---

## Data Layer Requirements

### 1. Fetch Data

You'll need API endpoints or queries for:
- Entities (for the logged-in workspace)
- Accounts (with current balances)
- Currencies and FxRates (for conversion)
- Summary metrics (net worth, cash, debt, assets)
- Insights (recent, relevant to selected entity)
- Call-to-action items (pending tasks based on account states)

### 2. Sample Data

Reference `sections/accounts-overview/sample-data.json` for data structure examples. Your backend should return data in this shape.

### 3. Currency Conversion

Implement a helper function to convert amounts between currencies using FxRates:

```typescript
function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  fxRates: FxRate[]
): number {
  if (fromCurrency === toCurrency) return amount
  const rate = fxRates.find(r => r.from === fromCurrency && r.to === toCurrency)
  return rate ? amount * rate.rate : amount
}
```

### 4. Entity Filtering

Filter accounts, insights, and recalculate summary when entity changes:

```typescript
const filteredAccounts = selectedEntityId
  ? accounts.filter(a => a.entityId === selectedEntityId)
  : accounts

// Recalculate net worth, cash, debt for filtered accounts
```

---

## Callbacks to Wire Up

### 1. onAccountClick
Navigate to transactions view filtered by account:
```typescript
router.push(`/transactions?account=${accountId}`)
```

### 2. onInsightClick
Navigate to the linked view specified in the insight:
```typescript
router.push(linkedView)  // e.g., "/analytics?filter=cash-flow&period=this-month"
```

### 3. onCallToActionClick
Navigate to the action URL:
```typescript
router.push(action)  // e.g., "/reconciliation?filter=unmatched"
```

### 4. onEntityChange
Update global entity filter state (context, zustand, redux, etc.):
```typescript
setGlobalEntityFilter(entityId)
// Re-fetch or re-filter data
```

### 5. onCurrencyToggle
Toggle between native currencies and single base currency:
```typescript
setSelectedCurrency(currency)  // undefined for native, "CAD" for base currency
```

### 6. onConnectBank
Navigate to bank connection flow:
```typescript
router.push('/settings/connections?action=add')
```

---

## Empty States

### Primary Empty State (No Accounts)
When user has no connected accounts:
- Friendly illustration
- Heading: "Welcome to Akount"
- Description: "Connect your first bank account to get started with your financial overview"
- Primary button: "Connect Bank Account" → triggers onConnectBank
- Secondary link: "Learn more about Akount"

### No Insights
When no insights available:
- Small message: "No insights yet. We'll show insights as we learn about your finances."

### No Call-to-Actions
Simply don't render the CTA section if empty.

---

## Files to Reference

- `sections/accounts-overview/README.md` - Spec and design notes
- `sections/accounts-overview/types.ts` - TypeScript interfaces
- `sections/accounts-overview/sample-data.json` - Sample data structure
- `sections/accounts-overview/components/` - Reference React components
- `sections/accounts-overview/tests.md` - Test specifications

---

## Expected User Flows

### Flow 1: Daily Check-in
1. User opens Akount app
2. Lands on Accounts Overview (home)
3. Glances at net worth card → sees +$4,280 this month (positive change in green)
4. Reviews cash position card → $530k cash, $435k debt
5. Reads insight card: "18 transactions need review" (amber warning)
6. Clicks insight → navigates to `/reconciliation?filter=unmatched`
7. Reviews and matches transactions (covered in next milestone)

### Flow 2: Multi-Currency Toggle
1. User views accounts in native currencies (default)
2. Sees: "RBC Chequing $12,450 CAD", "Chase Checking $18,750 USD", "ICICI Savings ₹425,000 INR"
3. Clicks "View all in CAD" toggle in header
4. All amounts convert to CAD using FxRates
5. Sees: "RBC Chequing $12,450 CAD", "Chase Checking $25,312 CAD (from $18,750 USD)", "ICICI Savings $6,800 CAD (from ₹425,000 INR)"
6. Net worth card recalculates to show consolidated total in CAD

### Flow 3: Entity Filtering
1. User has accounts across Personal and 2 businesses (Marakana Corp, Tech Ventures LLC)
2. Selects "Marakana Corp" from entity dropdown
3. Accounts list filters to show only Marakana Corp accounts
4. Net worth, cash, and debt cards recalculate for Marakana Corp only
5. Insights filter to show only Marakana-related insights
6. Clicks "All Entities" to see consolidated view again

### Flow 4: Account Drill-Down
1. User sees "RBC Chequing" account with "3 unmatched" badge in amber
2. Clicks account row
3. Navigates to `/transactions?account=acc-001` or `/reconciliation?account=acc-001`
4. Views transaction detail or reconciliation UI (covered in next milestones)

---

## Done Checklist

- [ ] AccountsOverview page renders at `/` route
- [ ] Net worth card displays total, change percentage, and trend
- [ ] Cash position card shows cash vs. debt breakdown
- [ ] Insights display with severity colors and click navigation
- [ ] Call-to-action buttons render and navigate correctly
- [ ] Accounts list grouped by type (banks, cards, loans, assets)
- [ ] Collapsible account groups work
- [ ] Account rows display name, institution, balance, badges
- [ ] Entity filter dropdown works and filters all data
- [ ] Currency toggle converts amounts using FxRates
- [ ] Multi-currency display shows native currencies by default
- [ ] Clicking account navigates to transactions/reconciliation
- [ ] Clicking insight navigates to linked view with context
- [ ] Empty state renders when no accounts exist
- [ ] "Connect Bank Account" button triggers bank connection flow
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] All tests in tests.md pass

**Next Milestone:** Bank Reconciliation
