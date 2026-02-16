# Planning System Upgrade — Agent Performance & Review Integration

**Date:** 2026-02-16
**Context:** Phase 5 review generated 57 findings. This plan upgrades the planning system to catch issues during planning instead of post-planning.
**Goal:** Reduce P0 findings from 7 → 0-1 (86% reduction), total findings from 57 → 15-20 (65% reduction)
**Effort:** 6-8 hours
**Risk:** LOW (documentation and template updates, no code changes)

---

## Success Criteria

### Quantitative
- [ ] Planning template has Security/Performance/Cross-Domain sections
- [ ] 3 pre-flight checklists created (raw SQL, cache design, multi-entity ops)
- [ ] MEMORY.md updated with 3 new patterns
- [ ] Rule files document tenant isolation and cache design
- [ ] `/processes:plan` workflow updated to integrate reviews

### Qualitative
- [ ] Next planning session uses new template
- [ ] Agents catch issues during planning (not post-planning)
- [ ] Pre-flight checklists prevent high-risk patterns without safety nets
- [ ] MEMORY patterns speed up similar implementations

---

## Sprint 1: Planning Template Upgrade (2 hours)

### Task 1.1: Create Enhanced Planning Template

**Objective:** Add mandatory Security/Performance/Cross-Domain sections to prevent blind spots

**File:** `docs/templates/implementation-plan-v2.md`

**New Sections to Add:**

```markdown
## Security Considerations

**Checklist (complete before finalizing plan):**
- [ ] Tenant isolation verified in all queries (tenantId filter or entity: { tenantId })
- [ ] Raw SQL uses tenantScopedQuery wrapper (or documented exemption)
- [ ] Permission checks mapped to RBAC matrix (resource:action → roles)
- [ ] Rate limiting requirements identified (endpoints + limits per role)
- [ ] Input validation patterns specified (Zod schemas defined)
- [ ] Sensitive data handling documented (PII, credentials, tokens)
- [ ] Cross-tenant access tests planned (verify isolation works)

**Threat Model:**
- **Data leakage:** [Describe cross-tenant risks]
- **Privilege escalation:** [Describe permission bypass risks]
- **DoS vectors:** [Describe resource exhaustion risks]

**Mitigations:**
- [List specific security controls]

---

## Performance Considerations

**Checklist (complete before finalizing plan):**
- [ ] Database indexes identified for new queries
- [ ] Query patterns analyzed for N+1 issues
- [ ] Cache design specified (type, bounds, TTL, eviction)
- [ ] Large data set handling strategy (pagination, streaming, limits)
- [ ] Resource limits defined (memory, timeout, payload size)
- [ ] Load testing criteria specified (expected concurrency, p95 latency)

**Query Analysis:**
| Query Pattern | Estimated Rows | Index Required | N+1 Risk |
|--------------|----------------|----------------|----------|
| [Example: JournalEntry by entityId] | 10K-100K | (entityId, postedAt) | Low |

**Cache Design:**
- **Type:** In-memory Map / Redis / None
- **Max entries:** [Number]
- **TTL:** [Duration]
- **Eviction:** Active sweep / LRU / TTL-based
- **Invalidation triggers:** [Events that clear cache]

**Resource Limits:**
- API timeout: [Duration]
- Max payload size: [Size]
- Memory limit per request: [Size]

---

## Cross-Domain Impact Analysis

**Domains Affected:**
| Domain | Data Used | Permission Required | Integration Risk |
|--------|-----------|---------------------|------------------|
| [Example: Banking] | Account balances | banking:read | Low |

**Service Dependencies:**
- **Calls made TO other domains:** [List service methods called]
- **Calls made FROM other domains:** [List service methods exposed]

**Permission Matrix Updates:**
| Resource | Action | VIEWER | ACCOUNTANT | ADMIN | OWNER |
|----------|--------|--------|------------|-------|-------|
| [Example: reports:p-and-l] | read | ✅ | ✅ | ✅ | ✅ |

**Integration Tests Required:**
- [ ] Cross-domain data flow test
- [ ] Permission boundary test
- [ ] Transaction rollback test (if multi-domain transaction)

---

## Edge Cases (per task)

**For EVERY data field used in calculations:**
- [ ] Is it nullable? What's the fallback?
- [ ] Can it differ across entities in consolidation?
- [ ] What happens if 0, NULL, or empty string?

**For EVERY multi-entity operation:**
- [ ] Can entities have different currencies?
- [ ] Can entities have different fiscal years?
- [ ] What if user has 1 entity vs 50 entities?

**For EVERY cache/queue design:**
- [ ] What's the max size?
- [ ] How are stale entries removed?
- [ ] Can keys collide across tenants?

**Task-Specific Edge Cases:**
[Listed per task in task breakdown section]

---

## Infrastructure Requirements

### Database
- [ ] Indexes identified for new query patterns
- [ ] Migration strategy defined (online vs offline, estimated duration)
- [ ] Index size estimated (check disk space)

**Indexes Required:**
```sql
-- Example
CREATE INDEX CONCURRENTLY idx_journal_entry_entity_posted
  ON "JournalEntry"(entityId, postedAt)
  WHERE deletedAt IS NULL;
