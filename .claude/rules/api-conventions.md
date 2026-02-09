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

## Middleware Chain

Requests flow through:
1. **Auth** (`middleware/auth.ts`) — Verify Clerk JWT, set `request.userId`
2. **Tenant** (`middleware/tenant.ts`) — Load tenant, set `request.tenant`
3. **Validation** (Fastify Zod) — Validate request schema
4. **Route Handler** — Execute business logic
