# Planning Domain - Action Items

**Generated From:** Architecture Review 2026-02-26
**Status:** Ready for Phase 7 Implementation

---

## Phase 7 - Required (Before Launch)

### ARCH-1: Add Composite Indexes for Cross-Domain Queries
**Priority:** HIGH
**Effort:** 1 hour
**Impact:** Prevents 5+ second query times at 1M journal lines

**Implementation:**
```prisma
// packages/db/prisma/schema.prisma

model JournalLine {
  // ... existing fields ...

  // ADD THIS INDEX:
  @@index([glAccountId, journalEntryId]) // Budget variance performance
}
```

**Migration:**
```bash
cd packages/db
npx prisma migrate dev --name add_journal_line_composite_index
```

**Verification:**
```sql
-- After migration, verify index exists:
SHOW INDEX FROM journal_lines WHERE Key_name LIKE '%glAccountId%';
```

**Affected Services:**
- `budget-variance.service.ts` (variance calculations)
- `ai-forecast.service.ts` (monthly grouping)
- `budget-suggestions.service.ts` (historical spend analysis)
- `cash-runway.service.ts` (burn rate calculation)
- `seasonal-patterns.service.ts` (pattern recognition)

**Test:**
```bash
# Run variance query before/after index:
# Before: ~500ms for 100K rows
# After: ~50ms for 100K rows (10x improvement)
```

---

### TEST-1: Add Analytics Service Tests
**Priority:** HIGH
**Effort:** 4 hours
**Impact:** Prevents regression bugs in complex analytics logic

**Implementation:**

#### 1. Budget Variance Service Tests (1 hour)
```typescript
// apps/api/src/domains/planning/services/__tests__/budget-variance.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetVarianceService } from '../budget-variance.service';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

describe('BudgetVarianceService', () => {
  let service: BudgetVarianceService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    service = new BudgetVarianceService(TEST_IDS.TENANT_ID);
  });

  describe('listBudgetVariances', () => {
    it('should calculate variance with POSTED entries only', async () => {
      // Mock budgets
      mockPrisma.budget.findMany.mockResolvedValueOnce([
        { id: 'B1', amount: 200000, glAccountId: 'GL1', startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31') },
      ]);

      // Mock JournalLine.aggregate for actual spend
      mockPrisma.journalLine.aggregate.mockResolvedValueOnce({
        _sum: { debitAmount: 150000, creditAmount: 5000 },
      });

      const result = await service.listBudgetVariances(TEST_IDS.ENTITY_ID);

      expect(result).toHaveLength(1);
      expect(result[0].budgetedAmount).toBe(200000);
      expect(result[0].actualAmount).toBe(145000); // 150000 - 5000
      expect(result[0].variance).toBe(55000); // 200000 - 145000
      expect(result[0].variancePercent).toBe(27.5);
      expect(result[0].utilizationPercent).toBe(72.5);
      expect(result[0].alertLevel).toBe('ok');
    });

    it('should set alertLevel to over-budget when >100% utilized', async () => {
      mockPrisma.budget.findMany.mockResolvedValueOnce([
        { id: 'B1', amount: 100000, glAccountId: 'GL1', startDate: new Date(), endDate: new Date() },
      ]);

      mockPrisma.journalLine.aggregate.mockResolvedValueOnce({
        _sum: { debitAmount: 120000, creditAmount: 0 },
      });

      const result = await service.listBudgetVariances(TEST_IDS.ENTITY_ID);

      expect(result[0].alertLevel).toBe('over-budget');
      expect(result[0].utilizationPercent).toBe(120);
    });

    it('should set alertLevel to warning when 80-99% utilized', async () => {
      mockPrisma.budget.findMany.mockResolvedValueOnce([
        { id: 'B1', amount: 100000, glAccountId: 'GL1', startDate: new Date(), endDate: new Date() },
      ]);

      mockPrisma.journalLine.aggregate.mockResolvedValueOnce({
        _sum: { debitAmount: 85000, creditAmount: 0 },
      });

      const result = await service.listBudgetVariances(TEST_IDS.ENTITY_ID);

      expect(result[0].alertLevel).toBe('warning');
    });
  });

  describe('getBudgetVarianceDetail', () => {
    it('should include transaction details', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce({
        id: 'B1', amount: 100000, glAccountId: 'GL1',
        startDate: new Date(), endDate: new Date(),
      });

      mockPrisma.journalLine.aggregate.mockResolvedValueOnce({
        _sum: { debitAmount: 50000, creditAmount: 0 },
      });

      mockPrisma.journalLine.findMany.mockResolvedValueOnce([
        {
          id: 'JL1',
          debitAmount: 25000,
          creditAmount: 0,
          journalEntry: { date: new Date(), memo: 'Expense 1', entryNumber: 'JE-001' },
          glAccount: { name: 'Marketing' },
        },
      ]);

      const result = await service.getBudgetVarianceDetail('B1');

      expect(result?.transactions).toHaveLength(1);
      expect(result?.transactions[0].debitAmount).toBe(25000);
    });
  });
});
```

