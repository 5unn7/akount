# Financial Workflow Patterns

> **Consolidated from:** `journal-entry-editor.md` + `reconciliation-matching-ux.md` + accounting patterns
>
> **Last Updated:** 2026-02-04

## Overview

Financial workflows are structured, step-by-step processes that accountants and bookkeepers use to record and verify financial transactions. They must:

- **Prevent errors** through guided workflows
- **Maintain audit trails** for compliance
- **Support double-entry** accounting principles
- **Handle multi-currency** and multi-entity scenarios
- **Provide clear feedback** on correctness

These workflows are the difference between "bookkeeping software" and "accounting infrastructure."

---

## Core Principles

### 1. Double-Entry Must Always Balance

Every financial workflow enforces: **Debits = Credits**

Before allowing confirmation, the system must verify:

- Total debits calculated
- Total credits calculated
- Difference calculated and displayed
- User explicitly confirms if posting unbalanced (exceptional)

### 2. Audit Trail Everything

Every action creates a record:

- Who made the change?
- When?
- What changed?
- Why (reason/comment)?
- Source document linked?

### 3. Multi-Entity Awareness

- Workflows surface which entity each line affects
- Cannot accidentally mix entity data
- Intercompany transfers flagged explicitly

### 4. Locked Fiscal Periods

Once a period is locked:

- Cannot modify posted entries (except reversals)
- Cannot post new entries
- Clear visual indicator

### 5. Progressive Confirmation

Users must confirm at multiple checkpoints before posting to general ledger:

1. Initial entry
2. Entity validation
3. Balance verification
4. Final posting confirmation

---

## Journal Entry Workflow

### Purpose

Create or modify double-entry journal entries that post directly to the general ledger.

Used for:

- Manual adjustments
- Tax provision entries
- Consolidation entries
- Amortization schedules
- Loan payment allocations

### Workflow Steps

#### Step 1: Entry Details

```
Journal Entry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date: [Select date]
Reference: [Entry reference]
Entity: [🇨🇦 Canadian Corp] ▼
Period: [Q4 2025]
Description: [Tax provision adjustment]
```

**Validation:**

- Date must be within open fiscal period
- Entity must be selected
- Description required

#### Step 2: Add Lines

Grid with auto-focus on amount input:

```
Account                 Debit           Credit
[Select]
─────────────────────────────────────────────
Regular GL Account      [1,200]
Income Tax Expense      [1,200]

Total                   1,200           1,200  ✓
```

**Rules:**

- Alternate between debit/credit columns
- Numbers in monospace
- GL Account searchable/autocomplete
- Real-time balance calculation
- Cannot post until balanced

#### Step 3: Review & Confirm

```
Journal Entry Preview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entity: 🇨🇦 Canadian Corp
Period: Q4 2025 (Open)
Date: 2025-12-31

Lines:
  Regular GL Account      DR $1,200.00
  Income Tax Expense      CR $1,200.00

Status: Balanced ✓
Audit trail: Entry will be timestamped, user recorded

[Cancel] [Save as Draft] [Post to GL]
```

**Final checks:**

- Sum of debits = sum of credits
- All required fields filled
- Clear action buttons

#### Step 4: Posted State

```
✓ Entry Posted Successfully

Reference: JE-001524
Posted by: Sarah Chen
Posted at: 2025-12-31 14:23 EST
GL Date: 2025-12-31

Journal entries cannot be edited after posting.
[View entry] [Create reversal] [Back to list]
```

---

## Reconciliation Workflow

### Purpose

Match bank/payment feed transactions with book transactions to verify accuracy.

### Workflow States

#### State 1: Unmatched Transactions

```
Unmatched Transactions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BANK (15 unmatched)          |  BOOK (8 unmatched)
                             |
$2,400 - Amazon             |  $2,400 - Cloud Services
$150 - Interac              |  $1,200 - Client A
$1,200 - Client Payment     |  $320 - Office Supplies
```

**Matching modes:**

- Drag & drop
- Auto-match (confidence score)
- Manual entry

#### State 2: Matching Process

**Manual match:**

```
Matching: Bank $2,400 ← → Book $2,400
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bank Transaction
Date: 2025-12-01
Amount: $2,400 USD
Description: AMAZON.COM

Book Transaction
Date: 2025-12-01
Amount: $2,400.00 USD
Category: Cloud Services
Linked to: Invoice INV-0234

[Match] [Skip] [Create adjustment]
```

**Auto-match:**

```
Found 87% confidence match:

Bank: $2,400 Amazon.com → Book: $2,400 Cloud Services
FX Rate: 1.0 (USD→USD)
Date difference: 0 days

[Accept match] [Review] [Reject]
```

