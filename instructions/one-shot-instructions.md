# Akount — Complete Implementation Instructions

## About These Instructions

This document contains the complete implementation guide for Akount. It combines all 8 milestones into a single comprehensive reference for implementing the entire product in one session.

**What's Provided:**
- Complete product specification and requirements
- Design system tokens (colors, typography, spacing)
- Data model types and entity descriptions
- Application shell components (sidebar navigation, workspace/entity controls)
- Screen design reference components with sample data
- Test specifications for each section

**What You'll Build:**
- Your own tech stack (React + routing library + state management + backend/database)
- Authentication system
- Data fetching and mutations
- Database schema based on provided types
- Business logic and validations
- API layer
- Real bank connection integrations (Plaid, Finicity, etc.)
- Deployment infrastructure

**Key decisions to make:**
1. **Authentication:** How will users sign up and log in? (Auth0, Supabase Auth, Firebase Auth, custom JWT?)
2. **User Model:** Will you implement the full multi-workspace model with entities, or start simpler?
3. **Tech Stack:** What framework and libraries? (Next.js, Remix, Vite + React Router? Tanstack Query? Zustand/Redux?)
4. **Backend:** API architecture? (tRPC, REST, GraphQL? Serverless or traditional server?)
5. **Database:** Which database? (PostgreSQL, MySQL, Supabase, Firebase?)

---

## TDD Approach

Before writing implementation code for each section, write tests based on the test specifications in that section's `tests.md` file. This ensures your implementation meets all requirements and handles edge cases.

**Each section includes tests for:**
- Empty state rendering
- Data display and formatting
- User interactions and callbacks
- Filtering and state management
- Responsive layout
- Edge cases (missing data, errors, etc.)

Adopt a test-driven development approach:
1. Read the test specifications for the section
2. Write tests based on those specifications
3. Implement components to make tests pass
4. Refactor while keeping tests green

---

## Product Overview

# Akount

## Description
Akount is a multi-country financial command center for solo entrepreneurs managing complex finances across borders. It provides a unified view of all personal and business accounts, tracks money flow across multiple currencies and legal entities, and uses AI to surface insights on spending, cash flow, and tax optimization - giving you complete financial clarity in one place.

## Sections

1. **Accounts Overview** - Connect and view all bank accounts, credit cards, loans, and assets across countries with multi-currency support, entity separation, and consolidated net worth dashboard.

2. **Bank Reconciliation** - Import bank feed transactions, match them to internal records, handle transfers between accounts, and maintain reconciliation status with automated and manual matching workflows.

3. **Transactions & Bookkeeping** - Transaction categorization, chart of accounts management, double-entry journal entries with debits/credits, and multi-entity bookkeeping with proper GL account posting.

4. **Invoicing & Bills** - Manage clients and vendors, create invoices and bills with line items and tax calculations, track payment allocations, handle credit notes, and integrate AR/AP with the general ledger.

5. **Analytics** - Visual cash flow analysis, burn rate tracking, spending breakdowns, P&L and balance sheet generation, financial trend insights across entities and time periods with customizable reporting.

6. **Planning** - Set budgets by entity, category, and period; define financial goals for savings or debt paydown; track progress against targets with variance analysis and alerts.

7. **AI Financial Advisor** - Personalized spending insights, tax optimization recommendations, deduction discovery, alerts for subsidies and programs, automated categorization rules, and intelligent financial guidance.

## Data Model Summary

**Core Accounting Backbone:** Entity, GLAccount, JournalEntry, JournalLine, TaxRate, Currency, FxRate, FiscalCalendar

**Accounts Receivable & Payable:** Client, Invoice, InvoiceLine, CreditNote, Vendor, Bill, BillLine, Payment, PaymentAllocation

**Banking, Feeds & Reconciliation:** Account, BankConnection, BankFeedTransaction, Transaction, TransactionMatch, Transfer, Category

**Budgeting, Goals & Analytics:** Budget, Goal, ReportDefinition, Snapshot

