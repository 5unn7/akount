import { describe, it, expect, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { csrfProtection, getCsrfToken } from '../csrf';

describe('CSRF Protection Middleware (SEC-40)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    await app.register(csrfProtection);

    // Add test routes
    app.get('/test/safe', async () => ({ message: 'GET request allowed' }));

    app.post('/test/protected', async (request) => ({
      message: 'POST request protected',
      token: getCsrfToken(request),
    }));

    app.put('/test/protected', async () => ({ message: 'PUT request protected' }));

    app.delete('/test/protected', async () => ({ message: 'DELETE request protected' }));

    await app.ready();
  });

  describe('CSRF Token Generation', () => {
    it('should provide CSRF token endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/csrf-token',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
      expect(body.token.length).toBeGreaterThan(0);
    });

    it('should set _csrf cookie when generating token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/csrf-token',
      });

      const cookies = response.cookies;
      expect(cookies).toBeDefined();
      const csrfCookie = cookies.find((c) => c.name === '_csrf');
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie?.value).toBeDefined();
    });
  });

  describe('Safe Methods (GET, HEAD, OPTIONS)', () => {
    it('should allow GET requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/safe',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('GET request allowed');
    });

    it('should allow HEAD requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'HEAD',
        url: '/test/safe',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/test/safe',
      });

      // OPTIONS may return 404 if not explicitly handled, but shouldn't be CSRF-blocked
      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('State-Changing Methods (POST, PUT, PATCH, DELETE)', () => {
    it('should reject POST request without CSRF token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/protected',
        payload: { data: 'test' },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should reject PUT request without CSRF token', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/test/protected',
        payload: { data: 'test' },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should reject DELETE request without CSRF token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/test/protected',
      });

      expect(response.statusCode).toBe(403);
    });

    it('should accept POST request with valid CSRF token', async () => {
      // Step 1: Get CSRF token
      const tokenResponse = await app.inject({
        method: 'GET',
        url: '/api/csrf-token',
      });

      const { token } = JSON.parse(tokenResponse.body);
      const csrfCookie = tokenResponse.cookies.find((c) => c.name === '_csrf');

      // Step 2: Make POST request with token in header and cookie
      const response = await app.inject({
        method: 'POST',
        url: '/test/protected',
        headers: {
          'X-CSRF-Token': token,
          cookie: `_csrf=${csrfCookie?.value}`,
        },
        payload: { data: 'test' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('POST request protected');
    });

    it('should reject POST request with invalid CSRF token', async () => {
      // Get valid cookie but use wrong token in header
      const tokenResponse = await app.inject({
        method: 'GET',
        url: '/api/csrf-token',
      });

      const csrfCookie = tokenResponse.cookies.find((c) => c.name === '_csrf');

      const response = await app.inject({
        method: 'POST',
        url: '/test/protected',
        headers: {
          'X-CSRF-Token': 'invalid-token-12345',
          cookie: `_csrf=${csrfCookie?.value}`,
        },
        payload: { data: 'test' },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should reject POST request with missing X-CSRF-Token header', async () => {
      // Get token but don't send it in header
      const tokenResponse = await app.inject({
        method: 'GET',
        url: '/api/csrf-token',
      });

      const csrfCookie = tokenResponse.cookies.find((c) => c.name === '_csrf');

      const response = await app.inject({
        method: 'POST',
        url: '/test/protected',
        headers: {
          // Missing X-CSRF-Token header
          cookie: `_csrf=${csrfCookie?.value}`,
        },
        payload: { data: 'test' },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Excluded Paths', () => {
    it('should allow POST to /health without CSRF token', async () => {
      // Health check endpoint should be excluded
      const response = await app.inject({
        method: 'POST',
        url: '/health',
        payload: {},
      });

      // May return 404 if route doesn't exist, but shouldn't be CSRF-blocked
      expect([200, 404]).toContain(response.statusCode);
    });

    it('should allow POST to /api/csrf-token without CSRF token', async () => {
      // CSRF token endpoint itself should be excluded (chicken and egg problem)
      const response = await app.inject({
        method: 'POST',
        url: '/api/csrf-token',
        payload: {},
      });

      // May return 404 or 405 if POST not handled, but shouldn't be CSRF-blocked (403)
      expect([200, 404, 405]).toContain(response.statusCode);
    });
  });

  describe('getCsrfToken Helper', () => {
    it('should return valid CSRF token string', async () => {
      const tokenResponse = await app.inject({
        method: 'GET',
        url: '/api/csrf-token',
      });

      const { token } = JSON.parse(tokenResponse.body);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      // CSRF tokens are typically 36+ characters (depends on implementation)
      expect(token.length).toBeGreaterThan(10);
    });
  });
});
