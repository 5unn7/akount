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
