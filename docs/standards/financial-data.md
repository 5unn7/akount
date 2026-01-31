# Financial Data Standard

**Criticality:** ZERO TOLERANCE - Violations destroy accounting integrity
**Last Updated:** 2026-01-30

---

## Core Principles

1. **Integer Cents** - Money is ALWAYS stored as `Int` (cents), NEVER `Float`
2. **Double-Entry** - Debits MUST equal credits in every journal entry
3. **Audit Trail** - NEVER delete, ALWAYS soft delete, ALWAYS preserve history
4. **Source Preservation** - Store original documents (JSON) for rebuild capability

---

## Required Patterns

### 1. Money Precision - Integer Cents Only

**✅ CORRECT:**
```typescript
// Prisma schema
model Invoice {
  amount Int  // Stored as cents: 1050 = $10.50
}

// Creating invoice
const invoice = await prisma.invoice.create({
  data: {
    amount: 1050,  // $10.50 as integer cents
    clientId: clientId,
    tenantId: tenantId
  }
})

// Display with formatting
function formatMoney(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(dollars)
}

console.log(formatMoney(1050))  // "$10.50"
```

**❌ WRONG:**
```typescript
// NEVER USE FLOAT FOR MONEY
model Invoice {
  amount Float  // WRONG - precision errors destroy integrity
}

const invoice = await prisma.invoice.create({
  data: {
    amount: 10.50  // WRONG - will have rounding errors
  }
})

// Why wrong:
0.1 + 0.2 === 0.3  // false in JavaScript!
// Financial calculations with floats = disaster
```

**Why Integer Cents?**
- No rounding errors (0.1 + 0.2 = 0.30000000000000004 in float)
- Exact arithmetic (1050 cents + 525 cents = 1575 cents, always)
- Database SUM/AVG operations remain precise
- Accounting integrity maintained

---

### 2. Double-Entry Bookkeeping

**Every journal entry MUST balance:**
```typescript
SUM(debitAmount) === SUM(creditAmount)
```

**✅ CORRECT:**
```typescript
// Create balanced journal entry
const journalEntry = await prisma.journalEntry.create({
  data: {
    tenantId: tenantId,
    date: new Date(),
    description: 'Invoice #123 - Services rendered',
    sourceType: 'Invoice',
    sourceId: invoiceId,
    sourceDocument: invoiceSnapshot,  // Preserve original
    lines: {
      create: [
        {
          // Debit: Accounts Receivable
          glAccountId: arAccountId,
          debitAmount: 1050,  // $10.50
          creditAmount: 0,
          description: 'Client ABC Inc - Invoice #123'
        },
        {
          // Credit: Revenue
          glAccountId: revenueAccountId,
          debitAmount: 0,
          creditAmount: 1050,  // $10.50
          description: 'Consulting services'
        }
      ]
    }
  }
})

// Validation: debits (1050) === credits (1050) ✓
```

**❌ WRONG:**
```typescript
// ACCOUNTING ERROR: Unbalanced entry
const journalEntry = await prisma.journalEntry.create({
  data: {
    lines: {
      create: [
        { glAccountId: arAccountId, debitAmount: 1050, creditAmount: 0 },
        { glAccountId: revenueAccountId, debitAmount: 0, creditAmount: 1000 }
        // ERROR: 1050 ≠ 1000 - Books don't balance!
      ]
    }
  }
})
```

**Validation Function:**
```typescript
function validateJournalEntry(lines: JournalLine[]): boolean {
  const totalDebits = lines.reduce((sum, line) => sum + line.debitAmount, 0)
  const totalCredits = lines.reduce((sum, line) => sum + line.creditAmount, 0)

  if (totalDebits !== totalCredits) {
    throw new Error(
      `Journal entry not balanced: debits ${totalDebits} ≠ credits ${totalCredits}`
    )
  }

  return true
}

// Use before creating entry
validateJournalEntry(lines)
```

**Future: Database Constraint (Phase 3)**
```sql
-- PostgreSQL trigger to enforce balanced entries
CREATE OR REPLACE FUNCTION check_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debits INT;
  total_credits INT;
BEGIN
  SELECT SUM(debit_amount), SUM(credit_amount)
  INTO total_debits, total_credits
  FROM journal_lines
  WHERE journal_entry_id = NEW.id;

  IF total_debits != total_credits THEN
    RAISE EXCEPTION 'Journal entry not balanced: debits % != credits %',
      total_debits, total_credits;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. Audit Trail - Never Delete

**✅ CORRECT: Soft Delete**
```typescript
// Prisma schema
model Invoice {
  id String @id @default(cuid())
  amount Int
  deletedAt DateTime?  // Soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String
  updatedBy String
}

