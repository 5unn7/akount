# Slice 4: Business Domain — Full-Stack Implementation Plan

**Created:** 2026-02-14
**Parent Plan:** `docs/plans/2026-02-14-financial-clarity-design-overhaul-v2.md`
**Status:** Ready to Execute
**Slice:** 4 of 6 (Complete invoicing, clients, vendors - backend + frontend + tests)
**Depends on:** Slice 0 ✅, Slice 1 ✅, Slice 2 ✅ (shared components)

---

## Overview

Build the complete Business domain: Invoices, Bills, Clients, Vendors. Full-stack implementation with backend APIs, frontend integration, and comprehensive testing. No mock data - real database integration using existing Prisma models.

**Scope:**
- **Backend:** CRUD APIs for invoices, bills, clients, vendors (routes + services + schemas + tests)
- **Frontend:** Pages, components, API integration (StatsGrid, tables, DetailPanel)
- **Tests:** Backend unit tests (vitest), frontend component tests (RTL)
- **Design:** Financial Clarity aesthetic with semantic tokens

**Philosophy:** Backend-first. Build and test APIs before wiring frontend.

---

## Success Criteria

**Backend:**
- [ ] Invoices API: CRUD + list with filters (status, client, date range) — 25+ tests
- [ ] Bills API: CRUD + list with filters (status, vendor, date range) — 25+ tests
- [ ] Clients API: CRUD + list with stats (open invoices, balance due) — 20+ tests
- [ ] Vendors API: CRUD + list with stats (open bills, balance due) — 20+ tests
- [ ] All endpoints enforce tenant isolation + soft delete
- [ ] All monetary fields returned as integer cents
- [ ] Cursor pagination on list endpoints

**Frontend:**
- [ ] Business domain layout with DomainTabs
- [ ] Invoicing page: StatsGrid + AR Aging bar + invoice/bills tables
- [ ] Clients page: StatsGrid + directory table
- [ ] Vendors page: StatsGrid + directory table
- [ ] DetailPanel integration for invoices/bills/clients/vendors
- [ ] All components use semantic tokens (no hardcoded colors)
- [ ] Stagger animations (`.fi .fi1`–`.fi4`)
- [ ] Mobile responsive

**Tests:**
- [ ] 90+ backend tests passing
- [ ] Key frontend components tested (AgingBar, tables)
- [ ] API integration verified end-to-end

---

## Architecture

### Models (Already Exist)
```
Client (entityId, name, email, phone, address, paymentTerms, status)
├── invoices[]
└── payments[]

Invoice (entityId, clientId, invoiceNumber, issueDate, dueDate, currency, total, status)
├── invoiceLines[] (description, quantity, unitPrice, amount)
└── client

Vendor (entityId, name, email, phone, address, paymentTerms, status)
├── bills[]
└── payments[]

Bill (entityId, vendorId, billNumber, issueDate, dueDate, currency, total, status)
├── billLines[] (description, quantity, unitPrice, amount)
└── vendor
```

### API Endpoints
```
POST   /api/invoices              - Create invoice
GET    /api/invoices              - List (filter: status, clientId, dateFrom, dateTo)
GET    /api/invoices/:id          - Get single
PUT    /api/invoices/:id          - Update
DELETE /api/invoices/:id          - Soft delete
GET    /api/invoices/stats        - AR metrics + aging

POST   /api/bills                 - Create bill
GET    /api/bills                 - List (filter: status, vendorId, dateFrom, dateTo)
GET    /api/bills/:id             - Get single
PUT    /api/bills/:id             - Update
DELETE /api/bills/:id             - Soft delete
GET    /api/bills/stats           - AP metrics + aging

POST   /api/clients               - Create client
GET    /api/clients               - List (filter: status, search)
GET    /api/clients/:id           - Get single (includes open invoices count, balance due)
PUT    /api/clients/:id           - Update
DELETE /api/clients/:id           - Soft delete

POST   /api/vendors               - Create vendor
GET    /api/vendors               - List (filter: status, search)
GET    /api/vendors/:id           - Get single (includes open bills count, balance due)
PUT    /api/vendors/:id           - Update
DELETE /api/vendors/:id           - Soft delete
```

---

## Tasks — Backend First

### Task 4.1: Invoices API — Schemas

**Create:** `apps/api/src/domains/invoicing/schemas/invoice.schema.ts`

**What:** Zod validation schemas for invoice CRUD operations.

