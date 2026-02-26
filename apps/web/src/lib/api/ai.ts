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

/**
 * AI insight (placeholder for future implementation)
 */
export interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

/**
 * AI recommendation (placeholder for future implementation)
 */
export interface AIRecommendation {
  id: string;
  action: string;
  description: string;
  impact: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * AI categorization rule suggestion (placeholder for future implementation)
 */
export interface AIRuleSuggestion {
  pattern: string;
  categoryId: string;
  categoryName: string;
  confidence: number;
  matchCount: number;
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

/**
 * Get AI-generated financial insights
 *
 * GET /api/ai/insights
 *
 * Note: Returns 501 (Not Implemented) - placeholder for future phase
 *
 * @returns Array of AI-generated insights
 */
export async function getInsights(): Promise<AIInsight[]> {
  return apiClient<AIInsight[]>('/api/ai/insights', {
    method: 'GET',
  });
}

/**
 * Get AI-generated action recommendations
 *
 * GET /api/ai/recommendations
 *
 * Note: Returns 501 (Not Implemented) - placeholder for future phase
 *
 * @returns Array of AI recommendations
 */
export async function getRecommendations(): Promise<AIRecommendation[]> {
  return apiClient<AIRecommendation[]>('/api/ai/recommendations', {
    method: 'GET',
  });
}

/**
 * Get AI-suggested categorization rules based on transaction patterns
 *
 * POST /api/ai/rules/suggest
 *
 * Note: Returns 501 (Not Implemented) - placeholder for future phase
 *
 * @returns Array of suggested categorization rules
 */
export async function suggestRules(): Promise<AIRuleSuggestion[]> {
  return apiClient<AIRuleSuggestion[]>('/api/ai/rules/suggest', {
    method: 'POST',
  });
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
