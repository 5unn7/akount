import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@akount/db';
import { createClerkClient } from '@clerk/backend';

// Initialize Clerk client with secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Onboarding Routes
 *
 * Handles user onboarding workflow including tenant and entity creation.
 * All routes require authentication but NOT tenant context (user may not have tenant yet).
 */

// Validation schemas
const initializeOnboardingSchema = z.object({
  accountType: z.enum(['personal', 'business', 'accountant']),
  entityName: z.string().min(1).max(255),
  entityType: z.enum(['PERSONAL', 'CORPORATION', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC']),
  phoneNumber: z.string().min(1).optional(),
  timezone: z.string().default('America/Toronto'),
  country: z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
});

const completeOnboardingSchema = z.object({
  tenantId: z.string(),
  entityName: z.string().min(1).max(255),
  entityType: z.enum(['PERSONAL', 'CORPORATION', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC']),
  country: z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
  fiscalYearStart: z.number().int().min(1).max(12),
});

// Response types
type InitializeResponse = {
  success: boolean;
  tenantId: string;
  entityId: string;
  message: string;
};

type CompleteResponse = {
  success: boolean;
  tenantId: string;
  entityId: string;
  message: string;
};

type ErrorResponse = {
  error: string;
  message: string;
};

type StatusResponse = {
  status: 'new' | 'in_progress' | 'completed';
  tenantId?: string;
  currentStep?: string;
};

export async function onboardingRoutes(fastify: FastifyInstance) {
  /**
   * POST /initialize
   *
   * Creates initial tenant and entity during onboarding.
   * Called after user selects account type and enters basic details.
   */
  fastify.post<{
    Body: z.infer<typeof initializeOnboardingSchema>;
    Reply: InitializeResponse | ErrorResponse;
  }>('/initialize', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const data = initializeOnboardingSchema.parse(request.body);

      // Get or create user from database (upsert pattern)
      // New users from Clerk won't exist in our DB yet, so we create them here
      let user = await prisma.user.findUnique({
        where: { clerkUserId: request.userId as string },
      });

      if (!user) {
        // User authenticated via Clerk but doesn't exist in our DB yet
        // Fetch user details from Clerk to get email and name
        const clerkUser = await clerkClient.users.getUser(request.userId as string);

        if (!clerkUser) {
          return reply.status(500).send({
            error: 'ClerkUserNotFound',
            message: 'Could not fetch user details from Clerk',
          });
        }

        // Get primary email from Clerk
        const primaryEmail = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId);
        if (!primaryEmail) {
          return reply.status(400).send({
            error: 'NoEmail',
            message: 'User must have an email address to sign up',
          });
        }

        // Create user in our database
        user = await prisma.user.create({
          data: {
            clerkUserId: request.userId as string,
            email: primaryEmail.emailAddress,
            name: clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.firstName || clerkUser.username || data.entityName,
          },
        });

        request.log.info(
          { clerkUserId: request.userId, userId: user.id, email: user.email },
          'Created new user from Clerk authentication'
        );
      }

      // Check if user already has a tenant
      const existingMembership = await prisma.tenantUser.findFirst({
        where: { userId: user.id },
      });

      if (existingMembership) {
        return reply.status(400).send({
          error: 'AlreadyOnboarded',
          message: 'User already has an active tenant.',
        });
      }

      // Determine region from country code
      const regionMap: Record<string, 'CA' | 'US' | 'EU' | 'UK' | 'AU'> = {
        CA: 'CA',
        US: 'US',
        GB: 'UK',
        IE: 'EU',
        DE: 'EU',
        FR: 'EU',
        AU: 'AU',
        NZ: 'AU',
      };
      const region = regionMap[data.country] || 'CA';

      // Save user phone and timezone
      if (data.phoneNumber || data.timezone) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
            ...(data.timezone && { timezone: data.timezone }),
          },
        });
      }

      // Create tenant in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            name: `${user.name || 'User'}'s Workspace`,
            region,
            status: 'TRIAL',
            plan: 'FREE',
            onboardingStatus: 'IN_PROGRESS',
            onboardingData: {
              accountType: data.accountType,
              startedAt: new Date().toISOString(),
            },
          },
        });

        // Create tenant user membership
        await tx.tenantUser.create({
          data: {
            tenantId: tenant.id,
            userId: user.id,
            role: 'OWNER',
          },
        });

        // Create entity
        const entity = await tx.entity.create({
          data: {
            tenantId: tenant.id,
            name: data.entityName,
            type: data.entityType,
            country: data.country,
            functionalCurrency: data.currency,
            reportingCurrency: data.currency,
          },
        });

        // Create onboarding progress (40% complete: basic_info + entity_setup)
        await tx.onboardingProgress.create({
          data: {
            tenantId: tenant.id,
            completedSteps: ['basic_info', 'entity_setup'],
            basicInfoComplete: true,
            entitySetupComplete: true,
            completionPercentage: 40,
          },
        });

        return { tenant, entity };
      });

      request.log.info(
        { tenantId: result.tenant.id, entityId: result.entity.id, userId: user.id },
        'Onboarding initialized'
      );

      return reply.status(201).send({
        success: true,
        tenantId: result.tenant.id,
        entityId: result.entity.id,
        message: 'Onboarding initialized successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        request.log.error({ error: error.errors }, 'Validation error');
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Invalid request data',
        });
      }

      request.log.error({
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      }, 'Error initializing onboarding');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to initialize onboarding',
      });
    }
  });

  /**
   * POST /complete
   *
   * Completes the onboarding process.
   * Finalizes tenant and entity setup, generates default Chart of Accounts.
   */
  fastify.post<{
    Body: z.infer<typeof completeOnboardingSchema>;
    Reply: CompleteResponse | ErrorResponse;
  }>('/complete', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = completeOnboardingSchema.parse(request.body);

      // Get user
      const user = await prisma.user.findUnique({
        where: { clerkUserId: request.userId as string },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'UserNotFound',
          message: 'User not found',
        });
      }

      // Verify tenant belongs to user AND user has OWNER role (RBAC check)
      const tenantUser = await prisma.tenantUser.findFirst({
        where: {
          tenantId: data.tenantId,
          userId: user.id,
        },
      });

      if (!tenantUser) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this tenant',
        });
      }

      // SECURITY: RBAC check - only OWNER can complete onboarding
      if (tenantUser.role !== 'OWNER') {
        request.log.warn(
          { userId: user.id, tenantId: data.tenantId, role: tenantUser.role },
          'Non-owner attempted to complete onboarding'
        );
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only account owners can complete onboarding',
        });
      }

      // Update tenant and entity
      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.update({
          where: { id: data.tenantId },
          data: {
            onboardingStatus: 'COMPLETED',
            onboardingCompletedAt: new Date(),
          },
        });

        // Find the entity for this tenant
        const entity = await tx.entity.findFirst({
          where: { tenantId: data.tenantId },
        });

        if (!entity) {
          throw new Error('Entity not found');
        }

        const updatedEntity = await tx.entity.update({
          where: { id: entity.id },
          data: {
            fiscalYearStart: data.fiscalYearStart,
            setupCompletedAt: new Date(),
          },
        });

        // Create default fiscal calendar for the year
        const now = new Date();
        const fiscalYear = now.getFullYear();

        const startDate = new Date(fiscalYear, data.fiscalYearStart - 1, 1);
        const endDate = new Date(fiscalYear + 1, data.fiscalYearStart - 1, 0);

        await tx.fiscalCalendar.upsert({
          where: {
            entityId_year: {
              entityId: entity.id,
              year: fiscalYear,
            },
          },
          create: {
            entityId: entity.id,
            year: fiscalYear,
            startDate,
            endDate,
            periods: {
              create: Array.from({ length: 12 }, (_, i) => {
                const monthStart = new Date(fiscalYear, (data.fiscalYearStart - 1 + i) % 12, 1);
                const monthEnd = new Date(fiscalYear, ((data.fiscalYearStart - 1 + i) % 12) + 1, 0);
                return {
                  periodNumber: i + 1,
                  name: monthStart.toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  }),
                  startDate: monthStart,
                  endDate: monthEnd,
                  status: 'OPEN' as const,
                };
              }),
            },
          },
          update: {},
        });

        // Create basic Chart of Accounts (6 core accounts)
        const defaultAccounts = [
          { code: '1000', name: 'Bank Account', type: 'ASSET' as const, balance: 'DEBIT' as const },
          {
            code: '1100',
            name: 'Accounts Receivable',
            type: 'ASSET' as const,
            balance: 'DEBIT' as const,
          },
          {
            code: '2000',
            name: 'Accounts Payable',
            type: 'LIABILITY' as const,
            balance: 'CREDIT' as const,
          },
          {
            code: '3000',
            name: 'Owner Equity',
            type: 'EQUITY' as const,
            balance: 'CREDIT' as const,
          },
          { code: '4000', name: 'Revenue', type: 'INCOME' as const, balance: 'CREDIT' as const },
          { code: '5000', name: 'Expenses', type: 'EXPENSE' as const, balance: 'DEBIT' as const },
        ];

        for (const account of defaultAccounts) {
          await tx.gLAccount.create({
            data: {
              entityId: entity.id,
              code: account.code,
              name: account.name,
              type: account.type,
              normalBalance: account.balance,
            },
          });
        }

        return { tenant, entity: updatedEntity };
      });

      request.log.info({ tenantId: data.tenantId, userId: user.id }, 'Onboarding completed');

      return reply.status(200).send({
        success: true,
        tenantId: result.tenant.id,
        entityId: result.entity.id,
        message: 'Onboarding completed successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        request.log.error({ error: error.errors }, 'Validation error');
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Invalid request data',
        });
      }

      request.log.error({ error }, 'Error completing onboarding');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to complete onboarding',
      });
    }
  });

  /**
   * GET /status
   *
   * Returns the current onboarding status for the authenticated user.
   */
  fastify.get<{ Reply: StatusResponse | ErrorResponse }>('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: request.userId as string },
        include: { memberships: { include: { tenant: true } } },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'UserNotFound',
          message: 'User not found',
        });
      }

      if (user.memberships.length === 0) {
        return reply.status(200).send({
          status: 'new',
        });
      }

      const tenant = user.memberships[0].tenant;

      return reply.status(200).send({
        status: tenant.onboardingStatus.toLowerCase() as 'new' | 'in_progress' | 'completed',
        tenantId: tenant.id,
        currentStep: tenant.onboardingStep || undefined,
      });
    } catch (error) {
      request.log.error({ error }, 'Error checking onboarding status');
      return reply.status(500).send({
        error: 'InternalError',
        message: 'Failed to check onboarding status',
      });
    }
  });
}