```

### RBAC
- [ ] New permissions added to matrix
- [ ] Permission checks mapped to endpoints
- [ ] Role hierarchy verified

### Caching
- [ ] Cache design specified
- [ ] Max size and eviction strategy defined
- [ ] TTL and invalidation triggers identified

### Rate Limiting
- [ ] Endpoints requiring rate limiting identified
- [ ] Limits defined per role

**Rate Limits:**
- `/api/path`: X req/min per user (VIEWER/ACCOUNTANT)
- `/api/path`: Y req/min per tenant (ADMIN/OWNER only)
```

**Task Breakdown:**
1. Copy existing template → v2
2. Add sections above
3. Update task template to include "Edge Cases" subsection
4. Add "Infrastructure Requirements" section
5. Update examples with Akount-specific patterns

**Validation:**
- Next plan uses v2 template
- All mandatory checklists are filled out before review

**Time:** 1.5 hours

---

### Task 1.2: Update `/processes:plan` Workflow

**Objective:** Integrate security/performance review DURING planning

**File:** `.claude/skills/processes-plan.md`

**Changes:**

```markdown
## Process (UPDATED)

### Step 1-3: [Existing brainstorm, research, task breakdown]
[Keep as-is]

### Step 4: Initial Security Review (NEW)
**After writing functional spec, BEFORE finalizing tasks:**

1. Run security agent on draft plan:
   ```
   Task tool with subagent_type="security-sentinel"
   Prompt: "Review this draft plan for security issues:
   - Tenant isolation gaps
   - Permission boundary issues
   - Input validation gaps
   - Rate limiting requirements
   [Paste draft plan sections 1-3]"
   ```

2. Integrate findings into task breakdown:
   - P0 findings: Add new tasks to Sprint 0
   - P1 findings: Update existing tasks with security controls
   - Document in "Security Considerations" section

### Step 5: Performance Review (NEW)
**After writing data access patterns, BEFORE finalizing estimates:**

1. Run performance agent on draft plan:
   ```
   Task tool with subagent_type="performance-oracle"
   Prompt: "Review this draft plan for performance issues:
   - Missing indexes
   - N+1 query patterns
   - Cache design gaps
   - Resource limit issues
   [Paste draft plan sections 3-4]"
   ```

2. Integrate findings:
   - Add index creation to Sprint 0 or Task 1
   - Update query patterns with pagination
   - Specify cache bounds and eviction

### Step 6: Write Final Plan (UPDATED)
[Include integrated security/performance fixes]

### Step 7: Final Review (UPDATED)
Run full multi-agent review to catch remaining issues (should be <20 findings vs 57)
```

**Time:** 0.5 hours

---

## Sprint 2: Pre-Flight Checklists (2 hours)

### Task 2.1: Raw SQL Checklist

**File:** `.claude/rules/raw-sql-checklist.md`

```markdown
# Raw SQL Pre-Flight Checklist

---
paths:
- "apps/api/**"
---

## Before Using prisma.$queryRaw

This checklist MUST be completed before any raw SQL is written in implementation.

### Mandatory Checks
- [ ] **Tenant isolation:** WHERE clause includes tenantId filter
- [ ] **Wrapper usage:** Use `tenantScopedQuery()` wrapper (validates tenantId presence)
- [ ] **Type safety:** TypeScript interface defined for result rows
- [ ] **Soft delete:** Filter `deletedAt IS NULL` for financial records
- [ ] **SQL injection:** Use parameterized queries (`Prisma.sql\`...\``, NOT string concatenation)
- [ ] **Cross-tenant test:** Add test verifying other tenant's data not returned

### tenantScopedQuery Wrapper Pattern

**ALWAYS use this wrapper for raw SQL:**

```typescript
// lib/tenant-scoped-query.ts
import { Prisma, PrismaClient } from '@akount/db';

export async function tenantScopedQuery<T>(
  prisma: PrismaClient,
  tenantId: string,
  queryBuilder: (tenantId: string) => Prisma.Sql
): Promise<T[]> {
  // Validation
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('tenantId required for raw SQL queries');
  }

  // Build query
  const sql = queryBuilder(tenantId);

  // Safety check: Verify query references tenantId
  const sqlString = sql.strings.join('');
  if (!sqlString.includes('tenantId') && !sqlString.includes('tenant_id')) {
    throw new Error(
      'Raw SQL query does not reference tenantId - tenant isolation not enforced'
    );
  }

  // Execute
  return prisma.$queryRaw<T[]>(sql);
}
```

**Usage Example:**

```typescript
// ✅ CORRECT - Using wrapper
interface BalanceRow {
  accountId: string;
  accountName: string;
  totalDebit: bigint;
  totalCredit: bigint;
}

const balances = await tenantScopedQuery<BalanceRow>(
  prisma,
  ctx.tenantId,
  (tenantId) => Prisma.sql`
    SELECT
      ga.id as "accountId",
      ga.name as "accountName",
      COALESCE(SUM(jl."debitAmount"), 0) as "totalDebit",
      COALESCE(SUM(jl."creditAmount"), 0) as "totalCredit"
    FROM "GLAccount" ga
    LEFT JOIN "JournalLine" jl ON jl."glAccountId" = ga.id
    LEFT JOIN "JournalEntry" je ON je.id = jl."journalEntryId"
    WHERE ga."entityId" IN (
      SELECT id FROM "Entity" WHERE "tenantId" = ${tenantId}
    )
      AND je."deletedAt" IS NULL
      AND jl."deletedAt" IS NULL
    GROUP BY ga.id, ga.name
  `
);

// Handle BigInt from PostgreSQL SUM()
const formatted = balances.map(row => ({
  ...row,
  totalDebit: Number(row.totalDebit),
  totalCredit: Number(row.totalCredit)
}));
```

