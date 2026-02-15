import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as invoiceService from '../invoice.service';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-test-123';
const ENTITY_ID = 'entity-test-456';
const CLIENT_ID = 'client-test-789';

const mockTenantContext = {
  tenantId: TENANT_ID,
  userId: 'user-test-111',
  role: 'OWNER' as const,
};

function mockInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    invoiceNumber: 'INV-001',
    entityId: ENTITY_ID,
    clientId: CLIENT_ID,
    issueDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-31'),
    currency: 'USD',
    subtotal: 90000, // $900.00
    taxAmount: 9000, // $90.00
    total: 99000, // $990.00
    paidAmount: 0,
    status: 'DRAFT',
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    client: { id: CLIENT_ID, name: 'Acme Corp', entityId: ENTITY_ID },
    entity: { id: ENTITY_ID, name: 'My Company', tenantId: TENANT_ID },
    invoiceLines: [],
    ...overrides,
  };
}

describe('InvoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should verify client belongs to tenant before creating', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.create).mockResolvedValueOnce(mockInvoice() as never);

      await invoiceService.createInvoice(
        {
          clientId: CLIENT_ID,
          invoiceNumber: 'INV-100',
          issueDate: '2024-02-01',
          dueDate: '2024-03-01',
          currency: 'USD',
          subtotal: 100000,
          taxAmount: 10000,
          total: 110000,
          status: 'DRAFT',
          notes: null,
          lines: [
            {
              description: 'Service',
              quantity: 1,
              unitPrice: 100000,
              taxAmount: 10000,
              amount: 110000, // subtotal + tax
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: CLIENT_ID,
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw if client does not belong to tenant', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        invoiceService.createInvoice(
          {
            clientId: 'client-other-tenant',
            invoiceNumber: 'INV-999',
            issueDate: '2024-02-01',
            dueDate: '2024-03-01',
            currency: 'USD',
            subtotal: 50000,
            taxAmount: 0,
            total: 50000,
            status: 'DRAFT',
            notes: null,
            lines: [],
          },
          mockTenantContext
        )
      ).rejects.toThrow('Client not found');
    });

    it('should create invoice with all monetary fields as integer cents', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.create).mockResolvedValueOnce(mockInvoice() as never);

      await invoiceService.createInvoice(
        {
          clientId: CLIENT_ID,
          invoiceNumber: 'INV-200',
          issueDate: '2024-03-01',
          dueDate: '2024-03-31',
          currency: 'USD',
          subtotal: 150000,
          taxAmount: 15000,
          total: 165000,
          status: 'DRAFT',
          notes: 'Test invoice',
          lines: [
            {
              description: 'Service A',
              quantity: 1,
              unitPrice: 150000,
              taxAmount: 15000,
              amount: 165000, // subtotal + tax
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.invoice.create).mock.calls[0][0]!;
      assertIntegerCents(createArgs.data.subtotal, 'subtotal');
      assertIntegerCents(createArgs.data.taxAmount, 'taxAmount');
      assertIntegerCents(createArgs.data.total, 'total');
      expect(createArgs.data.paidAmount).toBe(0);
    });

    it('should set paidAmount to 0 on new invoice', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.create).mockResolvedValueOnce(mockInvoice() as never);

      await invoiceService.createInvoice(
        {
          clientId: CLIENT_ID,
          invoiceNumber: 'INV-300',
          issueDate: '2024-04-01',
          dueDate: '2024-04-30',
          currency: 'USD',
          subtotal: 50000,
          taxAmount: 0,
          total: 50000,
          status: 'DRAFT',
          notes: null,
          lines: [
            {
              description: 'Product',
              quantity: 1,
              unitPrice: 50000,
              taxAmount: 0,
              amount: 50000,
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.invoice.create).mock.calls[0][0]!;
      expect(createArgs.data.paidAmount).toBe(0);
    });

    it('should create invoice lines nested', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.create).mockResolvedValueOnce(mockInvoice() as never);

      const lines = [
        {
          description: 'Item 1',
          quantity: 2,
          unitPrice: 25000,
          taxAmount: 5000,
          amount: 55000, // (2 * 25000) + 5000
          glAccountId: undefined,
          categoryId: undefined,
        },
        {
          description: 'Item 2',
          quantity: 1,
          unitPrice: 10000,
          taxAmount: 1000,
          amount: 11000, // (1 * 10000) + 1000
          glAccountId: undefined,
          categoryId: undefined,
        },
      ];

      await invoiceService.createInvoice(
        {
          clientId: CLIENT_ID,
          invoiceNumber: 'INV-400',
          issueDate: '2024-05-01',
          dueDate: '2024-05-31',
          currency: 'USD',
          subtotal: 60000,
          taxAmount: 6000,
          total: 66000,
          status: 'DRAFT',
          notes: null,
          lines,
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.invoice.create).mock.calls[0][0]!;
      expect(createArgs.data.invoiceLines).toEqual({ create: lines });
    });
  });

  describe('listInvoices', () => {
    it('should filter by tenantId via entity relation', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

      await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.invoice.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter soft-deleted records', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

      await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.invoice.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should support status filter', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

      await invoiceService.listInvoices({ limit: 10, status: 'SENT' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.invoice.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('status', 'SENT');
    });

    it('should support clientId filter', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

      await invoiceService.listInvoices({ limit: 10, clientId: CLIENT_ID }, mockTenantContext);

      const callArgs = vi.mocked(prisma.invoice.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('clientId', CLIENT_ID);
    });

    it('should support date range filters', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

      await invoiceService.listInvoices(
        { limit: 10, dateFrom: '2024-01-01', dateTo: '2024-01-31' },
        mockTenantContext
      );

      const callArgs = vi.mocked(prisma.invoice.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.issueDate).toEqual({
        gte: new Date('2024-01-01'),
        lte: new Date('2024-01-31'),
      });
    });

    it('should support cursor pagination', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

      await invoiceService.listInvoices({ limit: 10, cursor: 'cursor-abc' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.invoice.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ gt: 'cursor-abc' });
    });

    it('should return nextCursor when limit reached', async () => {
      const invoices = [mockInvoice({ id: 'inv-1' }), mockInvoice({ id: 'inv-2' })];
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce(invoices as never);

      const result = await invoiceService.listInvoices({ limit: 2 }, mockTenantContext);

      expect(result.nextCursor).toBe('inv-2');
    });

    it('should return null cursor when fewer results than limit', async () => {
      const invoices = [mockInvoice({ id: 'inv-1' })];
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce(invoices as never);

      const result = await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      expect(result.nextCursor).toBeNull();
    });

    it('should order by createdAt desc', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

      await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.invoice.findMany).mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getInvoice', () => {
    it('should find invoice by id with tenant isolation', async () => {
      const invoice = mockInvoice({ id: 'inv-xyz' });
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(invoice as never);

      const result = await invoiceService.getInvoice('inv-xyz', mockTenantContext);

      expect(result).toEqual(invoice);
      expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'inv-xyz',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: {
          client: true,
          entity: true,
          invoiceLines: true,
        },
      });
    });

    it('should throw when invoice not found', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        invoiceService.getInvoice('nonexistent', mockTenantContext)
      ).rejects.toThrow('Invoice not found');
    });

    it('should reject cross-tenant access', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        invoiceService.getInvoice('inv-other-tenant', mockTenantContext)
      ).rejects.toThrow('Invoice not found');
    });

    it('should return invoice with integer cents for all amounts', async () => {
      const invoice = mockInvoice({
        subtotal: 100000,
        taxAmount: 10000,
        total: 110000,
        paidAmount: 25000,
      });
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(invoice as never);

      const result = await invoiceService.getInvoice('inv-1', mockTenantContext);

      assertIntegerCents(result.subtotal, 'subtotal');
      assertIntegerCents(result.taxAmount, 'taxAmount');
      assertIntegerCents(result.total, 'total');
      assertIntegerCents(result.paidAmount, 'paidAmount');
    });
  });

  describe('updateInvoice', () => {
    it('should verify invoice exists and tenant owns before updating', async () => {
      const existing = mockInvoice({ id: 'inv-1' });
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.invoice.update).mockResolvedValueOnce(existing as never);

      await invoiceService.updateInvoice(
        'inv-1',
        { invoiceNumber: 'INV-999' },
        mockTenantContext
      );

      expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'inv-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { client: true, entity: true, invoiceLines: true },
      });
    });

    it('should throw when invoice not found', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        invoiceService.updateInvoice('nonexistent', { status: 'SENT' }, mockTenantContext)
      ).rejects.toThrow('Invoice not found');

      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('should reject cross-tenant update', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        invoiceService.updateInvoice('inv-other-tenant', { status: 'SENT' }, mockTenantContext)
      ).rejects.toThrow('Invoice not found');
    });

    it('should only update provided fields', async () => {
      const existing = mockInvoice({ id: 'inv-1' });
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.invoice.update).mockResolvedValueOnce(existing as never);

      await invoiceService.updateInvoice(
        'inv-1',
        { status: 'SENT', notes: 'Updated notes' },
        mockTenantContext
      );

      const updateArgs = vi.mocked(prisma.invoice.update).mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        status: 'SENT',
        notes: 'Updated notes',
      });
    });
  });

  describe('deleteInvoice', () => {
    it('should verify invoice exists and tenant owns before deleting', async () => {
      const existing = mockInvoice({ id: 'inv-1' });
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.invoice.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      await invoiceService.deleteInvoice('inv-1', mockTenantContext);

      expect(prisma.invoice.findFirst).toHaveBeenCalled();
    });

    it('should soft delete (set deletedAt, not hard delete)', async () => {
      const existing = mockInvoice({ id: 'inv-1' });
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.invoice.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      const result = await invoiceService.deleteInvoice('inv-1', mockTenantContext);

      const updateArgs = vi.mocked(prisma.invoice.update).mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('getInvoiceStats', () => {
    it('should calculate outstandingAR as integer cents', async () => {
      vi.mocked(prisma.invoice.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 25000 } } as never) // Outstanding
        .mockResolvedValueOnce({ _sum: { total: 50000 } } as never) // Paid
        .mockResolvedValueOnce({ _sum: { total: 30000 } } as never) // Overdue
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } } as never) // Current
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } } as never) // 1-30
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } } as never) // 31-60
        .mockResolvedValueOnce({ _sum: { total: 5000, paidAmount: 0 } } as never); // 60+

      const result = await invoiceService.getInvoiceStats(mockTenantContext);

      expect(result.outstandingAR).toBe(75000); // 100000 - 25000
      assertIntegerCents(result.outstandingAR, 'outstandingAR');
    });

    it('should calculate aging buckets correctly', async () => {
      vi.mocked(prisma.invoice.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } } as never) // Current: 40%
        .mockResolvedValueOnce({ _sum: { total: 30000, paidAmount: 0 } } as never) // 1-30: 30%
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } } as never) // 31-60: 20%
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } } as never); // 60+: 10%

      const result = await invoiceService.getInvoiceStats(mockTenantContext);

      expect(result.aging.current.amount).toBe(40000);
      expect(result.aging.current.percentage).toBe(40);
      expect(result.aging['1-30'].amount).toBe(30000);
      expect(result.aging['1-30'].percentage).toBe(30);
      expect(result.aging['31-60'].amount).toBe(20000);
      expect(result.aging['31-60'].percentage).toBe(20);
      expect(result.aging['60+'].amount).toBe(10000);
      expect(result.aging['60+'].percentage).toBe(10);
    });

    it('should handle zero balances correctly', async () => {
      vi.mocked(prisma.invoice.aggregate)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never);

      const result = await invoiceService.getInvoiceStats(mockTenantContext);

      expect(result.outstandingAR).toBe(0);
      expect(result.collectedThisMonth).toBe(0);
      expect(result.overdue).toBe(0);
      assertIntegerCents(result.outstandingAR, 'outstandingAR');
    });

    it('should filter by SENT and OVERDUE status for outstanding AR', async () => {
      vi.mocked(prisma.invoice.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never);

      await invoiceService.getInvoiceStats(mockTenantContext);

      const calls = vi.mocked(prisma.invoice.aggregate).mock.calls;
      expect(calls[0][0].where.status).toEqual({ in: ['SENT', 'OVERDUE'] });
    });

    it('should filter by tenantId for all aggregations', async () => {
      vi.mocked(prisma.invoice.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never);

      await invoiceService.getInvoiceStats(mockTenantContext);

      const calls = vi.mocked(prisma.invoice.aggregate).mock.calls;
      calls.forEach((call) => {
        expect(call[0].where.entity).toEqual({ tenantId: TENANT_ID });
        expect(call[0].where.deletedAt).toBeNull();
      });
    });
  });
});
