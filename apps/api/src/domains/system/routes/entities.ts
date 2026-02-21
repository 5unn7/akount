import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateBody } from '../../../middleware/validation';
import { EntityService } from '../services/entity.service';
import { validateTaxId } from '../../../lib/validators/tax-id';
import {
  ListEntitiesQuerySchema,
  EntityIdParamSchema,
  CreateEntitySchema,
  UpdateEntitySchema,
  type ListEntitiesQuery,
  type EntityIdParam,
  type CreateEntityInput,
  type UpdateEntityInput,
} from '../schemas/entity.schema';

/**
 * Entity Management Routes (Consolidated)
 *
 * Replaces inline entity routes from routes.ts and routes/entity.ts.
 * All endpoints enforce RBAC and tenant isolation.
 */
export async function entityManagementRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/system/entities
   * List all entities for the tenant with optional status filter.
   */
  fastify.get(
    '/',
    {
      ...withPermission('system', 'entities', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const queryParsed = ListEntitiesQuerySchema.safeParse(request.query);
        const statusFilter = queryParsed.success ? queryParsed.data.status : undefined;

        const service = new EntityService(
          request.tenantId as string,
          request.userId as string
        );
        const entities = await service.listEntities(
          statusFilter ? { status: statusFilter } : undefined
        );

        return { entities };
      } catch (error) {
        request.log.error({ err: error }, 'Error fetching entities');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch entities',
        });
      }
    }
  );

  /**
   * GET /api/system/entities/:id
   * Get full entity detail with counts.
   */
  fastify.get(
    '/:id',
    {
      ...withPermission('system', 'entities', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const paramParsed = EntityIdParamSchema.safeParse(request.params);
        if (!paramParsed.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid entity ID',
          });
        }

        const service = new EntityService(
          request.tenantId as string,
          request.userId as string
        );
        const entity = await service.getEntityDetail(paramParsed.data.id);

        if (!entity) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Entity not found',
          });
        }

        return entity;
      } catch (error) {
        request.log.error({ err: error }, 'Error fetching entity');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch entity',
        });
      }
    }
  );

  /**
   * POST /api/system/entities
   * Create a new entity.
   */
  fastify.post(
    '/',
    {
      ...withPermission('system', 'entities', 'ADMIN'),
      preValidation: [validateBody(CreateEntitySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = request.body as CreateEntityInput;

        // Validate tax ID format (warn, don't block)
        let taxIdWarning: string | undefined;
        if (data.taxId) {
          const result = validateTaxId(data.country, data.taxId);
          if (!result.valid) {
            taxIdWarning = result.error;
          }
          // Use formatted version
          data.taxId = result.formatted;
        }

        const service = new EntityService(
          request.tenantId as string,
          request.userId as string
        );
        const entity = await service.createEntity(request.userId as string, {
          name: data.name,
          type: data.type,
          country: data.country,
          functionalCurrency: data.currency,
          fiscalYearStart: data.fiscalYearStart,
          entitySubType: data.entitySubType,
          taxId: data.taxId,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
        });

        return reply.status(201).send({
          id: entity.id,
          name: entity.name,
          type: entity.type,
          status: entity.status,
          currency: entity.functionalCurrency,
          country: entity.country,
          ...(taxIdWarning && { taxIdWarning }),
        });
      } catch (error) {
        request.log.error({ err: error }, 'Error creating entity');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create entity',
        });
      }
    }
  );

  /**
   * PATCH /api/system/entities/:id
   * Update entity fields.
   */
  fastify.patch(
    '/:id',
    {
      ...withPermission('system', 'entities', 'ADMIN'),
      preValidation: [validateBody(UpdateEntitySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const paramParsed = EntityIdParamSchema.safeParse(request.params);
        if (!paramParsed.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid entity ID',
          });
        }

        const data = request.body as UpdateEntityInput;

        // Validate tax ID format if provided (warn, don't block)
        let taxIdWarning: string | undefined;
        if (data.taxId) {
          // Need to get entity for country code
          const service = new EntityService(
            request.tenantId as string,
            request.userId as string
          );
          const existing = await service.getEntityDetail(paramParsed.data.id);
          if (!existing) {
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Entity not found',
            });
          }

          const result = validateTaxId(existing.country, data.taxId);
          if (!result.valid) {
            taxIdWarning = result.error;
          }
          data.taxId = result.formatted;
        }

        const service = new EntityService(
          request.tenantId as string,
          request.userId as string
        );

        // Convert registrationDate string to Date if present
        const updateData: Record<string, unknown> = { ...data };
        if (data.registrationDate) {
          updateData.registrationDate = new Date(data.registrationDate);
        }

        const updated = await service.updateEntity(
          paramParsed.data.id,
          updateData as Parameters<EntityService['updateEntity']>[1]
        );

        if (!updated) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Entity not found',
          });
        }

        return {
          ...updated,
          ...(taxIdWarning && { taxIdWarning }),
        };
      } catch (error) {
        request.log.error({ err: error }, 'Error updating entity');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update entity',
        });
      }
    }
  );

  /**
   * POST /api/system/entities/:id/archive
   * Archive an entity after validating no active data.
   */
  fastify.post(
    '/:id/archive',
    {
      ...withPermission('system', 'entities', 'ADMIN'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const paramParsed = EntityIdParamSchema.safeParse(request.params);
        if (!paramParsed.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid entity ID',
          });
        }

        const service = new EntityService(
          request.tenantId as string,
          request.userId as string
        );
        const result = await service.archiveEntity(paramParsed.data.id);

        if (!result.success) {
          return reply.status(409).send({
            error: 'Conflict',
            message: result.error,
            blockers: result.blockers,
          });
        }

        return { success: true, message: 'Entity archived successfully' };
      } catch (error) {
        request.log.error({ err: error }, 'Error archiving entity');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to archive entity',
        });
      }
    }
  );
}
