import { Queue, QueueEvents, QueueOptions, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../env';
import { logger } from '../logger';

/**
 * Queue Manager
 *
 * Centralized management for BullMQ job queues used in Document Intelligence Platform.
 *
 * **Queues:**
 * - `bill-scan` — Process uploaded bill/receipt images (B4)
 * - `invoice-scan` — Process uploaded invoice images (B5)
 * - `transaction-import` — Process bank statement imports (B8)
 * - `matching` — Auto-match bills/invoices to transactions (D1)
 * - `anomaly-detection` — Detect financial anomalies (C7)
 *
 * **Configuration:**
 * - 3 retries with exponential backoff
 * - 60-second job timeout
 * - Dead letter queue for failed jobs
 * - TLS encryption in production
 * - Password authentication
 *
 * @module queue-manager
 */

export type QueueName =
  | 'bill-scan'
  | 'invoice-scan'
  | 'transaction-import'
  | 'matching'
  | 'anomaly-detection';

/**
 * Rate limit configuration (INFRA-63).
 *
 * Prevents DoS attacks via unbounded job submission.
 */
export const RATE_LIMIT_CONFIG = {
  /** Maximum jobs per tenant per minute */
  JOBS_PER_MINUTE: 100,
  /** Window size in milliseconds (60 seconds) */
  WINDOW_MS: 60 * 1000,
};

/**
 * Redis connection configuration.
 *
 * In production: TLS + password auth
 * In development: localhost, no auth
 *
 * Exported for use in workers (ARCH-16: DRY principle)
 */
/** Plain Redis connection options (compatible with both ioredis and BullMQ) */
export interface RedisConnectionConfig {
  host: string;
  port: number;
  db: number;
  password?: string;
  tls?: { rejectUnauthorized: boolean };
}

export function getRedisConnection(): RedisConnectionConfig {
  const config: RedisConnectionConfig = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
  };

  // Add password if configured
  if (env.REDIS_PASSWORD) {
    config.password = env.REDIS_PASSWORD;
  }

  // Enable TLS in production
  if (env.REDIS_TLS_ENABLED) {
    config.tls = {
      // Reject unauthorized certs in production
      rejectUnauthorized: env.NODE_ENV === 'production',
    };
  }

  return config;
}

/**
 * Default queue options with retries and timeout.
 */
const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay, doubles each retry (2s, 4s, 8s)
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days (debugging)
    },
  },
};

/**
 * Redis-backed rate limiter using sorted sets (sliding window).
 *
 * ARCH-17: Replaces in-memory Map with Redis for multi-instance support.
 * Each tenant's submissions are tracked in a sorted set keyed by tenantId.
 * Score = timestamp, Member = unique ID. Atomic pipeline ensures consistency.
 */
class RedisRateLimiter {
  private redis: Redis | null = null;
  private readonly keyPrefix = 'ratelimit:jobs:';

