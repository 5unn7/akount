/**
 * Shared AI Types
 *
 * Provider-agnostic interfaces for AI chat services.
 * Used by both API (provider implementations) and frontend (chat UI).
 */

export type AIMessageRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse>;
}
