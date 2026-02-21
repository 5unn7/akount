# Financial Data Integrity Review: Entity Management Hub

> **Auditor:** financial-data-validator
> **Date:** 2026-02-20
> **Scope:** Entity financial operations, dashboard aggregation, report filtering, ownership precision
> **Risk Level:** HIGH
> **Plan Reviewed:** `docs/plans/2026-02-20-entity-management-hub.md`

---

## Financial Invariant Check

| Invariant | Status | Details |
|-----------|--------|---------|
| Integer cents | **VIOLATED (planned)** | Plan proposes `ownershipPercent Float?` on EntityRelationship -- introduces float arithmetic into a financial model. Existing `exchangeRate Float?` is tolerated because FX rates are inherently non-integer, but ownership percentages used in financial consolidation calculations will produce rounding errors. |
| Double-entry | OK | Plan does not modify journal entry creation logic. No new posting paths introduced. |
| Soft delete | **AT RISK** | Entity model has no `deletedAt` field today. Plan proposes `status: ARCHIVED` instead of soft delete. This is architecturally valid for Entity (Entity is not a financial record), but the archival operation must verify all child financial records are settled -- plan mentions this but lacks specificity. |
| Tenant isolation | OK | Existing EntityService uses `this.tenantId` constructor pattern. Plan states new methods must enforce tenant isolation. No gaps identified in current code. |
| Source preservation | N/A | Entity mutations do not create journal entries. No source document concern. |

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `apps/api/src/domains/system/services/entity.service.ts` | 1-119 | Current entity service -- no audit logging, no status field |
| `apps/api/src/domains/overview/services/dashboard.service.ts` | 1-240 | Dashboard metrics -- aggregates across ALL tenant entities without status filter |
| `apps/api/src/domains/accounting/services/report.service.ts` | 1-100, 127-133, 226-283, 362-430 | Report service -- `getEntityIds()` returns ALL entities without status filter |
| `apps/api/src/domains/banking/services/account.service.ts` | 1-80 | Account service -- entity filter uses only `entityId`, no status check |
| `apps/api/src/domains/invoicing/services/invoice.service.ts` | 185-215 | Invoice stats -- no entityId filter, no entity status filter |
| `apps/api/src/domains/vendors/services/bill.service.ts` | 12-42 | Bill stats -- accepts entityId but no entity status filter |
| `packages/db/prisma/schema.prisma` | 62-109 (Entity), 259-288 (Invoice), 139-168 (JournalEntry), 821-834 (ConsolidationElimination) | Schema models |
| `apps/api/src/lib/audit.ts` | 1-285 | Audit log with SHA-256 hash chain -- entity service does NOT call it |
| `apps/api/src/lib/tenant-scoped-query.ts` | 1-37 | Raw SQL tenant isolation wrapper |
| `.claude/rules/financial-rules.md` | Full | Financial invariants reference |

---

## Findings

### P0-1: Dashboard Aggregation Includes Pre-Registration Entities (Net Worth Inflation)

**Severity:** P0 (Critical -- financial misstatement on primary dashboard)
**File:** `apps/api/src/domains/overview/services/dashboard.service.ts:43-51`

**Issue:** The dashboard `getMetrics()` method queries all active accounts for the tenant without filtering by entity status:

```typescript
// dashboard.service.ts:43-51 (CURRENT CODE)
const accounts = await prisma.account.findMany({
  where: {
    entity: {
      tenantId: this.tenantId,
      ...(entityId && { id: entityId }),
    },
    isActive: true,
  },
});
```

