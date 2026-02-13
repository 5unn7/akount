# Architecture Hooks - What's Built In

**Purpose:** Document the architectural hooks built into the schema for future features
**Last Updated:** 2026-01-29
**Philosophy:** "Architecture for scale, implement for lean"

---

## Overview

The Prisma schema includes **architectural hooks** - fields and relationships that aren't used in the MVP but enable future features without refactoring. This document maps what's there and when to activate it.

---

## ✅ Built-In Hooks (In Schema Now)

### 1. Event Sourcing Lite

**What's there:**

```prisma
model JournalEntry {
  sourceType String?     // 'INVOICE' | 'PAYMENT' | 'BANK_FEED'
  sourceId String?       // ID of source document
  sourceDocument Json?   // Snapshot at posting time
}

model DomainEvent {
  type String            // 'InvoiceCreated' | 'TransactionPosted'
  payload String         // Full event data (JSON)
  processedAt DateTime?  // Replay marker
}
```

**When to activate:** Phase 6-8 (if accounting logic bugs need history replay)

**What it enables:**

- Rebuild journal entries from source documents
- Replay events to fix historical accounting errors
- Maintain audit trail of why entries were created

**Example usage:**

```typescript
// Can always trace back to source
const entry = await prisma.journalEntry.findUnique({
  where: { id: entryId },
  include: { sourceDocument: true }
});

console.log(`Created from ${entry.sourceType} #${entry.sourceId}`);
// "Created from INVOICE #INV-001"
```

---

### 2. Transfer Linking (Not a Separate Entity)

**What's there:**

```prisma
model JournalEntry {
  linkedEntryId String?           // Points to counterpart
  linkedEntry JournalEntry?       // Transfer pair
}
```

**When to activate:** Phase 3 (Transactions)

**What it enables:**

- Transfers as a view, not a primary entity
- No orphan transfers
- Single source of truth

**Example usage:**

```typescript
// Create linked transfer entries
const transfer = await createLinkedTransfer(fromAccount, toAccount, amount);

// Query transfers (view)
const transfers = await prisma.journalEntry.findMany({
  where: { linkedEntryId: { not: null } },
  include: { linkedEntry: true }
});
```

---

### 3. Flinks Raw Data Preservation

**What's there:**

```prisma
model BankFeedTransaction {
  rawData Json?          // Full Flinks webhook payload
  merchantHints Json?    // Flinks categorization
  statusHistory Json[]   // Track pending→posted changes
  postedToJournalId String? // Prevent duplicate GL postings
}
```

**When to activate:** Phase 2 (Bank Reconciliation)

**What it enables:**

- Debug Flinks issues without losing data
- Reprocess transactions if logic changes
- Track description changes between pending/posted
- AI training data (merchant hints)

**Example usage:**

```typescript
// Preserve everything from Flinks
await prisma.bankFeedTransaction.create({
  data: {
    // ... mapped fields
    rawData: flinksWebhook,  // NEVER delete this
    merchantHints: flinksWebhook.merchant,
    statusHistory: [{
      status: 'pending',
      description: flinksWebhook.description,
      timestamp: new Date()
    }]
  }
});

// Reprocess if needed
const raw = transaction.rawData;
await reprocessWithNewLogic(raw);
```

---

### 4. Pending Transaction Staging

**What's there:**

```prisma
model BankFeedTransaction {
  status String @default("pending")  // 'pending' | 'posted'
  postedToJournalId String?          // Only set when posted
}

model Transaction {
  isStaged Boolean @default(false)   // True if from pending feed
}
```

**When to activate:** Phase 2 (Bank Reconciliation)

**What it enables:**

- Show pending transactions in UI
- Never post pending to General Ledger
- Prevent duplicate postings

**Critical rule:**

```typescript
// NEVER post pending to GL
if (bankFeed.status === 'pending') {
  // Create staged transaction (UI only)
  await prisma.transaction.create({
    data: { ...data, isStaged: true }
  });
  // DO NOT create journal entry
}