#### State 3: Confirmation

```
Reconciliation Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Matched: 12 of 15 bank transactions
Unmatched bank: 3 (pending)
Unmatched book: 2 (pending)

Matched amount: $45,230.50
Unmatched amount: $3,420.00

Statement balance: $45,230.50
Book balance: $45,230.50
Difference: $0.00 ✓

[Lock reconciliation] [Continue matching]
```

#### State 4: Locked

```
✓ Reconciliation Complete

Account: RBC Chequing - CAD
Period: December 2025
Matched: 2025-12-31 14:47 EST
Matched by: Sarah Chen

All transactions reconciled.
Cannot modify posted entries in this period.

[View audit log] [Create new reconciliation]
```

---

## FX Adjustment Workflow

### Purpose

Handle currency conversion differences when posting in functional currency.

### Workflow

```
Currency Adjustment Needed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Original: $1,200 USD (posted Jan 1, rate: 1.35)
Current: $1,620 CAD
Functional currency: CAD

Current rate (Dec 31): 1.32
Current equivalent: $1,584 CAD
Gain/Loss: $36 CAD

Recommended action:
Create journal entry to record FX gain

[Create entry] [Manual adjustment] [Ignore]
```

---

## Split Transaction Pattern

### Purpose

Break one transaction into multiple categories/entities.

### Workflow

```
Original Transaction: $1,500 expense

Current state: Uncategorized

Split into:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ $900  → Marketing
□ $600  → Professional Services
─────────────────
  $1,500 ✓

[Confirm split]
```

Each split creates separate journal lines while maintaining audit trail link to original.

---

## Multi-Currency Transaction Workflow

### Purpose

Record and post transactions across currency boundaries.

### Entry Process

```
New Transaction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Amount: $2,400 USD
Account: Chase USD (USA)

Transaction details:
Date: 2025-12-31
Description: Freelancer payment
Counterparty: Jane Developer

Converting to functional currency (CAD):
Rate on transaction date: 1.32
Amount in CAD: $3,168 CAD

FX realized: $0 (in-period)

[Confirm] [Adjust rate] [Manual FX entry]
```

---

## Transfer Between Accounts

### Purpose

Record internal account-to-account movements.

### Workflow

```
Create Transfer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From: RBC Chequing (CAD)
To: Wise Multi-currency (USD)

Amount: $5,000 CAD
Convert to: $3,788 USD (rate: 1.32)

Journal entry:
  DR Wise USD          $3,788
  CR RBC CAD           $5,000
  DR FX Gain/Loss      $0 (balanced)

Source: Internal transfer
Reference: TRF-001234

[Post transfer]
```

---

## Approval Workflow (Multi-User)

### Purpose

Route entries for review before posting (especially for accountants).

### States

```
Draft → Pending Review → Approved → Posted
```

#### Draft State

```
[Entry by: John]
Status: Draft
[Submit for review]
```

#### Pending Review

```
[Entry by: John]
Status: Awaiting accountant review
[Assigned to: Sarah Chen]

Sarah's options:
[Approve] [Request changes] [Reject]
```

#### Approved

```
[Entry by: John, Approved by: Sarah]
Status: Approved
[Post] [Undo approval]
```

#### Posted

```
[Entry by: John, Approved by: Sarah, Posted by: Sarah]
Status: Posted
Cannot be modified
```

---

## Error Prevention & Recovery

### Preventive Safeguards

| Check | Prevents | Action |
| ----- | --------- | ------ |
| Fiscal period lock | Posting to closed period | Show warning + block |
| Entity validation | Cross-entity mixing | Highlight + confirm |
| GL code validity | Invalid accounts | Search/autocomplete only |
| Balance check | Unbalanced entries | Block post button |
| Date validation | Future/invalid dates | Calendar picker, bounds check |

### Recovery Mechanisms

If error is detected after posting:

1. **View the posted entry** (read-only)
2. **Create a reversal** (automatic debit/credit flip)
3. **Post correcting entry** (maintains audit trail)

Never delete. Always document.

---

## Component Decomposition

### Primitives

- `AmountInput` - Enforces monospace, decimal handling
- `GLAccountSelector` - Searchable GL account picker
- `EntitySelector` - Multi-entity aware
- `BalanceIndicator` - Shows debit/credit balance
- `DatePicker` - Validates against fiscal periods
- `ConfirmationButton` - Multi-step confirmation UI

### Composites

- `JournalEntryForm` - Complete entry editor
- `ReconciliationMatcher` - Drag-and-drop matching
- `EntryPreview` - Read-only summary before posting
- `ApprovalPanel` - Review/approve interface
- `TransferBuilder` - Multi-account transfer UI

