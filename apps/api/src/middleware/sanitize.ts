/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user input and prevent XSS/injection attacks.
 * Essential for SOC 2 compliance and OWASP security.
 *
 * NOTE: These are supplementary to Zod validation.
 * Primary validation should be done with Zod schemas.
 */

/**
 * Sanitize a string to prevent XSS attacks.
 * Escapes HTML special characters.
 *
 * @example
 * ```typescript
 * const safe = sanitizeString('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Strip HTML tags from a string.
 * Use when you need plain text only.
 *
 * @example
 * ```typescript
 * const plain = stripHtml('<p>Hello <b>World</b></p>');
 * // Returns: 'Hello World'
 * ```
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize a string for use in SQL LIKE clauses.
 * Escapes wildcard characters.
 *
 * @example
 * ```typescript
 * const safe = sanitizeForLike('100% match');
 * // Returns: '100\\% match'
 * ```
 */
export function sanitizeForLike(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Deep sanitize object values.
 * Recursively sanitizes all string values in an object.
 *
 * @example
 * ```typescript
 * const safe = sanitizeObject({
 *   name: '<script>bad</script>',
 *   nested: { value: '<b>bold</b>' }
 * });
 * // Returns: { name: '&lt;script&gt;...', nested: { value: '&lt;b&gt;...' } }
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        }
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Validate and sanitize an email address.
 * Returns null if invalid.
 *
 * @example
 * ```typescript
 * const email = sanitizeEmail('  USER@Example.COM  ');
 * // Returns: 'user@example.com'
 * ```
 */
export function sanitizeEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  // Basic email regex - Zod should do full validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize a URL.
 * Only allows http/https protocols.
 * Returns null if invalid.
 *
 * @example
 * ```typescript
 * sanitizeUrl('https://example.com/path') // Returns URL
 * sanitizeUrl('javascript:alert(1)') // Returns null
 * ```
 */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());

    // Only allow safe protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

/**
 * Truncate a string to a maximum length.
 * Adds ellipsis if truncated.
 *
 * @example
 * ```typescript
 * truncate('Hello World', 8) // Returns: 'Hello...'
 * ```
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return input.slice(0, maxLength - 3) + '...';
}

/**
 * Remove control characters from a string.
 * Useful for preventing terminal injection.
 *
 * @example
 * ```typescript
 * removeControlChars('Hello\x00World\x1B[31m')
 * // Returns: 'HelloWorld'
 * ```
 */
export function removeControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Normalize whitespace in a string.
 * Collapses multiple spaces and trims.
 *
 * @example
 * ```typescript
 * normalizeWhitespace('  Hello    World  ')
 * // Returns: 'Hello World'
 * ```
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}
