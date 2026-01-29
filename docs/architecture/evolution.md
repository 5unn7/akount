# Architecture Evolution Plan

**Purpose:** Define how Akount's architecture evolves from MVP to Production
**Last Updated:** 2026-01-29
**Status:** Pre-Development (Phase 0)

---

## Philosophy

> "Architecture for scale, implement for lean."

We architect with extension points for advanced features, but implement them only when needed. This document maps what exists now vs what activates later.

---

## Phase 0-1: MVP Foundation (Current)

### What's Implemented
```
✅ Tenant/Entity isolation (soft - middleware)
✅ Integer money math (all amounts in cents)
✅ Double-entry ready (JournalEntry + JournalLine)
✅ Source tracking (sourceType/sourceId on JournalEntry)
✅ Audit logging (AuditLog model)
✅ Event infrastructure (DomainEvent model)
✅ Rule engine ready (Rule model with JSON conditions)
✅ Multi-currency fields (functionalCurrency, reportingCurrency)
✅ Period locking (FiscalCalendar with open/locked periods)
```

### Architectural Hooks (Not Yet Used)
```
🔧 DomainEvent.processedAt - Event sourcing replay marker
🔧 JournalEntry.sourceType/sourceId - Event traceability
🔧 AccountingPolicy - Consolidation rules storage
🔧 GLAccount.parentAccountId - Chart of accounts hierarchy
🔧 Rule.source - Tracks if "AI_SUGGESTED" or "USER_MANUAL"
```

---

## Evolution Path

### Phase 1: Accounts Overview

**Activate:**
- ✅ GLAccount hierarchy (already in schema)
- ✅ Account CRUD with tenant scoping

**Add:**
- Typed Data Access Layer (DAL)
- Commingling warning UI logic

**Schema Changes:**
```prisma
// Add to GLAccount
model GLAccount {
  // ... existing fields
  isCTAAccount Boolean @default(false)  // Hook for Phase 6 consolidation
}
```

---

### Phase 2: Bank Reconciliation

**Activate:**
- ✅ BankConnection model
- ✅ BankFeedTransaction model
- ✅ TransactionMatch model

**Add:**
- Flinks raw data preservation
- Pending transaction staging
- Status history tracking

**Schema Changes:**
```prisma
model BankFeedTransaction {
  // ... existing fields

  // NEW: Raw data preservation (Audit #4)
  rawData Json?  // Full Flinks webhook payload
  merchantHints Json?  // Flinks categorization data

  // NEW: Status tracking (Audit #10)
  status String @default("pending")  // 'pending' | 'posted' | 'cancelled'
  statusHistory Json[]  // Track description changes

  // NEW: GL posting link
  postedToJournalId String?  // Only set when status='posted'
}

model Transaction {
  // ... existing fields

  // NEW: Staging flag
  isStaged Boolean @default(false)  // True if from pending bank feed
}
```

**Implementation:**
```typescript
// Webhook handler - preserve everything
async function handleFlinksWebhook(webhook: FlinksWebhook) {
  await prisma.bankFeedTransaction.create({
    data: {
      // ... mapped fields
      rawData: webhook,  // Full payload
      merchantHints: webhook.merchant,
      status: webhook.status === 'pending' ? 'pending' : 'posted',
      statusHistory: [{
        status: webhook.status,
        description: webhook.description,
        timestamp: new Date()
      }]
    }
  });
}

// Only post to GL when status changes to 'posted'
```

---

### Phase 3: Transactions & Bookkeeping

**Activate:**
- ✅ JournalEntry validation
- Database constraint for balanced entries

**Add:**
- Balanced journal constraint
- Transfer linking
- Source document snapshots

**Schema Changes:**
```prisma
model JournalEntry {
  // ... existing fields

  // NEW: Source document preservation (Audit #2 - Event Sourcing Lite)
  sourceDocument Json?  // Snapshot of Invoice/Payment/etc at posting time

  // NEW: Transfer linking (Audit #1 - Better than separate Transfer entity)
  linkedEntryId String?  // Points to counterpart journal entry
  linkedEntry JournalEntry? @relation("TransferPair", fields: [linkedEntryId], references: [id])
}

model JournalLine {
  // ... existing fields
}

// Add database constraint (CRITICAL)
// NOTE: Prisma doesn't support cross-row checks yet
// This must be enforced via database migration
```

