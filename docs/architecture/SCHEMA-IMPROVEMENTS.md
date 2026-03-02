# Schema Improvements Backlog

**Last Updated:** 2026-02-02
**Status:** Pending Implementation
**Priority:** Phase 1-2

---

## Overview

Technical debt improvements for the Prisma schema to ensure:

- Type safety (enums instead of strings)
- Performance (strategic indexes)
- Multi-jurisdiction support (global solopreneur use case)
- Industry-standard accounting patterns

---

## 1. Enums to Add (30 total)

### Tenant & Region

```prisma
enum TenantRegion {
  CA  // Canada
  US  // United States
  IN  // India
  UK  // United Kingdom
  AU  // Australia
  EU  // European Union (generic)
  OTHER
}

enum TenantStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
  CLOSED
}

enum TenantPlan {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

enum TenantUserRole {
  OWNER
  ADMIN
  ACCOUNTANT
  BOOKKEEPER
  VIEWER
}
```

### Entity & Jurisdiction

```prisma
enum EntityType {
  CORPORATION
  LLC
  PARTNERSHIP
  SOLE_PROPRIETORSHIP
  TRUST
  HOLDCO
  PERSONAL
}

enum EntityJurisdiction {
  CA_FEDERAL    // Canada Federal
  CA_ON         // Canada Ontario
  CA_BC         // Canada BC
  CA_AB         // Canada Alberta
  US_FEDERAL    // US Federal
  US_DE         // US Delaware
  US_WY         // US Wyoming
  US_CA         // US California
  IN_CENTRAL    // India Central
  IN_MH         // India Maharashtra
  UK            // United Kingdom
  AU            // Australia
  OTHER
}

enum EntityStatus {
  ACTIVE
  INACTIVE
  DISSOLVED
  PENDING_REGISTRATION
}
```

### Accounting Core

```prisma
enum GLAccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum NormalBalance {
  DEBIT
  CREDIT
}

enum JournalEntryStatus {
  DRAFT
  POSTED
  ARCHIVED
  REVERSED
}

enum JournalEntrySourceType {
  INVOICE
  BILL
  PAYMENT
  BANK_FEED
  MANUAL
  TRANSFER
  ADJUSTMENT
  YEAR_END
  FX_REVALUATION
}

enum FiscalPeriodStatus {
  OPEN
  SOFT_CLOSED
  LOCKED
  CLOSED
}
```

### AR/AP

```prisma
enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
  WRITTEN_OFF
}

enum BillStatus {
  DRAFT
  RECEIVED
  APPROVED
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

enum PaymentMethod {
  BANK_TRANSFER
  ACH           // US
  WIRE
  EFT           // Canada
  UPI           // India
  INTERAC       // Canada
  CREDIT_CARD
  DEBIT_CARD
  CHEQUE
  CASH
  PAYPAL
  STRIPE
  OTHER
}
```

### Banking

```prisma
enum AccountType {
  CHECKING
  SAVINGS
  CREDIT_CARD
  LINE_OF_CREDIT
  LOAN
  MORTGAGE
  INVESTMENT
  CRYPTO
  OTHER
}

enum BankConnectionProvider {
  FLINKS        // Canada
  PLAID         // US
  YODLEE        // Multi
  TRUELAYER     // UK/EU
  MANUAL
}

enum BankConnectionStatus {
  ACTIVE
  ERROR
  DISCONNECTED
  REAUTH_REQUIRED
  PENDING
}

enum BankFeedStatus {
  PENDING
  CATEGORIZED
  MATCHED
  POSTED
  IGNORED
  DUPLICATE
}

enum TransactionMatchStatus {
  MATCHED
  SUGGESTED
  UNMATCHED
  SPLIT
}

enum TransactionSourceType {
  BANK_FEED
  MANUAL
  INVOICE
  BILL
  TRANSFER
  IMPORT
}
```

### Multi-Currency