// Soft delete implementation
async function deleteInvoice(invoiceId: string, userId: string) {
  return await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      deletedAt: new Date(),
      updatedBy: userId
    }
  })
}

// Query excludes soft-deleted records
const activeInvoices = await prisma.invoice.findMany({
  where: {
    tenantId: tenantId,
    deletedAt: null  // Exclude deleted
  }
})

// Include deleted when needed (admin view, audit)
const allInvoices = await prisma.invoice.findMany({
  where: { tenantId: tenantId }
  // No deletedAt filter - shows all
})
```

**❌ WRONG: Hard Delete**
```typescript
// NEVER DO THIS - DESTROYS AUDIT TRAIL
await prisma.invoice.delete({
  where: { id: invoiceId }
})
// Data is gone forever. Audit trail destroyed. Compliance violated.
```

**Why Soft Delete?**
- Audit compliance (who deleted what, when)
- Data recovery if mistake
- Historical reporting (deleted records still appear in past reports)
- Legal requirements (financial records retention)

---

### 4. Source Document Preservation

**Always store original source:**
```typescript
model JournalEntry {
  id String @id @default(cuid())
  sourceType String?      // 'Invoice', 'Bill', 'BankTransaction', 'Manual'
  sourceId String?        // ID of source document
  sourceDocument Json?    // Full snapshot of source at posting time
}

// Creating journal entry from invoice
const invoiceSnapshot = {
  id: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  date: invoice.date,
  client: { id: client.id, name: client.name },
  lines: invoice.lines,
  amount: invoice.amount,
  capturedAt: new Date().toISOString()
}

const journalEntry = await prisma.journalEntry.create({
  data: {
    sourceType: 'Invoice',
    sourceId: invoice.id,
    sourceDocument: invoiceSnapshot,  // Store complete original
    lines: { create: journalLines }
  }
})
```

**Why Preserve Source?**
- Rebuild GL if accounting logic has bugs
- Audit trail ("what was the original invoice?")
- Debugging ("why was this entry posted this way?")
- Compliance (source document requirement)

**Example: Rebuild GL from Sources**
```typescript
async function rebuildGeneralLedger(tenantId: string) {
  // 1. Mark all entries as "needs rebuild"
  await prisma.journalEntry.updateMany({
    where: { tenantId },
    data: { needsRebuild: true }
  })

  // 2. Reprocess all source documents
  const entries = await prisma.journalEntry.findMany({
    where: { tenantId, sourceType: { not: null } }
  })

  for (const entry of entries) {
    const sourceDoc = entry.sourceDocument as any

    // Re-apply accounting rules to source
    const newLines = applyAccountingRules(entry.sourceType, sourceDoc)

    // Update journal lines with corrected logic
    await prisma.$transaction([
      prisma.journalLine.deleteMany({ where: { journalEntryId: entry.id } }),
      prisma.journalLine.createMany({ data: newLines })
    ])
  }

  // sourceDocument makes rebuild possible!
}
```

---

### 5. Currency Handling

**Akount supports multi-currency:**
```typescript
model Invoice {
  amount Int           // Amount in invoice currency (cents)
  currency String      // ISO code: CAD, USD, EUR
  exchangeRate Float?  // FX rate at time of transaction
  baseCurrencyAmount Int?  // Converted to entity's base currency
}

// Example: USD invoice for CAD entity
const invoice = await prisma.invoice.create({
  data: {
    amount: 10000,           // $100.00 USD (cents)
    currency: 'USD',
    exchangeRate: 1.35,      // 1 USD = 1.35 CAD
    baseCurrencyAmount: 13500  // $135.00 CAD (cents)
  }
})

// Reporting always uses baseCurrencyAmount for consolidation
```

**Currency Rules:**
1. Store amounts in both original currency AND base currency
2. Capture exchange rate at transaction time (immutable)
3. Never recalculate historical FX (use captured rate)
4. Reporting consolidates using baseCurrencyAmount

---

## Common Pitfalls

### ❌ Pitfall 1: Float Arithmetic

```typescript
// WRONG: Using floats
let balance = 10.50
balance += 0.10
balance += 0.20
console.log(balance)  // 10.799999999999999 (WRONG!)