// Only post when status changes to 'posted'
if (bankFeed.status === 'posted' && !bankFeed.postedToJournalId) {
  const entry = await createJournalEntry(bankFeed);
  await prisma.bankFeedTransaction.update({
    where: { id: bankFeed.id },
    data: { postedToJournalId: entry.id }
  });
}
```

---

### 5. Multi-Currency Consolidation

**What's there:**

```prisma
model GLAccount {
  isCTAAccount Boolean @default(false)  // Cumulative Translation Adjustment
  isEliminationAccount Boolean @default(false)
  consolidationCode String?             // Map accounts across entities
}

model ConsolidationElimination {
  fromEntityId String
  toEntityId String
  amount Int
  journalEntryId String?
}
```

**When to activate:** Phase 6 (optional for MVP)

**What it enables:**

- CTA equity accounts for FX translation differences
- Inter-company elimination entries
- Cross-entity consolidated reporting

**Example usage:**

```typescript
// Seed CTA accounts
await prisma.gLAccount.create({
  data: {
    code: '3900-CTA',
    name: 'Cumulative Translation Adjustment',
    type: 'equity',
    isCTAAccount: true
  }
});

// Create elimination entry
await prisma.consolidationElimination.create({
  data: {
    fromEntityId: entityA.id,
    toEntityId: entityB.id,
    amount: 100000, // cents
    description: 'Eliminate inter-company invoice #INV-001'
  }
});
```

---

### 6. AI Rule Engine (Human-in-the-Loop)

**What's there:**

```prisma
model Rule {
  conditions String      // JSON: { "description": { "contains": "STARBUCKS" } }
  action String          // JSON: { "category": "meals" }
  source String          // 'USER_MANUAL' | 'AI_SUGGESTED'

  // AI metadata
  aiConfidence Float?
  aiModelVersion String?
  userApprovedAt DateTime?
  executionCount Int
  successRate Float
}

model RuleSuggestion {
  suggestedRule Json     // Proposed rule
  aiReasoning String     // Why AI suggested it
  status String          // 'pending' | 'approved' | 'rejected'
}
```

**When to activate:** Phase 7 (AI Advisor)

**What it enables:**

- AI suggests rules, humans approve
- Deterministic rule execution (no live AI)
- Auditability and reliability

**Critical implementation:**

```typescript
// ❌ NEVER let AI write directly to database
// ✅ AI suggests → User approves → Deterministic rule executes

// Step 1: AI suggests
async function suggestRule(transaction, userChoice) {
  const pattern = await ai.analyze({
    description: transaction.description,
    category: userChoice
  });

  // Create suggestion (not rule yet)
  return prisma.ruleSuggestion.create({
    data: {
      suggestedRule: {
        if: { description: { contains: pattern.keyword } },
        then: { category: userChoice }
      },
      aiReasoning: pattern.explanation,
      status: 'pending'
    }
  });
}

// Step 2: User approves
async function approveRule(suggestionId) {
  const suggestion = await prisma.ruleSuggestion.findUnique({
    where: { id: suggestionId }
  });

  // NOW create deterministic rule
  return prisma.rule.create({
    data: {
      conditions: JSON.stringify(suggestion.suggestedRule.if),
      action: JSON.stringify(suggestion.suggestedRule.then),
      source: 'AI_SUGGESTED',
      aiConfidence: suggestion.aiConfidence
    }
  });
}