**❌ WRONG - Direct $queryRaw**

```typescript
// Missing wrapper, no safety net
const results = await prisma.$queryRaw`
  SELECT * FROM "GLAccount"
  WHERE "entityId" = ${entityId}
`;
// If entityId is from wrong tenant, data leak!
```

### When Raw SQL is Justified

**Use raw SQL ONLY when:**
- Complex aggregations not supported by Prisma (SUM over joins)
- Performance-critical queries (avoid N+1 with custom join)
- Recursive CTEs (org charts, account hierarchies)
- Window functions (running totals, rankings)

**DO NOT use raw SQL for:**
- Simple CRUD (use Prisma's type-safe API)
- Single-table queries
- Queries that can be expressed with Prisma's include/select

### Testing Requirements

Every raw SQL query MUST have:

1. **Happy path test:**
   ```typescript
   it('should return account balances for tenant', async () => {
     const balances = await getAccountBalances(TENANT_ID);
     expect(balances).toHaveLength(6); // Default COA
     expect(balances[0].totalDebit).toBeGreaterThanOrEqual(0);
   });
   ```

2. **Cross-tenant isolation test:**
   ```typescript
   it('should not return balances from other tenant', async () => {
     // Create account for tenant A
     await createAccount({ tenantId: TENANT_A_ID, name: 'Account A' });

     // Query as tenant B
     const balances = await getAccountBalances(TENANT_B_ID);

     // Should NOT include tenant A's account
     expect(balances.find(b => b.accountName === 'Account A')).toBeUndefined();
   });
   ```

3. **Soft delete test:**
   ```typescript
   it('should exclude deleted journal entries', async () => {
     const je = await createJournalEntry({ ... });
     await softDeleteJournalEntry(je.id);

     const balances = await getAccountBalances(TENANT_ID);

     // Deleted entry should not affect balance
     expect(balances[0].totalDebit).toBe(0);
   });
   ```

---

**When in doubt, ask:** "Can this be done with Prisma's query API?" If yes, use Prisma. If no, use tenantScopedQuery wrapper.
```

**Time:** 1 hour

---

### Task 2.2: Cache Design Checklist

**File:** `.claude/rules/cache-design-checklist.md`

```markdown
# Cache Design Pre-Flight Checklist

---
paths:
- "apps/api/**"
- "apps/web/**"
---

## Before Implementing Any Cache

This checklist MUST be completed before adding in-memory caches, Redis, or localStorage.

### Mandatory Design Decisions
- [ ] **Type:** In-memory Map / Redis / localStorage / HTTP cache
- [ ] **Max entries:** Specify upper bound (prevent unbounded growth)
- [ ] **TTL:** Time-to-live duration
- [ ] **Eviction:** Active sweep / LRU / TTL-based / Size-based
- [ ] **Invalidation triggers:** Events that clear cache entries
- [ ] **Key collision prevention:** Namespace keys by tenantId
- [ ] **Serialization:** How are values stored (JSON, native, MessagePack)?

### Bounded Cache Pattern (In-Memory)

**ALWAYS set a max size:**

```typescript
// lib/bounded-cache.ts
export class BoundedCache<T> {
  private readonly cache = new Map<string, { data: T; expiry: number }>();
  private readonly MAX_ENTRIES: number;
  private readonly TTL_MS: number;
  private cleanupTimer: NodeJS.Timeout;

  constructor(maxEntries = 500, ttlMs = 5 * 60 * 1000) {
    this.MAX_ENTRIES = maxEntries;
    this.TTL_MS = ttlMs;

    // Active sweep every 60s
    this.cleanupTimer = setInterval(() => this.sweep(), 60_000);
    this.cleanupTimer.unref(); // Don't block process exit
  }

  set(tenantId: string, key: string, data: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Namespace key by tenantId (prevent collision)
    const fullKey = `${tenantId}:${key}`;
    this.cache.set(fullKey, {
      data,
      expiry: Date.now() + this.TTL_MS
    });
  }

  get(tenantId: string, key: string): T | null {
    const fullKey = `${tenantId}:${key}`;
    const entry = this.cache.get(fullKey);

    if (!entry) return null;

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.data;
  }

  invalidate(tenantId: string, key: string): void {
    const fullKey = `${tenantId}:${key}`;
    this.cache.delete(fullKey);
  }

  invalidateTenant(tenantId: string): void {
    const prefix = `${tenantId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.cache.clear();
  }
}
```

**Usage Example:**

```typescript
// services/report-cache.service.ts
const reportCache = new BoundedCache<unknown>(500, 5 * 60 * 1000); // 500 entries, 5min TTL

export async function getCachedReport(
  tenantId: string,
  reportType: string,
  params: Record<string, string>
): Promise<unknown | null> {
  const cacheKey = `${reportType}:${JSON.stringify(params)}`;
  return reportCache.get(tenantId, cacheKey);
}

export async function setCachedReport(
  tenantId: string,
  reportType: string,
  params: Record<string, string>,
  data: unknown
): Promise<void> {
  const cacheKey = `${reportType}:${JSON.stringify(params)}`;
  reportCache.set(tenantId, cacheKey, data);
}

