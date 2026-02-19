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
  // New personal-first fields (optional for backward compat)
  intents: z.array(z.string()).optional(),
  employmentStatus: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  // Optional business entity (created alongside personal entity)
  businessEntity: z.object({
    name: z.string().min(1).max(255),
    entityType: z.enum(['CORPORATION', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC']),
    country: z.string().length(2).toUpperCase(),
    currency: z.string().length(3).toUpperCase(),
    industry: z.string().optional(),
  }).optional(),
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
  businessEntityId?: string;
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
              ...(data.intents && { intents: data.intents }),
              ...(data.employmentStatus && { employmentStatus: data.employmentStatus }),
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

        // Create entity (with optional address from personal-first flow)
        const entity = await tx.entity.create({
          data: {
            tenantId: tenant.id,
            name: data.entityName,
            type: data.entityType,
            country: data.country,
            functionalCurrency: data.currency,
            reportingCurrency: data.currency,
            ...(data.streetAddress && { address: data.streetAddress }),
            ...(data.city && { city: data.city }),
            ...(data.province && { state: data.province }),
            ...(data.postalCode && { postalCode: data.postalCode }),
          },
        });

        // Optionally create a business entity (same tenant, separate entity)
        let businessEntity = null;
        if (data.businessEntity) {
          const bizCountry = data.businessEntity.country;
          const bizCurrency = data.businessEntity.currency;
          businessEntity = await tx.entity.create({
            data: {
              tenantId: tenant.id,
              name: data.businessEntity.name,
              type: data.businessEntity.entityType,
              country: bizCountry,
              functionalCurrency: bizCurrency,
              reportingCurrency: bizCurrency,
              ...(data.businessEntity.industry && { industry: data.businessEntity.industry }),
            },
          });
        }

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

        return { tenant, entity, businessEntity };
      });

      request.log.info(
        { tenantId: result.tenant.id, entityId: result.entity.id, businessEntityId: result.businessEntity?.id, userId: user.id },
        'Onboarding initialized'
      );

      // Update Clerk user metadata with tenantId so middleware can check onboarding status
      try {
        await clerkClient.users.updateUserMetadata(request.userId as string, {
          publicMetadata: {
            tenantId: result.tenant.id,
            role: 'OWNER',
            onboardingCompleted: false, // Will be set to true on /complete
          },
        });
      } catch (clerkError) {
        request.log.warn({ clerkError }, 'Failed to update Clerk metadata - non-critical');
      }

      return reply.status(201).send({
        success: true,
        tenantId: result.tenant.id,
        entityId: result.entity.id,
        ...(result.businessEntity && { businessEntityId: result.businessEntity.id }),
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
        // Uses createMany + skipDuplicates so this endpoint is idempotent
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

        await tx.gLAccount.createMany({
          data: defaultAccounts.map((account) => ({
            entityId: entity.id,
            code: account.code,
            name: account.name,
            type: account.type,
            normalBalance: account.balance,
          })),
          skipDuplicates: true,
        });

        return { tenant, entity: updatedEntity };
      });

      request.log.info({ tenantId: data.tenantId, userId: user.id }, 'Onboarding completed');

      // Update Clerk metadata to mark onboarding complete and set role
      try {
        await clerkClient.users.updateUserMetadata(request.userId as string, {
          publicMetadata: {
            tenantId: data.tenantId,
            role: tenantUser.role,
            onboardingCompleted: true,
          },
        });
      } catch (clerkError) {
        request.log.warn({ clerkError }, 'Failed to update Clerk metadata on complete - non-critical');
      }

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
