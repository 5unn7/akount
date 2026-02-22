import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody, validateQuery, validateParams } from '../../../middleware/validation';
import { JournalEntryService } from '../services/journal-entry.service';
import { PostingService } from '../services/posting.service';
import { handleAccountingError } from '../errors';
import {
  CreateJournalEntrySchema,
  ListJournalEntriesSchema,
  JournalEntryParamsSchema,
  PostTransactionSchema,
  PostBulkTransactionsSchema,
  PostSplitTransactionSchema,
  type CreateJournalEntryInput,
  type ListJournalEntriesQuery,
  type JournalEntryParams,
  type PostTransactionInput,
  type PostBulkTransactionsInput,
  type PostSplitTransactionInput,
} from '../schemas/journal-entry.schema';

/**
 * Journal Entry Routes
 *
 * CRUD, approval, voiding, and transaction posting.
 * Static routes (/post-transaction, /post-transactions) registered BEFORE /:id.
 */
export async function journalEntryRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // Static routes FIRST (before /:id to avoid route conflicts)
  // ============================================================================

  // POST /journal-entries/post-transaction — Post a bank transaction to GL
  fastify.post(
    '/post-transaction',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
      preValidation: [validateBody(PostTransactionSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as PostTransactionInput;
      const service = new PostingService(request.tenantId, request.userId);

      try {
        const result = await service.postTransaction(body.transactionId, body.glAccountId, body.exchangeRate);
        return reply.status(201).send(result);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // POST /journal-entries/post-transactions — Bulk post transactions
  fastify.post(
    '/post-transactions',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
      preValidation: [validateBody(PostBulkTransactionsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as PostBulkTransactionsInput;
      const service = new PostingService(request.tenantId, request.userId);

      try {
        const result = await service.postBulkTransactions(body.transactionIds, body.glAccountId, body.exchangeRate);
        return reply.status(201).send(result);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // POST /journal-entries/post-split-transaction — Post a split transaction to GL
  fastify.post(
    '/post-split-transaction',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
      preValidation: [validateBody(PostSplitTransactionSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as PostSplitTransactionInput;
      const service = new PostingService(request.tenantId, request.userId);

      try {
        const result = await service.postSplitTransaction(
          body.transactionId,
          body.splits,
          body.exchangeRate
        );
        return reply.status(201).send(result);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // ============================================================================
  // List + Create (root routes)
  // ============================================================================

  // GET /journal-entries — List with filters + cursor pagination
  fastify.get(
    '/',
    {
      ...withPermission('accounting', 'journal-entries', 'VIEW'),
      preValidation: [validateQuery(ListJournalEntriesSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as ListJournalEntriesQuery;
      const service = new JournalEntryService(request.tenantId, request.userId);

      try {
        const result = await service.listEntries(query);
        return reply.send(result);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // POST /journal-entries — Create manual entry (DRAFT)
  fastify.post(
    '/',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
      preValidation: [validateBody(CreateJournalEntrySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const body = request.body as CreateJournalEntryInput;
      const service = new JournalEntryService(request.tenantId, request.userId);

      try {
        const entry = await service.createEntry(body);
        return reply.status(201).send(entry);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // ============================================================================
  // Parameterized routes (/:id)
  // ============================================================================

  // GET /journal-entries/:id — Full detail with lines
  fastify.get(
    '/:id',
    {
      ...withPermission('accounting', 'journal-entries', 'VIEW'),
      preValidation: [validateParams(JournalEntryParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as JournalEntryParams;
      const service = new JournalEntryService(request.tenantId, request.userId);

      try {
        const entry = await service.getEntry(params.id);
        return reply.send(entry);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // POST /journal-entries/:id/approve — Approve (DRAFT → POSTED)
  fastify.post(
    '/:id/approve',
    {
      ...withPermission('accounting', 'journal-entries', 'APPROVE'),
      preValidation: [validateParams(JournalEntryParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as JournalEntryParams;
      const service = new JournalEntryService(
        request.tenantId,
        request.userId,
        request.tenantRole
      );

      try {
        const entry = await service.approveEntry(params.id);
        return reply.send(entry);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // POST /journal-entries/:id/void — Void a POSTED entry (creates reversal)
  fastify.post(
    '/:id/void',
    {
      ...withPermission('accounting', 'journal-entries', 'APPROVE'),
      preValidation: [validateParams(JournalEntryParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as JournalEntryParams;
      const service = new JournalEntryService(request.tenantId, request.userId);

      try {
        const result = await service.voidEntry(params.id);
        return reply.send(result);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  // DELETE /journal-entries/:id — Soft delete DRAFT only
  fastify.delete(
    '/:id',
    {
      ...withPermission('accounting', 'journal-entries', 'ACT'),
      preValidation: [validateParams(JournalEntryParamsSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const params = request.params as JournalEntryParams;
      const service = new JournalEntryService(request.tenantId, request.userId);

      try {
        const result = await service.deleteEntry(params.id);
        return reply.send(result);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );
}
