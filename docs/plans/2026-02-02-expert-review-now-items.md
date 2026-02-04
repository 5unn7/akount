# Implementation Plan: Expert Review NOW Items

**Date:** 2026-02-02
**Status:** IMPLEMENTED
**Estimated Effort:** 8 hours total
**Prerequisites:** Phase 0 complete (verified)

---

## Implementation Summary (2026-02-02)

| Task | Status | Notes |
|------|--------|-------|
| 1. Soft Deletes | DONE | Added `deletedAt` to 13 models with indexes |
| 2. Missing Indexes | DONE | Added tenantId indexes to Category, importBatchId to Transaction |
| 3. Vitest Setup | DONE | 12 tests passing for FxRateService |
| 4. CI/CD Pipeline | DONE | GitHub Actions workflow created |
| 5. Security Hardening | DONE | Rate limiting (100/min) + Helmet headers |
| 6. Railway Backups | USER ACTION | Verify in Railway dashboard |

**Migration Required:** Run `npx prisma migrate dev --name add-soft-deletes-and-indexes`

**Pre-existing Issues Found:** TypeScript errors in `apps/api/src/routes/import.ts` - these are pre-existing and will cause CI to fail until fixed.

---

## Overview

Implementing critical items identified from expert review prioritization. These are foundational improvements that should be completed before continuing Phase 1 feature work.

---

## Task 1: Add Soft Deletes to Financial Models (2 hours)

### Rationale
Financial data must NEVER be hard deleted for audit compliance. All financial records need `deletedAt` timestamp for soft deletion.

### Models to Update

**Critical Financial Models:**
- Transaction
- JournalEntry
- JournalLine
- Invoice
- InvoiceLine
- Bill
- BillLine
- Payment
- Account
- BankFeedTransaction

**User-Facing Data:**
- Client
- Vendor
- Category

### Schema Changes

```prisma
// Add to each model:
deletedAt DateTime?

// Add composite index for filtering:
@@index([entityId, deletedAt])  // or [tenantId, deletedAt] for tenant-level
```

### Implementation Steps

1. **Update schema.prisma** - Add `deletedAt DateTime?` to each model
2. **Add indexes** - Add composite indexes for filtered queries
3. **Generate migration** - `npx prisma migrate dev --name add-soft-deletes`
4. **Update services** - Add `deletedAt: null` to all findMany queries
5. **Update delete operations** - Change delete to update with `deletedAt: new Date()`

### Files to Modify
- `packages/db/prisma/schema.prisma`
- `apps/api/src/services/*.service.ts` (all services with delete operations)
- `apps/api/src/routes/*.ts` (update query filters)

### Testing
- [ ] Verify migration applies without errors
- [ ] Test that deleted records are excluded from queries
- [ ] Test that soft-deleted records can be restored

---

## Task 2: Add Missing Indexes (30 minutes)

### Identified Gaps

**Category Model (CRITICAL):**
```prisma
model Category {
  // MISSING: tenantId index for tenant-scoped queries
  @@index([tenantId])
  @@index([tenantId, type])
  @@index([tenantId, isActive])
}
```

**Transaction Model:**
```prisma
model Transaction {
  // MISSING: importBatchId for bank import queries
  @@index([importBatchId])
}
```

### Implementation Steps

1. **Update schema.prisma** - Add missing indexes
2. **Generate migration** - `npx prisma migrate dev --name add-missing-indexes`
3. **Verify** - Check migration applies cleanly

---

## Task 3: CI/CD Pipeline with GitHub Actions (2 hours)

### Rationale
Every PR should be automatically linted, type-checked, and tested.

### Workflow Configuration

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: akount_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npm run db:generate

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/akount_test

      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/akount_test

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

### Package.json Scripts Needed

```json
{
  "scripts": {
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "db:generate": "turbo db:generate",
    "db:migrate": "turbo db:migrate"
  }
}
```

### Implementation Steps

1. **Create workflow file** - `.github/workflows/ci.yml`
2. **Verify package.json scripts** - Ensure lint, typecheck, test exist
3. **Add db scripts** - For migration in CI
4. **Test locally** - Run all checks before push
5. **Push and verify** - Watch GitHub Actions run

