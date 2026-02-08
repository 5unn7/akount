# Akount Domain Glossary

> **Last Updated:** 2026-02-07
> **Purpose:** Canonical definitions with invariants for AI and developer context

---

## Core Concepts

### Tenant

**Definition:** A subscription account representing one paying customer (individual or organization) that may manage multiple business entities.

**Invariants:**
- Every data record MUST have a `tenantId` field
- Users can belong to multiple tenants with different roles
- Tenant isolation is enforced at the query layer - NEVER trust client-side filtering
- Billing is per-tenant, not per-entity or per-user

**Related:** Entity, User, TenantMembership

---

### Entity

**Definition:** A discrete business unit within a tenant (e.g., a company, sole proprietorship, or separate accounting set). Each entity has its own chart of accounts, fiscal year, and base currency.

**Invariants:**
- An entity belongs to exactly one tenant
- Each entity has a base currency (CAD, USD, EUR, etc.)
- Each entity has its own Chart of Accounts (GL structure)
- Multi-entity transactions require inter-company journal entries
- Fiscal year settings (start month, period structure) are per-entity

**Related:** Tenant, GLAccount, BankAccount

---

### User

**Definition:** An authenticated individual who accesses Akount through Clerk authentication. A user may have memberships in multiple tenants with different roles.

**Invariants:**
- User identity managed by Clerk (external)
- One user may have roles in multiple tenants
- Role determines permissions (OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER, INVESTOR, ADVISOR)
- Users do NOT have direct permissions - roles do

**Related:** TenantMembership, Tenant

---

### TenantMembership

**Definition:** The association between a User and a Tenant, including the user's role within that tenant.

**Invariants:**
- A user can have only ONE role per tenant
- Role changes create audit records
- Removing membership does not delete the user's historical actions

**Related:** User, Tenant, Role

---

## Financial Concepts

### Account (GLAccount)

**Definition:** A category in the Chart of Accounts used to classify and track financial activity. Follows standard accounting structure (Assets, Liabilities, Equity, Revenue, Expenses).

**Invariants:**
- Account codes are unique within an entity
- Account types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- Sub-types provide finer classification (CURRENT_ASSET, FIXED_ASSET, etc.)
- Normal balance: Assets/Expenses are DEBIT; Liabilities/Equity/Revenue are CREDIT
- Accounts can be parent-child (sub-accounts)

**Related:** Entity, JournalLine, AccountType

---

### Journal Entry

**Definition:** A record of a financial event in the general ledger, consisting of two or more journal lines that must balance (debits = credits).

**Invariants:**
- `SUM(debitAmount) === SUM(creditAmount)` - ALWAYS
- Every entry has a date, description, and source reference
- Entries are IMMUTABLE once posted - corrections require reversal entries
- `sourceType`, `sourceId`, `sourceDocument` must be populated for automated entries
- All amounts in integer cents

**Related:** JournalLine, GLAccount, Invoice, Bill, BankTransaction

---

### Journal Line

**Definition:** A single debit or credit within a journal entry, posting to a specific GL account.

**Invariants:**
- Either `debitAmount > 0` OR `creditAmount > 0`, never both
- Links to exactly one GLAccount
- Inherits date and posting status from parent JournalEntry
- Amounts in integer cents

**Related:** JournalEntry, GLAccount

---

### Transaction (BankTransaction)

**Definition:** A record of money moving through a bank account, imported from bank feeds or CSV files.

**Invariants:**
- Raw bank data preserved in `rawData` JSON field
- Amount always in integer cents
- Status progresses: IMPORTED → CATEGORIZED → MATCHED/UNMATCHED → RECONCILED → POSTED
- Once POSTED, creates a JournalEntry
- Negative amounts = outflow; positive = inflow

**Related:** BankAccount, JournalEntry, Category

---

### Invoice

**Definition:** A request for payment sent to a client for goods or services provided.