**Users, Sharing & SaaS:** User, Workspace, UserRole, Subscription, AuditLog

**AI, Rules & Documents:** Insight, InsightTrigger, Rule, Attachment, RecurringTemplate

**Optional High-Value Entities:** Project, Tag, IntercompanyMapping, Notification

## Design System

**Colors:** Orange (primary), Violet (secondary), Slate (neutral)

**Typography:** Newsreader (headings), Manrope (body), JetBrains Mono (monospace)

**Tailwind CSS v4:** All designs use Tailwind v4 utility classes with responsive prefixes and dark mode support

## Implementation Sequence

The product is designed to be built incrementally across 8 milestones:

1. **Foundation** - Design tokens, data model types, routing structure, application shell
2. **Accounts Overview** - Multi-currency dashboard and account management
3. **Bank Reconciliation** - Transaction matching and reconciliation workflows
4. **Transactions & Bookkeeping** - Transaction list, categorization, journal entries, chart of accounts
5. **Invoicing & Bills** - AR/AP management with invoices, bills, clients, vendors
6. **Analytics** - Financial reporting with cash flow, P&L, and balance sheet
7. **Planning** - Budgets, goals, and financial calculators
8. **AI Financial Advisor** - Insights feed and categorization rules

Each section is self-contained and can be built independently after the foundation is complete.

---

# Milestone 1: Foundation

**Prerequisites:** None (this is the first milestone)

## Goal

Create a working application skeleton with:
- Design tokens configured in your styling system
- Type definitions for all core data models
- Routing structure for all 7 sections
- Application shell with navigation (sidebar, workspace/entity filters)
- Placeholder pages for each section
- Authentication flow

---

## Design System Setup

### 1. Install Google Fonts

Add to your HTML `<head>` or app entry point:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### 2. Configure Tailwind CSS v4

Install Tailwind CSS v4 and configure your `@theme` directive with Akount's design tokens.

**Reference:** `design-system/tokens.css` and `design-system/tailwind-colors.md`

**Key tokens:**
- Primary color: orange
- Secondary color: violet
- Neutral color: slate
- Font families: Newsreader (headings), Manrope (body), JetBrains Mono (mono)

### 3. Set Up Dark Mode

Ensure your app supports light and dark modes. All designs use `dark:` variants.

---

## Data Model Types

### 1. Copy Core Types

Start with the types in `data-model/types.ts`. You don't need to implement all entities immediately - start with the essentials:

**Phase 1 (MVP):**
- User, Workspace, Entity
- Account, Currency, FxRate
- Transaction, Category
- BankFeedTransaction, TransactionMatch

**Phase 2:**
- GLAccount, JournalEntry, JournalLine
- Client, Vendor, Invoice, Bill, Payment
- Budget, Goal

**Phase 3:**
- Insight, Rule, Attachment
- Project, Tag, Notification

### 2. Database Schema

Create database migrations for your chosen database based on the types. Key relationships:
- Workspace has many Entities and Users
- Entity has many Accounts, Transactions, Invoices, Budgets
- Account belongs to Entity and Currency
- Transaction belongs to Account and Category

---

## Routing Structure

Set up routes for all 7 main sections plus auth and settings:

```
/                          → Accounts Overview (home, requires auth)
/reconciliation            → Bank Reconciliation
/transactions              → Transactions & Bookkeeping
/invoicing                 → Invoicing & Bills
/analytics                 → Cash Flow & Analytics
/planning                  → Budgeting & Goals
/ai                        → AI Financial Advisor
/settings                  → Settings
/login                     → Login page
/signup                    → Sign up page
```

Create placeholder components for each route initially. You'll implement them in subsequent milestones.

---

## Application Shell Integration

### 1. Copy Shell Components

The shell components are in `shell/components/`:
- `AppShell.tsx` - Main wrapper with sidebar and responsive behavior
- `MainNav.tsx` - Sidebar navigation with workspace/entity controls
- `UserMenu.tsx` - User menu at bottom of sidebar
- `useSpotlight.ts` - Spotlight hover effect hook