// Invalidation example
export async function invalidateReportsForEntity(tenantId: string, entityId: string): Promise<void> {
  // Clear all reports for this entity
  reportCache.invalidate(tenantId, `p-and-l:{"entityId":"${entityId}"}`);
  reportCache.invalidate(tenantId, `balance-sheet:{"entityId":"${entityId}"}`);
}
```

### Common Cache Anti-Patterns

**❌ Unbounded growth:**
```typescript
const cache = new Map(); // NO MAX SIZE = MEMORY LEAK
```

**❌ No TTL:**
```typescript
cache.set(key, data); // Stale data lives forever
```

**❌ No tenant namespace:**
```typescript
cache.set(entityId, data); // Tenant A can read tenant B's data if entityId collides
```

**❌ No invalidation:**
```typescript
// User updates entity, cache still has old data
await updateEntity(...);
// Cache not cleared - user sees stale data for 5 minutes
```

### When to Use Each Cache Type

| Type | Use Case | Max Size | Invalidation |
|------|----------|----------|--------------|
| In-memory Map | API responses, computed reports | 500-1000 entries | Event-based |
| Redis | Shared across instances, large datasets | 10K+ entries | Pub/sub or TTL |
| localStorage | Frontend resume state, UI preferences | 5-10 MB | Manual or version-based |
| HTTP cache | Static assets, CDN | N/A | Cache-Control headers |

### Testing Requirements

1. **Bounded size test:**
   ```typescript
   it('should evict oldest entry when at capacity', async () => {
     const cache = new BoundedCache<string>(3, 60000);
     cache.set('tenant1', 'key1', 'value1');
     cache.set('tenant1', 'key2', 'value2');
     cache.set('tenant1', 'key3', 'value3');
     cache.set('tenant1', 'key4', 'value4'); // Evicts key1

     expect(cache.get('tenant1', 'key1')).toBeNull();
     expect(cache.get('tenant1', 'key4')).toBe('value4');
   });
   ```

2. **TTL expiry test:**
   ```typescript
   it('should expire entries after TTL', async () => {
     const cache = new BoundedCache<string>(10, 100); // 100ms TTL
     cache.set('tenant1', 'key1', 'value1');

     expect(cache.get('tenant1', 'key1')).toBe('value1');

     await new Promise(r => setTimeout(r, 150)); // Wait for expiry

     expect(cache.get('tenant1', 'key1')).toBeNull();
   });
   ```

3. **Tenant isolation test:**
   ```typescript
   it('should isolate cache by tenant', async () => {
     cache.set('tenant-a', 'report', { data: 'A' });
     cache.set('tenant-b', 'report', { data: 'B' });

     expect(cache.get('tenant-a', 'report')).toEqual({ data: 'A' });
     expect(cache.get('tenant-b', 'report')).toEqual({ data: 'B' });
   });
   ```

4. **Invalidation test:**
   ```typescript
   it('should invalidate on entity update', async () => {
     cache.set('tenant1', 'p-and-l:entityA', { revenue: 1000 });

     await updateEntity('entityA', { name: 'New Name' });
     await invalidateReportsForEntity('tenant1', 'entityA');

     expect(cache.get('tenant1', 'p-and-l:entityA')).toBeNull();
   });
   ```

---

**Rule of thumb:** If you're not setting a max size and TTL, you're creating a memory leak.
```

**Time:** 1 hour

---

### Task 2.3: Multi-Entity Operation Checklist

**File:** `.claude/rules/multi-entity-checklist.md`

```markdown
# Multi-Entity Operation Pre-Flight Checklist

---
paths:
- "apps/api/src/domains/**"
---

## Before Implementing Multi-Entity Features

Features that aggregate data across multiple entities (consolidation reports, tenant-wide metrics) require special attention to currency, fiscal periods, and ownership.

### Mandatory Checks
- [ ] **Currency validation:** All entities use same baseCurrency (or explicitly handle conversion)
- [ ] **Fiscal year alignment:** Handle entities with different fiscal year starts
- [ ] **Ownership verification:** User has access to ALL entities in aggregation
- [ ] **Nullable fields:** baseCurrency fields fallback to currency amounts
- [ ] **Scale considerations:** Test with 1 entity AND 50 entities
- [ ] **Query performance:** Use indexes for multi-entity joins

### Currency Consolidation Pattern

**ALWAYS validate currency compatibility:**

```typescript
// services/consolidation.service.ts
interface ConsolidationContext {
  tenantId: string;
  entityIds: string[];
  validateCurrency: boolean;
}

