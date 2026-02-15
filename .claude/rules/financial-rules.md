# Financial Rules

---
paths:

- "apps/api/src/domains/**"
- "packages/db/**"
- "packages/types/**"

---

## Integer Cents (NEVER Floats)

All monetary amounts MUST be stored as **integer cents**:

- ✅ `amount: 1050` → $10.50
- ❌ `amount: 10.50` → WRONG

Never use `Float` or `number` for money in Prisma schema or TypeScript.

## Multi-Currency Pattern

Every monetary field requires 4 fields:

```typescript
{
  amount: Int,              // Original currency in cents
  currency: String,         // ISO code (USD, CAD, EUR)
  exchangeRate: Float,      // Rate at transaction time
  baseCurrencyAmount: Int   // Converted to entity base currency
}
```

**Never recalculate exchange rates** after transaction creation — historical rates are immutable.

## Double-Entry Bookkeeping

Every journal entry MUST balance:

```
SUM(debitAmount) === SUM(creditAmount)
```

Validate before creating `JournalEntry`. No exceptions.

## Soft Delete Only

Financial records are NEVER hard deleted:

- Use `deletedAt: DateTime?` field
- Filter: `WHERE deletedAt IS NULL` in all queries
- Audit views can include deleted records

Models with soft delete: Invoice, Bill, Payment, JournalEntry, JournalLine, Account, Transaction, CreditNote.

## Tenant Isolation (Critical)

**Every query MUST filter by `tenantId`:**

```typescript
// ✅ CORRECT
const data = await prisma.entity.findMany({
  where: { tenantId: ctx.tenantId }
})

// ❌ WRONG - Missing tenantId
const data = await prisma.entity.findMany()
```

Tenant-scoped models: Tenant, Entity, Client, Vendor, Invoice, Bill, Category, ImportBatch.

Entity-scoped models require `entity: { tenantId: ctx.tenantId }`:

```typescript
const invoices = await prisma.invoice.findMany({
  where: { entity: { tenantId: ctx.tenantId } }
})
```

## Source Document Preservation

Journal entries created from documents (invoices, bills) MUST store:

```typescript
{
  sourceType: 'INVOICE',
  sourceId: invoice.id,
  sourceDocument: JSON.stringify(invoice) // Full snapshot
}
```

Enables GL rebuild if accounting logic changes.
