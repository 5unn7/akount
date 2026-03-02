import { apiClient } from './client';

/**
 * Planning API Client (SERVER-ONLY)
 *
 * Type-safe client functions for the Planning API.
 * Must only be called from Server Components, Server Actions, or Route Handlers.
 */

// ============================================================================
// Types — Goals
// ============================================================================

export type GoalType = 'REVENUE' | 'SAVINGS' | 'EXPENSE_REDUCTION' | 'CUSTOM';
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export interface Goal {
  id: string;
  entityId: string;
  name: string;
  type: GoalType;
  targetAmount: number; // Integer cents
  currentAmount: number; // Integer cents
  targetDate: string;
  status: GoalStatus;
  accountId: string | null;
  categoryId: string | null;
  glAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListGoalsParams {
  entityId: string;
  cursor?: string;
  limit?: number;
  status?: GoalStatus;
  type?: GoalType;
}

export interface ListGoalsResponse {
  goals: Goal[];
  nextCursor: string | null;
}

export interface CreateGoalInput {
  name: string;
  entityId: string;
  type: GoalType;
  targetAmount: number;
  targetDate: string;
  accountId?: string;
  categoryId?: string;
  glAccountId?: string;
}

export interface UpdateGoalInput {
  name?: string;
  type?: GoalType;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  accountId?: string | null;
  categoryId?: string | null;
  glAccountId?: string | null;
  status?: GoalStatus;
}

// ============================================================================
// Types — Budgets
// ============================================================================

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface Budget {
  id: string;
  entityId: string;
  name: string;
  categoryId: string | null;
  glAccountId: string | null;
  amount: number; // Integer cents
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
  glAccount?: { id: string; name: string; code: string } | null;
}

export interface ListBudgetsParams {
  entityId: string;
  cursor?: string;
  limit?: number;
  period?: BudgetPeriod;
  categoryId?: string;
}

export interface ListBudgetsResponse {
  budgets: Budget[];
  nextCursor: string | null;
}

export interface CreateBudgetInput {
  name: string;
  entityId: string;
  categoryId?: string;
  glAccountId?: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

export interface UpdateBudgetInput {
  name?: string;
  categoryId?: string | null;
  glAccountId?: string | null;
  amount?: number;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// API Functions — Goals
// ============================================================================

export async function listGoals(
  params: ListGoalsParams
): Promise<ListGoalsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('entityId', params.entityId);
  if (params.cursor) searchParams.append('cursor', params.cursor);
  if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
  if (params.status) searchParams.append('status', params.status);
  if (params.type) searchParams.append('type', params.type);

  return apiClient<ListGoalsResponse>(
    `/api/planning/goals?${searchParams.toString()}`
  );
}

export async function getGoal(id: string): Promise<Goal> {
  return apiClient<Goal>(`/api/planning/goals/${id}`);
}

export async function createGoal(data: CreateGoalInput): Promise<Goal> {
  return apiClient<Goal>('/api/planning/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGoal(
  id: string,
  data: UpdateGoalInput
): Promise<Goal> {
  return apiClient<Goal>(`/api/planning/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteGoal(id: string): Promise<void> {
  return apiClient<void>(`/api/planning/goals/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// API Functions — Goal Tracking
// ============================================================================

export async function trackGoals(
  entityId: string
): Promise<TrackGoalsResponse> {
  return apiClient<TrackGoalsResponse>('/api/planning/goals/track', {
    method: 'POST',
    body: JSON.stringify({ entityId }),
  });
}

export async function trackGoal(
  goalId: string
): Promise<TrackingResult> {
  return apiClient<TrackingResult>(`/api/planning/goals/${goalId}/track`, {
    method: 'POST',
  });
}

// ============================================================================
// API Functions — Budgets
// ============================================================================

export async function listBudgets(
  params: ListBudgetsParams
): Promise<ListBudgetsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('entityId', params.entityId);
  if (params.cursor) searchParams.append('cursor', params.cursor);
  if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
  if (params.period) searchParams.append('period', params.period);
  if (params.categoryId) searchParams.append('categoryId', params.categoryId);

  return apiClient<ListBudgetsResponse>(
    `/api/planning/budgets?${searchParams.toString()}`
  );
}

export async function getBudget(id: string): Promise<Budget> {
  return apiClient<Budget>(`/api/planning/budgets/${id}`);
}

export async function createBudget(data: CreateBudgetInput): Promise<Budget> {
  return apiClient<Budget>('/api/planning/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBudget(
  id: string,
  data: UpdateBudgetInput
): Promise<Budget> {
  return apiClient<Budget>(`/api/planning/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  return apiClient<void>(`/api/planning/budgets/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Types — Goal Tracking
// ============================================================================

export interface MilestoneEvent {
  goalId: string;
  goalName: string;
  threshold: number;
  currentPercent: number;
  currentAmount: number;
  targetAmount: number;
}

export interface TrackingResult {
  goalId: string;
  goalName: string;
  previousAmount: number;
  currentAmount: number;
  targetAmount: number;
  progressPercent: number;
  milestones: MilestoneEvent[];
  updated: boolean;
}

export interface TrackGoalsResponse {
  results: TrackingResult[];
}

// ============================================================================
// Types — Budget Variance
// ============================================================================

export type AlertLevel = 'ok' | 'warning' | 'over-budget';

export interface BudgetVariance {
  budgetId: string;
  budgetName: string;
  period: string;
  budgetedAmount: number; // Integer cents
  actualAmount: number; // Integer cents
  variance: number; // budgetedAmount - actualAmount
  variancePercent: number;
  utilizationPercent: number;
  alertLevel: AlertLevel;
  startDate: string;
  endDate: string;
  glAccountId: string | null;
  categoryId: string | null;
}

export interface BudgetVarianceDetail extends BudgetVariance {
  transactions: Array<{
    id: string;
    date: string;
    memo: string;
    debitAmount: number;
    creditAmount: number;
    glAccountName: string;
    entryNumber: string | null;
  }>;
}

export interface ListBudgetVariancesResponse {
  variances: BudgetVariance[];
}

// ============================================================================
// API Functions — Budget Variance
// ============================================================================

export async function listBudgetVariances(
  entityId: string
): Promise<ListBudgetVariancesResponse> {
  return apiClient<ListBudgetVariancesResponse>(
    `/api/planning/budgets/variance?entityId=${entityId}`
  );
}

export async function getBudgetVarianceDetail(
  budgetId: string
): Promise<BudgetVarianceDetail> {
  return apiClient<BudgetVarianceDetail>(
    `/api/planning/budgets/${budgetId}/variance`
  );
}

// ============================================================================
// Types — Forecasts
// ============================================================================

export type ForecastType = 'CASH_FLOW' | 'REVENUE' | 'EXPENSE';
export type ForecastScenario = 'BASELINE' | 'OPTIMISTIC' | 'PESSIMISTIC';

export interface ForecastDataPoint {
  month: string; // YYYY-MM
  amount: number; // Integer cents
}

export interface Forecast {
  id: string;
  entityId: string;
  name: string;
  type: ForecastType;
  scenario: ForecastScenario;
  periodStart: string;
  periodEnd: string;
  data: ForecastDataPoint[];
  assumptions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListForecastsParams {
  entityId: string;
  cursor?: string;
  limit?: number;
  type?: ForecastType;
  scenario?: ForecastScenario;
}

export interface ListForecastsResponse {
  forecasts: Forecast[];
  nextCursor: string | null;
}

export interface CreateForecastInput {
  name: string;
  entityId: string;
  type: ForecastType;
  scenario: ForecastScenario;
  periodStart: string;
  periodEnd: string;
  data: ForecastDataPoint[];
  assumptions?: Record<string, unknown>;
}

export interface UpdateForecastInput {
  name?: string;
  type?: ForecastType;
  scenario?: ForecastScenario;
  periodStart?: string;
  periodEnd?: string;
  data?: ForecastDataPoint[];
  assumptions?: Record<string, unknown> | null;
}

// ============================================================================
// Types — Cash Runway
// ============================================================================

export interface CashRunwayResult {
  cashBalance: number;
  monthlyBurnRate: number;
  monthlyRevenue: number;
  netBurnRate: number;
  runwayMonths: number;
  runwayDate: string | null;
  monthsAnalyzed: number;
}

// ============================================================================
// Types — Seasonal Patterns
// ============================================================================

export interface MonthlyDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface SeasonalAnalysis {
  monthlyData: MonthlyDataPoint[];
  averageRevenue: number;
  averageExpenses: number;
  highRevenueMonths: string[];
  lowRevenueMonths: string[];
  highExpenseMonths: string[];
  lowExpenseMonths: string[];
  seasonalityScore: number;
  monthsAnalyzed: number;
}

// ============================================================================
// API Functions — Forecasts
// ============================================================================

export async function listForecasts(
  params: ListForecastsParams
): Promise<ListForecastsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('entityId', params.entityId);
  if (params.cursor) searchParams.append('cursor', params.cursor);
  if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
  if (params.type) searchParams.append('type', params.type);
  if (params.scenario) searchParams.append('scenario', params.scenario);

  return apiClient<ListForecastsResponse>(
    `/api/planning/forecasts?${searchParams.toString()}`
  );
}

export async function getForecast(id: string): Promise<Forecast> {
  return apiClient<Forecast>(`/api/planning/forecasts/${id}`);
}

export async function createForecast(data: CreateForecastInput): Promise<Forecast> {
  return apiClient<Forecast>('/api/planning/forecasts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateForecast(
  id: string,
  data: UpdateForecastInput
): Promise<Forecast> {
  return apiClient<Forecast>(`/api/planning/forecasts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteForecast(id: string): Promise<void> {
  return apiClient<void>(`/api/planning/forecasts/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// API Functions — Cash Runway
// ============================================================================

export async function getCashRunway(entityId: string): Promise<CashRunwayResult> {
  return apiClient<CashRunwayResult>(
    `/api/planning/forecasts/runway?entityId=${entityId}`
  );
}

// ============================================================================
// API Functions — Seasonal Patterns
// ============================================================================

export async function getSeasonalPatterns(
  entityId: string,
  lookbackMonths?: number
): Promise<SeasonalAnalysis> {
  const searchParams = new URLSearchParams({ entityId });
  if (lookbackMonths) searchParams.append('lookbackMonths', String(lookbackMonths));

  return apiClient<SeasonalAnalysis>(
    `/api/planning/forecasts/seasonal?${searchParams.toString()}`
  );
}

// ============================================================================
// Types — AI Forecast
// ============================================================================

export interface ForecastProjection {
  month: string;
  amount: number;
  confidence: number;
  components: {
    trend: number;
    seasonal: number;
    base: number;
  };
}

export interface AIForecastResult {
  projections: ForecastProjection[];
  methodology: string;
  dataQuality: 'high' | 'medium' | 'low';
  monthsOfHistory: number;
}

// ============================================================================
// Types — Budget Suggestions
// ============================================================================

export interface BudgetSuggestion {
  categoryId: string | null;
  glAccountId: string | null;
  categoryName: string;
  averageMonthlySpend: number;
  suggestedAmount: number;
  monthsAnalyzed: number;
  minMonthly: number;
  maxMonthly: number;
}

// ============================================================================
// Types — Goal Templates
// ============================================================================

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  type: GoalType;
  suggestedTarget: number;
  suggestedMonths: number;
}

// ============================================================================
// API Functions — AI Forecast
// ============================================================================

export async function getAIForecast(
  entityId: string,
  forecastMonths?: number,
  type?: ForecastType
): Promise<AIForecastResult> {
  const searchParams = new URLSearchParams({ entityId });
  if (forecastMonths) searchParams.append('forecastMonths', String(forecastMonths));
  if (type) searchParams.append('type', type);

  return apiClient<AIForecastResult>(
    `/api/planning/forecasts/ai-forecast?${searchParams.toString()}`
  );
}

// ============================================================================
// API Functions — Budget Suggestions
// ============================================================================

export async function getBudgetSuggestions(
  entityId: string,
  lookbackMonths?: number
): Promise<{ suggestions: BudgetSuggestion[] }> {
  const searchParams = new URLSearchParams({ entityId });
  if (lookbackMonths) searchParams.append('lookbackMonths', String(lookbackMonths));

  return apiClient<{ suggestions: BudgetSuggestion[] }>(
    `/api/planning/budgets/suggestions?${searchParams.toString()}`
  );
}

// ============================================================================
// API Functions — Budget Rollover
// ============================================================================

export async function rolloverBudget(
  budgetId: string,
  carryUnusedAmount: boolean = true
): Promise<Budget> {
  return apiClient<Budget>(`/api/planning/budgets/${budgetId}/rollover`, {
    method: 'POST',
    body: JSON.stringify({ carryUnusedAmount }),
  });
}

// ============================================================================
// API Functions — Goal Templates
// ============================================================================

export async function listGoalTemplates(
  entityId: string
): Promise<{ templates: GoalTemplate[] }> {
  return apiClient<{ templates: GoalTemplate[] }>(
    `/api/planning/goals/templates?entityId=${entityId}`
  );
}
