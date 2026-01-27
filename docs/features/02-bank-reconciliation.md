# Bank Reconciliation

Transforms raw bank feed transactions into clean, matched transactions through automated suggestions and manual matching workflows. Users efficiently clear feeds using bulk actions, manage reconciliation status per account/period, and formally lock periods to maintain data integrity.

## Key Features
- Feed transaction import from bank connections
- Match status tracking (Matched/Suggested/Unmatched)
- Manual and suggested matching workflows
- Transfer detection between owned accounts
- Bulk confirmation and transaction creation
- Period locking with formal reconciliation
- Account/period selectors and filters

## User Flows
- Regular reconciliation with period locking
- Fixing errors in open periods
- Handling new syncs in locked periods
- Bulk reconciliation workflow
- Transfer detection and confirmation

## Components
- Feed transaction table with match status badges
- Reconciliation status card with period locks
- Filter chips (Suggested/Unmatched/All)
- Bulk action toolbar
- Transaction detail drawer
- Transfer detection visualization
- Period lock confirmation modal

**Reference:** `product/sections/bank-reconciliation/spec.md`, `types.ts`, `sample-data.json`, `tests.md`
