import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as invoiceService from '../invoice.service';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    invoice: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock PDF service
vi.mock('../pdf.service', () => ({
  generateInvoicePdf: vi.fn(),
}));

// Mock email service
vi.mock('../../../../lib/email', () => ({
  sendEmail: vi.fn(),
}));

import { prisma } from '@akount/db';
import { generateInvoicePdf } from '../pdf.service';
import { sendEmail } from '../../../../lib/email';

const mockGeneratePdf = generateInvoicePdf as ReturnType<typeof vi.fn>;
const mockSendEmail = sendEmail as ReturnType<typeof vi.fn>;
const mockInvoiceFindFirst = prisma.invoice.findFirst as ReturnType<typeof vi.fn>;
const mockInvoiceUpdate = prisma.invoice.update as ReturnType<typeof vi.fn>;

const TENANT_ID = 'tenant-send-test';
const ENTITY_ID = 'entity-send-test';
const CLIENT_ID = 'client-send-test';

const mockCtx = {
  tenantId: TENANT_ID,
  userId: 'user-send-test',
  role: 'OWNER' as const,
};

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

function mockInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-send-1',
    invoiceNumber: 'INV-2024-001',
    entityId: ENTITY_ID,
    clientId: CLIENT_ID,
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    currency: 'CAD',
    subtotal: 100000,
    taxAmount: 13000,
    total: 113000,
    paidAmount: 0,
    status: 'DRAFT',
    notes: null,
    deletedAt: null,
    client: {
      id: CLIENT_ID,
      name: 'Acme Corp',
      email: 'billing@acme.com',
      entityId: ENTITY_ID,
    },
    entity: {
      id: ENTITY_ID,
      name: 'Test Company',
      tenantId: TENANT_ID,
      country: 'Canada',
      address: null,
      city: null,
      state: null,
      postalCode: null,
      taxId: null,
    },
    invoiceLines: [
      {
        id: 'line-1',
        description: 'Service',
        quantity: 1,
        unitPrice: 100000,
        amount: 113000,
        taxAmount: 13000,
      },
    ],
    ...overrides,
  };
}

describe('Invoice Send & PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendInvoice', () => {
    it('should generate PDF, send email, and transition to SENT', async () => {
      const invoice = mockInvoice();
      const sentInvoice = { ...invoice, status: 'SENT' };
      const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf content');

      mockInvoiceFindFirst.mockResolvedValue(invoice);
      mockGeneratePdf.mockResolvedValue(pdfBuffer);
      mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-123' });
      mockInvoiceUpdate.mockResolvedValue(sentInvoice);

      const result = await invoiceService.sendInvoice('inv-send-1', mockCtx, mockLogger);

      expect(result.status).toBe('SENT');

      // Should have called PDF generation
      expect(mockGeneratePdf).toHaveBeenCalledOnce();

      // Should have called email service
      expect(mockSendEmail).toHaveBeenCalledOnce();
      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.to).toBe('billing@acme.com');
      expect(emailCall.subject).toContain('INV-2024-001');
      expect(emailCall.attachments).toHaveLength(1);
      expect(emailCall.attachments[0].filename).toBe('INV-2024-001.pdf');
      expect(emailCall.attachments[0].content).toBe(pdfBuffer);

      // Should have updated status
      expect(mockInvoiceUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-send-1' },
          data: { status: 'SENT' },
        })
      );
    });

    it('should fail if invoice is not in DRAFT status', async () => {
      const invoice = mockInvoice({ status: 'PAID' });
      mockInvoiceFindFirst.mockResolvedValue(invoice);

      await expect(
        invoiceService.sendInvoice('inv-send-1', mockCtx, mockLogger)
      ).rejects.toThrow('Invalid status transition');

      expect(mockGeneratePdf).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should fail if client has no email', async () => {
      const invoice = mockInvoice({
        client: { id: CLIENT_ID, name: 'No Email Corp', email: null, entityId: ENTITY_ID },
      });
      mockInvoiceFindFirst.mockResolvedValue(invoice);

      await expect(
        invoiceService.sendInvoice('inv-send-1', mockCtx, mockLogger)
      ).rejects.toThrow('Client email required');

      expect(mockGeneratePdf).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should fail if email send fails', async () => {
      const invoice = mockInvoice();
      const pdfBuffer = Buffer.from('%PDF-1.4 mock');

      mockInvoiceFindFirst.mockResolvedValue(invoice);
      mockGeneratePdf.mockResolvedValue(pdfBuffer);
      mockSendEmail.mockResolvedValue({ success: false, error: 'SMTP error' });

      await expect(
        invoiceService.sendInvoice('inv-send-1', mockCtx, mockLogger)
      ).rejects.toThrow('Failed to send invoice email');

      // Should NOT have updated status (email failed)
      expect(mockInvoiceUpdate).not.toHaveBeenCalled();
    });

    it('should fail if invoice not found (tenant isolation)', async () => {
      mockInvoiceFindFirst.mockResolvedValue(null);

      await expect(
        invoiceService.sendInvoice('inv-wrong-tenant', mockCtx, mockLogger)
      ).rejects.toThrow('Invoice not found');
    });

    it('should work without logger (skip email, just transition)', async () => {
      const invoice = mockInvoice();
      const sentInvoice = { ...invoice, status: 'SENT' };
      const pdfBuffer = Buffer.from('%PDF-1.4 mock');

      mockInvoiceFindFirst.mockResolvedValue(invoice);
      mockGeneratePdf.mockResolvedValue(pdfBuffer);
      mockInvoiceUpdate.mockResolvedValue(sentInvoice);

      const result = await invoiceService.sendInvoice('inv-send-1', mockCtx);

      expect(result.status).toBe('SENT');
      // PDF is still generated
      expect(mockGeneratePdf).toHaveBeenCalledOnce();
      // But email is NOT sent (no logger = skip email)
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('getInvoicePdf', () => {
    it('should return a PDF buffer for a valid invoice', async () => {
      const invoice = mockInvoice();
      const pdfBuffer = Buffer.from('%PDF-1.4 test content');

      mockInvoiceFindFirst.mockResolvedValue(invoice);
      mockGeneratePdf.mockResolvedValue(pdfBuffer);

      const result = await invoiceService.getInvoicePdf('inv-send-1', mockCtx);

      expect(result).toBeInstanceOf(Buffer);
      expect(result).toBe(pdfBuffer);
      expect(mockGeneratePdf).toHaveBeenCalledWith(invoice);
    });

    it('should fail if invoice not found', async () => {
      mockInvoiceFindFirst.mockResolvedValue(null);

      await expect(
        invoiceService.getInvoicePdf('inv-missing', mockCtx)
      ).rejects.toThrow('Invoice not found');
    });
  });
});
