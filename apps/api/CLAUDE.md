# API Context (apps/api)

> **Loaded automatically** when Claude accesses files in `apps/api/`
> **Last verified:** 2026-02-09

## Middleware Chain

Requests flow through this pipeline:

1. **Auth** (`middleware/auth.ts`) — Verify Clerk JWT → `request.userId`
2. **Tenant** (`middleware/tenant.ts`) — Load tenant membership → `request.tenant`
3. **Zod Validation** (Fastify type provider) — Validate request schema
4. **Route Handler** — Execute business logic via service layer

**TenantContext structure:**
```typescript
{
  tenantId: string,
  userId: string,
  role: TenantUserRole  // OWNER, ADMIN, ACCOUNTANT, VIEWER
}
```

## Domain Structure (Actual Folders)

| Domain | Folder | Built Endpoints |
|--------|--------|----------------|
| Overview | `domains/overview/` | Dashboard metrics, summaries |
| Banking | `domains/banking/` | Accounts (CRUD, pagination) |
| Invoicing | `domains/invoicing/` | Stub (planned) |
| Clients | `domains/clients/` | Stub (planned) |
| Vendors | `domains/vendors/` | Stub (planned) |
| Accounting | `domains/accounting/` | Stub (planned) |

**Note:** Folder is `banking/`, NOT `money-movement/`.

## Built Endpoints

### Dashboard
- `GET /api/dashboard/metrics` — KPIs with entity/currency filters

### Accounts (Banking)
- `GET /api/banking/accounts` — List with cursor pagination
- `POST /api/banking/accounts` — Create new account
- `PATCH /api/banking/accounts/:id` — Update account
- `DELETE /api/banking/accounts/:id` — Soft delete (sets `deletedAt`)

All routes enforce tenant isolation via middleware.

## Service Pattern

**Every service function signature:**
```typescript
export async function createResource(
  data: CreateResourceInput,
  ctx: TenantContext  // Always pass context
): Promise<Resource> {
  // ALWAYS filter by tenantId
  return prisma.resource.create({
    data: {
      ...data,
      entityId: data.entityId,
      // Verify entity belongs to tenant
      entity: {
        connect: {
          id_tenantId: {
            id: data.entityId,
            tenantId: ctx.tenantId
          }
        }
      }
    }
  })
}
```

## Test Pattern (Vitest)

Tests in `apps/api/__tests__/`:
- **Service tests:** Test business logic with mock Prisma
- **Route tests:** Test HTTP layer with test server

**62 tests passing** (as of 2026-02-08):
- Account service: 23 tests
- Account routes: 11 tests
- Dashboard service + routes: 16 tests
- FX rate service: 12 tests

## Key Files

| File | Purpose |
|------|---------|
| `src/app.ts` | Fastify instance creation, plugin registration |
| `src/middleware/auth.ts` | Clerk JWT verification |
| `src/middleware/tenant.ts` | Tenant membership loading |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/domains/<domain>/routes/index.ts` | Route registration |

## Error Responses

Standard format:
```typescript
{ error: string, details?: any }
```

Status codes:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Internal error

## Prisma Usage

**Always filter by tenantId:**
```typescript
// For tenant-scoped models
await prisma.category.findMany({
  where: { tenantId: ctx.tenantId }
})

// For entity-scoped models
await prisma.invoice.findMany({
  where: { entity: { tenantId: ctx.tenantId } }
})
```

**Soft delete filter:**
```typescript
where: { deletedAt: null }
```
