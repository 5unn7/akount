# Akount Context Map

> **Deep reference** — Read this file when you need comprehensive context
> **Last updated:** 2026-02-09
> **Replaces:** architecture.mmd, repo-map.md, domain-glossary.md

---

## Full Model Glossary

| Model | Definition | Scope | Key Fields | Invariants |
|-------|------------|-------|------------|------------|
| **Tenant** | Subscription account (one paying customer) | Global | id, name, region, plan | Billing per-tenant; users can have multiple tenants |
| **Entity** | Business unit within tenant (company, sole prop) | Tenant | id, tenantId, type, baseCurrency | Own chart of accounts, fiscal year, base currency |
| **GLAccount** | Chart of Accounts category | Entity | id, entityId, code, type, normalBalance | Unique code per entity; parent-child hierarchy |
| **JournalEntry** | General ledger posting (debits = credits) | Entity | id, entityId, date, status, sourceType, sourceId | SUM(debits) === SUM(credits); immutable once POSTED |
| **JournalLine** | Single debit/credit in journal entry | Entry | id, journalEntryId, glAccountId, debitAmount, creditAmount | Either debit OR credit > 0, never both |
| **Invoice** | AR request for payment to client | Entity | id, entityId, clientId, total, status, dueDate | Integer cents; soft delete; SENT creates JE (DR: A/R, CR: Revenue) |
| **Bill** | AP request for payment from vendor | Entity | id, entityId, vendorId, total, status, dueDate | Integer cents; soft delete; APPROVED creates JE (DR: Expense, CR: A/P) |
| **Payment** | Money exchange for invoice/bill | Entity | id, entityId, amount, clientId/vendorId | Can allocate to multiple invoices/bills; may be partial |
| **BankFeedTransaction** | Raw transaction from bank sync | Connection | id, bankConnectionId, accountId, date, amount, status | Preserve rawData; match to Transaction; becomes JE when POSTED |
| **Transaction** | Posted bank transaction | Account | id, accountId, date, amount, categoryId, journalEntryId | Links to BankFeedTransaction via TransactionMatch; creates JE |
| **Category** | Classification for transactions | Tenant | id, tenantId, name, type, parentCategoryId | Maps to GL accounts; used by AI categorization |
| **FXRate** | Foreign exchange rate | Global | id, base, quote, date, rate | Historical rates; never recalculate after txn creation |

**Models 13-38:** Client, Vendor, InvoiceLine, BillLine, Account, BankConnection, TransactionSplit, TransactionMatch, CreditNote, TaxRate, FiscalCalendar, FiscalPeriod, Budget, Goal, Insight, Rule, Project, Snapshot, AuditLog, DomainEvent, ImportBatch, AccountingPolicy, ConsolidationElimination, RuleSuggestion, User, TenantUser

---

## Enum Reference

| Enum | Values | Usage |
|------|--------|-------|
| **TenantUserRole** | OWNER, ADMIN, ACCOUNTANT, VIEWER | RBAC permissions (6 roles total in design docs, 4 in schema) |
| **GLAccountType** | ASSET, LIABILITY, EQUITY, INCOME, EXPENSE | Chart of accounts classification |
| **NormalBalance** | DEBIT, CREDIT | Account's natural balance direction |
| **JournalEntryStatus** | DRAFT, POSTED, ARCHIVED | Journal entry lifecycle |
| **JournalEntrySourceType** | INVOICE, PAYMENT, BANK_FEED, MANUAL, TRANSFER, ADJUSTMENT | Origin of journal entry |
| **InvoiceStatus** | DRAFT, SENT, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID | Invoice lifecycle |
| **BillStatus** | DRAFT, PENDING, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID | Bill lifecycle |
| **AccountType** | BANK, CREDIT_CARD, LOAN, MORTGAGE, INVESTMENT, OTHER | Account classification |
| **BankFeedStatus** | PENDING, POSTED, CANCELLED | Bank transaction sync status |
| **TransactionMatchStatus** | MATCHED, SUGGESTED, UNMATCHED | Bank feed to transaction matching |
| **BankConnectionStatus** | ACTIVE, ERROR, DISCONNECTED, REAUTH_REQUIRED | Bank sync connection health |
| **BankConnectionProvider** | FLINKS, PLAID, MANUAL | Bank sync provider |
| **TransactionSourceType** | BANK_FEED, MANUAL, INVOICE, BILL, TRANSFER | Origin of transaction |
| **CategoryType** | INCOME, EXPENSE, TRANSFER | Category classification |
| **FiscalPeriodStatus** | OPEN, LOCKED, CLOSED | Period close status |
| **PaymentMethod** | CARD, TRANSFER, CASH, CHECK, WIRE, OTHER | Payment type |
| **EntityType** | PERSONAL, CORPORATION, LLC, PARTNERSHIP, SOLE_PROPRIETORSHIP | Business structure |

**Other enums:** OnboardingStatus, TenantRegion, TenantStatus, TenantPlan, ImportBatchSourceType, ImportBatchStatus, RuleSource, RuleSuggestionStatus, AuditAction

---

## Permission Matrix (RBAC)

| Role | Create Txns | Edit Txns | Delete Txns | View Reports | Manage Users | Billing |
|------|-------------|-----------|-------------|--------------|--------------|---------|
| **OWNER** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **ADMIN** | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **ACCOUNTANT** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **BOOKKEEPER** | ✓ | ✓ | ✗ | Limited | ✗ | ✗ |
| **INVESTOR** | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **ADVISOR** | ✗ | ✗ | ✗ | Limited | ✗ | ✗ |

**Note:** Schema currently has 4 roles (OWNER, ADMIN, ACCOUNTANT, VIEWER). Design system defines 6 roles. Migration pending.

