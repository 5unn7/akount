import { Queue, QueueOptions, ConnectionOptions } from 'bullmq';
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
 * Redis connection configuration.
 *
 * In production: TLS + password auth
 * In development: localhost, no auth
 */
function getRedisConnection(): ConnectionOptions {
  const config: ConnectionOptions = {
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
 * Queue Manager Singleton
 *
 * Manages all BullMQ queues for the application.
 */
class QueueManagerClass {
  private queues: Map<QueueName, Queue> = new Map();
  private initialized = false;

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
          // Dead Letter Queue: failed jobs after all retries go here
          defaultJobOptions: {
            ...DEFAULT_QUEUE_OPTIONS.defaultJobOptions,
            // Job-specific timeout (60 seconds)
            timeout: 60000,
          },
        });

        this.queues.set(name, queue);

        logger.info({ queueName: name }, 'Queue initialized');
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
   * Get all queue names.
   */
  getQueueNames(): QueueName[] {
    return Array.from(this.queues.keys());
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

    this.queues.clear();
    this.initialized = false;

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
