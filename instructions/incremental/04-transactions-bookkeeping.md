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
