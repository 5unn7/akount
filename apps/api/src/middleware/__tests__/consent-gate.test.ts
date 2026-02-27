import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { requireConsent, checkConsentOptional } from '../consent-gate';
import * as consentService from '../../domains/system/services/ai-consent.service';

// Mock consent service
vi.mock('../../domains/system/services/ai-consent.service', () => ({
  checkConsent: vi.fn(),
}));

// Mock auth context
function mockAuthContext(app: FastifyInstance) {
  app.decorateRequest('userId', '');
  app.decorateRequest('tenantId', '');
  app.decorateRequest('aiConsentGranted', false);
  app.decorateRequest('aiConsentFeature', '');

  app.addHook('onRequest', async (request) => {
    request.userId = 'test-user-id';
    request.tenantId = 'test-tenant-id';
  });
}

describe('Consent Gate Middleware (SEC-33)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    mockAuthContext(app);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('requireConsent (strict)', () => {
    it('should allow request when consent is granted', async () => {
      vi.mocked(consentService.checkConsent).mockResolvedValueOnce(true);

      app.get('/test', {
        preHandler: [requireConsent('autoCreateBills')],
        handler: async () => ({ success: true }),
      });

      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true });
      expect(consentService.checkConsent).toHaveBeenCalledWith(
        'test-user-id',
        'test-tenant-id',
        'autoCreateBills'
      );
    });

    it('should block request when consent is not granted (403)', async () => {
      vi.mocked(consentService.checkConsent).mockResolvedValueOnce(false);

      app.get('/test', {
        preHandler: [requireConsent('autoCreateBills')],
        handler: async () => ({ success: true }),
      });

      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: 'Consent Required',
        feature: 'autoCreateBills',
        consentRequired: true,
        settingsUrl: '/system/settings',
      });
    });

    it('should return 500 if auth context is missing', async () => {
      // Create app without auth context
      const bareApp = Fastify();

      bareApp.get('/test', {
        preHandler: [requireConsent('autoCreateBills')],
        handler: async () => ({ success: true }),
      });

      const response = await bareApp.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toMatchObject({
        error: 'Internal Server Error',
        message: 'Auth context not initialized',
      });

      await bareApp.close();
    });

    it('should attach consent status to request for logging', async () => {
      vi.mocked(consentService.checkConsent).mockResolvedValueOnce(true);

      let capturedRequest: FastifyRequest | null = null;

      app.get('/test', {
        preHandler: [requireConsent('autoCategorize')],
        handler: async (request) => {
          capturedRequest = request;
          return { success: true };
        },
      });

      await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.aiConsentGranted).toBe(true);
      expect(capturedRequest?.aiConsentFeature).toBe('autoCategorize');
    });

    it('should handle consent service errors gracefully', async () => {
      vi.mocked(consentService.checkConsent).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      app.get('/test', {
        preHandler: [requireConsent('autoCreateBills')],
        handler: async () => ({ success: true }),
      });

      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toMatchObject({
        error: 'Internal Server Error',
        message: 'Failed to check consent status',
      });
    });

    it('should work with different AI features', async () => {
      const features: ConsentFeature[] = [
        'autoCreateBills',
        'autoCreateInvoices',
        'autoMatchTransactions',
        'autoCategorize',
        'useCorrectionsForLearning',
      ];

      // Register all routes BEFORE testing (avoid "already listening" error)
      for (const feature of features) {
        app.get(`/test-${feature}`, {
          preHandler: [requireConsent(feature)],
          handler: async () => ({ success: true }),
        });
      }

      // Test each feature
      for (const feature of features) {
        vi.mocked(consentService.checkConsent).mockResolvedValueOnce(true);

        const response = await app.inject({
          method: 'GET',
          url: `/test-${feature}`,
        });

        expect(response.statusCode).toBe(200);
      }
    });
  });

  describe('checkConsentOptional (non-blocking)', () => {
    it('should allow request even without consent', async () => {
      vi.mocked(consentService.checkConsent).mockResolvedValueOnce(false);

      app.get('/test', {
        preHandler: [checkConsentOptional('useCorrectionsForLearning')],
        handler: async () => ({ success: true }),
      });

      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      // Request proceeds (200) even though consent is false
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true });
    });

    it('should attach consent status to request for conditional logic', async () => {
      vi.mocked(consentService.checkConsent).mockResolvedValueOnce(false);

      let capturedRequest: FastifyRequest | null = null;

      app.get('/test', {
        preHandler: [checkConsentOptional('useCorrectionsForLearning')],
        handler: async (request) => {
          capturedRequest = request;
          return { success: true };
        },
      });

      await app.inject({
        method: 'GET',
        url: '/test',
      });

      expect(capturedRequest?.aiConsentGranted).toBe(false);
      expect(capturedRequest?.aiConsentFeature).toBe('useCorrectionsForLearning');
    });

    it('should continue request even if consent check fails', async () => {
      vi.mocked(consentService.checkConsent).mockRejectedValueOnce(
        new Error('Database error')
      );

      app.get('/test', {
        preHandler: [checkConsentOptional('autoCategorize')],
        handler: async () => ({ success: true }),
      });

      const response = await app.inject({
        method: 'GET',
        url: '/test',
      });

      // Request proceeds despite error (non-blocking)
      expect(response.statusCode).toBe(200);
    });

    it('should handle missing auth context gracefully', async () => {
      const bareApp = Fastify();

      bareApp.get('/test', {
        preHandler: [checkConsentOptional('autoCategorize')],
        handler: async () => ({ success: true }),
      });

      const response = await bareApp.inject({
        method: 'GET',
        url: '/test',
      });

      // Request proceeds (consent check skipped)
      expect(response.statusCode).toBe(200);

      await bareApp.close();
    });
  });

  describe('GDPR/PIPEDA compliance', () => {
    it('should enforce opt-in model (default: deny access)', async () => {
      // User has not granted consent (new user, all toggles OFF)
      vi.mocked(consentService.checkConsent).mockResolvedValueOnce(false);

      app.post('/create-bill', {
        preHandler: [requireConsent('autoCreateBills')],
        handler: async () => ({ success: true }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/create-bill',
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().message).toContain('not enabled');
      expect(response.json().settingsUrl).toBe('/system/settings');
    });

    it('should provide clear guidance on how to grant consent', async () => {
      vi.mocked(consentService.checkConsent).mockResolvedValueOnce(false);

      app.post('/scan', {
        preHandler: [requireConsent('autoCreateInvoices')],
        handler: async () => ({ success: true }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/scan',
      });

      const body = response.json();
      expect(body.message).toContain('Enable it in Settings');
      expect(body.settingsUrl).toBeDefined();
      expect(body.consentRequired).toBe(true);
    });
  });
});