**Implementation:**
```typescript
import { z } from 'zod';

export const InvoiceLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int(), // Integer cents
  taxRateId: z.string().cuid().optional(),
  taxAmount: z.number().int().min(0),
  amount: z.number().int(), // Integer cents (quantity * unitPrice + taxAmount)
  glAccountId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

export const CreateInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  invoiceNumber: z.string().min(1).max(50),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().length(3), // ISO 4217
  subtotal: z.number().int().min(0),
  taxAmount: z.number().int().min(0),
  total: z.number().int().min(0),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
  notes: z.string().max(1000).optional(),
  lines: z.array(InvoiceLineSchema).min(1),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const ListInvoicesSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  clientId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type ListInvoicesInput = z.infer<typeof ListInvoicesSchema>;
```

**Depends on:** None
**Success:** Schemas export, validate sample data correctly, TypeScript types generated

---

### Task 4.2: Invoices API — Service

**Create:** `apps/api/src/domains/invoicing/services/invoice.service.ts`

**What:** Business logic for invoice CRUD operations with tenant isolation, soft delete, and AR aging calculations.

**Implementation:**
```typescript
import { prisma } from '@db/client';
import type { TenantContext } from '@/lib/middleware/tenant';
import type { CreateInvoiceInput, UpdateInvoiceInput, ListInvoicesInput } from '../schemas/invoice.schema';

export async function createInvoice(data: CreateInvoiceInput, ctx: TenantContext) {
  // Verify client belongs to tenant's entity
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  return prisma.invoice.create({
    data: {
      entityId: client.entityId,
      clientId: data.clientId,
      invoiceNumber: data.invoiceNumber,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      currency: data.currency,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      total: data.total,
      status: data.status,
      paidAmount: 0,
      notes: data.notes,
      invoiceLines: {
        create: data.lines,
      },
    },
    include: {
      invoiceLines: true,
      client: true,
      entity: true,
    },
  });
}

export async function listInvoices(filters: ListInvoicesInput, ctx: TenantContext) {
  const where: any = {
    entity: { tenantId: ctx.tenantId },
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.dateFrom) where.issueDate = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    where.issueDate = {
      ...(where.issueDate || {}),
      lte: new Date(filters.dateTo),
    };
  }
  if (filters.cursor) where.id = { gt: filters.cursor };

  const invoices = await prisma.invoice.findMany({
    where,
    include: { client: true, entity: true, invoiceLines: true },
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
  });

  const nextCursor = invoices.length === filters.limit
    ? invoices[invoices.length - 1].id
    : null;

  return { invoices, nextCursor };
}

export async function getInvoice(id: string, ctx: TenantContext) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: {
      client: true,
      entity: true,
      invoiceLines: true,
    },
  });

  if (!invoice) throw new Error('Invoice not found');
  return invoice;
}

export async function updateInvoice(id: string, data: UpdateInvoiceInput, ctx: TenantContext) {
  // Verify exists and tenant owns
  await getInvoice(id, ctx);

  return prisma.invoice.update({
    where: { id },
    data: {
      ...(data.invoiceNumber && { invoiceNumber: data.invoiceNumber }),
      ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.currency && { currency: data.currency }),
      ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
      ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
      ...(data.total !== undefined && { total: data.total }),
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: { client: true, entity: true, invoiceLines: true },
  });
}

export async function deleteInvoice(id: string, ctx: TenantContext) {
  // Verify exists and tenant owns
  await getInvoice(id, ctx);

  return prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getInvoiceStats(ctx: TenantContext) {
  // Outstanding AR, collected this month, overdue
  const [total, paid, overdue] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: { in: ['SENT', 'OVERDUE'] },
      },
      _sum: { total: true, paidAmount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'PAID',
      },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
      },
      _sum: { total: true },
    }),
  ]);

  // AR Aging buckets
  const now = new Date();
  const aging = await Promise.all([
    // Current (not yet due)
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { gte: now },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // 1-30 days overdue
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
        dueDate: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: now,
        },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // 31-60 days overdue
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
        dueDate: {
          gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // 60+ days overdue
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
        dueDate: { lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
      },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const outstandingAR = (total._sum.total || 0) - (total._sum.paidAmount || 0);
  const totalAging = aging.reduce((sum, bucket) =>
    sum + (bucket._sum.total || 0) - (bucket._sum.paidAmount || 0), 0);

  return {
    outstandingAR,
    collectedThisMonth: paid._sum.total || 0,
    overdue: overdue._sum.total || 0,
    aging: {
      current: {
        amount: (aging[0]._sum.total || 0) - (aging[0]._sum.paidAmount || 0),
        percentage: totalAging > 0 ? Math.round(((aging[0]._sum.total || 0) - (aging[0]._sum.paidAmount || 0)) / totalAging * 100) : 0,
      },
      '1-30': {
        amount: (aging[1]._sum.total || 0) - (aging[1]._sum.paidAmount || 0),
        percentage: totalAging > 0 ? Math.round(((aging[1]._sum.total || 0) - (aging[1]._sum.paidAmount || 0)) / totalAging * 100) : 0,
      },
      '31-60': {
        amount: (aging[2]._sum.total || 0) - (aging[2]._sum.paidAmount || 0),
        percentage: totalAging > 0 ? Math.round(((aging[2]._sum.total || 0) - (aging[2]._sum.paidAmount || 0)) / totalAging * 100) : 0,
      },
      '60+': {
        amount: (aging[3]._sum.total || 0) - (aging[3]._sum.paidAmount || 0),
        percentage: totalAging > 0 ? Math.round(((aging[3]._sum.total || 0) - (aging[3]._sum.paidAmount || 0)) / totalAging * 100) : 0,
      },
    },
  };
}
```

