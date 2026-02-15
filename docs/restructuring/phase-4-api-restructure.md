# Phase 4: API Domain Restructure

**Days:** 9-14
**Status:** ✅ COMPLETE
**Dependencies:** Phase 1 must be complete
**Can Parallel With:** Phase 5 (Web), Phase 6 (Docs)

---

## Objectives

1. Reorganize API from flat routes to domain-aligned structure
2. Apply RBAC middleware to all routes
3. Organize services by domain
4. Update route registrations

---

## Tasks

### 4.1 Create Domain Directory Structure

**Reference:** `docs/design-system/05-governance/information-architecture.md`

- [ ] Create domains directory structure:

  ```bash
  mkdir -p apps/api/src/domains/{overview,banking,business,accounting,planning,ai,services,system}/services
  ```

- [ ] Resulting structure:

  ```
  apps/api/src/
  ├── index.ts
  ├── middleware/
  │   ├── auth.ts           (keep)
  │   ├── tenant.ts         (keep)
  │   ├── rbac.ts           (from Phase 3)
  │   ├── validation.ts     (keep)
  │   └── errorHandler.ts   (keep)
  │
  ├── domains/
  │   ├── overview/
  │   │   ├── routes.ts
  │   │   └── services/
  │   │       └── dashboard.service.ts
  │   │
  │   ├── banking/
  │   │   ├── routes.ts
  │   │   └── services/
  │   │       ├── account.service.ts
  │   │       ├── transaction.service.ts
  │   │       └── reconciliation.service.ts
  │   │
  │   ├── business/
  │   │   ├── routes.ts
  │   │   └── services/
  │   │       ├── client.service.ts
  │   │       ├── invoice.service.ts
  │   │       └── payment.service.ts
  │   │
  │   ├── accounting/
  │   │   ├── routes.ts
  │   │   └── services/
  │   │       └── journal.service.ts
  │   │
  │   ├── planning/
  │   │   ├── routes.ts
  │   │   └── services/
  │   │       └── report.service.ts
  │   │
  │   ├── ai/
  │   │   ├── routes.ts
  │   │   └── services/
  │   │       └── ai.service.ts
  │   │
  │   ├── services/
  │   │   ├── routes.ts
  │   │   └── services/
  │   │       └── accountant.service.ts
  │   │
  │   └── system/
  │       ├── routes.ts
  │       └── services/
  │           ├── entity.service.ts
  │           └── audit.service.ts
  │
  └── schemas/
      └── (reorganize by domain)
  ```

---

### 4.2 Create Domain Route Templates

#### 4.2.1 Overview Domain Routes

- [ ] Create `apps/api/src/domains/overview/routes.ts`:

  ```typescript
  import type { FastifyInstance } from 'fastify';
  import { withPermission } from '../../middleware/withPermission';
  import { dashboardService } from './services/dashboard.service';

  export async function overviewRoutes(fastify: FastifyInstance) {
    // GET /api/overview/dashboard
    fastify.get('/dashboard', {
      ...withPermission('overview', 'dashboard', 'VIEW'),
      handler: async (request, reply) => {
        const metrics = await dashboardService.getMetrics(request.tenantId);
        return reply.send(metrics);
      },
    });

    // GET /api/overview/net-worth
    fastify.get('/net-worth', {
      ...withPermission('overview', 'net-worth', 'VIEW'),
      handler: async (request, reply) => {
        const netWorth = await dashboardService.getNetWorth(request.tenantId);
        return reply.send(netWorth);
      },
    });

    // GET /api/overview/cash-flow
    fastify.get('/cash-flow', {
      handler: async (request, reply) => {
        const cashFlow = await dashboardService.getCashFlow(request.tenantId);
        return reply.send(cashFlow);
      },
    });
  }
  ```

#### 4.2.2 Money Movement Domain Routes

