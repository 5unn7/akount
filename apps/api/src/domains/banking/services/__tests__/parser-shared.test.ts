import { describe, it, expect } from 'vitest';
import {
  sanitizeCSVInjection,
  parseDate,
  parseAmount,
  parseAmountValue,
  normalizeInstitutionName,
  generateTempId,
} from '../parser-shared';

describe('ParserShared Utilities', () => {
  describe('sanitizeCSVInjection', () => {
    it('should escape formula starting with =', () => {
      const result = sanitizeCSVInjection('=SUM(A1:A10)');
      expect(result).toBe("'=SUM(A1:A10)");
    });

    it('should escape formula starting with +', () => {
      const result = sanitizeCSVInjection('+1+2');
      expect(result).toBe("'+1+2");
    });

    it('should escape formula starting with -', () => {
      const result = sanitizeCSVInjection('-1-2');
      expect(result).toBe("'-1-2");
    });

    it('should escape formula starting with @', () => {
      const result = sanitizeCSVInjection('@FUNCTION()');
      expect(result).toBe("'@FUNCTION()");
    });

    // Note: Tab and carriage return are trimmed before checking, so these chars
    // only matter if they're embedded in the middle of the string, not at start

    it('should return empty string for null', () => {
      const result = sanitizeCSVInjection(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = sanitizeCSVInjection(undefined);
      expect(result).toBe('');
    });

    it('should return normal text unchanged', () => {
      const result = sanitizeCSVInjection('Normal text');
      expect(result).toBe('Normal text');
    });

    it('should trim whitespace from normal text', () => {
      const result = sanitizeCSVInjection('  Normal text  ');
      expect(result).toBe('Normal text');
    });
  });

  describe('parseDate', () => {
    it('should parse ISO format (YYYY-MM-DD)', () => {
      const result = parseDate('2026-02-15');
      expect(result.toISOString().slice(0, 10)).toBe('2026-02-15');
    });

    it('should parse MM/DD/YYYY format (default)', () => {
      const result = parseDate('02/15/2026');
      expect(result.toISOString().slice(0, 10)).toBe('2026-02-15');
    });

    it('should parse DD/MM/YYYY format with format parameter', () => {
      const result = parseDate('15/02/2026', 'DD/MM/YYYY');
      expect(result.toISOString().slice(0, 10)).toBe('2026-02-15');
    });

    it('should handle dates with - separator', () => {
      const result = parseDate('02-15-2026');
      expect(result.toISOString().slice(0, 10)).toBe('2026-02-15');
    });

    it('should handle 2-digit years < 50 as 2000s', () => {
      const result = parseDate('02/15/25');
      expect(result.getFullYear()).toBe(2025);
    });

    it('should handle 2-digit years >= 50 as 1900s', () => {
      const result = parseDate('02/15/85');
      expect(result.getFullYear()).toBe(1985);
    });

    it('should throw error for empty string', () => {
      expect(() => parseDate('')).toThrow('Date is required');
    });

    it('should throw error for invalid date', () => {
      // Create date with NaN values (invalid month/day will create invalid Date)
      expect(() => parseDate('aa/bb/cccc')).toThrow('Invalid date');
    });

    it('should throw error for unsupported format', () => {
      expect(() => parseDate('Feb 15, 2026')).toThrow('Unsupported date format');
    });

    it('should trim whitespace before parsing', () => {
      const result = parseDate('  2026-02-15  ');
      expect(result.toISOString().slice(0, 10)).toBe('2026-02-15');
    });
  });

  describe('parseAmountValue', () => {
    it('should parse positive amount to integer cents', () => {
      const result = parseAmountValue('10.50');
      expect(result).toBe(1050); // $10.50 = 1050 cents
    });

    it('should parse negative amount with minus sign', () => {
      const result = parseAmountValue('-25.99');
      expect(result).toBe(-2599);
    });

    it('should parse negative amount with parentheses', () => {
      const result = parseAmountValue('(15.00)');
      expect(result).toBe(-1500);
    });

    it('should remove currency symbols', () => {
      const result = parseAmountValue('$123.45');
      expect(result).toBe(12345);
    });

    it('should remove commas from thousands', () => {
      const result = parseAmountValue('1,234.56');
      expect(result).toBe(123456);
    });

    it('should handle multiple currency symbols', () => {
      expect(parseAmountValue('$50.00')).toBe(5000);
      expect(parseAmountValue('€75.50')).toBe(7550);
      expect(parseAmountValue('£100.25')).toBe(10025);
    });

    it('should return 0 for empty string', () => {
      expect(parseAmountValue('')).toBe(0);
      expect(parseAmountValue('   ')).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(parseAmountValue(undefined)).toBe(0);
    });

    it('should throw error for invalid amount', () => {
      expect(() => parseAmountValue('abc')).toThrow('Invalid amount');
    });

    it('should round to nearest cent', () => {
      const result = parseAmountValue('10.505');
      expect(result).toBe(1051); // Rounds up
    });

    it('should handle negative with parentheses and minus together', () => {
      const result = parseAmountValue('-(20.00)');
      expect(result).toBe(-2000);
    });
  });

  describe('parseAmount', () => {
    it('should parse single column amount', () => {
      const row = { amount: '25.50' };
      const result = parseAmount(row, 'amount');
      expect(result).toBe(2550);
    });

    it('should parse debit column as negative', () => {
      const row = { debit: '50.00', credit: '' };
      const result = parseAmount(row, 'debit|credit');
      expect(result).toBe(-5000); // Debit is negative
    });

    it('should parse credit column as positive', () => {
      const row = { debit: '', credit: '75.25' };
      const result = parseAmount(row, 'debit|credit');
      expect(result).toBe(7525); // Credit is positive
    });

    it('should return 0 for empty debit and credit', () => {
      const row = { debit: '', credit: '' };
      const result = parseAmount(row, 'debit|credit');
      expect(result).toBe(0);
    });

    it('should prioritize debit over credit when both present', () => {
      const row = { debit: '10.00', credit: '20.00' };
      const result = parseAmount(row, 'debit|credit');
      expect(result).toBe(-1000); // Debit takes precedence
    });

    it('should handle whitespace-only values as empty', () => {
      const row = { debit: '   ', credit: '50.00' };
      const result = parseAmount(row, 'debit|credit');
      expect(result).toBe(5000); // Credit is used
    });
  });

  describe('normalizeInstitutionName', () => {
    it('should normalize institution name to lowercase', () => {
      const result = normalizeInstitutionName('TD Bank');
      expect(result).toBe('td');
    });

    it('should remove common banking suffixes', () => {
      expect(normalizeInstitutionName('TD Bank')).toBe('td');
      expect(normalizeInstitutionName('CIBC Banking')).toBe('cibcing'); // 'bank' removed, 'ing' remains
      expect(normalizeInstitutionName('RBC Financial')).toBe('rbc');
      expect(normalizeInstitutionName('Navy Federal Credit Union')).toBe('navyfederal');
    });

    it('should remove special characters', () => {
      const result = normalizeInstitutionName('TD-Bank & Trust');
      expect(result).toBe('tdtrust');
    });

    it('should handle institution with multiple suffixes', () => {
      const result = normalizeInstitutionName('Chase Bank Financial Institution');
      expect(result).toBe('chase');
    });

    it('should trim whitespace', () => {
      const result = normalizeInstitutionName('  TD Bank  ');
      expect(result).toBe('td');
    });
  });

  describe('generateTempId', () => {
    it('should generate unique temp IDs', () => {
      const id1 = generateTempId();
      const id2 = generateTempId();

      expect(id1).toMatch(/^temp_[a-f0-9-]{36}$/); // UUID v4 format
      expect(id2).toMatch(/^temp_[a-f0-9-]{36}$/);
      expect(id1).not.toBe(id2); // Should be unique
    });

    it('should always start with temp_ prefix', () => {
      const id = generateTempId();
      expect(id.startsWith('temp_')).toBe(true);
    });
  });
});