### 2. Set Up Navigation Items

Create your navigation configuration:

```typescript
import { Home, CreditCard, BookOpen, FileText, TrendingUp, Target, Bot } from 'lucide-react'

const navigationItems = [
  { id: 'accounts', label: 'Accounts Overview', icon: Home, href: '/', isActive: true },
  { id: 'reconciliation', label: 'Bank Reconciliation', icon: CreditCard, href: '/reconciliation' },
  { id: 'transactions', label: 'Transactions & Bookkeeping', icon: BookOpen, href: '/transactions' },
  { id: 'invoicing', label: 'Invoicing & Bills', icon: FileText, href: '/invoicing' },
  { id: 'analytics', label: 'Cash Flow & Analytics', icon: TrendingUp, href: '/analytics' },
  { id: 'planning', label: 'Budgeting & Goals', icon: Target, href: '/planning' },
  { id: 'ai', label: 'AI Financial Advisor', icon: Bot, href: '/ai' },
]
```

### 3. Wire Up Callbacks

The AppShell needs these callbacks:
- `onNavigate` - Handle route changes
- `onWorkspaceChange` - Switch between workspaces
- `onEntityFilterChange` - Filter data by entity
- `onLogout` - Sign out user

Implement these based on your routing and state management choices.

### 4. Auth Protection

Wrap authenticated routes with your auth provider. Redirect unauthenticated users to `/login`.

---

## User Onboarding Flow

Decide how new users experience the app:

**Option A: Full Onboarding**
1. Sign up → Create workspace → Add entities → Connect first bank → Dashboard

**Option B: Quick Start**
1. Sign up → Skip to dashboard with sample data → Connect bank when ready

**Option C: Demo Mode**
1. "Try Demo" button → Explore with sample data → Sign up to save

---

## State Management

Decide on your state management approach:

**Global State:**
- Current user
- Current workspace
- Selected entity filter
- Auth status

**Server State:**
- Accounts, transactions, invoices (use react-query, SWR, or similar)

**Local State:**
- Form inputs
- UI toggles (sidebar, modals)

---

## Files to Create

1. **Design System**
   - CSS/theme configuration with Akount tokens
   - Tailwind config (if needed)
   - Font imports

2. **Types**
   - Core data model types (from `data-model/types.ts`)
   - API request/response types
   - Component prop types

3. **Shell**
   - Layout wrapper with AppShell
   - Navigation items configuration
   - Auth-protected route wrapper

4. **Routes**
   - Home page (/) - placeholder for Accounts Overview
   - Section placeholders for 6 other main sections
   - Auth pages (/login, /signup)
   - Settings page

5. **Auth**
   - Sign up flow
   - Login flow
   - Logout handler
   - Auth context/provider

6. **API Layer**
   - Client setup (fetch, axios, tRPC, etc.)
   - Error handling
   - Loading states

---

## Done Checklist

- [ ] Tailwind CSS v4 configured with Akount design tokens
- [ ] Google Fonts (Newsreader, Manrope, JetBrains Mono) loaded
- [ ] Dark mode support working
- [ ] Core data types defined
- [ ] Database schema created (at least User, Workspace, Entity, Account)
- [ ] Routing configured for all 7 sections
- [ ] AppShell integrated with navigation
- [ ] Auth flow implemented (sign up, login, logout)
- [ ] Auth-protected routes working
- [ ] Placeholder pages render for each section
- [ ] Entity filter state management working
- [ ] Can navigate between sections using sidebar
- [ ] Mobile responsive sidebar (hamburger menu)
- [ ] User menu displays current user and workspace

**Next Milestone:** Accounts Overview (implement the financial dashboard)

---

# Milestone 2: Accounts Overview

**Prerequisites:** Foundation milestone complete (routing, shell, auth, design system)

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

---