#### 2. AI Forecast Service Tests (1.5 hours)
```typescript
// apps/api/src/domains/planning/services/__tests__/ai-forecast.service.test.ts

describe('AIForecastService', () => {
  it('should generate forecast with sufficient historical data', async () => {
    // Mock 24 months of historical journal lines
    const historicalLines = Array.from({ length: 24 }, (_, i) => ({
      debitAmount: 100000 + i * 2000, // Upward trend
      journalEntry: {
        date: subMonths(new Date(), 24 - i),
      },
    }));

    mockPrisma.journalLine.findMany.mockResolvedValueOnce(historicalLines);

    const result = await service.generateForecast(TEST_IDS.ENTITY_ID, 6, 'EXPENSE');

    expect(result.projections).toHaveLength(6);
    expect(result.dataQuality).toBe('high'); // 24 months
    expect(result.monthsOfHistory).toBe(24);
    expect(result.projections[0].amount).toBeGreaterThan(0);
    expect(result.projections[0].confidence).toBeGreaterThan(70);
  });

  it('should return insufficient_data for <3 months', async () => {
    mockPrisma.journalLine.findMany.mockResolvedValueOnce([
      { debitAmount: 100000, journalEntry: { date: new Date() } },
    ]);

    const result = await service.generateForecast(TEST_IDS.ENTITY_ID, 6);

    expect(result.projections).toHaveLength(0);
    expect(result.methodology).toBe('insufficient_data');
    expect(result.dataQuality).toBe('low');
  });

  it('should decrease confidence with distance', async () => {
    // Mock sufficient historical data
    mockPrisma.journalLine.findMany.mockResolvedValueOnce(
      Array.from({ length: 12 }, () => ({
        debitAmount: 100000,
        journalEntry: { date: new Date() },
      }))
    );

    const result = await service.generateForecast(TEST_IDS.ENTITY_ID, 12);

    // Confidence should decrease month-by-month
    expect(result.projections[0].confidence).toBeGreaterThan(result.projections[5].confidence);
    expect(result.projections[5].confidence).toBeGreaterThan(result.projections[11].confidence);
  });
});
```

#### 3. Cash Runway Service Tests (30 min)
```typescript
describe('CashRunwayService', () => {
  it('should calculate runway with positive net burn', async () => {
    // Mock current cash balance
    mockPrisma.account.aggregate.mockResolvedValueOnce({
      _sum: { currentBalance: 500000 }, // $5,000 cash
    });

    // Mock burn rate (expenses > revenue)
    mockPrisma.journalLine.findMany.mockResolvedValueOnce([
      { debitAmount: 200000, creditAmount: 0 }, // Expense
      { debitAmount: 0, creditAmount: 100000 },   // Revenue
    ]);

    const result = await service.getCashRunway(TEST_IDS.ENTITY_ID);

    expect(result.cashBalance).toBe(500000);
    expect(result.monthlyBurnRate).toBe(200000);
    expect(result.monthlyRevenue).toBe(100000);
    expect(result.netBurnRate).toBe(100000); // 200k - 100k
    expect(result.runwayMonths).toBe(5); // 500k / 100k
  });
});
```

