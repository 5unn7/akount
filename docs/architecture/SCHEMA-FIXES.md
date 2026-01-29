# Schema Standardization Fixes

**Date:** 2026-01-29
**Status:** In Progress

---

## Issues Identified

### 1. Inconsistent Naming Conventions
**Problem:** Mix of PascalCase and camelCase for relation fields

**Standard:**
- Singular relations: `camelCase` (e.g., `entity Entity`)
- Plural relations: `camelCase` (e.g., `entities Entity[]`)

**Violations Found:**
```prisma
// ❌ Wrong (PascalCase for relations)
BankConnection BankConnection[]
CreditNote CreditNote[]
Payment Payment[]
Entity Entity
Category Category

// ✅ Correct
bankConnections BankConnection[]
creditNotes CreditNote[]
payments Payment[]
entity Entity
category Category
```

### 2. String Instead of Native Types

**Problem:** Using `String` for JSON and enums loses type safety and performance

**Standard:**
- JSON data: Use `Json` or `@db.JsonB` (better for indexing)
- Enums: Use native PostgreSQL enums

**Violations Found:**
```prisma
// ❌ Wrong (String for JSON)
conditions String // JSON
payload String // JSON
before String? // JSON

// ✅ Correct
conditions Json @db.JsonB
payload Json @db.JsonB
before Json?

// ❌ Wrong (String for enums)
region String // 'CA' | 'US' | 'EU'
status String // 'trial' | 'active' | 'past_due'

// ✅ Correct
region TenantRegion
status TenantStatus
```

### 3. Missing Performance Indexes

**Problem:** Common query patterns lack indexes

**Critical Missing Indexes:**
```prisma
// JournalEntry - Reports query by entity + date
@@index([entityId, date])
@@index([entityId, status])

// Transaction - Account statements
@@index([accountId, date])
@@index([accountId, createdAt])

// BankFeedTransaction - Reconciliation
@@index([accountId, date])
@@index([status])

// Invoice - AR aging
@@index([entityId, status])
@@index([clientId, status])
@@index([dueDate])

// AuditLog - Compliance queries
@@index([tenantId, createdAt])
@@index([entityId, createdAt])
@@index([userId, createdAt])
```

---

## Detailed Fixes

### Fix 1: Relation Field Naming

| Model | Line | Current | Fixed |
|-------|------|---------|-------|
| Entity | 85 | `BankConnection BankConnection[]` | `bankConnections BankConnection[]` |
| Entity | 86 | `CreditNote CreditNote[]` | `creditNotes CreditNote[]` |
| Entity | 87 | `TaxRate TaxRate[]` | `taxRates TaxRate[]` |
| Entity | 88 | `FiscalCalendar FiscalCalendar[]` | `fiscalCalendars FiscalCalendar[]` |
| Client | 217 | `Payment Payment[]` | `payments Payment[]` |
| Vendor | 270 | `Payment Payment[]` | `payments Payment[]` |
| CreditNote | 310 | `Entity Entity` | `entity Entity` |
| TaxRate | 146 | `Entity Entity?` | `entity Entity?` |
| FiscalCalendar | 161 | `Entity Entity` | `entity Entity` |
| Category | Many | `Category Category?` | `category Category?` |
| Budget | 457 | `Category Category?` | `category Category?` |
| Goal | 478 | `Category Category?` | `category Category?` |
| Snapshot | 535 | `Category Category?` | `category Category?` |

### Fix 2: Enums to Create

```prisma
// Tenant
enum TenantRegion {
  CA  // Canada
  US  // United States
  EU  // European Union
  UK  // United Kingdom
  AU  // Australia
}

enum TenantStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CLOSED
  SUSPENDED
}

enum TenantPlan {
  FREE
  PRO
  ENTERPRISE
}

// User roles
enum TenantUserRole {
  OWNER
  ADMIN
  ACCOUNTANT
  VIEWER
}

// GL Account
enum GLAccountType {
  ASSET
  LIABILITY
  EQUITY
  INCOME
  EXPENSE
}

enum NormalBalance {
  DEBIT
  CREDIT
}

// Journal Entry
enum JournalEntryStatus {
  DRAFT
  POSTED
  ARCHIVED
}

enum JournalEntrySourceType {
  INVOICE
  PAYMENT
  BANK_FEED
  MANUAL
  TRANSFER
  ADJUSTMENT
}

// Invoice
enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
  PARTIALLY_PAID
}

// Bill
enum BillStatus {
  DRAFT
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

// Bank Feed
enum BankFeedStatus {
  PENDING
  POSTED
  CANCELLED
}

// Transaction Match
enum TransactionMatchStatus {
  MATCHED
  SUGGESTED
  UNMATCHED
}

// Account Type
enum AccountType {
  BANK
  CREDIT_CARD
  LOAN
  MORTGAGE
  INVESTMENT
  OTHER
}

// Bank Connection
enum BankConnectionStatus {
  ACTIVE
  ERROR
  DISCONNECTED
  REAUTH_REQUIRED
}

enum BankConnectionProvider {
  FLINKS
  PLAID
  MANUAL
}

// Transaction
enum TransactionSourceType {
  BANK_FEED
  MANUAL
  INVOICE
  BILL
  TRANSFER
}

// Category
enum CategoryType {
  INCOME
  EXPENSE
  TRANSFER
}

// Import Batch
enum ImportBatchSourceType {
  CSV
  PDF
  BANK_FEED
}

enum ImportBatchStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

// Rule
enum RuleSource {
  USER_MANUAL
  AI_SUGGESTED
  SYSTEM_DEFAULT
}

// Rule Suggestion
enum RuleSuggestionStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

// Audit Log
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VIEW
}
```