# Milestone 3: Bank Reconciliation

**Prerequisites:** Foundation and Accounts Overview complete

## Goal

Build the bank reconciliation workspace where users import bank feed transactions, match them to internal records, handle transfers between accounts, and formally lock periods to maintain data integrity.

## Key Functionality

1. **Feed Transaction Import** - Automated import from bank connections (Plaid, Finicity, etc.)
2. **Match Status Tracking** - Matched, Suggested, Unmatched states for each feed item
3. **Manual Matching** - User selects internal transaction to match with feed item
4. **Suggested Matching** - AI/rules suggest matches with confidence scores
5. **Transfer Detection** - Identify and link transfers between owned accounts
6. **Bulk Actions** - Select multiple items and confirm matches or create transactions
7. **Period Locking** - Lock reconciled periods to prevent edits
8. **Account/Period Selector** - Filter by account and date range

## Components

- `BankReconciliation` - Main container with account/period selectors and filters
- `ReconciliationStatusCard` - Shows unreconciled count, lock status, last reconciled date
- `FilterChips` - Quick filter chips for Suggested/Unmatched/All
- `FeedTransactionTable` - Table of bank feed items with match status
- `FeedTransactionRow` - Single feed item with actions
- `BulkActionToolbar` - Appears when rows selected
- `TransactionDetailDrawer` - Side drawer for reviewing/matching feed items
- `PeriodLockModal` - Confirmation modal for locking periods
- `TransferGroupRow` - Visual grouping for detected transfers

## Data Requirements

- `BankFeedTransaction[]` - Raw imported transactions from bank
- `Transaction[]` - Internal categorized transactions
- `TransactionMatch[]` - Links between feeds and transactions with status
- `Transfer[]` - Explicit transfer records
- `Account` - Selected account context
- `FiscalPeriod[]` - Periods with open/locked status

## Expected User Flows

### Flow 1: Regular Reconciliation with Locking
1. User clicks "Reconcile" on account from overview
2. Selects period "Jan 2026"
3. Sees 23 feed items: 15 suggested, 8 unmatched
4. Filters to "Suggested" → reviews and bulk confirms 15 matches
5. Switches to "Unmatched" → creates 5 new transactions, matches 3 manually
6. All cleared → clicks "Lock Period"
7. Confirmation modal shows summary
8. Confirms → period locks, status updates to "Reconciled"

### Flow 2: Transfer Detection
1. User sees two feed items flagged as potential transfer
2. Items visually grouped with connector bracket
3. Reviews: $500 from Account A, $500 to Account B, same date
4. Clicks "Confirm Transfer"
5. System creates Transfer entity and linked transactions
6. Both feed items marked as matched

## Done Checklist

- [ ] Feed transaction table displays with match status badges
- [ ] Filter chips work (Suggested/Unmatched/All)
- [ ] Can select individual or multiple feed items
- [ ] Bulk action toolbar appears with selection
- [ ] Detail drawer opens with feed item details
- [ ] Can manually match feed item to transaction
- [ ] Can create new transaction from feed item
- [ ] Suggested matches display with confidence score
- [ ] Transfer detection groups related feed items
- [ ] Can confirm transfers with one action
- [ ] Period lock button enabled when all items matched
- [ ] Lock modal shows summary before confirming
- [ ] Locked periods prevent editing
- [ ] Administrator can unlock periods with warning
- [ ] Tests in tests.md pass

**Reference:** `sections/bank-reconciliation/` for spec, types, components, tests

---

# Milestone 4: Transactions & Bookkeeping

**Prerequisites:** Foundation, Accounts Overview, Bank Reconciliation complete

## Goal

Build the transaction management interface with categorization, chart of accounts, and journal entries for complete bookkeeping control.

## Key Functionality

