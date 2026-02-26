import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '../ai.service';
import type { AIMessage, AIChatResponse } from '../types';

// Mock PerplexityProvider
const mockPerplexityChat = vi.fn();
vi.mock('../providers/perplexity.provider', () => ({
  PerplexityProvider: class {
    chat = mockPerplexityChat;
  },
}));

// Mock ClaudeProvider
const mockClaudeChat = vi.fn();
vi.mock('../providers/claude.provider', () => ({
  ClaudeProvider: class {
    chat = mockClaudeChat;
  },
}));

describe('AIService', () => {
  let originalPerplexityKey: string | undefined;
  let originalAnthropicKey: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalPerplexityKey = process.env.PERPLEXITY_API_KEY;
    originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalPerplexityKey) {
      process.env.PERPLEXITY_API_KEY = originalPerplexityKey;
    } else {
      delete process.env.PERPLEXITY_API_KEY;
    }
    if (originalAnthropicKey) {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  describe('constructor', () => {
    it('should initialize claude provider when ANTHROPIC_API_KEY present', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      delete process.env.PERPLEXITY_API_KEY;

      const service = new AIService();

      expect(service.isProviderAvailable('claude')).toBe(true);
      expect(service.getDefaultProviderName()).toBe('claude');
    });

    it('should initialize perplexity provider when API key present', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      delete process.env.ANTHROPIC_API_KEY;

      const service = new AIService();

      expect(service.isProviderAvailable('perplexity')).toBe(true);
    });

    it('should initialize both providers when both keys present', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PERPLEXITY_API_KEY = 'test-key';

      const service = new AIService();

      expect(service.isProviderAvailable('claude')).toBe(true);
      expect(service.isProviderAvailable('perplexity')).toBe(true);
      expect(service.getDefaultProviderName()).toBe('claude');
    });

    it('should not initialize perplexity when API key missing', () => {
      delete process.env.PERPLEXITY_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const service = new AIService();

      expect(service.isProviderAvailable('perplexity')).toBe(false);
    });

    it('should fall back to perplexity as default when claude key missing', () => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.PERPLEXITY_API_KEY = 'test-key';

      const service = new AIService();

      expect(service.getDefaultProviderName()).toBe('perplexity');
    });
  });

  describe('chat', () => {
    const mockMessages: AIMessage[] = [
      { role: 'user', content: 'Hello AI' },
    ];

    it('should call claude provider by default when available', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      const service = new AIService();

      const mockResponse: AIChatResponse = {
        content: 'Claude response',
        model: 'claude-sonnet-4-5-20250929',
      };
      mockClaudeChat.mockResolvedValueOnce(mockResponse);

      const result = await service.chat(mockMessages);

      expect(mockClaudeChat).toHaveBeenCalledWith(mockMessages, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should call perplexity when specified explicitly', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      const mockResponse: AIChatResponse = {
        content: 'Perplexity response',
        model: 'sonar',
      };
      mockPerplexityChat.mockResolvedValueOnce(mockResponse);

      const result = await service.chat(mockMessages, { provider: 'perplexity' });

      expect(mockPerplexityChat).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should use default provider when not specified', async () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      delete process.env.ANTHROPIC_API_KEY;
      const service = new AIService();

      const mockResponse: AIChatResponse = {
        content: 'Response',
        model: 'sonar',
      };
      mockPerplexityChat.mockResolvedValueOnce(mockResponse);

      await service.chat(mockMessages);

      expect(mockPerplexityChat).toHaveBeenCalled();
    });

    it('should throw error for unavailable provider', async () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      await expect(
        service.chat(mockMessages, { provider: 'gpt-4' })
      ).rejects.toThrow('AI Provider "gpt-4" not configured or unavailable.');
    });

    it('should throw error for non-existent provider', async () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      await expect(
        service.chat(mockMessages, { provider: 'fake-provider' })
      ).rejects.toThrow('AI Provider "fake-provider" not configured or unavailable.');
    });

    it('should pass options to provider', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      const service = new AIService();

      const mockResponse: AIChatResponse = {
        content: 'Response',
        model: 'claude-sonnet-4-5-20250929',
      };
      mockClaudeChat.mockResolvedValueOnce(mockResponse);

      const options = { temperature: 0.7, maxTokens: 1000 };
      await service.chat(mockMessages, options);

      expect(mockClaudeChat).toHaveBeenCalledWith(mockMessages, options);
    });

    it('should forward provider response with usage', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      const service = new AIService();

      const mockResponse: AIChatResponse = {
        content: 'Detailed AI response',
        model: 'claude-sonnet-4-5-20250929',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
      mockClaudeChat.mockResolvedValueOnce(mockResponse);

      const result = await service.chat(mockMessages);

      expect(result).toEqual(mockResponse);
      expect(result.usage).toBeDefined();
      expect(result.usage?.totalTokens).toBe(30);
    });

    it('should handle provider errors gracefully', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      const service = new AIService();

      mockClaudeChat.mockRejectedValueOnce(new Error('Provider API error'));

      await expect(service.chat(mockMessages)).rejects.toThrow('Provider API error');
    });
  });

  describe('getDefaultProviderName', () => {
    it('should return claude when anthropic key present', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      const service = new AIService();

      expect(service.getDefaultProviderName()).toBe('claude');
    });

    it('should return perplexity when only perplexity key present', () => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      expect(service.getDefaultProviderName()).toBe('perplexity');
    });

    it('should be consistent across calls', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      const service = new AIService();

      const first = service.getDefaultProviderName();
      const second = service.getDefaultProviderName();

      expect(first).toBe(second);
    });
  });

  describe('isProviderAvailable', () => {
    it('should return true for claude when ANTHROPIC_API_KEY present', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      const service = new AIService();

      expect(service.isProviderAvailable('claude')).toBe(true);
    });

    it('should return true for perplexity when API key present', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      expect(service.isProviderAvailable('perplexity')).toBe(true);
    });

    it('should return false for unconfigured provider', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      expect(service.isProviderAvailable('gpt-4')).toBe(false);
    });

    it('should return false for null provider name', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      expect(service.isProviderAvailable(null as never)).toBe(false);
    });

    it('should return false for empty string provider', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      expect(service.isProviderAvailable('')).toBe(false);
    });

    it('should return false for perplexity when API key missing', () => {
      delete process.env.PERPLEXITY_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const service = new AIService();

      expect(service.isProviderAvailable('perplexity')).toBe(false);
    });

    it('should return false for claude when ANTHROPIC_API_KEY missing', () => {
      delete process.env.ANTHROPIC_API_KEY;
      const service = new AIService();

      expect(service.isProviderAvailable('claude')).toBe(false);
    });
  });
});
