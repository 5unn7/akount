import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, optionalAuthMiddleware } from '../auth';

// Mock @clerk/backend
vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from '@clerk/backend';

const mockVerifyToken = vi.mocked(verifyToken);

function createMockRequest(headers: Record<string, string> = {}) {
  return {
    headers,
    userId: undefined as string | undefined,
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  };
}

function createMockReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply;
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when Authorization header is missing', async () => {
    const request = createMockRequest({});
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Missing Authorization header',
    });
  });

  it('should return 401 when Authorization header is not Bearer format', async () => {
    const request = createMockRequest({ authorization: 'Basic dGVzdA==' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <token>',
    });
  });

  it('should return 401 when token verification fails', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));
    const request = createMockRequest({ authorization: 'Bearer invalid-token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Failed to verify token',
    });
  });

  it('should return 401 when payload has no sub', async () => {
    mockVerifyToken.mockResolvedValueOnce({ sub: '' } as never);
    const request = createMockRequest({ authorization: 'Bearer token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  });

  it('should return 401 when payload is null', async () => {
    mockVerifyToken.mockResolvedValueOnce(null as never);
    const request = createMockRequest({ authorization: 'Bearer token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' })
    );
  });

  it('should set request.userId on successful auth', async () => {
    mockVerifyToken.mockResolvedValueOnce({ sub: 'user_abc123' } as never);
    const request = createMockRequest({ authorization: 'Bearer valid-token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(request.userId).toBe('user_abc123');
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should log successful authentication', async () => {
    mockVerifyToken.mockResolvedValueOnce({ sub: 'user_abc123' } as never);
    const request = createMockRequest({ authorization: 'Bearer valid-token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(request.log.info).toHaveBeenCalledWith(
      { userId: 'user_abc123' },
      'User authenticated'
    );
  });

  it('should log authentication errors', async () => {
    const error = new Error('Clerk API error');
    mockVerifyToken.mockRejectedValueOnce(error);
    const request = createMockRequest({ authorization: 'Bearer bad-token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(request.log.error).toHaveBeenCalledWith(
      { error },
      'Authentication error'
    );
  });

  it('should return 401 on verification timeout (3s)', async () => {
    // Simulate a slow verification that exceeds the 3s timeout
    mockVerifyToken.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 5000)) as never
    );
    const request = createMockRequest({ authorization: 'Bearer slow-token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Failed to verify token',
    });
  }, 10000);

  it('should extract token correctly (strip Bearer prefix)', async () => {
    mockVerifyToken.mockResolvedValueOnce({ sub: 'user_1' } as never);
    const request = createMockRequest({ authorization: 'Bearer my-jwt-token' });
    const reply = createMockReply();

    await authMiddleware(request as never, reply as never);

    expect(mockVerifyToken).toHaveBeenCalledWith('my-jwt-token', {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  });
});

describe('optionalAuthMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should continue without error when no auth header', async () => {
    const request = createMockRequest({});
    const reply = createMockReply();

    await optionalAuthMiddleware(request as never, reply as never);

    expect(request.userId).toBeUndefined();
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should continue without error when auth header is not Bearer', async () => {
    const request = createMockRequest({ authorization: 'Basic abc' });
    const reply = createMockReply();

    await optionalAuthMiddleware(request as never, reply as never);

    expect(request.userId).toBeUndefined();
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should set userId when valid token provided', async () => {
    mockVerifyToken.mockResolvedValueOnce({ sub: 'user_opt' } as never);
    const request = createMockRequest({ authorization: 'Bearer valid' });
    const reply = createMockReply();

    await optionalAuthMiddleware(request as never, reply as never);

    expect(request.userId).toBe('user_opt');
  });

  it('should silently ignore verification errors', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('expired'));
    const request = createMockRequest({ authorization: 'Bearer expired' });
    const reply = createMockReply();

    await optionalAuthMiddleware(request as never, reply as never);

    expect(request.userId).toBeUndefined();
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('should log optional auth success', async () => {
    mockVerifyToken.mockResolvedValueOnce({ sub: 'user_opt2' } as never);
    const request = createMockRequest({ authorization: 'Bearer token' });
    const reply = createMockReply();

    await optionalAuthMiddleware(request as never, reply as never);

    expect(request.log.info).toHaveBeenCalledWith(
      { userId: 'user_opt2' },
      'User optionally authenticated'
    );
  });

  it('should log optional auth failure at debug level', async () => {
    const error = new Error('token expired');
    mockVerifyToken.mockRejectedValueOnce(error);
    const request = createMockRequest({ authorization: 'Bearer expired' });
    const reply = createMockReply();

    await optionalAuthMiddleware(request as never, reply as never);

    expect(request.log.debug).toHaveBeenCalledWith(
      { error },
      'Optional auth failed'
    );
  });
});