1. **Transaction List** - All transactions with filters (entity, account, category, date, amount)
2. **Inline Categorization** - Editable category dropdown with AI suggestions
3. **Bulk Categorization** - Select multiple transactions and categorize together
4. **Transaction Detail Drawer** - Full context with attachments, notes, audit trail
5. **Chart of Accounts (GL)** - Manage GLAccounts per entity
6. **Journal Entries** - Create manual double-entry postings
7. **AI Category Suggestions** - One-click accept/dismiss suggestions
8. **Categorization Rules** - Create rules from transactions ("always categorize similar as...")
9. **Multi-Currency Display** - Native currency with converted amount below

## Components

- `TransactionsBookkeeping` - Main container with tab navigation
- `FilterBar` - Strong filters for entity, account, category, date, amount, search
- `TransactionList` - Dense table with selection and inline edit
- `TransactionRow` - Single transaction with category dropdown
- `BulkActionToolbar` - Bulk categorization and rule creation
- `TransactionDetailDrawer` - Side drawer with full details
- `JournalEntryList` - List of journal entries with draft/posted status
- `JournalEntryModal` - Modal for creating balanced entries
- `ChartOfAccounts` - GLAccount management table
- `GLAccountRow` - Single GL account with balance

## Tab Navigation

- **Transactions** (default) - Transaction list and categorization
- **Journal Entries** - Manual accounting entries (advanced)
- **Chart of Accounts** - GL account management (advanced)

Mark "Journal Entries" and "Chart of Accounts" tabs with subtle "Advanced" label.

## Done Checklist

- [ ] Tab navigation between Transactions/Journal/Chart of Accounts works
- [ ] Transaction table loads and filters correctly
- [ ] Inline category edit with dropdown
- [ ] AI suggestions appear as amber badges with one-click accept
- [ ] Bulk selection and categorization work
- [ ] "Create Rule" button creates categorization rule
- [ ] Transaction detail drawer shows full context
- [ ] Can attach documents to transactions
- [ ] Journal entry modal validates debits = credits
- [ ] Can create/post journal entries
- [ ] Chart of accounts displays per selected entity
- [ ] Can add/edit GLAccounts with warnings about existing postings
- [ ] Multi-currency amounts display correctly
- [ ] Tests pass

**Reference:** `sections/transactions-bookkeeping/`

---

# Milestone 5: Invoicing & Bills

**Prerequisites:** Foundation and Transactions & Bookkeeping complete

## Goal

Build AR/AP management with invoice/bill creation, client/vendor directory, payment tracking, and GL integration.

## Key Functionality

1. **Invoice Management** - Create, edit, send invoices with line items and tax
2. **Bill Management** - Track vendor bills with line items and tax
3. **Client/Vendor Directory** - Contact management
4. **Product/Service Catalog** - Reusable line items
5. **Payment Recording** - Link payments to invoices/bills
6. **Payment Allocation** - Split payment across multiple invoices
7. **Credit Notes** - Adjustments and refunds
8. **Status Tracking** - Draft → Sent/Issued → Paid → Overdue
9. **Aging Reports** - Track overdue invoices and bills

## Components

- `InvoiceList` - Table with status, client, amount, due date, filters
- `InvoiceRow` - Single invoice with status badge
- `InvoiceDetail` - Full invoice with line items, payments, actions
- `InvoiceForm` - Create/edit with multi-line items, tax calculation
- `BillList` - Similar to invoices but for payables
- `BillRow` - Single bill row
- `ClientVendorList` - Directory with contact details, transaction history
- `ProductList` - Catalog of reusable line items
- `PaymentModal` - Record payment and allocate to invoices/bills
- `CreditNoteForm` - Create credit note against invoice/bill

## Tab Navigation

- **Invoices** (default)
- **Bills**
- **Clients/Vendors**
- **Products & Services**

## Done Checklist

