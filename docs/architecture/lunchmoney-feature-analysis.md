# LunchMoney Feature Analysis: Strategic Additions to Akount

**Document:** Architecture Decision Record
**Status:** Approved
**Date:** 2026-01-31
**Author:** Architecture Team
**Related:** `docs/features/01-accounts-overview.md`, `ROADMAP.md`

---

## Executive Summary

This document analyzes LunchMoney's top 40 user-requested features (by votes) to identify:
1. **What we should implement** (fills real gaps)
2. **What we're already better at** (superior architecture)
3. **What we should skip** (our approach is fundamentally better)

**Key Findings:**
- Only **5 features** represent genuine gaps worth implementing
- **8 features** are superior in Akount due to our professional architecture
- **27 features** are either niche, post-MVP, or redundant

**Timeline Impact:** +50-65 hours (~10-13 days) distributed across Phases 1, 2, and 5

---

## Our Core Architectural Advantages

### 1. Multi-Entity Architecture (vs Account Groups)
**LunchMoney:** Flat "account groups" (tags on accounts like "Business" vs "Personal")

**Akount:** Complete entity separation with:
- Separate books per entity
- Entity-specific fiscal calendars
- Entity-specific GL accounts
- Entity-specific tax jurisdictions
- Full accounting isolation

**Verdict:** ✅ Our Entity model is 100x more powerful for Canadian freelancers with multiple businesses

---

### 2. Professional Accounting (vs Simple Categorization)
**LunchMoney:** Transaction categories (flat tags)

**Akount:** GAAP-compliant double-entry bookkeeping:
- GL accounts with hierarchical structure
- Journal entries (debits = credits)
- Complete audit trails (immutable)
- Soft deletes only (never lose financial data)
- Source document preservation

**Verdict:** ✅ We're an actual accounting system, not just expense tracking

---

### 3. Multi-Currency Native (vs Display-Only)
**LunchMoney:** Basic multi-currency display

**Akount:** Professional multi-currency:
- FXRate model with historical rates
- Functional vs reporting currency separation
- Integer cents (no Float precision errors)
- Auditable FX conversions for CRA compliance
- Multi-currency invoicing and payments

**Verdict:** ✅ Our currency architecture is professional-grade

---

### 4. Tax & Compliance (vs Manual Tracking)
**LunchMoney:** Manual tax category tagging

**Akount:** CRA audit-ready:
- TaxRate model with jurisdiction-specific rates
- AccountingPolicy model for compliance
- FiscalCalendar for non-calendar fiscal years
- Complete audit trail for CRA audits
- HST/GST tracking built-in

**Verdict:** ✅ We're built for Canadian tax compliance from day one

---

### 5. Transaction Complexity (vs Simple Splits)
**LunchMoney:** Basic split transactions

**Akount:** Full transaction modeling:
- TransactionSplit for complex allocations
- Project allocation for cost center tracking
- GL account posting
- Multi-entity transactions
- Foreign currency transactions

**Verdict:** ✅ We have multiple layers (GL + categories + projects + entities)

---

## CRITICAL GAPS: Must Implement

These 5 features represent real gaps that LunchMoney users value and we currently lack:

### 1. Running Balance Display ⭐⭐⭐

**What:** Show balance after each transaction in account/transaction views

**Why Critical:**
- Core accounting feature - users need to see "balance after this transaction"
- Helps detect errors (account went negative unexpectedly)
- Industry standard in all accounting software

**User Demand:** 86 votes

**Our Gap:** We show current account balance but not running balance per transaction

**Effort:** LOW (2-3 hours)

**Implementation:**
```typescript
// In GET /api/accounts/:id/transactions
// Add cumulative balance calculation
const transactions = await prisma.transaction.findMany({
  where: { accountId, tenantId: user.tenantId },
  orderBy: { date: 'desc' }
});

let runningBalance = account.currentBalance;
transactions.forEach(t => {
  t.runningBalance = runningBalance;
  runningBalance -= t.amount; // Subtract to go back in time
});
```

**Example Display:**
```
Date       Description    Amount      Balance
2026-01-31 Groceries      -$50.00    $1,450.00
2026-01-30 Paycheck      +$2,000.00  $1,500.00
2026-01-29 Gas            -$40.00     -$500.00  ← Can see account went negative
```

**Files to Modify:**
- `apps/api/src/routes/accounts.ts` - Add running balance to query
- `apps/web/src/components/accounts/TransactionList.tsx` - Add "Balance" column
- `packages/types/src/transaction.ts` - Add runningBalance field