```prisma
enum SupportedCurrency {
  CAD  // Canadian Dollar
  USD  // US Dollar
  INR  // Indian Rupee
  GBP  // British Pound
  EUR  // Euro
  AUD  // Australian Dollar
  CHF  // Swiss Franc
  JPY  // Japanese Yen
  CNY  // Chinese Yuan
  OTHER
}

enum FxRateSource {
  BANK_OF_CANADA
  FEDERAL_RESERVE
  ECB
  RBI           // Reserve Bank of India
  MANUAL
  OPEN_EXCHANGE
}

enum FxRateType {
  SPOT
  DAILY_AVERAGE
  MONTHLY_AVERAGE
  PERIOD_END
}
```

### AI & Rules

```prisma
enum RuleSource {
  USER_CREATED
  AI_SUGGESTED
  AI_APPROVED
  SYSTEM_DEFAULT
}

enum RuleSuggestionStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum InsightType {
  TAX_DEDUCTION
  TAX_DEADLINE
  SUBSIDY_ELIGIBLE
  SPENDING_ALERT
  CASH_FLOW_WARNING
  FX_OPPORTUNITY
  COMPLIANCE_REMINDER
}

enum InsightPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Import & Audit

```prisma
enum ImportBatchSource {
  CSV
  PDF
  OFX
  QIF
  BANK_FEED
}

enum ImportBatchStatus {
  PENDING
  PROCESSING
  COMPLETED
  PARTIAL
  FAILED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VIEW
  EXPORT
  LOGIN
  LOGOUT
}
```

---

## 2. Relation Naming Fixes (13 fields)

Standardize PascalCase relations to camelCase:

| Model | Current | Should Be |
|-------|---------|-----------|
| Entity | `BankConnection BankConnection[]` | `bankConnections BankConnection[]` |
| Entity | `CreditNote CreditNote[]` | `creditNotes CreditNote[]` |
| Entity | `TaxRate TaxRate[]` | `taxRates TaxRate[]` |
| Entity | `FiscalCalendar FiscalCalendar[]` | `fiscalCalendars FiscalCalendar[]` |
| Client | `Payment Payment[]` | `payments Payment[]` |
| Vendor | `Payment Payment[]` | `payments Payment[]` |
| CreditNote | `Entity Entity` | `entity Entity` |
| TaxRate | `Entity Entity?` | `entity Entity?` |
| FiscalCalendar | `Entity Entity` | `entity Entity` |
| Category | `Category Category?` | `parentCategory Category?` |
| Budget | `Category Category?` | `category Category?` |
| Goal | `Category Category?` | `category Category?` |
| Snapshot | `Category Category?` | `category Category?` |

---

## 3. JSON Field Conversions (7 fields)

Convert `String` to `Json @db.JsonB`:

| Model | Field | Current | Should Be |
|-------|-------|---------|-----------|
| Rule | conditions | `String` | `Json @db.JsonB` |
| Rule | action | `String` | `Json @db.JsonB` |
| AuditLog | before | `String?` | `Json?` |
| AuditLog | after | `String?` | `Json?` |
| DomainEvent | payload | `String` | `Json @db.JsonB` |
| AccountingPolicy | value | `String` | `Json @db.JsonB` |
| TransactionSplit | tags | `String?` | `Json? @db.JsonB` |

---

## 4. Performance Indexes (45+)

### Entity-Based Queries

```prisma
// All tenant-scoped models need these
@@index([tenantId])
@@index([entityId])
```

### Temporal Queries (Reports)

```prisma
// JournalEntry
@@index([entityId, date])
@@index([entityId, status])

// Transaction
@@index([accountId, date])
@@index([accountId, createdAt])

// BankFeedTransaction
@@index([accountId, date])
@@index([status])
```

### AR/AP Aging

```prisma
// Invoice
@@index([entityId, status])
@@index([clientId, status])
@@index([dueDate])
@@index([currency])

// Bill
@@index([entityId, status])
@@index([vendorId, status])
@@index([dueDate])
```

### Compliance & Audit

```prisma
// AuditLog
@@index([tenantId, createdAt])
@@index([entityId, createdAt])
@@index([userId, createdAt])
@@index([model, recordId])
```

### Multi-Currency

```prisma
// FxRate
@@index([fromCurrency, toCurrency, date])
@@index([source, date])