- [ ] Create `apps/api/src/domains/banking/routes.ts`:

  ```typescript
  import type { FastifyInstance } from 'fastify';
  import { withPermission } from '../../middleware/withPermission';
  import { accountService } from './services/account.service';
  import { transactionService } from './services/transaction.service';

  export async function moneyMovementRoutes(fastify: FastifyInstance) {
    // === ACCOUNTS ===

    // GET /api/banking/accounts
    fastify.get('/accounts', {
      ...withPermission('banking', 'accounts', 'VIEW'),
      handler: async (request, reply) => {
        const accounts = await accountService.list(request.tenantId);
        return reply.send(accounts);
      },
    });

    // GET /api/banking/accounts/:id
    fastify.get('/accounts/:id', {
      ...withPermission('banking', 'accounts', 'VIEW'),
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const account = await accountService.get(request.tenantId, id);
        return reply.send(account);
      },
    });

    // POST /api/banking/accounts
    fastify.post('/accounts', {
      ...withPermission('banking', 'accounts', 'ACT'),
      handler: async (request, reply) => {
        const account = await accountService.create(
          request.tenantId,
          request.userId,
          request.body
        );
        return reply.status(201).send(account);
      },
    });

    // === TRANSACTIONS ===

    // GET /api/banking/transactions
    fastify.get('/transactions', {
      ...withPermission('banking', 'transactions', 'VIEW'),
      handler: async (request, reply) => {
        const transactions = await transactionService.list(
          request.tenantId,
          request.query
        );
        return reply.send(transactions);
      },
    });

    // POST /api/banking/transactions
    fastify.post('/transactions', {
      ...withPermission('banking', 'transactions', 'ACT'),
      handler: async (request, reply) => {
        const transaction = await transactionService.create(
          request.tenantId,
          request.userId,
          request.body
        );
        return reply.status(201).send(transaction);
      },
    });

    // === RECONCILIATION ===

    // GET /api/banking/reconciliation
    fastify.get('/reconciliation', {
      ...withPermission('banking', 'reconciliation', 'VIEW'),
      handler: async (request, reply) => {
        // Implementation
      },
    });

    // POST /api/banking/reconciliation/approve
    fastify.post('/reconciliation/approve', {
      ...withPermission('banking', 'reconciliation', 'APPROVE'),
      handler: async (request, reply) => {
        // Implementation
      },
    });
  }
  ```

#### 4.2.3 Accounting Domain Routes

- [ ] Create `apps/api/src/domains/accounting/routes.ts`:

  ```typescript
  import type { FastifyInstance } from 'fastify';
  import { withPermission } from '../../middleware/withPermission';
  import { journalService } from './services/journal.service';
  import { auditService } from '../../services/audit.service';

  export async function accountingRoutes(fastify: FastifyInstance) {
    // === JOURNAL ENTRIES ===

    // GET /api/accounting/journal-entries
    fastify.get('/journal-entries', {
      ...withPermission('accounting', 'journal-entries', 'VIEW'),
      handler: async (request, reply) => {
        const entries = await journalService.list(request.tenantId);
        return reply.send(entries);
      },
    });

    // POST /api/accounting/journal-entries
    fastify.post('/journal-entries', {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
      handler: async (request, reply) => {
        const entry = await journalService.create(
          request.tenantId,
          request.userId,
          request.body
        );

        // Audit log
        await auditService.logCreate(
          request.tenantId,
          request.userId,
          'journal-entry',
          entry.id,
          entry,
          request
        );

        return reply.status(201).send(entry);
      },
    });

    // POST /api/accounting/journal-entries/:id/approve
    fastify.post('/journal-entries/:id/approve', {
      ...withPermission('accounting', 'journal-entries', 'APPROVE'),
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const entry = await journalService.approve(
          request.tenantId,
          request.userId,
          id
        );

        // Audit log
        await auditService.log({
          tenantId: request.tenantId,
          userId: request.userId,
          action: 'APPROVE',
          resourceType: 'journal-entry',
          resourceId: id,
        }, request);

        return reply.send(entry);
      },
    });

    // === CHART OF ACCOUNTS ===

    // GET /api/accounting/chart-of-accounts
    fastify.get('/chart-of-accounts', {
      ...withPermission('accounting', 'chart-of-accounts', 'VIEW'),
      handler: async (request, reply) => {
        // Implementation
      },
    });
  }
  ```

#### 4.2.4 System Domain Routes

- [ ] Create `apps/api/src/domains/system/routes.ts`:

  ```typescript
  import type { FastifyInstance } from 'fastify';
  import { withPermission } from '../../middleware/withPermission';
  import { entityService } from './services/entity.service';
  import { auditQueryService } from '../../services/audit-query.service';

  export async function systemRoutes(fastify: FastifyInstance) {
    // === ENTITIES ===

    // GET /api/system/entities
    fastify.get('/entities', {
      handler: async (request, reply) => {
        const entities = await entityService.list(request.tenantId);
        return reply.send(entities);
      },
    });

    // === USERS ===

    // GET /api/system/users
    fastify.get('/users', {
      ...withPermission('system', 'users', 'VIEW'),
      handler: async (request, reply) => {
        // Implementation
      },
    });

    // POST /api/system/users/invite
    fastify.post('/users/invite', {
      ...withPermission('system', 'users', 'ADMIN'),
      handler: async (request, reply) => {
        // Implementation
      },
    });

    // === AUDIT LOG ===

    // GET /api/system/audit-log
    fastify.get('/audit-log', {
      ...withPermission('system', 'audit-log', 'VIEW'),
      handler: async (request, reply) => {
        const { logs, total } = await auditQueryService.query({
          tenantId: request.tenantId,
          ...request.query,
        });
        return reply.send({ logs, total });
      },
    });
  }
  ```

