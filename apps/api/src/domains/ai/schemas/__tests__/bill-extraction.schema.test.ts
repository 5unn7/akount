import { describe, it, expect } from 'vitest';
import {
  BillExtractionSchema,
  LineItemSchema,
  TaxBreakdownSchema,
  validateBillTotals,
} from '../bill-extraction.schema';

describe('Bill Extraction Schemas', () => {
  describe('LineItemSchema', () => {
    it('should validate valid line item', () => {
      const validLine = {
        description: 'Large Latte',
        quantity: 1,
        unitPrice: 550,
        amount: 550,
      };

      const result = LineItemSchema.parse(validLine);

      expect(result).toEqual(validLine);
    });

    it('should reject float amounts (integer cents required)', () => {
      const invalidLine = {
        description: 'Coffee',
        quantity: 1,
        unitPrice: 5.5, // Float!
        amount: 5.5,
      };

      expect(() => LineItemSchema.parse(invalidLine)).toThrow();
    });

    it('should reject negative amounts', () => {
      const invalidLine = {
        description: 'Item',
        quantity: 1,
        unitPrice: -100,
        amount: -100,
      };

      expect(() => LineItemSchema.parse(invalidLine)).toThrow();
    });

    it('should allow omitting quantity (optional)', () => {
      const line = {
        description: 'Item',
        unitPrice: 100,
        amount: 100,
      };

      const result = LineItemSchema.parse(line);

      expect(result.quantity).toBeUndefined();
    });

    it('should allow optional fields', () => {
      const line = {
        description: 'Item',
        quantity: 2,
        unitPrice: 100,
        amount: 200,
        taxAmount: 26,
        category: 'Office Supplies',
      };

      const result = LineItemSchema.parse(line);

      expect(result.taxAmount).toBe(26);
      expect(result.category).toBe('Office Supplies');
    });
  });

  describe('TaxBreakdownSchema', () => {
    it('should validate valid tax breakdown', () => {
      const validTax = {
        name: 'GST',
        rate: 0.05,
        amount: 75,
      };

      const result = TaxBreakdownSchema.parse(validTax);

      expect(result).toEqual(validTax);
    });

    it('should reject tax rate > 1', () => {
      const invalidTax = {
        name: 'Tax',
        rate: 1.5, // 150%!
        amount: 100,
      };

      expect(() => TaxBreakdownSchema.parse(invalidTax)).toThrow();
    });

    it('should reject negative tax rate', () => {
      const invalidTax = {
        name: 'Tax',
        rate: -0.05,
        amount: 100,
      };

      expect(() => TaxBreakdownSchema.parse(invalidTax)).toThrow();
    });
  });

  describe('BillExtractionSchema', () => {
    it('should validate complete bill extraction', () => {
      const validBill = {
        vendor: 'Starbucks',
        date: '2024-01-15',
        billNumber: 'RCP-1234',
        currency: 'CAD',
        subtotal: 1500,
        taxAmount: 75,
        totalAmount: 1575,
        lineItems: [
          {
            description: 'Large Latte',
            quantity: 1,
            unitPrice: 550,
            amount: 550,
          },
          {
            description: 'Croissant',
            quantity: 2,
            unitPrice: 475,
            amount: 950,
          },
        ],
        confidence: 92,
        modelVersion: 'pixtral-large-latest',
      };

      const result = BillExtractionSchema.parse(validBill);

      expect(result.vendor).toBe('Starbucks');
      expect(result.totalAmount).toBe(1575);
      expect(result.lineItems).toHaveLength(2);
    });

    it('should reject float amounts', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 10.5, // Float!
        taxAmount: 1.05,
        totalAmount: 11.55,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1050, amount: 1050 },
        ],
        confidence: 80,
        modelVersion: 'test',
      };

      expect(() => BillExtractionSchema.parse(invalidBill)).toThrow();
    });

    it('should reject negative amounts', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: -1050, // Negative!
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 80,
        modelVersion: 'test',
      };

      expect(() => BillExtractionSchema.parse(invalidBill)).toThrow();
    });

    it('should reject invalid date format', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '01/15/2024', // Wrong format
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 80,
        modelVersion: 'test',
      };

      expect(() => BillExtractionSchema.parse(invalidBill)).toThrow(/Date must be YYYY-MM-DD/);
    });

    it('should reject invalid currency code', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'US', // Only 2 letters
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 80,
        modelVersion: 'test',
      };

      expect(() => BillExtractionSchema.parse(invalidBill)).toThrow(/3-letter ISO code/);
    });

    it('should require at least one line item', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [], // Empty!
        confidence: 80,
        modelVersion: 'test',
      };

      expect(() => BillExtractionSchema.parse(invalidBill)).toThrow(/At least one line item/);
    });

    it('should reject confidence out of range', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 150, // > 100
        modelVersion: 'test',
      };

      expect(() => BillExtractionSchema.parse(invalidBill)).toThrow();
    });

    it('should allow optional fields', () => {
      const billWithOptionals = {
        vendor: 'Starbucks',
        date: '2024-01-15',
        billNumber: 'RCP-001',
        currency: 'CAD',
        subtotal: 1500,
        taxAmount: 75,
        totalAmount: 1575,
        lineItems: [
          { description: 'Coffee', quantity: 1, unitPrice: 1500, amount: 1500 },
        ],
        taxBreakdown: [{ name: 'GST', rate: 0.05, amount: 75 }],
        paymentTerms: { terms: 'NET 30', dueDate: '2024-02-15' },
        confidence: 95,
        fieldConfidence: {
          vendor: 98,
          date: 100,
          totalAmount: 92,
        },
        modelVersion: 'pixtral-large-latest',
        ocrText: 'Receipt from Starbucks...',
      };

      const result = BillExtractionSchema.parse(billWithOptionals);

      expect(result.taxBreakdown).toHaveLength(1);
      expect(result.paymentTerms?.terms).toBe('NET 30');
      expect(result.ocrText).toBeDefined();
    });
  });

  describe('validateBillTotals', () => {
    it('should pass when totals are correct', () => {
      const validBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item 1', quantity: 1, unitPrice: 600, amount: 600 },
          { description: 'Item 2', quantity: 1, unitPrice: 400, amount: 400 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => validateBillTotals(validBill)).not.toThrow();
    });

    it('should throw if subtotal + tax ≠ total', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 2000, // Wrong!
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => validateBillTotals(invalidBill)).toThrow(/total mismatch/);
    });

    it('should throw if line items do not sum to subtotal', () => {
      const invalidBill = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 500, amount: 500 }, // Only $5, not $10
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      expect(() => validateBillTotals(invalidBill)).toThrow(/line items total.*does not match subtotal/);
    });
  });
});
