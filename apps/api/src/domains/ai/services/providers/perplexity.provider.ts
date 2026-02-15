import OpenAI from 'openai';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResponse } from '../types';
import { logger } from '../../../../lib/logger';

export class PerplexityProvider implements AIProvider {
  readonly name = 'perplexity';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
    });
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const model = options?.model || 'sonar';

    // Combine system prompt with messages if provided
    const chatMessages = [...messages];
    if (options?.systemPrompt) {
      chatMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: chatMessages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No choice returned from Perplexity API');
      }

      return {
        content: choice.message.content || '',
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error: unknown) {
      logger.error({ err: error }, 'Perplexity API Error');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Perplexity API Error: ${message}`);
    }
  }
}
