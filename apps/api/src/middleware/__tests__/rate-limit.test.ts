import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GLOBAL_RATE_LIMIT,
  STRICT_RATE_LIMIT,
  BURST_RATE_LIMIT,
  STATS_RATE_LIMIT,
  AI_RATE_LIMIT,
  AI_CHAT_RATE_LIMIT,
  rateLimitMiddleware,
  strictRateLimitConfig,
  burstRateLimitConfig,
  noRateLimitConfig,
  statsRateLimitConfig,
  aiRateLimitConfig,
  aiChatRateLimitConfig,
} from '../rate-limit';

// Mock @fastify/rate-limit
vi.mock('@fastify/rate-limit', () => ({
  default: vi.fn(),
}));

// Mock ioredis (ARCH-17: Redis-backed rate limiting)
vi.mock('ioredis', () => {
  const MockRedis = vi.fn(function (this: Record<string, unknown>) {
    this.quit = vi.fn().mockResolvedValue('OK');
  });
  return { default: MockRedis };
});

// Mock queue-manager getRedisConnection
vi.mock('../../lib/queue/queue-manager', () => ({
  getRedisConnection: vi.fn().mockReturnValue({
    host: 'localhost',
    port: 6379,
    db: 0,
  }),
}));

import rateLimit from '@fastify/rate-limit';

const mockRateLimit = vi.mocked(rateLimit);

describe('rate-limit', () => {
  describe('config constants', () => {
    it('should define GLOBAL_RATE_LIMIT (100 req/min)', () => {
      expect(GLOBAL_RATE_LIMIT).toEqual({ max: 100, timeWindow: '1 minute' });
    });

    it('should define STRICT_RATE_LIMIT (10 req/min)', () => {
      expect(STRICT_RATE_LIMIT).toEqual({ max: 10, timeWindow: '1 minute' });
    });

    it('should define BURST_RATE_LIMIT (500 req/min)', () => {
      expect(BURST_RATE_LIMIT).toEqual({ max: 500, timeWindow: '1 minute' });
    });

    it('should define STATS_RATE_LIMIT (50 req/min)', () => {
      expect(STATS_RATE_LIMIT).toEqual({ max: 50, timeWindow: '1 minute' });
    });

    it('should define AI_RATE_LIMIT (20 req/min)', () => {
      expect(AI_RATE_LIMIT).toEqual({ max: 20, timeWindow: '1 minute' });
    });

    it('should define AI_CHAT_RATE_LIMIT (10 req/min)', () => {
      expect(AI_CHAT_RATE_LIMIT).toEqual({ max: 10, timeWindow: '1 minute' });
    });

    it('should have stricter limits for sensitive operations', () => {
      expect(STRICT_RATE_LIMIT.max).toBeLessThan(GLOBAL_RATE_LIMIT.max);
      expect(AI_CHAT_RATE_LIMIT.max).toBeLessThan(AI_RATE_LIMIT.max);
    });
  });

  describe('rateLimitMiddleware', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should register @fastify/rate-limit plugin', async () => {
      const mockFastify = {
        register: vi.fn(),
      };

      await rateLimitMiddleware(mockFastify as never);

      expect(mockFastify.register).toHaveBeenCalledWith(
        mockRateLimit,
        expect.objectContaining({
          global: true,
          max: GLOBAL_RATE_LIMIT.max,
          timeWindow: GLOBAL_RATE_LIMIT.timeWindow,
        })
      );
    });

    it('should use tenant:user key for authenticated requests', async () => {
      let keyGenerator: ((request: unknown) => string) | undefined;
      const mockFastify = {
        register: vi.fn((_plugin: unknown, options: Record<string, unknown>) => {
          keyGenerator = options.keyGenerator as (request: unknown) => string;
        }),
      };

      await rateLimitMiddleware(mockFastify as never);

      const authRequest = { tenantId: 'tenant-1', userId: 'user-1', ip: '1.2.3.4' };
      expect(keyGenerator!(authRequest)).toBe('tenant-1:user-1');
    });

    it('should fallback to IP for unauthenticated requests', async () => {
      let keyGenerator: ((request: unknown) => string) | undefined;
      const mockFastify = {
        register: vi.fn((_plugin: unknown, options: Record<string, unknown>) => {
          keyGenerator = options.keyGenerator as (request: unknown) => string;
        }),
      };

      await rateLimitMiddleware(mockFastify as never);

      const unauthRequest = { tenantId: undefined, userId: undefined, ip: '192.168.1.1' };
      expect(keyGenerator!(unauthRequest)).toBe('192.168.1.1');
    });

    it('should return proper error response shape', async () => {
      let errorBuilder: ((request: unknown, context: Record<string, unknown>) => unknown) | undefined;
      const mockFastify = {
        register: vi.fn((_plugin: unknown, options: Record<string, unknown>) => {
          errorBuilder = options.errorResponseBuilder as (request: unknown, context: Record<string, unknown>) => unknown;
        }),
      };

      await rateLimitMiddleware(mockFastify as never);

      const errorResponse = errorBuilder!({}, { max: 100, after: '60 seconds' });
      expect(errorResponse).toEqual({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please slow down',
          details: {
            limit: 100,
            remaining: 0,
            resetTime: '60 seconds',
          },
        },
      });
    });

    it('should pass Redis client for distributed rate limiting (ARCH-17)', async () => {
      const mockFastify = {
        register: vi.fn(),
      };

      await rateLimitMiddleware(mockFastify as never);

      const options = mockFastify.register.mock.calls[0][1];
      expect(options.redis).toBeDefined();
    });

    it('should include rate limit headers', async () => {
      const mockFastify = {
        register: vi.fn(),
      };

      await rateLimitMiddleware(mockFastify as never);

      const options = mockFastify.register.mock.calls[0][1];
      expect(options.addHeaders).toEqual({
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      });
    });
  });

  describe('config helpers', () => {
    it('strictRateLimitConfig returns strict limits', () => {
      expect(strictRateLimitConfig()).toEqual({
        max: STRICT_RATE_LIMIT.max,
        timeWindow: STRICT_RATE_LIMIT.timeWindow,
      });
    });

    it('burstRateLimitConfig returns burst limits', () => {
      expect(burstRateLimitConfig()).toEqual({
        max: BURST_RATE_LIMIT.max,
        timeWindow: BURST_RATE_LIMIT.timeWindow,
      });
    });

    it('noRateLimitConfig returns effectively unlimited', () => {
      const config = noRateLimitConfig();
      expect(config.max).toBeGreaterThan(100000);
    });

    it('statsRateLimitConfig returns stats limits', () => {
      expect(statsRateLimitConfig()).toEqual({
        max: STATS_RATE_LIMIT.max,
        timeWindow: STATS_RATE_LIMIT.timeWindow,
      });
    });

    it('aiRateLimitConfig returns AI limits', () => {
      expect(aiRateLimitConfig()).toEqual({
        max: AI_RATE_LIMIT.max,
        timeWindow: AI_RATE_LIMIT.timeWindow,
      });
    });

    it('aiChatRateLimitConfig returns stricter AI chat limits', () => {
      const config = aiChatRateLimitConfig();
      expect(config).toEqual({
        max: AI_CHAT_RATE_LIMIT.max,
        timeWindow: AI_CHAT_RATE_LIMIT.timeWindow,
      });
      expect(config.max).toBeLessThan(aiRateLimitConfig().max);
    });
  });
});
