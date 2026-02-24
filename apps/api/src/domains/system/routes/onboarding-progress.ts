import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';

/**
 * Onboarding Progress Routes
 *
 * Manages the onboarding progress tracking for dashboard hero card and sidebar indicator.
 * All routes require authentication and tenant context (applied via middleware hooks).
 *
 * SECURITY:
 * - Auth + tenant middleware enforced via fastify hooks
 * - RBAC validation (OWNER only for mutations)
 * - Strict enum validation for steps
 * - Percentage calculated from boolean flags (source of truth)
 * - Read-modify-write pattern for array updates
 */

// Valid onboarding step names (strict allowlist)
const VALID_STEPS = [
  'basic_info',
  'entity_setup',
  'business_details',
  'bank_connection',
  'goals_setup',
] as const;

type OnboardingStep = (typeof VALID_STEPS)[number];

// Validation schemas
const UpdateProgressSchema = z.object({
  step: z.enum(VALID_STEPS), // ✅ SECURITY: Strict enum validation
  completed: z.boolean(),
});

const SkipStepSchema = z.object({
  step: z.enum(VALID_STEPS), // ✅ SECURITY: Strict enum (was z.string())
  skipDays: z.number().int().min(1).max(90).default(7), // Max 90 days
});

const DismissCardSchema = z.object({
  // No body needed - just marks card as dismissed
});

// Response types
type ProgressResponse = {
  completionPercentage: number;
  completedSteps: string[];
  basicInfoComplete: boolean;
  entitySetupComplete: boolean;
  businessDetailsComplete: boolean;
  bankConnectionComplete: boolean;
  goalsSetupComplete: boolean;
  dashboardCardDismissedAt: string | null;
  skippedSteps: string[];
};

type UpdateResponse = {
  success: boolean;
  completionPercentage: number;
  message: string;
};

type ErrorResponse = {
  error: string;
  message: string;
};

/**
 * Calculate completion percentage from boolean flags (source of truth)
 * Prevents corruption from increment/decrement operations.
 */
function calculateCompletionPercentage(progress: {
  basicInfoComplete: boolean;
  entitySetupComplete: boolean;
  businessDetailsComplete: boolean;
  bankConnectionComplete: boolean;
  goalsSetupComplete: boolean;
}): number {
  const steps = [
    progress.basicInfoComplete,
    progress.entitySetupComplete,
    progress.businessDetailsComplete,
    progress.bankConnectionComplete,
    progress.goalsSetupComplete,
  ];
  const completedCount = steps.filter(Boolean).length;
  return Math.round((completedCount / 5) * 100);
}

/**
 * Get field name for a step (maps step enum to boolean field)
 */
function getStepFieldName(step: OnboardingStep): keyof Omit<ProgressResponse, 'completionPercentage' | 'completedSteps' | 'cardDismissedUntil' | 'skippedSteps'> {
  const fieldMap: Record<OnboardingStep, keyof Omit<ProgressResponse, 'completionPercentage' | 'completedSteps' | 'cardDismissedUntil' | 'skippedSteps'>> = {
    basic_info: 'basicInfoComplete',
    entity_setup: 'entitySetupComplete',
    business_details: 'businessDetailsComplete',
    bank_connection: 'bankConnectionComplete',
    goals_setup: 'goalsSetupComplete',
  };
  return fieldMap[step];
}

