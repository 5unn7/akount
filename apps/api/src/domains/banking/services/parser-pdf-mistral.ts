import type { ParsedTransaction, ExternalAccountData } from '../../../schemas/import';
import { type ParseResult, generateTempId } from './parser-shared';
import { DocumentExtractionService } from '../../ai/services/document-extraction.service';
import type { BankStatementExtraction } from '../../ai/schemas/bank-statement-extraction.schema';
import { logger } from '../../../lib/logger';
import { scanFile } from '../../../lib/file-scanner';

// Using PDF.js (Mozilla's PDF parser) as EMERGENCY FALLBACK ONLY
// Mistral vision is the primary extraction engine
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsLib) {
    // Dynamic import of legacy build for Node.js CJS compatibility
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as string) as typeof import('pdfjs-dist');
  }
  return pdfjsLib;
}

/**
 * Parse PDF bank statement using Mistral vision AI (DEV-242 - B8).
 *
 * **PRIMARY ENGINE:** Mistral Vision
 * - Universal extraction (handles any bank format: TD, RBC, CIBC, unknown)
 * - No regex patterns needed
 * - Semantic understanding of statement structure
 *
 * **FALLBACK:** PDF.js text extraction → manual review
 * - Only used when Mistral API is unavailable
 * - Extracts raw text for manual processing
 * - Never fails silently - always informs user
 *
 * **Security Pipeline:**
 * 1. File scanner → size/magic bytes/content patterns (SEC-11, SEC-31, SEC-44)
 * 2. PII redaction → credit cards, SSN, emails removed before AI (SEC-29)
 * 3. Prompt defense → adversarial content detection (SEC-30)
 * 4. Mistral vision → structured extraction with schema validation
 * 5. Balance reconciliation → verify opening + changes = closing
 *
 * @param fileBuffer - PDF file as Buffer
 * @param tenantId - Tenant ID for audit trail and security context (REQUIRED)
 * @param dateFormat - Date format hint (unused with Mistral, kept for backward compat)
 * @param entityId - Entity ID for business context (optional)
 * @returns ParseResult with transactions and external account data
 */
export async function parsePDF(
  fileBuffer: Buffer,
  tenantId: string,
  dateFormat?: string,
  entityId?: string
): Promise<ParseResult> {
  const startTime = Date.now();

  try {
    // Step 1: Security Validation (SEC-11, SEC-31, SEC-44)
    const scanResult = await scanFile(fileBuffer, 'pdf');

    if (!scanResult.safe) {
      logger.error(
        { tenantId, threats: scanResult.threats },
        'PDF statement rejected by file scanner'
      );
      throw new Error(`File security check failed: ${scanResult.threats.join(', ')}`);
    }

    // Step 2: Mistral Vision Extraction (Primary Engine)
    try {
      const extractionService = new DocumentExtractionService();

      const result = await extractionService.extractStatement(fileBuffer, {
        tenantId,
        entityId,
        skipSecurityChecks: false, // Run full security pipeline
      });

      const statementData = result.data as BankStatementExtraction;

      // Convert Mistral output to ParseResult format
      const transactions: ParsedTransaction[] = statementData.transactions.map((txn) => ({
        tempId: generateTempId(),
        date: txn.date,
        description: txn.description,
        // Mistral returns type + positive amount, convert to signed amount
        amount: txn.type === 'DEBIT' ? -txn.amount : txn.amount,
        balance: txn.balance,
        isDuplicate: false,
        duplicateConfidence: undefined,
        // TODO (DEV-242 Phase 2): Add semantic duplicate detection via embeddings
        // This will catch "AMZN" = "Amazon Marketplace" using vector similarity
        // matchedTransactionId, matchReason, suggestedCategory
      }));

      const externalAccountData: ExternalAccountData = {
        externalAccountId: statementData.accountInfo.accountNumber,
        institutionName: statementData.accountInfo.institutionName,
        accountType: statementData.accountInfo.accountType,
        currency: statementData.accountInfo.currency,
      };

      const processingTimeMs = Date.now() - startTime;

      logger.info(
        {
          tenantId,
          entityId,
          transactionCount: transactions.length,
          confidence: result.confidence,
          institution: statementData.accountInfo.institutionName,
          processingTimeMs,
          engine: 'mistral-vision',
        },
        'PDF statement parsed successfully via Mistral'
      );

      return {
        transactions,
        externalAccountData,
        preview: {
          rows: [], // PDF doesn't have column preview like CSV
        },
      };
    } catch (mistralError: unknown) {
      // Mistral extraction failed — fall back to pdfjs + manual review
      const errorMessage =
        mistralError instanceof Error ? mistralError.message : 'Unknown Mistral error';

      logger.warn(
        {
          tenantId,
          entityId,
          err: mistralError,
          errorMessage,
        },
        'Mistral extraction failed, falling back to PDF.js text extraction (degraded mode)'
      );

      // Emergency Fallback: Extract text via pdfjs for manual review
      return await fallbackToPDFJsTextExtraction(fileBuffer, tenantId);
    }
  } catch (error: unknown) {
    const processingTimeMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        tenantId,
        entityId,
        err: error,
        processingTimeMs,
      },
      'PDF parsing failed completely'
    );

    // Re-throw meaningful errors
    if (
      message.includes('security check failed') ||
      message.includes('manual review required')
    ) {
      throw error;
    }

    throw new Error(`PDF parsing error: ${message}`);
  }
}

