# API Conventions

---
paths:

- "apps/api/**"

---

## Route → Schema → Service → Register Pattern

Every API endpoint follows this structure:

1. **Schema** (`domains/<domain>/schemas/<resource>.schema.ts`):

```typescript
import { z } from 'zod'

export const CreateResourceSchema = z.object({
  name: z.string().min(1),
  amount: z.number().int() // Integer cents
})
```

2. **Service** (`domains/<domain>/services/<resource>.service.ts`):

```typescript
export async function createResource(
  data: CreateResourceInput,
  ctx: TenantContext
) {
  return prisma.resource.create({
    data: { ...data, tenantId: ctx.tenantId }
  })
}
```

3. **Route** (`domains/<domain>/routes/<resource>.ts`):

```typescript
fastify.post('/', {
  schema: { body: CreateResourceSchema },
  handler: async (request, reply) => {
    const result = await createResource(request.body, request.tenant)
    return reply.status(201).send(result)
  }
})
```

4. **Register** (`domains/<domain>/routes/index.ts`)

## Zod Validation Required

All endpoints MUST validate input with Zod schemas:

- Use `.cuid()` for ID params
- Use `.int()` for monetary amounts
- Use `.email()` for emails
- Use `.min()` / `.max()` for strings and numbers

## TenantContext in Every Service

Service functions MUST accept `TenantContext`:

```typescript
export interface TenantContext {
  tenantId: string
  userId: string
  role: TenantUserRole
}
```

Passed from middleware via `request.tenant`.

## Error Response Format

Standard error responses:

```typescript
return reply.status(400).send({
  error: 'Validation failed',
  details: zodError.errors
})
```

Status codes:

- 400: Bad Request (validation)
- 401: Unauthorized (missing auth)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Structured Logging (REQUIRED)

**NEVER use `console.log`, `console.error`, or `console.warn` in production code.** Fastify ships with pino — use it.

**Available loggers:**

- `request.log.info/error()` — in route handlers (request-scoped, includes request ID)
- `server.log.info/error()` — in services and startup code

### Every Route Handler MUST Log

Every route handler that performs a mutation (POST, PATCH, DELETE) MUST include `request.log.info()` with relevant context. GET endpoints SHOULD log at minimum for list operations (with result count).

```typescript
// ✅ CORRECT — every handler logs with structured context
request.log.info({ count: results.length }, 'Listed tax rates');
request.log.info({ taxRateId: params.id }, 'Retrieved tax rate');
request.log.info({ taxRateId: taxRate.id, code: body.code }, 'Created tax rate');
request.log.info({ taxRateId: params.id }, 'Updated tax rate');
request.log.info({ taxRateId: params.id }, 'Deactivated tax rate');

// ❌ WRONG — route handler with no logging (invisible operations)
async (request, reply) => {
  const result = await service.create(body);
  return reply.status(201).send(result); // No log = no observability
}

// ❌ WRONG — console.log in production
console.log('Transaction created:', transactionId)
console.error('Error:', error.message)
```

**Exception:** `apps/api/src/lib/env.ts` may use `console.log` for pre-boot validation (runs before pino is initialized).

**Fastify config:** `Fastify({ logger: true })` in `apps/api/src/index.ts` — pino is already wired up.

## Middleware Chain

Requests flow through:

1. **Auth** (`middleware/auth.ts`) — Verify Clerk JWT, set `request.userId`
2. **Tenant** (`middleware/tenant.ts`) — Load tenant, set `request.tenant`
3. **Validation** (Fastify Zod) — Validate request schema
4. **Route Handler** — Execute business logic

### Validation Middleware Anti-Patterns

`validateBody()`, `validateParams()`, `validateQuery()` return **Fastify preValidation functions**, NOT Zod schemas. NEVER chain Zod methods on them:

```typescript
// ❌ WRONG — .optional() is a Zod method, not a function method
preValidation: [validateBody(Schema).optional()]

// ✅ CORRECT — omit validation if body is optional for the endpoint
preValidation: [validateParams(ParamsSchema)]
// (no body validation needed for DELETE)
```

## Prisma Schema Consistency

### Verify Constraints Before Error Handlers

Before catching `P2002` (unique constraint violation), verify the `@@unique` constraint actually exists in the Prisma schema. Dead error handlers create false confidence.

```typescript
// ❌ BAD — catch P2002 but no @@unique exists → dead code, duplicates slip through
catch (error) {
  if (error.code === 'P2002') return reply.status(409).send({ error: 'Duplicate' });
}

// ✅ GOOD — verify constraint exists first
// schema.prisma: @@unique([entityId, code])
// THEN add the catch handler
```