**Depends on:** Task 4.1
**Risk:** High (financial data, tenant isolation)
**Success:** Service creates/reads invoices filtered by tenantId, soft delete works, aging calculation correct

---

### Task 4.3: Invoices API — Routes + Tests

**Create:** `apps/api/src/domains/invoicing/routes/invoices.ts`
**Create:** `apps/api/src/domains/invoicing/routes/__tests__/invoices.routes.test.ts`

**What:** Fastify route handlers + comprehensive test suite (25+ tests).

**Routes:**
```typescript
import type { FastifyInstance } from 'fastify';
import * as invoiceService from '../services/invoice.service';
import { CreateInvoiceSchema, UpdateInvoiceSchema, ListInvoicesSchema } from '../schemas/invoice.schema';

export async function invoiceRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    schema: { body: CreateInvoiceSchema },
    handler: async (request, reply) => {
      const invoice = await invoiceService.createInvoice(request.body, request.tenant);
      return reply.status(201).send(invoice);
    },
  });

  fastify.get('/', {
    schema: { querystring: ListInvoicesSchema },
    handler: async (request, reply) => {
      const result = await invoiceService.listInvoices(request.query, request.tenant);
      return reply.send(result);
    },
  });

  fastify.get('/stats', {
    handler: async (request, reply) => {
      const stats = await invoiceService.getInvoiceStats(request.tenant);
      return reply.send(stats);
    },
  });

  fastify.get('/:id', {
    schema: { params: { id: { type: 'string' } } },
    handler: async (request, reply) => {
      const invoice = await invoiceService.getInvoice(request.params.id, request.tenant);
      return reply.send(invoice);
    },
  });

  fastify.put('/:id', {
    schema: {
      params: { id: { type: 'string' } },
      body: UpdateInvoiceSchema,
    },
    handler: async (request, reply) => {
      const invoice = await invoiceService.updateInvoice(
        request.params.id,
        request.body,
        request.tenant
      );
      return reply.send(invoice);
    },
  });

  fastify.delete('/:id', {
    schema: { params: { id: { type: 'string' } } },
    handler: async (request, reply) => {
      await invoiceService.deleteInvoice(request.params.id, request.tenant);
      return reply.status(204).send();
    },
  });
}
```

**Tests (25+ scenarios):**
```typescript
describe('POST /api/invoices', () => {
  it('should create invoice with integer cents', async () => {
    // Assert all money fields (subtotal, taxAmount, total, unitPrice, amount) are integers
  });

  it('should reject if client not in tenant', async () => {
    // Cross-tenant isolation test
  });

  it('should create invoice lines', async () => {
    // Verify invoiceLines[] created
  });

  it('should validate required fields', async () => {
    // Zod validation errors
  });
});

describe('GET /api/invoices', () => {
  it('should list invoices filtered by tenantId', async () => {
    // Tenant isolation
  });

  it('should filter by status', async () => {});
  it('should filter by clientId', async () => {});
  it('should filter by date range', async () => {});
  it('should paginate with cursor', async () => {});
  it('should exclude soft-deleted invoices', async () => {});
});

describe('GET /api/invoices/:id', () => {
  it('should return invoice with client and lines', async () => {});
  it('should return 404 for other tenant invoice', async () => {});
  it('should return 404 for soft-deleted invoice', async () => {});
});

describe('PUT /api/invoices/:id', () => {
  it('should update invoice fields', async () => {});
  it('should reject cross-tenant update', async () => {});
});

describe('DELETE /api/invoices/:id', () => {
  it('should soft delete invoice (set deletedAt)', async () => {
    // Verify deletedAt set, record still exists
  });
  it('should reject cross-tenant delete', async () => {});
});

describe('GET /api/invoices/stats', () => {
  it('should return AR stats with integer cents', async () => {});
  it('should calculate aging buckets correctly', async () => {
    // Current, 1-30, 31-60, 60+ percentages sum to 100
  });
  it('should exclude soft-deleted invoices from stats', async () => {});
});
```