**Database Migration:**
```sql
-- Phase 3: Add balanced entry constraint
-- This MUST be added via raw SQL migration

-- Option A: Check constraint (PostgreSQL 12+)
-- NOTE: This doesn't work across rows in Prisma
-- Enforce in application + database trigger

-- Option B: Database trigger (RECOMMENDED)
CREATE OR REPLACE FUNCTION check_balanced_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT SUM(debit_amount - credit_amount)
      FROM journal_lines
      WHERE journal_entry_id = NEW.journal_entry_id) <> 0
  THEN
    RAISE EXCEPTION 'Journal entry % is not balanced', NEW.journal_entry_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_balanced_entry
  AFTER INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION check_balanced_journal_entry();
```

**Implementation:**
```typescript
// Transfer as view, not entity
async function createTransfer(from: Account, to: Account, amount: number) {
  // Create two linked journal entries
  const [debitEntry, creditEntry] = await prisma.$transaction([
    // Entry 1: Debit destination account
    prisma.journalEntry.create({
      data: {
        entityId: to.entityId,
        date: new Date(),
        memo: `Transfer from ${from.name}`,
        sourceType: 'TRANSFER',
        lines: {
          create: [
            { glAccountId: to.glAccountId, debitAmount: amount, creditAmount: 0 },
            { glAccountId: cashAccountId, debitAmount: 0, creditAmount: amount }
          ]
        }
      }
    }),

    // Entry 2: Credit source account
    prisma.journalEntry.create({
      data: {
        entityId: from.entityId,
        date: new Date(),
        memo: `Transfer to ${to.name}`,
        sourceType: 'TRANSFER',
        lines: {
          create: [
            { glAccountId: cashAccountId, debitAmount: amount, creditAmount: 0 },
            { glAccountId: from.glAccountId, debitAmount: 0, creditAmount: amount }
          ]
        }
      }
    })
  ]);

  // Link them
  await prisma.journalEntry.update({
    where: { id: debitEntry.id },
    data: { linkedEntryId: creditEntry.id }
  });

  await prisma.journalEntry.update({
    where: { id: creditEntry.id },
    data: { linkedEntryId: debitEntry.id }
  });
}

// Query transfers
async function getTransfers() {
  return prisma.journalEntry.findMany({
    where: { linkedEntryId: { not: null } },
    include: { linkedEntry: true }
  });
}
```

---

### Phase 4-5: Invoicing & Analytics

**Activate:**
- ✅ Invoice/Bill posting to GL
- ✅ Payment allocation
- Report generation from JournalEntry

**Add:**
- Cash vs Accrual basis support via AccountingPolicy

**Schema Changes:**
```prisma
// Use existing AccountingPolicy
// No schema changes needed

model AccountingPolicy {
  // Already exists
  key String  // 'accounting_basis' | 'revenue_recognition' | 'fx_translation'
  value String  // 'CASH' | 'ACCRUAL' | 'SPOT' | 'AVERAGE'
}
```

**Implementation:**
```typescript
// Dual-basis reporting via policy
async function getFinancialReport(entityId: string, period: Period) {
  const policy = await prisma.accountingPolicy.findFirst({
    where: { entityId, key: 'accounting_basis' }
  });

  if (policy?.value === 'CASH') {
    // Generate report from Payment records
    return generateCashBasisReport(entityId, period);
  } else {
    // Generate report from JournalEntry records
    return generateAccrualBasisReport(entityId, period);
  }
}
```

---

### Phase 6: Multi-Currency Consolidation (Optional)

**Activate:**
- ✅ FXRate model
- ✅ AccountingPolicy for FX methods
- CTA (Cumulative Translation Adjustment) accounts

**Add:**
- Consolidation elimination entries
- FX translation logic

**Schema Changes:**
```prisma
model GLAccount {
  // Already has:
  // isCTAAccount Boolean @default(false)

  // NEW: Consolidation flags
  isEliminationAccount Boolean @default(false)  // For inter-company eliminations
  consolidationCode String?  // Maps accounts across entities
}

model ConsolidationElimination {
  id String @id @default(cuid())
  fiscalPeriodId String
  fromEntityId String
  toEntityId String
  amount Int
  description String
  journalEntryId String?  // Link to elimination entry
  createdAt DateTime @default(now())
}
```

