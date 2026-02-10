import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';

/**
 * Onboarding Progress Routes
 *
 * Tracks user progress through onboarding steps (basic info, entity, business details, bank, goals).
 * Used by dashboard hero card and sidebar progress indicator.
 */

// Validation schemas
const UpdateProgressSchema = z.object({
  step: z.enum([
    'basic_info',
    'entity_setup',
    'business_details',
    'bank_connection',
    'goals_setup',
  ]),
  completed: z.boolean(),
});

const SkipStepSchema = z.object({
  step: z.string(),
  skipDurationDays: z.number().default(7),
});

// Response types
type ProgressResponse = {
  completionPercentage: number;
  completedSteps: string[];
  skippedSteps: string[];
  basicInfoComplete: boolean;
  entitySetupComplete: boolean;
  businessDetailsComplete: boolean;
  bankConnectionComplete: boolean;
  goalsSetupComplete: boolean;
  lastNudgedAt?: string | null;
  dashboardCardDismissedAt?: string | null;
};

type ErrorResponse = {
  error: string;
  message: string;
};

// Step weights for percentage calculation (total = 100%)
const STEP_WEIGHTS = {
  basic_info: 20,
  entity_setup: 20,
  business_details: 20,
  bank_connection: 20,
  goals_setup: 20,
};

