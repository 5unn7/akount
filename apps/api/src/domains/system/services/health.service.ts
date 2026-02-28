import { prisma } from '@akount/db';
import Redis from 'ioredis';
import { getRedisConnection } from '../../../lib/queue/queue-manager';

/**
 * Health Service
 *
 * Handles health check operations and connectivity tests for critical dependencies.
 * P1-24: Added Redis health check for queue system monitoring.
 */
export class HealthService {
    private redis: Redis | null = null;

    private getRedis(): Redis {
        if (!this.redis) {
            this.redis = new Redis({
                ...getRedisConnection(),
                connectTimeout: 1000,
                maxRetriesPerRequest: 1,
                lazyConnect: true,
            });
        }
        return this.redis;
    }
    /**
     * Check database connectivity
     *
     * Performs a simple SELECT 1 query to verify database connection.
     * This is much faster than COUNT queries (1-2ms vs 100-200ms).
     *
     * @returns {Promise<{ connected: boolean }>} Connection status
     */
    async checkDatabaseConnection(): Promise<{ connected: boolean }> {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { connected: true };
        } catch (error) {
            return { connected: false };
        }
    }

    /**
     * Check Redis connectivity (P1-24)
     *
     * Performs a PING to verify Redis connection.
     * Redis is critical for job queues - if Redis is down, background jobs will fail.
     *
     * @returns {Promise<{ connected: boolean }>} Connection status
     */
    async checkRedisConnection(): Promise<{ connected: boolean }> {
        try {
            const redis = this.getRedis();
            await redis.connect();
            const pong = await redis.ping();
            return { connected: pong === 'PONG' };
        } catch (error) {
            return { connected: false };
        }
    }

    /**
     * Get system health status
     *
     * Returns overall system health including database and Redis connectivity.
     * P1-24: Added Redis check for job queue monitoring.
     *
     * @returns {Promise<{ status: 'ok' | 'degraded' | 'error'; db: string; redis: string; timestamp: string }>}
     */
    async getHealthStatus(): Promise<{
        status: 'ok' | 'degraded' | 'error';
        db: string;
        redis: string;
        timestamp: string;
    }> {
        const [dbCheck, redisCheck] = await Promise.all([
            this.checkDatabaseConnection(),
            this.checkRedisConnection(),
        ]);

        let status: 'ok' | 'degraded' | 'error' = 'ok';
        if (!dbCheck.connected) {
            status = 'error'; // DB down = critical
        } else if (!redisCheck.connected) {
            status = 'degraded'; // Redis down = background jobs affected but API works
        }

        return {
            status,
            db: dbCheck.connected ? 'ok' : 'error',
            redis: redisCheck.connected ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
        };
    }
}
