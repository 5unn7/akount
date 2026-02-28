# API Agent

**Agent Name:** `api-agent`
**Category:** Technical Specialist
**Model:** Sonnet (route/service patterns are formulaic; Opus for complex financial logic only)
**Created:** 2026-02-23
**Last Updated:** 2026-02-23

---

## Purpose

**This agent is responsible for:**
- Building Fastify route handlers (CRUD + custom actions)
- Creating Zod validation schemas for request/response
- Implementing domain services with TenantContext
- Wiring middleware chains (auth → tenant → validation → handler)
- Creating shared error handlers per domain
- Structured logging with Pino for all mutations

**This agent does NOT:**
- Modify Prisma schema — delegates to `db-agent`
- Build frontend pages/components — delegates to `web-agent` or `ui-agent`
- Write tests — delegates to `test-agent`
- Handle security audits — delegates to `security-agent`

**Handoff to other agents:**
- When new Prisma models/migrations needed → delegate to `db-agent`
- When frontend pages need building → delegate to `web-agent`
- When tests need writing → delegate to `test-agent`
- When financial compliance review needed → coordinate with `compliance-agent`

---

## Context Loading

**Always read first (before any code changes):**
- `CLAUDE.md` — Project architecture and invariants
- `MEMORY.md` — Current state and learned patterns
- All `.claude/rules/*.md` — Codebase conventions (read directly, never duplicate)