// CORRECT: Using integer cents
let balance = 1050  // $10.50
balance += 10       // +$0.10
balance += 20       // +$0.20
console.log(balance)  // 1080 (exactly $10.80)
```

### ❌ Pitfall 2: Unbalanced Journal Entries

```typescript
// WRONG: Creating unbalanced entry
await prisma.journalEntry.create({
  data: {
    lines: {
      create: [
        { debitAmount: 1000, creditAmount: 0 },
        // Missing credit side - entry doesn't balance!
      ]
    }
  }
})

// CORRECT: Always balance
await prisma.journalEntry.create({
  data: {
    lines: {
      create: [
        { debitAmount: 1000, creditAmount: 0 },    // Debit $10.00
        { debitAmount: 0, creditAmount: 1000 }     // Credit $10.00
      ]
    }
  }
})
```

### ❌ Pitfall 3: Modifying Posted Entries

```typescript
// WRONG: Editing posted journal entry
await prisma.journalLine.update({
  where: { id: lineId },
  data: { debitAmount: newAmount }  // Destroys audit trail!
})

// CORRECT: Reversing entry + new entry
await prisma.$transaction([
  // 1. Create reversing entry (negatives)
  prisma.journalEntry.create({
    data: {
      description: 'REVERSAL: Original entry',
      lines: {
        create: originalLines.map(line => ({
          ...line,
          debitAmount: line.creditAmount,   // Swap
          creditAmount: line.debitAmount    // Swap
        }))
      }
    }
  }),

  // 2. Create corrected entry
  prisma.journalEntry.create({
    data: {
      description: 'CORRECTED: Entry with fix',
      lines: { create: correctedLines }
    }
  })
])
```

### ❌ Pitfall 4: Missing Source Document

```typescript
// WRONG: Creating entry without source
await prisma.journalEntry.create({
  data: {
    lines: { create: lines }
    // Missing: sourceType, sourceId, sourceDocument
  }
})

// CORRECT: Always capture source
await prisma.journalEntry.create({
  data: {
    sourceType: 'BankTransaction',
    sourceId: bankTxn.id,
    sourceDocument: {
      id: bankTxn.id,
      date: bankTxn.date,
      description: bankTxn.description,
      amount: bankTxn.amount,
      rawData: bankTxn.rawData
    },
    lines: { create: lines }
  }
})
```

---

## Validation Checklist

When reviewing financial code:

- [ ] Money stored as `Int` (cents), never `Float`
- [ ] All journal entries balance (debits = credits)
- [ ] Soft delete used (deletedAt), never hard delete
- [ ] Source document captured (sourceType, sourceId, sourceDocument)
- [ ] Audit fields populated (createdBy, updatedBy, createdAt, updatedAt)
- [ ] Currency handled correctly (original + base currency amounts)
- [ ] Exchange rates captured at transaction time
- [ ] No modification of posted entries (use reversal + correction)
- [ ] Validation before committing transactions

---

## Testing Financial Logic

### Unit Test Pattern

```typescript
describe('Financial Integrity', () => {
  it('enforces double-entry bookkeeping', async () => {
    const entry = await prisma.journalEntry.create({
      data: {
        lines: {
          create: [
            { glAccountId: '...', debitAmount: 1000, creditAmount: 0 },
            { glAccountId: '...', debitAmount: 0, creditAmount: 1000 }
          ]
        }
      },
      include: { lines: true }
    })

    const debits = entry.lines.reduce((sum, l) => sum + l.debitAmount, 0)
    const credits = entry.lines.reduce((sum, l) => sum + l.creditAmount, 0)

    expect(debits).toBe(credits)
  })

  it('prevents hard delete of invoices', async () => {
    const invoice = await prisma.invoice.create({ data: { amount: 1000 } })

    // Soft delete
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { deletedAt: new Date() }
    })

    // Should still exist in database
    const deleted = await prisma.invoice.findUnique({
      where: { id: invoice.id }
    })

    expect(deleted).toBeTruthy()
    expect(deleted.deletedAt).toBeTruthy()
  })

  it('handles money precision correctly', () => {
    const amount1 = 1050  // $10.50
    const amount2 = 25    // $0.25
    const total = amount1 + amount2

    expect(total).toBe(1075)  // Exactly $10.75, no rounding
  })
})
```

---

## Related Standards

- `docs/standards/multi-tenancy.md` - Tenant isolation for financial data
- `docs/standards/security.md` - Protecting sensitive financial information
- `docs/product/data-model/README.md` - Financial model relationships
- `docs/architecture/ARCHITECTURE-HOOKS.md` - Event sourcing patterns

---

**Remember: Financial data integrity = business integrity. Zero tolerance for violations.**
