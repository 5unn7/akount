# Milestone 3: Bank Reconciliation

**Prerequisites:** Foundation and Accounts Overview complete

---

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