---

### 4.3 Update Main Server Index

- [ ] Update `apps/api/src/index.ts`:

  ```typescript
  import Fastify from 'fastify';
  import { authMiddleware } from './middleware/auth';
  import { tenantMiddleware } from './middleware/tenant';
  import { securityHeaders } from './middleware/security-headers';
  import { rateLimitMiddleware } from './middleware/rate-limit';
  import { errorHandler } from './middleware/errorHandler';

  // Domain routes
  import { overviewRoutes } from './domains/overview/routes';
  import { moneyMovementRoutes } from './domains/banking/routes';
  import { businessRoutes } from './domains/business/routes';
  import { accountingRoutes } from './domains/accounting/routes';
  import { planningRoutes } from './domains/planning/routes';
  import { aiRoutes } from './domains/ai/routes';
  import { servicesRoutes } from './domains/services/routes';
  import { systemRoutes } from './domains/system/routes';

  const fastify = Fastify({ logger: true });

  async function start() {
    // Global middleware
    await fastify.register(securityHeaders);
    await fastify.register(rateLimitMiddleware);

    // Auth & tenant middleware
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', tenantMiddleware);

    // Error handler
    fastify.setErrorHandler(errorHandler);

    // Register domain routes with prefixes
    await fastify.register(overviewRoutes, { prefix: '/api/overview' });
    await fastify.register(moneyMovementRoutes, { prefix: '/api/banking' });
    await fastify.register(businessRoutes, { prefix: '/api/business' });
    await fastify.register(accountingRoutes, { prefix: '/api/accounting' });
    await fastify.register(planningRoutes, { prefix: '/api/planning' });
    await fastify.register(aiRoutes, { prefix: '/api/ai' });
    await fastify.register(servicesRoutes, { prefix: '/api/services' });
    await fastify.register(systemRoutes, { prefix: '/api/system' });

    // Health check
    fastify.get('/health', async () => ({ status: 'ok' }));

    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('API server running on http://localhost:4000');
  }

  start();
  ```

---

### 4.4 Migration Steps

- [ ] **Step 1:** Create domains/ directory structure (done above)

- [ ] **Step 2:** Move existing services to appropriate domains:

  | Current Location | New Location | Domain |
  |------------------|--------------|--------|
  | `routes/accounts.ts` | `domains/banking/routes.ts` | Money Movement |
  | `routes/transactions.ts` | `domains/banking/routes.ts` | Money Movement |
  | `routes/entities.ts` | `domains/system/routes.ts` | System |
  | `routes/dashboard.ts` | `domains/overview/routes.ts` | Overview |
  | `services/ai.service.ts` | `domains/ai/services/ai.service.ts` | AI |

- [ ] **Step 3:** Update imports in all moved files

- [ ] **Step 4:** Apply RBAC middleware to all routes (per templates above)

- [ ] **Step 5:** Test all endpoints:

  ```bash
  # Test each domain endpoint
  curl http://localhost:4000/api/overview/dashboard
  curl http://localhost:4000/api/banking/accounts
  curl http://localhost:4000/api/accounting/journal-entries
  curl http://localhost:4000/api/system/entities
  ```

- [ ] **Step 6:** Remove old routes/ directory after verification

---

### 4.5 Reorganize Schemas by Domain

- [ ] Create domain-specific schema files:

  ```bash
  mkdir -p apps/api/src/schemas/{overview,banking,business,accounting,system}
  ```

- [ ] Move/create schemas:

  | Schema | Domain |
  |--------|--------|
  | `dashboardMetrics.schema.ts` | overview |
  | `account.schema.ts` | banking |
  | `transaction.schema.ts` | banking |
  | `client.schema.ts` | business |
  | `invoice.schema.ts` | business |
  | `journalEntry.schema.ts` | accounting |
  | `entity.schema.ts` | system |
  | `user.schema.ts` | system |

---

## Verification Checklist

Before marking Phase 4 complete:

- [ ] All 8 domain directories exist with routes.ts
- [ ] All existing routes migrated to appropriate domains
- [ ] RBAC middleware applied to all protected routes
- [ ] Services organized by domain
- [ ] Schemas organized by domain
- [ ] All endpoints respond correctly
- [ ] Old routes/ directory removed
- [ ] API tests pass

**Test commands:**

```bash
pnpm --filter @akount/api test
pnpm --filter @akount/api dev
# Manual test each domain endpoint
```

---

## Handoff

When complete:

- Phase 5 can align web routes with API domains
- Update status in `docs/restructuring/README.md` to ✅ COMPLETE