- [ ] Can create invoices with multiple line items
- [ ] Tax auto-calculates per line item
- [ ] Invoice statuses update correctly (Draft/Sent/Paid/Overdue)
- [ ] Can create and manage bills similarly
- [ ] Client/vendor directory displays with contact details
- [ ] Product catalog for reusable line items
- [ ] Can record payments and allocate to invoices/bills
- [ ] Payment allocation supports partial and overpayments
- [ ] Can create credit notes
- [ ] Invoice/bill detail view shows full breakdown
- [ ] Aging reports identify overdue items
- [ ] GL integration posts to accounts receivable/payable
- [ ] Tests pass

**Reference:** `sections/invoicing-bills/`

---

# Milestone 6: Analytics

**Prerequisites:** Foundation, Transactions, Invoicing complete

## Goal

Build financial reporting dashboards with cash flow analysis, P&L, balance sheet, and customizable reports.

## Key Functionality

1. **Dashboard Overview** - Key metrics and trend visualizations
2. **Cash Flow Analysis** - Money in vs. out over time with category breakdowns
3. **P&L Statement** - Income statement showing revenue, expenses, net income
4. **Balance Sheet** - Assets, liabilities, equity snapshot
5. **AI Insights Panel** - Financial observations and recommendations
6. **Time Period Selector** - This month, last quarter, YTD, custom ranges
7. **Entity Filter** - View specific entity or consolidated
8. **Export** - Download reports as PDF or CSV
9. **Saved Reports** - Save filter/layout preferences

## Components

- `AnalyticsDashboard` - Main view with metric cards and charts
- `CashFlowView` - Line chart of inflows vs. outflows, category breakdown
- `PLView` - Structured income statement with revenue/expense sections
- `BalanceSheetView` - Assets, liabilities, equity with totals
- `InsightsPanel` - AI-generated financial observations
- `MetricCard` - Individual metric with trend indicator
- `ChartContainer` - Wrapper for responsive charts
- `ExportButton` - PDF/CSV download trigger
- `ReportFilters` - Entity, time period, account group selectors

## Tab Navigation

- **Dashboard** (default)
- **Cash Flow**
- **P&L**
- **Balance Sheet**
- **Insights**

## Done Checklist

- [ ] Dashboard displays key metrics with trends
- [ ] Cash flow chart shows inflows and outflows
- [ ] Category breakdown in cash flow view
- [ ] P&L statement generates correctly by period
- [ ] Balance sheet shows assets, liabilities, equity
- [ ] AI insights panel displays recommendations
- [ ] Time period selector updates all reports
- [ ] Entity filter works across all views
- [ ] Can export reports to PDF and CSV
- [ ] Charts are responsive and interactive
- [ ] Can save report configurations
- [ ] Multi-entity consolidated reporting works
- [ ] Tests pass

**Reference:** `sections/analytics/`

---

# Milestone 7: Planning

**Prerequisites:** Foundation, Transactions, Analytics complete

## Goal

Build financial planning tools with budgets, goals, progress tracking, and financial calculators.

## Key Functionality

1. **Budget Creation** - Set budgets by category, entity, time period
2. **Budget Variance** - Actual vs. budgeted with progress bars
3. **Goal Setting** - Savings, debt paydown, investment targets
4. **Goal Progress** - Track progress with suggested monthly contributions
5. **Financial Calculators** - Savings, debt payoff, budget allocation, retirement
6. **Alerts and Warnings** - Notifications when budgets exceeded or goals off-track
7. **Flexible Grouping** - Budget by category, entity, or both
8. **Visual Progress** - Progress bars and charts for budgets and goals

## Components

- `BudgetsView` - Budget list with inline creation, progress bars
- `BudgetRow` - Individual budget with actual vs. budgeted, alerts
- `BudgetForm` - Create budget with category, entity, amount, period
- `GoalsView` - Goal list with inline creation, progress visualization
- `GoalRow` - Individual goal with progress bar, target date, suggestions
- `GoalForm` - Create goal with target amount, deadline, linked accounts
- `CalculatorsView` - Four interactive financial calculators
- `SavingsCalculator` - Calculate savings growth
- `DebtPayoffCalculator` - Plan debt elimination
- `BudgetAllocationCalculator` - Optimize budget distribution
- `RetirementCalculator` - Retirement planning scenarios