**Depends on:** Task 4.2
**Success:** All 25+ tests pass, invoices CRUD works, tenant isolation verified, soft delete verified, aging stats correct

---

### Task 4.4: Bills API — Complete

**Create:**
- `apps/api/src/domains/invoicing/schemas/bill.schema.ts`
- `apps/api/src/domains/invoicing/services/bill.service.ts`
- `apps/api/src/domains/invoicing/routes/bills.ts`
- `apps/api/src/domains/invoicing/routes/__tests__/bills.routes.test.ts`

**What:** Mirror invoices API for bills (AP side). Same patterns, 25+ tests.

**Implementation:** Follow exact pattern from Tasks 4.1-4.3 but:
- Replace `Invoice` → `Bill`
- Replace `Client` → `Vendor`
- Replace `invoiceNumber` → `billNumber`
- Stats endpoint returns AP metrics (outstanding AP, paid this month, overdue)
- Same aging buckets calculation

**Depends on:** Task 4.3 (reuse patterns)
**Success:** Bills CRUD works, 25+ tests pass, AP stats correct

---

### Task 4.5: Clients API — Complete

**Create:**
- `apps/api/src/domains/clients/schemas/client.schema.ts`
- `apps/api/src/domains/clients/services/client.service.ts`
- `apps/api/src/domains/clients/routes/clients.ts`
- `apps/api/src/domains/clients/routes/__tests__/clients.routes.test.ts`

**What:** CRUD API for clients with aggregated stats (open invoices count, balance due).

**Schemas:**
```typescript
export const CreateClientSchema = z.object({
  entityId: z.string().cuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  paymentTerms: z.string().max(100).optional(), // e.g., "Net 30"
  status: z.enum(['active', 'inactive']).default('active'),
});

export const ListClientsSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().max(100).optional(), // Search name or email
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
```

**Service — Get Single with Stats:**
```typescript
export async function getClient(id: string, ctx: TenantContext) {
  const client = await prisma.client.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: { entity: true },
  });

  if (!client) throw new Error('Client not found');

  // Aggregate open invoices and balance due
  const [openInvoices, balance] = await Promise.all([
    prisma.invoice.count({
      where: {
        clientId: id,
        status: { in: ['SENT', 'OVERDUE'] },
        deletedAt: null,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        clientId: id,
        status: { in: ['SENT', 'OVERDUE'] },
        deletedAt: null,
      },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const balanceDue = (balance._sum.total || 0) - (balance._sum.paidAmount || 0);

  return {
    ...client,
    openInvoices,
    balanceDue, // Integer cents
  };
}
```

**Tests (20+ scenarios):**
- Create/list/get/update/delete
- Tenant isolation (cross-tenant access rejected)
- Soft delete verification
- Search filtering (name + email)
- Status filtering
- Get single includes openInvoices count and balanceDue
- balanceDue is integer cents

**Depends on:** Task 4.3 (invoices API for aggregation)
**Success:** Clients CRUD works, 20+ tests pass, stats aggregation correct

---

### Task 4.6: Vendors API — Complete

**Create:**
- `apps/api/src/domains/vendors/schemas/vendor.schema.ts`
- `apps/api/src/domains/vendors/services/vendor.service.ts`
- `apps/api/src/domains/vendors/routes/vendors.ts`
- `apps/api/src/domains/vendors/routes/__tests__/vendors.routes.test.ts`

**What:** Mirror clients API for vendors (AP side). Same patterns, 20+ tests.

**Implementation:** Follow exact pattern from Task 4.5 but:
- Replace `Client` → `Vendor`
- Replace `invoices` → `bills`
- Get single includes `openBills` count and `balanceDue` from bills table

**Depends on:** Task 4.5 (reuse patterns)
**Success:** Vendors CRUD works, 20+ tests pass, stats aggregation correct

---

### Task 4.7: Register API Routes

**Modify:** `apps/api/src/domains/index.ts` (or relevant router file)

**What:** Register all new routes with Fastify.