**Priority:** ⭐⭐⭐ MUST HAVE for Phase 1

**Phase:** Phase 1 (Accounts Overview)

---

### 2. Keyboard Shortcuts ⭐⭐⭐

**What:** Global keyboard shortcuts for common actions

**Why Critical:**
- Power users (accountants, daily users) expect this
- Dramatically improves efficiency for repetitive tasks
- Industry standard in professional software

**User Demand:** 105 votes

**Our Gap:** No keyboard navigation at all

**Effort:** MEDIUM (8-10 hours)

**Implementation:**
```typescript
// Global keyboard shortcuts
'/' → Command palette (search)
'n' → New transaction
'ESC' → Close modal
'Arrow keys' → Navigate tables
'?' → Help overlay
'Cmd/Ctrl + K' → Quick actions
```

**Files to Create:**
- `apps/web/src/hooks/useKeyboardShortcuts.ts` - Global keyboard listener
- `apps/web/src/components/ui/CommandPalette.tsx` - Command palette UI
- `apps/web/src/components/ui/HelpOverlay.tsx` - Keyboard shortcuts help

**Files to Modify:**
- `apps/web/src/app/layout.tsx` - Register global listener

**Priority:** ⭐⭐⭐ MUST HAVE for Phase 3 (power user phase)

**Phase:** Phase 3 (Transactions & Bookkeeping)

---

### 3. Recurring Transactions ⭐⭐⭐

**What:** Auto-create recurring transactions, allow skipping specific months

**Why Critical:**
- Reduces manual work for monthly bills, paychecks
- High user demand (49 votes + 181 votes for "skip month" feature)
- Essential for cash flow forecasting (dependency)

**User Demand:** 230 votes (combined)

**Our Gap:** RecurringTransaction model exists but no UI or automation

**Effort:** MEDIUM (15-20 hours)

**Implementation:**
```typescript
// New service: apps/api/src/services/recurring-transaction.service.ts
export class RecurringTransactionService {
  async generateScheduledTransactions(startDate: Date, endDate: Date) {
    // 1. Get all active recurring transaction rules
    // 2. For each rule, generate transactions for date range
    // 3. Check for "skip this month" exceptions
    // 4. Create transactions (mark as "auto-generated")
    // 5. Return summary (X transactions created)
  }
}
```

**Features:**
- Create/edit/delete recurring transaction rules
- Frequency: daily, weekly, monthly, yearly
- End date or "never"
- "Skip this month" exception handling
- Background job to auto-generate transactions
- Preview before confirming

**Files to Create:**
- `apps/api/src/routes/recurring-transactions.ts` - CRUD API
- `apps/api/src/services/recurring-transaction.service.ts` - Auto-generation logic
- `apps/api/src/jobs/generate-recurring-transactions.ts` - Cron job (nightly)
- `apps/web/src/components/transactions/RecurringTransactionForm.tsx` - UI
- `apps/web/src/components/transactions/RecurringTransactionsList.tsx` - List view

**Priority:** ⭐⭐⭐ MUST HAVE for Phase 3 (automation)

**Phase:** Phase 3 (Transactions & Bookkeeping)

---

### 4. Cash Flow Forecasting ⭐⭐

**What:** Project future balance based on recurring transactions + budgets