#### 4. Seasonal Patterns Service Tests (30 min)
```typescript
describe('SeasonalPatternsService', () => {
  it('should identify high/low revenue months', async () => {
    // Mock 12 months with clear pattern (high in Dec, low in July)
    const mockLines = [
      { debitAmount: 0, creditAmount: 200000, journalEntry: { date: new Date('2025-12-01') } }, // High
      { debitAmount: 0, creditAmount: 50000, journalEntry: { date: new Date('2025-07-01') } },  // Low
    ];

    mockPrisma.journalLine.findMany.mockResolvedValueOnce(mockLines);

    const result = await service.analyze(TEST_IDS.ENTITY_ID, 12);

    expect(result.highRevenueMonths).toContain('December');
    expect(result.lowRevenueMonths).toContain('July');
    expect(result.seasonalityScore).toBeGreaterThan(0);
  });
});
```

**Test Command:**
```bash
cd apps/api
npx vitest run src/domains/planning/services/__tests__
```

---

## Phase 7-8 - Recommended

### PERF-2: Optimize Monthly Grouping Queries
**Priority:** MEDIUM
**Effort:** 2 hours
**Impact:** 10x speedup for 24-month forecasts

**Implementation:**
```typescript
// apps/api/src/domains/planning/services/ai-forecast.service.ts

// BEFORE (in-memory grouping):
const lines = await prisma.journalLine.findMany({
  where: { /* ... */ },
  include: { journalEntry: { select: { date: true } } },
});

const monthlyData = lines.reduce((acc, line) => {
  const month = format(line.journalEntry.date, 'yyyy-MM');
  acc[month] = (acc[month] || 0) + line.debitAmount;
  return acc;
}, {});

// AFTER (SQL GROUP BY):
interface MonthlyResult {
  month: string;
  debitTotal: bigint;
  creditTotal: bigint;
}

const monthlyData = await prisma.$queryRaw<MonthlyResult[]>`
  SELECT
    DATE_FORMAT(je.date, '%Y-%m') as month,
    SUM(jl.debitAmount) as debitTotal,
    SUM(jl.creditAmount) as creditTotal
  FROM journal_lines jl
  JOIN journal_entries je ON jl.journalEntryId = je.id
  WHERE je.entityId = ${entityId}
    AND je.status = 'POSTED'
    AND je.date >= ${startDate}
    AND je.date <= ${endDate}
    AND jl.deletedAt IS NULL
    AND je.deletedAt IS NULL
  GROUP BY DATE_FORMAT(je.date, '%Y-%m')
  ORDER BY month
`;

// Convert bigint to number
const formatted = monthlyData.map(m => ({
  month: m.month,
  amount: Number(m.debitTotal) - Number(m.creditTotal),
}));
```

**Apply to:**
- `ai-forecast.service.ts`
- `seasonal-patterns.service.ts`
- `budget-suggestions.service.ts`

**Performance Gain:**
- Before: Fetch 12K rows, group in Node.js (~2s)
- After: SQL GROUP BY returns 24 aggregated rows (~200ms)

---

### ARCH-4: Add Account-GL Linking
**Priority:** MEDIUM
**Effort:** 4 hours
**Impact:** Enables proper goal tracking for bank accounts

**Implementation:**

#### 1. Update Schema (1 hour)
```prisma
// packages/db/prisma/schema.prisma

model Account {
  id                String     @id @default(cuid())
  entityId          String
  name              String
  type              AccountType
  currentBalance    Int
  linkedGLAccountId String?    // NEW: Link to GL Account
  linkedGLAccount   GLAccount? @relation("AccountGLLink", fields: [linkedGLAccountId], references: [id])
  // ... existing fields ...
}

model GLAccount {
  id             String    @id @default(cuid())
  entityId       String
  code           String
  name           String
  type           GLAccountType
  linkedAccounts Account[] @relation("AccountGLLink") // NEW: Reverse relation
  // ... existing fields ...
}
```

#### 2. Migration (1 hour)
```bash
cd packages/db
npx prisma migrate dev --name add_account_gl_linking
```

