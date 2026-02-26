import { logger } from './logger';

/**
 * PII Redaction Service
 *
 * Pre-inference redaction pipeline to prevent leaking sensitive personal information
 * to external AI APIs (Mistral, Claude, etc.).
 *
 * **Security-critical:** Must redact ALL PII before sending to external services.
 *
 * @module pii-redaction
 */

export interface RedactionResult {
  /** Redacted buffer (text or image with EXIF stripped) */
  redactedBuffer: Buffer;
  /** Log of what was redacted for audit trail */
  redactionLog: RedactionLogEntry[];
  /** Whether any PII was found and redacted */
  hadPII: boolean;
}

export interface RedactionLogEntry {
  /** Type of PII detected */
  type: PIIType;
  /** Pattern that matched */
  pattern: string;
  /** Position in original content (for text) */
  position?: number;
  /** Replacement value used */
  replacement: string;
}

export type PIIType =
  | 'credit_card'
  | 'ssn'
  | 'sin'
  | 'email'
  | 'bank_account'
  | 'phone'
  | 'exif_metadata';

/**
 * Redact PII from text content before sending to AI inference.
 *
 * @param content - Text content to redact
 * @returns Redacted content + audit log
 */
export function redactText(content: string): RedactionResult {
  const log: RedactionLogEntry[] = [];
  let redacted = content;

  // Order matters! Check most specific patterns first to avoid false positives.

  // 1. Redact credit card numbers (with Luhn validation) - most specific
  redacted = redactCreditCards(redacted, log);

  // 2. Redact SSN (US) - format: XXX-XX-XXXX
  redacted = redactSSN(redacted, log);

  // 3. Redact SIN (Canada) - format: XXX-XXX-XXX
  redacted = redactSIN(redacted, log);

  // 4. Redact email addresses
  redacted = redactEmails(redacted, log);

  // 5. Redact phone numbers BEFORE bank accounts (more specific: 10-11 digits vs 8-17)
  redacted = redactPhoneNumbers(redacted, log);

  // 6. Redact bank account numbers (8-17 digits) - most generic, check last
  redacted = redactBankAccounts(redacted, log);

  const redactedBuffer = Buffer.from(redacted, 'utf-8');

  return {
    redactedBuffer,
    redactionLog: log,
    hadPII: log.length > 0,
  };
}

/**
 * Redact PII from image buffer (strips EXIF metadata).
 *
 * EXIF metadata can contain GPS coordinates, device info, timestamps, etc.
 *
 * @param imageBuffer - Image buffer (JPEG, PNG, etc.)
 * @returns Redacted image buffer + audit log
 */
export function redactImage(imageBuffer: Buffer): RedactionResult {
  const log: RedactionLogEntry[] = [];

  // Strip EXIF metadata from JPEG images
  const redactedBuffer = stripEXIF(imageBuffer, log);

  return {
    redactedBuffer,
    redactionLog: log,
    hadPII: log.length > 0,
  };
}

/**
 * Redact credit card numbers using Luhn algorithm validation + regex.
 *
 * Matches 13-19 digit sequences that pass Luhn check.
 * Preserves: last 4 digits for reference (industry standard)
 */
function redactCreditCards(text: string, log: RedactionLogEntry[]): string {
  // Match potential CC numbers (13-19 digits with optional spaces/dashes)
  const ccPattern = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{1,7}\b/g;

  return text.replace(ccPattern, (match, offset) => {
    // Remove spaces/dashes for Luhn validation
    const digits = match.replace(/[\s\-]/g, '');

    // Validate with Luhn algorithm
    if (isValidLuhn(digits)) {
      // Redact all but last 4 digits
      const last4 = digits.slice(-4);
      const replacement = `****-****-****-${last4}`;

      log.push({
        type: 'credit_card',
        pattern: 'luhn_validated_cc',
        position: offset,
        replacement,
      });

      logger.warn(
        { position: offset, last4 },
        'Credit card number detected and redacted'
      );

      return replacement;
    }

    // Not a valid CC, return unchanged
    return match;
  });
}