export async function validateConsolidationCurrency(
  prisma: PrismaClient,
  ctx: ConsolidationContext
): Promise<void> {
  const entities = await prisma.entity.findMany({
    where: {
      id: { in: ctx.entityIds },
      tenantId: ctx.tenantId
    },
    select: { id: true, name: true, baseCurrency: true, functionalCurrency: true }
  });

  // Check: User owns all requested entities
  if (entities.length !== ctx.entityIds.length) {
    const foundIds = entities.map(e => e.id);
    const missingIds = ctx.entityIds.filter(id => !foundIds.includes(id));
    throw new ForbiddenError(
      `User does not have access to entities: ${missingIds.join(', ')}`
    );
  }

  if (!ctx.validateCurrency) return;

  // Check: All entities have same functional currency
  const currencies = new Set(entities.map(e => e.functionalCurrency));
  if (currencies.size > 1) {
    throw new BadRequestError(
      `Cannot consolidate entities with different functional currencies: ${Array.from(currencies).join(', ')}. ` +
      `Multi-currency consolidation requires FX rate table (not yet implemented).`
    );
  }

  // Check: All entities have baseCurrency set (if using multi-currency)
  const hasBaseCurrency = entities.every(e => e.baseCurrency !== null);
  const hasNoBaseCurrency = entities.every(e => e.baseCurrency === null);

  if (!hasBaseCurrency && !hasNoBaseCurrency) {
    throw new BadRequestError(
      `Consolidation includes mix of single-currency and multi-currency entities. ` +
      `All entities must use same currency model.`
    );
  }
}
```

### COALESCE Pattern for Nullable baseCurrency

**Use COALESCE to handle single-currency entities:**

```typescript
// Single-currency entities: baseCurrencyDebit is NULL, use debitAmount
// Multi-currency entities: baseCurrencyDebit has converted value
const query = Prisma.sql`
  SELECT
    ga.id,
    ga.name,
    COALESCE(SUM(jl."baseCurrencyDebit"), SUM(jl."debitAmount"), 0) as "totalDebit",
    COALESCE(SUM(jl."baseCurrencyCredit"), SUM(jl."creditAmount"), 0) as "totalCredit"
  FROM "GLAccount" ga
  LEFT JOIN "JournalLine" jl ON jl."glAccountId" = ga.id
  WHERE ga."entityId" IN (${Prisma.join(entityIds)})
  GROUP BY ga.id, ga.name
`;

// COALESCE fallback order:
// 1. baseCurrencyDebit (if multi-currency entity)
// 2. debitAmount (if single-currency entity)
// 3. 0 (if no journal lines)
```

### Fiscal Year Handling

**Different entities can have different fiscal years:**

```typescript
interface FiscalYearContext {
  entityId: string;
  fiscalYearStart: Date; // e.g., 2024-01-01 or 2024-07-01
  fiscalYearEnd: Date;
}

export async function getEntityFiscalContext(
  prisma: PrismaClient,
  entityId: string,
  asOfDate: Date
): Promise<FiscalYearContext> {
  const entity = await prisma.entity.findUniqueOrThrow({
    where: { id: entityId },
    select: { fiscalYearStart: true }
  });

  if (!entity.fiscalYearStart) {
    throw new Error(
      `Entity ${entityId} has no fiscal year start date. ` +
      `This must be set during entity creation.`
    );
  }

  // Calculate fiscal year containing asOfDate
  const year = asOfDate.getFullYear();
  const month = entity.fiscalYearStart.getMonth();
  const day = entity.fiscalYearStart.getDate();

  let fiscalYearStart = new Date(year, month, day);
  if (asOfDate < fiscalYearStart) {
    fiscalYearStart = new Date(year - 1, month, day);
  }

  const fiscalYearEnd = new Date(
    fiscalYearStart.getFullYear() + 1,
    fiscalYearStart.getMonth(),
    fiscalYearStart.getDate() - 1
  );

  return { entityId, fiscalYearStart, fiscalYearEnd };
}

// Usage: Compute P&L for each entity's own fiscal year
const contexts = await Promise.all(
  entityIds.map(id => getEntityFiscalContext(prisma, id, asOfDate))
);

for (const ctx of contexts) {
  const pnl = await computePnL(ctx.entityId, ctx.fiscalYearStart, asOfDate);
  // Aggregate...
}
```

### Ownership Verification Pattern

**ALWAYS verify user owns ALL entities:**

```typescript
export async function verifyEntityOwnership(
  prisma: PrismaClient,
  tenantId: string,
  entityIds: string[]
): Promise<void> {
  const count = await prisma.entity.count({
    where: {
      id: { in: entityIds },
      tenantId
    }
  });

  if (count !== entityIds.length) {
    throw new ForbiddenError(
      `User does not have access to all requested entities. ` +
      `Requested: ${entityIds.length}, Found: ${count}`
    );
  }
}

// Call before ANY multi-entity aggregation
await verifyEntityOwnership(prisma, request.tenantId, entityIds);
const report = await generateConsolidatedReport(entityIds);
```

### Scale Testing Requirements

**Test with 1, 10, and 50 entities:**

```typescript
describe('Multi-entity consolidation', () => {
  it('should work with single entity', async () => {
    const report = await getConsolidatedPnL(tenantId, [entityA.id]);
    expect(report.revenue).toBe(10000);
  });

  it('should work with 10 entities', async () => {
    const entityIds = await createTestEntities(tenantId, 10);
    const report = await getConsolidatedPnL(tenantId, entityIds);
    expect(report.revenue).toBeGreaterThan(0);
  });

  it('should work with 50 entities', async () => {
    const entityIds = await createTestEntities(tenantId, 50);
    const start = Date.now();
    const report = await getConsolidatedPnL(tenantId, entityIds);
    const duration = Date.now() - start;

    expect(report.revenue).toBeGreaterThan(0);
    expect(duration).toBeLessThan(5000); // <5s for 50 entities
  });

  it('should reject mismatched currencies', async () => {
    const entityUSD = await createEntity({ functionalCurrency: 'USD' });
    const entityCAD = await createEntity({ functionalCurrency: 'CAD' });

    await expect(
      getConsolidatedPnL(tenantId, [entityUSD.id, entityCAD.id])
    ).rejects.toThrow('different functional currencies');
  });
});
```

---

**Default behavior:** Validate currency compatibility. Use `validateCurrency: false` ONLY if explicitly handling FX conversion.
```

