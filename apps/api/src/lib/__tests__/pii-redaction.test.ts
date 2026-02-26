import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redactText, redactImage } from '../pii-redaction';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PII Redaction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('redactText - credit cards', () => {
    it('should redact valid credit card numbers (Luhn validated)', () => {
      // Valid Visa test card: 4532015112830366
      const text = 'Please charge card 4532015112830366 for payment.';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(
        'Please charge card ****-****-****-0366 for payment.'
      );
      expect(result.hadPII).toBe(true);
      expect(result.redactionLog).toHaveLength(1);
      expect(result.redactionLog[0].type).toBe('credit_card');
      expect(result.redactionLog[0].replacement).toBe('****-****-****-0366');
    });

    it('should redact credit cards with spaces/dashes', () => {
      const text = 'Card: 4532-0151-1283-0366';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toContain('****-****-****-0366');
      expect(result.hadPII).toBe(true);
    });

    it('should NOT redact invalid credit card numbers (Luhn fails)', () => {
      const text = 'Random number: 1234567812345678';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });

    it('should redact multiple credit cards', () => {
      const text =
        'Card 1: 4532015112830366, Card 2: 5425233430109903';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toContain('****-****-****-0366');
      expect(result.redactedBuffer.toString()).toContain('****-****-****-9903');
      expect(result.redactionLog).toHaveLength(2);
    });
  });

  describe('redactText - SSN/SIN', () => {
    it('should redact US SSN with dashes', () => {
      const text = 'SSN: 123-45-6789';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe('SSN: ***-**-****');
      expect(result.hadPII).toBe(true);
      expect(result.redactionLog[0].type).toBe('ssn');
    });

    it('should redact US SSN without dashes', () => {
      const text = 'SSN: 123456789';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe('SSN: ***-**-****');
      expect(result.hadPII).toBe(true);
    });

    it('should redact Canadian SIN', () => {
      const text = 'SIN: 123-456-789';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe('SIN: ***-***-***');
      expect(result.hadPII).toBe(true);
      expect(result.redactionLog[0].type).toBe('sin');
    });
  });

  describe('redactText - emails', () => {
    it('should redact email addresses', () => {
      const text = 'Contact: john.doe@example.com for details';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(
        'Contact: ***@example.com for details'
      );
      expect(result.hadPII).toBe(true);
      expect(result.redactionLog[0].type).toBe('email');
    });

    it('should preserve domain for context', () => {
      const text = 'vendor@starbucks.com';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe('***@starbucks.com');
      expect(result.hadPII).toBe(true);
    });

    it('should redact multiple emails', () => {
      const text = 'From: alice@test.com To: bob@example.org';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toContain('***@test.com');
      expect(result.redactedBuffer.toString()).toContain('***@example.org');
      expect(result.redactionLog).toHaveLength(2);
    });
  });

  describe('redactText - phone numbers', () => {
    it('should redact phone numbers with parentheses', () => {
      const text = 'Call: (555) 123-4567';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe('Call: ***-***-****');
      expect(result.hadPII).toBe(true);
      expect(result.redactionLog[0].type).toBe('phone');
    });

    it('should redact phone numbers with dashes', () => {
      const text = 'Phone: 555-123-4567';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe('Phone: ***-***-****');
      expect(result.hadPII).toBe(true);
    });

    it('should redact 10-digit phone numbers', () => {
      const text = 'Mobile: 5551234567';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe('Mobile: ***-***-****');
      expect(result.hadPII).toBe(true);
    });
  });

  describe('redactText - bank accounts', () => {
    it('should redact bank account numbers', () => {
      const text = 'Account: 12345678901234';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toContain('****1234');
      expect(result.hadPII).toBe(true);
      expect(result.redactionLog[0].type).toBe('bank_account');
    });

    it('should NOT redact amounts with currency context', () => {
      const text = 'Total: $100000 USD';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });

    it('should NOT redact dates (YYYYMMDD format)', () => {
      const text = 'Date: 20240115';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });

    it('should NOT redact invoice amounts in cents', () => {
      const text = 'Invoice amount: 155000 (in cents)';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });
  });

  describe('redactText - allowlist (financial data preserved)', () => {
    it('should preserve vendor names', () => {
      const text = 'Vendor: Starbucks';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });

    it('should preserve amounts with currency symbols', () => {
      const text = 'Total: $15.50 USD';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });

    it('should preserve dates', () => {
      const text = 'Date: 2024-01-15';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });

    it('should preserve currencies', () => {
      const text = 'Currency: CAD, EUR, GBP';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });
  });

  describe('redactText - complex receipt (integration test)', () => {
    it('should redact PII while preserving financial data', () => {
      const receipt = `
Receipt from Starbucks
Date: 2024-01-15
Total: $15.50 CAD

Payment method: Credit Card ****-0366
Card number: 4532015112830366

Customer email: john.doe@gmail.com
Phone: 555-123-4567

Thank you for your purchase!
      `.trim();

      const result = redactText(receipt);
      const redacted = result.redactedBuffer.toString();

      // Verify financial data preserved
      expect(redacted).toContain('Starbucks');
      expect(redacted).toContain('2024-01-15');
      expect(redacted).toContain('$15.50 CAD');

      // Verify PII redacted
      expect(redacted).toContain('****-****-****-0366');
      expect(redacted).toContain('***@gmail.com');
      expect(redacted).toContain('***-***-****');

      // Verify audit log
      expect(result.hadPII).toBe(true);
      expect(result.redactionLog.length).toBeGreaterThan(2);
    });
  });

  describe('redactImage - EXIF stripping', () => {
    it('should strip EXIF from JPEG images', () => {
      // Mock JPEG with APP1 (EXIF) segment
      // Structure: SOI (FFD8) + APP1 (FFE1) + length + data + SOS (FFDA) + image data + EOI (FFD9)
      const mockJPEG = Buffer.from([
        0xff,
        0xd8, // SOI
        0xff,
        0xe1, // APP1 (EXIF marker)
        0x00,
        0x10, // Length: 16 bytes
        ...Array(14).fill(0x00), // EXIF data (garbage for test)
        0xff,
        0xda, // SOS (Start of Scan)
        0x00,
        0x0c, // Length
        ...Array(10).fill(0xaa), // Image data
        0xff,
        0xd9, // EOI
      ]);

      const result = redactImage(mockJPEG);

      expect(result.hadPII).toBe(true);
      expect(result.redactionLog).toHaveLength(1);
      expect(result.redactionLog[0].type).toBe('exif_metadata');

      // Verify EXIF segment was removed
      const redacted = result.redactedBuffer;
      expect(redacted[0]).toBe(0xff);
      expect(redacted[1]).toBe(0xd8); // SOI preserved
      expect(redacted.length).toBeLessThan(mockJPEG.length); // Smaller after EXIF removal
    });

    it('should return non-JPEG images unchanged', () => {
      // PNG magic bytes
      const mockPNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

      const result = redactImage(mockPNG);

      expect(result.redactedBuffer).toEqual(mockPNG);
      expect(result.hadPII).toBe(false);
      expect(result.redactionLog).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const result = redactText('');

      expect(result.redactedBuffer.toString()).toBe('');
      expect(result.hadPII).toBe(false);
    });

    it('should handle text with no PII', () => {
      const text = 'Invoice from Vendor ABC for $100.00 dated 2024-01-15';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toBe(text);
      expect(result.hadPII).toBe(false);
    });

    it('should handle mixed PII and safe data', () => {
      const text = 'Email: test@example.com, Invoice: $50.00, Date: 2024-01-15';

      const result = redactText(text);

      expect(result.redactedBuffer.toString()).toContain('***@example.com');
      expect(result.redactedBuffer.toString()).toContain('$50.00');
      expect(result.redactedBuffer.toString()).toContain('2024-01-15');
      expect(result.hadPII).toBe(true);
    });
  });
});
