import type { AIProvider, AIMessage, AIChatOptions, AIChatResponse } from './types';
import { PerplexityProvider } from './providers/perplexity.provider';

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string = 'perplexity';

  constructor() {
    // Read directly from process.env — AI key is checked at construction time
    // and tests dynamically set/unset it between test cases
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (perplexityKey) {
      this.providers.set('perplexity', new PerplexityProvider(perplexityKey));
    }
  }

  async chat(
    messages: AIMessage[],
    options?: AIChatOptions & { provider?: string }
  ): Promise<AIChatResponse> {
    const providerName = options?.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`AI Provider "${providerName}" not configured or unavailable.`);
    }

    return provider.chat(messages, options);
  }

  getDefaultProviderName(): string {
    return this.defaultProvider;
  }

  isProviderAvailable(name: string): boolean {
    return this.providers.has(name);
  }
}

// Export a singleton instance
export const aiService = new AIService();