**Time:** 1 hour (including examples)

---

## Sprint 3: MEMORY & Rule Updates (1.5 hours)

### Task 3.1: Update MEMORY with New Patterns

**File:** `memory/api-patterns.md`

**Additions:**

```markdown
## Tenant-Scoped Raw SQL Pattern

**When:** Using prisma.$queryRaw for complex aggregations

**Pattern:**

```typescript
import { tenantScopedQuery } from '@/lib/tenant-scoped-query';

const results = await tenantScopedQuery<ResultType>(
  prisma,
  ctx.tenantId,
  (tenantId) => Prisma.sql`
    SELECT ...
    FROM ...
    WHERE ... AND entity."tenantId" = ${tenantId}
  `
);
```

**Key Points:**
- Wrapper validates tenantId is referenced in SQL
- Returns typed results (no `any`)
- Throws if tenantId missing from query string
- See `.claude/rules/raw-sql-checklist.md` for full pattern

---

## COALESCE Pattern for baseCurrency Fields

**When:** Aggregating across single-currency and multi-currency entities

**Pattern:**

```sql
SELECT
  COALESCE(SUM(jl."baseCurrencyDebit"), SUM(jl."debitAmount"), 0) as "totalDebit",
  COALESCE(SUM(jl."baseCurrencyCredit"), SUM(jl."creditAmount"), 0) as "totalCredit"
FROM "JournalLine" jl
```

**Fallback order:**
1. baseCurrencyDebit (if foreign currency transaction)
2. debitAmount (if domestic transaction, baseCurrency is NULL)
3. 0 (if no records)

**Key Points:**
- baseCurrency fields are nullable (only populated for foreign currency)
- Always provide fallback chain: baseCurrency → amount → 0
- See Phase 5 amended plan for full consolidation example

---

## Bounded Cache Pattern

**When:** Caching API responses or computed reports

**Pattern:**

```typescript
class BoundedCache<T> {
  private readonly MAX_ENTRIES = 500;
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.sweep(), 60_000);
    this.cleanupTimer.unref();
  }

  set(tenantId: string, key: string, data: T) {
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    const fullKey = `${tenantId}:${key}`;
    this.cache.set(fullKey, { data, expiry: Date.now() + this.TTL_MS });
  }

  // ... get, invalidate, sweep methods
}
```

**Key Points:**
- ALWAYS set max size (prevent unbounded growth)
- Namespace keys by tenantId (prevent collision)
- Active sweep for TTL expiry (don't rely on read-time checks only)
- Invalidate on data update (don't serve stale data)
- See `.claude/rules/cache-design-checklist.md` for full implementation

---

## Multi-Entity Currency Validation

**When:** Building consolidation reports or tenant-wide metrics

**Pattern:**

```typescript
const entities = await prisma.entity.findMany({
  where: { id: { in: entityIds }, tenantId },
  select: { id: true, functionalCurrency: true, baseCurrency: true }
});

// Verify all entities have same functional currency
const currencies = new Set(entities.map(e => e.functionalCurrency));
if (currencies.size > 1) {
  throw new BadRequestError(
    `Cannot consolidate entities with different currencies: ${Array.from(currencies).join(', ')}`
  );
}
```

**Key Points:**
- Validate BEFORE running expensive aggregation
- Check both functionalCurrency (mandatory) and baseCurrency (optional)
- Clear error message with currency list
- See `.claude/rules/multi-entity-checklist.md` for full pattern
```

**Time:** 0.5 hours

---

### Task 3.2: Update guardrails.md with New Anti-Patterns

**File:** `.claude/rules/guardrails.md`

**Add to "Explicit Anti-Patterns" section:**

```markdown
### Raw SQL
- ❌ **NEVER use raw SQL without wrapper** — use `tenantScopedQuery()` to validate tenantId
- ❌ **NEVER skip tenant filter in SQL** — every query needs WHERE tenantId = ...
- ❌ **NEVER use string concatenation** — use Prisma.sql\`...\` for parameterization

### Caching
- ❌ **NEVER create unbounded cache** — always set MAX_ENTRIES
- ❌ **NEVER skip TTL** — stale data causes bugs
- ❌ **NEVER forget tenant namespace** — keys must be `${tenantId}:${key}`
- ❌ **NEVER skip invalidation** — update triggers must clear cache

### Multi-Entity Operations
- ❌ **NEVER skip currency validation** — consolidation across currencies requires FX table
- ❌ **NEVER assume baseCurrency is populated** — use COALESCE fallback to amount fields
- ❌ **NEVER skip ownership check** — verify user owns ALL entities before aggregation
```

**Time:** 0.25 hours

---

### Task 3.3: Document Patterns in CLAUDE.md

**File:** `CLAUDE.md`

**Add to "Quick Reference" section:**

```markdown
## Security & Performance Patterns

| Pattern | Rule File | MEMORY Topic |
|---------|-----------|--------------|
| Raw SQL tenant isolation | `.claude/rules/raw-sql-checklist.md` | `api-patterns.md` |
| Cache design | `.claude/rules/cache-design-checklist.md` | `api-patterns.md` |
| Multi-entity operations | `.claude/rules/multi-entity-checklist.md` | `api-patterns.md` |
| COALESCE for baseCurrency | N/A (in api-patterns.md) | `api-patterns.md` |

**Before writing raw SQL:** Read raw-sql-checklist.md, use tenantScopedQuery wrapper
**Before adding cache:** Read cache-design-checklist.md, set MAX_ENTRIES and TTL
**Before multi-entity aggregation:** Read multi-entity-checklist.md, validate currency
```

