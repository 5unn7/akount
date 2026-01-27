# Transactions & Bookkeeping

Source of truth for all money movements. Users review, categorize, and inspect transactions across accounts and entities, manage a lightweight chart of accounts, and create manual journal entries for adjustments. Interface prioritizes everyday categorization with AI assistance while exposing GL control for accuracy.

## Key Features
- Transaction list with strong filters (entity, account, category, date, amount, search)
- Inline categorization with AI suggestions
- Bulk categorization and rule creation
- Transaction detail drawer with full context
- Chart of accounts (GL) management per entity
- Manual journal entry creation with balanced debits/credits
- Activity log and audit trail
- Attachment support

## Tab Navigation
- **Transactions** (default) - Transaction list and categorization
- **Journal Entries** - Manual accounting entries (advanced)
- **Chart of Accounts** - GL account management (advanced)

## Components
- Transaction list table with inline edit
- Filter bar with comprehensive controls
- Bulk action toolbar
- Transaction detail drawer
- AI category suggestion badges
- Journal entry modal with balancing validation
- Chart of accounts table

**Reference:** `product/sections/transactions-bookkeeping/spec.md`, `types.ts`, `sample-data.json`, `tests.md`
