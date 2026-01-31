# Multi-Tenancy Standard

**Criticality:** ZERO TOLERANCE - Violations are security vulnerabilities
**Last Updated:** 2026-01-30

---

## Core Principle

**EVERY database query MUST filter by `tenantId`** - NO EXCEPTIONS

Cross-tenant data leaks are catastrophic security failures. Tenant isolation is enforced at multiple levels.

---

## Required Patterns

### 1. Database Queries - ALWAYS Filter by tenantId

**✅ CORRECT:**
```typescript
// Get invoice for current user's tenant
const invoice = await prisma.invoice.findFirst({
  where: {
    id: invoiceId,
    tenantId: user.tenantId  // REQUIRED
  }
})

// List all accounts for tenant
const accounts = await prisma.account.findMany({
  where: {
    tenantId: user.tenantId  // REQUIRED
  }
})

// Update with tenantId check
await prisma.transaction.update({
  where: { id: transactionId },
  data: { amount: newAmount },
  // Prisma doesn't enforce tenant in update, so check first:
})

// BETTER: Check before update
const transaction = await prisma.transaction.findFirst({
  where: { id: transactionId, tenantId: user.tenantId }
})
if (!transaction) throw new Error('Not found')
await prisma.transaction.update({
  where: { id: transactionId },
  data: { amount: newAmount }
})
```

**❌ WRONG:**
```typescript
// SECURITY VULNERABILITY: Missing tenantId check
const invoice = await prisma.invoice.findFirst({
  where: { id: invoiceId }  // Any tenant can access any invoice!
})

// SECURITY VULNERABILITY: No tenant filter
const accounts = await prisma.account.findMany()  // Exposes all tenants' data!

// SECURITY VULNERABILITY: Update without tenant check
await prisma.transaction.update({
  where: { id: transactionId },  // Can update other tenant's data!
  data: { amount: newAmount }
})
```

### 2. API Routes - Validate Tenant

**✅ CORRECT:**
```typescript
// GET /api/invoices/:id
fastify.get('/invoices/:id', {
  onRequest: [authMiddleware],  // Populates request.userId
  schema: {
    params: z.object({ id: z.string().uuid() })
  }
}, async (request, reply) => {
  // 1. Get user's tenant
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId: request.userId }
  })

  if (!tenantUser) {
    return reply.status(403).send({ error: 'No tenant access' })
  }

  // 2. Query with tenantId
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: request.params.id,
      tenantId: tenantUser.tenantId  // REQUIRED
    }
  })

  if (!invoice) {
    return reply.status(404).send({ error: 'Invoice not found' })
  }

  return invoice
})
```

**❌ WRONG:**
```typescript
// SECURITY VULNERABILITY
fastify.get('/invoices/:id', async (request, reply) => {
  // Missing auth check
  // Missing tenant check
  const invoice = await prisma.invoice.findFirst({
    where: { id: request.params.id }
  })
  return invoice  // Leaks data across tenants!
})
```

### 3. Next.js Server Components - Get Tenant Context

**✅ CORRECT:**
```typescript
// app/(dashboard)/invoices/[id]/page.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export default async function InvoicePage({
  params
}: {
  params: { id: string }
}) {
  // 1. Get authenticated user
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // 2. Get tenant
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId }
  })

  if (!tenantUser) {
    return <div>No tenant access</div>
  }

  // 3. Query with tenant filter
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.id,
      tenantId: tenantUser.tenantId  // REQUIRED
    }
  })

  if (!invoice) notFound()

  return <InvoiceDisplay invoice={invoice} />
}
```

**❌ WRONG:**
```typescript
// SECURITY VULNERABILITY
export default async function InvoicePage({ params }) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id }  // Missing tenant check!
  })
  return <InvoiceDisplay invoice={invoice} />
}
```

---

## Middleware Enforcement

### API Middleware Pattern

Create reusable middleware to inject tenant context:

```typescript
// apps/api/src/middleware/tenant.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
    tenantId?: string
  }
}

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.userId) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId: request.userId },
    select: { tenantId: true }
  })

  if (!tenantUser) {
    return reply.status(403).send({ error: 'No tenant access' })
  }

  request.tenantId = tenantUser.tenantId
}

// Usage in routes:
fastify.get('/invoices', {
  onRequest: [authMiddleware, tenantMiddleware]
}, async (request, reply) => {
  // request.tenantId is now available and validated
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: request.tenantId }
  })
  return invoices
})
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting Tenant in Counts/Aggregations

```typescript
// WRONG: Counts all tenants
const invoiceCount = await prisma.invoice.count()

