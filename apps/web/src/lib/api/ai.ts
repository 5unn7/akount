import { apiClient } from './client';

/**
 * AI API Client
 *
 * Client functions for AI-powered features: chat, categorization, insights, and recommendations.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * AI message role
 */
export type AIMessageRole = 'system' | 'user' | 'assistant';

/**
 * AI chat message
 */
export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

/**
 * AI chat options
 */
export interface AIChatOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * AI chat response
 */
export interface AIChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Category suggestion from AI
 */
export interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number; // 0-100
  matchReason: string;
}

// ============================================================================
// Insight Types (matches backend insight.types.ts)
// ============================================================================

export type InsightType =
  | 'cash_flow_warning'
  | 'spending_anomaly'
  | 'duplicate_expense'
  | 'overdue_alert'
  | 'tax_estimate'
  | 'revenue_trend'
  | 'reconciliation_gap';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type InsightStatus = 'active' | 'dismissed' | 'snoozed' | 'resolved' | 'expired';

export interface AIInsight {
  id: string;
  entityId: string;
  triggerId: string;
  title: string;
  description: string;
  type: InsightType;
  priority: InsightPriority;
  impact: number | null;
  confidence: number | null;
  actionable: boolean;
  status: InsightStatus;
  deadline: string | null;
  dismissedAt: string | null;
  dismissedBy: string | null;
  snoozedUntil: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsightListResponse {
  insights: AIInsight[];
  nextCursor: string | undefined;
  hasMore: boolean;
}

export interface InsightCounts {
  total: number;
  byPriority: Record<InsightPriority, number>;
  byType: Record<InsightType, number>;
}

export interface InsightGenerationSummary {
  generated: number;
  skipped: number;
  errors: number;
}

// ============================================================================
// Monthly Close Types
// ============================================================================

export type ChecklistStatus = 'pass' | 'fail' | 'warn';

export interface ChecklistItem {
  label: string;
  status: ChecklistStatus;
  count: number;
  details: string;
  weight: number;
}

export interface CloseReadinessReport {
  periodId: string;
  periodName: string;
  score: number;
  canClose: boolean;
  items: ChecklistItem[];
  generatedAt: string;
}

export interface CloseHistoryItem {
  id: string;
  recordId: string;
  action: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  userId: string;
  createdAt: string;
}

export interface CloseHistoryResponse {
  items: CloseHistoryItem[];
  nextCursor: string | undefined;
  hasMore: boolean;
}

// ============================================================================
// AI Action Types
// ============================================================================

export type AIActionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'EXPIRED';
export type AIActionType = 'CATEGORIZATION' | 'JE_DRAFT' | 'RULE_SUGGESTION' | 'ALERT';
export type AIActionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AIAction {
  id: string;
  entityId: string;
  type: AIActionType;
  title: string;
  description: string | null;
  status: AIActionStatus;
  confidence: number;
  priority: AIActionPriority;
  payload: Record<string, unknown>;
  aiProvider: string;
  aiModel: string | null;
  metadata: Record<string, unknown> | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIActionListResponse {
  actions: AIAction[];
  total: number;
}

export interface AIActionStats {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  pendingByType: Record<string, number>;
}

export interface AIActionBatchResult {
  succeeded: string[];
  failed: Array<{ id: string; reason: string }>;
}

// ============================================================================
// Request/Response Interfaces
// ============================================================================

/**
 * Request body for POST /api/ai/chat
 */
export interface ChatRequest {
  messages: AIMessage[];
  options?: AIChatOptions;
}

/**
 * Request body for POST /api/ai/categorize
 */
export interface CategorizeRequest {
  description: string;
  amount: number; // Integer cents
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Chat with AI assistant
 *
 * POST /api/ai/chat
 *
 * @param request - Chat request with messages and options
 * @returns AI chat response with generated content
 */
export async function chatWithAI(
  request: ChatRequest
): Promise<AIChatResponse> {
  return apiClient<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Categorize a transaction using AI
 *
 * POST /api/ai/categorize
 *
 * @param description - Transaction description
 * @param amount - Transaction amount in cents (integer)
 * @returns Category suggestion with confidence score
 */
export async function categorizeTransaction(
  description: string,
  amount: number
): Promise<CategorySuggestion> {
  return apiClient<CategorySuggestion>('/api/ai/categorize', {
    method: 'POST',
    body: JSON.stringify({ description, amount }),
  });
}

// ============================================================================
// Insight API Functions
// ============================================================================

/**
 * List insights with optional filters and cursor pagination.
 *
 * GET /api/ai/insights
 */
export async function listInsights(params: {
  entityId: string;
  type?: InsightType;
  priority?: InsightPriority;
  status?: InsightStatus;
  cursor?: string;
  limit?: number;
}): Promise<InsightListResponse> {
  const sp = new URLSearchParams({ entityId: params.entityId });
  if (params.type) sp.set('type', params.type);
  if (params.priority) sp.set('priority', params.priority);
  if (params.status) sp.set('status', params.status);
  if (params.cursor) sp.set('cursor', params.cursor);
  if (params.limit) sp.set('limit', String(params.limit));

  return apiClient<InsightListResponse>(`/api/ai/insights?${sp.toString()}`);
}

/**
 * Dismiss an insight.
 *
 * POST /api/ai/insights/:id/dismiss
 */
export async function dismissInsight(id: string): Promise<AIInsight> {
  return apiClient<AIInsight>(`/api/ai/insights/${id}/dismiss`, {
    method: 'POST',
  });
}

/**
 * Snooze an insight until a given date.
 *
 * POST /api/ai/insights/:id/snooze
 */
export async function snoozeInsight(id: string, snoozedUntil: string): Promise<AIInsight> {
  return apiClient<AIInsight>(`/api/ai/insights/${id}/snooze`, {
    method: 'POST',
    body: JSON.stringify({ snoozedUntil }),
  });
}

/**
 * Trigger insight generation for an entity.
 *
 * POST /api/ai/insights/generate
 */
export async function generateInsights(
  entityId: string,
  types?: InsightType[],
): Promise<InsightGenerationSummary> {
  return apiClient<InsightGenerationSummary>('/api/ai/insights/generate', {
    method: 'POST',
    body: JSON.stringify({ entityId, ...(types && { types }) }),
  });
}

/**
 * Get insight counts by priority and type (for dashboard widget).
 *
 * GET /api/ai/insights/counts
 */
export async function getInsightCounts(entityId: string): Promise<InsightCounts> {
  return apiClient<InsightCounts>(
    `/api/ai/insights/counts?entityId=${encodeURIComponent(entityId)}`,
  );
}

// ============================================================================
// Monthly Close API Functions
// ============================================================================

/**
 * Get close readiness report for a fiscal period.
 *
 * GET /api/ai/monthly-close/readiness
 */
export async function getCloseReadiness(
  entityId: string,
  periodId: string,
): Promise<CloseReadinessReport> {
  const sp = new URLSearchParams({ entityId, periodId });
  return apiClient<CloseReadinessReport>(`/api/ai/monthly-close/readiness?${sp.toString()}`);
}

/**
 * Execute monthly close (lock + close period).
 *
 * POST /api/ai/monthly-close/execute
 */
export async function executeClose(
  entityId: string,
  periodId: string,
): Promise<{ success: true; periodId: string; periodName: string }> {
  return apiClient<{ success: true; periodId: string; periodName: string }>(
    '/api/ai/monthly-close/execute',
    {
      method: 'POST',
      body: JSON.stringify({ entityId, periodId }),
    },
  );
}

/**
 * Get monthly close history.
 *
 * GET /api/ai/monthly-close/history
 */
export async function getCloseHistory(params: {
  entityId: string;
  take?: number;
  cursor?: string;
}): Promise<CloseHistoryResponse> {
  const sp = new URLSearchParams({ entityId: params.entityId });
  if (params.take) sp.set('take', String(params.take));
  if (params.cursor) sp.set('cursor', params.cursor);

  return apiClient<CloseHistoryResponse>(`/api/ai/monthly-close/history?${sp.toString()}`);
}

// ============================================================================
// AI Action API Functions
// ============================================================================

/**
 * List AI actions with optional filters
 *
 * GET /api/ai/actions
 */
export async function listAIActions(params: {
  entityId: string;
  status?: AIActionStatus;
  type?: AIActionType;
  limit?: number;
  offset?: number;
}): Promise<AIActionListResponse> {
  const searchParams = new URLSearchParams({ entityId: params.entityId });
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  return apiClient<AIActionListResponse>(
    `/api/ai/actions?${searchParams.toString()}`
  );
}

/**
 * Get AI action dashboard stats
 *
 * GET /api/ai/actions/stats
 */
export async function getAIActionStats(entityId: string): Promise<AIActionStats> {
  return apiClient<AIActionStats>(
    `/api/ai/actions/stats?entityId=${encodeURIComponent(entityId)}`
  );
}

/**
 * Approve a single AI action
 *
 * POST /api/ai/actions/:actionId/approve
 */
export async function approveAIAction(
  actionId: string,
  entityId: string
): Promise<AIAction> {
  return apiClient<AIAction>(`/api/ai/actions/${actionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ entityId }),
  });
}

/**
 * Reject a single AI action
 *
 * POST /api/ai/actions/:actionId/reject
 */
export async function rejectAIAction(
  actionId: string,
  entityId: string
): Promise<AIAction> {
  return apiClient<AIAction>(`/api/ai/actions/${actionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ entityId }),
  });
}

/**
 * Batch approve AI actions
 *
 * POST /api/ai/actions/batch/approve
 */
export async function batchApproveAIActions(
  entityId: string,
  actionIds: string[]
): Promise<AIActionBatchResult> {
  return apiClient<AIActionBatchResult>('/api/ai/actions/batch/approve', {
    method: 'POST',
    body: JSON.stringify({ entityId, actionIds }),
  });
}

/**
 * Batch reject AI actions
 *
 * POST /api/ai/actions/batch/reject
 */
export async function batchRejectAIActions(
  entityId: string,
  actionIds: string[]
): Promise<AIActionBatchResult> {
  return apiClient<AIActionBatchResult>('/api/ai/actions/batch/reject', {
    method: 'POST',
    body: JSON.stringify({ entityId, actionIds }),
  });
}