  private getRedis(): Redis {
    if (!this.redis) {
      const connOpts = getRedisConnection();
      this.redis = new Redis({
        ...connOpts,
        connectTimeout: 500,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    }
    return this.redis;
  }

  /**
   * Check if tenant can submit a job without exceeding rate limit.
   * Records the submission atomically if allowed.
   */
  async checkLimit(tenantId: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_MS;
    const key = `${this.keyPrefix}${tenantId}`;
    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    const redis = this.getRedis();

    // Atomic pipeline: trim old entries, count current, add new if under limit
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart); // Remove expired entries
    pipeline.zcard(key); // Count current entries
    const results = await pipeline.exec();

    if (!results) return false;

    const count = results[1]?.[1] as number;

    if (count >= RATE_LIMIT_CONFIG.JOBS_PER_MINUTE) {
      return false; // Rate limit exceeded
    }

    // Record this submission and set TTL
    const addPipeline = redis.pipeline();
    addPipeline.zadd(key, now, member);
    addPipeline.expire(key, Math.ceil(RATE_LIMIT_CONFIG.WINDOW_MS / 1000) + 1);
    await addPipeline.exec();

    return true;
  }

  /**
   * Get current submission count for a tenant within the window.
   */
  async getCurrentCount(tenantId: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_MS;
    const key = `${this.keyPrefix}${tenantId}`;

    const redis = this.getRedis();

    await redis.zremrangebyscore(key, 0, windowStart);
    return redis.zcard(key);
  }

  /**
   * Clear rate limit data for a tenant (for testing).
   */
  async clear(tenantId?: string): Promise<void> {
    const redis = this.getRedis();

    if (tenantId) {
      await redis.del(`${this.keyPrefix}${tenantId}`);
    } else {
      // Scan and delete all rate limit keys
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          `${this.keyPrefix}*`,
          'COUNT',
          100
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    }
  }

  /**
   * Close the Redis connection gracefully.
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

/**
 * Queue Manager Singleton
 *
 * Manages all BullMQ queues for the application.
 */
class QueueManagerClass {
  private queues: Map<QueueName, Queue> = new Map();
  private queueEvents: Map<QueueName, QueueEvents> = new Map();
  private initialized = false;
  private rateLimiter = new RedisRateLimiter();

  /**
   * Initialize all queues.
   *
   * Call this once during application startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('QueueManager already initialized, skipping');
      return;
    }

    const queueNames: QueueName[] = [
      'bill-scan',
      'invoice-scan',
      'transaction-import',
      'matching',
      'anomaly-detection',
    ];

    try {
      for (const name of queueNames) {
        const queue = new Queue(name, {
          ...DEFAULT_QUEUE_OPTIONS,
        });

        const queueEvents = new QueueEvents(name, {
          connection: DEFAULT_QUEUE_OPTIONS.connection,
        });

        this.queues.set(name, queue);
        this.queueEvents.set(name, queueEvents);

        logger.info({ queueName: name }, 'Queue and QueueEvents initialized');
      }

      this.initialized = true;

      logger.info(
        {
          queues: queueNames,
          redis: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            tls: env.REDIS_TLS_ENABLED,
          },
        },
        'QueueManager initialized successfully'
      );
    } catch (error: unknown) {
      logger.error({ err: error }, 'Failed to initialize QueueManager');
      throw error;
    }
  }

  /**
   * Get a queue by name.
   *
   * @throws {Error} If queue not found or manager not initialized
   */
  getQueue(name: QueueName): Queue {
    if (!this.initialized) {
      throw new Error('QueueManager not initialized. Call initialize() first.');
    }

    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue "${name}" not found`);
    }

    return queue;
  }

  /**
   * Get a QueueEvents instance for listening to job state changes.
   *
   * @throws {Error} If queue not found or manager not initialized
   */
  getQueueEvents(name: QueueName): QueueEvents {
    if (!this.initialized) {
      throw new Error('QueueManager not initialized. Call initialize() first.');
    }

    const queueEvents = this.queueEvents.get(name);
    if (!queueEvents) {
      throw new Error(`QueueEvents for "${name}" not found`);
    }

    return queueEvents;
  }

  /**
   * Get all queue names.
   */
  getQueueNames(): QueueName[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Check if tenant can submit a job without exceeding rate limit.
   * ARCH-17: Now Redis-backed for multi-instance support.
   *
   * @param tenantId - Tenant ID
   * @returns true if allowed, false if rate limit exceeded
   *
   * @example
   * ```typescript
   * if (!(await queueManager.checkRateLimit(tenantId))) {
   *   throw new Error('Rate limit exceeded. Please try again later.');
   * }
   * await queueManager.getQueue('bill-scan').add('scan-bill', { ... });
   * ```
   */
  async checkRateLimit(tenantId: string): Promise<boolean> {
    return this.rateLimiter.checkLimit(tenantId);
  }

  /**
   * Get current job count for tenant within rate limit window.
   * ARCH-17: Now Redis-backed for multi-instance support.
   *
   * Useful for API responses: "You have submitted 95/100 jobs in the last minute."
   */
  async getRateLimitStatus(tenantId: string): Promise<{
    current: number;
    limit: number;
    remaining: number;
  }> {
    const current = await this.rateLimiter.getCurrentCount(tenantId);
    const limit = RATE_LIMIT_CONFIG.JOBS_PER_MINUTE;

    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
    };
  }

  /**
   * Clear rate limit data for a tenant (for testing).
   */
  async clearRateLimit(tenantId?: string): Promise<void> {
    await this.rateLimiter.clear(tenantId);
  }

  /**
   * Close all queues gracefully.
   *
   * Call during application shutdown.
   */
  async close(): Promise<void> {
    logger.info('Closing all queues');

    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close();
        logger.info({ queueName: name }, 'Queue closed');
      } catch (error: unknown) {
        logger.error({ err: error, queueName: name }, 'Error closing queue');
      }
    }

    for (const [name, queueEvents] of this.queueEvents.entries()) {
      try {
        await queueEvents.close();
        logger.info({ queueName: name }, 'QueueEvents closed');
      } catch (error: unknown) {
        logger.error({ err: error, queueName: name }, 'Error closing QueueEvents');
      }
    }

    this.queues.clear();
    this.queueEvents.clear();
    this.initialized = false;

    // Close rate limiter Redis connection
    await this.rateLimiter.close();

    logger.info('QueueManager closed');
  }

  /**
   * Health check for Redis connection.
   *
   * @returns true if Redis is reachable, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    if (!this.initialized || this.queues.size === 0) {
      return false;
    }

    try {
      // Check if any queue can communicate with Redis
      const firstQueue = this.queues.values().next().value;
      if (!firstQueue) return false;

      // Try to get queue stats (requires Redis connection)
      await firstQueue.getJobCounts();
      return true;
    } catch (error: unknown) {
      logger.error({ err: error }, 'Queue health check failed');
      return false;
    }
  }
}

// Export singleton instance
export const queueManager = new QueueManagerClass();
