import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '../ai.service';
import type { AIMessage, AIChatResponse } from '../types';

// Mock PerplexityProvider
const mockChat = vi.fn();

vi.mock('../providers/perplexity.provider', () => {
  return {
    PerplexityProvider: class {
      chat = mockChat;
    },
  };
});

describe('AIService', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env.PERPLEXITY_API_KEY;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.PERPLEXITY_API_KEY = originalEnv;
    } else {
      delete process.env.PERPLEXITY_API_KEY;
    }
  });

  describe('constructor', () => {
    it('should initialize perplexity provider when API key present', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';

      const service = new AIService();

      expect(service.isProviderAvailable('perplexity')).toBe(true);
    });

    it('should not initialize perplexity when API key missing', () => {
      delete process.env.PERPLEXITY_API_KEY;

      const service = new AIService();

      expect(service.isProviderAvailable('perplexity')).toBe(false);
    });
  });

  describe('chat', () => {
    let service: AIService;
    const mockMessages: AIMessage[] = [
      { role: 'user', content: 'Hello AI' },
    ];

    beforeEach(() => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      service = new AIService();
    });

    it('should call provider chat with messages', async () => {
      const mockResponse: AIChatResponse = {
        content: 'AI response',
        citations: [],
      };

      mockChat.mockResolvedValueOnce(mockResponse);

      const result = await service.chat(mockMessages);

      expect(mockChat).toHaveBeenCalledWith(mockMessages, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should use default provider when not specified', async () => {
      const mockResponse: AIChatResponse = {
        content: 'Response',
        citations: [],
      };

      mockChat.mockResolvedValueOnce(mockResponse);

      await service.chat(mockMessages);

      expect(mockChat).toHaveBeenCalled();
    });

    it('should use specified provider when provided', async () => {
      const mockResponse: AIChatResponse = {
        content: 'Response',
        citations: [],
      };

      mockChat.mockResolvedValueOnce(mockResponse);

      await service.chat(mockMessages, { provider: 'perplexity' });

      expect(mockChat).toHaveBeenCalled();
    });

    it('should throw error for unavailable provider', async () => {
      await expect(
        service.chat(mockMessages, { provider: 'gpt-4' })
      ).rejects.toThrow('AI Provider "gpt-4" not configured or unavailable.');
    });

    it('should throw error for non-existent provider', async () => {
      await expect(
        service.chat(mockMessages, { provider: 'fake-provider' })
      ).rejects.toThrow('AI Provider "fake-provider" not configured or unavailable.');
    });

    it('should pass options to provider', async () => {
      const mockResponse: AIChatResponse = {
        content: 'Response',
        citations: [],
      };

      mockChat.mockResolvedValueOnce(mockResponse);

      const options = {
        temperature: 0.7,
        maxTokens: 1000,
      };

      await service.chat(mockMessages, options);

      expect(mockChat).toHaveBeenCalledWith(mockMessages, options);
    });

    it('should forward provider response', async () => {
      const mockResponse: AIChatResponse = {
        content: 'Detailed AI response',
        citations: [
          { url: 'https://example.com', title: 'Example', text: 'Source text' },
        ],
      };

      mockChat.mockResolvedValueOnce(mockResponse);

      const result = await service.chat(mockMessages);

      expect(result).toEqual(mockResponse);
      expect(result.citations).toHaveLength(1);
    });

    it('should handle provider errors gracefully', async () => {
      mockChat.mockRejectedValueOnce(new Error('Provider API error'));

      await expect(service.chat(mockMessages)).rejects.toThrow('Provider API error');
    });
  });

  describe('getDefaultProviderName', () => {
    it('should return perplexity as default', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      expect(service.getDefaultProviderName()).toBe('perplexity');
    });

    it('should be consistent across calls', () => {
      process.env.PERPLEXITY_API_KEY = 'test-key';
      const service = new AIService();

      const first = service.getDefaultProviderName();
      const second = service.getDefaultProviderName();

      expect(first).toBe(second);
      expect(first).toBe('perplexity');
    });
  });

  describe('isProviderAvailable', () => {
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
      const service = new AIService();

      expect(service.isProviderAvailable('perplexity')).toBe(false);
    });
  });
});