#### 3. Update Goal Tracking Service (1.5 hours)
```typescript
// apps/api/src/domains/planning/services/goal-tracking.service.ts

async trackGoal(goalId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, entity: { tenantId: this.tenantId } },
    include: {
      account: { select: { id: true, linkedGLAccountId: true } }, // Include link
      glAccount: { select: { id: true } },
    },
  });

  if (!goal) throw new Error('Goal not found');

  // Determine which GL account to query
  const glAccountId = goal.glAccountId ?? goal.account?.linkedGLAccountId;

  if (!glAccountId) {
    // No GL link, skip tracking for this goal
    return { /* ... */ };
  }

  // Query JournalLines for the GL account
  const result = await prisma.journalLine.aggregate({
    where: {
      glAccountId,
      journalEntry: {
        entityId: goal.entityId,
        entity: { tenantId: this.tenantId },
        status: 'POSTED',
      },
    },
    _sum: { debitAmount: true, creditAmount: true },
  });

  // Update goal.currentAmount
  const currentAmount = (result._sum.debitAmount ?? 0) - (result._sum.creditAmount ?? 0);
  await prisma.goal.update({
    where: { id: goalId },
    data: { currentAmount },
  });
}
```

#### 4. Update Account Service (30 min)
```typescript
// apps/api/src/domains/banking/services/account.service.ts

async createAccount(data: {
  name: string;
  type: string;
  linkedGLAccountId?: string; // NEW: Allow linking on create
  // ...
}) {
  // Validate GL account ownership
  if (data.linkedGLAccountId) {
    const gl = await prisma.gLAccount.findFirst({
      where: { id: data.linkedGLAccountId, entity: { tenantId: this.tenantId } },
    });
    if (!gl) throw new Error('GL account not found');
  }

  return prisma.account.create({
    data: {
      name: data.name,
      type: data.type,
      linkedGLAccountId: data.linkedGLAccountId,
      // ...
    },
  });
}
```

---

### ARCH-2: Define Cascade Behavior for Goal FKs
**Priority:** MEDIUM
**Effort:** 2 hours
**Impact:** Prevents orphaned references in goals

**Implementation:**

#### Option 1: Schema-Level Cascade (Recommended)
```prisma
// packages/db/prisma/schema.prisma

model Goal {
  accountId   String?
  categoryId  String?
  glAccountId String?

  account     Account?   @relation(fields: [accountId], references: [id], onDelete: SetNull)
  category    Category?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  glAccount   GLAccount? @relation("GoalGLAccount", fields: [glAccountId], references: [id], onDelete: SetNull)
}
```

**Migration:**
```bash
cd packages/db
npx prisma migrate dev --name add_goal_cascade_behavior
```

#### Option 2: Application-Level Validation (If Schema Change Blocked)
```typescript
// apps/api/src/domains/planning/services/goal-tracking.service.ts

async trackGoal(goalId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId },
    include: {
      account: { select: { id: true, deletedAt: true } },
      category: { select: { id: true, deletedAt: true } },
      glAccount: { select: { id: true, isActive: true } },
    },
  });

  // Validate all references are active
  if (goal.account?.deletedAt) {
    // Account soft-deleted, nullify reference
    await prisma.goal.update({
      where: { id: goalId },
      data: { accountId: null },
    });
  }

  if (goal.category?.deletedAt) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { categoryId: null },
    });
  }

  if (goal.glAccount && !goal.glAccount.isActive) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { glAccountId: null },
    });
  }
}
```

---

### CODE-1: Consolidate Currency Formatting
**Priority:** LOW
**Effort:** 2 hours
**Impact:** DRY principle, consistent locale handling

**Files to Update:**
- `apps/web/src/app/(dashboard)/planning/budgets/budgets-list.tsx`
- `apps/web/src/app/(dashboard)/planning/goals/goals-list.tsx`
- `apps/web/src/app/(dashboard)/planning/forecasts/forecasts-list.tsx`

**Change:**
```typescript
// BEFORE (inline):
const formatted = `$${(amount / 100).toFixed(2)}`;

// AFTER (shared utility):
import { formatCurrency } from '@/lib/utils/currency';
const formatted = formatCurrency(amount, 'USD');
```

**Grep to find all instances:**
```bash
Grep "(amount|cents|total).*\/ 100" apps/web/src/app/\(dashboard\)/planning/
```

---

## Phase 8-9 - Nice-to-Have

### CACHE-1: Add Redis Caching
**Priority:** LOW
**Effort:** 4 hours
**Impact:** 3-5x faster for repeated variance/forecast queries