**Time:** 0.25 hours

---

## Sprint 4: Agent Integration Updates (1 hour)

### Task 4.1: Update Skill Documentation

**File:** `.claude/skills/processes-plan.md`

**Add to "When to Use" section:**

```markdown
**Integrated Review Process:**

This workflow now includes security and performance review DURING planning (not just after). Expect 2 pauses for agent feedback:

1. **After functional spec (Step 4):** Security agent reviews for tenant isolation, permission gaps
2. **After data patterns (Step 5):** Performance agent reviews for index gaps, cache design

This catches 80% of issues before final plan is written, reducing post-planning findings from ~57 to ~15-20.
```

**Update "Output" section:**

```markdown
**Output:** Implementation plan in `docs/plans/YYYY-MM-DD-feature-name.md` with:
- Comprehensive task breakdown (sprints, tasks, subtasks)
- **Security Considerations** section (tenant isolation, permissions, rate limits)
- **Performance Considerations** section (indexes, cache, query patterns)
- **Cross-Domain Impact Analysis** (affected domains, permission matrix)
- **Edge Cases** per task (nullable fields, multi-entity scenarios)
- **Infrastructure Requirements** (indexes, RBAC, cache, rate limits)
- Success criteria and timeline estimate
- Dependencies and risks

**Integrated agent findings** from security and performance reviews are incorporated into task breakdown.
```

**Time:** 0.25 hours

---

### Task 4.2: Create Agent Invocation Examples

**File:** `docs/templates/agent-invocation-examples.md` (NEW)

```markdown
# Agent Invocation Examples for Planning

## During Planning: Security Review (Step 4)

**When:** After writing functional spec (tasks 1-10), BEFORE finalizing plan

**Agent:** `security-sentinel`

**Prompt Template:**

```
Review this draft implementation plan for security issues. Focus on:

1. **Tenant Isolation:** Are all queries properly scoped to tenantId?
2. **Permission Boundaries:** Are RBAC checks mapped to new endpoints?
3. **Input Validation:** Are Zod schemas defined for user input?
4. **Rate Limiting:** Do expensive endpoints need rate limits?
5. **Sensitive Data:** How is PII/credentials handled?

---

[Paste draft plan sections 1-3: Overview, Task Breakdown, Data Access Patterns]

---

**Output format:**
- P0 (critical): Issues that block implementation
- P1 (high): Issues that should be fixed before deployment
- P2 (medium): Nice-to-have improvements

For each finding, provide:
- Specific task/code reference
- Risk description
- Recommended fix
```

**Example invocation:**

```typescript
Task tool with:
  subagent_type: "security-sentinel"
  description: "Security review of Phase X draft plan"
  prompt: [Above template with pasted plan sections]
```

---

## During Planning: Performance Review (Step 5)

**When:** After writing data access patterns, BEFORE finalizing estimates

**Agent:** `performance-oracle`

**Prompt Template:**

```
Review this draft implementation plan for performance issues. Focus on:

1. **Missing Indexes:** Are new query patterns covered by indexes?
2. **N+1 Queries:** Are there opportunities for batch loading?
3. **Cache Design:** Is cache bounded and have TTL?
4. **Query Patterns:** Are large datasets paginated/streamed?
5. **Resource Limits:** Are timeouts and memory limits defined?

---

[Paste draft plan sections 3-4: Task Breakdown, Query Patterns]

---

**Output format:**
- F0-F3 (critical to low): Performance issues by severity
- For each finding:
  - Query pattern or cache design issue
  - Expected impact (latency, memory, scalability)
  - Recommended fix (index DDL, query rewrite, pagination)
```

---

## Post-Planning: Full Multi-Agent Review (Final Check)

**When:** After finalizing plan with integrated security/performance fixes

**Skill:** `/processes:review @docs/plans/YYYY-MM-DD-plan.md`

**Expected Result:**
- <20 findings (vs 57 without integrated review)
- 0-1 P0 findings (vs 7)
- Most findings are P2 "nice-to-have" improvements

**If you get >30 findings:** Something was missed in integrated review. Re-run security and performance agents with more detailed sections.
```

**Time:** 0.5 hours

---

### Task 4.3: Update workflows.md Skills Table

**File:** `.claude/rules/workflows.md`

**Update `/processes:plan` entry:**

```markdown
| Plan feature implementation (with integrated security/performance review) | `/processes:plan` |
```

**Add note at bottom:**

```markdown
---

## Planning Process Evolution (2026-02-16)

**Old process:** Plan → Write → `/processes:review` → Fix 57 findings → Revise plan

**New process:** Plan → **Integrated security review** → **Integrated performance review** → Finalize → `/processes:review` → Fix 15-20 findings

**Result:** 65% fewer findings, 86% fewer P0 blockers, faster implementation start
```

**Time:** 0.25 hours

---

## Sprint 5: Validation & Documentation (0.5 hours)

### Task 5.1: Create Pre-Implementation Checklist

**File:** `docs/checklists/pre-implementation-checklist.md` (NEW)

