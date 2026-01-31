# API Design Standard

**Criticality:** Recommended (consistency and maintainability)
**Last Updated:** 2026-01-30
**Framework:** Fastify 4.x

---

## Core Principles

1. **RESTful** - Resource-based URLs, standard HTTP methods
2. **Type-Safe** - Zod validation for all inputs/outputs
3. **Consistent** - Uniform error handling, response formats
4. **Documented** - Clear schemas, examples, error codes

---

## Route Structure

### URL Patterns

```
/api/{resource}              GET    - List all
/api/{resource}              POST   - Create one
/api/{resource}/:id          GET    - Get one by ID
/api/{resource}/:id          PATCH  - Update one
/api/{resource}/:id          DELETE - Soft delete one

/api/{resource}/{action}     POST   - Custom action (batch operations)
```

**✅ Examples:**
```
GET    /api/invoices                # List invoices
POST   /api/invoices                # Create invoice
GET    /api/invoices/:id            # Get invoice by ID
PATCH  /api/invoices/:id            # Update invoice
DELETE /api/invoices/:id            # Soft delete invoice

POST   /api/invoices/bulk-send      # Bulk action
GET    /api/invoices/:id/pdf        # Related resource
```

---

## Route Implementation Pattern

### Complete Example

```typescript
// apps/api/src/routes/invoices.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { tenantMiddleware } from '../middleware/tenant'

// Shared schemas
const invoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  date: z.string().datetime(),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  clientId: z.string().uuid()
})

export async function invoicesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>()

  // GET /api/invoices - List all invoices
  server.get(
    '/invoices',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
          status: z.enum(['draft', 'sent', 'paid']).optional()
        }),
        response: {
          200: z.object({
            data: z.array(invoiceSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number()
            })
          })
        }
      }
    },
    async (request, reply) => {
      const { page, limit, status } = request.query
      const skip = (page - 1) * limit

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            tenantId: request.tenantId,
            status,
            deletedAt: null
          },
          skip,
          take: limit,
          orderBy: { date: 'desc' }
        }),
        prisma.invoice.count({
          where: {
            tenantId: request.tenantId,
            status,
            deletedAt: null
          }
        })
      ])

      return {
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  )

  // GET /api/invoices/:id - Get one invoice
  server.get(
    '/invoices/:id',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        params: z.object({
          id: z.string().uuid()
        }),
        response: {
          200: invoiceSchema,
          404: z.object({
            error: z.string(),
            code: z.string()
          })
        }
      }
    },
    async (request, reply) => {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
          deletedAt: null
        }
      })

      if (!invoice) {
        return reply.status(404).send({
          error: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        })
      }

      return invoice
    }
  )

  // POST /api/invoices - Create invoice
  server.post(
    '/invoices',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        body: z.object({
          invoiceNumber: z.string().min(1),
          date: z.string().datetime(),
          amount: z.number().int().positive(),
          currency: z.string().length(3).default('CAD'),
          clientId: z.string().uuid(),
          lines: z.array(z.object({
            description: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().int().positive(),
            amount: z.number().int().positive()
          }))
        }),
        response: {
          201: invoiceSchema,
          400: z.object({
            error: z.string(),
            code: z.string(),
            details: z.any().optional()
          })
        }
      }
    },
    async (request, reply) => {
      const invoice = await prisma.invoice.create({
        data: {
          ...request.body,
          tenantId: request.tenantId,
          createdBy: request.userId,
          updatedBy: request.userId
        }
      })

      return reply.status(201).send(invoice)
    }
  )

  // PATCH /api/invoices/:id - Update invoice
  server.patch(
    '/invoices/:id',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          invoiceNumber: z.string().min(1).optional(),
          date: z.string().datetime().optional(),
          amount: z.number().int().positive().optional(),
          status: z.enum(['draft', 'sent', 'paid']).optional()
        }),
        response: {
          200: invoiceSchema,
          404: z.object({ error: z.string(), code: z.string() })
        }
      }
    },
    async (request, reply) => {
      // Check ownership
      const existing = await prisma.invoice.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
          deletedAt: null
        }
      })

      if (!existing) {
        return reply.status(404).send({
          error: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        })
      }

      const updated = await prisma.invoice.update({
        where: { id: request.params.id },
        data: {
          ...request.body,
          updatedBy: request.userId
        }
      })

      return updated
    }
  )

  // DELETE /api/invoices/:id - Soft delete
  server.delete(
    '/invoices/:id',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          204: z.void(),
          404: z.object({ error: z.string(), code: z.string() })
        }
      }
    },
    async (request, reply) => {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.tenantId,
          deletedAt: null
        }
      })

      if (!invoice) {
        return reply.status(404).send({
          error: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        })
      }

      await prisma.invoice.update({
        where: { id: request.params.id },
        data: {
          deletedAt: new Date(),
          updatedBy: request.userId
        }
      })

      return reply.status(204).send()
    }
  )
}
```

---

## Validation Patterns

### Common Schemas (Reusable)

```typescript
// apps/api/src/schemas/common.ts
import { z } from 'zod'

export const uuidSchema = z.string().uuid()
export const dateSchema = z.string().datetime()
export const currencySchema = z.string().length(3).toUpperCase()
export const moneySchema = z.number().int()  // Always cents

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export const sortQuerySchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})
```

---

## Error Handling

### Standard Error Format

```typescript
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {  // Optional
    "field": "validationError"
  }
}
```

### Error Codes

```typescript
// apps/api/src/lib/errors.ts
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Business Logic
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVOICE_ALREADY_PAID: 'INVOICE_ALREADY_PAID',

  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const

// Error handler middleware
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      details: error.errors
    })
  }

  if (error.code === 'P2002') {  // Prisma unique constraint
    return reply.status(409).send({
      error: 'Resource already exists',
      code: ErrorCodes.ALREADY_EXISTS
    })
  }

  console.error(error)
  return reply.status(500).send({
    error: 'Internal server error',
    code: ErrorCodes.INTERNAL_ERROR
  })
}
```

---

## Response Formats

### Success Responses

**Single Resource:**
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2"
}
```

**List of Resources:**
```json
{
  "data": [
    { "id": "uuid1", "field": "value" },
    { "id": "uuid2", "field": "value" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Action Response:**
```json
{
  "success": true,
  "message": "Invoices sent successfully",
  "count": 5
}
```

---

## Middleware Patterns

### Required Middleware Stack

```typescript
// apps/api/src/index.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

const fastify = Fastify({ logger: true })

// 1. CORS
await fastify.register(cors, {
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true
})

// 2. Zod validation
fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

// 3. Error handler
fastify.setErrorHandler(errorHandler)

// 4. Routes with auth middleware
await fastify.register(invoicesRoutes, { prefix: '/api' })
```

---

## Testing API Routes

### Unit Test Pattern

```typescript
// tests/routes/invoices.test.ts
import { build } from '../helper'

describe('GET /api/invoices', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await build()
  })

  afterAll(async () => {
    await app.close()
  })

  it('requires authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/invoices'
    })

    expect(response.statusCode).toBe(401)
  })

  it('lists invoices for tenant', async () => {
    const token = await getAuthToken()

    const response = await app.inject({
      method: 'GET',
      url: '/api/invoices',
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('data')
    expect(response.json()).toHaveProperty('pagination')
  })
})
```

---

## Related Standards

- `docs/standards/multi-tenancy.md` - Tenant filtering in APIs
- `docs/standards/security.md` - Input validation, auth
- `docs/standards/financial-data.md` - Money handling in APIs
- `docs/standards/` - Akount domain standards

---

**Keep APIs consistent, type-safe, and well-documented.**