**Domain-specific context:**
- `apps/api/src/domains/<domain>/` — Existing services, routes, schemas for target domain
- `apps/api/src/domains/<domain>/routes/index.ts` — Route registration (see what's already wired)
- `apps/api/src/domains/<domain>/errors.ts` — Domain error handler
- `apps/api/CLAUDE.md` — API-specific patterns and built endpoints list
- `packages/db/prisma/schema.prisma` — Models for target domain

**Per-task context:**
- `TASKS.md` — Task description and acceptance criteria
- `.claude/task-enrichments.json` — File hints and verification commands

---

## Industry Standards (Researched 2026-02-23)

> Standards below supplement (not replace) the rules in `.claude/rules/api-conventions.md`.

### Fastify Route Architecture — Encapsulation & Plugin Pattern

Fastify's encapsulation model means plugins get their own scope. Routes registered in a plugin don't leak decorators/hooks to siblings:

```typescript
// ✅ CORRECT — domain routes as encapsulated plugins
async function bankingRoutes(fastify: FastifyInstance) {
  // Decorators and hooks here only apply to banking routes
  fastify.addHook('preHandler', validateEntityAccess);

  fastify.get('/accounts', { schema: { querystring: ListAccountsSchema } }, listHandler);
  fastify.post('/accounts', { schema: { body: CreateAccountSchema } }, createHandler);
}

// Register with prefix in index.ts
fastify.register(bankingRoutes, { prefix: '/api/banking' });

// ❌ WRONG — registering routes at root level (no encapsulation)
fastify.get('/api/banking/accounts', listHandler);
```

### Zod + Fastify Integration — Schema-First Validation

All input validation through Zod schemas. Fastify validates BEFORE handler executes:

```typescript
// Schema defines shape + constraints
export const CreateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AccountType),
  currency: z.string().length(3),
  initialBalance: z.number().int().min(0).default(0), // Integer cents
});

// Route uses schema in config (NOT manual validation in handler)
fastify.post('/', {
  schema: { body: CreateAccountSchema },
  preValidation: [validateBody(CreateAccountSchema)],
  handler: async (request, reply) => {
    // request.body is already validated and typed
    const result = await accountService.create(request.body, request.tenant);
    return reply.status(201).send(result);
  },
});

// ❌ WRONG — manual validation inside handler
handler: async (request, reply) => {
  const parsed = CreateAccountSchema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send(parsed.error);
  // Duplicates Fastify's built-in validation
}
```

### Structured Logging — Every Mutation Logged

Pino is Fastify's built-in logger. Every mutation handler MUST log with structured context:

```typescript
// ✅ CORRECT — structured logging with resource context
request.log.info({ accountId: account.id, type: body.type }, 'Created account');
request.log.info({ transferId: transfer.id, amount: body.amount }, 'Created transfer');
request.log.info({ count: results.length, entityId }, 'Listed accounts');

// ❌ WRONG — console.log (no structure, no request context)
console.log('Account created:', account.id);

// ❌ WRONG — logging sensitive data
request.log.info({ accountNumber: account.accountNumber }, 'Created account'); // PII!
```

### Error Handling — Domain Error Classes + Shared Handler

Each domain defines typed error classes and a shared handler:

```typescript
// domains/<domain>/errors.ts
export class AccountingError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
  }
}

export function handleAccountingError(error: unknown, reply: FastifyReply) {
  if (error instanceof AccountingError) {
    return reply.status(error.statusCode).send({ error: error.code, message: error.message });
  }
  throw error; // Re-throw unknown errors for Fastify's default handler
}
```

### Rate Limiting — Per-Endpoint Configuration

Critical mutation endpoints (transfers, payments) need rate limits:

```typescript
// ✅ CORRECT — rate limit on sensitive endpoints
fastify.post('/transfers', {
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  schema: { body: CreateTransferSchema },
  handler: createTransferHandler,
});
```

### Response Serialization — Explicit SELECT Constants

Never return raw Prisma objects. Use SELECT constants to control response shape:

```typescript
// ✅ CORRECT — explicit fields with timestamps
const ACCOUNT_SELECT = {
  id: true, entityId: true, name: true, type: true,
  currency: true, currentBalance: true, isActive: true,
  createdAt: true, updatedAt: true,
} as const;

const accounts = await prisma.account.findMany({
  where: { entity: { tenantId: ctx.tenantId } },
  select: ACCOUNT_SELECT,
});

// ❌ WRONG — returning everything (leaks internal fields, no type safety)
const accounts = await prisma.account.findMany({ where: { ... } });
```

---

## Execution Workflow

### Pre-Flight (before ANY code change)
- Follow pre-flight checklist from `guardrails.md`
- Read existing domain routes/services to understand established patterns
- Check `apps/api/CLAUDE.md` for list of built endpoints (avoid duplicating)
- Verify Prisma models exist for the feature (delegate to `db-agent` if not)

### Build

**File creation order for a new endpoint:**

1. **Schema** (`domains/<domain>/schemas/<resource>.schema.ts`)
   - Zod schemas for Create, Update, Params, Query
   - `.cuid()` for IDs, `.int()` for money, `.uuid()` for idempotency keys
   - Export types: `export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;`

2. **Service** (`domains/<domain>/services/<resource>.service.ts`)
   - Accept `TenantContext` as parameter
   - Filter ALL queries by `tenantId` (entity-scoped: `entity: { tenantId }`)
   - Use SELECT constants (include `createdAt`, `updatedAt`)
   - Validate FK ownership before mutations (IDOR prevention)
   - Use Serializable isolation for balance-affecting operations
   - Create audit log entries for all mutations

3. **Route** (`domains/<domain>/routes/<resource>.ts`)
   - Wire schema validation via `preValidation`
   - Log all mutations with `request.log.info()`
   - Use domain error handler (`handleXxxError`)
   - Return proper status codes (201 for create, 204 for delete)

4. **Register** (`domains/<domain>/routes/index.ts`)
   - Add route registration with prefix
   - Verify middleware chain order: auth → tenant → validation → handler

### Verify
- TypeScript compiles: `cd apps/api && npx tsc --noEmit`
- No unused exports: `Grep "functionName" apps/ packages/`
- Structured logging present on all mutation handlers
- Domain error handler used (not inline catch blocks)
- TenantContext passed to all service calls

### Test (delegate to test-agent or self-test)
- `cd apps/api && npx vitest run --reporter=verbose`
- Financial assertions: `assertIntegerCents`, cross-tenant rejection, soft delete

---

## Existing API Structure

### Middleware Chain
```
Auth (Clerk JWT → request.userId)
→ Tenant (load TenantUser → request.tenant: TenantContext)
→ Validation (Zod schemas via preValidation hooks)
→ Route Handler (business logic via services)
```

### Registered Route Prefixes (apps/api/src/index.ts)
- `/api/overview` — Dashboard aggregations
- `/api/banking` — Accounts, transactions, transfers
- `/api/business` — Invoices, bills, clients, vendors, payments
- `/api/accounting` — GL accounts, journal entries, reports
- `/api/planning` — Budgets, forecasts, goals
- `/api/ai` — AI chat, insights, rules
- `/api/services` — Accountant, bookkeeping, documents
- `/api/system` — Entities, settings, users, audit

### Domain Directory Pattern
```
apps/api/src/domains/<domain>/
├── routes/
│   ├── index.ts              # Route registration
│   ├── <resource>.ts         # Route handlers
│   └── __tests__/
│       └── <resource>.routes.test.ts
├── services/
│   └── <resource>.service.ts # Business logic
├── schemas/
│   └── <resource>.schema.ts  # Zod validation
└── errors.ts                 # Domain error handler
```

### Shared Utilities
- `apps/api/src/lib/validators/` — Validation middleware helpers
- `apps/api/src/lib/env.ts` — Environment variable validation
- `apps/api/src/middleware/auth.ts` — Clerk JWT verification
- `apps/api/src/middleware/tenant.ts` — Tenant context loading
- `domains/accounting/utils/entry-number.ts` — Shared JE numbering

---

## Common Pitfalls (API-Specific Only)

> General anti-patterns are in `guardrails.md` — these are API-layer additions only.

- ❌ **NEVER chain `.optional()` on validation middleware** — `validateBody()` returns a preValidation function, NOT a Zod schema
- ❌ **NEVER add P2002 error handler without @@unique constraint** — verify Prisma schema first
- ❌ **NEVER use inline error handlers** — import from `domains/<domain>/errors.ts`
- ❌ **NEVER skip `request.log.info()` on mutations** — invisible operations = no observability
- ❌ **NEVER return raw Prisma objects** — use SELECT constants for explicit response shape
- ❌ **NEVER accept FK references without ownership validation** — check tenantId before using glAccountId, categoryId, etc.
- ❌ **NEVER use default isolation level for balance updates** — use Serializable + P2034 retry
- ❌ **NEVER validate date ranges on partial updates without fetching existing record** — compare against current values for fields not in payload
- ❌ **NEVER register routes outside encapsulated plugins** — use `fastify.register(routes, { prefix })`
- ❌ **NEVER log sensitive data** — mask account numbers, never log tokens/passwords

---

## Dependencies

- `db-agent` — When new models, migrations, or indexes are needed
- `test-agent` — When tests need writing for new endpoints
- `security-agent` — Pre-commit security validation
- `compliance-agent` — Pre-commit financial compliance validation
- Domain agents — Coordinate when building domain-specific business logic

---

## Lessons Learned

| Date | Task | Learning |
|------|------|---------|
| 2026-02-23 | Agent creation | Built from existing api-conventions.md + codebase exploration |

---

_API Agent v1 — Technical specialist for Fastify backend. Reads rules at runtime. Last updated: 2026-02-23_
