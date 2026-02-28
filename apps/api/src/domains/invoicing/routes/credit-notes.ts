import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { withRolePermission } from '../../../middleware/rbac';
import * as creditNoteService from '../services/credit-note.service';
import {
  CreateCreditNoteSchema,
  UpdateCreditNoteSchema,
  ListCreditNotesSchema,
  ApplyCreditNoteSchema,
  type CreateCreditNoteInput,
  type UpdateCreditNoteInput,
  type ListCreditNotesInput,
  type ApplyCreditNoteInput,
} from '../schemas/credit-note.schema';

/**
 * Credit Note routes
 *
 * All routes require authentication, tenant context, and role-based permissions.
 * Follows pattern: Auth → Tenant → RBAC → Validation → Service
 *
 * Role permissions:
 * - VIEW/CREATE/UPDATE/APPROVE/APPLY: OWNER, ADMIN, ACCOUNTANT
 * - VOID/DELETE: OWNER, ADMIN (more restricted)
 */
export async function creditNoteRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // POST /api/business/credit-notes - Create credit note
  fastify.post(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateBody(CreateCreditNoteSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const body = request.body as CreateCreditNoteInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const creditNote = await creditNoteService.createCreditNote(body, tenant);
        request.log.info({ creditNoteId: creditNote.id, number: creditNote.creditNoteNumber }, 'Created credit note');
        return reply.status(201).send(creditNote);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/business/credit-notes - List credit notes
  fastify.get(
    '/',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateQuery(ListCreditNotesSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const query = request.query as ListCreditNotesInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      const result = await creditNoteService.listCreditNotes(query, tenant);
      request.log.info({ count: result.creditNotes.length }, 'Listed credit notes');
      return reply.status(200).send(result);
    }
  );

  // GET /api/business/credit-notes/export - Export credit notes as CSV
  const ExportQuerySchema = z.object({
    entityId: z.string().cuid().optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'APPLIED', 'VOIDED']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  });
  fastify.get(
    '/export',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateQuery(ExportQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const query = request.query as z.infer<typeof ExportQuerySchema>;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      const csv = await creditNoteService.exportCreditNotesCsv(query, tenant);
      const filename = `credit-notes-${new Date().toISOString().split('T')[0]}.csv`;

      request.log.info({ tenantId: request.tenantId, filters: query }, 'Exported credit notes CSV');

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    }
  );

  // GET /api/business/credit-notes/:id - Get single credit note
  fastify.get(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams(z.object({ id: z.string() }))],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const creditNote = await creditNoteService.getCreditNote(params.id, tenant);
        return reply.status(200).send(creditNote);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ error: 'Credit note not found' });
        }
        throw error;
      }
    }
  );

  // PUT /api/business/credit-notes/:id - Update credit note (DRAFT only)
  fastify.put(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams(z.object({ id: z.string() })),
        validateBody(UpdateCreditNoteSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const body = request.body as UpdateCreditNoteInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const creditNote = await creditNoteService.updateCreditNote(params.id, body, tenant);
        request.log.info({ creditNoteId: params.id }, 'Updated credit note');
        return reply.status(200).send(creditNote);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: 'Credit note not found' });
          }
          if (error.message.includes('Only DRAFT')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // POST /api/business/credit-notes/:id/approve - Approve credit note (DRAFT → APPROVED)
  fastify.post(
    '/:id/approve',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [validateParams(z.object({ id: z.string() }))],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const creditNote = await creditNoteService.approveCreditNote(params.id, tenant);
        request.log.info({ creditNoteId: params.id }, 'Approved credit note');
        return reply.status(200).send(creditNote);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: 'Credit note not found' });
          }
          if (error.message.includes('Invalid status') || error.message.includes('must be positive')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // POST /api/business/credit-notes/:id/apply - Apply credit note to invoice/bill
  fastify.post(
    '/:id/apply',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
      preValidation: [
        validateParams(z.object({ id: z.string() })),
        validateBody(ApplyCreditNoteSchema),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const body = request.body as ApplyCreditNoteInput;
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const creditNote = await creditNoteService.applyCreditNote(params.id, body, tenant);
        request.log.info({ creditNoteId: params.id, amount: body.amount }, 'Applied credit note');
        return reply.status(200).send(creditNote);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message.includes('exceeds') || error.message.includes('Invalid status')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // POST /api/business/credit-notes/:id/void - Void credit note
  fastify.post(
    '/:id/void',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
      preValidation: [validateParams(z.object({ id: z.string() }))],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        const creditNote = await creditNoteService.voidCreditNote(params.id, tenant);
        request.log.info({ creditNoteId: params.id }, 'Voided credit note');
        return reply.status(200).send(creditNote);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: 'Credit note not found' });
          }
          if (error.message.includes('Invalid status')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );

  // DELETE /api/business/credit-notes/:id - Soft delete credit note (DRAFT only)
  fastify.delete(
    '/:id',
    {
      preHandler: withRolePermission(['OWNER', 'ADMIN']),
      preValidation: [validateParams(z.object({ id: z.string() }))],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const params = request.params as { id: string };
      const tenant = { tenantId: request.tenantId, userId: request.userId, role: request.tenantRole! };

      try {
        await creditNoteService.deleteCreditNote(params.id, tenant);
        request.log.info({ creditNoteId: params.id }, 'Deleted credit note');
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: 'Credit note not found' });
          }
          if (error.message.includes('Only DRAFT')) {
            return reply.status(400).send({ error: error.message });
          }
        }
        throw error;
      }
    }
  );
}
