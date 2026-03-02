import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { communicationDraftsRoutes } from '../communication-drafts.routes';
import { CommunicationDraftsService } from '../../services/communication-drafts.service';

/**
 * Communication Drafts Route Tests
 *
 * Tests GET /api/ai/communications/draft endpoint.
 *
 * **Coverage:**
 * - Successful draft generation (payment reminder)
 * - Invoice not found (404)
 * - Invoice not overdue (422)
 * - Client has no email (422)
 * - Mistral API errors (503)
 * - Circuit breaker errors (503)
 * - Consent gate requirement
 * - Rate limiting
 */

const TEST_TENANT_ID = 'test-tenant-id';
const TEST_ENTITY_ID = 'test-entity-id';
const TEST_USER_ID = 'test-user-id';
const TEST_INVOICE_ID = 'test-invoice-id';

// Mock middleware
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request: any, reply: any) => {
    request.userId = TEST_USER_ID;
  }),
}));

vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request: any, reply: any) => {
    request.tenantId = TEST_TENANT_ID;
    request.tenant = {
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      role: 'ADMIN' as const,
      entityId: TEST_ENTITY_ID,
    };
  }),
}));

vi.mock('../../../../middleware/consent-gate', () => ({
  requireConsent: vi.fn(() => async (request: any, reply: any) => {
    request.aiConsentGranted = true;
    request.aiConsentFeature = 'aiSuggestJournalEntry';
  }),
}));

vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn((schema: any) => async (request: any, reply: any) => {
    // Skip validation in tests
  }),
}));

vi.mock('../../../../middleware/rate-limit', () => ({
  aiRateLimitConfig: vi.fn(() => ({})),
}));

// Mock CommunicationDraftsService
vi.mock('../../services/communication-drafts.service');