**Implementation:**
```typescript
// apps/api/src/lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const result = await fetchFn();
  await redis.setex(key, ttlSeconds, JSON.stringify(result));
  return result;
}
```

**Apply to:**
```typescript
// budget-variance.service.ts
async listBudgetVariances(entityId: string) {
  return cached(
    `variance:${entityId}`,
    3600, // 1 hour TTL
    async () => {
      // Existing variance calculation logic
    }
  );
}
```

**Cache Invalidation:**
```typescript
// On new JournalEntry posted:
await redis.del(`variance:${entityId}`);
await redis.del(`forecast:${entityId}`);
```

---

### DOCS-1: Add Architecture Decision Records
**Priority:** LOW
**Effort:** 2 hours
**Impact:** Better documentation for future maintainers

**Create:** `docs/architecture/planning-domain.md`

**Template:**
```markdown
# Planning Domain Architecture Decisions

## ADR-1: Statistical Forecasting for MVP
**Date:** 2026-02-26
**Status:** Accepted

### Context
Need to provide forecasting without incurring LLM API costs for MVP.

### Decision
Use statistical methods (linear regression, seasonal decomposition) instead of LLM.

### Consequences
**Positive:**
- Zero API costs
- Deterministic results (easier to debug)
- Fallback for LLM outages

**Negative:**
- Less sophisticated insights
- No natural language explanations

### Future
Enhance with LLM in Phase 9 as optional layer.

---

## ADR-2: JSON Storage for Forecast Projections
**Date:** 2026-02-26
**Status:** Accepted

### Context
Need flexible schema for monthly projections without excessive normalization.

### Decision
Store projections as JSON array in Forecast.data field.

### Consequences
**Positive:**
- Flexible schema
- Easy to query entire forecast
- Acceptable for <100K records

**Negative:**
- Slower aggregations
- No type safety
- Migration required at scale

### Review Criteria
Migrate to relational if:
- Forecasts exceed 100K
- Query performance degrades
- Need to aggregate projections
```

---

### ARCH-3: Consider Relational Forecast Storage
**Priority:** LOW
**Effort:** 8 hours
**Impact:** Better performance at >100K forecasts

**When to implement:** If forecasts exceed 100K OR query times degrade.

**Migration:**
```prisma
model Forecast {
  // Remove: data Json
  projections ForecastProjection[]
}

model ForecastProjection {
  id         String   @id @default(cuid())
  forecastId String
  month      String   // YYYY-MM
  amount     Int      // Integer cents
  confidence Int?     // 0-100
  forecast   Forecast @relation(fields: [forecastId], references: [id])

  @@index([forecastId, month])
}
```

**Data Migration Script:**
```typescript
// scripts/migrate-forecast-data.ts
const forecasts = await prisma.forecast.findMany();

for (const forecast of forecasts) {
  const projections = JSON.parse(forecast.data);
  await prisma.forecastProjection.createMany({
    data: projections.map(p => ({
      forecastId: forecast.id,
      month: p.month,
      amount: p.amount,
      confidence: p.confidence,
    })),
  });
}
```

---

## Summary Checklist

### Phase 7 (Before Launch) ✅
- [ ] Add composite index `[glAccountId, journalEntryId]` to JournalLine
- [ ] Add budget variance service tests
- [ ] Add AI forecast service tests
- [ ] Add cash runway service tests
- [ ] Add seasonal patterns service tests

### Phase 7-8 (High Value) ⚠️
- [ ] Optimize monthly grouping with raw SQL GROUP BY
- [ ] Add Account-GL linking schema + migration
- [ ] Update goal tracking service for Account-GL links
- [ ] Define cascade behavior for Goal FKs (onDelete: SetNull)
- [ ] Consolidate currency formatting in frontend components

### Phase 8-9 (Nice-to-Have) 📋
- [ ] Add Redis caching for variance/forecast results
- [ ] Document architecture decisions in ADR format
- [ ] Monitor forecast performance (migrate to relational if needed)

---

**Total Effort Estimate:**
- Phase 7: 5 hours
- Phase 7-8: 10 hours
- Phase 8-9: 14 hours

**Grand Total:** ~29 hours

---

**Next Step:** Create tasks in TASKS.md for Phase 7 required items.