// CORRECT: Count for tenant only
const invoiceCount = await prisma.invoice.count({
  where: { tenantId: user.tenantId }
})
```

### ❌ Pitfall 2: Related Data Access

```typescript
// WRONG: Accessing related entity without tenant check
const invoice = await prisma.invoice.findFirst({
  where: { id: invoiceId, tenantId: user.tenantId }
})
// This client might belong to different tenant!
const client = await prisma.client.findFirst({
  where: { id: invoice.clientId }  // Missing tenant check
})

// CORRECT: Related data also needs tenant filter
const invoice = await prisma.invoice.findFirst({
  where: { id: invoiceId, tenantId: user.tenantId },
  include: {
    client: true  // Prisma relation automatically includes tenant check
  }
})

// OR explicitly check:
const client = await prisma.client.findFirst({
  where: {
    id: invoice.clientId,
    tenantId: user.tenantId
  }
})
```

### ❌ Pitfall 3: Bulk Operations

```typescript
// WRONG: Updates all records across tenants
await prisma.transaction.updateMany({
  where: { status: 'pending' },  // No tenant filter!
  data: { status: 'processing' }
})

// CORRECT: Bulk operations need tenant filter
await prisma.transaction.updateMany({
  where: {
    status: 'pending',
    tenantId: user.tenantId  // REQUIRED
  },
  data: { status: 'processing' }
})
```

### ❌ Pitfall 4: Transactions (Prisma Transactions)

```typescript
// CORRECT: All queries in transaction need tenant filter
await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.create({
    data: {
      tenantId: user.tenantId,  // Include in create
      clientId: clientId,
      amount: 1000
    }
  })

  await tx.journalEntry.create({
    data: {
      tenantId: user.tenantId,  // Include in create
      sourceType: 'Invoice',
      sourceId: invoice.id,
      lines: {
        create: [
          { glAccountId: '...', debitAmount: 1000, creditAmount: 0 },
          { glAccountId: '...', debitAmount: 0, creditAmount: 1000 }
        ]
      }
    }
  })
})
```

---

## Security Audit Checklist

When reviewing code, check:

- [ ] ALL `findFirst`/`findMany`/`findUnique` have `tenantId` in `where`
- [ ] ALL `count`/`aggregate` operations filter by `tenantId`
- [ ] ALL `update`/`updateMany` operations check tenant ownership first
- [ ] ALL `delete`/`deleteMany` operations check tenant ownership (use soft delete!)
- [ ] ALL API routes use auth + tenant middleware
- [ ] ALL Next.js Server Components get tenant from auth
- [ ] ALL creates include `tenantId` in data
- [ ] ALL Prisma transactions enforce tenant isolation per query
- [ ] No raw SQL queries that bypass tenant filtering
- [ ] Related data access through Prisma relations (auto-enforced) or explicit checks

---

## Testing Tenant Isolation

### Unit Test Pattern

```typescript
// tests/tenant-isolation.test.ts
describe('Tenant Isolation', () => {
  it('prevents cross-tenant invoice access', async () => {
    // Create two tenants
    const tenant1 = await prisma.tenant.create({ data: { name: 'Tenant 1' } })
    const tenant2 = await prisma.tenant.create({ data: { name: 'Tenant 2' } })

    // Create invoice for tenant 1
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant1.id,
        amount: 1000,
        // ... other fields
      }
    })

    // Try to access from tenant 2 (should fail)
    const result = await prisma.invoice.findFirst({
      where: {
        id: invoice.id,
        tenantId: tenant2.id  // Different tenant
      }
    })

    expect(result).toBeNull()  // Should not find
  })
})
```

---

## Future: Row-Level Security (Phase 8)

In Phase 8 (Production), we'll add PostgreSQL Row-Level Security:

```sql
-- Enables automatic tenant filtering at database level
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON invoices
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

Until then, **middleware and query filtering are critical**.

---

## Related Standards

- `docs/standards/security.md` - Input validation, auth
- `docs/standards/api-design.md` - API route patterns
- `docs/architecture/ARCHITECTURE-HOOKS.md` - Future RLS implementation

---

**Remember: Tenant isolation violations = data breaches. Zero tolerance.**