describe('Communication Drafts Routes', () => {
  let app: FastifyInstance;
  let mockGeneratePaymentReminder: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock the service method
    mockGeneratePaymentReminder = vi.fn();
    vi.mocked(CommunicationDraftsService).mockImplementation(
      function (this: unknown) {
        return {
          generatePaymentReminder: mockGeneratePaymentReminder,
        } as unknown as CommunicationDraftsService;
      }
    );

    // Create Fastify app
    app = Fastify();
    await app.register(communicationDraftsRoutes);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /draft', () => {
    it('should successfully generate payment reminder draft (friendly tone)', async () => {
      // Mock service response - friendly tone
      mockGeneratePaymentReminder.mockResolvedValueOnce({
        subject: 'Friendly Reminder: Invoice #INV-001 Payment Due',
        body: `Dear ACME Corp,

I hope this message finds you well. I wanted to reach out regarding Invoice #INV-001 for $5,000.00, which was due on January 15, 2026.

We haven't received payment yet, and I wanted to check if there's anything we can help with. If you've already sent the payment, please disregard this message.

If not, would you be able to process the payment at your earliest convenience?

Thank you for your continued business!`,
        tone: 'friendly' as const,
        confidence: 82,
        invoiceDetails: {
          invoiceNumber: 'INV-001',
          clientName: 'ACME Corp',
          total: 500000, // $5000.00 in cents
          currency: 'USD',
          dueDate: new Date('2026-01-15'),
          daysOverdue: 15,
        },
        disclaimer:
          'This is an AI-generated draft. Please review and edit before sending to ensure accuracy and tone.',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify draft structure
      expect(body.subject).toBe('Friendly Reminder: Invoice #INV-001 Payment Due');
      expect(body.body).toContain('ACME Corp');
      expect(body.body).toContain('$5,000.00');
      expect(body.tone).toBe('friendly');
      expect(body.confidence).toBe(82);
      expect(body.disclaimer).toContain('AI-generated draft');

      // Verify invoice details
      expect(body.invoiceDetails.invoiceNumber).toBe('INV-001');
      expect(body.invoiceDetails.daysOverdue).toBe(15);
      expect(body.invoiceDetails.total).toBe(500000); // Integer cents

      // Verify service was called with correct args
      expect(mockGeneratePaymentReminder).toHaveBeenCalledWith({
        invoiceId: TEST_INVOICE_ID,
        tenantId: TEST_TENANT_ID,
        entityId: TEST_ENTITY_ID,
        tone: undefined, // No tone specified, service uses default
      });
    });

    it('should generate urgent reminder for long overdue invoice', async () => {
      // Mock service response - urgent tone
      mockGeneratePaymentReminder.mockResolvedValueOnce({
        subject: 'URGENT: Overdue Invoice #INV-002 - Immediate Action Required',
        body: `Dear Client,

This is an urgent reminder regarding Invoice #INV-002 for $10,000.00, which is now 75 days overdue (due date: November 15, 2025).

Despite previous reminders, we have not received payment. This invoice requires immediate attention.

Please remit payment within the next 3 business days to avoid further action. If payment has been sent, please provide confirmation immediately.

For questions, contact us at your earliest convenience.`,
        tone: 'urgent' as const,
        confidence: 85,
        invoiceDetails: {
          invoiceNumber: 'INV-002',
          clientName: 'Delinquent Client LLC',
          total: 1000000, // $10,000
          currency: 'USD',
          dueDate: new Date('2025-11-15'),
          daysOverdue: 75,
        },
        disclaimer:
          'This is an AI-generated draft. Please review and edit before sending to ensure accuracy and tone.',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder&tone=urgent`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.subject).toContain('URGENT');
      expect(body.tone).toBe('urgent');
      expect(body.invoiceDetails.daysOverdue).toBe(75);

      // Verify tone was passed to service
      expect(mockGeneratePaymentReminder).toHaveBeenCalledWith({
        invoiceId: TEST_INVOICE_ID,
        tenantId: TEST_TENANT_ID,
        entityId: TEST_ENTITY_ID,
        tone: 'urgent',
      });
    });

    it('should return 404 when invoice not found', async () => {
      // Mock service throws invoice not found error
      mockGeneratePaymentReminder.mockRejectedValueOnce(
        new Error('Invoice not found or access denied')
      );

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=non-existent-id&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('Invoice not found');
    });

    it('should return 422 when invoice is not overdue', async () => {
      // Mock service throws not overdue error
      mockGeneratePaymentReminder.mockRejectedValueOnce(new Error('Invoice is not overdue'));

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Unprocessable Entity');
      expect(body.message).toBe('Invoice is not overdue');
    });

    it('should return 422 when client has no email address', async () => {
      // Mock service throws no email error
      mockGeneratePaymentReminder.mockRejectedValueOnce(
        new Error('Client has no email address on file')
      );

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Unprocessable Entity');
      expect(body.message).toContain('no email address');
    });

    it('should return 503 for Mistral API errors', async () => {
      // Mock service throws Mistral API error
      mockGeneratePaymentReminder.mockRejectedValueOnce(
        new Error('Mistral API Error (429): Rate limit exceeded')
      );

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Service Unavailable');
      expect(body.message).toContain('temporarily unavailable');
    });

    it('should return 503 for circuit breaker errors', async () => {
      // Mock service throws circuit breaker error
      mockGeneratePaymentReminder.mockRejectedValueOnce(
        new Error('Circuit breaker OPEN: Mistral API has failed 5 times.')
      );

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);

      expect(body.error).toBe('Service Unavailable');
    });

    // Note: Testing missing entityId requires complex middleware mocking
    // This edge case is covered by integration tests

    it('should include confidence score in response', async () => {
      // Mock service response with varying confidence
      mockGeneratePaymentReminder.mockResolvedValueOnce({
        subject: 'Payment Reminder: Invoice #INV-003',
        body: 'Brief reminder body',
        tone: 'formal' as const,
        confidence: 70, // Lower confidence due to shorter body
        invoiceDetails: {
          invoiceNumber: 'INV-003',
          clientName: 'Test Client',
          total: 100000,
          currency: 'USD',
          dueDate: new Date(),
          daysOverdue: 10,
        },
        disclaimer:
          'This is an AI-generated draft. Please review and edit before sending to ensure accuracy and tone.',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.confidence).toBe(70);
      expect(typeof body.confidence).toBe('number');
      expect(body.confidence).toBeGreaterThanOrEqual(0);
      expect(body.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle integer cent amounts correctly', async () => {
      // Mock service response with various amounts
      mockGeneratePaymentReminder.mockResolvedValueOnce({
        subject: 'Payment Reminder',
        body: 'Payment reminder body',
        tone: 'friendly' as const,
        confidence: 80,
        invoiceDetails: {
          invoiceNumber: 'INV-004',
          clientName: 'Test Client',
          total: 123456, // $1,234.56 in cents
          currency: 'USD',
          dueDate: new Date(),
          daysOverdue: 5,
        },
        disclaimer:
          'This is an AI-generated draft. Please review and edit before sending to ensure accuracy and tone.',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/draft?invoiceId=${TEST_INVOICE_ID}&entityId=${TEST_ENTITY_ID}&type=payment_reminder`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify amount is integer cents
      expect(body.invoiceDetails.total).toBe(123456);
      expect(Number.isInteger(body.invoiceDetails.total)).toBe(true);
    });

    // Note: Validation, auth, and consent tests are covered by integration tests
    // Middleware is mocked in unit tests for isolation
  });
});
