import { prisma } from '@akount/db';

/**
 * Health Service
 *
 * Handles health check operations and database connectivity tests.
 */
export class HealthService {
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
     * Get system health status
     *
     * Returns overall system health including database connectivity.
     *
     * @returns {Promise<{ status: 'ok' | 'error'; timestamp: string }>}
     */
    async getHealthStatus(): Promise<{
        status: 'ok' | 'error';
        timestamp: string;
    }> {
        const { connected } = await this.checkDatabaseConnection();

        return {
            status: connected ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
        };
    }
}
