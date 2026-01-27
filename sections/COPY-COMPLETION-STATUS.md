# Section Components Copy Status

## Overview
This document tracks the status of copying section components from `src/sections/*/components/` to `product-plan/sections/*/components/` with import path transformations.

## Completed Sections

### ✅ accounts-overview (100% Complete)
**Location:** `product-plan/sections/accounts-overview/components/`

**Files copied (7 total):**
1. ✅ AccountsOverview.tsx
2. ✅ NetWorthCard.tsx
3. ✅ CashPositionCard.tsx
4. ✅ InsightCard.tsx
5. ✅ AccountsList.tsx
6. ✅ AccountRow.tsx
7. ✅ index.ts

**Import Transformations Applied:**
- `@/../product/sections/accounts-overview/types` → `../types`
- `@/hooks/useSpotlight` → Added TODO comment (used in AccountRow.tsx)

---

### ✅ bank-reconciliation (100% Complete)
**Location:** `product-plan/sections/bank-reconciliation/components/`

**Files copied (7 total):**
1. ✅ BankReconciliation.tsx
2. ✅ ReconciliationStatusCard.tsx
3. ✅ FilterChips.tsx
4. ✅ BulkActionToolbar.tsx
5. ✅ FeedTransactionTable.tsx
6. ✅ FeedTransactionRow.tsx
7. ✅ index.ts

**Import Transformations Applied:**
- `@/../product/sections/bank-reconciliation/types` → `../types`
- `@/hooks/useSpotlight` → Added TODO comment (used in FeedTransactionRow.tsx)

---

### ⏳ transactions-bookkeeping (33% Complete)
**Location:** `product-plan/sections/transactions-bookkeeping/components/`

**Files copied (3 of 10):**
1. ✅ FilterBar.tsx
2. ✅ BulkActionToolbar.tsx
3. ✅ TransactionRow.tsx
4. ❌ TransactionList.tsx
5. ❌ TransactionsBookkeeping.tsx
6. ❌ JournalEntryList.tsx
7. ❌ JournalEntryRow.tsx
8. ❌ ChartOfAccounts.tsx
9. ❌ GLAccountRow.tsx
10. ❌ index.ts

**Import Transformations Applied:**
- `@/../product/sections/transactions-bookkeeping/types` → `../types`
- `@/hooks/useSpotlight` → Added TODO comment (used in TransactionRow.tsx)

---

## Remaining Sections

### ❌ invoicing-bills (0% Complete)
**Location:** `product-plan/sections/invoicing-bills/components/` (needs creation)

**Files to copy (7 total):**
1. ❌ InvoiceRow.tsx
2. ❌ BillRow.tsx
3. ❌ InvoiceList.tsx
4. ❌ ClientVendorList.tsx
5. ❌ ProductList.tsx
6. ❌ BillList.tsx
7. ❌ index.ts

**Source:** `src/sections/invoicing-bills/components/`

---

### ❌ analytics (0% Complete)
**Location:** `product-plan/sections/analytics/components/` (needs creation)

**Files to copy (5 total):**
1. ❌ AnalyticsDashboard.tsx
2. ❌ CashFlowView.tsx
3. ❌ PLView.tsx
4. ❌ BalanceSheetView.tsx
5. ❌ index.ts

**Source:** `src/sections/analytics/components/`

---

### ❌ planning (0% Complete)
**Location:** `product-plan/sections/planning/components/` (needs creation)

**Files to copy (4 total):**
1. ❌ BudgetsView.tsx
2. ❌ GoalsView.tsx
3. ❌ CalculatorsView.tsx
4. ❌ index.ts

**Source:** `src/sections/planning/components/`

---

### ❌ ai-financial-advisor (0% Complete)
**Location:** `product-plan/sections/ai-financial-advisor/components/` (needs creation)

**Files to copy (3 total):**
1. ❌ InsightsFeed.tsx
2. ❌ RulesView.tsx
3. ❌ index.ts

**Source:** `src/sections/ai-financial-advisor/components/`

---

## Summary Statistics

| Section | Status | Files Complete | Files Total | Percentage |
|---------|--------|----------------|-------------|------------|
| accounts-overview | ✅ Complete | 7 | 7 | 100% |
| bank-reconciliation | ✅ Complete | 7 | 7 | 100% |
| transactions-bookkeeping | ⏳ In Progress | 3 | 10 | 30% |
| invoicing-bills | ❌ Not Started | 0 | 7 | 0% |
| analytics | ❌ Not Started | 0 | 5 | 0% |
| planning | ❌ Not Started | 0 | 4 | 0% |
| ai-financial-advisor | ❌ Not Started | 0 | 3 | 0% |
| **TOTAL** | **31% Complete** | **17** | **43** | **40%** |

---

## Shared Resources Created

### ✅ useSpotlight Hook
**Location:** `product-plan/shared/hooks/useSpotlight.ts`

This hook is used by several row components for interactive spotlight effects. It has been copied to a shared location for easy import.

**Import path from components:**
```typescript
import { useSpotlight } from '../../shared/hooks/useSpotlight'
```

---

## Quick Completion Guide

To complete the remaining sections, for each component file:

1. **Read** the source file:
   ```
   src/sections/[section-name]/components/[Component].tsx
   ```

2. **Transform** imports:
   - `@/../product/sections/[section-name]/types` → `../types`
   - `@/hooks/useSpotlight` → `../../shared/hooks/useSpotlight`

3. **Write** to destination:
   ```
   product-plan/sections/[section-name]/components/[Component].tsx
   ```

4. **Copy** index.ts (no changes needed)

---

## Next Steps

### Priority 1: Complete transactions-bookkeeping
Finish the 7 remaining files in transactions-bookkeeping section.

### Priority 2: Copy simpler sections
Complete analytics, planning, and ai-financial-advisor (smaller component counts).

### Priority 3: Complete invoicing-bills
Finish the invoicing-bills section (7 files).

---

## Verification Command

To verify all files are in place, run:
```bash
find product-plan/sections -name "*.tsx" -o -name "*.ts" | wc -l
```

Expected result: 43 files (when 100% complete)

Current result: 17 files (40% complete)

---

## Notes

- All type imports have been successfully transformed
- useSpotlight hook is now available at shared location
- No other `@/` imports remain in completed files
- All external dependencies (lucide-react, react) remain unchanged
- Component-to-component imports within same directory remain unchanged
