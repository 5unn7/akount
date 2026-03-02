import { describe, it, expect } from 'vitest';
import {
  InvoiceExtractionSchema,
  InvoiceLineItemSchema,
  validateInvoiceTotals,
} from '../invoice-extraction.schema';

describe('Invoice Extraction Schemas', () => {
  describe('InvoiceLineItemSchema', () => {
    it('should validate valid line item', () => {
      const validLine = {
        description: 'Consulting Services - 10 hours',
        quantity: 10,
        unitPrice: 10000, // $100/hour
        amount: 100000, // $1,000
      };

      const result = InvoiceLineItemSchema.parse(validLine);

      expect(result).toEqual(validLine);
    });

    it('should reject float amounts', () => {
      const invalidLine = {
        description: 'Service',
        quantity: 1,
        unitPrice: 100.5, // Float!
        amount: 100.5,
      };

      expect(() => InvoiceLineItemSchema.parse(invalidLine)).toThrow();
    });

    it('should allow omitting quantity (optional)', () => {
      const line = {
        description: 'One-time setup fee',
        unitPrice: 5000,
        amount: 5000,
      };

      const result = InvoiceLineItemSchema.parse(line);

      expect(result.quantity).toBeUndefined();
    });
  });

  describe('InvoiceExtractionSchema', () => {
    it('should validate complete invoice extraction', () => {
      const validInvoice = {
        invoiceNumber: 'INV-001',
        clientName: 'Acme Corp',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 100000,
        taxAmount: 13000,
        totalAmount: 113000,
        lineItems: [
          {
            description: 'Consulting - 10 hours',
            quantity: 10,
            unitPrice: 10000,
            amount: 100000,
          },
        ],
        paymentTerms: {
          terms: 'NET 30',
          dueDate: '2024-02-15',
        },
        confidence: 95,
        modelVersion: 'pixtral-large-latest',
      };

      const result = InvoiceExtractionSchema.parse(validInvoice);

      expect(result.clientName).toBe('Acme Corp');
      expect(result.totalAmount).toBe(113000);
      expect(result.lineItems).toHaveLength(1);
    });

    it('should reject float amounts', () => {
      const invalidInvoice = {
        clientName: 'Test Client',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 100.5, // Float!
        taxAmount: 13.0,
        totalAmount: 113.5,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 10050, amount: 10050 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => InvoiceExtractionSchema.parse(invalidInvoice)).toThrow();
    });

    it('should reject negative amounts', () => {
      const invalidInvoice = {
        clientName: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: -50, // Negative!
        totalAmount: 950,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => InvoiceExtractionSchema.parse(invalidInvoice)).toThrow();
    });

    it('should require client name', () => {
      const invalidInvoice = {
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => InvoiceExtractionSchema.parse(invalidInvoice)).toThrow(); // Zod throws "Required"
    });

    it('should validate payment terms due date format', () => {
      const invalidInvoice = {
        clientName: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        paymentTerms: {
          terms: 'NET 30',
          dueDate: '01/15/2024', // Wrong format
        },
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => InvoiceExtractionSchema.parse(invalidInvoice)).toThrow();
    });

    it('should allow optional invoice number', () => {
      const invoice = {
        clientName: 'Test Client',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      const result = InvoiceExtractionSchema.parse(invoice);

      expect(result.invoiceNumber).toBeUndefined();
    });

    it('should allow client contact information', () => {
      const invoice = {
        invoiceNumber: 'INV-001',
        clientName: 'Acme Corp',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 10000,
        taxAmount: 500,
        totalAmount: 10500,
        lineItems: [
          { description: 'Service', quantity: 1, unitPrice: 10000, amount: 10000 },
        ],
        clientContact: {
          email: 'billing@acme.com',
          phone: '555-123-4567',
          address: '123 Main St, Toronto ON',
        },
        confidence: 92,
        modelVersion: 'pixtral-large-latest',
      };

      const result = InvoiceExtractionSchema.parse(invoice);

      expect(result.clientContact?.email).toBe('billing@acme.com');
      expect(result.clientContact?.phone).toBe('555-123-4567');
    });
  });

  describe('validateInvoiceTotals', () => {
    it('should pass when totals are correct', () => {
      const validInvoice = {
        clientName: 'Test Client',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 10000,
        taxAmount: 1300,
        totalAmount: 11300,
        lineItems: [
          { description: 'Service 1', quantity: 1, unitPrice: 6000, amount: 6000 },
          { description: 'Service 2', quantity: 1, unitPrice: 4000, amount: 4000 },
        ],
        confidence: 95,
        modelVersion: 'test',
      };

      expect(() => validateInvoiceTotals(validInvoice)).not.toThrow();
    });

    it('should throw if subtotal + tax ≠ total', () => {
      const invalidInvoice = {
        clientName: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 10000,
        taxAmount: 1300,
        totalAmount: 20000, // Wrong!
        lineItems: [
          { description: 'Service', quantity: 1, unitPrice: 10000, amount: 10000 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => validateInvoiceTotals(invalidInvoice)).toThrow(/total mismatch/);
    });

    it('should throw if line items do not sum to subtotal', () => {
      const invalidInvoice = {
        clientName: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 10000,
        taxAmount: 1300,
        totalAmount: 11300,
        lineItems: [
          { description: 'Service', quantity: 1, unitPrice: 5000, amount: 5000 }, // Only $50!
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => validateInvoiceTotals(invalidInvoice)).toThrow(/line items total.*does not match subtotal/);
    });
  });
});
