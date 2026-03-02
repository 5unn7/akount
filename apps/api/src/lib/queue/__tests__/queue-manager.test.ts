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

// Track pipeline call counts for rate limiting tests (ARCH-17)
let mockZcard = 0;

const mockPipelineExec = vi.fn().mockImplementation(async () => {
  // Return [error, result] tuples for each pipeline command
  // [0] = zremrangebyscore result, [1] = zcard result
  return [
    [null, 0], // zremrangebyscore
    [null, mockZcard], // zcard — returns tracked count
  ];
});

const mockPipeline = vi.fn().mockReturnValue({
  zremrangebyscore: vi.fn().mockReturnThis(),
  zcard: vi.fn().mockReturnThis(),
  zadd: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: mockPipelineExec,
});

const mockDel = vi.fn().mockResolvedValue(1);
const mockScan = vi.fn().mockResolvedValue(['0', []]);
const mockQuit = vi.fn().mockResolvedValue('OK');

// Mock ioredis (ARCH-17: Redis-backed rate limiting)
vi.mock('ioredis', () => {
  const MockRedis = vi.fn(function (this: Record<string, unknown>) {
    this.pipeline = mockPipeline;
    this.zremrangebyscore = vi.fn().mockResolvedValue(0);
    this.zcard = vi.fn().mockResolvedValue(0);
    this.del = mockDel;
    this.scan = mockScan;
    this.quit = mockQuit;
  });
  return { default: MockRedis };
});

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

  describe('rate limiting (INFRA-63, ARCH-17: Redis-backed)', () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      mockZcard = 0;
      // Reset pipeline exec to use tracked count
      mockPipelineExec.mockImplementation(async () => [
        [null, 0], // zremrangebyscore
        [null, mockZcard], // zcard
      ]);
      await queueManager.clearRateLimit();
    });

    it('should allow jobs under rate limit', async () => {
      const tenantId = 'tenant-123';
      mockZcard = 50; // Under limit
      mockPipelineExec.mockResolvedValueOnce([
        [null, 0],
        [null, 50],
      ]);

      const allowed = await queueManager.checkRateLimit(tenantId);
      expect(allowed).toBe(true);
    });

    it('should block jobs exceeding rate limit (100 per minute)', async () => {
      const tenantId = 'tenant-456';

      // Simulate at-limit: zcard returns 100
      mockPipelineExec.mockResolvedValueOnce([
        [null, 0],
        [null, 100],
      ]);

      const blocked = await queueManager.checkRateLimit(tenantId);
      expect(blocked).toBe(false);
    });

    it('should call Redis pipeline for rate limit check', async () => {
      const tenantId = 'tenant-pipeline';
      mockPipelineExec.mockResolvedValueOnce([
        [null, 0],
        [null, 0],
      ]);

      await queueManager.checkRateLimit(tenantId);

      // Should have created a pipeline
      expect(mockPipeline).toHaveBeenCalled();
    });

    it('should return rate limit status from Redis', async () => {
      const tenantId = 'tenant-status';

      const status = await queueManager.getRateLimitStatus(tenantId);

      expect(status.limit).toBe(100);
      // Status comes from Redis (mocked)
      expect(status).toHaveProperty('current');
      expect(status).toHaveProperty('remaining');
    });

    it('should clear rate limit data via Redis DEL', async () => {
      const tenantId = 'tenant-clear';

      await queueManager.clearRateLimit(tenantId);

      expect(mockDel).toHaveBeenCalledWith(`ratelimit:jobs:${tenantId}`);
    });

    it('should clear all rate limits via Redis SCAN + DEL', async () => {
      mockScan.mockResolvedValueOnce(['0', ['ratelimit:jobs:t1', 'ratelimit:jobs:t2']]);

      await queueManager.clearRateLimit();

      expect(mockScan).toHaveBeenCalled();
    });

    it('should handle zero jobs gracefully', async () => {
      const tenantId = 'tenant-zero';

      const status = await queueManager.getRateLimitStatus(tenantId);

      expect(status.limit).toBe(100);
      expect(status.remaining).toBeLessThanOrEqual(100);
    });
  });
});
