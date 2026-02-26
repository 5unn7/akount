// AI Auto-Bookkeeper Phase 3: Insight Zod Schemas
import { z } from 'zod';
import {
  INSIGHT_TYPES,
  INSIGHT_PRIORITIES,
  INSIGHT_STATUSES,
} from '../types/insight.types.js';

// List insights with filters + cursor pagination
export const ListInsightsSchema = z.object({
  entityId: z.string().cuid(),
  type: z.enum(INSIGHT_TYPES).optional(),
  priority: z.enum(INSIGHT_PRIORITIES).optional(),
  status: z.enum(INSIGHT_STATUSES).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListInsightsInput = z.infer<typeof ListInsightsSchema>;

// Dismiss an insight
export const DismissInsightSchema = z.object({
  id: z.string().cuid(),
});

export type DismissInsightInput = z.infer<typeof DismissInsightSchema>;

// Snooze an insight with date
export const SnoozeInsightSchema = z.object({
  id: z.string().cuid(),
  snoozedUntil: z.coerce.date().refine(
    (date) => date > new Date(),
    'Snooze date must be in the future'
  ),
});

export type SnoozeInsightInput = z.infer<typeof SnoozeInsightSchema>;

// Generate insights (trigger analyzers)
export const GenerateInsightsSchema = z.object({
  entityId: z.string().cuid(),
  types: z.array(z.enum(INSIGHT_TYPES)).optional(), // Optional filter to specific types
});

export type GenerateInsightsInput = z.infer<typeof GenerateInsightsSchema>;

// Get insight counts (dashboard widget)
export const GetInsightCountsSchema = z.object({
  entityId: z.string().cuid(),
});

export type GetInsightCountsInput = z.infer<typeof GetInsightCountsSchema>;