---

## Task 4: Security Hardening (1 hour)

### 4a: Rate Limiting

**Install:**
```bash
npm install @fastify/rate-limit --workspace=apps/api
```

**Implementation:**
```typescript
// apps/api/src/plugins/rateLimit.ts
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: 100,           // 100 requests
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      // Rate limit by user if authenticated, otherwise by IP
      return request.userId || request.ip;
    },
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429
    })
  });
}
```

### 4b: Security Headers (Helmet)

**Install:**
```bash
npm install @fastify/helmet --workspace=apps/api
```

**Implementation:**
```typescript
// apps/api/src/plugins/security.ts
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

export async function registerSecurityHeaders(app: FastifyInstance) {
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    },
    hsts: {
      maxAge: 31536000,          // 1 year
      includeSubDomains: true,
      preload: true
    }
  });
}
```

### Implementation Steps

1. **Install packages** - `@fastify/rate-limit`, `@fastify/helmet`
2. **Create plugin files** - `plugins/rateLimit.ts`, `plugins/security.ts`
3. **Register in main server** - Update `index.ts`
4. **Test rate limiting** - Verify 429 response after threshold
5. **Verify headers** - Check response headers include security headers

---

## Task 5: Test Infrastructure with Vitest (2 hours)

### Rationale
Zero tests currently exist. Need foundation for unit and integration tests.

### Setup

**Install:**
```bash
npm install -D vitest @vitest/coverage-v8 --workspace=apps/api
```

**Vitest Config:**
```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/**/*.d.ts']
    },
    setupFiles: ['./src/test/setup.ts']
  }
});
```

**Test Setup:**
```typescript
// apps/api/src/test/setup.ts
import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Initialize test database connection if needed
});

afterAll(async () => {
  // Cleanup
});
```

### First Tests

**Example Unit Test:**
```typescript
// apps/api/src/services/__tests__/fxRate.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { FxRateService } from '../fxRate.service';

describe('FxRateService', () => {
  describe('getRate', () => {
    it('should return 1.0 for same currency', async () => {
      const service = new FxRateService();
      const rate = await service.getRate('CAD', 'CAD', new Date());
      expect(rate).toBe(1.0);
    });

    it('should fetch rate from database', async () => {
      // Mock prisma...
    });
  });
});
```

### Package.json Script

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Implementation Steps

1. **Install Vitest** - Add to api workspace
2. **Create config** - `vitest.config.ts`
3. **Create setup file** - `src/test/setup.ts`
4. **Write first test** - FxRateService (simple, isolated)
5. **Add npm scripts** - test, test:watch, test:coverage
6. **Verify CI integration** - Tests run in GitHub Actions

---

## Task 6: Verify Railway Database Backups (15 minutes)

### Steps

1. **Log into Railway dashboard**
2. **Navigate to PostgreSQL service**
3. **Check backup settings:**
   - Automatic backups: Should be ON
   - Backup frequency: Daily recommended
   - Retention: At least 7 days
4. **Document in `docs/setup/backup-security.md`**
5. **Test restore process** (optional but recommended)

---

## Execution Order

1. **Schema changes first** (Tasks 1 & 2) - Creates migration
2. **Test infrastructure** (Task 5) - Needed before CI
3. **CI/CD pipeline** (Task 3) - Uses test infrastructure
4. **Security hardening** (Task 4) - Independent
5. **Backup verification** (Task 6) - Independent, quick

---

## Rollback Plan

All changes are additive (new fields, new files). If issues:
- Schema: `npx prisma migrate reset` to start fresh (dev only)
- CI: Delete workflow file
- Security plugins: Remove from server registration

---

## Success Criteria

- [ ] All financial models have `deletedAt` field
- [ ] Category has `tenantId` index
- [ ] CI runs on every PR (lint, typecheck, test, build)
- [ ] Rate limiting returns 429 after 100 req/min
- [ ] Security headers present in API responses
- [ ] At least 1 passing test exists
- [ ] Railway backups confirmed enabled

---

## Post-Implementation

After completing these items:
1. Update `STATUS.md` with completed items
2. Continue with Phase 1 dashboard integration
3. Add more tests incrementally as features are built