```typescript
import { invoiceRoutes } from './invoicing/routes/invoices';
import { billRoutes } from './invoicing/routes/bills';
import { clientRoutes } from './clients/routes/clients';
import { vendorRoutes } from './vendors/routes/vendors';

export async function registerDomainRoutes(fastify: FastifyInstance) {
  // ... existing routes

  fastify.register(invoiceRoutes, { prefix: '/invoices' });
  fastify.register(billRoutes, { prefix: '/bills' });
  fastify.register(clientRoutes, { prefix: '/clients' });
  fastify.register(vendorRoutes, { prefix: '/vendors' });
}
```

**Depends on:** Tasks 4.3, 4.4, 4.5, 4.6
**Success:** All routes accessible at `/api/invoices`, `/api/bills`, `/api/clients`, `/api/vendors`

---

## Tasks — Frontend

### Task 4.8: API Client Functions

**Create:** `apps/web/src/lib/api/invoices.ts`
**Create:** `apps/web/src/lib/api/bills.ts`
**Create:** `apps/web/src/lib/api/clients.ts`
**Create:** `apps/web/src/lib/api/vendors.ts`

**What:** TypeScript client functions for all backend endpoints. Type-safe wrappers around `apiClient`.

**Example (`invoices.ts`):**
```typescript
import { apiClient } from './client';

export interface Invoice {
  id: string;
  entityId: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number; // Integer cents
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paidAmount: number;
  notes?: string;
  client: {
    id: string;
    name: string;
    email?: string;
  };
  entity: {
    id: string;
    name: string;
  };
  invoiceLines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number; // Integer cents
    amount: number;
  }>;
}

export interface InvoiceStats {
  outstandingAR: number; // Integer cents
  collectedThisMonth: number;
  overdue: number;
  aging: {
    current: { amount: number; percentage: number };
    '1-30': { amount: number; percentage: number };
    '31-60': { amount: number; percentage: number };
    '60+': { amount: number; percentage: number };
  };
}

export async function listInvoices(params?: {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ invoices: Invoice[]; nextCursor: string | null }> {
  return apiClient({
    method: 'GET',
    path: '/invoices',
    params,
  });
}

export async function getInvoice(id: string): Promise<Invoice> {
  return apiClient({
    method: 'GET',
    path: `/invoices/${id}`,
  });
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  return apiClient({
    method: 'GET',
    path: '/invoices/stats',
  });
}

// ... createInvoice, updateInvoice, deleteInvoice
```

**Same pattern for bills, clients, vendors.**

**Depends on:** Task 4.7 (backend routes registered)
**Success:** All API functions typed, Clerk auth tokens included automatically

---

### Task 4.9: Business Domain Layout

**Create:** `apps/web/src/app/(dashboard)/business/layout.tsx`

**What:** Domain layout with DomainTabs (Invoices | Bills | Clients | Vendors | Payments).

```typescript
import { DomainTabs } from '@/components/shared/DomainTabs';

const tabs = [
  { label: 'Invoices', href: '/business/invoices' },
  { label: 'Bills', href: '/business/bills' },
  { label: 'Clients', href: '/business/clients' },
  { label: 'Vendors', href: '/business/vendors' },
  { label: 'Payments', href: '/business/payments' },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 space-y-6 p-6">
      <DomainTabs tabs={tabs} />
      {children}
    </div>
  );
}
```

**Depends on:** Slice 1 (DomainTabs)
**Success:** Tabs appear on all business pages, active state highlights

---

### Task 4.10: AgingBar Component

**Create:** `apps/web/src/components/shared/AgingBar.tsx`

**What:** Reusable AR/AP aging visualization with segmented bar + legend.