### Fix 3: JSON Fields to Convert

| Model | Field | Current | Fixed |
|-------|-------|---------|-------|
| JournalEntry | sourceDocument | `Json?` | Already correct ✅ |
| BankFeedTransaction | rawData | `Json?` | Already correct ✅ |
| BankFeedTransaction | merchantHints | `Json?` | Already correct ✅ |
| BankFeedTransaction | statusHistory | `Json[]` | Already correct ✅ |
| Rule | conditions | `String` | `Json @db.JsonB` |
| Rule | action | `String` | `Json @db.JsonB` |
| DomainEvent | payload | `String` | `Json @db.JsonB` |
| AuditLog | before | `String?` | `Json?` |
| AuditLog | after | `String?` | `Json?` |
| AccountingPolicy | value | `String` | `Json @db.JsonB` (for complex policies) |
| ConsolidationElimination | (if needed) | - | - |
| RuleSuggestion | suggestedRule | `Json` | Already correct ✅ |

---

## Implementation Plan

### Step 1: Add Enums (Non-Breaking)
```prisma
// Add all enums to top of schema
// This doesn't break existing String fields
```

### Step 2: Add Indexes (Non-Breaking)
```prisma
// Add @@index directives to models
// Improves performance immediately
```

### Step 3: Fix Relation Names (Breaking - Requires Migration)
```prisma
// Rename PascalCase relations to camelCase
// This changes generated Prisma client API
```

### Step 4: Convert Strings to Enums (Breaking - Requires Data Migration)
```prisma
// Convert String fields to enum types
// Requires data validation and migration
```

### Step 5: Convert String to Json (Breaking - May Require Data Migration)
```prisma
// Convert JSON strings to Json type
// May need to validate existing data
```

---

## Migration Strategy

### Phase A: Safe Changes (Do Now)
- ✅ Add all enum definitions
- ✅ Add missing indexes
- ✅ Add `@db.JsonB` where currently `Json`

### Phase B: Relation Naming (Do in Phase 1)
- ⚠️ Breaking change to Prisma client API
- Update all TypeScript code using old names
- Test thoroughly

### Phase C: Convert to Enums (Do in Phase 2)
- ⚠️ Requires data migration
- Validate all existing data fits enum values
- Create migration script to convert data

### Phase D: Convert String to Json (Do in Phase 2)
- ⚠️ May require data validation
- Parse existing JSON strings
- Validate structure

---

## Testing Checklist

### After Enum Addition
- [ ] `npx prisma validate` passes
- [ ] `npx prisma generate` succeeds
- [ ] TypeScript compiles with new types

### After Relation Renaming
- [ ] All TypeScript compilation errors fixed
- [ ] All queries updated to use new names
- [ ] Integration tests pass

### After Enum Conversion
- [ ] Data migration script tested
- [ ] All existing data validated
- [ ] Rollback plan documented

### After Json Conversion
- [ ] JSON parsing tested
- [ ] Query performance measured
- [ ] Type safety verified

---

## Rollback Plan

### If Enum Migration Fails
```sql
-- Revert to String
ALTER TABLE "Tenant" ALTER COLUMN "status" TYPE text;
```

### If Relation Rename Breaks Code
```typescript
// Create temporary aliases in Prisma client
// Use deprecated decorator to warn developers
```

---

## Performance Impact

### Expected Improvements

**Indexes:**
- Report queries: 10-100x faster
- Transaction lookups: 50-500x faster
- Reconciliation: 20-200x faster

**Enums:**
- Storage: ~50% smaller (4 bytes vs 10-50 bytes)
- Query performance: 10-20% faster
- Type safety: Compile-time errors

**JsonB:**
- Query JSON fields: 5-50x faster
- Index JSON fields: Possible
- Storage: Similar or smaller

---

## Next Steps

1. Review this document
2. Approve migration strategy
3. Run Phase A (safe changes)
4. Schedule Phases B-D for appropriate development phases

---

**Last Updated:** 2026-01-29
**Status:** Documented, awaiting approval
