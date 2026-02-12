import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';
import { validateBody } from '../../../middleware/validation';

/**
 * Entity Management Routes
 *
 * Handle entity-level operations like updating business details.
 */

// Validation schema for business details update
const UpdateBusinessDetailsSchema = z.object({
  taxId: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  industry: z.string().min(1),
  businessSize: z.enum(['SOLO', '2-10', '11-50', '50+']),
});

export async function entityRoutes(fastify: FastifyInstance) {
  /**
   * PATCH /api/system/entity/business-details
   * Update business details for the current user's entity
   */
  fastify.patch('/business-details', {
    preValidation: [validateBody(UpdateBusinessDetailsSchema)],
  }, async (request, reply) => {
    try {
      // Get user's tenant
      const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId: request.userId as string },
      });

      if (!tenantUser) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'No tenant found for this user',
        });
      }

      // Get the first entity for this tenant
      const entity = await prisma.entity.findFirst({
        where: { tenantId: tenantUser.tenantId },
      });

      if (!entity) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'No entity found for this user',
        });
      }
      const data = request.body as z.infer<typeof UpdateBusinessDetailsSchema>;

      // Update entity with business details
      const updatedEntity = await prisma.entity.update({
        where: { id: entity.id },
        data: {
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          industry: data.industry,
          businessSize: data.businessSize,
          ...(data.taxId && { taxId: data.taxId }),
        },
      });

      return reply.status(200).send({
        success: true,
        entity: updatedEntity,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update business details',
      });
    }
  });
}