// Step 3: Deterministic execution (no AI)
async function executeRules(transaction) {
  const rules = await prisma.rule.findMany({
    where: { isActive: true }
  });

  for (const rule of rules) {
    if (matches(transaction, JSON.parse(rule.conditions))) {
      await apply(transaction, JSON.parse(rule.action));
    }
  }
}
```

---

### 7. Accounting Policy Flexibility

**What's there:**

```prisma
model AccountingPolicy {
  key String     // 'accounting_basis' | 'fx_translation'
  value String   // 'CASH' | 'ACCRUAL' | 'SPOT' | 'AVERAGE'
  effectiveFrom DateTime
  effectiveTo DateTime?
}
```

**When to activate:** Phase 4-5 (Analytics)

**What it enables:**

- Support both cash and accrual basis
- Different FX translation methods
- Policy changes over time

**Example usage:**

```typescript
// Canadian business: Cash flow (cash) but GST/HST (accrual)
await prisma.accountingPolicy.createMany({
  data: [
    {
      entityId: entity.id,
      key: 'accounting_basis',
      value: 'CASH',
      effectiveFrom: new Date()
    },
    {
      entityId: entity.id,
      key: 'tax_basis',
      value: 'ACCRUAL',
      effectiveFrom: new Date()
    }
  ]
});

// Generate report based on policy
const policy = await prisma.accountingPolicy.findFirst({
  where: { entityId, key: 'accounting_basis' }
});

if (policy.value === 'CASH') {
  return generateCashBasisReport(entityId);
} else {
  return generateAccrualBasisReport(entityId);
}
```

---

## 🚧 Not Yet Built (Implemented in Code Later)

### 1. Database Constraint for Balanced Entries

**When:** Phase 3 (Transactions)

**Implementation:**

```sql
-- Must be added via raw SQL migration
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

### 2. Row Level Security (RLS)

**When:** Phase 8 (Production)

**Implementation:**

```sql
-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::text);
```

### 3. Typed Data Access Layer (DAL)

**When:** Phase 1 (Accounts Overview)

**Implementation:**

```typescript
class TenantScopedPrisma {
  constructor(private tenantId: string) {}

  // Force tenant context on every query
  invoice = {
    findMany: (args) => prisma.invoice.findMany({
      ...args,
      where: { ...args.where, tenantId: this.tenantId }
    })
  }
}
```

---

## 📋 Activation Checklist

### Before Phase 1

- [ ] Schema hooks reviewed
- [ ] Team understands which fields activate when

### Phase 2 (Bank Reconciliation)

- [ ] Activate: `rawData`, `statusHistory`, `postedToJournalId`
- [ ] Implement: Pending transaction flow
- [ ] Test: Flinks webhook preservation

### Phase 3 (Transactions)

- [ ] Activate: `linkedEntryId` for transfers
- [ ] Activate: `sourceDocument` snapshots
- [ ] Implement: Database trigger for balanced entries
- [ ] Test: Cannot create unbalanced journal entry

### Phase 6 (Consolidation)

- [ ] Activate: `isCTAAccount`, `consolidationCode`
- [ ] Seed: CTA equity accounts
- [ ] Implement: FX translation logic

### Phase 7 (AI Advisor)

- [ ] Activate: `RuleSuggestion` model
- [ ] Implement: Human-in-the-loop rule approval
- [ ] Test: AI never writes directly to DB

### Phase 8 (Production)

- [ ] Implement: Row Level Security
- [ ] Migration: DAL → RLS
- [ ] Audit: Cross-tenant isolation test

---

## 🎯 Benefits of This Approach

### What We Get

✅ **No refactoring later** - hooks are already in schema
✅ **MVP stays lean** - hooks are optional/nullable
✅ **Clear migration path** - documented when to activate each hook
✅ **Team alignment** - everyone knows the future architecture

### What We Avoid

❌ Breaking schema changes in production
❌ Data migrations for new columns
❌ "We should have thought of this earlier"
❌ Confusion about which fields are used

---

## 📚 References

- [evolution.md](./evolution.md) - Detailed activation guide for each phase
- [schema.prisma](../../packages/db/prisma/schema.prisma) - Current schema with hooks
- [ROADMAP.md](../../ROADMAP.md) - Implementation timeline

---

**Last Updated:** 2026-01-29
**Next Review:** After Phase 1 (validate hooks are sufficient)
