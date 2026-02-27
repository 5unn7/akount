import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import type { FastifyInstance } from 'fastify';
import { queueManager } from './queue-manager';
import { logger } from '../logger';

/**
 * Bull Board UI Setup
 *
 * Admin-only dashboard for monitoring BullMQ queues.
 * Shows job counts, processing status, failures, retries.
 *
 * **Route:** `/admin/queues` (admin-only, protected by RBAC middleware)
 *
 * @module bull-board
 */

let serverAdapter: FastifyAdapter | null = null;

/**
 * Setup Bull Board UI for queue monitoring.
 *
 * @param fastify - Fastify instance
 * @returns Server adapter for Bull Board
 */
export function setupBullBoard(fastify: FastifyInstance): FastifyAdapter {
  if (serverAdapter) {
    logger.warn('Bull Board already setup, returning existing adapter');
    return serverAdapter;
  }

  // Create Fastify adapter
  serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath('/admin/queues');

  // Get all queues from manager
  const queueNames = queueManager.getQueueNames();
  const queues = queueNames.map((name) => queueManager.getQueue(name));

  // Create Bull Board with all queues
  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  // Register Bull Board routes with Fastify
  // Note: These routes should be protected by admin RBAC middleware in the main app
  fastify.register(serverAdapter.registerPlugin(), {
    prefix: '/admin/queues',
    // basePath is set above in setBasePath
  });

  logger.info(
    { queueCount: queues.length, basePath: '/admin/queues' },
    'Bull Board UI registered'
  );

  return serverAdapter;
}

/**
 * Get the Bull Board server adapter (if initialized).
 */
export function getBullBoardAdapter(): FastifyAdapter | null {
  return serverAdapter;
}
