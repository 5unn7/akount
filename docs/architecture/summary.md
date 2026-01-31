# Architecture Summary - Akount

**Date:** 2026-01-29
**Status:** Ready for Phase 0 implementation
**Philosophy:** "Architecture for scale, implement for lean"

---

## What We Built

You now have a **future-proof architecture** that enables advanced features without over-engineering the MVP.

### 📐 Architecture Approach

**The Problem We Solved:**
- Most MVPs build for immediate needs, then refactor painfully later
- Full enterprise architecture is too complex for MVP
- Need middle ground: simple now, extensible later

**Our Solution:**
- Schema includes **architectural hooks** (optional fields)
- Hooks are documented but not implemented until needed
- Clear **phase-by-phase activation plan**
- No breaking changes or data migrations later

---

## 📚 Documentation Created

### 1. [docs/architecture/evolution.md](./docs/architecture/evolution.md)
**Complete architecture evolution roadmap**

Maps how Akount evolves from MVP → Production:

**Phase 0-1: MVP Foundation**
- Tenant isolation (soft - middleware)
- Integer money math
- Source tracking on all entries

**Phase 2: Bank Reconciliation**
- Flinks raw data preservation
- Pending transaction staging
- Status history tracking

**Phase 3: Transactions & Bookkeeping**
- Database constraint for balanced entries (PostgreSQL trigger)
- Transfer linking (view, not entity)
- Source document snapshots

**Phase 6: Multi-Currency Consolidation** (Optional)
- CTA (Cumulative Translation Adjustment) accounts
- Elimination entries
- FX translation logic

**Phase 7: AI Financial Advisor** (Optional)
- Human-in-the-loop rule generation
- Deterministic rule execution
- AI suggests, users approve, rules execute

**Phase 8: Production**
- Row Level Security (RLS)
- Database-level tenant isolation
- Security audit and hardening

### 2. [docs/architecture/ARCHITECTURE-HOOKS.md](./docs/architecture/ARCHITECTURE-HOOKS.md)
**Hook inventory and activation guide**

Documents every architectural hook:
- What's built in (but not used yet)
- When to activate
- How to implement
- Code examples

---

## 🔧 Schema Enhancements

### Critical Additions

**1. Event Sourcing Lite**
```prisma
model JournalEntry {
  sourceType String?       // What created this entry
  sourceId String?         // Source document ID
  sourceDocument Json?     // Full snapshot at posting time
}
```
**Why:** Can rebuild GL if accounting logic has bugs

**2. Flinks Raw Data Preservation**
```prisma
model BankFeedTransaction {
  rawData Json?            // Full webhook payload - NEVER delete
  merchantHints Json?      // Flinks categorization
  statusHistory Json[]     // Track pending→posted changes
  postedToJournalId String? // Prevent duplicate postings
}
```
**Why:** Debug issues, reprocess transactions, AI training data

**3. Transfer Linking (Not Separate Entity)**
```prisma
model JournalEntry {
  linkedEntryId String?    // Points to counterpart
  linkedEntry JournalEntry? // Transfer pair
}
```
**Why:** Prevents orphan transfers, single source of truth

**4. Pending Transaction Handling**
```prisma
model BankFeedTransaction {
  status String @default("pending") // 'pending' | 'posted'
  postedToJournalId String?         // Only when posted
}

model Transaction {
  isStaged Boolean @default(false)  // Don't post to GL
}
```
**Why:** NEVER post pending transactions to General Ledger

**5. Multi-Currency Consolidation**
```prisma
model GLAccount {
  isCTAAccount Boolean              // For FX translation
  isEliminationAccount Boolean      // Inter-company eliminations
  consolidationCode String?         // Map across entities
}
```
**Why:** Phase 6 consolidation without schema changes

