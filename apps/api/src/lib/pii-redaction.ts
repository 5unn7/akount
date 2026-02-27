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
 * Redact PII from image buffer (strips EXIF/metadata).
 *
 * EXIF and other metadata can contain GPS coordinates, device info, timestamps, etc.
 *
 * Supports: JPEG (EXIF), PNG (tEXt/iTXt/zTXt chunks), HEIC (meta box)
 *
 * @param imageBuffer - Image buffer (JPEG, PNG, HEIC)
 * @returns Redacted image buffer + audit log
 */
export function redactImage(imageBuffer: Buffer): RedactionResult {
  const log: RedactionLogEntry[] = [];

  // Detect format and strip metadata
  let redactedBuffer: Buffer;

  if (isJPEG(imageBuffer)) {
    redactedBuffer = stripJPEGEXIF(imageBuffer, log);
  } else if (isPNG(imageBuffer)) {
    redactedBuffer = stripPNGMetadata(imageBuffer, log);
  } else if (isHEIC(imageBuffer)) {
    redactedBuffer = stripHEICMetadata(imageBuffer, log);
  } else {
    // Unknown format — return as-is
    redactedBuffer = imageBuffer;
  }

  return {
    redactedBuffer,
    redactionLog: log,
    hadPII: log.length > 0,
  };
}

/**
 * Check if buffer is a JPEG image.
 * Magic bytes: FF D8 FF
 */
