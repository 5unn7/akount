import { z } from 'zod';

export const ForecastTypeEnum = z.enum(['CASH_FLOW', 'REVENUE', 'EXPENSE']);
export const ForecastScenarioEnum = z.enum(['BASELINE', 'OPTIMISTIC', 'PESSIMISTIC']);

const DataPointSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM format'),
  amount: z.number().int('Amount must be integer cents'),
});

export const CreateForecastSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  entityId: z.string().cuid('Invalid entity ID'),
  type: ForecastTypeEnum,
  scenario: ForecastScenarioEnum,
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  data: z.array(DataPointSchema).min(1, 'At least one data point required'),
  assumptions: z.record(z.unknown()).optional(),
}).refine(
  (d) => d.periodEnd > d.periodStart,
  { message: 'End date must be after start date', path: ['periodEnd'] }
);

export const UpdateForecastSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: ForecastTypeEnum.optional(),
  scenario: ForecastScenarioEnum.optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  data: z.array(DataPointSchema).min(1).optional(),
  assumptions: z.record(z.unknown()).nullable().optional(),
});

export const ListForecastsQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: ForecastTypeEnum.optional(),
  scenario: ForecastScenarioEnum.optional(),
});

export const ForecastIdParamSchema = z.object({
  id: z.string().cuid('Invalid forecast ID'),
});

export const ForecastAnalyticsQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  lookbackMonths: z.coerce.number().int().min(3).max(36).optional(),
});

export const AIForecastQuerySchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  forecastMonths: z.coerce.number().int().min(1).max(24).optional(),
  type: ForecastTypeEnum.optional(),
});

export type CreateForecastInput = z.infer<typeof CreateForecastSchema>;
export type UpdateForecastInput = z.infer<typeof UpdateForecastSchema>;
export type ListForecastsQuery = z.infer<typeof ListForecastsQuerySchema>;
export type ForecastIdParam = z.infer<typeof ForecastIdParamSchema>;
export type ForecastAnalyticsQuery = z.infer<typeof ForecastAnalyticsQuerySchema>;
export type AIForecastQuery = z.infer<typeof AIForecastQuerySchema>;