export async function onboardingProgressRoutes(fastify: FastifyInstance) {
  /**
   * GET /progress
   *
   * Returns current onboarding progress for authenticated user's tenant.
   * Used by dashboard hero card and sidebar indicator.
   */
  fastify.get<{
    Reply: ProgressResponse | ErrorResponse;
  }>('/progress', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get user's tenant
      const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId: request.userId as string },
        include: {
          tenant: {
            include: { onboardingProgress: true },
          },
        },
      });

      if (!tenantUser) {
        return reply.status(404).send({
          error: 'NoTenant',
          message: 'No tenant found for user',
        });
      }

      // Return progress or default state
      const progress = tenantUser.tenant.onboardingProgress;

      if (!progress) {
        return reply.status(200).send({
          completionPercentage: 0,
          completedSteps: [],
          skippedSteps: [],
          basicInfoComplete: false,
          entitySetupComplete: false,
          businessDetailsComplete: false,
          bankConnectionComplete: false,
          goalsSetupComplete: false,
          lastNudgedAt: null,
          dashboardCardDismissedAt: null,
        });
      }

      return reply.status(200).send({
        completionPercentage: progress.completionPercentage,
        completedSteps: progress.completedSteps,
        skippedSteps: progress.skippedSteps,
        basicInfoComplete: progress.basicInfoComplete,
        entitySetupComplete: progress.entitySetupComplete,
        businessDetailsComplete: progress.businessDetailsComplete,
        bankConnectionComplete: progress.bankConnectionComplete,
        goalsSetupComplete: progress.goalsSetupComplete,
        lastNudgedAt: progress.lastNudgedAt?.toISOString() || null,
        dashboardCardDismissedAt: progress.dashboardCardDismissedAt?.toISOString() || null,
      });
    } catch (error) {
      request.log.error({ error }, 'Error fetching onboarding progress');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to fetch onboarding progress',
      });
    }
  });

  /**
   * POST /update-progress
   *
   * Updates completion status for a specific onboarding step.
   * Recalculates completion percentage based on step weights.
   */
  fastify.post<{
    Body: z.infer<typeof UpdateProgressSchema>;
    Reply: ProgressResponse | ErrorResponse;
  }>('/update-progress', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { step, completed } = UpdateProgressSchema.parse(request.body);

      // Get user's tenant
      const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId: request.userId as string },
      });

      if (!tenantUser) {
        return reply.status(404).send({
          error: 'NoTenant',
          message: 'No tenant found for user',
        });
      }

      // Get current progress
      const currentProgress = await prisma.onboardingProgress.findUnique({
        where: { tenantId: tenantUser.tenantId },
      });

      // Calculate new completion percentage
      let newPercentage = currentProgress?.completionPercentage || 0;

      if (completed) {
        // Add step weight if not already completed
        const stepField = `${step}Complete` as
          | 'basicInfoComplete'
          | 'entitySetupComplete'
          | 'businessDetailsComplete'
          | 'bankConnectionComplete'
          | 'goalsSetupComplete';

        const alreadyCompleted = currentProgress?.[stepField] || false;

        if (!alreadyCompleted) {
          newPercentage += STEP_WEIGHTS[step];
        }
      } else {
        // Subtract step weight if was completed
        newPercentage -= STEP_WEIGHTS[step];
      }

      // Clamp percentage between 0 and 100
      newPercentage = Math.max(0, Math.min(100, newPercentage));

      // Update or create progress
      const progress = await prisma.onboardingProgress.upsert({
        where: { tenantId: tenantUser.tenantId },
        create: {
          tenantId: tenantUser.tenantId,
          [`${step}Complete`]: completed,
          completedSteps: completed ? [step] : [],
          completionPercentage: newPercentage,
        },
        update: {
          [`${step}Complete`]: completed,
          completedSteps: completed
            ? {
                push: step,
              }
            : {
                set: (currentProgress?.completedSteps || []).filter((s) => s !== step),
              },
          completionPercentage: newPercentage,
        },
      });

      request.log.info(
        { tenantId: tenantUser.tenantId, step, completed, newPercentage },
        'Onboarding progress updated'
      );

      return reply.status(200).send({
        completionPercentage: progress.completionPercentage,
        completedSteps: progress.completedSteps,
        skippedSteps: progress.skippedSteps,
        basicInfoComplete: progress.basicInfoComplete,
        entitySetupComplete: progress.entitySetupComplete,
        businessDetailsComplete: progress.businessDetailsComplete,
        bankConnectionComplete: progress.bankConnectionComplete,
        goalsSetupComplete: progress.goalsSetupComplete,
        lastNudgedAt: progress.lastNudgedAt?.toISOString() || null,
        dashboardCardDismissedAt: progress.dashboardCardDismissedAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        request.log.error({ error: error.errors }, 'Validation error');
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Invalid request data',
        });
      }

      request.log.error({ error }, 'Error updating onboarding progress');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to update onboarding progress',
      });
    }
  });

  /**
   * POST /skip-step
   *
   * Marks a step as skipped temporarily (default 7 days).
   * Sets lastNudgedAt to avoid immediate re-prompts.
   */
  fastify.post<{
    Body: z.infer<typeof SkipStepSchema>;
    Reply: ProgressResponse | ErrorResponse;
  }>('/skip-step', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { step, skipDurationDays } = SkipStepSchema.parse(request.body);

      // Get user's tenant
      const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId: request.userId as string },
      });

      if (!tenantUser) {
        return reply.status(404).send({
          error: 'NoTenant',
          message: 'No tenant found for user',
        });
      }

      // Calculate skip expiry date
      const skipUntil = new Date();
      skipUntil.setDate(skipUntil.getDate() + skipDurationDays);

      // Update or create progress
      const progress = await prisma.onboardingProgress.upsert({
        where: { tenantId: tenantUser.tenantId },
        create: {
          tenantId: tenantUser.tenantId,
          skippedSteps: [step],
          lastNudgedAt: skipUntil,
        },
        update: {
          skippedSteps: {
            push: step,
          },
          lastNudgedAt: skipUntil,
        },
      });

      request.log.info(
        { tenantId: tenantUser.tenantId, step, skipDurationDays },
        'Onboarding step skipped'
      );

      return reply.status(200).send({
        completionPercentage: progress.completionPercentage,
        completedSteps: progress.completedSteps,
        skippedSteps: progress.skippedSteps,
        basicInfoComplete: progress.basicInfoComplete,
        entitySetupComplete: progress.entitySetupComplete,
        businessDetailsComplete: progress.businessDetailsComplete,
        bankConnectionComplete: progress.bankConnectionComplete,
        goalsSetupComplete: progress.goalsSetupComplete,
        lastNudgedAt: progress.lastNudgedAt?.toISOString() || null,
        dashboardCardDismissedAt: progress.dashboardCardDismissedAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        request.log.error({ error: error.errors }, 'Validation error');
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Invalid request data',
        });
      }

      request.log.error({ error }, 'Error skipping onboarding step');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to skip onboarding step',
      });
    }
  });

  /**
   * POST /dismiss-card
   *
   * Records when user dismisses the dashboard onboarding card.
   * Card will reappear after 24 hours or on next login.
   */
  fastify.post<{
    Reply: ProgressResponse | ErrorResponse;
  }>('/dismiss-card', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get user's tenant
      const tenantUser = await prisma.tenantUser.findFirst({
        where: { userId: request.userId as string },
      });

      if (!tenantUser) {
        return reply.status(404).send({
          error: 'NoTenant',
          message: 'No tenant found for user',
        });
      }

      // Update progress with dismissal timestamp
      const progress = await prisma.onboardingProgress.upsert({
        where: { tenantId: tenantUser.tenantId },
        create: {
          tenantId: tenantUser.tenantId,
          dashboardCardDismissedAt: new Date(),
        },
        update: {
          dashboardCardDismissedAt: new Date(),
        },
      });

      request.log.info({ tenantId: tenantUser.tenantId }, 'Dashboard card dismissed');

      return reply.status(200).send({
        completionPercentage: progress.completionPercentage,
        completedSteps: progress.completedSteps,
        skippedSteps: progress.skippedSteps,
        basicInfoComplete: progress.basicInfoComplete,
        entitySetupComplete: progress.entitySetupComplete,
        businessDetailsComplete: progress.businessDetailsComplete,
        bankConnectionComplete: progress.bankConnectionComplete,
        goalsSetupComplete: progress.goalsSetupComplete,
        lastNudgedAt: progress.lastNudgedAt?.toISOString() || null,
        dashboardCardDismissedAt: progress.dashboardCardDismissedAt?.toISOString() || null,
      });
    } catch (error) {
      request.log.error({ error }, 'Error dismissing dashboard card');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to dismiss dashboard card',
      });
    }
  });
}