// Transaction (cross-currency reports)
@@index([currency, date])
```

---

## 5. Multi-Jurisdiction Additions

### Tax Configuration Table

```prisma
model TaxJurisdiction {
  id              String   @id @default(cuid())
  tenantId        String
  code            String   // CA-ON, US-CA, IN-MH
  name            String   // "Ontario, Canada"
  country         String   // CA, US, IN
  region          String?  // ON, CA, MH

  // Tax rates
  salesTaxRate    Int?     // Cents (1300 = 13.00%)
  vatRate         Int?
  gstRate         Int?
  pstRate         Int?
  hstRate         Int?

  // Tax IDs required
  requiresTaxId   Boolean  @default(true)
  taxIdFormat     String?  // Regex for validation
  taxIdLabel      String?  // "GST Number", "EIN", "PAN"

  // Fiscal year
  defaultFiscalYearEnd String? // "12-31", "03-31"

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  entities        Entity[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([country])
}
```

### Entity Tax IDs

```prisma
model EntityTaxId {
  id          String   @id @default(cuid())
  entityId    String
  jurisdiction String  // CA, US, IN
  type        String   // GST, HST, EIN, PAN, TAN
  number      String
  validFrom   DateTime?
  validTo     DateTime?
  isPrimary   Boolean  @default(false)

  entity      Entity   @relation(fields: [entityId], references: [id])

  @@unique([entityId, type])
  @@index([entityId])
}
```

---

## 6. Missing for Product Vision

Based on "AI financial command center for global solopreneurs":

### ✅ Already in Schema

- Multi-entity support
- Multi-currency with FX
- Double-entry bookkeeping
- Audit trails
- Bank connections

### ⚠️ Needs Enhancement

- [ ] **TenantRegion** - Add IN (India) - **CRITICAL**
- [ ] **EntityJurisdiction** - Track where entities are registered
- [ ] **PaymentMethod** - Add UPI, INTERAC, ACH region-specific methods
- [ ] **BankConnectionProvider** - Add TrueLayer (UK/EU)
- [ ] **TaxJurisdiction** - Country-specific tax configuration
- [ ] **EntityTaxId** - Multiple tax IDs per entity (GST, PAN, EIN)

### ❌ Not in Schema (Consider Adding)

- [ ] **ComplianceDeadline** - Track filing deadlines by jurisdiction
- [ ] **TaxFormTemplate** - Required forms per jurisdiction
- [ ] **AccountantConnection** - Link to external accountants
- [ ] **JurisdictionRule** - Tax rules that vary by location

---

## Implementation Plan

### Phase A: Safe Changes (Non-Breaking)

1. Add all enum definitions to schema
2. Add all performance indexes
3. Run `npx prisma validate`
4. Run `npx prisma migrate dev --name add-enums-indexes`

### Phase B: Relation Naming (Breaking)

1. Rename all PascalCase relations to camelCase
2. Update all TypeScript code
3. Run migration
4. Test thoroughly

### Phase C: Type Conversions (Breaking)

1. Convert String fields to Enum types
2. Convert String fields to Json types
3. Validate existing data
4. Run data migration

### Phase D: Multi-Jurisdiction (New Features)

1. Add TaxJurisdiction model
2. Add EntityTaxId model
3. Update Entity model with jurisdiction
4. Add India support everywhere

---

## Performance Impact

| Change | Query Improvement | Storage Impact |
|--------|-------------------|----------------|
| Enums | 10-20% faster | 50% smaller |
| Indexes | 10-100x faster | +5-10% storage |
| JsonB | 5-50x faster queries | Similar |

---

## Testing Checklist

- [ ] `npx prisma validate` passes
- [ ] `npx prisma generate` succeeds
- [ ] TypeScript compiles
- [ ] All queries updated
- [ ] Multi-jurisdiction tests pass
- [ ] FX conversion tests pass

---

## References

- Schema file: `packages/db/prisma/schema.prisma`
- Data model docs: `docs/product/data-model/README.md`
- Standards: `docs/standards/financial-data.md`
- Product vision: `docs/product/overview.md`

---

**Owner:** Technical Lead
**Review Required:** Before Phase B (breaking changes)