**6. AI Rule Engine (Human-in-the-Loop)**
```prisma
model Rule {
  source String          // 'USER_MANUAL' | 'AI_SUGGESTED'
  aiConfidence Float?    // Confidence score
  aiModelVersion String? // Which model suggested it
  userApprovedAt DateTime? // Human approval timestamp
}

model RuleSuggestion {
  suggestedRule Json     // Proposed rule
  aiReasoning String     // Why AI suggested it
  status String          // 'pending' | 'approved'
}
```
**Why:** AI suggests, humans approve, deterministic rules execute

---

## ✅ What You Can Do Now

### Immediate (Phase 0-1)
- Start building with confidence
- All hooks are in place
- MVP stays lean (hooks unused)
- No refactoring later

### Phase 2 (Bank Reconciliation)
- Activate: Flinks raw data hooks
- Implement: Pending transaction flow
- Test: Webhook preservation

### Phase 3 (Transactions)
- Activate: Transfer linking
- Add: Database trigger for balanced entries
- Test: Cannot create unbalanced entries

### Phase 6+ (Optional Advanced Features)
- Activate: Consolidation hooks
- Activate: AI rule suggestions
- Migrate: RLS for production

---

## 🎯 Key Architectural Decisions

### 1. ✅ Database Constraint for Balanced Entries (Phase 3)
**Decision:** PostgreSQL trigger, not just API validation

**Why:**
- API validation can be bypassed
- Database constraint cannot
- Critical for accounting integrity

**Implementation:**
```sql
CREATE TRIGGER enforce_balanced_entry
  AFTER INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION check_balanced_journal_entry();
```

### 2. ✅ Event Sourcing Lite (Not Full Event Sourcing)
**Decision:** Store source snapshots, not full event log + workers

**Why:**
- 80% of benefits, 20% of complexity
- Can rebuild if needed
- No background workers required
- Simpler debugging

### 3. ✅ Transfer as View (Not Entity)
**Decision:** Link JournalEntry pairs, don't create Transfer entity

**Why:**
- Prevents orphan transfers
- Single source of truth
- Can't get out of sync

### 4. ✅ Human-in-the-Loop AI (Not Live AI)
**Decision:** AI suggests rules, users approve, rules execute deterministically

**Why:**
- Auditability
- Reliability
- No AI hallucinations in production
- Can market as "AI-powered" without liability

### 5. ✅ RLS in Phase 8 (Not Phase 0)
**Decision:** Typed DAL first, RLS later

**Why:**
- Easier local development
- Can debug tenant issues
- Migrate to RLS before production
- Defense in depth approach

---

## 📊 Architecture Maturity By Phase

| Phase | Isolation | GL Integrity | Bank Feeds | Consolidation | AI | Security |
|-------|-----------|--------------|------------|---------------|-----|----------|
| 0-1 MVP | DAL ⚠️ | API ⚠️ | N/A | N/A | N/A | Basic |
| 2 Bank | DAL ⚠️ | API ⚠️ | Raw Data ✅ | N/A | N/A | Basic |
| 3 Txn | DAL ⚠️ | DB Trigger ✅ | Raw Data ✅ | N/A | N/A | Basic |
| 4-5 AR/AP | DAL ⚠️ | DB Trigger ✅ | Raw Data ✅ | N/A | N/A | Basic |
| 6 Consol | DAL ⚠️ | DB Trigger ✅ | Raw Data ✅ | CTA ✅ | N/A | Basic |
| 7 AI | DAL ⚠️ | DB Trigger ✅ | Raw Data ✅ | CTA ✅ | Rules ✅ | Basic |
| 8 Prod | RLS ✅ | DB Trigger ✅ | Raw Data ✅ | CTA ✅ | Rules ✅ | Hardened |

---

## 🚨 Critical Implementation Rules

### Never Break These

**1. Balanced Entries (Phase 3+)**
```typescript
// MUST enforce: SUM(debit - credit) = 0
// Database trigger prevents violations
```

**2. Pending Transactions (Phase 2+)**
```typescript
// NEVER post pending to GL
if (status === 'pending') {
  // Show in UI only
  // DO NOT create JournalEntry
}
```

**3. Commingling Funds (Phase 1+)**
```typescript
// Moving money between entities MUST be classified
if (fromEntity.type !== toEntity.type) {
  // Force user to choose: Owner Draw | Capital | Loan
}
```