### Partial Update Date Validation

When validating date ranges on partial updates (PATCH), fetch the existing record first and validate against its current values for any field NOT in the update payload:

```typescript
// ❌ WRONG — only validates when BOTH dates in payload
if (data.effectiveFrom && data.effectiveTo) {
  if (data.effectiveFrom >= data.effectiveTo) throw new Error('Invalid range');
}

// ✅ CORRECT — check against existing record for partial updates
const fromDate = data.effectiveFrom ?? existing.effectiveFrom;
const toDate = data.effectiveTo ?? existing.effectiveTo;
if (fromDate && toDate && fromDate >= toDate) throw new Error('Invalid range');
```

## Prisma SELECT Constants (REQUIRED)

When using `select` constants to limit returned fields, ALWAYS include `createdAt` and `updatedAt`. Omitting timestamps prevents the frontend from displaying "last updated" info and makes debugging harder.

```typescript
// ✅ CORRECT — timestamps included
const TAX_RATE_SELECT = {
  id: true, entityId: true, code: true, name: true, rate: true,
  createdAt: true, updatedAt: true,
} as const;

// ❌ WRONG — timestamps omitted
const TAX_RATE_SELECT = {
  id: true, entityId: true, code: true, name: true, rate: true,
} as const;
```

## DRY Error Handlers (Domain-Level)

Each domain MUST have a shared error handler in its `errors.ts` file. Route files import this handler instead of defining their own.

```typescript
// ✅ CORRECT — shared handler in domain errors.ts
import { handleAccountingError } from '../errors';

// In route handler:
catch (error) { return handleAccountingError(error, reply); }

// ❌ WRONG — inline error handler duplicated across route files
catch (error) {
  if (error instanceof AccountingError) {
    return reply.status(error.statusCode).send({ error: error.code, message: error.message });
  }
  throw error;
}
```

**Pattern:** Define `handleXxxError(error, reply)` in `domains/<domain>/errors.ts`, import in all route files for that domain.

## Shared Domain Utilities

When 3+ services need the same function, extract it to `domains/<domain>/utils/`. This prevents duplication drift and ensures consistent behavior.

### Canonical Utility Locations

| Utility | Location | Import |
|---------|----------|--------|
| `generateEntryNumber` | `domains/accounting/utils/entry-number.ts` | JE sequential numbering (JE-001, JE-002) |

### JE Entry Number Generation

**ALWAYS** use the shared utility. NEVER inline JE number generation or create private methods.

```typescript
// ✅ CORRECT — import shared utility
import { generateEntryNumber } from '../utils/entry-number';

// Inside a $transaction:
const entryNumber = await generateEntryNumber(tx, entityId);

// ❌ WRONG — inline generation (NaN risk if format unexpected)
const nextNum = `JE-${parseInt(lastEntry.entryNumber.replace('JE-', '')) + 1}`;

// ❌ WRONG — duplicated private method
private async generateEntryNumber(tx, entityId) { /* same code as utility */ }
```

**Key rules:**
- MUST be called within a Prisma `$transaction` (prevents race conditions)
- Uses regex `/JE-(\d+)/` extraction (safe against unexpected formats)
- Returns `JE-001` if no prior entries exist

## Single Responsibility Principle (SRP)

**Every file should have ONE clear purpose.** Can you describe it without using "and"?

### ✅ Good Examples (Current Pattern)

```typescript
// account.service.ts - ONE responsibility: Account data operations
class AccountService {
  listAccounts() { }
  getAccount() { }
  createAccount() { }
}

// duplication.service.ts - ONE responsibility: Duplicate detection
class DuplicationService {
  detectDuplicates() { }
}

// parser.service.ts - ONE responsibility: Parse bank statements
// (Multiple formats is still ONE job: parsing)
```

### ❌ Anti-Patterns to Avoid

```typescript
// ❌ BAD: Service doing HTTP + business logic + email
class AccountService {
  handleRequest() { }      // HTTP concern - belongs in route
  createAccount() { }      // Business logic - OK
  sendWelcomeEmail() { }   // Email concern - belongs in email service
}

// ❌ BAD: Service mixing unrelated domains
class MixedService {
  createAccount() { }      // Banking domain
  createInvoice() { }      // Invoicing domain
  sendEmail() { }          // Communication domain
}
```

### When to Split Files

Split when **any** of these occur:

- File exceeds **~300-400 lines** with distinct sections
- Testing requires complex mocking
- File has multiple reasons to change
- Team members frequently conflict on same file

**Don't split prematurely** - wait for actual pain points.
