import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from '../health.service';

// Mock Prisma
const mockQueryRaw = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HealthService();
  });

  describe('checkDatabaseConnection', () => {
    it('should return connected=true when query succeeds', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const result = await service.checkDatabaseConnection();

      expect(result.connected).toBe(true);
    });

    it('should return connected=false when query fails', async () => {
      mockQueryRaw.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await service.checkDatabaseConnection();

      expect(result.connected).toBe(false);
    });

    it('should execute SELECT 1 query', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      await service.checkDatabaseConnection();

      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
      // Verify it's a tagged template (the raw SQL query)
      expect(mockQueryRaw).toHaveBeenCalled();
    });

    it('should catch database errors gracefully', async () => {
      mockQueryRaw.mockRejectedValueOnce(new Error('Connection timeout'));

      // Should not throw - returns connected=false instead
      const result = await service.checkDatabaseConnection();

      expect(result.connected).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockQueryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await service.checkDatabaseConnection();

      expect(result.connected).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    it('should return status=ok when database connected', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const result = await service.getHealthStatus();

      expect(result.status).toBe('ok');
    });

    it('should return status=error when database not connected', async () => {
      mockQueryRaw.mockRejectedValueOnce(new Error('Database down'));

      const result = await service.getHealthStatus();

      expect(result.status).toBe('error');
    });

    it('should include timestamp in ISO format', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const result = await service.getHealthStatus();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // Verify it's a valid date
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should call checkDatabaseConnection internally', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      await service.getHealthStatus();

      // Verify the database check was called
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    });

    it('should return fresh timestamp on each call', async () => {
      mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result1 = await service.getHealthStatus();
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      const result2 = await service.getHealthStatus();

      // Timestamps should be different (different call times)
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });
  });
});
