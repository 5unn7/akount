import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';

/**
 * Journal Entry Routes
 *
 * CRUD, approval, voiding, and transaction posting.
 * Implemented in Sprint 2.
 */
export async function journalEntryRoutes(fastify: FastifyInstance) {
  // GET /journal-entries — List with filters + cursor pagination
  fastify.get(
    '/',
    {
      ...withPermission('accounting', 'journal-entries', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entries listing will be implemented in Sprint 2',
      });
    }
  );

  // GET /journal-entries/:id — Full detail with lines
  fastify.get(
    '/:id',
    {
      ...withPermission('accounting', 'journal-entries', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry details will be implemented in Sprint 2',
      });
    }
  );

  // POST /journal-entries — Create manual entry (DRAFT)
  fastify.post(
    '/',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry creation will be implemented in Sprint 2',
      });
    }
  );

  // POST /journal-entries/:id/approve — Approve (DRAFT → POSTED)
  fastify.post(
    '/:id/approve',
    {
      ...withPermission('accounting', 'journal-entries', 'APPROVE'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry approval will be implemented in Sprint 2',
      });
    }
  );

  // POST /journal-entries/:id/void — Void a POSTED entry
  fastify.post(
    '/:id/void',
    {
      ...withPermission('accounting', 'journal-entries', 'APPROVE'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry void will be implemented in Sprint 2',
      });
    }
  );

  // DELETE /journal-entries/:id — Soft delete DRAFT only
  fastify.delete(
    '/:id',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Journal entry deletion will be implemented in Sprint 2',
      });
    }
  );

  // POST /journal-entries/post-transaction — Post a bank transaction to GL
  fastify.post(
    '/post-transaction',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Transaction posting will be implemented in Sprint 2',
      });
    }
  );

  // POST /journal-entries/post-transactions — Bulk post transactions
  fastify.post(
    '/post-transactions',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Bulk transaction posting will be implemented in Sprint 2',
      });
    }
  );
}