export async function onboardingProgressRoutes(fastify: FastifyInstance) {
  /**
   * GET /intents
   *
   * Returns the user's onboarding intents (goals they selected during onboarding).
   * Used by the dashboard to personalize widget ordering and greeting text.
   * ✅ SECURITY: Uses request.tenantId from middleware
   */
  fastify.get<{
    Reply: { intents: string[]; employmentStatus?: string } | ErrorResponse;
  }>('/intents', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.tenantId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'No tenant access',
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId },
        select: { onboardingData: true },
      });

      if (!tenant?.onboardingData || typeof tenant.onboardingData !== 'object') {
        return reply.status(200).send({ intents: [] });
      }

      const data = tenant.onboardingData as Record<string, unknown>;
      const intents = Array.isArray(data.intents) ? data.intents.filter((i): i is string => typeof i === 'string') : [];
      const employmentStatus = typeof data.employmentStatus === 'string' ? data.employmentStatus : undefined;

      return reply.status(200).send({ intents, employmentStatus });
    } catch (error) {
      request.log.error({ error }, 'Error fetching onboarding intents');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to fetch onboarding intents',
      });
    }
  });

  /**
   * GET /progress
   *
   * Fetch current onboarding progress for the authenticated user's tenant.
   * ✅ SECURITY: Uses request.tenantId from middleware
   */
  fastify.get<{
    Reply: ProgressResponse | ErrorResponse;
  }>('/progress', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.tenantId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'No tenant access',
        });
      }

      // Fetch onboarding progress and actual data in parallel
      const [progress, entityCount, accountCount, goalCount] = await Promise.all([
        prisma.onboardingProgress.findUnique({
          where: { tenantId: request.tenantId },
        }),
        prisma.entity.count({
          where: { tenantId: request.tenantId, status: 'ACTIVE' },
        }),
        prisma.account.count({
          where: { entity: { tenantId: request.tenantId }, isActive: true },
        }),
        prisma.goal.count({
          where: { entity: { tenantId: request.tenantId }, status: 'ACTIVE' },
        }),
      ]);

      // Auto-detect completed steps based on actual data
      // If user manually marked something complete, respect that (OR logic)
      const entitySetupComplete = (progress?.entitySetupComplete ?? false) || entityCount > 0;
      const businessDetailsComplete = (progress?.businessDetailsComplete ?? false) || entityCount > 0;
      const bankConnectionComplete = (progress?.bankConnectionComplete ?? false) || accountCount > 0;
      const goalsSetupComplete = (progress?.goalsSetupComplete ?? false) || goalCount > 0;
      const basicInfoComplete = progress?.basicInfoComplete ?? false; // Can't auto-detect

      // Recalculate percentage based on merged flags
      const mergedProgress = {
        basicInfoComplete,
        entitySetupComplete,
        businessDetailsComplete,
        bankConnectionComplete,
        goalsSetupComplete,
      };
      const actualPercentage = calculateCompletionPercentage(mergedProgress);

      // Build completedSteps array from merged flags
      const completedSteps: string[] = [];
      if (basicInfoComplete) completedSteps.push('basic_info');
      if (entitySetupComplete) completedSteps.push('entity_setup');
      if (businessDetailsComplete) completedSteps.push('business_details');
      if (bankConnectionComplete) completedSteps.push('bank_connection');
      if (goalsSetupComplete) completedSteps.push('goals_setup');

      return reply.status(200).send({
        completionPercentage: actualPercentage,
        completedSteps,
        basicInfoComplete,
        entitySetupComplete,
        businessDetailsComplete,
        bankConnectionComplete,
        goalsSetupComplete,
        dashboardCardDismissedAt: progress?.dashboardCardDismissedAt?.toISOString() || null,
        skippedSteps: progress?.skippedSteps || [],
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
   * Mark a step as complete or incomplete.
   * ✅ SECURITY: OWNER-only access (RBAC enforced)
   * ✅ SECURITY: Read-modify-write pattern for arrays
   * ✅ SECURITY: Percentage calculated from boolean flags
   */
  fastify.post<{
    Body: z.infer<typeof UpdateProgressSchema>;
    Reply: UpdateResponse | ErrorResponse;
  }>('/update-progress', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const data = UpdateProgressSchema.parse(request.body);

      if (!request.tenantId || !request.userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'No tenant access',
        });
      }

      // ✅ SECURITY: RBAC check - only OWNER can update progress
      const tenantUser = await prisma.tenantUser.findFirst({
        where: {
          tenantId: request.tenantId,
          userId: request.userId,
        },
      });

      if (!tenantUser || tenantUser.role !== 'OWNER') {
        request.log.warn(
          { userId: request.userId, tenantId: request.tenantId, role: tenantUser?.role },
          'Non-owner attempted to update onboarding progress'
        );
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only account owners can update onboarding progress',
        });
      }

      // ✅ CORRECT: Read-modify-write pattern for array updates
      const currentProgress = await prisma.onboardingProgress.findUnique({
        where: { tenantId: request.tenantId },
      });

      if (!currentProgress) {
        return reply.status(404).send({
          error: 'NotFound',
          message: 'Onboarding progress not found',
        });
      }

      // Update completedSteps array
      const currentSteps = currentProgress.completedSteps;
      const newSteps = data.completed
        ? Array.from(new Set([...currentSteps, data.step])) // Add step (dedupe)
        : currentSteps.filter((s) => s !== data.step); // Remove step

      // Update boolean field for the step
      const stepField = getStepFieldName(data.step);
      const updatedBooleans = {
        basicInfoComplete: currentProgress.basicInfoComplete,
        entitySetupComplete: currentProgress.entitySetupComplete,
        businessDetailsComplete: currentProgress.businessDetailsComplete,
        bankConnectionComplete: currentProgress.bankConnectionComplete,
        goalsSetupComplete: currentProgress.goalsSetupComplete,
        [stepField]: data.completed,
      };

      // ✅ CORRECT: Calculate new percentage from boolean flags (source of truth)
      const newPercentage = calculateCompletionPercentage(updatedBooleans);

      // Update progress
      const updatedProgress = await prisma.onboardingProgress.update({
        where: { tenantId: request.tenantId },
        data: {
          completedSteps: newSteps,
          [stepField]: data.completed,
          completionPercentage: newPercentage,
        },
      });

      request.log.info(
        { tenantId: request.tenantId, step: data.step, completed: data.completed },
        'Onboarding progress updated'
      );

      return reply.status(200).send({
        success: true,
        completionPercentage: updatedProgress.completionPercentage,
        message: `Step ${data.step} marked as ${data.completed ? 'complete' : 'incomplete'}`,
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
   * Skip a step for N days (1-90 days, default 7).
   * ✅ SECURITY: OWNER-only access
   * ✅ SECURITY: Strict enum validation + max validation
   */
  fastify.post<{
    Body: z.infer<typeof SkipStepSchema>;
    Reply: UpdateResponse | ErrorResponse;
  }>('/skip-step', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = SkipStepSchema.parse(request.body);

      if (!request.tenantId || !request.userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'No tenant access',
        });
      }

      // ✅ SECURITY: RBAC check
      const tenantUser = await prisma.tenantUser.findFirst({
        where: {
          tenantId: request.tenantId,
          userId: request.userId,
        },
      });

      if (!tenantUser || tenantUser.role !== 'OWNER') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only account owners can skip onboarding steps',
        });
      }

      const currentProgress = await prisma.onboardingProgress.findUnique({
        where: { tenantId: request.tenantId },
      });

      if (!currentProgress) {
        return reply.status(404).send({
          error: 'NotFound',
          message: 'Onboarding progress not found',
        });
      }

      // Calculate skip until date (for lastNudgedAt)
      const skipUntil = new Date();
      skipUntil.setDate(skipUntil.getDate() + data.skipDays);

      // ✅ CORRECT: Read-modify-write for skippedSteps array
      const currentSkipped = currentProgress.skippedSteps;
      const newSkipped = Array.from(new Set([...currentSkipped, data.step])); // Add step (dedupe)

      await prisma.onboardingProgress.update({
        where: { tenantId: request.tenantId },
        data: {
          skippedSteps: newSkipped,
          lastNudgedAt: skipUntil, // Track when to re-show
        },
      });

      request.log.info(
        { tenantId: request.tenantId, step: data.step, skipDays: data.skipDays },
        'Onboarding step skipped'
      );

      return reply.status(200).send({
        success: true,
        completionPercentage: currentProgress.completionPercentage,
        message: `Step ${data.step} skipped for ${data.skipDays} days`,
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
   * Dismiss the onboarding hero card until a specified date (or indefinitely).
   * ✅ SECURITY: Any authenticated tenant user can dismiss (UI preference)
   */
  fastify.post<{
    Body: z.infer<typeof DismissCardSchema>;
    Reply: UpdateResponse | ErrorResponse;
  }>('/dismiss-card', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.tenantId || !request.userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'No tenant access',
        });
      }

      // Tenant middleware already verified access — no additional check needed
      // for a UI preference action like dismissing a card

      const currentProgress = await prisma.onboardingProgress.findUnique({
        where: { tenantId: request.tenantId },
      });

      if (!currentProgress) {
        return reply.status(404).send({
          error: 'NotFound',
          message: 'Onboarding progress not found',
        });
      }

      // Record dismissal timestamp
      const dismissedAt = new Date();

      await prisma.onboardingProgress.update({
        where: { tenantId: request.tenantId },
        data: {
          dashboardCardDismissedAt: dismissedAt,
        },
      });

      request.log.info(
        { tenantId: request.tenantId, dismissedAt: dismissedAt.toISOString() },
        'Onboarding card dismissed'
      );

      return reply.status(200).send({
        success: true,
        completionPercentage: currentProgress.completionPercentage,
        message: 'Onboarding card dismissed',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        request.log.error({ error: error.errors }, 'Validation error');
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Invalid request data',
        });
      }

      request.log.error({ error }, 'Error dismissing onboarding card');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to dismiss onboarding card',
      });
    }
  });
}