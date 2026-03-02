import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as invoiceService from '../invoice.service';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';
import { mockPrisma, rewirePrismaMock } from '../../../../test-utils';

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

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
    rewirePrismaMock();
  });

  describe('createInvoice', () => {
    it('should verify client belongs to tenant before creating', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.client.findFirst.mockResolvedValueOnce(client);
      mockPrisma.invoice.create.mockResolvedValueOnce(mockInvoice());

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
          notes: undefined,
          lines: [
            {
              description: 'Service',
              quantity: 1,
              unitPrice: 100000,
              taxAmount: 10000,
              amount: 100000, // qty * unitPrice (pre-tax)
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: CLIENT_ID,
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw if client does not belong to tenant', async () => {
      mockPrisma.client.findFirst.mockResolvedValueOnce(null);

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
            notes: undefined,
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
      mockPrisma.client.findFirst.mockResolvedValueOnce(client);
      mockPrisma.invoice.create.mockResolvedValueOnce(mockInvoice());

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
              amount: 150000, // qty * unitPrice (pre-tax)
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      const createArgs = mockPrisma.invoice.create.mock.calls[0][0]!;
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
      mockPrisma.client.findFirst.mockResolvedValueOnce(client);
      mockPrisma.invoice.create.mockResolvedValueOnce(mockInvoice());

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
          notes: undefined,
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

      const createArgs = mockPrisma.invoice.create.mock.calls[0][0]!;
      expect(createArgs.data.paidAmount).toBe(0);
    });

    it('should create invoice lines nested', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.client.findFirst.mockResolvedValueOnce(client);
      mockPrisma.invoice.create.mockResolvedValueOnce(mockInvoice());

      const lines = [
        {
          description: 'Item 1',
          quantity: 2,
          unitPrice: 25000,
          taxAmount: 5000,
          amount: 50000, // 2 * 25000 (pre-tax)
          glAccountId: undefined,
          categoryId: undefined,
        },
        {
          description: 'Item 2',
          quantity: 1,
          unitPrice: 10000,
          taxAmount: 1000,
          amount: 10000, // 1 * 10000 (pre-tax)
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
          notes: undefined,
          lines,
        },
        mockTenantContext
      );

      const createArgs = mockPrisma.invoice.create.mock.calls[0][0]!;
      expect(createArgs.data.invoiceLines).toEqual({ create: lines });
    });

    it('should validate taxRateId ownership (IDOR prevention)', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.client.findFirst.mockResolvedValueOnce(client);
      // Return empty array — taxRateId not found for this tenant
      mockPrisma.taxRate.findMany.mockResolvedValueOnce([]);

      await expect(
        invoiceService.createInvoice(
          {
            clientId: CLIENT_ID,
            invoiceNumber: 'INV-500',
            issueDate: '2024-06-01',
            dueDate: '2024-06-30',
            currency: 'USD',
            subtotal: 100000,
            taxAmount: 5000,
            total: 105000,
            status: 'DRAFT',
            notes: undefined,
            lines: [
              {
                description: 'Taxed item',
                quantity: 1,
                unitPrice: 100000,
                taxRateId: 'taxrate-other-tenant',
                taxAmount: 5000,
                amount: 100000,
                glAccountId: undefined,
                categoryId: undefined,
              },
            ],
          },
          mockTenantContext
        )
      ).rejects.toThrow('Tax rate not found or access denied');
    });

    it('should accept valid taxRateId belonging to tenant', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.client.findFirst.mockResolvedValueOnce(client);
      mockPrisma.taxRate.findMany.mockResolvedValueOnce([
        { id: 'taxrate-valid' },
      ]);
      mockPrisma.invoice.create.mockResolvedValueOnce(mockInvoice());

      await invoiceService.createInvoice(
        {
          clientId: CLIENT_ID,
          invoiceNumber: 'INV-501',
          issueDate: '2024-06-01',
          dueDate: '2024-06-30',
          currency: 'USD',
          subtotal: 100000,
          taxAmount: 5000,
          total: 105000,
          status: 'DRAFT',
          notes: undefined,
          lines: [
            {
              description: 'Taxed item',
              quantity: 1,
              unitPrice: 100000,
              taxRateId: 'taxrate-valid',
              taxAmount: 5000,
              amount: 100000,
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      expect(mockPrisma.taxRate.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['taxrate-valid'] },
          OR: [
            { entity: { tenantId: TENANT_ID } },
            { entityId: null },
          ],
        },
        select: { id: true },
      });
      expect(mockPrisma.invoice.create).toHaveBeenCalled();
    });

    it('should skip taxRateId validation when no lines have taxRateId', async () => {
      const client = {
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.client.findFirst.mockResolvedValueOnce(client);
      mockPrisma.invoice.create.mockResolvedValueOnce(mockInvoice());

      await invoiceService.createInvoice(
        {
          clientId: CLIENT_ID,
          invoiceNumber: 'INV-502',
          issueDate: '2024-06-01',
          dueDate: '2024-06-30',
          currency: 'USD',
          subtotal: 50000,
          taxAmount: 0,
          total: 50000,
          status: 'DRAFT',
          notes: undefined,
          lines: [
            {
              description: 'No tax item',
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

      expect(mockPrisma.taxRate.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.invoice.create).toHaveBeenCalled();
    });
  });

  describe('listInvoices', () => {
    it('should filter by tenantId via entity relation', async () => {
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.invoice.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter soft-deleted records', async () => {
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.invoice.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should support status filter', async () => {
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      await invoiceService.listInvoices({ limit: 10, status: 'SENT' }, mockTenantContext);

      const callArgs = mockPrisma.invoice.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('status', 'SENT');
    });

    it('should support clientId filter', async () => {
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      await invoiceService.listInvoices({ limit: 10, clientId: CLIENT_ID }, mockTenantContext);

      const callArgs = mockPrisma.invoice.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('clientId', CLIENT_ID);
    });

    it('should support date range filters', async () => {
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      await invoiceService.listInvoices(
        { limit: 10, dateFrom: '2024-01-01', dateTo: '2024-01-31' },
        mockTenantContext
      );

      const callArgs = mockPrisma.invoice.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.issueDate).toEqual({
        gte: new Date('2024-01-01'),
        lte: new Date('2024-01-31'),
      });
    });

    it('should support cursor pagination', async () => {
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      await invoiceService.listInvoices({ limit: 10, cursor: 'cursor-abc' }, mockTenantContext);

      const callArgs = mockPrisma.invoice.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ gt: 'cursor-abc' });
    });

    it('should return nextCursor when limit reached', async () => {
      const invoices = [mockInvoice({ id: 'inv-1' }), mockInvoice({ id: 'inv-2' })];
      mockPrisma.invoice.findMany.mockResolvedValueOnce(invoices);

      const result = await invoiceService.listInvoices({ limit: 2 }, mockTenantContext);

      expect(result.nextCursor).toBe('inv-2');
    });

    it('should return null cursor when fewer results than limit', async () => {
      const invoices = [mockInvoice({ id: 'inv-1' })];
      mockPrisma.invoice.findMany.mockResolvedValueOnce(invoices);

      const result = await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      expect(result.nextCursor).toBeNull();
    });

    it('should order by createdAt desc', async () => {
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      await invoiceService.listInvoices({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.invoice.findMany.mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getInvoice', () => {
    it('should find invoice by id with tenant isolation', async () => {
      const invoice = mockInvoice({ id: 'inv-xyz' });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      const result = await invoiceService.getInvoice('inv-xyz', mockTenantContext);

      expect(result).toEqual(invoice);
      expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'inv-xyz',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: {
          client: true,
          entity: true,
          invoiceLines: { include: { taxRate: true } },
        },
      });
    });

    it('should throw when invoice not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(null);

      await expect(
        invoiceService.getInvoice('nonexistent', mockTenantContext)
      ).rejects.toThrow('Invoice not found');
    });

    it('should reject cross-tenant access', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(null);

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
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      const result = await invoiceService.getInvoice('inv-1', mockTenantContext);

      assertIntegerCents(result.subtotal, 'subtotal');
      assertIntegerCents(result.taxAmount, 'taxAmount');
      assertIntegerCents(result.total, 'total');
      assertIntegerCents(result.paidAmount, 'paidAmount');
    });
  });

  describe('updateInvoice', () => {
    it('should verify invoice exists and tenant owns before updating', async () => {
      const existing = mockInvoice({ id: 'inv-1', status: 'DRAFT' });
      // FIN-29: Now fetches with invoiceLines for validation
      mockPrisma.invoice.findFirst.mockResolvedValueOnce({ ...existing, invoiceLines: [] });
      mockPrisma.invoice.update.mockResolvedValueOnce(existing);

      await invoiceService.updateInvoice(
        'inv-1',
        { invoiceNumber: 'INV-999' },
        mockTenantContext
      );

      expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'inv-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { invoiceLines: true },
      });
    });

    it('should throw when invoice not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(null);

      await expect(
        invoiceService.updateInvoice('nonexistent', { status: 'SENT' }, mockTenantContext)
      ).rejects.toThrow('Invoice not found');

      expect(mockPrisma.invoice.update).not.toHaveBeenCalled();
    });

    it('should reject cross-tenant update', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(null);

      await expect(
        invoiceService.updateInvoice('inv-other-tenant', { status: 'SENT' }, mockTenantContext)
      ).rejects.toThrow('Invoice not found');
    });

    it('should only update provided fields', async () => {
      const existing = mockInvoice({ id: 'inv-1' });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.invoice.update.mockResolvedValueOnce(existing);

      await invoiceService.updateInvoice(
        'inv-1',
        { status: 'SENT', notes: 'Updated notes' },
        mockTenantContext
      );

      const updateArgs = mockPrisma.invoice.update.mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        status: 'SENT',
        notes: 'Updated notes',
      });
    });
  });

  describe('deleteInvoice', () => {
    it('should verify invoice exists and tenant owns before deleting', async () => {
      const existing = mockInvoice({ id: 'inv-1' });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.invoice.update.mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      });

      await invoiceService.deleteInvoice('inv-1', mockTenantContext);

      expect(mockPrisma.invoice.findFirst).toHaveBeenCalled();
    });

    it('should soft delete (set deletedAt, not hard delete)', async () => {
      const existing = mockInvoice({ id: 'inv-1' });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.invoice.update.mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await invoiceService.deleteInvoice('inv-1', mockTenantContext);

      const updateArgs = mockPrisma.invoice.update.mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('getInvoiceStats', () => {
    it('should calculate outstandingAR as integer cents', async () => {
      mockPrisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 25000 } }) // Outstanding
        .mockResolvedValueOnce({ _sum: { total: 50000 } }) // Paid
        .mockResolvedValueOnce({ _sum: { total: 30000 } }) // Overdue
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } }) // Current
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } }) // 1-30
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } }) // 31-60
        .mockResolvedValueOnce({ _sum: { total: 5000, paidAmount: 0 } }); // 60+

      const result = await invoiceService.getInvoiceStats(mockTenantContext);

      expect(result.outstandingAR).toBe(75000); // 100000 - 25000
      assertIntegerCents(result.outstandingAR, 'outstandingAR');
    });

    it('should calculate aging buckets correctly', async () => {
      mockPrisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } }) // Current: 40%
        .mockResolvedValueOnce({ _sum: { total: 30000, paidAmount: 0 } }) // 1-30: 30%
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } }) // 31-60: 20%
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } }); // 60+: 10%

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
      mockPrisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null } })
        .mockResolvedValueOnce({ _sum: { total: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } });

      const result = await invoiceService.getInvoiceStats(mockTenantContext);

      expect(result.outstandingAR).toBe(0);
      expect(result.collectedThisMonth).toBe(0);
      expect(result.overdue).toBe(0);
      assertIntegerCents(result.outstandingAR, 'outstandingAR');
    });

    it('should filter by SENT and OVERDUE status for outstanding AR', async () => {
      mockPrisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } });

      await invoiceService.getInvoiceStats(mockTenantContext);

      const calls = mockPrisma.invoice.aggregate.mock.calls;
      expect(calls[0]![0].where!.status).toEqual({ in: ['SENT', 'OVERDUE'] });
    });

    it('should filter by tenantId for all aggregations', async () => {
      mockPrisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } });

      await invoiceService.getInvoiceStats(mockTenantContext);

      const calls = mockPrisma.invoice.aggregate.mock.calls;
      calls.forEach((call) => {
        expect(call[0]!.where!.entity).toEqual({ tenantId: TENANT_ID });
        expect(call[0]!.where!.deletedAt).toBeNull();
      });
    });
  });

  // ─── Status Transition Tests ──────────────────────────────────

  describe('sendInvoice', () => {
    it('should transition DRAFT → SENT', async () => {
      const invoice = mockInvoice({ status: 'DRAFT', client: { id: CLIENT_ID, name: 'Acme', email: 'acme@test.com', entityId: ENTITY_ID } });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({ ...invoice, status: 'SENT' });

      const result = await invoiceService.sendInvoice('inv-1', mockTenantContext);

      expect(result.status).toBe('SENT');
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'SENT' } })
      );
    });

    it('should reject PAID → SENT transition', async () => {
      const invoice = mockInvoice({ status: 'PAID', client: { id: CLIENT_ID, name: 'Acme', email: 'acme@test.com', entityId: ENTITY_ID } });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(invoiceService.sendInvoice('inv-1', mockTenantContext))
        .rejects.toThrow('Invalid status transition');
    });

    it('should reject if client has no email', async () => {
      const invoice = mockInvoice({ status: 'DRAFT', client: { id: CLIENT_ID, name: 'Acme', email: null, entityId: ENTITY_ID } });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(invoiceService.sendInvoice('inv-1', mockTenantContext))
        .rejects.toThrow('Client email required');
    });
  });

  describe('cancelInvoice', () => {
    it('should transition DRAFT → CANCELLED', async () => {
      const invoice = mockInvoice({ status: 'DRAFT', paidAmount: 0 });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({ ...invoice, status: 'CANCELLED' });

      const result = await invoiceService.cancelInvoice('inv-1', mockTenantContext);
      expect(result.status).toBe('CANCELLED');
    });

    it('should reject if payments exist', async () => {
      const invoice = mockInvoice({ status: 'SENT', paidAmount: 50000 });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(invoiceService.cancelInvoice('inv-1', mockTenantContext))
        .rejects.toThrow('Cannot cancel invoice with existing payments');
    });

    it('should reject PAID → CANCELLED transition', async () => {
      const invoice = mockInvoice({ status: 'PAID', paidAmount: 0 });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(invoiceService.cancelInvoice('inv-1', mockTenantContext))
        .rejects.toThrow('Invalid status transition');
    });
  });

  describe('markInvoiceOverdue', () => {
    it('should transition SENT → OVERDUE', async () => {
      const invoice = mockInvoice({ status: 'SENT' });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({ ...invoice, status: 'OVERDUE' });

      const result = await invoiceService.markInvoiceOverdue('inv-1', mockTenantContext);
      expect(result.status).toBe('OVERDUE');
    });

    it('should reject DRAFT → OVERDUE transition', async () => {
      const invoice = mockInvoice({ status: 'DRAFT' });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(invoiceService.markInvoiceOverdue('inv-1', mockTenantContext))
        .rejects.toThrow('Invalid status transition');
    });
  });

  describe('applyPaymentToInvoice', () => {
    it('should update paidAmount and transition to PARTIALLY_PAID', async () => {
      const invoice = mockInvoice({ status: 'SENT', paidAmount: 0, total: 99000 });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({
        ...invoice, paidAmount: 50000, status: 'PARTIALLY_PAID',
      });

      const result = await invoiceService.applyPaymentToInvoice('inv-1', 50000, mockTenantContext);

      expect(result.paidAmount).toBe(50000);
      expect(result.status).toBe('PARTIALLY_PAID');
      assertIntegerCents(result.paidAmount, 'paidAmount');
    });

    it('should transition to PAID when fully paid', async () => {
      const invoice = mockInvoice({ status: 'PARTIALLY_PAID', paidAmount: 50000, total: 99000 });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({
        ...invoice, paidAmount: 99000, status: 'PAID',
      });

      const result = await invoiceService.applyPaymentToInvoice('inv-1', 49000, mockTenantContext);

      expect(result.paidAmount).toBe(99000);
      expect(result.status).toBe('PAID');
    });

    it('should reject payment exceeding balance', async () => {
      const invoice = mockInvoice({ status: 'SENT', paidAmount: 90000, total: 99000 });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(invoiceService.applyPaymentToInvoice('inv-1', 10000, mockTenantContext))
        .rejects.toThrow('would exceed invoice balance');
    });

    it('should reject zero or negative amount', async () => {
      const invoice = mockInvoice({ status: 'SENT' });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(invoiceService.applyPaymentToInvoice('inv-1', 0, mockTenantContext))
        .rejects.toThrow('Payment amount must be positive');
    });
  });

  describe('reversePaymentFromInvoice', () => {
    it('should reduce paidAmount and revert to SENT', async () => {
      const invoice = mockInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: 50000,
        total: 99000,
        dueDate: new Date('2099-01-31'), // future date
      });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({
        ...invoice, paidAmount: 0, status: 'SENT',
      });

      const result = await invoiceService.reversePaymentFromInvoice('inv-1', 50000, mockTenantContext);

      expect(result.paidAmount).toBe(0);
      expect(result.status).toBe('SENT');
    });

    it('should set OVERDUE status if due date has passed', async () => {
      const invoice = mockInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: 50000,
        total: 99000,
        dueDate: new Date('2020-01-01'), // past date
      });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({
        ...invoice, paidAmount: 0, status: 'OVERDUE',
      });

      await invoiceService.reversePaymentFromInvoice('inv-1', 50000, mockTenantContext);

      const updateArgs = mockPrisma.invoice.update.mock.calls[0][0]!;
      expect(updateArgs.data.status).toBe('OVERDUE');
    });
  });
});
