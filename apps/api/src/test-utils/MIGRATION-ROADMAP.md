# Test Factory Migration Roadmap

**Created:** 2026-02-28
**Current Adoption:** 43% (55/127 files)
**Target:** 90% (115/127 files)
**Remaining:** 52 files need migration

---

## Current State

✅ **Infrastructure Complete** (Phases 1-4, 7-8)
- Type-safe model factories (16 models)
- Zod input factories (9 schemas)
- ESLint rule (warns on inline mocks)
- Pre-commit hook (validates factory usage)
- Test writing guide (README.md)
- CI validation (factory drift detection)
- Audit script (tracks adoption)

✅ **Pattern Proven** (Phase 5)
- Route test migrated: [tax-rate.routes.test.ts](../../domains/accounting/__tests__/tax-rate.routes.test.ts)
- Service test migrated: [gl-account.service.test.ts](../../domains/accounting/__tests__/gl-account.service.test.ts)
- Both: All tests pass, ESLint clean

⚠️ **Bulk Migration Pending** (Phase 6)
- 52 files need migration (41% of codebase)
- Requires: Manual review per file (service tests especially complex)

---

## Migration Strategy

### Approach A: Incremental (Recommended)

**When:** As developers touch test files for other work
**How:** Pre-commit hook warns → developer migrates before committing
**Pros:** Low risk, no dedicated time needed, spreads effort
**Cons:** Slow (6-12 months to reach 90%)

### Approach B: Focused Sprint

**When:** Dedicated 2-day sprint
**How:** Batch migrate 10-15 files/day with Task agent assistance
**Pros:** Fast (2-3 days to 90%), immediate benefit
**Cons:** Requires dedicated time, risk of breaking tests

### Approach C: Hybrid

**When:** Migrate high-priority files NOW (accounting, banking, invoicing), rest incrementally
**How:**
1. Week 1: Migrate 20 high-priority files (accounting + banking core)
2. Week 2-N: Incremental migration via pre-commit hook
**Pros:** Best balance of speed and safety
**Cons:** Requires 1 week focused effort

---

## High-Priority Files for Focused Migration (20 files)

### Accounting (8 files)
- [ ] `domains/accounting/__tests__/fiscal-period.routes.test.ts` (19 object literals)
- [ ] `domains/accounting/__tests__/fiscal-period.service.test.ts`
- [ ] `domains/accounting/__tests__/gl-account.routes.test.ts` (13 literals)
- [ ] `domains/accounting/__tests__/journal-entry.routes.test.ts` (27 literals ⚠️ high impact)
- [ ] `domains/accounting/__tests__/journal-entry.service.test.ts` (7 literals)
- [ ] `domains/accounting/__tests__/posting.service.test.ts` (11 literals)
- [ ] `domains/accounting/__tests__/tax-rate.service.test.ts`
- [ ] `domains/accounting/services/__tests__/report-export.service.test.ts` (15 literals)

### Invoicing (6 files)
- [ ] `domains/invoicing/services/__tests__/invoice.service.test.ts`
- [ ] `domains/invoicing/services/__tests__/bill.service.test.ts`
- [ ] `domains/invoicing/__tests__/invoice.routes.test.ts`
- [ ] `domains/invoicing/__tests__/bill.routes.test.ts`
- [ ] `domains/invoicing/services/__tests__/credit-note.service.test.ts`
- [ ] `domains/invoicing/services/__tests__/payment.service.test.ts`

### Banking (6 files)
- [ ] `domains/banking/services/__tests__/account.service.test.ts`
- [ ] `domains/banking/services/__tests__/transaction.service.test.ts`
- [ ] `domains/banking/__tests__/account.routes.test.ts`
- [ ] `domains/banking/__tests__/transaction.routes.test.ts`
- [ ] `domains/banking/services/__tests__/reconciliation.service.test.ts`
- [ ] `domains/banking/services/__tests__/import.service.test.ts`

**Total:** 20 files covering core domains (accounting, invoicing, banking)
**Estimated Effort:** 4-6h with Task agent assistance (20-30min per file including review)

---

## Migration Pattern (Copy This)

### For Route Tests

```typescript
// ❌ BEFORE
const MOCK_TAX_RATE = {
  id: 'tax-1',
  code: 'GST',
  rateBasisPoints: 500,
  // ... 10 more fields
};

const response = await app.inject({
  payload: {
    code: 'HST',
    rateBasisPoints: 1300,
    jurisdiction: 'Ontario',
  },
});

// ✅ AFTER
import { mockTaxRate, mockTaxRateInput } from '../../../test-utils';

const taxRate = mockTaxRate({ code: 'GST' });
mockService.getTaxRate.mockResolvedValue(taxRate);

const input = mockTaxRateInput({ code: 'HST', rateBasisPoints: 1300 });
const response = await app.inject({ payload: input });
```

### For Service Tests

```typescript
// ❌ BEFORE
vi.mock('@akount/db', () => ({
  prisma: {
    account: { findMany: vi.fn() },
  },
}));

const account = {
  id: 'acc-1',
  name: 'Checking',
  type: 'BANK',
  // ... 15 more fields
};

// ✅ AFTER
import { mockPrisma, rewirePrismaMock, mockAccount } from '../../../test-utils';

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../test-utils/prisma-mock')).mockPrisma,
}));

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  it('test', async () => {
    const account = mockAccount({ name: 'Checking' });
    mockPrisma.account.findMany.mockResolvedValue([account]);
  });
});
```

---

## Task Agent Delegation Template

When ready to batch migrate:

```
Task: Migrate test files to schema-driven factories

Pattern proven in:
- apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts
- apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts

Apply migration to files (batch 1 of 3):
[list 10-15 files here]

Migration steps:
1. Import centralized factories from test-utils
2. Replace manual vi.mock with mockPrisma pattern
3. Replace inline object literals with factory calls
4. Add rewirePrismaMock() to beforeEach
5. Verify tests pass
6. Run ESLint to confirm no warnings

Reference:
- Template: apps/api/src/test-utils/templates/service.test.template.ts
- Guide: apps/api/src/test-utils/README.md
```

---

## Audit Progress

Run audit after each batch:

```bash
node .claude/scripts/audit-factory-usage.js
```

**Success criteria:** 90%+ adoption (115/127 files)

---

## Troubleshooting

See [README.md](./README.md#troubleshooting) for common migration issues and fixes.

---

## Timeline Estimate

| Approach | Time to 90% | Effort |
|----------|-------------|--------|
| Incremental | 6-12 months | Distributed (no dedicated time) |
| Focused sprint | 2-3 days | 12-16h concentrated |
| Hybrid (20 files now, rest incremental) | 2-4 months | 4-6h upfront + distributed |

**Recommendation:** Hybrid approach — migrate 20 core files this week, rest incrementally.
