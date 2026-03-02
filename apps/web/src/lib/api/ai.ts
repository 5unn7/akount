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
// Rule Types (matches backend rule.service.ts)
// ============================================================================

export type RuleSource = 'USER_MANUAL' | 'AI_SUGGESTED' | 'PATTERN_DETECTED' | 'CORRECTION_LEARNED';

export interface RuleCondition {
  field: 'description' | 'amount' | 'accountId';
  op: 'contains' | 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: string | number;
}

export interface RuleConditions {
  operator: 'AND' | 'OR';
  conditions: RuleCondition[];
}

export interface RuleAction {
  setCategoryId?: string;
  setGLAccountId?: string;
  flagForReview?: boolean;
}

export interface AIRule {
  id: string;
  entityId: string;
  name: string;
  conditions: RuleConditions;
  action: RuleAction;
  isActive: boolean;
  source: RuleSource;
  executionCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleListResponse {
  rules: AIRule[];
  nextCursor: string | null;
}

export interface RuleStats {
  total: number;
  active: number;
  inactive: number;
  topRules: Array<{
    id: string;
    name: string;
    executionCount: number;
    successRate: number;
  }>;
}

// ============================================================================
// Rule Suggestion Types (matches backend rule-suggestion.service.ts)
// ============================================================================

export type RuleSuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface RuleSuggestion {
  id: string;
  entityId: string;
  triggeredBy: string;
  suggestedRule: {
    name: string;
    conditions: RuleConditions;
    action: RuleAction;
    patternSummary: string;
    exampleTransactions: Array<{ id: string; description: string; amount: number }>;
    estimatedImpact: number;
  };
  aiReasoning: string;
  aiConfidence: number;
  aiModelVersion: string;
  status: RuleSuggestionStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface RuleSuggestionListResponse {
  suggestions: RuleSuggestion[];
  nextCursor: string | undefined;
  hasMore: boolean;
}

export interface DetectedPattern {
  keyword: string;
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  patternStrength: number;
  exampleTransactions: Array<{ id: string; description: string; amount: number }>;
  suggestedConditions: RuleConditions;
  suggestedAction: RuleAction;
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

// ============================================================================
// Rule API Functions
// ============================================================================

/**
 * List rules with optional filters and cursor pagination.
 *
 * GET /api/ai/rules
 */
export async function listRules(params: {
  entityId: string;
  isActive?: boolean;
  source?: RuleSource;
  search?: string;
  take?: number;
  cursor?: string;
}): Promise<RuleListResponse> {
  const sp = new URLSearchParams({ entityId: params.entityId });
  if (params.isActive !== undefined) sp.set('isActive', String(params.isActive));
  if (params.source) sp.set('source', params.source);
  if (params.search) sp.set('search', params.search);
  if (params.take) sp.set('take', String(params.take));
  if (params.cursor) sp.set('cursor', params.cursor);

  return apiClient<RuleListResponse>(`/api/ai/rules?${sp.toString()}`);
}

/**
 * Get a single rule by ID.
 *
 * GET /api/ai/rules/:id
 */
export async function getRule(id: string): Promise<AIRule> {
  return apiClient<AIRule>(`/api/ai/rules/${id}`);
}

/**
 * Create a new rule.
 *
 * POST /api/ai/rules
 */
export async function createRule(data: {
  entityId: string;
  name: string;
  conditions: RuleConditions;
  action: RuleAction;
  isActive?: boolean;
}): Promise<AIRule> {
  return apiClient<AIRule>('/api/ai/rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a rule.
 *
 * PATCH /api/ai/rules/:id
 */
export async function updateRule(
  id: string,
  data: {
    name?: string;
    conditions?: RuleConditions;
    action?: RuleAction;
    isActive?: boolean;
  }
): Promise<AIRule> {
  return apiClient<AIRule>(`/api/ai/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a rule.
 *
 * DELETE /api/ai/rules/:id
 */
export async function deleteRule(id: string): Promise<void> {
  await apiClient<void>(`/api/ai/rules/${id}`, { method: 'DELETE' });
}

/**
 * Toggle a rule's active state.
 *
 * POST /api/ai/rules/:id/toggle
 */
export async function toggleRule(id: string): Promise<AIRule> {
  return apiClient<AIRule>(`/api/ai/rules/${id}/toggle`, { method: 'POST' });
}

/**
 * Get rule statistics.
 *
 * GET /api/ai/rules/stats
 */
export async function getRuleStats(entityId: string): Promise<RuleStats> {
  return apiClient<RuleStats>(
    `/api/ai/rules/stats?entityId=${encodeURIComponent(entityId)}`
  );
}

// ============================================================================
// Rule Suggestion API Functions
// ============================================================================

/**
 * List rule suggestions with optional filters.
 *
 * GET /api/ai/suggestions
 */
export async function listRuleSuggestions(params: {
  entityId: string;
  status?: RuleSuggestionStatus;
  cursor?: string;
  limit?: number;
}): Promise<RuleSuggestionListResponse> {
  const sp = new URLSearchParams({ entityId: params.entityId });
  if (params.status) sp.set('status', params.status);
  if (params.cursor) sp.set('cursor', params.cursor);
  if (params.limit) sp.set('limit', String(params.limit));

  return apiClient<RuleSuggestionListResponse>(`/api/ai/suggestions?${sp.toString()}`);
}

/**
 * Get a single rule suggestion.
 *
 * GET /api/ai/suggestions/:id
 */
export async function getRuleSuggestion(id: string): Promise<RuleSuggestion> {
  return apiClient<RuleSuggestion>(`/api/ai/suggestions/${id}`);
}

/**
 * Approve a rule suggestion (creates active Rule).
 *
 * POST /api/ai/suggestions/:id/approve
 */
export async function approveRuleSuggestion(
  id: string
): Promise<{ approved: true; ruleId: string }> {
  return apiClient<{ approved: true; ruleId: string }>(
    `/api/ai/suggestions/${id}/approve`,
    { method: 'POST' }
  );
}

/**
 * Reject a rule suggestion.
 *
 * POST /api/ai/suggestions/:id/reject
 */
export async function rejectRuleSuggestion(
  id: string,
  reason?: string
): Promise<void> {
  await apiClient<void>(`/api/ai/suggestions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Detect patterns on-demand.
 *
 * GET /api/ai/suggestions/patterns
 */
export async function detectPatterns(
  entityId: string
): Promise<{ patterns: DetectedPattern[]; count: number }> {
  return apiClient<{ patterns: DetectedPattern[]; count: number }>(
    `/api/ai/suggestions/patterns?entityId=${encodeURIComponent(entityId)}`
  );
}

/**
 * Expire stale suggestions (older than 30 days).
 *
 * POST /api/ai/suggestions/expire
 */
export async function expireRuleSuggestions(
  entityId: string
): Promise<{ expiredCount: number }> {
  return apiClient<{ expiredCount: number }>('/api/ai/suggestions/expire', {
    method: 'POST',
    body: JSON.stringify({ entityId }),
  });
}