**Implementation:**
```typescript
// Consolidation with CTA
async function consolidateEntities(entities: Entity[], period: Period) {
  const results = [];

  for (const entity of entities) {
    const balances = await getBalances(entity.id, period);

    if (entity.functionalCurrency !== 'CAD') {
      // Translate to reporting currency
      const translated = await translateBalances(
        balances,
        entity.functionalCurrency,
        'CAD',
        period
      );

      // Calculate CTA
      const cta = calculateCTA(balances, translated);

      results.push({ entity, balances: translated, cta });
    } else {
      results.push({ entity, balances, cta: 0 });
    }
  }

  // Eliminate inter-company transactions
  const eliminations = await calculateEliminations(results);

  return consolidate(results, eliminations);
}
```

---

### Phase 7: AI Financial Advisor

**Activate:**
- ✅ Rule model
- ✅ Insight model
- Human-in-the-loop rule generation

**Add:**
- AI rule suggestion engine
- Deterministic rule execution

**Schema Changes:**
```prisma
model Rule {
  // Already exists with:
  // source String - Track origin
  // conditions String (JSON)
  // action String (JSON)

  // NEW: AI metadata
  aiConfidence Float?  // 0.0 - 1.0
  aiModelVersion String?  // 'gpt-4-2024-01'
  userApprovedAt DateTime?
  executionCount Int @default(0)
  successRate Float @default(1.0)
}

model RuleSuggestion {
  id String @id @default(cuid())
  entityId String
  triggeredBy String  // transactionId that triggered suggestion
  suggestedRule Json  // Proposed rule structure
  aiReasoning String  // "User categorized 3 Starbucks transactions as 'Meals'"
  confidence Float
  status String  // 'pending' | 'approved' | 'rejected'
  createdAt DateTime @default(now())
  reviewedAt DateTime?
}
```

**Implementation (Critical):**
```typescript
// NEVER let AI write directly to database
// AI generates rules, humans approve, rules execute

async function analyzeUserAction(transaction: Transaction, category: Category) {
  // User just categorized a transaction
  const pattern = await ai.analyze({
    prompt: `User categorized transaction "${transaction.description}" as "${category.name}".
             Suggest a deterministic rule.`,
    context: await getRecentTransactions(transaction.accountId)
  });

  // AI suggests rule (not executes it)
  await prisma.ruleSuggestion.create({
    data: {
      entityId: transaction.entityId,
      triggeredBy: transaction.id,
      suggestedRule: {
        if: { description: { contains: pattern.keyword } },
        then: { category: category.id }
      },
      aiReasoning: pattern.explanation,
      confidence: pattern.confidence,
      status: 'pending'
    }
  });

  // Show to user: "Create rule: Starbucks → Meals?"
}

// User approves
async function approveRuleSuggestion(suggestionId: string) {
  const suggestion = await prisma.ruleSuggestion.findUnique({
    where: { id: suggestionId }
  });

  // Create deterministic rule
  await prisma.rule.create({
    data: {
      entityId: suggestion.entityId,
      name: `Auto-generated: ${suggestion.aiReasoning}`,
      conditions: JSON.stringify(suggestion.suggestedRule.if),
      action: JSON.stringify(suggestion.suggestedRule.then),
      isActive: true,
      source: 'AI_SUGGESTED',
      aiConfidence: suggestion.confidence
    }
  });

  // Mark suggestion as approved
  await prisma.ruleSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'approved', reviewedAt: new Date() }
  });
}

// Rule execution is deterministic (no AI involved)
async function executeRules(transaction: Transaction) {
  const rules = await prisma.rule.findMany({
    where: { entityId: transaction.entityId, isActive: true }
  });

  for (const rule of rules) {
    const conditions = JSON.parse(rule.conditions);
    const action = JSON.parse(rule.action);

    if (matchesCondition(transaction, conditions)) {
      await applyAction(transaction, action);

      // Track success
      await prisma.rule.update({
        where: { id: rule.id },
        data: { executionCount: { increment: 1 } }
      });
    }
  }
}
```

---

### Phase 8: Row Level Security (Production)

**Activate:**
- PostgreSQL RLS policies
- Session-based tenant context

**Add:**
- Database-level isolation
- Migration from DAL to RLS

**Schema Changes:**
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables with tenantId or entityId

-- Create policies
CREATE POLICY tenant_isolation ON invoices
  USING (
    tenant_id = current_setting('app.current_tenant_id')::text
  );

CREATE POLICY tenant_isolation ON journal_entries
  USING (
    entity_id IN (
      SELECT id FROM entities
      WHERE tenant_id = current_setting('app.current_tenant_id')::text
    )
  );

-- Repeat for all tables
```

**Implementation:**
```typescript
// Phase 8: RLS-enabled connection
class RLSPrismaClient {
  constructor(private tenantId: string) {}