### Workflows

- **Create Entry** - New journal entry
- **Reconcile Account** - Match transactions
- **Create Transfer** - Between-account movement
- **Split Transaction** - Allocate to multiple categories
- **Handle FX** - Currency adjustment
- **Approve & Post** - Review queue and posting

---

## Implementation Guidelines

### Data Structure

```typescript
interface JournalEntry {
  id: string;
  entityId: string;
  date: Date;
  description: string;
  reference: string;
  status: 'draft' | 'pending_review' | 'approved' | 'posted';
  lines: JournalLine[];
  createdBy: string;
  createdAt: Date;
  postedBy?: string;
  postedAt?: Date;
  auditLog: AuditEntry[];
}

interface JournalLine {
  glAccountId: string;
  debitAmount: number; // in cents
  creditAmount: number; // in cents
  description?: string;
  fxRate?: number;
  sourceCurrency?: string;
}

// Must always be true:
sum(entry.lines.map(l => l.debitAmount)) === sum(entry.lines.map(l => l.creditAmount))
```

---

## Accessibility

- **Keyboard:** Tab through form fields, Enter to submit
- **Focus:** Always visible focus indicator
- **Error messages:** Clear, specific guidance
- **Screen readers:** Form labels properly associated
- **Currency:** Always shown with currency code
- **Numbers:** Monospace for scanability and screen readers

---

## Performance

- **Auto-save drafts** to prevent data loss
- **Lazy-load GL accounts** for large COAs
- **Debounce FX rate lookups** (300ms)
- **Cache entity/period data** (1 hour TTL)

---

## Audit Trail

Every workflow state creates audit entries:

- Who took the action?
- When?
- What field changed?
- From what value to what value?
- Why (user-provided reason)?

This is the heart of compliance.

---

## Planned Enhancements (From Roadmap)

### Corrections & Error Recovery Wizards (HIGH Priority, 6-9 months)

**Future enhancement:** Guided workflows that explain financial consequences when correcting mistakes.

**What's planned:**

- Correction wizards for common scenarios:
  - Invoice posted to wrong entity
  - Expense should've been capitalized, not expensed
  - Duplicate payment detected
- Before/after preview showing financial impact
- Automatic notes added to audit trail explaining the correction
- Clear guidance on "the right way to fix this"
- Journal entry for reversal auto-generated with explanations

**Real-world needs:**
In real accounting, mistakes are normal. The UX must normalize *fixing them correctly*, not hiding them.

**Why it matters:**
Prevents costly accounting errors and builds user confidence in fixing mistakes. Users shouldn't have to call an accountant for common corrections.

**Expected impact:** Errors become recoverable events, not disasters. "I made a mistake, and the system helped me fix it correctly."

---

### Evidence & Attachments as First-Class Citizens (MEDIUM Priority, 9-12 months)

**Future enhancement:** Require and track attachments for compliance-grade documentation.

**What's planned:**

- Required attachments for certain transaction types (configurable by entity)
- Attachment completeness checks (prevents posting without receipt)
- OCR with verification (not blind ingestion)
- Attachment search & retrieval (find receipts by keyword)
- Expiration tracking for licenses, contracts, insurance certificates
- Attachment requirements shown in workflows before posting

**Compliance reality:**
Receipts, contracts, letters, and licenses aren't decorative — they're **evidence**. System should require them for audit readiness.

**Why it matters:**
Makes audits seamless. Instead of "send us your receipts," audit trail includes documents. Enables regulatory compliance out of the box.

**Expected impact:** Audit-ready by default. "All required documents are attached and verified."

---

### Versioned Accounting Rules (LOW Priority, 12+ months)

**Future enhancement:** Track which rule version applied to each transaction.

**What's planned:**

- Versioned rule engine (rules have v1.0, v1.1, v2.0 etc.)
- "This transaction was processed under rule v1.2" notation
- Audit trail: "Rule changed on X date, these transactions before that use old logic"
- Rollback capability for rule changes (apply old version to period)
- Historical rule snapshots preserved

**Why it matters:**
During long audits (3-5 years of history), you need to know which version of the rule applied when. If a categorization rule changed in Feb 2024, transactions from 2023 used the old rule. This must be auditable.

**Expected impact:** Long-term audit defensibility. "We can prove which rule was active when."

---

## See Also

- [`./tables-data.md`](./tables-data.md) - Transaction table display
- [`../03-screens/reconciliation.md`](../03-screens/reconciliation.md) - Full reconciliation screen spec
- [`../05-governance/permissions-matrix.md`](../05-governance/permissions-matrix.md) - Who can create/approve entries
- [`../06-compliance/security.md`](../06-compliance/security.md) - Audit requirements
