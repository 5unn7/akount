import { describe, it, expect } from 'vitest';
import { validateTaxId } from '../tax-id';

describe('validateTaxId', () => {
  describe('US - EIN', () => {
    it('should validate correct EIN with dashes', () => {
      const result = validateTaxId('US', '12-3456789');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('12-3456789');
    });

    it('should validate correct EIN without dashes', () => {
      const result = validateTaxId('US', '123456789');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('12-3456789');
    });

    it('should reject invalid EIN (too short)', () => {
      const result = validateTaxId('US', '1234567');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid tax ID format');
    });

    it('should reject invalid EIN (letters)', () => {
      const result = validateTaxId('US', '12-345ABC9');
      expect(result.valid).toBe(false);
    });
  });

  describe('CA - BN', () => {
    it('should validate correct BN', () => {
      const result = validateTaxId('CA', '123456789');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('123456789');
    });

    it('should reject BN with wrong length', () => {
      const result = validateTaxId('CA', '12345678');
      expect(result.valid).toBe(false);
    });

    it('should reject BN with letters', () => {
      const result = validateTaxId('CA', '12345678A');
      expect(result.valid).toBe(false);
    });
  });

  describe('IN - PAN', () => {
    it('should validate correct PAN', () => {
      const result = validateTaxId('IN', 'ABCDE1234F');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('ABCDE1234F');
    });

    it('should validate lowercase PAN and uppercase it', () => {
      const result = validateTaxId('IN', 'abcde1234f');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('ABCDE1234F');
    });

    it('should reject invalid PAN', () => {
      const result = validateTaxId('IN', '12345ABCDE');
      expect(result.valid).toBe(false);
    });
  });

  describe('IN - GSTIN', () => {
    it('should validate correct GSTIN', () => {
      const result = validateTaxId('IN', '22ABCDE1234F1Z5');
      expect(result.valid).toBe(true);
    });

    it('should reject GSTIN with wrong length', () => {
      const result = validateTaxId('IN', '22ABCDE1234');
      expect(result.valid).toBe(false);
    });
  });

  describe('Unknown country', () => {
    it('should pass through for unknown country', () => {
      const result = validateTaxId('XX', 'any-value-123');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('any-value-123');
    });

    it('should pass through for empty country', () => {
      const result = validateTaxId('', 'any-value');
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should reject empty tax ID', () => {
      const result = validateTaxId('US', '');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tax ID is required');
    });

    it('should reject whitespace-only tax ID', () => {
      const result = validateTaxId('US', '   ');
      expect(result.valid).toBe(false);
    });

    it('should handle case-insensitive country codes', () => {
      const result = validateTaxId('us', '123456789');
      expect(result.valid).toBe(true);
    });
  });
});
