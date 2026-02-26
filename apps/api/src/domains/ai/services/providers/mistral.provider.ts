import { Mistral } from '@mistralai/mistralai';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResponse } from '../types';
import { logger } from '../../../../lib/logger';
import type { z } from 'zod';

export interface MistralChatOptions extends AIChatOptions {
  /**
   * Optional Zod schema for structured JSON output.
   * When provided, Mistral will return validated JSON matching the schema.
   */
  responseSchema?: z.ZodType<unknown>;
  /**
   * Response format type. Use 'json_object' for structured output.
   */
  responseFormat?: { type: 'json_object' | 'text' };
}

export class MistralProvider implements AIProvider {
  readonly name = 'mistral';
  private client: Mistral;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
  }

  async chat(messages: AIMessage[], options?: MistralChatOptions): Promise<AIChatResponse> {
    // Model selection: mistral-large-latest for text, pixtral-large-latest for vision (A2)
    const model = options?.model || 'mistral-large-latest';

    // Mistral accepts system messages as regular message objects (unlike Anthropic)
    const mistralMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add system prompt from options if provided
    if (options?.systemPrompt) {
      mistralMessages.unshift({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    try {
      const response = await this.client.chat.complete({
        model,
        messages: mistralMessages,
        temperature: options?.temperature ?? 0.2,
        maxTokens: options?.maxTokens ?? 1024,
        ...(options?.responseFormat ? { responseFormat: options.responseFormat } : {}),
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from Mistral API');
      }

      const choice = response.choices[0];
      const rawContent = choice.message?.content || '';

      // Mistral SDK can return content as string or array of content chunks
      // For text mode, we expect string. Convert if needed.
      let content: string;
      if (typeof rawContent === 'string') {
        content = rawContent;
      } else if (Array.isArray(rawContent)) {
        // Extract text from content chunks
        content = rawContent
          .filter((chunk: { type: string; text?: string }) => chunk.type === 'text')
          .map((chunk: { text?: string }) => chunk.text || '')
          .join('');
      } else {
        content = '';
      }

      // If Zod schema provided, validate and parse JSON response
      if (options?.responseSchema && content) {
        try {
          const parsed = JSON.parse(content);
          const validated = options.responseSchema.parse(parsed);
          content = JSON.stringify(validated);
        } catch (validationError: unknown) {
          logger.error(
            {
              err: validationError,
              rawContent: content,
            },
            'Mistral response schema validation failed'
          );
          throw new Error(
            `Mistral response validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
          );
        }
      }

      return {
        content,
        model: response.model || model,
        usage: response.usage
          ? {
              promptTokens: response.usage.promptTokens || 0,
              completionTokens: response.usage.completionTokens || 0,
              totalTokens: response.usage.totalTokens || 0,
            }
          : undefined,
      };
    } catch (error: unknown) {
      // Sanitize SDK errors — don't leak API keys or internal details
      if (error instanceof Error) {
        logger.error(
          { message: error.message, name: error.name },
          'Mistral API Error'
        );

        // Check for common Mistral API error patterns
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Mistral API Error (401): Invalid API key');
        }
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new Error('Mistral API Error (429): Rate limit exceeded');
        }

        throw new Error(`Mistral API Error: ${error.message}`);
      }

      logger.error({ err: error }, 'Mistral Provider Error');
      throw new Error('Mistral API Error: Unknown error');
    }
  }

  /**
   * Extract structured data from an image using Mistral vision (pixtral).
   *
   * @param imageBuffer - Image as Buffer (JPEG, PNG, or PDF)
   * @param schema - Zod schema defining the expected structure
   * @param prompt - Optional custom extraction prompt (default: generic extraction)
   * @returns Validated structured data matching the schema
   *
   * @example
   * ```typescript
   * const schema = z.object({
   *   vendor: z.string(),
   *   amount: z.number().int(),
   *   date: z.string(),
   *   lineItems: z.array(z.object({
   *     description: z.string(),
   *     amount: z.number().int(),
   *   })),
   * });
   *
   * const data = await provider.extractFromImage(receiptBuffer, schema);
   * // => { vendor: "Starbucks", amount: 1550, date: "2024-01-15", lineItems: [...] }
   * ```
   */
  async extractFromImage<T>(
    imageBuffer: Buffer,
    schema: z.ZodType<T>,
    prompt?: string
  ): Promise<T> {
    // Use pixtral-large-latest for vision (pinned version as per A2 requirements)
    const model = 'pixtral-large-latest';

    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Determine MIME type from buffer magic bytes
    const mimeType = this.detectMimeType(imageBuffer);

    // Default extraction prompt if none provided
    const extractionPrompt =
      prompt ||
      `Extract structured data from this image. Return ONLY valid JSON matching the expected schema. Do not include any explanatory text.`;

    try {
      const response = await this.client.chat.complete({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractionPrompt,
              },
              {
                type: 'image_url',
                imageUrl: `data:${mimeType};base64,${base64Image}`,
              },
            ],
          },
        ],
        temperature: 0.1, // Lower temperature for structured extraction
        maxTokens: 2048, // Higher token limit for detailed extractions
        responseFormat: { type: 'json_object' },
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from Mistral vision API');
      }

      const choice = response.choices[0];
      const content = choice.message?.content || '';

      if (typeof content !== 'string') {
        throw new Error('Mistral vision returned non-string content');
      }

      // Parse and validate JSON response
      try {
        const parsed = JSON.parse(content);
        const validated = schema.parse(parsed);

        logger.info(
          {
            model,
            confidence: parsed.confidence || 'unknown',
            fields: Object.keys(validated as Record<string, unknown>),
          },
          'Mistral vision extraction successful'
        );

        return validated;
      } catch (validationError: unknown) {
        logger.error(
          {
            err: validationError,
            rawContent: content,
            model,
          },
          'Mistral vision response validation failed'
        );
        throw new Error(
          `Vision extraction validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(
          { message: error.message, name: error.name, model },
          'Mistral Vision API Error'
        );

        // Check for common error patterns
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Mistral Vision API Error (401): Invalid API key');
        }
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new Error('Mistral Vision API Error (429): Rate limit exceeded');
        }
        if (error.message.includes('unsupported')) {
          throw new Error('Mistral Vision API Error: Unsupported image format');
        }

        throw new Error(`Mistral Vision API Error: ${error.message}`);
      }

      logger.error({ err: error }, 'Mistral Vision Provider Error');
      throw new Error('Mistral Vision API Error: Unknown error');
    }
  }

  /**
   * Detect MIME type from buffer magic bytes
   */
  private detectMimeType(buffer: Buffer): string {
    // Check magic bytes for common image formats
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }

    // Default to JPEG if unknown
    logger.warn({ first4Bytes: buffer.slice(0, 4) }, 'Unknown image format, defaulting to JPEG');
    return 'image/jpeg';
  }
}
