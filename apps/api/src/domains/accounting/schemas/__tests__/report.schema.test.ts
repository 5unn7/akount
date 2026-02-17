import { describe, it, expect } from 'vitest';
import {
  ProfitLossQuerySchema,
  BalanceSheetQuerySchema,
  CashFlowQuerySchema,
  TrialBalanceQuerySchema,
  GLLedgerQuerySchema,
  SpendingQuerySchema,
  RevenueQuerySchema,
  ExportFormatSchema,
} from '../report.schema';

describe('Report Schemas', () => {
  describe('ProfitLossQuerySchema', () => {
    it('should validate valid input', () => {
      const valid = {
        entityId: 'cltest123456789012',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      const result = ProfitLossQuerySchema.parse(valid);
      expect(result.entityId).toBe('cltest123456789012');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should allow optional entityId (multi-entity mode)', () => {
      const valid = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      const result = ProfitLossQuerySchema.parse(valid);
      expect(result.entityId).toBeUndefined();
    });

    it('should reject empty string entityId (Security P0-6)', () => {
      const invalid = {
        entityId: '',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      expect(() => ProfitLossQuerySchema.parse(invalid)).toThrow();
    });

    it('should parse comparisonPeriod enum', () => {
      const valid = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        comparisonPeriod: 'PREVIOUS_YEAR',
      };
      const result = ProfitLossQuerySchema.parse(valid);
      expect(result.comparisonPeriod).toBe('PREVIOUS_YEAR');
    });
  });

  describe('BalanceSheetQuerySchema', () => {
    it('should validate valid input', () => {
      const valid = {
        asOfDate: '2026-01-31',
      };
      const result = BalanceSheetQuerySchema.parse(valid);
      expect(result.asOfDate).toBeInstanceOf(Date);
    });

    it('should allow optional comparisonDate', () => {
      const valid = {
        asOfDate: '2026-01-31',
        comparisonDate: '2025-12-31',
      };
      const result = BalanceSheetQuerySchema.parse(valid);
      expect(result.comparisonDate).toBeInstanceOf(Date);
    });
  });

  describe('TrialBalanceQuerySchema', () => {
    it('should require entityId', () => {
      const invalid = {
        asOfDate: '2026-01-31',
      };
      expect(() => TrialBalanceQuerySchema.parse(invalid)).toThrow();
    });

    it('should default asOfDate to today', () => {
      const valid = {
        entityId: 'cltest123456789012',
      };
      const result = TrialBalanceQuerySchema.parse(valid);
      expect(result.asOfDate).toBeInstanceOf(Date);
    });

    it('should accept explicit asOfDate', () => {
      const valid = {
        entityId: 'cltest123456789012',
        asOfDate: '2026-01-31',
      };
      const result = TrialBalanceQuerySchema.parse(valid);
      expect(result.asOfDate.getFullYear()).toBe(2026);
    });
  });

  describe('GLLedgerQuerySchema', () => {
    it('should require entityId and glAccountId', () => {
      const invalid = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      expect(() => GLLedgerQuerySchema.parse(invalid)).toThrow();
    });

    it('should default limit to 50', () => {
      const valid = {
        entityId: 'cltest123456789012',
        glAccountId: 'cltest987654321098',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      const result = GLLedgerQuerySchema.parse(valid);
      expect(result.limit).toBe(50);
    });

    it('should enforce max limit of 200 (Performance F11)', () => {
      const invalid = {
        entityId: 'cltest123456789012',
        glAccountId: 'cltest987654321098',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        limit: 500,
      };
      expect(() => GLLedgerQuerySchema.parse(invalid)).toThrow();
    });

    it('should accept cursor for pagination', () => {
      const valid = {
        entityId: 'cltest123456789012',
        glAccountId: 'cltest987654321098',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        cursor: 'clcursor1234567890',
      };
      const result = GLLedgerQuerySchema.parse(valid);
      expect(result.cursor).toBe('clcursor1234567890');
    });
  });

  describe('ExportFormatSchema', () => {
    it('should accept valid formats', () => {
      expect(ExportFormatSchema.parse('json')).toBe('json');
      expect(ExportFormatSchema.parse('csv')).toBe('csv');
      expect(ExportFormatSchema.parse('pdf')).toBe('pdf');
    });

    it('should reject invalid formats', () => {
      expect(() => ExportFormatSchema.parse('xml')).toThrow();
      expect(() => ExportFormatSchema.parse('excel')).toThrow();
    });
  });

  describe('SpendingQuerySchema', () => {
    it('should validate valid input', () => {
      const valid = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      const result = SpendingQuerySchema.parse(valid);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });
  });

  describe('RevenueQuerySchema', () => {
    it('should validate valid input', () => {
      const valid = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      const result = RevenueQuerySchema.parse(valid);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });
  });
});