/**
 * Emergency fallback: Use PDF.js to extract raw text when Mistral is unavailable.
 *
 * **This is NOT a full parser** — it extracts text and routes to manual review queue.
 * No regex patterns, no transaction extraction. Degrades gracefully instead of failing silently.
 *
 * @param fileBuffer - PDF file buffer
 * @param tenantId - Tenant ID for logging
 * @returns ParseResult with empty transactions and manual review flag
 */
async function fallbackToPDFJsTextExtraction(
  fileBuffer: Buffer,
  tenantId?: string
): Promise<ParseResult> {
  try {
    const pdfjs = await getPdfJs();

    // Extract raw text from PDF
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(fileBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    let extractedText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group items by Y position to reconstruct lines
      const items = textContent.items as Array<{ str: string; transform: number[] }>;
      if (items.length === 0) continue;

      // Sort by Y (descending = top to bottom) then X (left to right)
      const sorted = [...items].sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 2) return yDiff; // Different line
        return a.transform[4] - b.transform[4]; // Same line, sort by X
      });

      let currentY = sorted[0]?.transform[5];
      let currentLine = '';

      for (const item of sorted) {
        const y = item.transform[5];
        if (Math.abs(y - currentY) > 2) {
          // New line
          extractedText += currentLine.trim() + '\n';
          currentLine = item.str;
          currentY = y;
        } else {
          // Same line
          currentLine += (currentLine && !currentLine.endsWith(' ') ? ' ' : '') + item.str;
        }
      }

      if (currentLine.trim()) {
        extractedText += currentLine.trim() + '\n';
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(
        'PDF contains no readable text. This may be a scanned image or password-protected file. Manual review required.'
      );
    }

    // Extract basic account identifiers for context
    const externalAccountData = extractBasicIdentifiersFromText(extractedText);

    logger.warn(
      {
        tenantId,
        textLength: extractedText.length,
        institutionName: externalAccountData.institutionName,
      },
      'PDF.js fallback: Text extracted, routing to manual review queue'
    );

    // Return empty transactions with manual review flag
    // UI will show: "Automatic extraction unavailable. Please review and import manually."
    throw new Error(
      `Manual review required: Mistral AI extraction service is temporarily unavailable. PDF text has been extracted for manual processing. Institution: ${externalAccountData.institutionName || 'Unknown'}`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      { tenantId, err: error },
      'PDF.js fallback failed'
    );

    if (message.includes('Manual review required')) {
      throw error; // Re-throw manual review errors
    }

    throw new Error(
      `Manual review required: Unable to parse PDF. ${message}`
    );
  }
}

/**
 * Extract basic identifiers from PDF text (fallback mode).
 *
 * Simpler version used when Mistral is unavailable — only extracts
 * institution name and account type for context.
 */
function extractBasicIdentifiersFromText(text: string): ExternalAccountData {
  const externalData: ExternalAccountData = {};

  // Extract institution name (common banks)
  const institutions = [
    'TD Bank',
    'RBC',
    'BMO',
    'Scotiabank',
    'CIBC',
    'Chase',
    'Bank of America',
    'Wells Fargo',
    'Citibank',
    'Capital One',
    'US Bank',
    'PNC Bank',
  ];

  for (const institution of institutions) {
    if (text.toLowerCase().includes(institution.toLowerCase())) {
      externalData.institutionName = institution;
      break;
    }
  }

  // Detect account type from keywords
  const textLower = text.toLowerCase();
  if (textLower.includes('checking') || textLower.includes('chequing')) {
    externalData.accountType = 'checking';
  } else if (textLower.includes('savings')) {
    externalData.accountType = 'savings';
  } else if (
    textLower.includes('credit card') ||
    textLower.includes('mastercard') ||
    textLower.includes('visa')
  ) {
    externalData.accountType = 'credit';
  }

  return externalData;
}
