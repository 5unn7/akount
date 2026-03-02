import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, validateResponse } from '../validation';

// Minimal Fastify request/reply mocks
function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    body: undefined,
    query: undefined,
    params: undefined,
    ...overrides,
  } as unknown;
}

function createMockReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply;
}

describe('validation middleware', () => {
  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(1),
      amount: z.number().int(),
    });

    it('should pass valid body through', async () => {
      const request = createMockRequest({ body: { name: 'Test', amount: 1000 } });
      const reply = createMockReply();

      const middleware = validateBody(schema);
      await middleware(request as never, reply as never);

      expect(reply.status).not.toHaveBeenCalled();
      expect((request as Record<string, unknown>).body).toEqual({ name: 'Test', amount: 1000 });
    });

    it('should replace body with parsed value (strips unknown fields)', async () => {
      const request = createMockRequest({
        body: { name: 'Test', amount: 1000, extra: 'field' },
      });
      const reply = createMockReply();

      const middleware = validateBody(schema);
      await middleware(request as never, reply as never);

      // Zod strips unknown fields by default
      expect((request as Record<string, unknown>).body).toEqual({ name: 'Test', amount: 1000 });
    });

    it('should return 400 for invalid body', async () => {
      const request = createMockRequest({ body: { name: '', amount: 'not-a-number' } });
      const reply = createMockReply();

      const middleware = validateBody(schema);
      await middleware(request as never, reply as never);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          message: 'Request body validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ path: expect.any(String), message: expect.any(String) }),
          ]),
        })
      );
    });

    it('should include path and message in error details', async () => {
      const request = createMockRequest({ body: {} });
      const reply = createMockReply();

      const middleware = validateBody(schema);
      await middleware(request as never, reply as never);

      expect(reply.status).toHaveBeenCalledWith(400);
      const sentData = reply.send.mock.calls[0][0];
      expect(sentData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'name' }),
          expect.objectContaining({ path: 'amount' }),
        ])
      );
    });

    it('should re-throw non-Zod errors', async () => {
      const badSchema = {
        parse: () => {
          throw new Error('unexpected error');
        },
      } as unknown as z.ZodSchema;

      const request = createMockRequest({ body: {} });
      const reply = createMockReply();

      const middleware = validateBody(badSchema);
      await expect(middleware(request as never, reply as never)).rejects.toThrow('unexpected error');
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      limit: z.coerce.number().int().min(1).max(100),
      cursor: z.string().optional(),
    });

    it('should pass valid query through', async () => {
      const request = createMockRequest({ query: { limit: '10' } });
      const reply = createMockReply();

      const middleware = validateQuery(schema);
      await middleware(request as never, reply as never);

      expect(reply.status).not.toHaveBeenCalled();
      expect((request as Record<string, unknown>).query).toEqual({ limit: 10 });
    });

    it('should return 400 for invalid query', async () => {
      const request = createMockRequest({ query: { limit: '-5' } });
      const reply = createMockReply();

      const middleware = validateQuery(schema);
      await middleware(request as never, reply as never);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          message: 'Query parameters validation failed',
        })
      );
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().min(1),
    });

    it('should pass valid params through', async () => {
      const request = createMockRequest({ params: { id: 'abc-123' } });
      const reply = createMockReply();

      const middleware = validateParams(schema);
      await middleware(request as never, reply as never);

      expect(reply.status).not.toHaveBeenCalled();
      expect((request as Record<string, unknown>).params).toEqual({ id: 'abc-123' });
    });

    it('should return 400 for missing params', async () => {
      const request = createMockRequest({ params: {} });
      const reply = createMockReply();

      const middleware = validateParams(schema);
      await middleware(request as never, reply as never);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          message: 'URL parameters validation failed',
        })
      );
    });
  });

  describe('validateResponse', () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
    });

    it('should return parsed data for valid input', () => {
      const result = validateResponse(schema, { id: '1', name: 'Test' });
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('should throw ZodError for invalid input', () => {
      expect(() => validateResponse(schema, { id: '1' })).toThrow();
    });
  });
});
