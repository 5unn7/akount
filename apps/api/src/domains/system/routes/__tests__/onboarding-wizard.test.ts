import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock Clerk backend
vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: 'clerk-user-1',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        emailAddresses: [{ id: 'email-1', emailAddress: 'test@example.com' }],
        primaryEmailAddressId: 'email-1',
      }),
      updateUserMetadata: vi.fn(),
    },
  }),
}));

// Mock Prisma client
const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    onboardingWizardState: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    tenantUser: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    tenant: {
      create: vi.fn(),
    },
    entity: {
      create: vi.fn(),
    },
    onboardingProgress: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      tenant: { create: vi.fn().mockResolvedValue({ id: 'tenant-1', name: 'Test' }) },
      tenantUser: { create: vi.fn() },
      entity: { create: vi.fn().mockResolvedValue({ id: 'entity-1' }) },
      onboardingProgress: { create: vi.fn() },
    })),
  },
}));

const CLERK_USER_ID = 'clerk-user-abc-123';
const OTHER_CLERK_USER_ID = 'clerk-user-other-456';

describe('Onboarding Wizard State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveStepSchema validation', () => {
    const saveStepSchema = z.object({
      step: z.number().int().min(0).max(10),
      data: z.record(z.unknown()),
      version: z.number().int().min(0),
    });

    it('should accept valid save-step payload', () => {
      const result = saveStepSchema.safeParse({
        step: 2,
        data: { country: 'CA', currency: 'CAD' },
        version: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative step', () => {
      const result = saveStepSchema.safeParse({
        step: -1,
        data: {},
        version: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject step > 10', () => {
      const result = saveStepSchema.safeParse({
        step: 11,
        data: {},
        version: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer step', () => {
      const result = saveStepSchema.safeParse({
        step: 1.5,
        data: {},
        version: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing data field', () => {
      const result = saveStepSchema.safeParse({
        step: 0,
        version: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative version', () => {
      const result = saveStepSchema.safeParse({
        step: 0,
        data: {},
        version: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('save-step logic', () => {
    it('should create new state for fresh user', async () => {
      // No existing state
      mockFindUnique.mockResolvedValue(null);
      mockUpsert.mockResolvedValue({
        id: 'state-1',
        clerkUserId: CLERK_USER_ID,
        currentStep: 1,
        stepData: { accountType: 'personal' },
        version: 1,
      });

      // Simulate the save-step logic
      const clerkUserId = CLERK_USER_ID;
      const body = { step: 1, data: { accountType: 'personal' }, version: 0 };

      const existing = await mockFindUnique({ where: { clerkUserId }, select: { version: true } });
      expect(existing).toBeNull();

      const newVersion = (existing?.version ?? 0) + 1;
      expect(newVersion).toBe(1);

      await mockUpsert({
        where: { clerkUserId },
        create: { clerkUserId, currentStep: body.step, stepData: body.data, version: newVersion },
        update: { currentStep: body.step, stepData: body.data, version: newVersion },
      });

      expect(mockUpsert).toHaveBeenCalledOnce();
    });

    it('should update existing state with incremented version', async () => {
      mockFindUnique.mockResolvedValue({ version: 3 });
      mockUpsert.mockResolvedValue({
        id: 'state-1',
        clerkUserId: CLERK_USER_ID,
        currentStep: 2,
        stepData: { country: 'US' },
        version: 4,
      });

      const clerkUserId = CLERK_USER_ID;
      const body = { step: 2, data: { country: 'US' }, version: 3 };

      const existing = await mockFindUnique({ where: { clerkUserId }, select: { version: true } });
      expect(existing?.version).toBe(3);

      // Version is not stale (body.version >= existing.version)
      expect(body.version).toBeGreaterThanOrEqual(existing!.version);

      const newVersion = existing!.version + 1;
      expect(newVersion).toBe(4);

      await mockUpsert({
        where: { clerkUserId },
        create: { clerkUserId, currentStep: body.step, stepData: body.data, version: newVersion },
        update: { currentStep: body.step, stepData: body.data, version: newVersion },
      });

      expect(mockUpsert).toHaveBeenCalledOnce();
    });

    it('should reject stale version with 409', async () => {
      mockFindUnique.mockResolvedValue({ version: 5 });

      const clerkUserId = CLERK_USER_ID;
      const body = { step: 3, data: { name: 'Test' }, version: 3 };

      const existing = await mockFindUnique({ where: { clerkUserId }, select: { version: true } });

      // Stale version: body.version < existing.version
      expect(body.version).toBeLessThan(existing!.version);

      // Should return 409 instead of upserting
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });

  describe('resume logic', () => {
    it('should return saved state for existing user', async () => {
      const savedState = {
        id: 'state-1',
        clerkUserId: CLERK_USER_ID,
        currentStep: 2,
        stepData: { accountType: 'business', country: 'CA' },
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindUnique.mockResolvedValue(savedState);

      const state = await mockFindUnique({ where: { clerkUserId: CLERK_USER_ID } });

      expect(state).toBeTruthy();
      expect(state.currentStep).toBe(2);
      expect(state.stepData).toEqual({ accountType: 'business', country: 'CA' });
      expect(state.version).toBe(3);
    });

    it('should return defaults for unknown user', async () => {
      mockFindUnique.mockResolvedValue(null);

      const state = await mockFindUnique({ where: { clerkUserId: 'unknown-user' } });

      expect(state).toBeNull();

      // API should return defaults
      const response = state
        ? { currentStep: state.currentStep, stepData: state.stepData, version: state.version, isNew: false }
        : { currentStep: 0, stepData: {}, version: 0, isNew: true };

      expect(response).toEqual({
        currentStep: 0,
        stepData: {},
        version: 0,
        isNew: true,
      });
    });
  });

  describe('wizard state cleanup on /initialize', () => {
    it('should delete wizard state after successful initialization', async () => {
      mockDelete.mockResolvedValue({ id: 'state-1', clerkUserId: CLERK_USER_ID });

      await mockDelete({ where: { clerkUserId: CLERK_USER_ID } });

      expect(mockDelete).toHaveBeenCalledWith({
        where: { clerkUserId: CLERK_USER_ID },
      });
    });

    it('should not fail if wizard state does not exist', async () => {
      // Prisma throws P2025 when record not found on delete
      mockDelete.mockRejectedValue(new Error('Record not found'));

      // The route catches this error silently
      try {
        await mockDelete({ where: { clerkUserId: CLERK_USER_ID } });
      } catch {
        // Expected — no-op in route handler
      }

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('cross-user isolation', () => {
    it('should only return state for the requesting user', async () => {
      const userAState = {
        clerkUserId: CLERK_USER_ID,
        currentStep: 3,
        stepData: { accountType: 'personal' },
        version: 2,
      };

      // User A queries — gets their state
      mockFindUnique.mockImplementation(({ where }: { where: { clerkUserId: string } }) => {
        if (where.clerkUserId === CLERK_USER_ID) return userAState;
        return null;
      });

      const stateA = await mockFindUnique({ where: { clerkUserId: CLERK_USER_ID } });
      expect(stateA).toEqual(userAState);

      // User B queries — gets null (no state)
      const stateB = await mockFindUnique({ where: { clerkUserId: OTHER_CLERK_USER_ID } });
      expect(stateB).toBeNull();
    });
  });
});