## Tab Navigation

- **Budgets** (default)
- **Goals**
- **Calculators**

## Done Checklist

- [ ] Can create budgets with category, entity, period, amount
- [ ] Budget progress bars show actual vs. budgeted
- [ ] Alerts appear when budgets approached or exceeded
- [ ] Can create financial goals with targets and deadlines
- [ ] Goal progress visualizations display correctly
- [ ] Suggested monthly contributions calculate accurately
- [ ] All four calculators work with accurate formulas
- [ ] Calculator results update in real-time
- [ ] Entity and time period filters work
- [ ] Color-coded alerts (green/yellow/red) display
- [ ] Flexible budget grouping by category, entity, or both
- [ ] Tests pass

**Reference:** `sections/planning/`

---

# Milestone 8: AI Financial Advisor

**Prerequisites:** All previous milestones complete

## Goal

Build AI-powered financial guidance with personalized insights, tax optimization, subsidy alerts, and rule management.

## Key Functionality

1. **Insights Feed** - Chronological timeline of AI-generated recommendations
2. **Priority Levels** - High/medium/low priority badges
3. **Impact & Confidence** - Show estimated savings and AI confidence score
4. **Insight Types** - Spending, tax deductions, subsidies, alerts, recommendations
5. **Action Deadlines** - Time-sensitive insights with countdown
6. **One-Click Actions** - Apply suggestions (create rules, add deductions)
7. **Feedback System** - Dismiss, mark as applied, provide feedback
8. **Categorization Rules Management** - Review and manage AI-created rules
9. **Related Data Links** - Link to transactions/accounts that triggered insight
10. **Sharing** - Share insights with accountants or advisors

## Components

- `InsightsFeed` - Timeline/feed of AI insights
- `InsightCard` - Individual insight with priority, impact, actions
- `PriorityBadge` - Visual indicator for high/medium/low priority
- `ConfidenceIndicator` - AI confidence percentage or badge
- `ActionButtons` - Dismiss, Apply, Feedback, Share per insight
- `RulesView` - List of AI-created categorization rules
- `RuleRow` - Individual rule with active/inactive toggle, approve/reject
- `RuleDetail` - Full rule conditions and actions
- `FilterDropdown` - Filter by priority, insight type
- `DeadlineIndicator` - Countdown for time-sensitive insights

## Tab Navigation

- **Insights Feed** (default)
- **Categorization Rules**

## Done Checklist

- [ ] Insights feed displays chronologically
- [ ] Priority badges color-coded correctly
- [ ] Impact amounts and confidence scores display
- [ ] Can dismiss irrelevant insights
- [ ] Can apply insights with one click
- [ ] Can provide feedback on insights
- [ ] Can share insights with others
- [ ] Deadline countdowns appear for time-sensitive items
- [ ] Related data links navigate to filtered views
- [ ] Categorization Rules tab lists all AI rules
- [ ] Can approve/reject AI-created rules
- [ ] Can toggle rules active/inactive
- [ ] Filter by priority and insight type works
- [ ] Empty state when no insights available
- [ ] Tests pass

**Reference:** `sections/ai-financial-advisor/`

---

## Congratulations!

With all 8 milestones complete, you've built a comprehensive multi-country financial management system. Your Akount implementation should now support:

✅ Multi-currency accounts across countries
✅ Bank feed reconciliation with period locking
✅ Double-entry bookkeeping and categorization
✅ Invoicing, bills, AR/AP management
✅ Financial reporting and analytics
✅ Budgets, goals, and financial planning
✅ AI-powered insights and recommendations

**Next steps:**
- Polish UI/UX based on user feedback
- Optimize performance for large datasets
- Add real bank integrations (Plaid, Finicity, Yodlee)
- Implement advanced features (multi-user collaboration, accountant marketplace)
- Mobile app version
- Enhanced AI capabilities (anomaly detection, predictive analytics)