```typescript
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface AgingBucket {
  label: string;
  amount: number; // Integer cents
  percentage: number; // 0-100
  color: 'green' | 'amber' | 'red' | 'darkred';
}

interface AgingBarProps {
  buckets: AgingBucket[];
  totalLabel?: string;
  totalAmount: number; // Integer cents
  currency?: string;
}

const colorClasses = {
  green: 'bg-ak-green',
  amber: 'bg-primary',
  red: 'bg-ak-red',
  darkred: 'bg-destructive',
};

const dotClasses = {
  green: 'bg-ak-green',
  amber: 'bg-primary',
  red: 'bg-ak-red',
  darkred: 'bg-destructive',
};

export function AgingBar({
  buckets,
  totalLabel = 'Total Outstanding',
  totalAmount,
  currency = 'CAD',
}: AgingBarProps) {
  return (
    <div className="glass rounded-xl p-5 space-y-4">
      {/* Title + Total */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
          {totalLabel}
        </h3>
        <p className="font-mono text-xl font-semibold">
          {formatCurrency(totalAmount, currency)}
        </p>
      </div>

      {/* Segmented Bar */}
      <div className="h-12 rounded-lg overflow-hidden flex">
        {buckets.map((bucket, i) => (
          <div
            key={bucket.label}
            className={cn(colorClasses[bucket.color])}
            style={{ width: `${bucket.percentage}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-2">
            <div className={cn('w-1.5 h-1.5 rounded-full', dotClasses[bucket.color])} />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {bucket.label}
              </p>
              <p className="font-mono text-xs font-medium">
                {formatCurrency(bucket.amount, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Depends on:** Slice 0 (tokens)
**Success:** Component renders with correct color gradient, legend shows all buckets

---

### Task 4.11: Invoicing Page

**Modify:** `apps/web/src/app/(dashboard)/business/invoices/page.tsx`
**Create:** `apps/web/src/components/invoicing/InvoiceTable.tsx`
**Create:** `apps/web/src/components/invoicing/BillsTable.tsx`

**What:** Complete invoicing page with StatsGrid, AgingBar, invoice/bills tables. Real API data.

**Page (Server Component):**
```typescript
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsGrid } from '@/components/shared/StatsGrid';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { AgingBar } from '@/components/shared/AgingBar';
import { InvoiceTable } from '@/components/invoicing/InvoiceTable';
import { BillsTable } from '@/components/invoicing/BillsTable';
import { getInvoiceStats, listInvoices } from '@/lib/api/invoices';
import { listBills } from '@/lib/api/bills';
import { formatCurrency } from '@/lib/utils/currency';

export default async function InvoicingPage() {
  const [stats, invoicesResult, billsResult] = await Promise.all([
    getInvoiceStats(),
    listInvoices({ limit: 10 }),
    listBills({ limit: 10 }),
  ]);

  const agingBuckets = [
    {
      label: 'Current',
      amount: stats.aging.current.amount,
      percentage: stats.aging.current.percentage,
      color: 'green' as const,
    },
    {
      label: '1-30 days',
      amount: stats.aging['1-30'].amount,
      percentage: stats.aging['1-30'].percentage,
      color: 'amber' as const,
    },
    {
      label: '31-60 days',
      amount: stats.aging['31-60'].amount,
      percentage: stats.aging['31-60'].percentage,
      color: 'red' as const,
    },
    {
      label: '60+ days',
      amount: stats.aging['60+'].amount,
      percentage: stats.aging['60+'].percentage,
      color: 'darkred' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoicing & Bills"
        subtitle="Manage receivables and payables"
      />

      <StatsGrid
        stats={[
          {
            label: 'Outstanding AR',
            value: formatCurrency(stats.outstandingAR),
            color: 'green',
          },
          {
            label: 'Collected (Feb)',
            value: formatCurrency(stats.collectedThisMonth),
            trend: { direction: 'up', text: '+18%' },
          },
          {
            label: 'Outstanding AP',
            value: formatCurrency(0), // From bills stats
            color: 'red',
          },
          {
            label: 'Overdue',
            value: formatCurrency(stats.overdue),
            color: 'red',
          },
        ]}
        className="fi fi1"
      />

      <SectionHeader title="Accounts Receivable Aging" className="fi fi2" />
      <AgingBar
        buckets={agingBuckets}
        totalAmount={stats.outstandingAR}
        className="fi fi2"
      />

      <SectionHeader title="Recent Invoices" className="fi fi3" />
      <InvoiceTable invoices={invoicesResult.invoices} className="fi fi3" />

      <SectionHeader title="Recent Bills" className="fi fi4" />
      <BillsTable bills={billsResult.bills} className="fi fi4" />
    </div>
  );
}
```

**InvoiceTable (Client Component):**
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/lib/api/invoices';

const statusBadgeClass = {
  PAID: 'bg-ak-green-dim text-ak-green',
  SENT: 'bg-ak-blue-dim text-ak-blue',
  DRAFT: 'bg-muted text-muted-foreground',
  OVERDUE: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
};

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();

  const handleRowClick = (id: string) => {
    router.push(`?panel=invoice_${id}`);
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-ak-bg-2 border-b border-ak-border">
          <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Number</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const isOverdue = invoice.status === 'OVERDUE';
            return (
              <tr
                key={invoice.id}
                onClick={() => handleRowClick(invoice.id)}
                className="border-b border-ak-border hover:bg-ak-bg-2 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-mono text-sm text-primary">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm">{invoice.client.name}</p>
                    {invoice.client.email && (
                      <p className="text-xs text-muted-foreground">
                        {invoice.client.email}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-right">
                  {formatCurrency(invoice.total, invoice.currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge className={statusBadgeClass[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </td>
                <td className={`px-4 py-3 font-mono text-sm ${isOverdue ? 'text-destructive' : ''}`}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**BillsTable:** Same structure, replace invoice → bill, client → vendor.

**Depends on:** Tasks 4.8, 4.9, 4.10
**Success:** Page loads real data, StatsGrid shows correct totals, AgingBar renders, tables clickable

---

### Task 4.12: Clients & Vendors Pages

**Modify:** `apps/web/src/app/(dashboard)/business/clients/page.tsx`
**Modify:** `apps/web/src/app/(dashboard)/business/vendors/page.tsx`
**Create:** `apps/web/src/components/clients/ClientsTable.tsx`
**Create:** `apps/web/src/components/vendors/VendorsTable.tsx`

**What:** Directory tables with StatsGrid. Real API data with aggregated stats.

**Clients Page (Server Component):**
```typescript
export default async function ClientsPage() {
  const { clients } = await listClients({ limit: 50 });

  // Aggregate stats from client data
  const totalClients = clients.length;
  const totalBalanceDue = clients.reduce((sum, c) => sum + (c.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle={`${totalClients} clients`} />

      <StatsGrid
        stats={[
          { label: 'Total Clients', value: `${totalClients}` },
          { label: 'Active', value: `${clients.filter(c => c.status === 'active').length}` },
          { label: 'Total Balance Due', value: formatCurrency(totalBalanceDue), color: 'green' },
          { label: 'Avg Balance', value: formatCurrency(totalClients > 0 ? Math.round(totalBalanceDue / totalClients) : 0) },
        ]}
        className="fi fi1"
      />

      <SectionHeader title="Client Directory" className="fi fi2" />
      <ClientsTable clients={clients} className="fi fi2" />
    </div>
  );
}
```

**ClientsTable:** Columns: Name, Contact (email), Open Invoices, Balance Due, Status, Actions.

**VendorsTable:** Same pattern for vendors.

**Depends on:** Task 4.8
**Success:** Pages load real data, stats calculate correctly, tables render

---

### Task 4.13: DetailPanel Integration

**Create:** `apps/web/src/components/invoicing/InvoiceDetail.tsx`
**Create:** `apps/web/src/components/invoicing/BillDetail.tsx`
**Create:** `apps/web/src/components/clients/ClientDetail.tsx`
**Create:** `apps/web/src/components/vendors/VendorDetail.tsx`

**What:** Detail panel content for each entity type. Uses `DetailPanel` wrapper from Slice 2.

**Example (InvoiceDetail):**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getInvoice } from '@/lib/api/invoices';
import { DetailRow, DetailActions } from '@/components/shared/DetailPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';

const statusBadgeClass = {
  PAID: 'bg-ak-green-dim text-ak-green',
  SENT: 'bg-ak-blue-dim text-ak-blue',
  DRAFT: 'bg-muted text-muted-foreground',
  OVERDUE: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
};

export function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <>
      <Badge className={statusBadgeClass[invoice.status]}>
        {invoice.status}
      </Badge>

      <h2 className="font-heading text-xl mt-2">{invoice.invoiceNumber}</h2>
      <p className="text-sm text-muted-foreground">{invoice.client.name}</p>

      <p className="font-mono text-2xl mt-4">
        {formatCurrency(invoice.total, invoice.currency)}
      </p>

      <div className="space-y-0 mt-6">
        <DetailRow label="Client" value={invoice.client.name} />
        <DetailRow label="Entity" value={invoice.entity.name} />
        <DetailRow
          label="Due Date"
          value={new Date(invoice.dueDate).toLocaleDateString()}
          mono
        />
        <DetailRow label="Status" value={invoice.status} />
        <DetailRow
          label="Paid"
          value={formatCurrency(invoice.paidAmount, invoice.currency)}
          mono
        />
      </div>

      {/* Invoice Lines */}
      <div className="mt-6">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Line Items
        </h3>
        {invoice.invoiceLines.map((line) => (
          <div key={line.id} className="py-2 border-b border-ak-border last:border-0">
            <div className="flex justify-between">
              <span className="text-sm">{line.description}</span>
              <span className="font-mono text-sm">
                {formatCurrency(line.amount, invoice.currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {line.quantity} × {formatCurrency(line.unitPrice, invoice.currency)}
            </p>
          </div>
        ))}
      </div>

      <DetailActions>
        <Button variant="outline">Edit</Button>
        <Button variant="outline">Send</Button>
        <Button variant="destructive">Delete</Button>
      </DetailActions>
    </>
  );
}
```

**Wire to DetailPanel in pages:**
```typescript
const searchParams = useSearchParams();
const panelParam = searchParams.get('panel');
const [type, id] = panelParam?.split('_') || [];

{panelParam && type === 'invoice' && (
  <DetailPanel>
    <InvoiceDetail invoiceId={id} />
  </DetailPanel>
)}
```

**Depends on:** Task 4.11, 4.12
**Success:** Clicking row opens panel, detail shows, ESC closes

---

## Testing Summary

**Backend Tests:** 90+ total
- Invoices: 25 tests (CRUD, filters, stats, aging)
- Bills: 25 tests (CRUD, filters, stats, aging)
- Clients: 20 tests (CRUD, aggregation, search)
- Vendors: 20 tests (CRUD, aggregation, search)

**Frontend Tests:** (Optional, time permitting)
- AgingBar rendering
- Table row click opens DetailPanel
- StatsGrid calculates correctly

**Run all backend tests:**
```bash
cd apps/api && npx vitest run --reporter=verbose
```

**Test Coverage Requirements:**
- All monetary fields asserted as integer cents
- Tenant isolation verified (cross-tenant access rejected)
- Soft delete verified (deletedAt set, record exists)
- Pagination works (cursor-based)
- Filters work (status, date range, search)

---

## Reference Files

| File | Purpose |
|------|---------|
| `apps/api/src/domains/banking/routes/accounts.ts` | Route pattern reference |
| `apps/api/src/domains/banking/services/account.service.ts` | Service pattern reference |
| `apps/api/src/domains/banking/routes/__tests__/accounts.routes.test.ts` | Test pattern reference |
| `.claude/rules/api-conventions.md` | Route → Schema → Service pattern |
| `.claude/rules/test-conventions.md` | Financial invariant assertions |
| `.claude/rules/design-aesthetic.md` | **CRITICAL** - Semantic tokens, no hardcoded colors |
| `.claude/rules/frontend-conventions.md` | Server/Client component split |
| `apps/web/src/components/shared/StatsGrid.tsx` | Reusable stats grid |
| `apps/web/src/components/shared/DetailPanel.tsx` | Reusable detail panel |
| `brand/explorations/html/pages/invoicing.html` | Visual reference |

---

## Review Agents

Use these at checkpoints:

**After backend complete (Task 4.7):**
```bash
/processes:review apps/api/src/domains/invoicing/
```
- `financial-data-validator` — verify integer cents, soft delete, tenant isolation
- `kieran-typescript-reviewer` — strict TypeScript patterns
- `fastify-api-reviewer` — route patterns, Zod validation
- `security-sentinel` — input validation, SQL injection prevention

**After frontend complete (Task 4.13):**
```bash
/quality:design-system-enforce
```
- Verify no hardcoded colors (all semantic tokens)

---

## Progress Checklist

**Backend (Tasks 4.1–4.7):**
- [ ] Task 4.1: Invoices schemas
- [ ] Task 4.2: Invoices service
- [ ] Task 4.3: Invoices routes + 25 tests
- [ ] Task 4.4: Bills complete (schemas + service + routes + 25 tests)
- [ ] Task 4.5: Clients complete (schemas + service + routes + 20 tests)
- [ ] Task 4.6: Vendors complete (schemas + service + routes + 20 tests)
- [ ] Task 4.7: Register all routes

**Frontend (Tasks 4.8–4.13):**
- [ ] Task 4.8: API client functions (invoices, bills, clients, vendors)
- [ ] Task 4.9: Business domain layout (DomainTabs)
- [ ] Task 4.10: AgingBar component
- [ ] Task 4.11: Invoicing page (StatsGrid + AgingBar + tables)
- [ ] Task 4.12: Clients & vendors pages
- [ ] Task 4.13: DetailPanel integration (all 4 types)

---

## Estimated Effort

| Phase | Tasks | LOC | Sessions |
|-------|-------|-----|----------|
| Backend | 4.1–4.7 | ~2,500 | 8-10 |
| Frontend | 4.8–4.13 | ~1,500 | 5-6 |
| **Total** | **13 tasks** | **~4,000 LOC** | **13-16 sessions** |

---

## Next Steps After Slice 4

1. Run final tests: `cd apps/api && npx vitest run`
2. Verify 90+ tests passing
3. Visual QA: Compare pages to exploration HTML
4. Run `/processes:review` on both api and web
5. Update V2 plan progress (mark Slice 4 complete)
6. Commit: `feat(business): Slice 4 complete — Invoicing, Clients, Vendors (backend + frontend + 90+ tests)`
7. Move to Slice 5: Accounting Pages

---

_Complete full-stack package. Backend-first. 90+ tests. Real API integration. Semantic tokens enforced. Financial Clarity aesthetic._