function isJPEG(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

/**
 * Check if buffer is a PNG image.
 * Magic bytes: 89 50 4E 47 0D 0A 1A 0A
 */
function isPNG(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

/**
 * Check if buffer is a HEIC image.
 * HEIC files have 'ftyp' box at offset 4 with 'heic' or 'mif1' brand.
 */
function isHEIC(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // Check for 'ftyp' at offset 4
  const hasFtyp =
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
  if (!hasFtyp) return false;
  // Check for 'heic' or 'mif1' brand
  const isHeic =
    buffer[8] === 0x68 && buffer[9] === 0x65 && buffer[10] === 0x69 && buffer[11] === 0x63;
  const isMif1 =
    buffer[8] === 0x6d && buffer[9] === 0x69 && buffer[10] === 0x66 && buffer[11] === 0x31;
  return isHeic || isMif1;
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
 * JPEG structure: SOI (FFD8) + segments + image data + EOI (FFD9)
 * EXIF data is in APP1 marker (FFE1). This function removes all APP1 segments.
 */
function stripJPEGEXIF(imageBuffer: Buffer, log: RedactionLogEntry[]): Buffer {
  // Safety check: verify JPEG magic bytes
  if (
    imageBuffer[0] !== 0xff ||
    imageBuffer[1] !== 0xd8 ||
    imageBuffer[2] !== 0xff
  ) {
    logger.warn('stripJPEGEXIF called on non-JPEG buffer');
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

/**
 * Strip metadata from PNG images (SEC-31).
 *
 * PNG metadata is stored in ancillary chunks like tEXt, iTXt, zTXt, eXIf.
 * These can contain GPS coordinates, device info, software info, etc.
 *
 * PNG structure: 8-byte signature + IHDR chunk + ancillary chunks + IDAT chunks + IEND
 * Strategy: Keep only critical chunks (IHDR, IDAT, PLTE, IEND), remove all ancillary chunks.
 */
function stripPNGMetadata(imageBuffer: Buffer, log: RedactionLogEntry[]): Buffer {
  // Safety check: verify PNG signature
  if (!isPNG(imageBuffer)) {
    logger.warn('stripPNGMetadata called on non-PNG buffer');
    return imageBuffer;
  }

  const result: number[] = [];
  let i = 0;

  // Copy PNG signature (8 bytes)
  for (let j = 0; j < 8; j++) {
    result.push(imageBuffer[i++]);
  }

  let metadataStripped = false;

  while (i < imageBuffer.length) {
    // PNG chunk structure: [4 bytes length][4 bytes type][data][4 bytes CRC]
    if (i + 8 > imageBuffer.length) break;

    // Read chunk length (big-endian)
    const length = (imageBuffer[i] << 24) | (imageBuffer[i + 1] << 16) |
                   (imageBuffer[i + 2] << 8) | imageBuffer[i + 3];
    i += 4;

    // Read chunk type (4 ASCII chars)
    const type = String.fromCharCode(
      imageBuffer[i],
      imageBuffer[i + 1],
      imageBuffer[i + 2],
      imageBuffer[i + 3]
    );
    i += 4;

    // Critical chunks to keep: IHDR, PLTE, IDAT, IEND
    // Ancillary chunks to remove: tEXt, iTXt, zTXt, eXIf, pHYs, tIME, etc.
    const isCritical = ['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type);
    const isMetadata = ['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME'].includes(type);

    if (isCritical) {
      // Copy chunk: length + type + data + CRC
      result.push(
        (length >> 24) & 0xff,
        (length >> 16) & 0xff,
        (length >> 8) & 0xff,
        length & 0xff
      );
      result.push(...type.split('').map((c) => c.charCodeAt(0)));
      for (let j = 0; j < length + 4; j++) {
        // data + CRC
        result.push(imageBuffer[i++]);
      }
    } else {
      // Skip ancillary chunk
      i += length + 4; // skip data + CRC
      if (isMetadata) {
        metadataStripped = true;
        logger.info({ chunkType: type }, 'PNG metadata chunk stripped');
      }
    }

    // IEND is last chunk
    if (type === 'IEND') break;
  }

  if (metadataStripped) {
    log.push({
      type: 'exif_metadata',
      pattern: 'png_ancillary_chunks',
      replacement: '[METADATA_STRIPPED]',
    });
  }

  return Buffer.from(result);
}

/**
 * Strip metadata from HEIC images (SEC-31).
 *
 * HEIC uses ISO Base Media File Format (same as MP4).
 * Metadata is in 'meta' box and 'Exif' item.
 *
 * Strategy: Basic implementation — remove 'meta' box entirely.
 * For production, consider using a library like `heic-convert` with metadata stripping.
 */
function stripHEICMetadata(imageBuffer: Buffer, log: RedactionLogEntry[]): Buffer {
  // Safety check: verify HEIC signature
  if (!isHEIC(imageBuffer)) {
    logger.warn('stripHEICMetadata called on non-HEIC buffer');
    return imageBuffer;
  }

  const result: number[] = [];
  let i = 0;
  let metadataStripped = false;

  while (i < imageBuffer.length) {
    // ISO BMFF box structure: [4 bytes size][4 bytes type][data]
    if (i + 8 > imageBuffer.length) {
      // Copy remaining bytes if too short to be a valid box
      while (i < imageBuffer.length) {
        result.push(imageBuffer[i++]);
      }
      break;
    }

    // Read box size (big-endian)
    const size = (imageBuffer[i] << 24) | (imageBuffer[i + 1] << 16) |
                 (imageBuffer[i + 2] << 8) | imageBuffer[i + 3];

    // Read box type (4 ASCII chars)
    const type = String.fromCharCode(
      imageBuffer[i + 4],
      imageBuffer[i + 5],
      imageBuffer[i + 6],
      imageBuffer[i + 7]
    );

    // If size is 0, box extends to end of file
    const boxSize = size === 0 ? imageBuffer.length - i : size;

    // Skip 'meta' box (contains EXIF, XMP, etc.)
    if (type === 'meta') {
      i += boxSize;
      metadataStripped = true;
      logger.info('HEIC meta box stripped');
      continue;
    }

    // Copy other boxes
    for (let j = 0; j < boxSize && i < imageBuffer.length; j++) {
      result.push(imageBuffer[i++]);
    }

    // Safety: prevent infinite loop if size is invalid
    if (boxSize <= 8) {
      logger.warn({ type, size: boxSize }, 'Invalid HEIC box size, stopping');
      break;
    }
  }

  if (metadataStripped) {
    log.push({
      type: 'exif_metadata',
      pattern: 'heic_meta_box',
      replacement: '[METADATA_STRIPPED]',
    });
  }

  return Buffer.from(result);
}
