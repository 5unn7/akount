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
});