---

## Multi-Currency Rules

Every monetary transaction stores **4 fields**:

```typescript
{
  amount: 10000,               // Integer cents in original currency ($100.00 USD)
  currency: 'USD',             // ISO currency code
  exchangeRate: 1.35,          // Rate captured at transaction time
  baseCurrencyAmount: 13500    // Converted to entity base currency ($135.00 CAD)
}
```

**Rules:**
1. Amount and baseCurrencyAmount are **integer cents**
2. Exchange rate captured once, **never recalculated**
3. Reporting uses baseCurrencyAmount for consolidation
4. Historical rates preserved for audit compliance

---

## Journal Entry Patterns

| Action | Journal Entry |
|--------|---------------|
| **Invoice SENT** | DR: Accounts Receivable (ASSET), CR: Revenue (INCOME) |
| **Invoice PAID** | DR: Cash/Bank (ASSET), CR: Accounts Receivable (ASSET) |
| **Invoice VOID** | Reversal entry (opposite of SENT entry) |
| **Bill APPROVED** | DR: Expense (EXPENSE) or Asset, CR: Accounts Payable (LIABILITY) |
| **Bill PAID** | DR: Accounts Payable (LIABILITY), CR: Cash/Bank (ASSET) |
| **Bank Feed POSTED** | DR: Expense category (EXPENSE), CR: Cash/Bank (ASSET) for outflow |
| **Transfer** | DR: To Account (ASSET), CR: From Account (ASSET) |
| **Manual Adjustment** | User-defined debits and credits (must balance) |

**Validation:** Every entry must satisfy `SUM(debitAmount) === SUM(creditAmount)` before creation.

---

## How-To Patterns

### Add an API Endpoint

1. **Schema** (`apps/api/src/domains/<domain>/schemas/<resource>.schema.ts`):
   ```typescript
   export const CreateResourceSchema = z.object({
     name: z.string().min(1),
     amount: z.number().int()
   })
   ```

2. **Service** (`apps/api/src/domains/<domain>/services/<resource>.service.ts`):
   ```typescript
   export async function createResource(data, ctx: TenantContext) {
     return prisma.resource.create({
       data: { ...data, tenantId: ctx.tenantId }
     })
   }
   ```

3. **Route** (`apps/api/src/domains/<domain>/routes/<resource>.ts`):
   ```typescript
   fastify.post('/', {
     schema: { body: CreateResourceSchema },
     handler: async (req, reply) => {
       const result = await createResource(req.body, req.tenant)
       return reply.status(201).send(result)
     }
   })
   ```

4. **Register** (`apps/api/src/domains/<domain>/routes/index.ts`)

### Add a Page

1. **Server Component** (`apps/web/src/app/(dashboard)/<domain>/<resource>/page.tsx`):
   ```typescript
   export default async function ResourcePage() {
     const data = await getResources()
     return <ResourceListClient data={data} />
   }
   ```

2. **Client Component** (`resource-list-client.tsx`):
   ```typescript
   'use client'
   export function ResourceListClient({ data }) {
     // Interactive logic here
   }
   ```

3. **Loading** (`loading.tsx`) + **Error** (`error.tsx`) + **Metadata** (export in page.tsx)

### Add a Database Migration

1. **Edit** `packages/db/prisma/schema.prisma`
2. **Generate:** `npx prisma migrate dev --name descriptive_name`
3. **Review:** Check migration file in `prisma/migrations/`
4. **Update:** `packages/db/CLAUDE.md` in same commit

---

## Service Dependency Graph

| Service | Depends On | Used By |
|---------|------------|---------|
| **Auth** | Clerk SDK | All API routes |
| **Tenant** | Prisma (TenantUser) | All API routes (after Auth) |
| **Account Service** | Prisma (Account) | Dashboard, Account routes |
| **Invoice Service** | Prisma (Invoice, InvoiceLine), Journal Service | Invoice routes, Payment routes |
| **Journal Service** | Prisma (JournalEntry, JournalLine, GLAccount) | Invoice, Bill, Transaction services |
| **Payment Service** | Prisma (Payment), Invoice/Bill services | Payment routes |
| **Transaction Service** | Prisma (Transaction, BankFeedTransaction, Category) | Transaction routes, Reconciliation |
| **FX Rate Service** | Prisma (FXRate), External API | Dashboard, Multi-currency calculations |
| **Dashboard Service** | Account, Invoice, Bill, FXRate services | Dashboard routes |

---

## Design System Quick Reference

### Color Palette (Semantic Tokens)

- **Primary:** Brand color (blue)
- **Secondary:** Supporting color (slate)
- **Accent:** Highlight color (purple)
- **Destructive:** Error/delete (red)
- **Success:** Positive actions (green)
- **Warning:** Caution (yellow)
- **Muted:** Subtle backgrounds (gray)

### Typography

- **Heading:** Newsreader (serif)
- **Body:** Manrope (sans-serif)
- **Mono:** JetBrains Mono (code)

### Spacing Scale

- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 1rem (16px)
- **lg:** 1.5rem (24px)
- **xl:** 2rem (32px)
- **2xl:** 3rem (48px)

### Component Radius

- **Button:** 8px (standard)
- **Card:** 12px
- **Input:** 6px
- **Modal:** 16px

### Glass UI Variants

- ButtonGlass: default, secondary, destructive, outline, ghost
- InputGlass: default, error, success
- GlassCard: default, bordered, elevated
- BadgeGlass: default, secondary, outline, destructive, success, warning

---

_For additional context, see: `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`, `packages/db/CLAUDE.md`, `.claude/rules/`_
