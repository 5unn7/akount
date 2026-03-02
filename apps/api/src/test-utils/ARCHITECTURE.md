# Test Architecture - Quick Reference

> **Schema-Driven Factories** - One source of truth, automatic sync

---

## The System

```
Prisma Schema (47 models)
    ↓ npx prisma generate
Generated Factories (__generated__/fabbrica/)
    ↓ import in tests
Service Tests (Prisma mocks)

Zod Schemas (API validation)
    ↓ .parse() validation
Input Factories (test-utils/input-factories.ts)
    ↓ import in tests
Route Tests (API inputs)
```

---

## Quick Examples

### Service Test (Mock Prisma Response)

```typescript
import { AccountFactory } from '../__generated__/fabbrica';
import { mockPrisma } from '../../test-utils';

const account = await AccountFactory.build({ name: 'Checking' });
mockPrisma.account.findFirst.mockResolvedValue(account);
```

### Route Test (Validate API Input)

```typescript
import { mockTaxRateInput } from '../../test-utils/input-factories';

const input = mockTaxRateInput({ code: 'HST' });
await service.createTaxRate(input, CTX); // Validated automatically
```

---

## When Schema Changes

```bash
# 1. Edit schema
vim packages/db/prisma/schema.prisma

# 2. Regenerate factories
cd packages/db && npx prisma generate

# 3. Fix factory defaults if needed (TypeScript will show errors)
vim apps/api/src/__generated__/fabbrica/index.ts # Usually auto-fixes

# 4. Verify tests
cd apps/api && npm run test

# Done! All tests auto-updated.
```

---

## File Locations

| What | Where |
|------|-------|
| **Generated Prisma factories** | `apps/api/src/__generated__/fabbrica/index.ts` |
| **Input factories** | `apps/api/src/test-utils/input-factories.ts` |
| **Factory generator config** | `packages/db/prisma/schema.prisma` (generator block) |
| **Templates** | `apps/api/src/test-utils/templates/*.template.ts` |
| **Rules** | `.claude/rules/test-architecture.md` |
| **Migration guide** | `apps/api/src/test-utils/MIGRATION.md` |

---

## Anti-Patterns (Never Do)

❌ Inline objects: `const account = { id, name, type, /* 15 fields */ }`
❌ Module constants: `const MOCK_DATA = { /* ... */ }` at top of file
❌ Manual helpers: `function makeMock() { return { /* ... */ } }`
❌ Deprecated imports: `import { mockAccount } from 'test-utils/mock-factories'`

✅ Always: `const account = await AccountFactory.build({ name: 'Test' })`

---

## Getting Help

- **Template:** `apps/api/src/test-utils/templates/service.test.template.ts`
- **Full guide:** `apps/api/src/test-utils/README.md`
- **Rule doc:** `.claude/rules/test-architecture.md`
- **Review agent:** Run `/processes:review` on test files

---

_Updated: 2026-02-28. Schema-driven test architecture at scale._