**4. AI Rule Execution (Phase 7+)**
```typescript
// NEVER let AI write directly to database
// AI suggests → User approves → Rule executes
```

**5. Raw Data Preservation (Phase 2+)**
```typescript
// ALWAYS store full webhook payload
await create({
  rawData: fullWebhookPayload  // NEVER delete this
});
```

---

## 📋 Activation Checklist

### Before Starting Each Phase

**Phase 1:**
- [ ] Review evolution.md sections 1
- [ ] Understand which hooks activate
- [ ] Implement Typed DAL

**Phase 2:**
- [ ] Review evolution.md section 2
- [ ] Activate: `rawData`, `statusHistory`
- [ ] Test: Pending transaction flow

**Phase 3:**
- [ ] Review evolution.md section 3
- [ ] Add database trigger
- [ ] Test: Cannot create unbalanced entry
- [ ] Activate: Transfer linking

**Phase 6:**
- [ ] Review evolution.md section 6
- [ ] Activate: CTA accounts
- [ ] Seed: Consolidation GL accounts

**Phase 7:**
- [ ] Review evolution.md section 7
- [ ] Activate: RuleSuggestion model
- [ ] Test: AI never writes to DB directly

**Phase 8:**
- [ ] Review evolution.md section 8
- [ ] Implement: Row Level Security
- [ ] Test: Cross-tenant isolation

---

## 🎓 What Makes This Architecture Good

### ✅ For MVP
- Simple to implement (hooks unused)
- Fast to develop (no premature optimization)
- Easy to understand (clear boundaries)

### ✅ For Scale
- No refactoring needed (hooks in place)
- Clear migration path (documented)
- Production-ready architecture (Phase 8)

### ✅ For Team
- Architecture documented (evolution.md)
- Hooks inventoried (ARCHITECTURE-HOOKS.md)
- Everyone aligned (knows future plan)

---

## 🔗 Quick Reference

**Start Here:**
1. Read: [evolution.md](./docs/architecture/evolution.md) - Phase 0 section
2. Build: Phase 0 features (auth, DB, API)
3. Reference: [ARCHITECTURE-HOOKS.md](./docs/architecture/ARCHITECTURE-HOOKS.md) as needed

**Before Each Phase:**
1. Read evolution.md for that phase
2. Review hooks to activate
3. Follow implementation examples
4. Run phase tests

**When Stuck:**
- Check ARCHITECTURE-HOOKS.md for examples
- Review schema comments (inline documentation)
- See evolution.md for migration scripts

---

## 📦 What's Committed

```
✅ 6 commits ahead of origin/main
✅ Schema with architectural hooks
✅ Comprehensive documentation
✅ Phase-by-phase activation guide
✅ Code examples for each hook
✅ Database migration scripts
✅ Testing checklist
```

---

## 🎯 Bottom Line

You now have:
- ✅ **MVP-ready schema** (hooks are optional)
- ✅ **Production-grade architecture** (when activated)
- ✅ **No refactoring later** (hooks prevent breaking changes)
- ✅ **Clear roadmap** (documentation guides each phase)
- ✅ **Team alignment** (everyone knows the plan)

**You can build fast now, scale later, without paying the refactoring tax.**

---

## 📚 Documentation Index

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [evolution.md](./docs/architecture/evolution.md) | Phase-by-phase guide | Before each phase |
| [ARCHITECTURE-HOOKS.md](./docs/architecture/ARCHITECTURE-HOOKS.md) | Hook inventory | As reference |
| [schema.prisma](./packages/db/prisma/schema.prisma) | Current schema | When implementing |
| [ROADMAP.md](./ROADMAP.md) | Feature roadmap | For timeline |
| [BACKUP-SECURITY.md](./BACKUP-SECURITY.md) | Security procedures | Before production |

---

**Last Updated:** 2026-01-29
**Status:** Architecture complete, ready for implementation
**Next Step:** Start Phase 0 (Foundation)
