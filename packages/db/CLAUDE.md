# Database Context (packages/db)

> **Loaded automatically** when Claude accesses files in `packages/db/`
> **Last verified:** 2026-02-25

## Prisma Models (43 Total)

| Model | Scope | Key Fields | Soft Delete |
|-------|-------|------------|-------------|
| **System** | | | |
| Tenant | Global | id, name, region, plan | No |
| TenantUser | Global | tenantId, userId, role | No |
| User | Global | id, email, clerkUserId | No |
| Entity | Tenant | id, tenantId, type, baseCurrency | No |
| **Accounting** | | | |
| GLAccount | Entity | id, entityId, code, type, normalBalance | No |
| JournalEntry | Entity | id, entityId, date, status, sourceType | **Yes** |
| JournalLine | Entry | id, journalEntryId, glAccountId, debit, credit | **Yes** |
| TaxRate | Entity | id, entityId, code, rate, jurisdiction | No |
| FiscalCalendar | Entity | id, entityId, year, startDate, endDate | No |
| FiscalPeriod | Calendar | id, fiscalCalendarId, periodNumber, status | No |
| **Business** | | | |
| Client | Entity | id, entityId, name, email, status | **Yes** |
| Invoice | Entity | id, entityId, clientId, invoiceNumber, status, total | **Yes** |
| InvoiceLine | Invoice | id, invoiceId, description, amount, glAccountId | **Yes** |
| Vendor | Entity | id, entityId, name, email, status | **Yes** |
| Bill | Entity | id, entityId, vendorId, billNumber, status, total | **Yes** |
| BillLine | Bill | id, billId, description, amount, glAccountId | **Yes** |
| Payment | Entity | id, entityId, clientId/vendorId, amount | **Yes** |
| PaymentAllocation | Payment | id, paymentId, invoiceId/billId, amount, appliedAt | No |
| CreditNote | Entity | id, entityId, creditNoteNumber, amount | **Yes** |
| **Banking** | | | |
| Account | Entity | id, entityId, name, type, currency, currentBalance | **Yes** |
| BankConnection | Entity | id, entityId, provider, institutionName, status | No |
| BankFeedTransaction | Connection | id, bankConnectionId, accountId, date, amount, status | **Yes** |
| Transaction | Account | id, accountId, date, description, amount, categoryId | **Yes** |
| TransactionSplit | Transaction | id, transactionId, amount, categoryId | No |
| TransactionMatch | Feed/Txn | id, bankFeedTransactionId, transactionId, status | No |
| **Categories & Planning** | | | |
| Category | Tenant | id, tenantId, name, type, parentCategoryId | **Yes** |
| Budget | Entity | id, entityId, categoryId, amount, period | No |
| Goal | Entity | id, entityId, name, type, targetAmount, status | No |
| **AI & Automation** | | | |
| Insight | Entity | id, entityId, title, type, priority, status | No |
| Rule | Entity | id, entityId, name, conditions, action, source | No |
| RuleSuggestion | Entity | id, entityId, suggestedRule, aiConfidence, status | No |
| **Onboarding** | | | |
| OnboardingProgress | Tenant | id, tenantId, userId, completedSteps, dismissed | No |
| OnboardingWizardState | Tenant | id, tenantId, userId, currentStep, formData, completed | No |
| **Misc** | | | |
| Project | Entity | id, entityId, name, code, status | No |
| Snapshot | Entity | id, entityId, date, categoryId/glAccountId, balance | No |
| FXRate | Global | id, base, quote, date, rate | No |
| AuditLog | Tenant | id, tenantId, entityId, userId, model, action | No |
| DomainEvent | Tenant | id, tenantId, entityId, type, payload | No |
| ImportBatch | Tenant | id, tenantId, entityId, sourceType, status | No |
| AccountingPolicy | Tenant/Entity | id, tenantId, entityId, key, value | No |
| ConsolidationElimination | Period | id, fiscalPeriodId, fromEntityId, toEntityId, amount | No |
| **Fixed Assets** | | | |
| FixedAsset | Entity | id, entityId, name, acquisitionDate, costBasis, usefulLifeMonths | No |
| DepreciationEntry | Asset | id, fixedAssetId, periodDate, amount, accumulatedAmount | No |