  async withTenantContext<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    // Set session variable
    await prisma.$executeRaw`SET app.current_tenant_id = ${this.tenantId}`;

    // Execute query (RLS automatically filters)
    const result = await fn(prisma);

    return result;
  }
}

// Usage
const rlsDb = new RLSPrismaClient(req.tenantId);
await rlsDb.withTenantContext(async (db) => {
  // Even if developer writes:
  const allInvoices = await db.invoice.findMany();
  // RLS ensures only this tenant's invoices are returned
  return allInvoices;
});
```

---

## Event Sourcing Evolution

### Phase 0-5: Event Tracking (Current)

```typescript
// We already track source of every journal entry
const entry = await prisma.journalEntry.create({
  data: {
    sourceType: 'INVOICE',
    sourceId: invoice.id,
    sourceDocument: invoice  // Snapshot
  }
});

// DomainEvent records business events
await prisma.domainEvent.create({
  data: {
    type: 'InvoiceCreated',
    aggregateId: invoice.id,
    aggregate: 'Invoice',
    payload: JSON.stringify(invoice)
  }
});
```

### Phase 6-8: Event Sourcing Lite (Optional)

If you discover bugs in accounting logic, you can replay:

```typescript
// Rebuild journal entries from domain events
async function rebuildLedger(entityId: string, fromDate: Date) {
  // 1. Soft-delete all journal entries after fromDate
  await prisma.journalEntry.updateMany({
    where: { entityId, date: { gte: fromDate } },
    data: { status: 'archived' }
  });

  // 2. Replay domain events
  const events = await prisma.domainEvent.findMany({
    where: {
      entityId,
      createdAt: { gte: fromDate },
      type: { in: ['InvoiceCreated', 'PaymentReceived', 'TransactionImported'] }
    },
    orderBy: { createdAt: 'asc' }
  });

  for (const event of events) {
    const payload = JSON.parse(event.payload);

    // Re-run current (fixed) posting logic
    if (event.type === 'InvoiceCreated') {
      await postInvoiceToGL(payload);
    } else if (event.type === 'PaymentReceived') {
      await postPaymentToGL(payload);
    }
    // ... etc

    await prisma.domainEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() }
    });
  }
}
```

**When to activate:** Only if you encounter a systemic accounting bug that affects historical data.

---

## Testing Each Evolution

### Phase 0: Foundation
```bash
# Test balanced journal constraint
npm run test:balanced-journals

# Test tenant isolation
npm run test:tenant-isolation
```

### Phase 2: Bank Reconciliation
```bash
# Test pending transaction handling
npm run test:pending-transactions

# Test Flinks raw data preservation
npm run test:flinks-webhooks
```

### Phase 3: Transactions
```bash
# Test transfer linking
npm run test:transfers

# Test database constraint
npm run test:balanced-constraint
```

### Phase 7: AI Rules
```bash
# Test AI rule suggestion (not execution)
npm run test:ai-suggestions

# Test deterministic rule execution
npm run test:rule-engine
```

### Phase 8: RLS
```bash
# Test RLS policies
npm run test:rls-isolation

# Verify no cross-tenant leaks
npm run test:security-audit
```

---

## Migration Checklist

Before activating each phase:

**Phase 1:**
- [ ] Implement Typed DAL
- [ ] Add commingling warning UI
- [ ] Test tenant isolation

**Phase 2:**
- [ ] Run migration: Add rawData to BankFeedTransaction
- [ ] Set up Flinks webhook handler
- [ ] Test pending → posted flow

**Phase 3:**
- [ ] Run migration: Add database trigger for balanced entries
- [ ] Implement transfer linking logic
- [ ] Test source document preservation

**Phase 6:**
- [ ] Run migration: Add CTA accounts to seed data
- [ ] Implement consolidation logic
- [ ] Test FX translation accuracy

**Phase 7:**
- [ ] Create RuleSuggestion model
- [ ] Implement AI suggestion (not execution) engine
- [ ] Add liability disclaimers to UI

**Phase 8:**
- [ ] Enable RLS on all tables
- [ ] Migrate from DAL to RLS
- [ ] Security audit

---

## References

- [Audit Recommendations](../../BACKUP-SECURITY.md#audit-recommendations) - Full audit report
- [Prisma Schema](../../packages/db/prisma/schema.prisma) - Current schema
- [ROADMAP.md](../../ROADMAP.md) - Implementation phases

---

**Last Updated:** 2026-01-29
**Next Review:** After completing Phase 1 (Accounts Overview)