**Invariants:**
- Amount in integer cents
- Status lifecycle: DRAFT → SENT → VIEWED → PAID/PARTIAL_PAID/OVERDUE → VOID/WRITTEN_OFF
- SENT creates journal entry (DR: A/R, CR: Revenue)
- PAID updates journal entry (DR: Cash, CR: A/R)
- Currency + exchange rate captured at creation
- `dueDate` determines overdue status

**Related:** Client, JournalEntry, InvoiceLine, Payment

---

### Bill

**Definition:** A request for payment received from a vendor for goods or services purchased.

**Invariants:**
- Amount in integer cents
- Status lifecycle: DRAFT → APPROVED → SCHEDULED → PAID/PARTIAL_PAID
- APPROVED creates journal entry (DR: Expense/Asset, CR: A/P)
- PAID updates journal entry (DR: A/P, CR: Cash)
- `dueDate` used for cash flow planning

**Related:** Vendor, JournalEntry, BillLine, Payment

---

### Payment

**Definition:** A record of money exchanged to settle an invoice or bill.

**Invariants:**
- Amount in integer cents
- Links to one or more invoices/bills being paid
- May be partial (creates PARTIAL_PAID status)
- Creates/updates journal entries
- Payment method tracked (check, ACH, wire, card)

**Related:** Invoice, Bill, JournalEntry, BankTransaction

---

### Category

**Definition:** A classification for transactions used by AI categorization and rule-based assignment.

**Invariants:**
- Maps to one or more GL accounts
- Has confidence threshold for auto-categorization
- Rules can override AI suggestions
- Categories are tenant-specific (customizable)

**Related:** BankTransaction, GLAccount, CategoryRule

---

## Business Concepts

### Client

**Definition:** A customer who receives invoices and makes payments to the business.

**Invariants:**
- Belongs to one tenant
- May have multiple contacts
- Tracks payment terms (Net 30, Net 15, etc.)
- Currency preference stored
- Outstanding balance calculated from unpaid invoices

**Related:** Invoice, Payment, Contact

---

### Vendor

**Definition:** A supplier who sends bills and receives payments from the business.

**Invariants:**
- Belongs to one tenant
- May have multiple contacts
- Tracks payment terms
- Tax ID (1099 reporting) may be required
- Outstanding balance calculated from unpaid bills

**Related:** Bill, Payment, Contact

---

### Product/Service

**Definition:** An item or service that can be invoiced to clients or purchased from vendors.

**Invariants:**
- Has default price (in cents)
- Links to income/expense GL accounts
- May have inventory tracking (future)
- Tax category for sales tax calculation

**Related:** InvoiceLine, BillLine, GLAccount

---

### BankAccount

**Definition:** A financial account at a bank institution, connected for transaction syncing.

**Invariants:**
- Belongs to one entity
- Has base currency
- May be connected via Plaid or manual
- Balance tracking (current, available)
- Maps to a GL account (Cash/Bank type)

**Related:** Entity, BankTransaction, GLAccount, Plaid

---

## Time Concepts

### Fiscal Year

**Definition:** A 12-month accounting period used for financial reporting.

**Invariants:**
- Configured per entity
- Has start month (January, April, etc.)
- May be divided into periods (monthly, quarterly)
- Year-end triggers closing entries
- Historical years are "closed" - no modifications

**Related:** Entity, FiscalPeriod, JournalEntry

---

### Fiscal Period

**Definition:** A subdivision of a fiscal year (typically monthly) for reporting and closing.

**Invariants:**
- Belongs to exactly one fiscal year
- Status: OPEN, CLOSED
- CLOSED periods cannot accept new journal entries
- Closing creates adjustment entries

**Related:** FiscalYear, JournalEntry

---

## Status Enums

### InvoiceStatus

