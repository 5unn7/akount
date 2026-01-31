# LunchMoney Priority Matrix vs Akount Roadmap
## Gap Analysis & Strategic Recommendations

**Date:** 2026-01-31
**Purpose:** Validate our roadmap against proven user demand from LunchMoney's 40 most-voted features
**Methodology:** Compare LunchMoney's user votes (demand validation) against Akount's current roadmap

---

## Executive Summary

### ✅ What We're Doing Well (Coverage)
- **Multi-entity support** (our core differentiator, not in LunchMoney's top 40)
- **Bank reconciliation** (Phase 2, covers #1 Reconcile Transactions - 93 votes)
- **Transaction categorization** (Phase 3, partially covers features)
- **Invoicing & Bills** (Phase 4, covers #18 Show Upcoming Bills - 67 votes)
- **Analytics & Reports** (Phase 5, covers #16 Sankey Diagram - 127 votes)
- **Budgeting & Goals** (Phase 6, covers #9 Savings & Goals - 409 votes)
- **AI categorization** (Phase 7, covers #29 Auto-Categorization)

### ⚠️ Critical Gaps (High-Demand Features We're Missing)
1. **Running Balance Display** (#2, 86 votes) - NOT in any phase
2. **Cash Flow Forecasting** (#3, 208 votes) - Deferred to Phase 6, should be earlier
3. **Auto-Create Recurring Transactions** (#4, 49 votes) - NOT explicit in roadmap
4. **Simple Calculations in Amount Fields** (#5, 71 votes) - NOT in roadmap
5. **Keyboard Shortcuts** (#13, 105 votes) - NOT in roadmap, critical for power users
6. **Bulk Edit Transactions** (#11) - NOT in roadmap, efficiency feature
7. **Zero-Based/Envelope Budgeting** (#7, 290 votes) - HIGHEST VOTED, not explicit in Phase 6

### 🎯 Strategic Opportunities (Competitive Differentiators)
1. **Amazon Transaction Details Import** (#6, 98 votes) - UNIQUE VALUE PROP, not in roadmap
2. **12-Month Budget View** (#8, 143 votes) - Spreadsheet-style planning, not in roadmap
3. **Regex Support in Rules** (#27, 90 votes) - Power user feature, not in roadmap
4. **Investment Holdings Import** (#21, 142 votes) - Multi-entity target market, not detailed
5. **Richer Loan/Mortgage Tracking** (#22, 84 votes) - Target market need, not detailed

---

## Detailed Feature Comparison

### PHASE 1: CORE FOUNDATIONS (LunchMoney)

#### #1. Reconcile Transactions (93 votes)
- **LunchMoney:** Two-balance system, alert on mismatch, reconciliation workflow
- **Akount:** ✅ **Phase 2 (Bank Reconciliation)** - CSV import, transaction matching, reconciliation status
- **Status:** ✅ **COVERED** - Our Phase 2 fully addresses this
- **Recommendation:** Keep as-is

---

#### #2. Show Running/Cash Flow Balance (86 votes)
- **LunchMoney:** Display balance after each transaction in list, troubleshoot balance errors
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **CRITICAL GAP**
- **User Value:** Essential for understanding account balance at any point in time
- **Recommendation:** ⭐ **ADD TO PHASE 1** - Include running balance column in AccountsList
- **Implementation:** Add `runningBalance` calculation to accounts overview, transaction list
- **Effort:** Low (2-3 hours) - Simple cumulative calculation on transaction queries

**Proposed Addition:**
```typescript
// In Phase 1: Accounts Overview
- Add running balance to account detail view
- Display balance after each transaction in transaction list
- Include in dashboard NetWorthCard with trend

// In Phase 3: Transaction List
- Show running balance column (cumulative by account)
- Support filtering by date range with recalculation
```

---

#### #3. Cash Flow Forecasting (208 votes)
- **LunchMoney:** Project future balance based on recurring items and budgets - KILLER DIFFERENTIATOR
- **Akount:** ⚠️ **Phase 6 (Budgets & Goals)** - Optional phase, minimal detail
- **Status:** ⚠️ **DEFERRED TOO LATE**
- **User Value:** HIGH - 208 votes, described as "killer differentiator"
- **Recommendation:** ⭐⭐⭐ **PROMOTE TO PHASE 2 or 3** - This is a competitive moat feature
- **Implementation:** Build on recurring transactions + budget data, show projected balance graph
- **Effort:** Medium (15-20 hours) - Requires recurring transaction system + projection algorithm

**Proposed Addition:**
```
Phase 2B: Cash Flow Forecasting (NEW)
- API: GET /api/forecasting/cash-flow
- Calculate projected balance based on:
  - Recurring income/expenses
  - Budget allocations
  - Historical patterns
- Frontend: CashFlowForecastCard with line chart (7/30/90 day projections)
- Show "Balance on [date]" with confidence indicator
```

---

#### #4. Auto-Create Scheduled/Recurring Transactions (49 votes)
- **LunchMoney:** Automatically generate recurring transactions, reduce manual entry monotony
- **Akount:** ⚠️ **Schema supports (RecurringTransaction model)** but no UI/automation in roadmap
- **Status:** ⚠️ **PARTIALLY COVERED** - Model exists, automation missing
- **User Value:** Reduces manual work, essential for recurring bills/income
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Create RecurringTransaction management UI + cron job
- **Implementation:** UI for creating recurring rules, background job to auto-generate
- **Effort:** Medium (10-15 hours) - UI + background job + testing

**Proposed Addition:**
```
Phase 3: Add Recurring Transactions
- POST /api/recurring-transactions - Define recurring rule
- GET /api/recurring-transactions - List rules
- Background job: Auto-generate transactions based on rules
- UI: RecurringTransactionForm with frequency (daily/weekly/monthly/yearly)
- UI: Toggle "Skip this month" for exceptions (#10 Mark Recurring as "Not Expected")
```

---

#### #5. Simple Calculations in Amount Fields (71 votes)
- **LunchMoney:** Allow inline math (10+20, 45/2, 100*.15) in transaction/budget fields
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Productivity boost, reduces errors in manual entry
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Parse math expressions in amount inputs
- **Implementation:** Use library like `mathjs` or simple eval for +/-/*/÷
- **Effort:** Low (3-5 hours) - Client-side parsing in TransactionForm, BudgetForm

**Proposed Addition:**
```typescript
// In TransactionForm and BudgetForm
- Parse amount field: "10+20" → 30, "100*.15" → 15
- Show live calculation result below input
- Support operators: + - * / ( )
- Library: mathjs (safe eval) or custom parser
```

---

### PHASE 2: COMPETITIVE DIFFERENTIATION (LunchMoney)

#### #6. Amazon Transaction Details Import (98 votes)
- **LunchMoney:** Break down Amazon purchases into detailed categories - UNIQUE VALUE PROP
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **STRATEGIC OPPORTUNITY**
- **User Value:** HIGH - Unique differentiator, breaks down bundled Amazon orders
- **Recommendation:** ⭐⭐⭐ **ADD TO PHASE 2 or 3** - Competitive moat feature
- **Implementation:** Parse Amazon order emails or CSV exports, split into line items
- **Effort:** High (25-30 hours) - Email parsing, Amazon API integration, or CSV import

**Proposed Addition:**
```
Phase 2C: Amazon Transaction Import (NEW)
- Import Amazon order history CSV
- Parse line items from order details
- Split single $200 Amazon charge into:
  - Office supplies: $50
  - Electronics: $100
  - Books: $50
- Auto-categorize each line item
- Match to bank transaction (single charge)
```

---

#### #7. Zero-Based/Envelope Budgeting (290 votes)
- **LunchMoney:** Support envelope method, budget actual cash on hand, not just income - HIGHEST VOTED
- **Akount:** ⚠️ **Phase 6 (Budgets & Goals)** - Listed as "budgets by category", not envelope-specific
- **Status:** ⚠️ **PARTIALLY COVERED BUT NOT EXPLICIT**
- **User Value:** CRITICAL - 290 votes, highest in Phase 2, envelope budgeting is a strong differentiator
- **Recommendation:** ⭐⭐⭐ **MAKE EXPLICIT IN PHASE 6** - Design for envelope method from start
- **Implementation:** Track "assigned" vs "available" per category, show unassigned cash
- **Effort:** Medium (15-20 hours) - Budget allocation tracking, UI for envelope view

**Proposed Enhancement:**
```
Phase 6: Zero-Based Budgeting (Enhanced)
- Track "To Be Budgeted" (cash not yet assigned)
- Per-category envelopes with assigned/spent/available
- UI: Envelope-style budget view (like YNAB)
- Support transferring between envelopes
- Show "All money has a job" validation
- Mobile-first envelope UI
```

---

#### #8. 12-Month Budget View (143 votes)
- **LunchMoney:** Plan & enter budgets for entire year at once, spreadsheet-style
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Planning efficiency, see full year at once
- **Recommendation:** ⭐⭐ **ADD TO PHASE 6** - Spreadsheet-style budget entry
- **Implementation:** Table with categories as rows, months as columns, inline editing
- **Effort:** Medium (12-15 hours) - Grid component, bulk data entry

**Proposed Addition:**
```
Phase 6: 12-Month Budget View
- UI: Spreadsheet-style table (categories × 12 months)
- Inline editing with keyboard navigation
- Copy budget from previous month/year
- Show totals row (monthly income vs expenses)
- Export to CSV for planning
```

---

#### #9. Savings & Goals (409 votes)
- **LunchMoney:** "By X date, need Y saved" planning + category-specific saving goals - HIGHEST VOTED OVERALL
- **Akount:** ⚠️ **Phase 6 (Budgets & Goals)** - Goals API exists but minimal detail
- **Status:** ⚠️ **COVERED BUT NEEDS ENHANCEMENT**
- **User Value:** CRITICAL - 409 votes, highest overall, core user motivation
- **Recommendation:** ⭐⭐⭐ **ENHANCE PHASE 6** - Make goals first-class feature
- **Implementation:** Goal tracking with deadlines, progress visualization, funding automation
- **Effort:** Medium (15-20 hours) - Goal creation, progress tracking, visual UI

**Proposed Enhancement:**
```
Phase 6: Savings & Goals (Enhanced)
- POST /api/goals - Create goal with target amount, deadline
- Track progress: current/target/remaining
- Show "Need to save X/month to reach goal"
- Category-specific goals (e.g., "Save $5000 for vacation by July")
- Goal funding: Auto-allocate from transactions
- Progress visualization: Progress bars, countdown timers
- Goal priorities: Rank goals, show next milestone
```

---

#### #10. Mark Recurring as "Not Expected" (181 votes)
- **LunchMoney:** Skip recurring items for specific months (gym during vacation)
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Flexibility for recurring transactions that don't always happen
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Include with recurring transaction feature (#4)
- **Implementation:** Add "Skip" flag to recurring transaction instances
- **Effort:** Low (3-5 hours) - Add skipMonth field, UI toggle

**Proposed Addition:**
```
// Combined with #4 Recurring Transactions
- Add RecurringTransactionException model
  - recurringTransactionId
  - skipMonth (date)
  - reason (optional)
- UI: Calendar view of recurring transactions
- "Skip this month" button on each instance
- Show skipped instances in gray with reason
```

---

### PHASE 3: POWER USER PRODUCTIVITY (LunchMoney)

#### #11. Bulk Edit Transactions
- **LunchMoney:** Select multiple transactions, change category/tags/payee at once
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **CRITICAL EFFICIENCY GAP**
- **User Value:** Massive time savings for categorizing similar transactions
- **Recommendation:** ⭐⭐ **ADD TO PHASE 3** - Essential for transaction management
- **Implementation:** Checkbox selection, bulk action toolbar, apply changes
- **Effort:** Medium (10-12 hours) - Selection state, bulk API endpoint, UI

**Proposed Addition:**
```
Phase 3: Bulk Edit Transactions
- UI: Checkbox column in TransactionTable
- Bulk action toolbar: Change category, add tags, change entity
- PATCH /api/transactions/bulk - Update multiple transactions
- Show "X transactions selected" with clear selection button
- Undo bulk changes (audit log)
```

---

#### #12. Duplicate Transaction (32 votes)
- **LunchMoney:** Copy existing transactions as templates for similar entries
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Efficiency for similar manual entries
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Low effort, high value
- **Implementation:** "Duplicate" button on transaction row, opens form with copied data
- **Effort:** Low (2-3 hours) - Copy data, open form

**Proposed Addition:**
```typescript
// In TransactionList row actions
- Add "Duplicate" button
- Copy all fields except id, date, createdAt
- Open TransactionForm with pre-filled data
- User adjusts amount/date/description as needed
```

---

#### #13. Keyboard Shortcuts (105 votes)
- **LunchMoney:** Tab navigation, spreadsheet-style movement, ESC to close panels
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **CRITICAL POWER USER GAP**
- **User Value:** HIGH - 105 votes, essential for speed/efficiency
- **Recommendation:** ⭐⭐⭐ **ADD TO PHASE 3** - Power users expect this
- **Implementation:** Global keyboard handler, shortcuts for common actions
- **Effort:** Medium (8-10 hours) - Keyboard listener, shortcut overlay, documentation

**Proposed Addition:**
```
Phase 3: Keyboard Shortcuts
- Global shortcuts:
  - "/" - Focus search
  - "n" - New transaction
  - "c" - Categorize selected
  - "ESC" - Close dialog/panel
  - "Tab/Shift+Tab" - Navigate table cells
  - "?" - Show shortcuts overlay
- Arrow key navigation in tables
- Vim-style navigation (h/j/k/l) optional
- Shortcuts help modal (triggered by "?")
```

---

#### #14. Set Anticipated Amount for Pending (52 votes, PLANNED)
- **LunchMoney:** Edit pending transaction amounts before they post ($1 → $40)
- **Akount:** ⚠️ **Schema supports (Transaction.status = PENDING)** but no UI
- **Status:** ⚠️ **PARTIALLY COVERED**
- **User Value:** Accurate cash flow projections for pending charges
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Include with transaction management
- **Implementation:** Allow editing pending transaction amounts, show estimated vs actual
- **Effort:** Low (3-5 hours) - Add edit capability to pending transactions

**Proposed Addition:**
```
Phase 3: Pending Transaction Management
- Filter: Show pending transactions separately
- Allow editing amount on pending transactions
- Show "Estimated: $40" vs "Posted: $1" when finalized
- Badge: "Amount changed" when pending → posted differs
- Notification: Alert when pending posts with different amount
```

---

#### #15. Custom Budget Periods (118 votes)
- **LunchMoney:** Yearly budgets for certain categories (insurance, subscriptions)
- **Akount:** ❌ **NOT IN ROADMAP** (Phase 6 budgets assume monthly)
- **Status:** ❌ **MISSING**
- **User Value:** Flexibility for non-monthly expenses
- **Recommendation:** ⭐ **ADD TO PHASE 6** - Enhance budget model
- **Implementation:** Add `period` field (monthly/quarterly/yearly), prorate display
- **Effort:** Medium (8-10 hours) - Budget model update, UI for period selection

**Proposed Enhancement:**
```
Phase 6: Custom Budget Periods
- Add Budget.period enum (MONTHLY, QUARTERLY, YEARLY, CUSTOM)
- UI: Select budget period per category
- Display: Prorate yearly budgets to monthly view ($1200/year → $100/month)
- Example: Insurance category = $1200/year
- Show progress: "$800 spent of $1200 (66%)" with 4 months remaining
```

---

### PHASE 4: ESSENTIAL REPORTING & VISIBILITY (LunchMoney)

#### #16. Sankey Diagram for Spending (127 votes)
- **LunchMoney:** Visual income-to-expense flow diagram
- **Akount:** ⚠️ **Phase 5 (Analytics)** - Charts mentioned but not Sankey-specific
- **Status:** ⚠️ **PARTIALLY COVERED**
- **User Value:** Visual understanding of money flow
- **Recommendation:** ⭐ **MAKE EXPLICIT IN PHASE 5** - Include Sankey in analytics
- **Implementation:** Use D3.js or Recharts Sankey component
- **Effort:** Medium (8-10 hours) - Data transformation, Sankey component

**Proposed Enhancement:**
```
Phase 5: Sankey Cash Flow Diagram
- Visualize: Income → Spending → Categories
- Example:
  Salary ($5000) ─┬─> Housing ($1500)
                  ├─> Food ($800)
                  ├─> Transport ($300)
                  └─> Savings ($2400)
- Interactive: Click to drill down
- Time period selector (month/quarter/year)
- Export as image
```

---

#### #17. Overview of All Recurring Items (49 votes)
- **LunchMoney:** See all planned transactions across months, not just current
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING** (combines with #4 Recurring Transactions)
- **User Value:** Visibility into upcoming obligations
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Include with recurring transaction feature
- **Implementation:** Calendar view or list of upcoming recurring transactions
- **Effort:** Low (5-6 hours) - Query upcoming instances, display in calendar

**Proposed Addition:**
```
Phase 3: Recurring Transactions Overview
- GET /api/recurring-transactions/upcoming?months=12
- Calendar view showing next 12 months of recurring transactions
- List view with grouping by month
- Show total recurring income/expenses per month
- Highlight months with exceptions (skipped)
```

---

#### #18. Show Upcoming Bills (67 votes)
- **LunchMoney:** Bill tracking dashboard, especially credit card due dates
- **Akount:** ✅ **Phase 4 (Invoicing & Bills)** - Bill tracking included
- **Status:** ✅ **COVERED**
- **User Value:** Avoid late payments, cash flow planning
- **Recommendation:** ⭐ **ENHANCE PHASE 4** - Add dedicated "Upcoming Bills" dashboard widget
- **Implementation:** Show bills due in next 7/14/30 days, sort by due date
- **Effort:** Low (3-4 hours) - Query + dashboard card

**Proposed Enhancement:**
```
Phase 4: Upcoming Bills Dashboard
- DashboardCard: "Bills Due Soon"
- Show next 5 bills with due dates
- Color coding: Overdue (red), Due this week (amber), Upcoming (blue)
- Quick action: "Mark as paid" button
- Notification: Alert 3 days before due date
```

---

#### #19. Credit Card % Used (29 votes)
- **LunchMoney:** Display utilization percentage in overview
- **Akount:** ⚠️ **Schema supports (Account.creditLimit)** but no utilization calc
- **Status:** ⚠️ **PARTIALLY COVERED**
- **User Value:** Credit health monitoring
- **Recommendation:** ⭐ **ADD TO PHASE 1** - Include in AccountsList
- **Implementation:** Calculate balance/creditLimit, show percentage and color coding
- **Effort:** Low (2-3 hours) - Calculation + UI badge

**Proposed Addition:**
```
Phase 1: Credit Card Utilization
- Show utilization % on credit card accounts
- Color coding:
  - Green: 0-30%
  - Amber: 30-50%
  - Red: >50%
- Badge: "45% used" on account card
- Tooltip: "Using $4500 of $10000 limit"
```

---

#### #20. Income vs Expense Difference (26 votes)
- **LunchMoney:** Prominent surplus/deficit display
- **Akount:** ⚠️ **Phase 5 (Analytics)** - P&L report likely covers this
- **Status:** ⚠️ **COVERED BUT NOT PROMINENT**
- **User Value:** Quick understanding of financial health
- **Recommendation:** ⭐ **ADD TO PHASE 1** - Dashboard card
- **Implementation:** Calculate income - expenses, show on dashboard
- **Effort:** Low (2-3 hours) - Calculation + dashboard card

**Proposed Addition:**
```
Phase 1: Monthly Cash Flow Card
- Show income vs expenses for current month
- Display: "Income: $5000 | Expenses: $3500 | Net: +$1500"
- Color coding: Green (surplus), Red (deficit)
- Trend: Compare to last month
- Click to navigate to P&L report
```

---

### PHASE 5: MULTI-ENTITY & ADVANCED ACCOUNTS (LunchMoney)

#### #21. Auto-Import Investment Holdings (142 votes)
- **LunchMoney:** Import individual stocks/holdings from Flinks, not just totals
- **Akount:** ⚠️ **Schema supports (Investment accounts)** but not detailed holdings
- **Status:** ⚠️ **PARTIALLY COVERED - NEEDS ENHANCEMENT**
- **User Value:** HIGH for multi-entity users, complete net worth picture
- **Recommendation:** ⭐⭐ **ENHANCE PHASE 2** - Add InvestmentHolding model and import
- **Implementation:** Import holdings from Flinks, track individual stocks with quantities/prices
- **Effort:** High (20-25 hours) - New model, Flinks integration, portfolio view

**Proposed Addition:**
```
Phase 2D: Investment Holdings Import (NEW)
- Add InvestmentHolding model:
  - accountId, symbol, quantity, purchasePrice, currentPrice
- Import from Flinks: GET individual holdings
- UI: Portfolio view with holdings table
- Show: Symbol, Quantity, Cost Basis, Current Value, Gain/Loss
- Auto-update prices daily (Yahoo Finance API or similar)
- Support manual entry for holdings not connected
```

---

#### #22. Richer Loan/Mortgage Tracking (84 votes)
- **LunchMoney:** Show balance, principal, interest breakdown, amortization
- **Akount:** ⚠️ **Schema supports (Loan accounts)** but no amortization tracking
- **Status:** ⚠️ **PARTIALLY COVERED - NEEDS ENHANCEMENT**
- **User Value:** HIGH for multi-entity users with complex loan structures
- **Recommendation:** ⭐⭐ **ENHANCE PHASE 1 or 2** - Add LoanPayment tracking
- **Implementation:** Calculate amortization, track principal/interest split per payment
- **Effort:** Medium (12-15 hours) - Amortization calculation, payment breakdown UI

**Proposed Addition:**
```
Phase 1B: Loan Amortization Tracking (NEW)
- Add LoanPayment model:
  - accountId, date, amount, principalPaid, interestPaid, balance
- Calculate amortization schedule from:
  - Principal, interest rate, term, start date
- UI: Amortization table showing:
  - Payment number, Date, Payment amount, Principal, Interest, Remaining balance
- Chart: Principal vs Interest over time
- Show: "Paid $15,234 interest, $8,766 principal so far"
```

---

#### #23. Split Account Overview into Groups (37 votes)
- **LunchMoney:** User-defined account groupings (Business, Personal, Properties)
- **Akount:** ✅ **Phase 1 (Accounts Overview)** - Entity filtering achieves similar goal
- **Status:** ✅ **COVERED VIA ENTITY MODEL**
- **User Value:** Organization for users with multiple contexts
- **Recommendation:** ✅ **KEEP AS-IS** - Our entity filtering is superior (multi-tenant isolation)
- **Note:** Our entity model (Business, Personal, Properties as separate entities) is more powerful than account groups

---

#### #24. Recurring Transfers (47 votes)
- **LunchMoney:** Define recurring transfers (monthly investment contributions)
- **Akount:** ⚠️ **Covered by #4 (Recurring Transactions)** if we implement it
- **Status:** ⚠️ **WILL BE COVERED**
- **User Value:** Automate repetitive transfers between accounts
- **Recommendation:** ⭐ **ENSURE PHASE 3 INCLUDES** - Recurring transactions should support transfers
- **Implementation:** RecurringTransaction with type=TRANSFER, from/to accounts
- **Effort:** Low (included in #4 implementation)

**Proposed Enhancement:**
```
Phase 3: Recurring Transfers
- RecurringTransaction.type = TRANSFER
- Fields: fromAccountId, toAccountId, amount, frequency
- Auto-generate transfer transactions
- Example: "Monthly: Checking → Investment ($500)"
- Show in recurring transactions overview
```

---

#### #25. Track Stock Manually (96 votes)
- **LunchMoney:** Add stock tickers with auto-price updates (Yahoo Finance API)
- **Akount:** ❌ **NOT IN ROADMAP** (related to #21 Investment Holdings)
- **Status:** ❌ **MISSING**
- **User Value:** Manual portfolio tracking for users without connected accounts
- **Recommendation:** ⭐ **ADD TO #21 INVESTMENT HOLDINGS** - Support manual entry
- **Implementation:** Allow adding stocks manually, fetch prices from Yahoo Finance API
- **Effort:** Medium (8-10 hours) - Manual entry UI, price fetching API

**Proposed Addition:**
```
Phase 2D: Manual Stock Tracking (part of #21)
- UI: "Add holding manually" button
- Form: Symbol, Quantity, Purchase date, Purchase price
- Auto-fetch current price from Yahoo Finance API
- Calculate gain/loss
- Update prices daily via cron job
- Show: "AAPL: 10 shares, $1500 → $1850 (+23%)"
```

---

### PHASE 6: INTELLIGENT AUTOMATION (LunchMoney)

#### #26. Auto-Group Transactions (Rules) (147 votes)
- **LunchMoney:** Match credit card payments to transfers automatically
- **Akount:** ⚠️ **Schema supports (Rule model)** but not detailed in roadmap
- **Status:** ⚠️ **PARTIALLY COVERED**
- **User Value:** HIGH - Automation reduces manual work significantly
- **Recommendation:** ⭐⭐ **MAKE EXPLICIT IN PHASE 3** - Rule creation and application
- **Implementation:** UI for creating rules, auto-apply on import/categorization
- **Effort:** Medium (15-18 hours) - Rule engine, UI, testing

**Proposed Addition:**
```
Phase 3: Transaction Rules & Auto-Grouping
- POST /api/rules - Create rule
- Rule types:
  - Auto-categorize: If description contains X, set category Y
  - Auto-match: If credit card payment, match to transfer
  - Auto-split: If merchant X, split into categories A/B
- UI: RulesBuilder with conditions and actions
- Apply rules on:
  - CSV import
  - Bank feed sync
  - Manual transaction creation
- Show: "Rule applied" badge on auto-categorized transactions
```

---

#### #27. Regex Support in Rules (90 votes)
- **LunchMoney:** Use regular expressions for pattern matching
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Power user feature, flexible pattern matching
- **Recommendation:** ⭐⭐ **ADD TO PHASE 3** - Include with rules (#26)
- **Implementation:** Add regex field to Rule model, validate and apply regex patterns
- **Effort:** Low (3-5 hours) - Regex parsing, validation, UI help

**Proposed Enhancement:**
```
Phase 3: Regex in Rules (part of #26)
- Rule condition types:
  - Contains (simple string match)
  - Regex (advanced pattern matching)
  - Amount range
  - Date range
- Example regex rules:
  - "^AMZN.*" - Match all Amazon transactions
  - "^\d{4}-\d{4}$" - Match 4-digit patterns
- UI: Regex tester (validate pattern before saving)
- Help: Regex cheatsheet in UI
```

---

#### #28. Add "OR" Operator in Rules (73 votes)
- **LunchMoney:** "From account A OR account B" logic consolidation
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Flexible rule creation, reduce duplicate rules
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Include with rules (#26)
- **Implementation:** Support AND/OR logic in rule conditions
- **Effort:** Low (3-5 hours) - Rule evaluation logic update

**Proposed Enhancement:**
```
Phase 3: Rule Logic Operators (part of #26)
- Support AND/OR operators in rules
- Example:
  - IF (description contains "Uber" OR "Lyft")
    AND (amount < $50)
    THEN category = "Transportation"
- UI: Visual rule builder with AND/OR dropdowns
- Evaluation: Parse condition tree and apply
```

---

#### #29. Auto-Categorization (ML-based)
- **LunchMoney:** Learn from user corrections, suggest categories with confidence scores
- **Akount:** ✅ **Phase 7 (AI Financial Advisor)** - AI categorization mentioned
- **Status:** ✅ **COVERED**
- **User Value:** Time savings, reduces manual categorization
- **Recommendation:** ✅ **KEEP AS PLANNED** - Phase 7 is appropriate timing
- **Note:** Start with rule-based (#26), then add ML in Phase 7

---

#### #30. Create Rules from Plaid/Flinks Metadata (44 votes, PLANNED)
- **LunchMoney:** Use transaction metadata for smarter rule creation
- **Akount:** ⚠️ **Phase 2 mentions Flinks** but not metadata-based rules
- **Status:** ⚠️ **PARTIALLY COVERED**
- **User Value:** Richer rule creation using structured metadata
- **Recommendation:** ⭐ **ADD TO PHASE 2** - Extract metadata from Flinks and use in rules
- **Implementation:** Parse Flinks metadata (merchant name, category, etc.), suggest rules
- **Effort:** Low (5-6 hours) - Metadata extraction, rule suggestion

**Proposed Addition:**
```
Phase 2: Flinks Metadata Enrichment
- Extract from Flinks:
  - Merchant name (structured)
  - Merchant category code (MCC)
  - Location
  - Metadata tags
- Use in rules:
  - "If merchant = Starbucks, category = Coffee"
  - "If MCC = 5411 (Grocery), category = Groceries"
- UI: "Create rule from this transaction" button
- Suggest rule based on metadata
```

---

### PHASE 7: IMPORT/EXPORT & DATA PORTABILITY (LunchMoney)

#### #31. Import Net Worth from Mint (39 votes, PLANNED)
- **LunchMoney:** Import historical account balance CSV from Mint
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Migration ease, historical data preservation
- **Recommendation:** ⭐ **ADD TO PHASE 2** - Support Mint CSV import format
- **Implementation:** Parse Mint CSV export, import to AccountBalance model (historical)
- **Effort:** Medium (8-10 hours) - CSV parser, Mint format handling, import UI

**Proposed Addition:**
```
Phase 2: Historical Data Import from Mint
- Support CSV import from Mint export format
- Parse:
  - Account name, date, balance
  - Transaction history
- Import to:
  - AccountBalance (create historical snapshots)
  - Transaction (import transaction history)
- UI: "Import from Mint" wizard
- Map Mint categories to Akount categories
```

---

#### #32. Export Everything (60 votes)
- **LunchMoney:** Export all data including attachments for data ownership
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **CRITICAL TRUST GAP**
- **User Value:** Data ownership, migration flexibility, trust building
- **Recommendation:** ⭐⭐⭐ **ADD TO PHASE 5** - Essential for trust, before launch
- **Implementation:** Generate comprehensive data export (JSON/CSV + attachments ZIP)
- **Effort:** Medium (10-12 hours) - Export all models, ZIP attachments, download UI

**Proposed Addition:**
```
Phase 5: Data Export
- GET /api/export/full - Generate comprehensive export
- Export formats:
  - JSON (complete data, all relationships)
  - CSV (per-entity spreadsheets)
  - ZIP (attachments + metadata)
- Include:
  - Accounts, transactions, invoices, bills, payments
  - Categories, budgets, goals
  - Attachments (PDF, images)
- UI: "Export all data" button in settings
- Show: "Your data is yours. Export anytime."
```

---

#### #33. Auto-Categorization on CSV Import (9 votes)
- **LunchMoney:** Apply rules to CSV imports like bank sync does
- **Akount:** ⚠️ **Covered by #26 (Rules)** if we implement rule application on import
- **Status:** ⚠️ **WILL BE COVERED**
- **User Value:** Consistency, saves time on bulk imports
- **Recommendation:** ⭐ **ENSURE PHASE 2 INCLUDES** - Apply rules during CSV import
- **Implementation:** Run rule engine on imported transactions
- **Effort:** Low (included in #26 implementation)

**Proposed Enhancement:**
```
Phase 2: Auto-Categorize on Import (part of #26)
- After CSV import, run rule engine on all imported transactions
- Show: "X of Y transactions auto-categorized"
- Allow review before finalizing
- Option: "Apply rules on import" checkbox
```

---

#### #34. Custom Default Date Range (17 votes)
- **LunchMoney:** Set default view period (pay cycle: 25th to 25th)
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Personalization, aligns with pay cycles
- **Recommendation:** ⭐ **ADD TO PHASE 1** - User preferences for date ranges
- **Implementation:** Store user preference, apply to all date range selectors
- **Effort:** Low (3-4 hours) - User preference model, apply to filters

**Proposed Addition:**
```
Phase 1: Custom Date Range Preferences
- Add UserPreference model:
  - defaultDateRangeType (CURRENT_MONTH, PAY_CYCLE, CUSTOM)
  - payCycleStartDay (1-31)
  - payCycleFrequency (MONTHLY, BIWEEKLY)
- Apply to:
  - Dashboard (default view)
  - Transaction list filters
  - Reports date range picker
- UI: Settings page with date range configuration
```

---

#### #35. Default Quick Filter Period (35 votes)
- **LunchMoney:** Set "This Year" or "All Time" as default instead of Current Month
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING** (same as #34)
- **User Value:** Personalization, see big picture by default
- **Recommendation:** ⭐ **ADD TO PHASE 1** - Include with #34 user preferences
- **Implementation:** User preference for default filter period
- **Effort:** Low (included in #34)

---

### PHASE 8: CATEGORIES & ORGANIZATION (LunchMoney)

#### #36. Mark Category as "Savings" (107 votes)
- **LunchMoney:** Show in breakdown but exclude from expense totals (IRA contributions)
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Accurate expense tracking, distinguish savings from spending
- **Recommendation:** ⭐⭐ **ADD TO PHASE 3** - Category properties
- **Implementation:** Add `excludeFromExpenses` flag to Category model
- **Effort:** Low (3-4 hours) - Model update, filter logic, UI checkbox

**Proposed Addition:**
```
Phase 3: Category Properties
- Add Category fields:
  - excludeFromExpenses (boolean)
  - type (INCOME, EXPENSE, TRANSFER, SAVINGS)
- UI: "Exclude from expense totals" checkbox in category settings
- Impact:
  - P&L report: Exclude savings categories from expenses
  - Budget: Show separately ("Savings" section vs "Expenses")
  - Net worth: Include savings in asset calculations
- Example: "IRA Contribution" marked as savings, not expense
```

---

#### #37. Properties for Tags (68 votes)
- **LunchMoney:** Tags work like categories (exclude from budget, treat as income)
- **Akount:** ⚠️ **Schema has Tag model** but no properties
- **Status:** ⚠️ **PARTIALLY COVERED**
- **User Value:** Flexible organization beyond categories
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Tag properties
- **Implementation:** Add properties to Tag model (color, excludeFromBudget, etc.)
- **Effort:** Low (4-5 hours) - Model update, UI

**Proposed Addition:**
```
Phase 3: Tag Properties
- Add Tag fields:
  - color (hex code)
  - excludeFromBudget (boolean)
  - excludeFromReports (boolean)
  - type (INFORMATIONAL, ORGANIZATIONAL, WORKFLOW)
- UI: Tag settings page
- Use cases:
  - Tag "Reimbursable" - exclude from personal expenses
  - Tag "Tax-deductible" - highlight in reports
  - Tag "Work" - filter for business entity
```

---

#### #38. Color-Code Categories (52 votes)
- **LunchMoney:** Assign colors for visual identification throughout app
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Visual organization, faster recognition
- **Recommendation:** ⭐ **ADD TO PHASE 3** - Category colors
- **Implementation:** Add `color` field to Category model, show in UI
- **Effort:** Low (2-3 hours) - Model update, color picker, apply in UI

**Proposed Addition:**
```
Phase 3: Category Colors
- Add Category.color (hex code)
- UI: Color picker in category settings
- Apply colors:
  - Transaction list (category badge)
  - Budget breakdown (pie chart)
  - Reports (bar charts)
- Defaults: Auto-assign from palette for new categories
```

---

#### #39. Budget by Tag/Merchant/Account (25 votes)
- **LunchMoney:** Create budgets beyond categories (all Amazon spending)
- **Akount:** ❌ **NOT IN ROADMAP**
- **Status:** ❌ **MISSING**
- **User Value:** Flexible budget tracking (e.g., "All online shopping")
- **Recommendation:** ⭐ **ADD TO PHASE 6** - Budget enhancements
- **Implementation:** Support budget constraints beyond category (tag, merchant, account)
- **Effort:** Medium (10-12 hours) - Budget model update, constraint logic, UI

**Proposed Addition:**
```
Phase 6: Flexible Budget Constraints
- Budget types:
  - By category (existing)
  - By tag ("Budget all Work-tagged transactions")
  - By merchant ("Budget all Amazon purchases")
  - By account ("Budget all Credit Card spending")
  - Combined ("Budget Groceries from Account X")
- UI: Budget constraint builder
- Calculation: Filter transactions by constraint, sum amount
- Show: "Spent $450 of $500 on Amazon (90%)"
```

---

#### #40. Additional Subcategory Levels (22 votes)
- **LunchMoney:** Nested categories beyond two levels for complex structures
- **Akount:** ✅ **Schema supports (Category.parentCategoryId)** - Can be nested infinitely
- **Status:** ✅ **COVERED**
- **User Value:** Organization for complex categorization
- **Recommendation:** ✅ **ALREADY SUPPORTED** - Prisma model allows infinite nesting
- **Note:** Just need UI to support displaying/editing nested categories
- **Effort:** Low (5-6 hours) - Tree view UI for categories

**Proposed Enhancement:**
```
Phase 3: Nested Category UI
- Display categories in tree view (collapsible)
- Support drag-and-drop reordering
- Example structure:
  Transportation
    ├─ Gas
    ├─ Uber/Lyft
    │  ├─ Uber
    │  └─ Lyft
    └─ Parking
- Show breadcrumbs in transaction form
- Allow moving categories between parents
```

---

## Strategic Recommendations

### IMMEDIATE PRIORITIES (Add to Current Phase 1)

#### 1. Running Balance Display (86 votes) - 2-3 hours
**Why:** Core accounting feature, high votes, low effort
**Add to:** Phase 1 (Accounts Overview)
```
- Add running balance column to AccountsList
- Show balance after each transaction in transaction detail
- Include trend in NetWorthCard
```

#### 2. Credit Card Utilization % (29 votes) - 2-3 hours
**Why:** Already have creditLimit field, just need display logic
**Add to:** Phase 1 (Accounts Overview)
```
- Calculate balance / creditLimit
- Show percentage badge on credit card accounts
- Color coding: Green (<30%), Amber (30-50%), Red (>50%)
```

#### 3. Monthly Income vs Expense Card (26 votes) - 2-3 hours
**Why:** Essential financial health indicator for dashboard
**Add to:** Phase 1 (Accounts Overview)
```
- Create MonthlyCashFlowCard
- Show: Income, Expenses, Net (surplus/deficit)
- Color coding and trend comparison
```

**Total effort: 6-9 hours - Can complete in Phase 1 without delaying timeline**

---

### PHASE 2 ENHANCEMENTS

#### 4. Cash Flow Forecasting (208 votes) - PROMOTE FROM PHASE 6
**Why:** KILLER DIFFERENTIATOR, high user demand, competitive moat
**Action:** Create **Phase 2B: Cash Flow Forecasting**
```
- Project future balance based on recurring transactions
- Show 7/30/90 day projections
- Display "Balance on [date]" with confidence
- Effort: 15-20 hours (medium)
```

#### 5. Amazon Transaction Import (98 votes) - UNIQUE VALUE PROP
**Why:** Competitive differentiator, nobody else does this well
**Action:** Create **Phase 2C: Amazon Transaction Import**
```
- Parse Amazon order CSV exports
- Split bundled orders into line items
- Auto-categorize each item
- Effort: 25-30 hours (high)
```

#### 6. Investment Holdings Import (142 votes) - MULTI-ENTITY TARGET MARKET
**Why:** High value for target market (solopreneurs with investments)
**Action:** Create **Phase 2D: Investment Holdings**
```
- Add InvestmentHolding model
- Import from Flinks (individual stocks)
- Portfolio view with gain/loss tracking
- Effort: 20-25 hours (high)
```

**Phase 2 total addition: 60-75 hours (1.5-2 weeks) - HIGH VALUE**

---

### PHASE 3 CRITICAL ADDITIONS

#### 7. Recurring Transactions (49 votes + 181 votes) - AUTO-CREATE + SKIP MONTHS
**Why:** Reduces manual work, essential for recurring bills/income
**Action:** Add to Phase 3
```
- RecurringTransaction CRUD
- Auto-generation background job
- "Skip this month" exceptions
- Calendar overview of recurring items
- Effort: 15-20 hours (medium)
```

#### 8. Transaction Rules & Auto-Grouping (147 votes + 90 votes + 73 votes)
**Why:** High automation value, includes regex and OR operators
**Action:** Add to Phase 3
```
- Rule builder UI
- Support regex patterns
- AND/OR logic operators
- Auto-apply on import
- Effort: 20-25 hours (medium-high)
```

#### 9. Bulk Edit Transactions - CRITICAL EFFICIENCY
**Why:** Massive time savings for categorizing similar transactions
**Action:** Add to Phase 3
```
- Checkbox selection in transaction table
- Bulk action toolbar
- Update category/tags/entity for multiple transactions
- Effort: 10-12 hours (medium)
```

#### 10. Keyboard Shortcuts (105 votes) - POWER USER ESSENTIAL
**Why:** 105 votes, power users expect this for efficiency
**Action:** Add to Phase 3
```
- Global keyboard handler
- Shortcuts: / (search), n (new), c (categorize), ESC (close)
- Arrow navigation in tables
- Help overlay (?)
- Effort: 8-10 hours (medium)
```

#### 11. Simple Calculations in Amount Fields (71 votes)
**Why:** Productivity boost, reduces errors
**Action:** Add to Phase 3
```
- Parse math expressions in amount inputs
- Support +, -, *, /, ()
- Show live result
- Effort: 3-5 hours (low)
```

**Phase 3 total addition: 56-72 hours (1.5-2 weeks) - HIGH IMPACT**

---

### PHASE 6 ENHANCEMENTS (Budgets & Goals)

#### 12. Zero-Based/Envelope Budgeting (290 votes) - HIGHEST VOTED
**Why:** Strongest user demand signal, competitive differentiator
**Action:** Design Phase 6 for envelope budgeting from start
```
- Track "To Be Budgeted" (unassigned cash)
- Per-category envelopes (assigned/spent/available)
- Envelope-style UI (like YNAB)
- Transfer between envelopes
- Effort: 15-20 hours (medium) - included in Phase 6
```

#### 13. 12-Month Budget View (143 votes)
**Why:** Planning efficiency, see full year at once
**Action:** Add to Phase 6
```
- Spreadsheet-style budget grid
- Categories × 12 months
- Inline editing, copy from previous
- Effort: 12-15 hours (medium)
```

#### 14. Custom Budget Periods (118 votes)
**Why:** Flexibility for non-monthly expenses
**Action:** Add to Phase 6
```
- Budget.period enum (monthly/quarterly/yearly)
- Prorate display
- Example: Insurance = $1200/year
- Effort: 8-10 hours (medium)
```

#### 15. Savings & Goals Enhancement (409 votes) - HIGHEST OVERALL
**Why:** Strongest demand signal, core user motivation
**Action:** Enhance existing Phase 6 goals
```
- Goal creation with target + deadline
- Show "Need to save X/month to reach goal"
- Category-specific goals
- Progress visualization
- Effort: 15-20 hours (medium) - included in Phase 6
```

**Phase 6 total enhancement: 35-45 hours (built into Phase 6)**

---

### PHASE 5 ADDITIONS (Before Launch)

#### 16. Data Export (60 votes) - TRUST BUILDER
**Why:** Essential for trust, data ownership, migration flexibility
**Action:** Add to Phase 5
```
- Export all data (JSON, CSV, attachments)
- "Your data is yours" messaging
- Download as ZIP
- Effort: 10-12 hours (medium)
```

#### 17. Sankey Cash Flow Diagram (127 votes)
**Why:** Visual understanding of money flow, mentioned in votes
**Action:** Add to Phase 5 analytics
```
- D3.js or Recharts Sankey component
- Show: Income → Categories → Savings
- Interactive drill-down
- Effort: 8-10 hours (medium)
```

**Phase 5 total addition: 18-22 hours (0.5 weeks)**

---

## PHASE TIMELINE IMPACT

### Original Roadmap (Core MVP: Phases 0-5 + 8)
- **Timeline:** 16-24 weeks (4-6 months)
- **Effort:** 265-355 hours

### Enhanced Roadmap (With LunchMoney Features)
- **Phase 1 additions:** +6-9 hours (running balance, utilization, income/expense)
- **Phase 2 additions:** +60-75 hours (forecasting, Amazon import, investments)
- **Phase 3 additions:** +56-72 hours (recurring, rules, bulk edit, shortcuts, calculations)
- **Phase 5 additions:** +18-22 hours (data export, Sankey)
- **Phase 6 enhancements:** +0 hours (built into existing Phase 6 plan)

**New Total Effort:** 405-533 hours (vs 265-355 original)
**Additional Effort:** +140-178 hours (+53% more work)
**New Timeline:** 24-36 weeks (6-9 months) for enhanced MVP

---

## RECOMMENDED PHASING STRATEGY

### Option A: MVP FIRST, THEN ENHANCEMENTS (Recommended)
**Ship core MVP in 4-6 months, then add high-value features**

**Approach:**
1. Complete Phases 0-5 + 8 as planned (4-6 months)
2. Launch MVP with core features
3. Add Phase 1 enhancements immediately post-launch (1 week)
4. Add Phase 2B-D in months 6-7 (forecasting, Amazon, investments)
5. Add Phase 3 enhancements in months 7-8 (recurring, rules, shortcuts)
6. Add Phase 6 enhancements in month 9 (envelope budgeting, 12-month view)

**Benefits:**
- ✅ Launch faster (4-6 months to MVP)
- ✅ Get user feedback before building high-effort features
- ✅ Validate demand for specific features
- ✅ Iterative, lean approach

**Risks:**
- ⚠️ Competitors may have features we don't at launch
- ⚠️ May lose users who need specific features (e.g., envelope budgeting)

---

### Option B: ENHANCED MVP (Longer Timeline)
**Build key high-demand features before launch**

**Approach:**
1. Add to Phase 1: Running balance, utilization, income/expense (1 week)
2. Keep Phase 2 as-is, add forecasting (Phase 2B) - defer Amazon/investments post-launch
3. Add to Phase 3: Recurring transactions, rules, bulk edit, shortcuts
4. Keep Phases 4-5 as-is
5. Enhance Phase 6: Envelope budgeting, 12-month view, custom periods
6. Complete Phase 8 (polish)

**Timeline:** 22-28 weeks (5.5-7 months)
**Additional Effort:** +80-100 hours vs original plan

**Benefits:**
- ✅ Launch with stronger competitive position
- ✅ Address highest-voted features (envelope budgeting, forecasting, goals)
- ✅ Power user features (shortcuts, rules, bulk edit)

**Risks:**
- ⚠️ Delayed launch (1.5-3 months longer)
- ⚠️ More complex to test and polish
- ⚠️ Higher risk of scope creep

---

### Option C: HYBRID (Strategic Features Only)
**Add only the highest-ROI features pre-launch**

**Approach:**
1. **Phase 1:** Add running balance, utilization, income/expense (+6-9 hours)
2. **Phase 2:** Add forecasting only (+15-20 hours) - defer Amazon/investments
3. **Phase 3:** Add recurring transactions (+15-20 hours) and keyboard shortcuts (+8-10 hours)
4. **Phase 5:** Add data export (+10-12 hours) - trust builder
5. **Phase 6:** Enhance for envelope budgeting (built-in to existing plan)
6. Defer to post-launch:
   - Amazon import (high effort, niche use case)
   - Investment holdings (complex, can wait)
   - Rules/bulk edit (nice-to-have, not essential for MVP)

**Timeline:** 18-22 weeks (4.5-5.5 months)
**Additional Effort:** +54-71 hours (+20% vs original)

**Benefits:**
- ✅ Moderate timeline extension (0.5-1 month)
- ✅ Addresses critical gaps (forecasting, recurring, envelope budgeting)
- ✅ Builds trust (data export)
- ✅ Power user essential (keyboard shortcuts)

**Risks:**
- ⚠️ Some high-voted features still deferred (bulk edit, rules, Amazon import)
- ⚠️ May need post-launch iteration for competitive parity

---

## FINAL RECOMMENDATION

### **GO WITH OPTION C: HYBRID APPROACH**

**Why:**
1. **Addresses critical gaps** (running balance, forecasting, recurring, envelope budgeting)
2. **Reasonable timeline impact** (+0.5-1 month vs +2-3 months)
3. **Builds trust** (data export before launch)
4. **Power user essential** (keyboard shortcuts)
5. **Defers complex features** (Amazon, investments, rules) to post-launch based on demand

**Suggested Immediate Actions:**
1. ✅ **Add to current Phase 1 plan:**
   - Running balance display
   - Credit card utilization %
   - Monthly income vs expense card
   - **Timeline impact:** +1 day
2. ✅ **Update Phase 2 plan:**
   - Add Phase 2B: Cash Flow Forecasting
   - **Timeline impact:** +3-4 days
3. ✅ **Update Phase 3 plan:**
   - Add recurring transactions
   - Add keyboard shortcuts
   - **Timeline impact:** +5-6 days
4. ✅ **Update Phase 5 plan:**
   - Add data export
   - **Timeline impact:** +2 days
5. ✅ **Update Phase 6 plan:**
   - Make envelope budgeting explicit
   - Add 12-month view
   - Add custom budget periods
   - **Timeline impact:** Built-in to existing Phase 6 timeline

**Total Timeline Impact:** +11-14 days (~2.5-3 weeks) across 6 phases
**New MVP Timeline:** 19-27 weeks (4.75-6.75 months) vs 16-24 weeks original
**Value Added:** Critical competitive features addressing 1,500+ user votes

---

## FEATURE SCORECARD

| Feature | Votes | Akount Status | Priority | Effort | ROI | Recommendation |
|---------|-------|---------------|----------|--------|-----|----------------|
| Savings & Goals | 409 | Phase 6 ⚠️ | CRITICAL | Medium | HIGH | ⭐⭐⭐ Enhance Phase 6 |
| Zero-Based Budgeting | 290 | Phase 6 ⚠️ | CRITICAL | Medium | HIGH | ⭐⭐⭐ Make explicit |
| Cash Flow Forecasting | 208 | Phase 6 ⚠️ | CRITICAL | Medium | HIGH | ⭐⭐⭐ Promote to Phase 2 |
| Mark Recurring "Not Expected" | 181 | Missing ❌ | HIGH | Low | HIGH | ⭐⭐ Add to Phase 3 |
| Auto-Group Transactions (Rules) | 147 | Partial ⚠️ | HIGH | Medium | HIGH | ⭐⭐ Add to Phase 3 |
| 12-Month Budget View | 143 | Missing ❌ | HIGH | Medium | MEDIUM | ⭐⭐ Add to Phase 6 |
| Investment Holdings Import | 142 | Partial ⚠️ | HIGH | High | MEDIUM | ⭐⭐ Defer post-launch |
| Sankey Diagram | 127 | Phase 5 ⚠️ | MEDIUM | Medium | MEDIUM | ⭐ Add to Phase 5 |
| Custom Budget Periods | 118 | Missing ❌ | MEDIUM | Medium | MEDIUM | ⭐ Add to Phase 6 |
| Mark Category as "Savings" | 107 | Missing ❌ | MEDIUM | Low | MEDIUM | ⭐ Add to Phase 3 |
| Keyboard Shortcuts | 105 | Missing ❌ | HIGH | Medium | HIGH | ⭐⭐⭐ Add to Phase 3 |
| Amazon Transaction Import | 98 | Missing ❌ | MEDIUM | High | MEDIUM | ⭐ Defer post-launch |
| Track Stock Manually | 96 | Missing ❌ | LOW | Medium | LOW | Defer post-launch |
| Regex Support in Rules | 90 | Missing ❌ | MEDIUM | Low | MEDIUM | ⭐ Add with rules |
| Running Balance Display | 86 | Missing ❌ | CRITICAL | Low | HIGH | ⭐⭐⭐ Add to Phase 1 |
| Richer Loan Tracking | 84 | Partial ⚠️ | MEDIUM | Medium | LOW | Defer post-launch |
| "OR" Operator in Rules | 73 | Missing ❌ | MEDIUM | Low | MEDIUM | ⭐ Add with rules |
| Simple Calculations | 71 | Missing ❌ | MEDIUM | Low | MEDIUM | ⭐ Add to Phase 3 |
| Properties for Tags | 68 | Partial ⚠️ | LOW | Low | LOW | Defer post-launch |
| Show Upcoming Bills | 67 | Phase 4 ✅ | MEDIUM | Low | MEDIUM | ⭐ Enhance Phase 4 |
| Export Everything | 60 | Missing ❌ | HIGH | Medium | HIGH | ⭐⭐⭐ Add to Phase 5 |
| Set Anticipated Amount (Pending) | 52 | Partial ⚠️ | LOW | Low | LOW | Add to Phase 3 |
| Color-Code Categories | 52 | Missing ❌ | LOW | Low | LOW | Add to Phase 3 |
| Overview of All Recurring Items | 49 | Missing ❌ | MEDIUM | Low | MEDIUM | ⭐ Add with recurring |
| Auto-Create Recurring | 49 | Partial ⚠️ | HIGH | Medium | HIGH | ⭐⭐ Add to Phase 3 |
| Recurring Transfers | 47 | Partial ⚠️ | MEDIUM | Low | MEDIUM | ⭐ Add with recurring |
| Create Rules from Flinks | 44 | Partial ⚠️ | MEDIUM | Low | MEDIUM | ⭐ Add to Phase 2 |
| Import Net Worth from Mint | 39 | Missing ❌ | LOW | Medium | LOW | Defer post-launch |
| Split Account Groups | 37 | Covered ✅ | LOW | N/A | N/A | Entity model superior |
| Default Quick Filter | 35 | Missing ❌ | LOW | Low | LOW | Add to Phase 1 |
| Duplicate Transaction | 32 | Missing ❌ | LOW | Low | LOW | Add to Phase 3 |
| Credit Card % Used | 29 | Partial ⚠️ | MEDIUM | Low | MEDIUM | ⭐⭐ Add to Phase 1 |
| Income vs Expense | 26 | Phase 5 ⚠️ | MEDIUM | Low | MEDIUM | ⭐⭐ Add to Phase 1 |
| Budget by Tag/Merchant | 25 | Missing ❌ | LOW | Medium | LOW | Defer post-launch |
| Additional Subcategory Levels | 22 | Covered ✅ | LOW | Low | LOW | ✅ UI enhancement |
| Custom Default Date Range | 17 | Missing ❌ | LOW | Low | LOW | Add to Phase 1 |
| Auto-Categorize CSV Import | 9 | Covered ⚠️ | LOW | N/A | N/A | Part of rules |

**Legend:**
- ✅ **Covered** - Already in roadmap, no changes needed
- ⚠️ **Partial** - Some support exists, needs enhancement
- ❌ **Missing** - Not in roadmap, needs addition
- ⭐⭐⭐ **Critical** - Add before MVP launch
- ⭐⭐ **High Priority** - Add soon after launch
- ⭐ **Medium Priority** - Add when capacity allows

---

## CONCLUSION

Our roadmap covers many high-value features from LunchMoney, but we have **critical gaps** in:
1. **Running balance display** (86 votes) - Missing from core accounting
2. **Cash Flow forecasting** (208 votes) - Deferred too late, should be earlier
3. **Keyboard shortcuts** (105 votes) - Power users expect this
4. **Envelope budgeting** (290 votes) - Highest voted, needs to be explicit
5. **Recurring transactions** (49 votes + 181 votes) - Essential automation

**Recommendation:** Adopt **Option C (Hybrid)** - Add strategic features to existing phases with minimal timeline impact (+2.5-3 weeks). This gives us:
- ✅ Competitive feature parity at launch
- ✅ Addresses highest user demand (1,500+ votes covered)
- ✅ Reasonable timeline (4.75-6.75 months vs 4-6 months)
- ✅ Defers complex features (Amazon, investments) to post-launch validation

**Next Step:** Review this analysis and decide which features to add to current Phase 1 plan.
