import { z } from 'zod';

// ============================================================================
// Params
// ============================================================================

export const CalendarParamsSchema = z.object({
    id: z.string().cuid('Invalid fiscal calendar ID'),
});
export type CalendarParams = z.infer<typeof CalendarParamsSchema>;

export const PeriodParamsSchema = z.object({
    id: z.string().cuid('Invalid fiscal period ID'),
});
export type PeriodParams = z.infer<typeof PeriodParamsSchema>;

// ============================================================================
// Create Calendar (auto-generates 12 monthly periods)
// ============================================================================

export const CreateCalendarSchema = z.object({
    entityId: z.string().cuid('Invalid entity ID'),
    year: z.number().int().min(2000).max(2100),
    startMonth: z.number().int().min(1).max(12).default(1),
});
export type CreateCalendarInput = z.infer<typeof CreateCalendarSchema>;

// ============================================================================
// List Calendars
// ============================================================================

export const ListCalendarsSchema = z.object({
    entityId: z.string().cuid('Invalid entity ID'),
});
export type ListCalendarsQuery = z.infer<typeof ListCalendarsSchema>;

// ============================================================================
// Period Actions (Lock, Close, Reopen) — no body required
// ============================================================================
// These actions use the period ID from params only.
// Included as empty schemas for consistency with validation middleware.

export const LockPeriodSchema = z.object({}).optional();
export type LockPeriodInput = z.infer<typeof LockPeriodSchema>;

export const ClosePeriodSchema = z.object({}).optional();
export type ClosePeriodInput = z.infer<typeof ClosePeriodSchema>;

export const ReopenPeriodSchema = z.object({}).optional();
export type ReopenPeriodInput = z.infer<typeof ReopenPeriodSchema>;