**Why Critical:**
- HIGH user demand (208 votes - LunchMoney's "killer differentiator")
- Helps users avoid overdrafts
- Differentiating feature vs competitors
- Strategic positioning as "proactive accounting"

**User Demand:** 208 votes

**Our Gap:** Not in current roadmap (was deferred to Phase 6)

**Effort:** MEDIUM (15-20 hours)

**Implementation:**
```typescript
// New service: apps/api/src/services/forecasting.service.ts
export class ForecastingService {
  async projectCashFlow(entityId: string, days: number) {
    // 1. Get current account balances
    const currentBalance = await this.getCurrentBalance(entityId);

    // 2. Get recurring transactions for next N days
    const recurringTxns = await this.getScheduledTransactions(entityId, days);

    // 3. Get budget allocations
    const budgets = await this.getBudgetProjections(entityId, days);

    // 4. Calculate projected balance per day
    const projections = this.calculateDailyProjections(
      currentBalance,
      recurringTxns,
      budgets
    );

    // 5. Return with confidence score
    return {
      currentBalance,
      projections, // Array of { date, balance, confidence }
      assumptions: [...], // List of assumptions made
    };
  }
}
```

**Features:**
- Project 7/30/90 day cash flow
- Show confidence indicator (high/medium/low)
- Based on: current balance + scheduled recurring transactions + budget
- Highlight projected low balance warnings
- Dashboard widget

**Files to Create:**
- `apps/api/src/services/forecasting.service.ts` - Projection algorithm
- `apps/api/src/routes/forecasting.ts` - API endpoints
- `apps/web/src/components/dashboard/CashFlowForecastCard.tsx` - Dashboard widget

**Dependencies:**
- Requires recurring transactions (Phase 3)
- Can use basic projection without recurring for MVP

**Priority:** ⭐⭐ HIGH VALUE for Phase 2-3 (differentiator)

**Phase:** Phase 2 (Bank Reconciliation) - Basic version without recurring transactions

---

### 5. Data Export ⭐⭐

**What:** Export ALL user data (transactions, invoices, attachments) as JSON/CSV/ZIP

**Why Critical:**
- User trust signal ("Your data is yours")
- Data portability (GDPR compliance)
- Migration flexibility (users can leave anytime)
- Essential before MVP launch

**User Demand:** 60 votes

**Our Gap:** No export functionality at all

**Effort:** MEDIUM (10-12 hours)

**Implementation:**
```typescript
// New service: apps/api/src/services/export.service.ts
export class ExportService {
  async exportAllData(tenantId: string) {
    // 1. Export all models to JSON (complete backup)
    const jsonExport = await this.exportToJSON(tenantId);

    // 2. Export to CSV (per-entity spreadsheets)
    const csvExports = await this.exportToCSV(tenantId);

    // 3. Collect attachments
    const attachments = await this.collectAttachments(tenantId);

    // 4. Generate ZIP file
    const zipFile = await this.createZIP({
      json: jsonExport,
      csv: csvExports,
      attachments
    });

    // 5. Return download URL (S3 presigned URL)
    return { downloadUrl, expiresAt };
  }
}
```

**Export Formats:**
- **JSON:** Complete data backup (all models, full fidelity)
- **CSV:** Per-entity spreadsheets (human-readable)
- **ZIP:** Includes all attachments

**Files to Create:**
- `apps/api/src/services/export.service.ts` - Export generation
- `apps/api/src/routes/export.ts` - API endpoint
- `apps/web/src/app/(dashboard)/settings/data/page.tsx` - Settings page

**UI Messaging:**
- "Your data is yours. Export anytime."
- "Complete backup includes all transactions, invoices, and attachments."
- "No lock-in. Take your data with you."

**Priority:** ⭐⭐ ESSENTIAL before MVP launch (trust signal)

**Phase:** Phase 5 (Analytics) - After financial reports are complete

---

## NICE-TO-HAVE: Defer to Post-MVP

These features are useful but not blocking MVP launch. Implement based on user demand after launch.

### 6. Bulk Edit Transactions

**What:** Select multiple transactions, change category/tags/entity at once

**User Demand:** 91 votes

**Effort:** MEDIUM (10-12 hours)

**Defer Because:** Useful but not essential for MVP. Add if users request it.

---

### 7. Simple Calculations in Amount Fields

**What:** Parse math in amount inputs (e.g., "10+20", "45/2", "100*.15")

**User Demand:** 71 votes

**Effort:** LOW (3-5 hours with mathjs library)

**Defer Because:** Nice productivity boost, but not blocking any workflows.

---

### 8. Sankey Cash Flow Diagram

**What:** Visual income-to-expense flow diagram

**User Demand:** 127 votes

**Effort:** MEDIUM (8-10 hours with D3.js)

**Defer Because:** Beautiful visualization, but core financial reports (P&L, Balance Sheet) are more critical. Can add in Phase 5 enhancement.

---

### 9. 12-Month Budget View

**What:** Spreadsheet-style budget grid (categories × 12 months)

**User Demand:** 143 votes

**Effort:** MEDIUM (12-15 hours)

**Defer Because:** Phase 6 (Budgets) should start simpler (single-month budgets). Enhance later based on user feedback.

---

### 10. Credit Card Utilization %

**What:** Show balance/creditLimit percentage on credit card accounts

**User Demand:** 29 votes

**Effort:** LOW (2-3 hours)

**Defer Because:** Easy addition if users request it. Not critical for MVP.

---

## SKIP ENTIRELY: Our Approach is Superior

These features are redundant or inferior to our existing architecture. Do NOT implement.

### ❌ Split Account Overview into Groups (37 votes)

**LunchMoney:** Tag accounts into "groups" (Business, Personal)

**Why Skip:** Our Entity model is vastly superior
- LunchMoney: Flat grouping (can't model multiple businesses with separate books)
- Akount: Complete entity separation with full accounting isolation

**Verdict:** Don't implement account groups. Entities are the answer.

---

### ❌ Mark Category as "Savings" (107 votes)

**LunchMoney:** Flag categories to exclude from expense totals

**Why Skip:** We have GL accounts for this
- LunchMoney: Categories with special flags (hacky)
- Akount: Create GL account under Assets → Savings with proper accounting

**Verdict:** Don't add category flags. Use GL account structure.

---

### ❌ Budget by Tag/Merchant/Account (25 votes)

**LunchMoney:** Budget "all Amazon spending" or "all Travel expenses"

**Why Skip:** Too specific, our GL account budgeting is more flexible
- LunchMoney: Merchant-level budgeting (fragile, hard to maintain)
- Akount: Budget by GL account (rolls up properly in financial reports)

**Verdict:** Don't implement merchant-level budgeting. GL accounts handle this elegantly.

---

### ❌ Amazon Transaction Details Import (98 votes)

**LunchMoney:** Parse Amazon emails/scrape order details

**Why Skip:** HIGH effort, NICHE use case, questionable ROI
- Requires parsing Amazon emails or scraping (fragile)
- Only useful for heavy Amazon users
- Complex implementation (25-30 hours)
- Better to let users manually split if needed

**Verdict:** Defer indefinitely unless overwhelming user demand.

---

### ❌ Investment Holdings Import (142 votes)

**LunchMoney:** Import individual stock positions from brokers

**Why Skip for MVP:** Complex, can add later based on target market validation
- Requires Flinks integration for individual stock positions
- Need portfolio tracking UI (stock ticker, shares, cost basis)
- Need daily price updates (data feed subscription)
- HIGH effort (20-25 hours)
- Our Account model already supports investment accounts (balance tracking)

**Verdict:** Start with basic investment account balance. Add holdings tracking if users demand it post-MVP.

---

### ❌ Richer Loan/Mortgage Tracking (84 votes)

**LunchMoney:** Amortization schedules, principal/interest split

**Why Skip for MVP:** Complex amortization, defer to post-MVP
- Would need amortization schedule calculation
- Principal/interest split tracking
- Our Account model already tracks loan balances
- Most users just want balance tracking

**Verdict:** Basic loan tracking sufficient for MVP. Enhance later if demanded.

---

### ❌ Regex Support in Rules (90 votes)

**LunchMoney:** Use regex patterns in transaction categorization rules

**Why Skip for MVP:** Power user feature, not essential
- Simple string matching sufficient for MVP
- Can add regex later if users request it
- Adds complexity to UI (regex is intimidating for non-technical users)

**Verdict:** Start simple, enhance if users ask.

---

### ❌ Import Net Worth from Mint (39 votes)

**LunchMoney:** One-time import from Mint shutdown

**Why Skip:** Migration feature, not core product value
- Only useful for Mint refugees (time-limited opportunity)
- One-time import, not ongoing value
- Complex implementation (need Mint export format parser)

**Verdict:** Don't build Mint import. Focus on core product. Users can manually enter opening balances.

---

### ❌ Additional Subcategory Levels (22 votes)

**LunchMoney:** Add 3rd+ level of category nesting

**Why Skip:** We already support infinite nesting
- Prisma schema has `parentCategoryId` (can nest indefinitely)
- Just need UI to support tree view (low effort enhancement later)
- Not a schema limitation, just UI work

**Verdict:** Already supported in schema. UI enhancement only (defer to post-MVP).

---

## Timeline Impact

### Original MVP Timeline (Phases 0-5 + 8):
- **Duration:** 16-24 weeks (4-6 months)
- **Effort:** 265-355 hours

### Enhanced MVP Timeline (With 5 Priority Features):
- **Phase 1:** +2-3 hours (running balance)
- **Phase 2:** +15-20 hours (cash flow forecasting)
- **Phase 3:** +23-30 hours (recurring transactions + keyboard shortcuts)
- **Phase 5:** +10-12 hours (data export)
- **Total Impact:** +50-65 hours (~10-13 days)

### New Timeline:
- **Duration:** 17-25 weeks (4.25-6.25 months)
- **Effort:** 315-420 hours

**ROI:** +18% effort for features addressing 700+ user votes and competitive differentiation

---

## Strategic Positioning

### Why This Plan Wins

**1. Focused Additions**
- Only 5 features added (out of 40 reviewed)
- Each addresses real gap (not duplicating existing architecture)
- Strategic placement across phases (not overloading one phase)

**2. Architecture Validation**
- Confirmed our entity model >> account groups
- Confirmed our GL accounts >> category flags
- Confirmed our multi-currency >> basic display
- **We're building the right foundation**

**3. Competitive Position**
- Running balance: Parity with accounting apps
- Cash flow forecasting: Differentiator (208 votes)
- Keyboard shortcuts: Professional software standard
- Recurring transactions: Automation efficiency
- Data export: Trust signal

**4. Reasonable Timeline**
- +10-13 days total (vs +2-3 months if we added everything)
- Spread across 4 phases (not all upfront)
- Maintains lean MVP approach

**5. Post-MVP Clarity**
- Clear list of deferred features (based on user demand)
- Documented what we're NOT building (and why)
- Can iterate based on actual user feedback

---

## Target Market Validation

### Who Needs Akount's Sophistication

**Perfect Fit:**
- Solopreneurs with multiple businesses (HST number, corp, personal)
- Freelancers with US clients (multi-currency invoicing)
- Rental property owners (separate entity accounting)
- Small accounting firms (multi-client management)

**Who LunchMoney Serves:**
- Casual budgeters
- Single-person household expense tracking
- No accounting background needed

**We're not competing with LunchMoney. We're building the professional tier.**

---

## Implementation Checklist

### Phase 1 (Accounts Overview)
- [ ] Original features: Dashboard, net worth, accounts list, multi-currency
- [ ] **NEW:** Running balance display in transaction list (+2-3 hours)

### Phase 2 (Bank Reconciliation)
- [ ] Original features: CSV import, transaction matching, reconciliation
- [ ] **NEW:** Cash flow forecasting (+15-20 hours)

### Phase 3 (Transactions & Bookkeeping)
- [ ] Original features: Chart of accounts, transaction posting, journal entries
- [ ] **NEW:** Recurring transactions (+15-20 hours)
- [ ] **NEW:** Keyboard shortcuts (+8-10 hours)

### Phase 5 (Analytics)
- [ ] Original features: P&L, Balance Sheet, Cash Flow reports
- [ ] **NEW:** Data export (+10-12 hours)

---

## Verification Plan

### Phase 1 (Running Balance)
1. Create test account with 10 transactions
2. Verify running balance calculates correctly (descending order)
3. Test with negative balance (account overdraft)
4. Test with multiple currencies
5. Verify performance with 1000+ transactions

### Phase 2 (Cash Flow Forecasting)
1. Create recurring transactions (paycheck, rent, bills)
2. Project 30-day cash flow
3. Verify projection accuracy
4. Test with multiple accounts
5. Test with no recurring transactions (show message)

### Phase 3 (Recurring Transactions)
1. Create monthly recurring transaction (rent)
2. Verify auto-generation on schedule
3. Test "skip this month" exception
4. Test end date
5. Test different frequencies (weekly, yearly)

### Phase 3 (Keyboard Shortcuts)
1. Test '/' → Command palette opens
2. Test 'ESC' → Modal closes
3. Test 'n' → New transaction form
4. Test arrow keys → Navigate tables
5. Test '?' → Help overlay

### Phase 5 (Data Export)
1. Create test data across all models
2. Export to JSON (verify structure)
3. Export to CSV (verify readability)
4. Export with attachments (verify ZIP)
5. Test large dataset (10,000+ transactions)

---

## Next Steps

1. ✅ Document this analysis in `docs/architecture/lunchmoney-feature-analysis.md`
2. → Update `ROADMAP.md` with new features
3. → Update Phase 1 plan (`docs/features/01-accounts-overview.md`)
4. → Create Phase 2 enhancement spec (`docs/features/02-bank-reconciliation-enhancements.md`)
5. → Create Phase 3 enhancement spec (`docs/features/03-transactions-enhancements.md`)
6. → Create Phase 5 enhancement spec (`docs/features/05-analytics-enhancements.md`)
7. → Begin Phase 1 implementation

---

## References

- **LunchMoney Feature Requests:** https://lunchmoney.canny.io/
- **Original Analysis:** Plan transcript (2026-01-31)
- **Related Docs:**
  - `docs/features/01-accounts-overview.md`
  - `docs/features/02-bank-reconciliation.md`
  - `docs/product/data-model/README.md`
  - `docs/architecture/decisions.md`

---

**Status:** ✅ Approved
**Implementation:** Ready to proceed with Phase 1 (including running balance enhancement)
**Review Date:** 2026-02-28 (after Phase 1 completion)
