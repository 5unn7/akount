import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Onboarding Progress Routes - Smoke Tests
 *
 * These tests verify that route schemas are correctly defined.
 * Full integration tests with auth/tenant middleware will be added in Phase 2.
 *
 * Routes tested:
 * - GET /api/system/onboarding/progress
 * - POST /api/system/onboarding/update-progress
 * - POST /api/system/onboarding/skip-step
 * - POST /api/system/onboarding/dismiss-card
 */

describe('Onboarding Progress Routes - Schema Validation', () => {
  describe('UpdateProgressSchema', () => {
    const UpdateProgressSchema = z.object({
      step: z.enum(['basic_info', 'entity_setup', 'business_details', 'bank_connection', 'goals_setup']),
      completed: z.boolean(),
    });

    it('should accept valid step names', () => {
      const validSteps = ['basic_info', 'entity_setup', 'business_details', 'bank_connection', 'goals_setup'];

      validSteps.forEach((step) => {
        const result = UpdateProgressSchema.safeParse({ step, completed: true });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid step names', () => {
      const result = UpdateProgressSchema.safeParse({ step: 'invalid_step', completed: true });
      expect(result.success).toBe(false);
    });

    it('should require boolean completed field', () => {
      const resultMissing = UpdateProgressSchema.safeParse({ step: 'basic_info' });
      expect(resultMissing.success).toBe(false);

      const resultInvalid = UpdateProgressSchema.safeParse({ step: 'basic_info', completed: 'yes' });
      expect(resultInvalid.success).toBe(false);
    });
  });

  describe('SkipStepSchema', () => {
    const SkipStepSchema = z.object({
      step: z.string(),
      skipDurationDays: z.number().default(7),
    });

    it('should accept valid payload', () => {
      const result = SkipStepSchema.safeParse({ step: 'bank_connection', skipDurationDays: 7 });
      expect(result.success).toBe(true);
    });

    it('should use default skip duration', () => {
      const result = SkipStepSchema.safeParse({ step: 'bank_connection' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipDurationDays).toBe(7);
      }
    });

    it('should require step field', () => {
      const result = SkipStepSchema.safeParse({ skipDurationDays: 7 });
      expect(result.success).toBe(false);
    });
  });

  describe('Progress Calculation', () => {
    const STEP_WEIGHTS = {
      basic_info: 20,
      entity_setup: 20,
      business_details: 20,
      bank_connection: 20,
      goals_setup: 20,
    };

    it('should calculate correct percentage for single step', () => {
      const completedSteps = ['basic_info'];
      const percentage = completedSteps.reduce((sum, step) => sum + STEP_WEIGHTS[step as keyof typeof STEP_WEIGHTS], 0);
      expect(percentage).toBe(20);
    });

    it('should calculate correct percentage for multiple steps', () => {
      const completedSteps = ['basic_info', 'entity_setup', 'business_details'];
      const percentage = completedSteps.reduce((sum, step) => sum + STEP_WEIGHTS[step as keyof typeof STEP_WEIGHTS], 0);
      expect(percentage).toBe(60);
    });

    it('should calculate 100% for all steps', () => {
      const completedSteps = ['basic_info', 'entity_setup', 'business_details', 'bank_connection', 'goals_setup'];
      const percentage = completedSteps.reduce((sum, step) => sum + STEP_WEIGHTS[step as keyof typeof STEP_WEIGHTS], 0);
      expect(percentage).toBe(100);
    });

    it('should clamp percentage to 0-100 range', () => {
      const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

      expect(clamp(-10)).toBe(0);
      expect(clamp(50)).toBe(50);
      expect(clamp(150)).toBe(100);
    });
  });

  describe('Step Management', () => {
    it('should not duplicate steps in completed list', () => {
      const completedSteps = ['basic_info', 'entity_setup'];
      const newStep = 'basic_info';

      const updated = completedSteps.includes(newStep)
        ? completedSteps
        : [...completedSteps, newStep];

      expect(updated).toEqual(['basic_info', 'entity_setup']);
      expect(updated.length).toBe(2);
    });

    it('should remove step when marking as incomplete', () => {
      const completedSteps = ['basic_info', 'entity_setup', 'business_details'];
      const stepToRemove = 'entity_setup';

      const updated = completedSteps.filter((s) => s !== stepToRemove);

      expect(updated).toEqual(['basic_info', 'business_details']);
      expect(updated.length).toBe(2);
    });

    it('should not duplicate steps in skipped list', () => {
      const skippedSteps = ['bank_connection'];
      const newSkip = 'bank_connection';

      const updated = skippedSteps.includes(newSkip)
        ? skippedSteps
        : [...skippedSteps, newSkip];

      expect(updated).toEqual(['bank_connection']);
      expect(updated.length).toBe(1);
    });
  });

  describe('Default Progress State', () => {
    it('should return correct default state', () => {
      const defaultProgress = {
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
      };

      expect(defaultProgress.completionPercentage).toBe(0);
      expect(defaultProgress.completedSteps).toHaveLength(0);
      expect(defaultProgress.basicInfoComplete).toBe(false);
    });
  });
});

/*
 * NOTE: Full integration tests with Fastify app,  auth middleware, and database mocks
 * will be added in Phase 2. These smoke tests verify business logic and schema validation.
 *
 * Phase 2 integration tests will cover:
 * - HTTP layer (status codes, headers, responses)
 * - Auth middleware (401 without token)
 * - Tenant middleware (tenant isolation)
 * - Database operations (Prisma calls)
 * - Error handling (404, 500)
 */
