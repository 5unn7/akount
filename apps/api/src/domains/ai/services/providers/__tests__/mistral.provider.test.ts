import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { MistralProvider } from '../mistral.provider';
import type { AIMessage } from '../../types';

// Create mock complete function
const mockComplete = vi.fn();

// Mock Mistral SDK with proper class constructor
vi.mock('@mistralai/mistralai', () => {
  return {
    Mistral: class MockMistral {
      chat = {
        complete: mockComplete,
      };
      constructor(_config: { apiKey: string }) {
        // Mock constructor
      }
    },
  };
});

// Mock logger
vi.mock('../../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('MistralProvider', () => {
  let provider: MistralProvider;

  function resetProvider() {
    provider = new MistralProvider('test-api-key');
    provider.resetCircuitBreaker(); // Reset circuit breaker state
  }

  beforeEach(() => {
    vi.clearAllMocks();
    resetProvider();
  });

  describe('instantiation', () => {
    it('should create provider with name "mistral"', () => {
      expect(provider.name).toBe('mistral');
    });

    it('should initialize Mistral client with API key', () => {
      expect(provider).toBeDefined();
      expect((provider as any).client).toBeDefined();
    });
  });

  describe('chat - basic text', () => {
    it('should send text prompt and receive response', async () => {
      const mockResponse = {
        model: 'mistral-large-latest',
        choices: [
          {
            message: {
              content: 'Hello, I am Mistral AI',
            },
          },
        ],
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      };

      mockComplete.mockResolvedValueOnce(mockResponse);

      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const response = await provider.chat(messages);

      expect(response.content).toBe('Hello, I am Mistral AI');
      expect(response.model).toBe('mistral-large-latest');
      expect(response.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });

      expect(mockComplete).toHaveBeenCalledWith({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.2,
        maxTokens: 1024,
      });
    });

    it('should use custom model if provided', async () => {
      mockComplete.mockResolvedValueOnce({
        model: 'mistral-small-latest',
        choices: [{ message: { content: 'response' } }],
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
      });

      await provider.chat(
        [{ role: 'user', content: 'test' }],
        { model: 'mistral-small-latest' }
      );

      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mistral-small-latest',
        })
      );
    });

    it('should add system prompt from options', async () => {
      mockComplete.mockResolvedValueOnce({
        model: 'mistral-large-latest',
        choices: [{ message: { content: 'response' } }],
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await provider.chat(messages, {
        systemPrompt: 'You are a helpful assistant',
      });

      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello' },
          ],
        })
      );
    });
  });

  describe('chat - structured JSON output', () => {
    it('should validate response with Zod schema', async () => {
      const schema = z.object({
        vendor: z.string(),
        amount: z.number(),
      });

      const mockResponse = {
        model: 'mistral-large-latest',
        choices: [
          {
            message: {
              content: JSON.stringify({ vendor: 'Starbucks', amount: 1550 }),
            },
          },
        ],
        usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 },
      };

      mockComplete.mockResolvedValueOnce(mockResponse);

      const messages: AIMessage[] = [
        { role: 'user', content: 'Extract vendor and amount from receipt' },
      ];

      const response = await provider.chat(messages, {
        responseSchema: schema,
        responseFormat: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.content);
      expect(parsed).toEqual({ vendor: 'Starbucks', amount: 1550 });
    });

    it('should throw error if schema validation fails', async () => {
      const schema = z.object({
        vendor: z.string(),
        amount: z.number(),
      });

      const mockResponse = {
        model: 'mistral-large-latest',
        choices: [
          {
            message: {
              content: JSON.stringify({ vendor: 'Starbucks' }), // Missing amount
            },
          },
        ],
      };

      mockComplete.mockResolvedValueOnce(mockResponse);

      const messages: AIMessage[] = [
        { role: 'user', content: 'Extract data' },
      ];

      await expect(
        provider.chat(messages, { responseSchema: schema })
      ).rejects.toThrow('Mistral response validation failed');
    });
  });

  describe('error handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      const error = new Error('401 Unauthorized: Invalid API key');
      mockComplete.mockRejectedValueOnce(error);

      await expect(
        provider.chat([{ role: 'user', content: 'test' }])
      ).rejects.toThrow('Mistral API Error (401): Invalid API key');
    });

    it('should handle 429 rate limit errors', async () => {
      const error = new Error('429 Too Many Requests: rate limit exceeded');
      mockComplete.mockRejectedValueOnce(error);

      await expect(
        provider.chat([{ role: 'user', content: 'test' }])
      ).rejects.toThrow('Mistral API Error (429): Rate limit exceeded');
    });

    it('should handle generic errors', async () => {
      const error = new Error('Network error');
      mockComplete.mockRejectedValueOnce(error);

      await expect(
        provider.chat([{ role: 'user', content: 'test' }])
      ).rejects.toThrow('Mistral API Error: Network error');
    });

    it('should handle empty response', async () => {
      mockComplete.mockResolvedValueOnce({
        model: 'mistral-large-latest',
        choices: [],
      });

      await expect(
        provider.chat([{ role: 'user', content: 'test' }])
      ).rejects.toThrow('No response from Mistral API');
    });
  });

  describe('extractFromImage - vision integration', () => {
    it('should extract structured data from receipt image', async () => {
      const schema = z.object({
        vendor: z.string(),
        amount: z.number().int(),
        date: z.string(),
        lineItems: z.array(
          z.object({
            description: z.string(),
            amount: z.number().int(),
          })
        ),
      });

      // Mock JPEG image buffer
      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

      const mockResponse = {
        model: 'pixtral-large-latest',
        choices: [
          {
            message: {
              content: JSON.stringify({
                vendor: 'Starbucks',
                amount: 1550,
                date: '2024-01-15',
                lineItems: [
                  { description: 'Latte', amount: 550 },
                  { description: 'Croissant', amount: 1000 },
                ],
              }),
            },
          },
        ],
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      };

      mockComplete.mockResolvedValueOnce(mockResponse);

      const result = await provider.extractFromImage(imageBuffer, schema);

      expect(result).toEqual({
        vendor: 'Starbucks',
        amount: 1550,
        date: '2024-01-15',
        lineItems: [
          { description: 'Latte', amount: 550 },
          { description: 'Croissant', amount: 1000 },
        ],
      });

      // Verify correct model and format used
      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'pixtral-large-latest',
          responseFormat: { type: 'json_object' },
          temperature: 0.1,
          maxTokens: 2048,
        })
      );

      // Verify image was base64 encoded
      const callArgs = mockComplete.mock.calls[0][0];
      const messageContent = callArgs.messages[0].content;
      expect(messageContent).toHaveLength(2);
      expect(messageContent[0].type).toBe('text');
      expect(messageContent[1].type).toBe('image_url');
      expect(messageContent[1].imageUrl).toContain('data:image/jpeg;base64,');
    });

    it('should detect JPEG format from magic bytes', async () => {
      const schema = z.object({ test: z.string() });
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic bytes

      mockComplete.mockResolvedValueOnce({
        model: 'pixtral-large-latest',
        choices: [{ message: { content: JSON.stringify({ test: 'value' }) } }],
      });

      await provider.extractFromImage(jpegBuffer, schema);

      const callArgs = mockComplete.mock.calls[0][0];
      const imageUrl = callArgs.messages[0].content[1].imageUrl;
      expect(imageUrl).toContain('data:image/jpeg;base64,');
    });

    it('should detect PNG format from magic bytes', async () => {
      const schema = z.object({ test: z.string() });
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

      mockComplete.mockResolvedValueOnce({
        model: 'pixtral-large-latest',
        choices: [{ message: { content: JSON.stringify({ test: 'value' }) } }],
      });

      await provider.extractFromImage(pngBuffer, schema);

      const callArgs = mockComplete.mock.calls[0][0];
      const imageUrl = callArgs.messages[0].content[1].imageUrl;
      expect(imageUrl).toContain('data:image/png;base64,');
    });

    it('should detect PDF format from magic bytes', async () => {
      const schema = z.object({ test: z.string() });
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]); // PDF magic bytes (%PDF)

      mockComplete.mockResolvedValueOnce({
        model: 'pixtral-large-latest',
        choices: [{ message: { content: JSON.stringify({ test: 'value' }) } }],
      });

      await provider.extractFromImage(pdfBuffer, schema);

      const callArgs = mockComplete.mock.calls[0][0];
      const imageUrl = callArgs.messages[0].content[1].imageUrl;
      expect(imageUrl).toContain('data:application/pdf;base64,');
    });

    it('should use custom prompt if provided', async () => {
      const schema = z.object({ vendor: z.string() });
      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      mockComplete.mockResolvedValueOnce({
        model: 'pixtral-large-latest',
        choices: [{ message: { content: JSON.stringify({ vendor: 'Test' }) } }],
      });

      await provider.extractFromImage(
        imageBuffer,
        schema,
        'Extract only the vendor name'
      );

      const callArgs = mockComplete.mock.calls[0][0];
      const textContent = callArgs.messages[0].content[0].text;
      expect(textContent).toBe('Extract only the vendor name');
    });

    it('should throw error if schema validation fails', async () => {
      const schema = z.object({
        vendor: z.string(),
        amount: z.number().int(),
      });

      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      mockComplete.mockResolvedValueOnce({
        model: 'pixtral-large-latest',
        choices: [
          {
            message: {
              content: JSON.stringify({ vendor: 'Test' }), // Missing amount
            },
          },
        ],
      });

      await expect(
        provider.extractFromImage(imageBuffer, schema)
      ).rejects.toThrow('Vision extraction validation failed');
    });

    it('should handle vision API errors', async () => {
      const schema = z.object({ test: z.string() });
      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      const error = new Error('Unsupported image format');
      mockComplete.mockRejectedValueOnce(error);

      await expect(
        provider.extractFromImage(imageBuffer, schema)
      ).rejects.toThrow('Mistral Vision API Error: Unsupported image format');
    });

    it('should handle empty vision response', async () => {
      const schema = z.object({ test: z.string() });
      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      mockComplete.mockResolvedValueOnce({
        model: 'pixtral-large-latest',
        choices: [],
      });

      await expect(
        provider.extractFromImage(imageBuffer, schema)
      ).rejects.toThrow('No response from Mistral vision API');
    });
  });

  describe('circuit breaker (ARCH-13)', () => {
    it('should allow requests when circuit is closed', async () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Hello' }];

      mockComplete.mockResolvedValueOnce({
        model: 'mistral-large-latest',
        choices: [{ message: { content: 'Response' } }],
      });

      const result = await provider.chat(messages);

      expect(result.content).toBe('Response');
    });

    it('should open circuit after 5 consecutive failures', async () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Test' }];

      // Simulate 5 consecutive failures
      for (let i = 0; i < 5; i++) {
        mockComplete.mockRejectedValueOnce(new Error('API Error'));

        try {
          await provider.chat(messages);
        } catch {
          // Expected
        }
      }

      // 6th request should be rejected by circuit breaker (without calling API)
      await expect(provider.chat(messages)).rejects.toThrow(
        /Circuit breaker OPEN/
      );

      // Verify API was NOT called for 6th request
      expect(mockComplete).toHaveBeenCalledTimes(5);
    });

    it('should close circuit after successful request in half-open state', async () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Test' }];

      // Open the circuit (5 failures)
      for (let i = 0; i < 5; i++) {
        mockComplete.mockRejectedValueOnce(new Error('API Error'));
        try {
          await provider.chat(messages);
        } catch {
          // Expected
        }
      }

      // Reset the provider to simulate time passing (60 seconds timeout)
      // In production, this happens naturally after 60 seconds
      provider.resetCircuitBreaker();

      // Now the circuit is closed, next request should succeed
      mockComplete.mockResolvedValueOnce({
        model: 'mistral-large-latest',
        choices: [{ message: { content: 'Success' } }],
      });

      const result = await provider.chat(messages);

      expect(result.content).toBe('Success');

      // Circuit should be closed (failures reset)
      const status = provider.getCircuitBreakerStatus();
      expect(status.state).toBe('closed');
      expect(status.failureCount).toBe(0);
    });

    it('should track circuit breaker state', () => {
      const status = provider.getCircuitBreakerStatus();

      expect(status.state).toBe('closed');
      expect(status.failureCount).toBe(0);
      expect(status.lastFailureTime).toBeNull();
    });

    it('should apply circuit breaker to extractFromImage', async () => {
      const schema = z.object({ test: z.string() });
      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      // Open the circuit (5 failures)
      for (let i = 0; i < 5; i++) {
        mockComplete.mockRejectedValueOnce(new Error('Vision API Error'));
        try {
          await provider.extractFromImage(imageBuffer, schema);
        } catch {
          // Expected
        }
      }

      // 6th request should be rejected by circuit breaker
      await expect(
        provider.extractFromImage(imageBuffer, schema)
      ).rejects.toThrow(/Circuit breaker OPEN/);
    });

    it('should increment failure count on each error', async () => {
      const messages: AIMessage[] = [{ role: 'user', content: 'Test' }];

      // 1 failure
      mockComplete.mockRejectedValueOnce(new Error('Error 1'));
      try {
        await provider.chat(messages);
      } catch {
        // Expected
      }

      let status = provider.getCircuitBreakerStatus();
      expect(status.failureCount).toBe(1);

      // 2 failures
      mockComplete.mockRejectedValueOnce(new Error('Error 2'));
      try {
        await provider.chat(messages);
      } catch {
        // Expected
      }

      status = provider.getCircuitBreakerStatus();
      expect(status.failureCount).toBe(2);
    });
  });
});
