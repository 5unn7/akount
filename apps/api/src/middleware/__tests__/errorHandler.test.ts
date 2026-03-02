import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError, ZodIssue } from 'zod';
import { errorHandler } from '../errorHandler';

function createMockRequest() {
  return {
    url: '/api/test',
    method: 'GET',
    params: {},
    query: {},
    log: {
      error: vi.fn(),
    },
  } as unknown;
}

function createMockReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply;
}

describe('errorHandler', () => {
  let request: ReturnType<typeof createMockRequest>;
  let reply: ReturnType<typeof createMockReply>;

  beforeEach(() => {
    request = createMockRequest();
    reply = createMockReply();
  });

  it('should handle ZodError with 400 status', () => {
    const zodIssues: ZodIssue[] = [
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['name'], message: 'Expected string' },
    ];
    const error = new ZodError(zodIssues);

    errorHandler(error as never, request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation Error',
        message: 'Request validation failed',
      })
    );
  });

  it('should include ZodError details in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const zodIssues: ZodIssue[] = [
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['name'], message: 'Expected string' },
    ];
    const error = new ZodError(zodIssues);

    errorHandler(error as never, request as never, reply as never);

    const sentData = reply.send.mock.calls[0][0];
    expect(sentData.details).toEqual([
      { path: 'name', message: 'Expected string' },
    ]);

    process.env.NODE_ENV = originalEnv;
  });

  it('should NOT include ZodError details in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const zodIssues: ZodIssue[] = [
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['name'], message: 'Expected string' },
    ];
    const error = new ZodError(zodIssues);

    errorHandler(error as never, request as never, reply as never);

    const sentData = reply.send.mock.calls[0][0];
    expect(sentData.details).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle FastifyError with statusCode', () => {
    const error = {
      statusCode: 404,
      name: 'NotFoundError',
      message: 'Resource not found',
    };

    errorHandler(error as never, request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'NotFoundError',
      message: 'Resource not found',
    });
  });

  it('should use error name for FastifyError', () => {
    const error = {
      statusCode: 429,
      name: 'TooManyRequests',
      message: 'Rate limit exceeded',
    };

    errorHandler(error as never, request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(429);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'TooManyRequests',
      message: 'Rate limit exceeded',
    });
  });

  it('should fallback to "Error" if name is missing', () => {
    const error = {
      statusCode: 400,
      name: '',
      message: 'Bad request',
    };

    errorHandler(error as never, request as never, reply as never);

    expect(reply.send).toHaveBeenCalledWith({
      error: 'Error',
      message: 'Bad request',
    });
  });

  it('should handle generic errors with 500 status', () => {
    const error = new Error('Something broke');

    errorHandler(error as never, request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(500);
  });

  it('should expose error message in development for 500', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Database connection failed');
    errorHandler(error as never, request as never, reply as never);

    expect(reply.send).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Database connection failed',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should hide error message in production for 500', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Database connection failed');
    errorHandler(error as never, request as never, reply as never);

    expect(reply.send).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should log all errors with request context', () => {
    const error = new Error('test error');
    errorHandler(error as never, request as never, reply as never);

    expect((request as Record<string, Record<string, unknown>>).log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error,
        url: '/api/test',
        method: 'GET',
      }),
      'Error occurred'
    );
  });
});
