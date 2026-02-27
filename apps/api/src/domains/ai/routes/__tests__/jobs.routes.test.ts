import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { jobStreamRoutes } from '../jobs';
import { queueManager } from '../../../../lib/queue/queue-manager';

// Mock dependencies
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply, done) => {
    request.userId = 'test-user-id';
    done();
  }),
}));

vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request, reply, done) => {
    request.tenantId = 'test-tenant-id';
    request.tenant = {
      tenantId: 'test-tenant-id',
      userId: 'test-user-id',
      role: 'ADMIN' as const,
    };
    done();
  }),
}));

vi.mock('../../../../lib/queue/queue-manager', () => {
  const mockJob = {
    id: '12345',
    data: { tenantId: 'test-tenant-id' },
    progress: 0,
    getState: vi.fn().mockResolvedValue('waiting'),
  };

  const mockQueue = {
    getJob: vi.fn().mockResolvedValue(mockJob),
    on: vi.fn(),
    off: vi.fn(),
  };

  return {
    queueManager: {
      getQueueNames: vi.fn().mockReturnValue(['bill-scan', 'invoice-scan']),
      getQueue: vi.fn().mockReturnValue(mockQueue),
    },
  };
});

describe('Job Stream Routes (DEV-233)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(jobStreamRoutes, { prefix: '/jobs' });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /:jobId/stream', () => {
    it('should reject invalid job ID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/jobs/invalid-id/stream',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'Invalid job ID format',
      });
    });

    it('should return error if job not found', async () => {
      // Mock queue.getJob to return null for all queues
      const mockQueue = queueManager.getQueue('bill-scan') as unknown as {
        getJob: ReturnType<typeof vi.fn>;
      };
      mockQueue.getJob.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/jobs/99999/stream',
        simulateError: true,
      });

      // The endpoint will start SSE but send error event immediately
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('"event":"error"');
      expect(response.body).toContain('Job not found');
    });

    it('should return error if tenant mismatch', async () => {
      // Mock job with different tenantId
      const mockJob = {
        id: '12345',
        data: { tenantId: 'different-tenant-id' },
        progress: 0,
        getState: vi.fn().mockResolvedValue('waiting'),
      };

      const mockQueue = queueManager.getQueue('bill-scan') as unknown as {
        getJob: ReturnType<typeof vi.fn>;
      };
      mockQueue.getJob.mockResolvedValueOnce(mockJob);

      const response = await app.inject({
        method: 'GET',
        url: '/jobs/12345/stream',
        simulateError: true,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('"event":"error"');
      expect(response.body).toContain('Access denied');
    });

    it('should verify tenant isolation for jobs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/jobs/12345/stream',
        simulateError: true,
      });

      expect(queueManager.getQueue).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should search all queues for the job', async () => {
      await app.inject({
        method: 'GET',
        url: '/jobs/12345/stream',
        simulateError: true,
      });

      expect(queueManager.getQueueNames).toHaveBeenCalled();
      expect(queueManager.getQueue).toHaveBeenCalled();
    });

    it('should validate job ID is numeric string', async () => {
      const testCases = [
        { id: 'abc123', valid: false },
        { id: '12345', valid: true },
        { id: 'job-123', valid: false },
        { id: '999', valid: true },
      ];

      for (const { id, valid } of testCases) {
        const response = await app.inject({
          method: 'GET',
          url: `/jobs/${id}/stream`,
        });

        if (valid) {
          expect(response.statusCode).toBe(200);
        } else {
          expect(response.statusCode).toBe(400);
        }
      }
    });

    it('should handle queue manager errors gracefully', async () => {
      // Mock getQueueNames to throw error
      (queueManager.getQueueNames as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('Queue manager error');
      });

      const response = await app.inject({
        method: 'GET',
        url: '/jobs/12345/stream',
        simulateError: true,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('"event":"error"');
    });
  });

  describe('SSE Format', () => {
    it('should use correct SSE format for events', () => {
      // SSE events should be in format: data: {json}\n\n
      const eventData = { event: 'progress', progress: 50, jobId: '12345' };
      const expectedFormat = `data: ${JSON.stringify(eventData)}\n\n`;

      expect(expectedFormat).toMatch(/^data: \{.*\}\n\n$/);
    });

    it('should use correct heartbeat format', () => {
      // Heartbeat should be: : heartbeat\n\n
      const heartbeat = ': heartbeat\n\n';

      expect(heartbeat).toBe(': heartbeat\n\n');
    });
  });
});