/**
 * Luhn algorithm for credit card validation.
 * https://en.wikipedia.org/wiki/Luhn_algorithm
 */
function isValidLuhn(cardNumber: string): boolean {
  if (!/^\d{13,19}$/.test(cardNumber)) return false;

  let sum = 0;
  let isEven = false;

  // Loop from right to left
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Redact US Social Security Numbers (SSN).
 *
 * Format: XXX-XX-XXXX or XXXXXXXXX
 */
function redactSSN(text: string, log: RedactionLogEntry[]): string {
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g;

  return text.replace(ssnPattern, (match, offset) => {
    const replacement = '***-**-****';

    log.push({
      type: 'ssn',
      pattern: 'ssn_format',
      position: offset,
      replacement,
    });

    logger.warn({ position: offset }, 'SSN detected and redacted');

    return replacement;
  });
}

/**
 * Redact Canadian Social Insurance Numbers (SIN).
 *
 * Format: XXX-XXX-XXX or XXXXXXXXX
 */
function redactSIN(text: string, log: RedactionLogEntry[]): string {
  const sinPattern = /\b\d{3}-\d{3}-\d{3}\b/g;

  return text.replace(sinPattern, (match, offset) => {
    const replacement = '***-***-***';

    log.push({
      type: 'sin',
      pattern: 'sin_format',
      position: offset,
      replacement,
    });

    logger.warn({ position: offset }, 'SIN detected and redacted');

    return replacement;
  });
}

/**
 * Redact email addresses.
 *
 * Preserves domain for context (e.g., vendor@company.com)
 */
function redactEmails(text: string, log: RedactionLogEntry[]): string {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  return text.replace(emailPattern, (match, offset) => {
    const [localPart, domain] = match.split('@');
    const replacement = `***@${domain}`;

    log.push({
      type: 'email',
      pattern: 'email_format',
      position: offset,
      replacement,
    });

    logger.info({ position: offset, domain }, 'Email detected and redacted');

    return replacement;
  });
}

/**
 * Redact bank account numbers (8-17 digits).
 *
 * CRITICAL: Must not redact invoice amounts or dates that happen to be 8+ digits.
 * Uses context heuristics to avoid false positives.
 *
 * Only redacts if there's explicit bank account context nearby.
 */
function redactBankAccounts(text: string, log: RedactionLogEntry[]): string {
  // Match 8-17 digit sequences NOT preceded by currency symbols
  // Negative lookbehind: (?<![£$€¥₹])
  const accountPattern = /(?<![£$€¥₹])\b\d{8,17}\b(?!\s*(USD|CAD|EUR|GBP))/g;

  return text.replace(accountPattern, (match, offset) => {
    // Skip if already redacted (contains *)
    if (match.includes('*')) return match;

    // Additional heuristic: skip if it looks like a date (YYYYMMDD)
    if (/^(19|20)\d{6}$/.test(match)) return match;

    // Check context for bank account keywords
    const contextBefore = text.slice(Math.max(0, offset - 30), offset);
    const contextAfter = text.slice(offset + match.length, offset + match.length + 30);
    const context = (contextBefore + contextAfter).toLowerCase();

    // Skip if has money context (likely an amount in cents)
    const hasMoneyContext = /(\$|usd|cad|eur|total|amount|price|cost|invoice|bill|payment)/i.test(
      context
    );
    if (hasMoneyContext) return match;

    // Skip if looks like random number without bank context
    const hasBankContext = /(account|routing|ach|iban|swift|bank|transit)/i.test(context);
    if (!hasBankContext) return match; // Conservative: only redact with explicit bank context

    const replacement = '****' + match.slice(-4);

    log.push({
      type: 'bank_account',
      pattern: 'account_number_format',
      position: offset,
      replacement,
    });

    logger.warn({ position: offset }, 'Bank account number detected and redacted');

    return replacement;
  });
}

/**
 * Redact phone numbers.
 *
 * Formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXXXXXXXXX
 */
function redactPhoneNumbers(text: string, log: RedactionLogEntry[]): string {
  // Pattern 1: (555) 123-4567 format
  const phoneWithParens = /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g;
  text = text.replace(phoneWithParens, (match, offset) => {
    const replacement = '***-***-****';
    log.push({
      type: 'phone',
      pattern: 'phone_with_parens',
      position: offset,
      replacement,
    });
    logger.info({ position: offset }, 'Phone number detected and redacted');
    return replacement;
  });

  // Pattern 2: 555-123-4567 format
  const phoneWithDashes = /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g;
  text = text.replace(phoneWithDashes, (match, offset) => {
    const replacement = '***-***-****';
    log.push({
      type: 'phone',
      pattern: 'phone_with_dashes',
      position: offset,
      replacement,
    });
    logger.info({ position: offset }, 'Phone number detected and redacted');
    return replacement;
  });

  // Pattern 3: 5551234567 (10 digits, no formatting)
  // Only match if NOT already redacted by CC or bank account patterns
  const phoneNoFormat = /\b\d{10}\b/g;
  text = text.replace(phoneNoFormat, (match, offset) => {
    // Skip if already contains *, meaning it was caught by another pattern
    if (match.includes('*')) return match;

    const replacement = '***-***-****';
    log.push({
      type: 'phone',
      pattern: 'phone_no_format',
      position: offset,
      replacement,
    });
    logger.info({ position: offset }, 'Phone number detected and redacted');
    return replacement;
  });

  return text;
}

/**
 * Strip EXIF metadata from JPEG images.
 *
 * EXIF can contain GPS coordinates, device serial numbers, timestamps, etc.
 *
 * **Implementation:** Basic EXIF stripping for JPEG.
 * For production, consider using a library like `piexifjs` or `exif-parser`.
 */
function stripEXIF(imageBuffer: Buffer, log: RedactionLogEntry[]): Buffer {
  // Check if JPEG (magic bytes: FF D8 FF)
  if (
    imageBuffer[0] !== 0xff ||
    imageBuffer[1] !== 0xd8 ||
    imageBuffer[2] !== 0xff
  ) {
    // Not JPEG, return as-is (PNG, PDF don't have EXIF in same way)
    return imageBuffer;
  }

  // JPEG structure: SOI (FFD8) + segments + image data + EOI (FFD9)
  // EXIF data is in APP1 marker (FFE1)
  // Strategy: Find and remove APP1 (EXIF) segments

  const result: number[] = [];
  let i = 0;

  // Copy SOI marker
  result.push(imageBuffer[i++], imageBuffer[i++]);

  let exifStripped = false;

  while (i < imageBuffer.length - 1) {
    // Check for marker (FF XX)
    if (imageBuffer[i] === 0xff) {
      const marker = imageBuffer[i + 1];

      // APP1 (EXIF) marker
      if (marker === 0xe1) {
        // Read segment length (2 bytes, big-endian)
        const segmentLength = (imageBuffer[i + 2] << 8) | imageBuffer[i + 3];

        // Skip this segment (EXIF data)
        i += 2 + segmentLength;
        exifStripped = true;

        logger.info('EXIF APP1 segment stripped from JPEG');
        continue;
      }

      // SOS (Start of Scan) marker - rest is image data, copy as-is
      if (marker === 0xda) {
        // Copy rest of file (image data + EOI)
        while (i < imageBuffer.length) {
          result.push(imageBuffer[i++]);
        }
        break;
      }

      // Other markers - copy segment
      result.push(imageBuffer[i++], imageBuffer[i++]);

      // If marker has length field, copy segment data
      if (marker !== 0xd8 && marker !== 0xd9 && marker !== 0x01) {
        const segmentLength = (imageBuffer[i] << 8) | imageBuffer[i + 1];
        for (let j = 0; j < segmentLength; j++) {
          result.push(imageBuffer[i++]);
        }
      }
    } else {
      result.push(imageBuffer[i++]);
    }
  }

  if (exifStripped) {
    log.push({
      type: 'exif_metadata',
      pattern: 'jpeg_app1_segment',
      replacement: '[EXIF_STRIPPED]',
    });
  }

  return Buffer.from(result);
}
