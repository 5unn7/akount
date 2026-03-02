import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  stripHtml,
  sanitizeForLike,
  sanitizeObject,
  sanitizeEmail,
  sanitizeUrl,
  truncate,
  removeControlChars,
  normalizeWhitespace,
} from '../sanitize';

describe('sanitize', () => {
  describe('sanitizeString', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(sanitizeString('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape single quotes', () => {
      expect(sanitizeString("it's")).toBe('it&#x27;s');
    });

    it('should escape forward slashes', () => {
      expect(sanitizeString('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle string with no special characters', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should handle self-closing tags', () => {
      expect(stripHtml('Hello<br/>World')).toBe('HelloWorld');
    });

    it('should trim result', () => {
      expect(stripHtml('  <p>text</p>  ')).toBe('text');
    });

    it('should handle string with no HTML', () => {
      expect(stripHtml('plain text')).toBe('plain text');
    });

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('');
    });
  });

  describe('sanitizeForLike', () => {
    it('should escape percent wildcard', () => {
      expect(sanitizeForLike('100% match')).toBe('100\\% match');
    });

    it('should escape underscore wildcard', () => {
      expect(sanitizeForLike('test_value')).toBe('test\\_value');
    });

    it('should escape backslashes', () => {
      expect(sanitizeForLike('back\\slash')).toBe('back\\\\slash');
    });

    it('should escape all wildcards together', () => {
      expect(sanitizeForLike('50%_done\\ok')).toBe('50\\%\\_done\\\\ok');
    });

    it('should handle string with no wildcards', () => {
      expect(sanitizeForLike('normal text')).toBe('normal text');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const result = sanitizeObject({ name: '<b>bold</b>' });
      expect(result.name).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
    });

    it('should recursively sanitize nested objects', () => {
      const result = sanitizeObject({
        nested: { value: '<script>bad</script>' },
      });
      expect((result.nested as Record<string, string>).value).toContain('&lt;script&gt;');
    });

    it('should sanitize arrays of strings', () => {
      const result = sanitizeObject({ tags: ['<b>one</b>', '<i>two</i>'] });
      expect((result.tags as string[])[0]).toBe('&lt;b&gt;one&lt;&#x2F;b&gt;');
      expect((result.tags as string[])[1]).toBe('&lt;i&gt;two&lt;&#x2F;i&gt;');
    });

    it('should sanitize objects within arrays', () => {
      const result = sanitizeObject({
        items: [{ name: '<script>xss</script>' }],
      });
      expect(((result.items as Record<string, string>[])[0]).name).toContain('&lt;script&gt;');
    });

    it('should preserve non-string values', () => {
      const result = sanitizeObject({
        count: 42,
        active: true,
        value: null,
      });
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should handle empty object', () => {
      expect(sanitizeObject({})).toEqual({});
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  USER@Example.COM  ')).toBe('user@example.com');
    });

    it('should return null for invalid email', () => {
      expect(sanitizeEmail('not-an-email')).toBeNull();
    });

    it('should return null for email without @', () => {
      expect(sanitizeEmail('noatsign.com')).toBeNull();
    });

    it('should return null for email without domain', () => {
      expect(sanitizeEmail('user@')).toBeNull();
    });

    it('should accept valid email', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept https URLs', () => {
      expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should accept http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should reject data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<h1>hi</h1>')).toBeNull();
    });

    it('should reject ftp: protocol', () => {
      expect(sanitizeUrl('ftp://files.example.com')).toBeNull();
    });

    it('should return null for invalid URL', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
    });

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com/');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings with ellipsis', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should not truncate strings at exact limit', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle very short max length', () => {
      expect(truncate('Hello World', 4)).toBe('H...');
    });
  });

  describe('removeControlChars', () => {
    it('should remove null byte', () => {
      expect(removeControlChars('Hello\x00World')).toBe('HelloWorld');
    });

    it('should remove escape sequences', () => {
      expect(removeControlChars('Hello\x1B[31mWorld')).toBe('Hello[31mWorld');
    });

    it('should remove bell character', () => {
      expect(removeControlChars('ring\x07bell')).toBe('ringbell');
    });

    it('should preserve normal text', () => {
      expect(removeControlChars('Hello World 123')).toBe('Hello World 123');
    });

    it('should preserve newlines and tabs', () => {
      // Note: \n (0x0A), \r (0x0D), \t (0x09) are NOT in the removal regex
      expect(removeControlChars('line1\nline2\ttab')).toBe('line1\nline2\ttab');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should collapse multiple spaces', () => {
      expect(normalizeWhitespace('Hello    World')).toBe('Hello World');
    });

    it('should trim leading and trailing spaces', () => {
      expect(normalizeWhitespace('  Hello World  ')).toBe('Hello World');
    });

    it('should normalize tabs and newlines', () => {
      expect(normalizeWhitespace('Hello\t\nWorld')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(normalizeWhitespace('')).toBe('');
    });

    it('should handle string with only whitespace', () => {
      expect(normalizeWhitespace('   ')).toBe('');
    });
  });
});
