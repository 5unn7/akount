import { describe, it, expect } from 'vitest';
import { generateInvoicePdf } from '../pdf.service';

/**
 * PDF Service Tests
 *
 * Validates that invoice PDF generation:
 * - Produces a non-empty Buffer
 * - Output starts with %PDF header (valid PDF)
 * - Handles invoices with line items
 * - Handles invoices with partial payments
 * - Handles multi-currency
 * - All amounts are integer cents (formatted for display)
 */

function mockInvoiceForPdf(overrides: Record<string, unknown> = {}) {
  return {
    invoiceNumber: 'INV-001',
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    currency: 'CAD',
    subtotal: 100000,  // $1,000.00
    taxAmount: 13000,   // $130.00
    total: 113000,      // $1,130.00
    paidAmount: 0,
    notes: null,
    invoiceLines: [
      {
        description: 'Web Development Services',
        quantity: 10,
        unitPrice: 10000,   // $100.00 per unit
        amount: 113000,     // $1,130.00 (including tax)
        taxAmount: 13000,   // $130.00
      },
    ],
    client: {
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1-555-0100',
      address: '123 Main St, Toronto, ON M5V 1A1',
    },
    entity: {
      name: 'Test Company Inc.',
      address: '456 Business Ave',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5V 2B2',
      country: 'Canada',
      taxId: '123456789RT0001',
    },
    ...overrides,
  };
}

describe('PdfService', () => {
  describe('generateInvoicePdf', () => {
    it('should produce a non-empty buffer', async () => {
      const invoice = mockInvoiceForPdf();
      const buffer = await generateInvoicePdf(invoice);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should produce a valid PDF (starts with %PDF)', async () => {
      const invoice = mockInvoiceForPdf();
      const buffer = await generateInvoicePdf(invoice);

      const header = buffer.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    it('should handle invoices with multiple line items', async () => {
      const invoice = mockInvoiceForPdf({
        invoiceLines: [
          {
            description: 'Design Services',
            quantity: 5,
            unitPrice: 15000,
            amount: 86250,
            taxAmount: 11250,
          },
          {
            description: 'Development Services',
            quantity: 20,
            unitPrice: 12500,
            amount: 287500,
            taxAmount: 37500,
          },
          {
            description: 'Project Management',
            quantity: 8,
            unitPrice: 8000,
            amount: 73600,
            taxAmount: 9600,
          },
        ],
        subtotal: 390000,
        taxAmount: 58350,
        total: 448350,
      });

      const buffer = await generateInvoicePdf(invoice);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should handle invoices with partial payments', async () => {
      const invoice = mockInvoiceForPdf({
        paidAmount: 50000, // $500.00 paid
        total: 113000,
      });

      const buffer = await generateInvoicePdf(invoice);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should handle USD currency', async () => {
      const invoice = mockInvoiceForPdf({ currency: 'USD' });
      const buffer = await generateInvoicePdf(invoice);

      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should handle EUR currency', async () => {
      const invoice = mockInvoiceForPdf({ currency: 'EUR' });
      const buffer = await generateInvoicePdf(invoice);

      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle invoice with notes', async () => {
      const invoice = mockInvoiceForPdf({
        notes: 'Payment due within 30 days. Please include invoice number in your payment reference.',
      });

      const buffer = await generateInvoicePdf(invoice);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle entity with minimal info', async () => {
      const invoice = mockInvoiceForPdf({
        entity: {
          name: 'Minimal Co',
          country: 'US',
          address: null,
          city: null,
          state: null,
          postalCode: null,
          taxId: null,
        },
      });

      const buffer = await generateInvoicePdf(invoice);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle client with minimal info', async () => {
      const invoice = mockInvoiceForPdf({
        client: {
          name: 'Simple Client',
          email: null,
          phone: null,
          address: null,
        },
      });

      const buffer = await generateInvoicePdf(invoice);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
