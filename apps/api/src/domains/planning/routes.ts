import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import { withPermission } from '../../middleware/withPermission';
import { validateBody } from '../../middleware/validation';

/**
 * Planning Domain Routes
 *
 * Handles budgets, goals, forecasts, and reports.
 * All routes require authentication and are tenant-scoped.
 */
export async function planningRoutes(fastify: FastifyInstance) {
  // Apply auth and tenant middleware to all routes in this domain
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // ============================================================================
  // BUDGETS
  // ============================================================================

  fastify.get(
    '/budgets',
    {
      ...withPermission('planning', 'budgets', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Budgets listing will be implemented in Phase 6',
      });
    }
  );

  fastify.post(
    '/budgets',
    {
      ...withPermission('planning', 'budgets', 'ACT'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Budget creation will be implemented in Phase 6',
      });
    }
  );

  // ============================================================================
  // GOALS
  // ============================================================================

  fastify.get(
    '/goals',
    {
      ...withPermission('planning', 'goals', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Goals listing will be implemented in Phase 6',
      });
    }
  );

  // Create Goal Schema
  const CreateGoalSchema = z.object({
    revenueTarget: z.number().int().min(0), // In cents
    expenseTarget: z.number().int().min(0), // In cents
    savingsTarget: z.number().int().min(0), // In cents
    timeframe: z.enum(['monthly', 'quarterly', 'yearly']),
  });

  fastify.post(
    '/goals',
    {
      ...withPermission('planning', 'goals', 'ACT'),
      preValidation: [validateBody(CreateGoalSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = request.body as z.infer<typeof CreateGoalSchema>;

        // Get user's entity
        const tenantUser = await prisma.tenantUser.findFirst({
          where: { userId: request.userId },
          include: {
            tenant: {
              include: {
                entities: {
                  take: 1,
                  where: { deletedAt: null },
                },
              },
            },
          },
        });

        if (!tenantUser || !tenantUser.tenant.entities[0]) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'No entity found for this user',
          });
        }

        const entity = tenantUser.tenant.entities[0];

        // Create goal record
        // TODO: Add Goal model to Prisma schema in Phase 6
        // For now, we'll store as JSON in entity metadata
        const updatedEntity = await prisma.entity.update({
          where: { id: entity.id },
          data: {
            // Store goals as metadata for now
            metadata: {
              ...(entity.metadata as object || {}),
              financialGoals: {
                revenueTarget: data.revenueTarget,
                expenseTarget: data.expenseTarget,
                savingsTarget: data.savingsTarget,
                timeframe: data.timeframe,
                createdAt: new Date().toISOString(),
              },
            },
          },
        });

        return reply.status(201).send({
          success: true,
          goal: {
            revenueTarget: data.revenueTarget,
            expenseTarget: data.expenseTarget,
            savingsTarget: data.savingsTarget,
            timeframe: data.timeframe,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create goal',
        });
      }
    }
  );

  // ============================================================================
  // REPORTS
  // ============================================================================

  fastify.get(
    '/reports',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Reports listing will be implemented in Phase 5',
      });
    }
  );

  fastify.get(
    '/reports/profit-loss',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Profit & Loss report will be implemented in Phase 5',
      });
    }
  );

  fastify.get(
    '/reports/balance-sheet',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Balance Sheet report will be implemented in Phase 5',
      });
    }
  );

  fastify.get(
    '/reports/cash-flow',
    {
      ...withPermission('planning', 'reports', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Cash Flow report will be implemented in Phase 5',
      });
    }
  );

  // ============================================================================
  // FORECASTS
  // ============================================================================

  fastify.get(
    '/forecasts',
    {
      ...withPermission('planning', 'forecasts', 'VIEW'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: 'Not Implemented',
        message: 'Forecasts will be implemented in Phase 6',
      });
    }
  );
}