| Value | Description | GL Impact |
|-------|-------------|-----------|
| `DRAFT` | Not yet sent | None |
| `SENT` | Delivered to client | DR: A/R, CR: Revenue |
| `VIEWED` | Client opened | None |
| `OVERDUE` | Past due date | None |
| `PARTIAL_PAID` | Partial payment received | DR: Cash, CR: A/R (partial) |
| `PAID` | Fully paid | DR: Cash, CR: A/R (full) |
| `VOID` | Cancelled | Reversal entry |
| `WRITTEN_OFF` | Bad debt | DR: Bad Debt, CR: A/R |

---

### TransactionStatus

| Value | Description | Next States |
|-------|-------------|-------------|
| `IMPORTED` | Raw from bank | CATEGORIZED, NEEDS_REVIEW |
| `NEEDS_REVIEW` | AI uncertain | CATEGORIZED, EXCLUDED |
| `CATEGORIZED` | Category assigned | MATCHED, UNMATCHED |
| `MATCHED` | Linked to doc | RECONCILED |
| `UNMATCHED` | No match found | RECONCILED |
| `RECONCILED` | Verified | POSTED |
| `POSTED` | Journal created | (final) |
| `EXCLUDED` | Ignored | (final) |

---

### AccountType

| Value | Normal Balance | Examples |
|-------|---------------|----------|
| `ASSET` | Debit | Cash, A/R, Inventory, Equipment |
| `LIABILITY` | Credit | A/P, Loans, Accrued Expenses |
| `EQUITY` | Credit | Owner's Equity, Retained Earnings |
| `REVENUE` | Credit | Sales, Service Income, Interest |
| `EXPENSE` | Debit | Rent, Salaries, Supplies, Utilities |

---

### Role

| Value | Description | Key Permissions |
|-------|-------------|-----------------|
| `OWNER` | Business owner | Full access + billing |
| `ADMIN` | Office manager | All features, no billing |
| `ACCOUNTANT` | CPA/financial pro | Full financial access |
| `BOOKKEEPER` | Data entry | Create transactions only |
| `INVESTOR` | Stakeholder | Read-only reports |
| `ADVISOR` | External consultant | Limited read access |

---

## Currency Concepts

### Multi-Currency Handling

**Invariants:**
- Every monetary amount stores: `amount`, `currency`, `exchangeRate`, `baseCurrencyAmount`
- `amount` = original currency (e.g., 10000 USD cents = $100)
- `baseCurrencyAmount` = converted to entity base currency
- `exchangeRate` captured at transaction time - NEVER recalculated
- Reporting consolidates using `baseCurrencyAmount`

**Example:**
```typescript
{
  amount: 10000,           // $100.00 USD
  currency: 'USD',
  exchangeRate: 1.35,      // At transaction time
  baseCurrencyAmount: 13500 // $135.00 CAD (entity base)
}
```

---

## Audit Concepts

### Soft Delete

**Definition:** Marking a record as deleted without physically removing it from the database.

**Invariants:**
- `deletedAt` field stores deletion timestamp
- `deletedAt: null` means active record
- All queries should filter `WHERE deletedAt IS NULL` by default
- Audit views can include deleted records
- NEVER use `DELETE` statement on financial records

---

### Source Document

**Definition:** A JSON snapshot of the original document that triggered a journal entry.

**Invariants:**
- Stored in `sourceDocument` field as JSON
- Captured at posting time - immutable
- Enables GL rebuild if accounting logic changes
- Must include all fields needed to recreate entry

---

## Cross-References

| Concept | See Also |
|---------|----------|
| Money handling | `docs/standards/financial-data.md` |
| Tenant isolation | `docs/standards/multi-tenancy.md` |
| API patterns | `docs/standards/api-design.md` |
| Security | `docs/standards/security.md` |
| Architecture | `docs/architecture.mmd` |
| Code locations | `docs/repo-map.md` |
| RBAC details | `docs/design-system/05-governance/permissions-matrix.md` |
| Domain structure | `docs/design-system/05-governance/information-architecture.md` |