## Schema Conventions

**Every model has:**

- `id` (cuid)
- `createdAt` (DateTime, default now)
- `updatedAt` (DateTime, auto)

**Financial models have:**

- `deletedAt` (DateTime?, soft delete)
- Integer amounts (cents, NOT floats)

**Scoping:**

- Tenant-scoped: `tenantId` field
- Entity-scoped: `entityId` field (entity must belong to tenant)

## Key Enums (26 Total)

| Enum | Values |
|------|--------|
| TenantUserRole | OWNER, ADMIN, ACCOUNTANT, VIEWER |
| GLAccountType | ASSET, LIABILITY, EQUITY, INCOME, EXPENSE |
| NormalBalance | DEBIT, CREDIT |
| JournalEntryStatus | DRAFT, POSTED, ARCHIVED |
| JournalEntrySourceType | INVOICE, PAYMENT, BANK_FEED, MANUAL, TRANSFER, ADJUSTMENT |
| InvoiceStatus | DRAFT, SENT, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID |
| BillStatus | DRAFT, PENDING, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID |
| AccountType | BANK, CREDIT_CARD, LOAN, MORTGAGE, INVESTMENT, OTHER |
| BankFeedStatus | PENDING, POSTED, CANCELLED |
| TransactionMatchStatus | MATCHED, SUGGESTED, UNMATCHED |
| BankConnectionStatus | ACTIVE, ERROR, DISCONNECTED, REAUTH_REQUIRED |
| BankConnectionProvider | FLINKS, PLAID, MANUAL |
| TransactionSourceType | BANK_FEED, MANUAL, INVOICE, BILL, TRANSFER |
| CategoryType | INCOME, EXPENSE, TRANSFER |
| FiscalPeriodStatus | OPEN, LOCKED, CLOSED |
| PaymentMethod | CARD, TRANSFER, CASH, CHECK, WIRE, OTHER |
| EntityType | PERSONAL, CORPORATION, LLC, PARTNERSHIP, SOLE_PROPRIETORSHIP |

(+9 more enums: OnboardingStatus, TenantRegion, TenantStatus, TenantPlan, ImportBatchSourceType, ImportBatchStatus, RuleSource, RuleSuggestionStatus, AuditAction)

## Status Lifecycles

**Invoice:** DRAFT → SENT → (PARTIALLY_PAID) → PAID / OVERDUE / CANCELLED
**Bill:** DRAFT → PENDING → (PARTIALLY_PAID) → PAID / OVERDUE / CANCELLED
**BankFeedTransaction:** PENDING → POSTED / CANCELLED
**JournalEntry:** DRAFT → POSTED → ARCHIVED
**FiscalPeriod:** OPEN → LOCKED → CLOSED

## Migration Workflow

1. **Edit** `schema.prisma`
2. **Generate migration:** `npx prisma migrate dev --name <description>`
3. **Review** migration file in `prisma/migrations/`
4. **Apply:** `npx prisma migrate deploy` (already happens in step 2 for dev)
5. **Generate client:** `npx prisma generate` (happens automatically)

**Update this CLAUDE.md** in the same commit when schema changes.

## Indexing Strategy

**Every tenant-scoped model:** `@@index([tenantId])`
**Every entity-scoped model:** `@@index([entityId])`, `@@index([entityId, deletedAt])`
**Every soft-delete model:** `@@index([entityId, deletedAt])` or `@@index([tenantId, deletedAt])`

## Location

- Schema: `packages/db/prisma/schema.prisma`
- Migrations: `packages/db/prisma/migrations/`
- Client: `packages/db/src/` (generated)
- Seed: `packages/db/prisma/seed.ts`
