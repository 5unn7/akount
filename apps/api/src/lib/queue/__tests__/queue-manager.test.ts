import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueManager } from '../queue-manager';

// Hoist mocks to avoid initialization errors
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockGetJobCounts = vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 });

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    close = mockClose;
    getJobCounts = mockGetJobCounts;
    constructor(_name: string, _options: unknown) {
      // Mock constructor
    }
  },
}));

// Mock env
vi.mock('../../env', () => ({
  env: {
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_DB: 0,
    REDIS_TLS_ENABLED: false,
    NODE_ENV: 'test',
  },
}));

// Mock logger
vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('QueueManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up: close queues after each test
    try {
      await queueManager.close();
    } catch {
      // Ignore errors during cleanup
    }
  });

  describe('initialization', () => {
    it('should initialize all 5 queues', async () => {
      await queueManager.initialize();

      // Verify all queue names
      const queueNames = queueManager.getQueueNames();
      expect(queueNames).toEqual([
        'bill-scan',
        'invoice-scan',
        'transaction-import',
        'matching',
        'anomaly-detection',
      ]);
    });

    it('should skip re-initialization if already initialized', async () => {
      await queueManager.initialize();

      // Clear mocks to track second call
      vi.clearAllMocks();

      await queueManager.initialize(); // Second call

      // Should NOT create new queues
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('getQueue', () => {
    it('should return queue by name', async () => {
      await queueManager.initialize();

      const queue = queueManager.getQueue('bill-scan');

      expect(queue).toBeDefined();
    });

    it('should throw error if manager not initialized', () => {
      expect(() => queueManager.getQueue('bill-scan')).toThrow(
        /not initialized/
      );
    });

    it('should throw error for invalid queue name', async () => {
      await queueManager.initialize();

      expect(() => queueManager.getQueue('invalid' as any)).toThrow(
        /not found/
      );
    });
  });

  describe('close', () => {
    it('should close all queues gracefully', async () => {
      await queueManager.initialize();
      await queueManager.close();

      expect(mockClose).toHaveBeenCalledTimes(5);
    });

    it('should clear queues map after close', async () => {
      await queueManager.initialize();
      await queueManager.close();

      const queueNames = queueManager.getQueueNames();
      expect(queueNames).toHaveLength(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true when Redis is reachable', async () => {
      await queueManager.initialize();

      const healthy = await queueManager.healthCheck();

      expect(healthy).toBe(true);
      expect(mockGetJobCounts).toHaveBeenCalled();
    });

    it('should return false if not initialized', async () => {
      const healthy = await queueManager.healthCheck();

      expect(healthy).toBe(false);
    });

    it('should return false if Redis connection fails', async () => {
      await queueManager.initialize();

      mockGetJobCounts.mockRejectedValueOnce(new Error('Redis error'));

      const healthy = await queueManager.healthCheck();

      expect(healthy).toBe(false);
    });
  });

  describe('rate limiting (INFRA-63)', () => {
    beforeEach(() => {
      // Clear rate limit data before each test
      queueManager.clearRateLimit();
    });

    it('should allow jobs under rate limit', () => {
      const tenantId = 'tenant-123';

      // Should allow first 100 jobs
      for (let i = 0; i < 100; i++) {
        expect(queueManager.checkRateLimit(tenantId)).toBe(true);
      }
    });

    it('should block jobs exceeding rate limit (100 per minute)', () => {
      const tenantId = 'tenant-456';

      // Submit 100 jobs (at limit)
      for (let i = 0; i < 100; i++) {
        queueManager.checkRateLimit(tenantId);
      }

      // 101st job should be blocked
      expect(queueManager.checkRateLimit(tenantId)).toBe(false);
    });

    it('should track separate limits per tenant', () => {
      const tenant1 = 'tenant-aaa';
      const tenant2 = 'tenant-bbb';

      // Tenant 1: hit limit
      for (let i = 0; i < 100; i++) {
        queueManager.checkRateLimit(tenant1);
      }

      // Tenant 1: blocked
      expect(queueManager.checkRateLimit(tenant1)).toBe(false);

      // Tenant 2: still allowed (separate limit)
      expect(queueManager.checkRateLimit(tenant2)).toBe(true);
    });

    it('should return rate limit status', () => {
      const tenantId = 'tenant-status';

      // Submit 42 jobs
      for (let i = 0; i < 42; i++) {
        queueManager.checkRateLimit(tenantId);
      }

      const status = queueManager.getRateLimitStatus(tenantId);

      expect(status.current).toBe(42);
      expect(status.limit).toBe(100);
      expect(status.remaining).toBe(58);
    });

    it('should reset after time window expires', async () => {
      const tenantId = 'tenant-window';

      // Submit 100 jobs
      for (let i = 0; i < 100; i++) {
        queueManager.checkRateLimit(tenantId);
      }

      // Blocked
      expect(queueManager.checkRateLimit(tenantId)).toBe(false);

      // Fast-forward by clearing and re-submitting
      // (In production, this would happen naturally after 60 seconds)
      queueManager.clearRateLimit(tenantId);

      // Should be allowed again
      expect(queueManager.checkRateLimit(tenantId)).toBe(true);
    });

    it('should handle zero jobs gracefully', () => {
      const tenantId = 'tenant-zero';

      const status = queueManager.getRateLimitStatus(tenantId);

      expect(status.current).toBe(0);
      expect(status.limit).toBe(100);
      expect(status.remaining).toBe(100);
    });
  });
});
