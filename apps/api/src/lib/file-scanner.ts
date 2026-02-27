import { logger } from './logger';
import * as net from 'net';

/**
 * File Scanner Service — SEC-11, SEC-31
 *
 * Validates uploaded files for security threats:
 * 1. File size validation (prevent DoS via huge files)
 * 2. Magic bytes verification (file type matches claimed extension)
 * 3. Content pattern scanning (embedded scripts, macros, polyglots, suspicious patterns)
 * 4. ClamAV integration (optional, enabled via CLAMAV_HOST env var)
 *
 * Supports: PDF, XLSX, XLS, CSV, JPEG, PNG, HEIC
 *
 * @module file-scanner
 */

// Maximum file size: 10MB (SEC-44 - prevent OOM attacks)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Magic bytes signatures for supported file types
const MAGIC_BYTES: Record<string, { bytes: number[]; offset: number }[]> = {
  // PDF: starts with %PDF
  pdf: [{ bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }],
  // XLSX/DOCX: ZIP archive (PK header)
  xlsx: [{ bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0 }],
  // XLS: OLE2 Compound Document
  xls: [{ bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], offset: 0 }],
  // CSV: no magic bytes — validated by content structure
  csv: [],
  // JPEG: starts with FF D8 FF
  jpeg: [{ bytes: [0xff, 0xd8, 0xff], offset: 0 }],
  jpg: [{ bytes: [0xff, 0xd8, 0xff], offset: 0 }],
  // PNG: 8-byte signature
  png: [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 }],
  // HEIC: ftyp box with 'heic' or 'mif1' brand at offset 4
  heic: [
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], offset: 4 },
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31], offset: 4 },
  ],
};

// Dangerous patterns to detect in file content
const DANGEROUS_PATTERNS = {
  pdf: [
    // JavaScript embedded in PDF
    /\/JavaScript\s/i,
    /\/JS\s*\(/i,
    // Launch actions (can execute commands)
    /\/Launch\s/i,
    // URI actions that auto-open (phishing)
    /\/URI\s*\(/i,
    // Embedded files/attachments
    /\/EmbeddedFile\s/i,
    // XFA forms (can contain scripts)
    /\/XFA\s/i,
    // AcroForm with JavaScript
    /\/AA\s*<</i,
    // OpenAction (auto-execute on open)
    /\/OpenAction\s/i,
  ],
  xlsx: [
    // VBA macros in XLSX
    /vbaProject\.bin/i,
    // External data connections
    /externalLink/i,
  ],
  csv: [
    // CSV injection: formulas that execute when opened in Excel
    // These start cells with =, +, -, @, \t, \r which trigger formula execution
    /^[=+\-@\t\r]/m,
    // DDE injection
    /=cmd\|/i,
    /=HYPERLINK\(/i,
    // PowerShell/cmd execution via DDE
    /DDE\s*\(/i,
  ],
  jpeg: [
    // Polyglot: JPEG + HTML (FFD8FF followed by HTML tags)
    /<(?:html|script|iframe|object|embed)/i,
    // Polyglot: JPEG + PHP/JSP
    /<\?php/i,
    /<%[@=]?/,
    // Suspicious comment blocks that could hide code
    /<!--[\s\S]{200,}-->/,
  ],
  jpg: [
    // Same as JPEG
    /<(?:html|script|iframe|object|embed)/i,
    /<\?php/i,
    /<%[@=]?/,
    /<!--[\s\S]{200,}-->/,
  ],
  png: [
    // Polyglot: PNG + HTML/script in tEXt/iTXt chunks
    /<(?:html|script|iframe|object|embed)/i,
    // Polyglot: PNG + PHP
    /<\?php/i,
    /<%[@=]?/,
    // Suspicious text chunks with encoded scripts
    /tEXt.*(?:javascript|eval|document\.)/i,
  ],
  heic: [
    // HEIC with suspicious metadata (rare, but possible)
    /<(?:script|iframe)/i,
  ],
};

export interface ScanResult {
  safe: boolean;
  threats: string[];
  fileType: string;
  magicBytesValid: boolean;
  clamavScanned: boolean;
}

/**
 * Validate file magic bytes match the claimed file type.
 *
 * Returns true if magic bytes match or if the file type has no defined signature (e.g., CSV).
 */
function validateMagicBytes(buffer: Buffer, fileType: string): boolean {
  const signatures = MAGIC_BYTES[fileType];
  if (!signatures || signatures.length === 0) {
    return true; // No signature defined (e.g., CSV)
  }

  return signatures.some((sig) =>
    sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte)
  );
}

/**
 * Scan file content for known malicious patterns.
 *
 * Returns list of detected threat descriptions.
 */
function scanContentPatterns(buffer: Buffer, fileType: string): string[] {
  const threats: string[] = [];
  const patterns = DANGEROUS_PATTERNS[fileType as keyof typeof DANGEROUS_PATTERNS];

  if (!patterns) return threats;

  // For binary files (PDF, XLSX, images), convert to string for pattern matching
  // Use latin1 encoding to preserve byte values while making them searchable
  const content = fileType === 'csv'
    ? buffer.toString('utf-8')
    : buffer.toString('latin1');

  for (const pattern of patterns) {
    if (pattern.test(content)) {
      threats.push(`Suspicious pattern detected: ${pattern.source}`);
    }
  }

  return threats;
}

/**
 * Scan file using ClamAV daemon via TCP socket (INSTREAM protocol).
 *
 * ClamAV must be running and accessible at CLAMAV_HOST:CLAMAV_PORT.
 * If ClamAV is not configured, this step is skipped.
 *
 * @see https://docs.clamav.net/manual/Usage/Scanning.html#clamd
 */
async function scanWithClamAV(buffer: Buffer): Promise<{ scanned: boolean; threats: string[] }> {
  const host = process.env.CLAMAV_HOST;
  const port = parseInt(process.env.CLAMAV_PORT || '3310', 10);

  if (!host) {
    return { scanned: false, threats: [] };
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let response = '';

    // 10 second timeout for ClamAV
    socket.setTimeout(10_000);

    socket.on('connect', () => {
      // Send INSTREAM command — ClamAV expects:
      // "zINSTREAM\0" then chunks as [4-byte big-endian length][data] then [0x00000000]
      socket.write('zINSTREAM\0');

      // Send file data in chunks (max 2MB per chunk per ClamAV protocol)
      const chunkSize = 2 * 1024 * 1024;
      for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const chunk = buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length));
        const sizeHeader = Buffer.alloc(4);
        sizeHeader.writeUInt32BE(chunk.length);
        socket.write(sizeHeader);
        socket.write(chunk);
      }

      // Send terminator (zero-length chunk)
      const terminator = Buffer.alloc(4);
      terminator.writeUInt32BE(0);
      socket.write(terminator);
    });

    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('end', () => {
      // ClamAV response format: "stream: OK" or "stream: <virus name> FOUND"
      const threats: string[] = [];
      if (response.includes('FOUND')) {
        const match = response.match(/stream:\s*(.+)\s*FOUND/);
        threats.push(`ClamAV: ${match ? match[1].trim() : 'Malware detected'}`);
      }
      resolve({ scanned: true, threats });
    });

    socket.on('timeout', () => {
      logger.warn({ host, port }, 'ClamAV scan timed out');
      socket.destroy();
      resolve({ scanned: false, threats: [] });
    });

    socket.on('error', (err) => {
      logger.warn({ err, host, port }, 'ClamAV connection failed — skipping virus scan');
      socket.destroy();
      resolve({ scanned: false, threats: [] });
    });

    socket.connect(port, host);
  });
}

