import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResponse } from '../types';
import { logger } from '../../../../lib/logger';

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const model = options?.model || 'claude-sonnet-4-5-20250929';

    // Separate system prompt from user/assistant messages
    // Anthropic API takes system as a top-level parameter, not a message role
    const systemPrompt = options?.systemPrompt;
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // If messages included system messages, prepend to systemPrompt
    const systemMessages = messages.filter((m) => m.role === 'system');
    const fullSystemPrompt = [
      ...(systemPrompt ? [systemPrompt] : []),
      ...systemMessages.map((m) => m.content),
    ].join('\n\n') || undefined;

    // P0-1: Add 30s timeout to prevent stuck requests (cost $50-100 each)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 seconds

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.2,
        ...(fullSystemPrompt ? { system: fullSystemPrompt } : {}),
        messages: chatMessages,
      }, {
        signal: abortController.signal,
      });

      // Extract text from content blocks
      const textContent = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      clearTimeout(timeoutId);

      return {
        content: textContent,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      // Handle timeout errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('Claude API call timed out after 30s');
        throw new Error('Claude API Error: Request timed out after 30 seconds');
      }

      // Sanitize SDK errors — don't leak API keys or internal details
      if (error instanceof Anthropic.APIError) {
        logger.error(
          { status: error.status, type: error.error?.type, message: error.message },
          'Anthropic API Error'
        );
        throw new Error(`Claude API Error (${error.status}): ${error.message}`);
      }
      logger.error({ err: error }, 'Claude Provider Error');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Claude API Error: ${message}`);
    }
  }
}