When a user creates a `PRE_REGISTRATION` entity (the plan's new feature) and links bank accounts to it for "exploratory tracking," those balances will be aggregated into:
- **Net worth** (line 100: `const netWorth = totalAssets - totalLiabilities`)
- **Cash position** (line 86-88: `totalCash += convertedBalance`)
- **Account counts** (line 113-119)

The same problem exists in `getCashFlowProjection()` at line 161-172 -- historical transactions from pre-registration entities will be included in the 60-day cash flow projection.

**Financial Impact:** A solopreneur exploring entity formation with a pre-registration entity that has bank accounts linked will see inflated net worth, inflated cash position, and skewed cash flow projections. This is a material misstatement on the primary financial dashboard.

**Suggested Fix:** After the `EntityStatus` field is added, every query in `dashboard.service.ts` that joins through `entity` must add `status: 'ACTIVE'` (or `status: { not: 'ARCHIVED' }` if pre-reg data should be included but flagged separately):

```typescript
// RECOMMENDED FIX
const accounts = await prisma.account.findMany({
  where: {
    entity: {
      tenantId: this.tenantId,
      status: 'ACTIVE', // Exclude PRE_REGISTRATION and ARCHIVED
      ...(entityId && { id: entityId }),
    },
    isActive: true,
  },
});
```

Decision required: Should `PRE_REGISTRATION` entity balances appear on the dashboard with a visual indicator, or be excluded entirely? The plan's edge case section mentions "Show 'Informal' badge on reports" but does not specify dashboard behavior.

---

### P0-2: Report Service `getEntityIds()` Returns All Entities Without Status Filter

**Severity:** P0 (Critical -- financial statements include informal/archived entity data)
**File:** `apps/api/src/domains/accounting/services/report.service.ts:127-133`

**Issue:** The private `getEntityIds()` method in `ReportService` is used by every multi-entity consolidated report (P&L, Balance Sheet, Cash Flow, Spending, Revenue). It returns ALL entity IDs for the tenant with no status filter:

```typescript
// report.service.ts:127-133 (CURRENT CODE)
private async getEntityIds(): Promise<string[]> {
  const entities = await prisma.entity.findMany({
    where: { tenantId: this.tenantId },
    select: { id: true },
  });
  return entities.map(e => e.id);
}
```

When a `PRE_REGISTRATION` or `ARCHIVED` entity has GL accounts and posted journal entries, those entries will flow into:
- Consolidated Profit & Loss (line 260)
- Consolidated Balance Sheet (line 395)
- Consolidated Cash Flow Statement (line 587)
- Spending by Category (line 1066)
- Revenue by Client (line 1157)

**Financial Impact:** Formal financial statements (Balance Sheet, P&L) will include data from entities that are either informal/pre-registration or explicitly archived. This violates GAAP reporting boundaries. A pre-registration entity's exploratory transactions appearing on an official Balance Sheet is a material misstatement.

**Suggested Fix:**

```typescript
// RECOMMENDED FIX
private async getEntityIds(): Promise<string[]> {
  const entities = await prisma.entity.findMany({
    where: {
      tenantId: this.tenantId,
      status: 'ACTIVE', // Only active entities in formal reports
    },
    select: { id: true },
  });
  return entities.map(e => e.id);
}
```

Additionally, every individual report method that takes an `entityId` parameter should validate that the entity's status is `ACTIVE` (or at minimum not `ARCHIVED`) inside `validateEntityOwnership()`:

```typescript
// report.service.ts:115-118 (NEEDS STATUS CHECK)
private async validateEntityOwnership(entityId: string): Promise<void> {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId, tenantId: this.tenantId },
  });
  if (!entity) {
    throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404);
  }
  // ADD: Status validation
  if (entity.status === 'ARCHIVED') {
    throw new AccountingError(
      'Cannot generate reports for archived entities',
      'ENTITY_ARCHIVED',
      400
    );
  }
}
```

---

### P0-3: `getInvoiceStats()` Has No Entity ID Parameter -- Cannot Filter by Entity Status

**Severity:** P0 (Critical -- dashboard AR/AP metrics unfiltered)
**File:** `apps/api/src/domains/invoicing/services/invoice.service.ts:185`

**Issue:** The dashboard calls `getInvoiceStats()` passing `entityId` as a second argument:

```typescript
// dashboard.service.ts:55 (CALLER)
getInvoiceStats({ tenantId: this.tenantId, userId: '', role: 'OWNER' }, entityId),
```

But the function signature only accepts `ctx: TenantContext` -- it has NO `entityId` parameter:

```typescript
// invoice.service.ts:185 (ACTUAL SIGNATURE)
export async function getInvoiceStats(ctx: TenantContext) {
```

This means the `entityId` argument is silently ignored. ALL invoices across ALL entities (including future pre-registration and archived entities) are aggregated into AR metrics. The `entity: { tenantId: ctx.tenantId }` filter on line 190 filters by tenant but not by entity.

**Financial Impact:** Dashboard receivables metrics (`outstanding`, `overdue`) include invoices from all entities regardless of entity status. This is an existing bug that becomes worse with entity status management -- archived entities' open invoices would still appear in "overdue" counts.

**Suggested Fix:** The `getInvoiceStats` signature must accept `entityId` and filter by entity status:

```typescript
export async function getInvoiceStats(
  ctx: TenantContext,
  entityId?: string
) {
  const baseWhere = {
    entity: {
      tenantId: ctx.tenantId,
      status: 'ACTIVE', // After migration
      ...(entityId && { id: entityId }),
    },
    deletedAt: null,
  };
  // ... use baseWhere in all three aggregates
}
```

---

### P1-1: `ownershipPercent Float?` Violates Integer Cents Spirit -- Float Arithmetic in Financial Calculations

**Severity:** P1 (High -- precision loss in consolidation calculations)
**File:** Plan Task 2, proposed schema

**Issue:** The plan proposes:

```prisma
ownershipPercent Float?  // 0-100, nullable for non-ownership
```

And the plan's Task 5 proposes validation logic:

```
validateOwnershipTotal(entityId) -- sum of ownership % for an entity <= 100
```

Using `Float` for ownership percentage introduces IEEE 754 floating-point errors. Here is a concrete bug scenario:

```typescript
// Scenario: Three partners own a company
const partner1 = 33.33; // Float
const partner2 = 33.33; // Float
const partner3 = 33.34; // Float

// Validation: does it sum to 100?
const total = partner1 + partner2 + partner3;
// total = 100.00000000000001 (IEEE 754 float error)
// Validation REJECTS this: "ownership exceeds 100%"
```

More critically, ownership percentages are used in inter-entity consolidation calculations (the `ConsolidationElimination` model at schema line 821 already exists). When calculating proportional elimination entries:

```typescript
// Future consolidation logic
const eliminationAmount = Math.round(intercompanyBalance * ownershipPercent / 100);
// With float: Math.round(500000 * 33.33 / 100) = Math.round(166650.00000000003) = 166650
// With basis points: Math.round(500000 * 3333 / 10000) = Math.round(166650) = 166650
// Same result here, but cumulative errors across many calculations diverge
```

**Financial Impact:** Ownership percentage validation may reject valid inputs (100% rejection false positive). Future consolidation calculations using float ownership percentages will accumulate rounding errors across multiple elimination entries.

**Suggested Fix:** Store ownership as integer basis points (0-10000 where 10000 = 100.00%):

```prisma
ownershipBasisPoints Int?  // 0-10000 (100.00% = 10000), nullable for non-ownership
```

Validation becomes exact integer arithmetic:

```typescript
// Exact: 3333 + 3333 + 3334 = 10000 (exactly 100.00%)
const total = relationships.reduce((sum, r) => sum + (r.ownershipBasisPoints ?? 0), 0);
if (total > 10000) throw new Error('Ownership exceeds 100%');
```

Display conversion: `(basisPoints / 100).toFixed(2) + '%'`

---

### P1-2: Entity Service Has Zero Audit Logging

**Severity:** P1 (High -- entity mutations are unauditable)
**File:** `apps/api/src/domains/system/services/entity.service.ts` (entire file)

**Issue:** The current `EntityService` does not call `createAuditLog()` for any operation:
- `createEntity()` (line 58-90) -- no audit log
- `updateEntity()` (line 95-118) -- no audit log

The plan proposes adding `archiveEntity()`, `upgradeEntity()`, and relationship CRUD -- all of which are status-changing operations on the core entity model. Without audit logging, there is no record of:
- Who created an entity
- Who changed entity status from `PRE_REGISTRATION` to `ACTIVE`
- Who archived an entity
- Who modified ownership percentages between entities

The audit infrastructure exists and is robust (SHA-256 hash chain, sequence numbers, transaction-safe via `tx` parameter). It is simply not called.

**Financial Impact:** Entity lifecycle changes are invisible in the audit trail. If an entity is archived to hide financial data, or if ownership percentages are modified to change consolidation calculations, there is no forensic trail. This is a SOC 2 compliance gap.

**Suggested Fix:** Every entity mutation must create an audit log entry. Example for `createEntity`:

```typescript
async createEntity(userId: string, data: { ... }) {
  const entity = await prisma.entity.create({ data: { ... } });

  await createAuditLog({
    tenantId: this.tenantId,
    userId,
    entityId: entity.id,
    model: 'Entity',
    recordId: entity.id,
    action: 'CREATE',
    after: {
      name: entity.name,
      type: entity.type,
      status: entity.status,
      country: entity.country,
    },
  });

  return entity;
}
```

For the new `archiveEntity()` and `upgradeEntity()` methods, the audit log is even more critical because these are financial state transitions that affect report scope.

---

### P1-3: Archival Pre-Check Is Under-Specified -- Missing Financial Record Enumeration

**Severity:** P1 (High -- incomplete archival validation risks orphaned financial data)
**File:** Plan Task 4 description

**Issue:** The plan states:

> `archiveEntity(id)` -- set status to `ARCHIVED`, validate no active financial data before archiving

And the edge cases section says:

> "Archive entity with active bank accounts" -- Block with message: "Settle or transfer X active accounts before archiving"

This is incomplete. The Entity model has **22 direct child relations** (see schema lines 84-105). The archival check must enumerate ALL financial models, not just bank accounts. Here is the complete list of entity-scoped models that must be checked:

| Model | Check Required | Why |
|-------|---------------|-----|
| Account | `isActive: true` count | Active bank accounts have ongoing balances |
| Invoice | `status NOT IN (PAID, CANCELLED)` count | Unpaid invoices = outstanding AR |
| Bill | `status NOT IN (PAID, CANCELLED)` count | Unpaid bills = outstanding AP |
| Payment | N/A (payments are historical records) | No action needed |
| JournalEntry | `status: DRAFT` count | Unposted drafts should be resolved |
| CreditNote | Unallocated credit notes | Outstanding credits need resolution |
| BankConnection | `status: ACTIVE` count | Active bank feeds will continue importing |
| FiscalCalendar | `periods with status: OPEN` count | Open periods mean fiscal year not closed |
| Budget | Active budgets | Budgets reference entity for actuals |
| Goal | Active goals | Goals reference entity for tracking |

**Financial Impact:** Archiving an entity with open invoices means AR aging reports silently lose visibility into outstanding receivables. Archiving with active bank connections means bank feed imports continue into an archived entity. Archiving with open fiscal periods means the fiscal year cannot be properly closed.

**Suggested Fix:** The `archiveEntity()` service method must perform a comprehensive pre-check:

```typescript
async archiveEntity(id: string) {
  const entity = await this.getEntity(id);
  if (!entity) throw new Error('Entity not found');

  const blockers: string[] = [];

  const [activeAccounts, openInvoices, openBills, draftJEs, activeConnections, openPeriods] =
    await Promise.all([
      prisma.account.count({ where: { entityId: id, isActive: true, deletedAt: null } }),
      prisma.invoice.count({ where: { entityId: id, status: { notIn: ['PAID', 'CANCELLED'] }, deletedAt: null } }),
      prisma.bill.count({ where: { entityId: id, status: { notIn: ['PAID', 'CANCELLED'] }, deletedAt: null } }),
      prisma.journalEntry.count({ where: { entityId: id, status: 'DRAFT', deletedAt: null } }),
      prisma.bankConnection.count({ where: { entityId: id, status: 'ACTIVE' } }),
      prisma.fiscalPeriod.count({ where: { fiscalCalendar: { entityId: id }, status: 'OPEN' } }),
    ]);

  if (activeAccounts > 0) blockers.push(`${activeAccounts} active bank accounts`);
  if (openInvoices > 0) blockers.push(`${openInvoices} unpaid invoices`);
  if (openBills > 0) blockers.push(`${openBills} unpaid bills`);
  if (draftJEs > 0) blockers.push(`${draftJEs} draft journal entries`);
  if (activeConnections > 0) blockers.push(`${activeConnections} active bank connections`);
  if (openPeriods > 0) blockers.push(`${openPeriods} open fiscal periods`);

  if (blockers.length > 0) {
    throw new Error(`Cannot archive entity: ${blockers.join(', ')}`);
  }

  // Proceed with archival...
}
```

---

### P1-4: Pre-Registration Entity Can Create Full Financial Records Today

**Severity:** P1 (High -- no guard on financial operations for informal entities)
**File:** Multiple services

**Issue:** The plan introduces `PRE_REGISTRATION` status but does not address whether pre-registration entities should be allowed to:
1. Create GL accounts (Chart of Accounts seeding happens on entity creation)
2. Create and post journal entries
3. Create invoices and bills
4. Receive bank feed imports

Currently, every service that accepts `entityId` performs only a tenant ownership check, not a status check. After the migration adds the `status` field, nothing prevents a pre-registration entity from having full financial operations.

The plan's edge case section mentions:

> "Pre-registration on formal reports -- Show 'Informal' badge on reports"

This implies pre-registration entities CAN have financial data, but the boundary is unclear. If a pre-registration entity has posted journal entries and then gets "upgraded" to `ACTIVE`, those historical entries (created during the informal period) become part of the formal financial record with no distinction.

**Financial Impact:** The boundary between informal/exploratory financial data and formal financial data is undefined. Journal entries posted during pre-registration become indistinguishable from formal entries after upgrade. This creates an audit ambiguity -- an auditor cannot determine which transactions occurred before vs after formal entity registration.

**Suggested Fix:** Two options:

**Option A (Restrictive):** Block certain operations for `PRE_REGISTRATION` entities:
- Allow: Bank accounts, transactions (tracking only), categories
- Block: Journal entry posting, invoice creation, bill creation, fiscal calendar management
- On upgrade: Seed COA, allow posting

**Option B (Permissive with audit trail):** Allow all operations but mark the boundary:
- Store `upgradedAt` timestamp on Entity
- Reports can filter entries by `date >= entity.upgradedAt` for "formal" view
- All journal entries created before upgrade get tagged in `sourceDocument`

The plan must explicitly choose one approach and document it.

---

### P1-5: Relationship Hard Delete Violates Audit Trail Integrity

**Severity:** P1 (High -- financial relationship history is destroyed)
**File:** Plan Task 5 description

**Issue:** The plan states:

> `deleteRelationship(id)` -- hard delete (relationships are not financial records)

This is incorrect. Entity relationships with ownership percentages ARE financial records when they affect:
1. **Consolidation eliminations** -- The `ConsolidationElimination` model (schema line 821) references `fromEntityId` and `toEntityId`. Ownership percentage determines elimination amounts.
2. **Related-party disclosures** -- Tax filings require disclosure of related-party transactions. Deleting the relationship record destroys the evidence.
3. **Historical ownership changes** -- If ownership changes from 60% to 40%, the old relationship should be preserved for historical reporting, not deleted.

**Financial Impact:** Hard-deleting a relationship that was used in consolidation calculations makes it impossible to reconstruct why certain elimination journal entries exist. Deleting ownership history prevents accurate related-party disclosure for past tax periods.

**Suggested Fix:** Add `deletedAt DateTime?` to `EntityRelationship` and use soft delete:

```prisma
EntityRelationship {
  // ... existing fields ...
  deletedAt DateTime?
  effectiveFrom DateTime @default(now())
  effectiveTo   DateTime?  // Set when relationship changes or ends
}
```

For ownership percentage changes, create a new relationship record with `effectiveFrom` rather than updating the existing one. This preserves the full ownership history.

---

### P2-1: Dashboard `getInvoiceStats` Signature Mismatch (Existing Bug)

**Severity:** P2 (Medium -- silent parameter drop, pre-existing)
**File:** `apps/api/src/domains/overview/services/dashboard.service.ts:55`

**Issue:** The dashboard passes `entityId` as the second argument to `getInvoiceStats`:

```typescript
// dashboard.service.ts:55
getInvoiceStats({ tenantId: this.tenantId, userId: '', role: 'OWNER' }, entityId),
```

But `getInvoiceStats` does not accept a second parameter:

```typescript
// invoice.service.ts:185
export async function getInvoiceStats(ctx: TenantContext) {
```

The `entityId` argument is silently ignored by JavaScript. All invoice stats are aggregated across the entire tenant, even when a specific entity is selected on the dashboard.

**Financial Impact:** When a user selects a specific entity on the dashboard, the receivables section shows AR/AP from ALL entities, not the selected one. This is misleading but currently non-critical because most tenants have one entity. With the Entity Management Hub introducing multi-entity workflows, this becomes a significant UX and data accuracy issue.

**Suggested Fix:** Fix `getInvoiceStats` to accept and filter by `entityId`, matching the pattern used by `getBillStats`:

```typescript
export async function getInvoiceStats(ctx: TenantContext, entityId?: string) {
  const baseWhere = {
    entity: {
      tenantId: ctx.tenantId,
      ...(entityId && { id: entityId }),
    },
    deletedAt: null,
  };
  // ... use baseWhere in all three aggregates
}
```

---

### P2-2: Entity Model Lacks `deletedAt` -- Inconsistent With Soft Delete Convention

**Severity:** P2 (Medium -- architectural inconsistency)
**File:** `packages/db/prisma/schema.prisma:62-109`

**Issue:** The Entity model has no `deletedAt` field. The plan proposes using `status: ARCHIVED` instead of soft delete. While this is a reasonable design choice (Entity is a structural model, not a financial transaction), it creates an inconsistency:

1. Every other model that can be "removed" uses `deletedAt` (Accounts, Invoices, Bills, JournalEntries, etc.)
2. Queries that filter child records use `deletedAt: null` -- but entity archival uses `status: { not: 'ARCHIVED' }`
3. The `tenantScopedQuery` wrapper checks for `tenantId` in WHERE clauses but does not check for entity status filtering

**Financial Impact:** Low direct impact, but developers may forget to add `status` filters to entity queries because the codebase pattern is `deletedAt: null`. The inconsistency increases the risk of the P0-1 and P0-2 findings recurring in future code.

**Suggested Fix:** Add a comment in the schema clarifying the design decision. Consider adding a utility function `activeEntityFilter()` that returns the appropriate where clause:

```typescript
export function activeEntityFilter(tenantId: string, entityId?: string) {
  return {
    tenantId,
    status: 'ACTIVE' as const, // Or { not: 'ARCHIVED' as const }
    ...(entityId && { id: entityId }),
  };
}
```

---

### P2-3: No Transaction Wrapper on Entity Status Transitions

**Severity:** P2 (Medium -- non-atomic status changes)
**File:** Plan Task 4 (archiveEntity, upgradeEntity)

**Issue:** The plan's `archiveEntity()` and `upgradeEntity()` operations involve multiple steps:

For `archiveEntity`:
1. Validate no active financial data (multiple count queries)
2. Set entity status to `ARCHIVED`
3. (Should) Create audit log entry

For `upgradeEntity`:
1. Validate entity is `PRE_REGISTRATION`
2. Set entity status to `ACTIVE`
3. (Should) Seed COA if not already seeded
4. (Should) Create audit log entry

If steps 1 and 2 are not wrapped in a transaction, a race condition exists: between the validation check and the status update, new financial data could be created for the entity (e.g., an import batch completes).

**Financial Impact:** An entity could be archived while an import batch simultaneously creates new transactions. Those transactions would exist in an archived entity with no way to access them through normal UI flows.

**Suggested Fix:** Wrap validation + status change + audit log in a Prisma `$transaction`:

```typescript
async archiveEntity(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    // Lock the entity row
    const entity = await tx.entity.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!entity) throw new Error('Entity not found');
    if (entity.status === 'ARCHIVED') throw new Error('Entity already archived');

    // Validate no active financial data (within transaction)
    const activeAccounts = await tx.account.count({
      where: { entityId: id, isActive: true, deletedAt: null },
    });
    // ... other checks ...

    // Update status
    const updated = await tx.entity.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    // Audit log (transaction-safe)
    await createAuditLog({
      tenantId: this.tenantId,
      userId,
      entityId: id,
      model: 'Entity',
      recordId: id,
      action: 'UPDATE',
      before: { status: entity.status },
      after: { status: 'ARCHIVED' },
    }, tx);

    return updated;
  });
}
```

---

## Entity-Scoped Model Analysis

The following 22 models have a direct `entityId` foreign key to Entity. Each must be evaluated for entity-status-based guards after the `EntityStatus` enum is introduced:

| # | Model | entityId Required | Needs Status Guard | Rationale |
|---|-------|-------------------|-------------------|-----------|
| 1 | GLAccount | Yes | Yes (reports) | GL accounts for archived entities should not appear in active COA views |
| 2 | JournalEntry | Yes | Yes (reports) | Must be excluded from consolidated reports for archived entities |
| 3 | Account (Bank) | Yes (nullable) | Yes (dashboard) | Active bank accounts on archived entities inflate net worth |
| 4 | FiscalCalendar | Yes | No | Historical, read-only reference |
| 5 | Client | Yes | Yes (AR) | Clients of archived entities should not appear in active client lists |
| 6 | Invoice | Yes | Yes (AR/dashboard) | Open invoices on archived entities inflate AR metrics |
| 7 | InvoiceLine | via Invoice | Inherited | Follows Invoice entity scope |
| 8 | Vendor | Yes | Yes (AP) | Vendors of archived entities should not appear in active vendor lists |
| 9 | Bill | Yes | Yes (AP/dashboard) | Open bills on archived entities inflate AP metrics |
| 10 | BillLine | via Bill | Inherited | Follows Bill entity scope |
| 11 | Payment | Yes | No | Historical records, soft-deleted, read-only |
| 12 | CreditNote | Yes | Yes | Unallocated credit notes need resolution before archival |
| 13 | BankConnection | Yes | Yes (archival) | Active connections must be disconnected before archival |
| 14 | Transaction | via Account | Inherited | Follows Account entity scope |
| 15 | Budget | Yes | Yes (planning) | Budgets for archived entities should be deactivated |
| 16 | Goal | Yes | Yes (planning) | Goals for archived entities should be closed |
| 17 | Insight | Yes | No | Historical AI insights, informational |
| 18 | Rule | Yes | Yes | Auto-categorization rules for archived entities should be disabled |
| 19 | TaxRate | Yes | No | Reference data, historical |
| 20 | ImportBatch | Yes | Yes (archival) | In-progress imports must complete before archival |
| 21 | Project | Yes | No | Projects are reference data |
| 22 | AccountingPolicy | Yes (nullable) | No | Configuration, historical reference |

**Critical subset requiring immediate guards (P0/P1):** GLAccount, JournalEntry, Account, Invoice, Bill, Client, Vendor, BankConnection

---

## Archival Impact Analysis

Before archiving an entity, the following must be verified. Items are ordered by financial severity:

### Must Block Archival (Blocker)

1. **Unpaid Invoices** -- `Invoice.status NOT IN ('PAID', 'CANCELLED') AND deletedAt IS NULL`
   - These represent outstanding Accounts Receivable. Archiving hides them from AR aging.
   - Resolution: Pay, cancel, or write off all invoices.

2. **Unpaid Bills** -- `Bill.status NOT IN ('PAID', 'CANCELLED') AND deletedAt IS NULL`
   - These represent outstanding Accounts Payable. Archiving hides them from AP aging.
   - Resolution: Pay or cancel all bills.

3. **Active Bank Accounts** -- `Account.isActive = true AND deletedAt IS NULL`
   - Active accounts have balances that affect net worth calculations.
   - Resolution: Deactivate or transfer accounts.

4. **Active Bank Connections** -- `BankConnection.status = 'ACTIVE'`
   - Active connections will continue importing transactions into an archived entity.
   - Resolution: Disconnect all bank feeds.

5. **Draft Journal Entries** -- `JournalEntry.status = 'DRAFT' AND deletedAt IS NULL`
   - Unposted entries indicate incomplete accounting work.
   - Resolution: Post or delete draft entries.

6. **Open Fiscal Periods** -- `FiscalPeriod.status = 'OPEN'` via `FiscalCalendar.entityId`
   - Open periods mean the fiscal year has not been closed. Archiving bypasses period-end controls.
   - Resolution: Close all fiscal periods.

7. **In-Progress Import Batches** -- `ImportBatch.status = 'PROCESSING'`
   - Active imports will create new records in an archived entity.
   - Resolution: Wait for imports to complete.

### Should Warn (Non-Blocking)

8. **Unallocated Credit Notes** -- `CreditNote` with remaining balance > 0
   - Outstanding credits that could be applied to future invoices.
   - Warning: "X credit notes with $Y total unallocated balance will become inaccessible."

9. **Active Goals** -- `Goal.status = 'ACTIVE'`
   - Goals will no longer track against entity data.
   - Warning: "X active goals will be suspended."

10. **Active Budgets** -- `Budget` with current period overlap
    - Budget vs. actual comparisons will stop working.
    - Warning: "X active budgets will become inactive."

11. **Active Auto-Categorization Rules** -- `Rule.isActive = true` (if applicable)
    - Rules referencing this entity's categories will stop matching.
    - Warning: "X categorization rules will be deactivated."

### Must Record (Audit)

12. **Entity Financial Summary at Archival** -- Total assets, total liabilities, total equity, AR, AP
    - Capture a financial snapshot in the audit log `after` field for future reference.
    - This allows reconstructing the entity's financial position at time of archival.

13. **ConsolidationElimination Records** -- Any elimination entries referencing this entity
    - These are historical and should not be modified, but should be flagged.
    - Warning: "X consolidation eliminations reference this entity."

---

## Recommendations

### Immediate (Must address before implementation)

1. **Add entity status filter to `getEntityIds()` in report.service.ts** -- P0-2. This is the single most impactful change. Every consolidated report inherits this filter.

2. **Add entity status filter to dashboard.service.ts queries** -- P0-1. Dashboard is the most-viewed page. Pre-registration entity balances must not inflate net worth.

3. **Fix `getInvoiceStats` signature** to accept `entityId` -- P0-3. This is a pre-existing bug that will worsen with multi-entity support.

4. **Change `ownershipPercent Float?` to `ownershipBasisPoints Int?`** -- P1-1. Prevents float arithmetic errors in ownership validation and future consolidation calculations.

5. **Add `createAuditLog` calls to all EntityService methods** -- P1-2. Entity is the root of the financial hierarchy. Every mutation must be auditable.

### Before Sprint 2 (Backend API)

6. **Define pre-registration entity financial boundaries** -- P1-4. The plan must explicitly state which financial operations are allowed for pre-registration entities. Document this in the plan under a new "Financial Boundaries by Status" section.

7. **Use soft delete for EntityRelationship** (or at minimum `effectiveFrom`/`effectiveTo` dates) -- P1-5. Ownership history is needed for consolidation audit trails and related-party disclosures.

8. **Wrap archiveEntity/upgradeEntity in `$transaction`** -- P2-3. Status transitions must be atomic with their validation checks and audit logs.

### Before Sprint 6 (Dashboard Cleanup)

9. **Comprehensive archival pre-check** -- P1-3. Implement the full enumeration of entity-scoped models as described in the Archival Impact Analysis section, not just bank accounts.

10. **Create `activeEntityFilter()` utility** -- P2-2. Standardize the entity status filter pattern to prevent inconsistent filtering across services.

### Testing Requirements

11. **Financial invariant test: Entity status on dashboard metrics** -- Create a test that seeds a pre-registration entity with bank accounts and verifies dashboard metrics exclude it.

12. **Financial invariant test: Entity status on consolidated reports** -- Create a test that seeds an archived entity with posted journal entries and verifies P&L/Balance Sheet exclude it.

13. **Ownership validation test: Float edge cases** -- If `Float` is kept (not recommended), test `33.33 + 33.33 + 33.34 <= 100` explicitly to document the precision behavior.

14. **Audit trail test: Entity lifecycle** -- Verify that create -> update -> archive -> (attempted restore) all produce audit log entries with correct before/after snapshots.

---

## Approval Status

- **Status:** CHANGES REQUIRED
- **Financial Accuracy:** AT RISK

The plan introduces entity status management that directly affects every financial aggregation path in the system (dashboard, reports, AR/AP metrics). The plan correctly identifies the archival edge case for bank accounts but under-specifies the full scope of impact. Three P0 findings (dashboard inflation, report contamination, invoice stats signature mismatch) must be addressed before implementation begins. The `ownershipPercent Float?` proposal violates the project's integer-arithmetic-for-financial-data invariant and should use basis points instead.

The audit infrastructure is robust and ready to use -- it simply needs to be wired into the entity service. The financial impact of this plan is significant because Entity is the root node of the entire financial model hierarchy, and status changes cascade through every downstream model.