/**
 * Scan an uploaded file for security threats.
 *
 * Performs four layers of validation:
 * 1. File size check (prevent DoS via huge files)
 * 2. Magic bytes check (is this really a PDF/XLSX/JPEG/PNG/HEIC?)
 * 3. Content pattern scan (embedded scripts, macros, polyglots, CSV injection?)
 * 4. ClamAV virus scan (if configured)
 *
 * @param buffer - File content as Buffer
 * @param fileType - Expected file type ('pdf' | 'csv' | 'xlsx' | 'xls' | 'jpeg' | 'jpg' | 'png' | 'heic')
 * @returns ScanResult with safety verdict and threat details
 *
 * @example
 * ```typescript
 * const result = await scanFile(fileBuffer, 'jpeg');
 * if (!result.safe) {
 *   return reply.status(422).send({
 *     error: 'File rejected',
 *     threats: result.threats,
 *   });
 * }
 * ```
 */
export async function scanFile(buffer: Buffer, fileType: string): Promise<ScanResult> {
  const normalizedType = fileType.toLowerCase();
  const threats: string[] = [];

  // Layer 1: File size validation (SEC-44 - prevent OOM)
  if (buffer.length > MAX_FILE_SIZE) {
    threats.push(`File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum (10MB)`);
  }

  // Layer 2: Magic bytes validation
  const magicBytesValid = validateMagicBytes(buffer, normalizedType);
  if (!magicBytesValid) {
    threats.push(`File content does not match expected ${normalizedType.toUpperCase()} format`);
  }

  // Layer 3: Content pattern scanning
  const contentThreats = scanContentPatterns(buffer, normalizedType);
  threats.push(...contentThreats);

  // Layer 4: ClamAV virus scan (optional)
  const clamResult = await scanWithClamAV(buffer);
  threats.push(...clamResult.threats);

  const safe = threats.length === 0;

  if (!safe) {
    logger.warn(
      { fileType: normalizedType, threats, magicBytesValid, clamavScanned: clamResult.scanned },
      'File scan detected threats'
    );
  }

  return {
    safe,
    threats,
    fileType: normalizedType,
    magicBytesValid,
    clamavScanned: clamResult.scanned,
  };
}
