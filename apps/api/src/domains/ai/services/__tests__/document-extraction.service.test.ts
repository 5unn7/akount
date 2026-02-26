import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentExtractionService } from '../document-extraction.service';
import type { BillExtraction } from '../../schemas/bill-extraction.schema';
import type { InvoiceExtraction } from '../../schemas/invoice-extraction.schema';

// Mock Mistral provider
const mockExtractFromImage = vi.fn();

vi.mock('../providers/mistral.provider', () => ({
  MistralProvider: class MockMistralProvider {
    extractFromImage = mockExtractFromImage;
    constructor(_apiKey: string) {
      // Mock constructor
    }
  },
}));

// Mock PII redaction
vi.mock('../../../../lib/pii-redaction', () => ({
  redactImage: vi.fn((buffer) => ({
    redactedBuffer: buffer,
    redactionLog: [],
    hadPII: false,
  })),
  redactText: vi.fn((text) => ({
    redactedBuffer: Buffer.from(text),
    redactionLog: [],
    hadPII: false,
  })),
}));

// Mock prompt defense
vi.mock('../../../../lib/prompt-defense', () => ({
  analyzePromptInjection: vi.fn(() => ({
    safe: true,
    riskLevel: 'safe',
    threats: [],
    requiresReview: false,
  })),
  validateExtractedAmount: vi.fn(() => ({
    safe: true,
    riskLevel: 'safe',
    threats: [],
    requiresReview: false,
  })),
  createSecureSystemPrompt: vi.fn((prompt) => prompt),
}));

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock env
vi.mock('../../../../lib/env', () => ({
  env: {
    MISTRAL_API_KEY: 'test-api-key',
  },
}));

describe('DocumentExtractionService', () => {
  let service: DocumentExtractionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentExtractionService();
  });

  describe('extractBill', () => {
    it('should extract bill data with security pipeline', async () => {
      const mockBill: BillExtraction = {
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

      mockExtractFromImage.mockResolvedValueOnce(mockBill);

      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]); // Mock JPEG
      const result = await service.extractBill(imageBuffer, {
        tenantId: 'tenant-123',
        entityId: 'entity-456',
      });

      expect(result.data).toEqual(mockBill);
      expect(result.confidence).toBe(92);
      expect(result.modelVersion).toBe('pixtral-large-latest');
      expect(result.security.piiRedacted).toBe(false);
      expect(result.security.threats.safe).toBe(true);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0); // Can be 0 in fast tests
    });

    it('should flag PII when detected', async () => {
      const { redactImage } = await import('../../../../lib/pii-redaction');

      vi.mocked(redactImage).mockReturnValueOnce({
        redactedBuffer: Buffer.from([0xff, 0xd8]),
        redactionLog: [
          {
            type: 'credit_card',
            pattern: 'luhn_validated_cc',
            replacement: '****-****-****-1234',
          },
        ],
        hadPII: true,
      });

      const mockBill: BillExtraction = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 85,
        modelVersion: 'pixtral-large-latest',
      };

      mockExtractFromImage.mockResolvedValueOnce(mockBill);

      const result = await service.extractBill(Buffer.from([0xff, 0xd8]), {
        tenantId: 'tenant-123',
      });

      expect(result.security.piiRedacted).toBe(true);
    });

    it('should throw error if business rule validation fails', async () => {
      const invalidBill: BillExtraction = {
        vendor: 'Test',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 2000, // Wrong total!
        lineItems: [
          { description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        confidence: 90,
        modelVersion: 'test',
      };

      mockExtractFromImage.mockResolvedValueOnce(invalidBill);

      await expect(
        service.extractBill(Buffer.from([0xff, 0xd8]), {
          tenantId: 'tenant-123',
        })
      ).rejects.toThrow(/total mismatch/);
    });
  });

  describe('extractInvoice', () => {
    it('should extract invoice data with security pipeline', async () => {
      const mockInvoice: InvoiceExtraction = {
        invoiceNumber: 'INV-001',
        clientName: 'Acme Corp',
        date: '2024-01-15',
        currency: 'USD',
        subtotal: 100000,
        taxAmount: 13000,
        totalAmount: 113000,
        lineItems: [
          {
            description: 'Consulting Services - 10 hours',
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

      mockExtractFromImage.mockResolvedValueOnce(mockInvoice);

      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]);
      const result = await service.extractInvoice(imageBuffer, {
        tenantId: 'tenant-123',
      });

      expect(result.data).toEqual(mockInvoice);
      expect(result.confidence).toBe(95);
      expect(result.data.paymentTerms?.terms).toBe('NET 30');
    });

    it('should throw error if invoice totals do not balance', async () => {
      const invalidInvoice: InvoiceExtraction = {
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

      mockExtractFromImage.mockResolvedValueOnce(invalidInvoice);

      await expect(
        service.extractInvoice(Buffer.from([0xff, 0xd8]), {
          tenantId: 'tenant-123',
        })
      ).rejects.toThrow(/total mismatch/);
    });
  });

  describe('extractStatement', () => {
    it('should throw not implemented error (planned for B8)', async () => {
      await expect(
        service.extractStatement(Buffer.from('%PDF'), {
          tenantId: 'tenant-123',
        })
      ).rejects.toThrow(/not yet implemented.*B8/);
    });
  });

  describe('security integration', () => {
    it('should skip security checks when flag is set', async () => {
      const mockBill: BillExtraction = {
        vendor: 'Test',
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

      mockExtractFromImage.mockResolvedValueOnce(mockBill);

      const result = await service.extractBill(Buffer.from([0xff, 0xd8]), {
        tenantId: 'test',
        skipSecurityChecks: true,
      });

      expect(result.security.piiRedacted).toBe(false);
      expect(result.security.threats.safe).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should log and rethrow extraction errors', async () => {
      const error = new Error('Vision API Error');
      mockExtractFromImage.mockRejectedValueOnce(error);

      await expect(
        service.extractBill(Buffer.from([0xff, 0xd8]), {
          tenantId: 'tenant-123',
        })
      ).rejects.toThrow('Vision API Error');
    });
  });
});
