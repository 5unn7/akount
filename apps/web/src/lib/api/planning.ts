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