```markdown
# Pre-Implementation Checklist

Use this checklist BEFORE starting implementation of any plan.

## Planning Quality
- [ ] Plan uses v2 template (has Security/Performance/Cross-Domain sections)
- [ ] Security Considerations checklist is 100% complete
- [ ] Performance Considerations checklist is 100% complete
- [ ] All tasks have "Edge Cases" subsection
- [ ] Infrastructure Requirements section is complete (indexes, RBAC, cache, rate limits)

## Review Process
- [ ] Security agent ran during planning (after functional spec)
- [ ] Performance agent ran during planning (after data patterns)
- [ ] Final `/processes:review` completed with <20 findings
- [ ] All P0 findings are addressed (0-1 P0s acceptable)
- [ ] All P1 findings are addressed OR documented as "won't fix"

## High-Risk Pattern Checks
- [ ] If using raw SQL: Reviewed `.claude/rules/raw-sql-checklist.md`
- [ ] If using cache: Reviewed `.claude/rules/cache-design-checklist.md`
- [ ] If multi-entity aggregation: Reviewed `.claude/rules/multi-entity-checklist.md`
- [ ] All pre-flight checklists are complete

## Sprint 0 (if applicable)
- [ ] Infrastructure tasks (indexes, RBAC, wrappers) completed BEFORE feature tasks
- [ ] Tests verify infrastructure works (tenant isolation, cache bounds, etc.)

---

**Green light criteria:** All checkboxes checked, <20 findings in final review, 0-1 P0s

**Red light criteria:** >30 findings, >2 P0s, any pre-flight checklist incomplete

If red light: Re-run integrated reviews with more detail, address critical findings, DO NOT start implementation.
```

**Time:** 0.25 hours

---

### Task 5.2: Update STATUS.md with System Improvements

**File:** `STATUS.md`

**Add new section after "Known Issues":**

```markdown
---

## System Improvements (2026-02-16)

### Planning System Upgrade
- ✅ Planning template v2 with Security/Performance/Cross-Domain sections
- ✅ 3 pre-flight checklists (raw SQL, cache, multi-entity)
- ✅ Integrated review process (security/performance during planning)
- ✅ MEMORY patterns updated (tenantScopedQuery, COALESCE, bounded cache)
- ✅ Agent invocation examples for planning workflow

### Expected Impact
- Reduce P0 findings: 7 → 0-1 (86% reduction)
- Reduce total findings: 57 → 15-20 (65% reduction)
- Faster implementation start (no P0 blockers)

### Next Validation
- Phase 6 planning will test new process
- Measure finding reduction vs Phase 5 baseline
```

**Time:** 0.25 hours

---

## Success Validation

### Phase 6 Planning (Future)
- [ ] Use template v2 for Phase 6 plan
- [ ] Run integrated security review after functional spec
- [ ] Run integrated performance review after data patterns
- [ ] Final review has <20 findings (vs 57 for Phase 5)
- [ ] 0-1 P0 findings (vs 7 for Phase 5)

### Metrics to Track
- Findings count: P0, P1, P2, Total
- Planning time: With vs without integrated review
- Implementation blockers: Count of P0s that delay start
- Time to fix: Hours spent addressing findings

---

## Dependencies

**None** — All tasks are documentation and template updates.

---

## Risks

### Low Risk
- No code changes, only documentation
- Templates are additive (old plans still work)
- Checklists are guidance, not hard requirements

### Mitigation
- Phase 6 planning will validate new process
- Iterate on template based on feedback
- Refine checklists as new patterns emerge

---

## Timeline

| Sprint | Duration | Tasks |
|--------|----------|-------|
| 1. Planning Template Upgrade | 2 hours | Template v2, workflow update |
| 2. Pre-Flight Checklists | 2 hours | Raw SQL, cache, multi-entity |
| 3. MEMORY & Rule Updates | 1.5 hours | api-patterns.md, guardrails.md, CLAUDE.md |
| 4. Agent Integration Updates | 1 hour | Skill docs, examples, workflows.md |
| 5. Validation & Documentation | 0.5 hours | Pre-implementation checklist, STATUS.md |
| **Total** | **7 hours** | (Original estimate: 6-8 hours) |

---

## Additional Recommendations

### Agent Performance Improvements

Beyond this plan, consider these enhancements:

1. **Agent Prompt Tuning**
   - Add "Previously, this agent found X issues in similar plans" to agent prompts
   - Include common anti-patterns in agent system prompt
   - Reference pre-flight checklists in agent prompts

2. **Custom Review Agents**
   - `raw-sql-reviewer`: Specialized agent for tenant isolation in raw SQL
   - `cache-design-reviewer`: Validates cache has bounds, TTL, invalidation
   - `multi-currency-validator`: Checks multi-entity consolidation logic

3. **Review Agent Parallelization**
   - Run security + performance agents in parallel (save 50% time)
   - Current: Sequential (6-8 min total), Parallel: 3-4 min

4. **Post-Review Analysis**
   - Track finding patterns across phases (which issues repeat?)
   - Auto-generate checklist from repeated findings
   - Update templates based on common gaps

5. **Planning Template Variants**
   - `backend-heavy-plan.md`: More focus on security, performance
   - `frontend-heavy-plan.md`: More focus on UX, accessibility
   - `database-migration-plan.md`: More focus on data safety, rollback

---

**Total Expanded Scope:** 10-12 hours (includes agent tuning + custom agents)

**Core Scope (This Plan):** 7 hours

---

_Created: 2026-02-16_
_Ready for: Immediate implementation_
_Validation: Phase 6 planning cycle_