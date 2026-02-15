import Papa, { ParseResult as PapaParseResult } from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParsedTransaction, ExternalAccountData, ColumnMappings } from '../../../schemas/import';
import { randomUUID } from 'crypto';

// Using PDF.js (Mozilla's PDF parser - more reliable)
// Use dynamic import to handle ESM/CJS compatibility
let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    // @ts-ignore
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

/**
 * Parser service for extracting transactions from various file formats
 */

/**
 * SECURITY: Sanitize string to prevent CSV injection attacks
 * Excel formulas start with =, +, -, @, \t, \r
 * These can be used for code execution or data exfiltration
 */
function sanitizeCSVInjection(value: string | undefined | null): string {
  if (!value) return '';

  const trimmed = value.trim();

  // Check if string starts with dangerous characters
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some((char) => trimmed.startsWith(char))) {
    // Prepend single quote to escape the formula
    // Excel will treat it as literal text
    return "'" + trimmed;
  }

  return trimmed;
}

interface ParseResult {
  transactions: ParsedTransaction[];
  columns?: string[];
  suggestedMappings?: ColumnMappings;
  externalAccountData?: ExternalAccountData;
  preview?: { rows: Array<Record<string, string>> };
}

/**
 * Parse CSV file and extract transactions
 */
export function parseCSV(
  fileBuffer: Buffer,
  columnMappings?: ColumnMappings,
  dateFormat?: string
): ParseResult {
  const fileContent = fileBuffer.toString('utf-8');

  // Parse CSV with Papa Parse
  const parseResult: PapaParseResult<Record<string, string>> = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep everything as strings for manual parsing
  });

  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
  }

  const rows = parseResult.data;
  const columns = parseResult.meta.fields || [];

  if (rows.length === 0) {
    throw new Error('CSV file contains no data rows');
  }

  // Auto-detect column mappings if not provided
  const mappings = columnMappings || detectColumnMappings(columns);

  // Extract external account identifiers from CSV metadata/headers
  const externalAccountData = extractExternalIdentifiers(rows, columns);

  // Parse transactions
  const transactions = rows.map((row, index) => {
    const date = parseDate(row[mappings.date], dateFormat);
    // SECURITY: Sanitize description to prevent CSV injection
    const description = sanitizeCSVInjection(row[mappings.description]);
    const amount = parseAmount(row, mappings.amount);
    const balance = mappings.balance ? parseAmountValue(row[mappings.balance]) : undefined;

    return {
      tempId: `temp_${randomUUID()}`,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      description,
      amount,
      balance,
      isDuplicate: false, // Will be set later by duplicate detection
      duplicateConfidence: undefined,
    };
  });

  // Preview: first 5 rows for verification
  // SECURITY: Sanitize all preview fields to prevent CSV injection
  const preview = {
    rows: rows.slice(0, 5).map((row) => {
      const sanitizedRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        sanitizedRow[key] = sanitizeCSVInjection(value);
      }
      return sanitizedRow;
    }),
  };

  return {
    transactions,
    columns,
    suggestedMappings: mappings,
    externalAccountData,
    preview,
  };
}

/**
 * Parse XLSX/XLS file by converting the first sheet to CSV rows,
 * then using the same column detection and parsing logic as CSV.
 */
export function parseXLSX(
  fileBuffer: Buffer,
  columnMappings?: ColumnMappings,
  dateFormat?: string
): ParseResult {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('XLSX file contains no sheets');
  }

  const sheet = workbook.Sheets[sheetName];
  // Convert sheet to array of objects (same format as Papa Parse header mode)
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    raw: false, // Return formatted strings (not raw numbers)
    defval: '',
  });

  if (rows.length === 0) {
    throw new Error('XLSX file contains no data rows');
  }

  const columns = Object.keys(rows[0]);

  // Reuse CSV column detection + parsing
  const mappings = columnMappings || detectColumnMappings(columns);
  const externalAccountData = extractExternalIdentifiers(rows, columns);

  const transactions = rows.map((row) => {
    const date = parseDate(String(row[mappings.date] || ''), dateFormat);
    const description = sanitizeCSVInjection(String(row[mappings.description] || ''));
    const amount = parseAmount(row as Record<string, string>, mappings.amount);
    const balance = mappings.balance ? parseAmountValue(String(row[mappings.balance] || '')) : undefined;

    return {
      tempId: `temp_${randomUUID()}`,
      date: date.toISOString().split('T')[0],
      description,
      amount,
      balance,
      isDuplicate: false,
      duplicateConfidence: undefined,
    };
  });

  const preview = {
    rows: rows.slice(0, 5).map((row) => {
      const sanitizedRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        sanitizedRow[key] = sanitizeCSVInjection(String(value));
      }
      return sanitizedRow;
    }),
  };

  return {
    transactions,
    columns,
    suggestedMappings: mappings,
    externalAccountData,
    preview,
  };
}

/**
 * Auto-detect CSV column mappings based on common header names.
 * Uses exact-match-first strategy to avoid false positives
 * (e.g., "Shipping and Handling Amount" matching 'amount').
 */
function detectColumnMappings(columns: string[]): ColumnMappings {
  const normalizedColumns = columns.map((c) => c.toLowerCase().trim());

  // Helper: find column by exact match first, then substring
  function findColumn(keywords: string[]): string | undefined {
    // Phase 1: exact match (most reliable)
    const exactIdx = normalizedColumns.findIndex((c) => keywords.some((k) => c === k));
    if (exactIdx !== -1) return columns[exactIdx];

    // Phase 2: substring match (broader, but may have false positives)
    const subIdx = normalizedColumns.findIndex((c) => keywords.some((k) => c.includes(k)));
    if (subIdx !== -1) return columns[subIdx];

    return undefined;
  }

  // Detect date column
  const dateKeywords = ['date', 'transaction date', 'posting date', 'trans date', 'value date'];
  const dateColumn = findColumn(dateKeywords) || columns[0];

  // Detect description column
  // Note: 'transaction' removed — matches "Transaction ID" via substring
  const descKeywords = [
    'description', 'merchant', 'details', 'memo', 'payee', 'name', 'subject',
    'item title', 'narrative',
  ];
  const descColumn = findColumn(descKeywords) || columns[1];

  // Detect amount columns
  // Step 1: Check for separate debit/credit columns (specific keywords only)
  const debitKeywords = ['debit', 'withdrawal', 'payments', 'money out', 'debit amount'];
  const creditKeywords = ['credit', 'deposit', 'deposits', 'money in', 'credit amount'];

  const debitColumn = findColumn(debitKeywords);
  const creditColumn = findColumn(creditKeywords);

  let amountMapping: string;
  if (debitColumn && creditColumn && debitColumn !== creditColumn) {
    // Two-column format (debit and credit separate)
    amountMapping = `${debitColumn}|${creditColumn}`;
  } else {
    // Step 2: Single amount column — 'gross'/'net' for PayPal, 'amount' for others
    const amountKeywords = ['gross', 'net', 'amount', 'total', 'sum'];
    amountMapping = findColumn(amountKeywords) || debitColumn || creditColumn || columns[2];
  }

  // Detect balance column (optional)
  const balanceKeywords = ['balance', 'running balance', 'account balance', 'closing balance'];
  const balanceColumn = findColumn(balanceKeywords);

  return {
    date: dateColumn,
    description: descColumn,
    amount: amountMapping,
    balance: balanceColumn,
  };
}

/**
 * Extract external account identifiers from CSV (for future bank connection matching)
 */
function extractExternalIdentifiers(
  rows: Array<Record<string, string>>,
  columns: string[]
): ExternalAccountData {
  const externalData: ExternalAccountData = {};

  // Try to extract institution name from first few rows (sometimes in header)
  const firstRow = rows[0];
  const institutionKeywords = ['bank', 'credit union', 'financial'];

  for (const [key, value] of Object.entries(firstRow)) {
    const lowerValue = value?.toLowerCase() || '';
    if (institutionKeywords.some((keyword) => lowerValue.includes(keyword))) {
      externalData.institutionName = value.trim();
      break;
    }
  }

  // Try to extract account number (last 4 digits) from column names or values
  const accountNumberPattern = /\d{4}$/; // Last 4 digits
  for (const col of columns) {
    const match = col.match(accountNumberPattern);
    if (match) {
      externalData.externalAccountId = `xxxx${match[0]}`;
      break;
    }
  }

  // Infer account type from keywords in descriptions
  const descriptions = rows.map((r) => Object.values(r).join(' ').toLowerCase());
  const combinedText = descriptions.slice(0, 10).join(' '); // First 10 rows

  if (combinedText.includes('checking') || combinedText.includes('chequing')) {
    externalData.accountType = 'checking';
  } else if (combinedText.includes('savings')) {
    externalData.accountType = 'savings';
  } else if (
    combinedText.includes('credit card') ||
    combinedText.includes('mastercard') ||
    combinedText.includes('visa')
  ) {
    externalData.accountType = 'credit';
  }

  return externalData;
}

/**
 * Parse date string in various formats
 */
function parseDate(dateStr: string, format?: string): Date {
  if (!dateStr) {
    throw new Error('Date is required');
  }

  const cleanDate = dateStr.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return new Date(cleanDate);
  }

  // Try MM/DD/YYYY or DD/MM/YYYY
  const parts = cleanDate.split(/[\/-]/);
  if (parts.length === 3) {
    let month: number, day: number, year: number;

    if (format === 'DD/MM/YYYY') {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      // Default to MM/DD/YYYY
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    const date = new Date(year, month - 1, day);

    // Validate date
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    return date;
  }

  throw new Error(`Unsupported date format: ${dateStr}`);
}

/**
 * Parse amount from CSV row (handles single column or debit/credit columns)
 */
function parseAmount(row: Record<string, string>, amountMapping: string): number {
  if (amountMapping.includes('|')) {
    // Two-column format: debit|credit
    const [debitCol, creditCol] = amountMapping.split('|');
    const debitValue = row[debitCol]?.trim();
    const creditValue = row[creditCol]?.trim();

    if (debitValue && debitValue !== '') {
      return -1 * parseAmountValue(debitValue); // Debit is negative
    } else if (creditValue && creditValue !== '') {
      return parseAmountValue(creditValue); // Credit is positive
    } else {
      return 0;
    }
  } else {
    // Single column format
    return parseAmountValue(row[amountMapping]);
  }
}

/**
 * Parse amount string to integer cents
 */
function parseAmountValue(amountStr: string | undefined): number {
  if (!amountStr || amountStr.trim() === '') {
    return 0;
  }

  // Remove currency symbols, spaces, and commas
  const cleaned = amountStr
    .replace(/[$€£¥₹,\s]/g, '')
    .replace(/[()]/g, '') // Remove parentheses (sometimes used for negatives)
    .trim();

  // Check if negative (starts with -, or enclosed in parens)
  const isNegative = amountStr.includes('-') || amountStr.includes('(');

  // Parse as float
  const floatValue = parseFloat(cleaned);

  if (isNaN(floatValue)) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  // Convert to cents (integer)
  const cents = Math.round(floatValue * 100);

  return isNegative ? -Math.abs(cents) : cents;
}

/**
 * Parse PDF bank statement and extract transactions
 *
 * PDF parsing is more complex than CSV - uses regex patterns to find transactions
 */
export async function parsePDF(fileBuffer: Buffer, dateFormat?: string): Promise<ParseResult> {
  try {
    // Load PDF.js dynamically
    const pdfjs = await getPdfJs();

    // Use PDF.js to extract text
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(fileBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    let text = '';

    // Extract text from all pages, preserving line structure using Y positions
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group items by Y position to reconstruct lines
      const items = textContent.items as any[];
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
          text += currentLine.trim() + '\n';
          currentLine = item.str;
          currentY = y;
        } else {
          // Same line - add space if needed
          currentLine += (currentLine && !currentLine.endsWith(' ') ? ' ' : '') + item.str;
        }
      }
      // Don't forget the last line
      if (currentLine.trim()) {
        text += currentLine.trim() + '\n';
      }
    }

    if (!text || text.trim().length === 0) {
      throw new Error(
        'PDF contains no readable text. Please ensure the file is not password-protected or image-only.'
      );
    }

    // Extract external account identifiers from PDF text
    const externalAccountData = extractExternalIdentifiersFromText(text);

    // Parse transactions using common bank statement patterns
    const transactions = parseTransactionsFromPDFText(text, dateFormat);

    if (transactions.length === 0) {
      throw new Error(
        'No transactions found in PDF. Please ensure this is a valid bank statement with transaction details.'
      );
    }

    return {
      transactions,
      externalAccountData,
      preview: {
        rows: [], // PDF doesn't have column preview like CSV
      },
    };
  } catch (error: unknown) {
    if (
      error.message?.includes('No transactions found') ||
      error.message?.includes('no readable text')
    ) {
      throw error;
    }
    throw new Error(`PDF parsing error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Detect statement period (start/end years and start month) from PDF text
 *
 * Handles formats like:
 * - "August 5 to September 4, 2025"
 * - "November 17, 2025 to December 17, 2025"
 * - "June 18, 2025 - July 17, 2025"
 */
function detectStatementPeriod(text: string): {
  startYear: number;
  endYear: number;
  startMonth?: number;
} {
  const monthNames =
    'January|February|March|April|May|June|July|August|September|October|November|December';

  const MONTH_TO_IDX: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  // Try to match "Month DD, YYYY to Month DD, YYYY" pattern
  const periodRegex = new RegExp(
    `(${monthNames})\\s+\\d{1,2},?\\s+(\\d{4})\\s+(?:to|through|-)\\s+(${monthNames})\\s+\\d{1,2},?\\s+(\\d{4})`,
    'i'
  );
  const periodMatch = text.match(periodRegex);

  if (periodMatch) {
    const startMonth = MONTH_TO_IDX[periodMatch[1].toLowerCase()];
    return {
      startYear: parseInt(periodMatch[2], 10),
      endYear: parseInt(periodMatch[4], 10),
      startMonth,
    };
  }

  // Try "Month DD to Month DD, YYYY" (single year at end)
  const singleYearRegex = new RegExp(
    `(${monthNames})\\s+\\d{1,2}\\s+(?:to|through|-)\\s+(?:${monthNames})\\s+\\d{1,2},?\\s+(\\d{4})`,
    'i'
  );
  const singleYearMatch = text.match(singleYearRegex);
  if (singleYearMatch) {
    const startMonth = MONTH_TO_IDX[singleYearMatch[1].toLowerCase()];
    const year = parseInt(singleYearMatch[2], 10);
    return { startYear: year, endYear: year, startMonth };
  }

  // Try abbreviated months: "JUN 28 TO JUL 28, 2025" or "STATEMENT FROM JUN 28 TO JUL 28, 2025"
  const SHORT_MONTH_TO_IDX: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const abbrevPeriodRegex =
    /([A-Za-z]{3})\s+\d{1,2},?\s+(\d{4})\s+(?:TO|to|through|-)\s+([A-Za-z]{3})\s+\d{1,2},?\s+(\d{4})/;
  const abbrevMatch = text.match(abbrevPeriodRegex);
  if (abbrevMatch) {
    const sm = SHORT_MONTH_TO_IDX[abbrevMatch[1].toLowerCase()];
    if (sm !== undefined) {
      return {
        startYear: parseInt(abbrevMatch[2], 10),
        endYear: parseInt(abbrevMatch[4], 10),
        startMonth: sm,
      };
    }
  }

  // Try "MON DD TO MON DD, YYYY" (abbreviated months, single year at end)
  const abbrevSingleYearRegex =
    /([A-Za-z]{3})\s+\d{1,2}\s+(?:TO|to|through|-)\s+([A-Za-z]{3})\s+\d{1,2},?\s+(\d{4})/;
  const abbrevSingleMatch = text.match(abbrevSingleYearRegex);
  if (abbrevSingleMatch) {
    const sm = SHORT_MONTH_TO_IDX[abbrevSingleMatch[1].toLowerCase()];
    if (sm !== undefined) {
      const yr = parseInt(abbrevSingleMatch[3], 10);
      return { startYear: yr, endYear: yr, startMonth: sm };
    }
  }

  // Fallback: find any year near a month name
  const yearMatch = text.match(
    new RegExp(`(?:${monthNames})\\s+\\d{1,2}.*?(\\d{4})`, 'i')
  );
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  return { startYear: year, endYear: year };
}

/**
 * Extract transactions from PDF text using regex patterns
 *
 * Supports multiple bank statement formats:
 * - CIBC credit card: "Jan 04  Jan 04  DESCRIPTION  1,234.56"
 * - RBC credit card: "JUN 30  JUN 30  DESCRIPTION  $29.00"
 * - RBC chequing: "19 Nov  Description  1,299.12  28,716.28"
 * - Generic: "MM/DD/YYYY DESCRIPTION $1,234.56"
 */
function parseTransactionsFromPDFText(
  text: string,
  dateFormat?: string
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Detect statement period for year assignment
  const { startYear, endYear, startMonth } = detectStatementPeriod(text);

  const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // Determine correct year for a given month
  function getYearForMonth(monthIdx: number): number {
    if (startYear === endYear) return startYear;
    // Statement spans year boundary (e.g., Nov 2025 to Jan 2026)
    // Months >= startMonth use startYear, earlier months use endYear
    if (startMonth !== undefined) {
      return monthIdx >= startMonth ? startYear : endYear;
    }
    return endYear;
  }

  // Skip lines that are headers, totals, or non-transaction rows
  const skipPatterns = [
    /^total\s/i, /^previous\s+balance/i, /^payments\s+-/i,
    /^purchases\s+\$/i, /^interest\s+charged/i, /^fees\s+charged/i,
    /^cash\s+advances/i, /^other\s+credits/i,
    /^total\s+credits/i, /^total\s+charges/i, /^total\s+balance/i,
    /^amount\s+due/i, /^minimum\s+payment/i, /^available\s/i,
    /^summary\s/i, /^annual\s+interest/i, /^trans\.?\s+post/i, /^date\s+date/i,
    /^subtotal\b/i,
    /^foreign\s+currency/i,
    /^\d{10,}$/, // Reference/card numbers (long digit strings)
    /^balance\s+forward/i,
    /^opening\s+balance/i, /^closing\s+balance/i,
    /^credit\s+limit/i, /^credit\s+available/i,
    /^new\s+balance/i, /^previous\s+statement/i,
    /^page\s+\d/i,
  ];

  // Amount regex: optional negative, optional $, digits with commas, decimal
  // Negative lookahead prevents partial matches like "25.99%" or "1,234.567"
  const amtRegex = /(-?\$?[\d,]+\.\d{2})(?!\d|[A-Za-z%])/;

  // Date prefix patterns — match dates at start of line
  // Pattern A: Two-date credit card — "Mon DD  Mon DD  ..."
  const datePrefixA = /^([A-Za-z]{3})\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{1,2})\s+/;
  // Pattern A2: Single-date credit card — "Mon DD  ..."
  const datePrefixA2 = /^([A-Za-z]{3})\s+(\d{1,2})\s+/;

  // Pattern C: Chequing — "DD Mon  Description  Amount  [Balance]"
  const amtReStr = '(-?\\$?[\\d,]+\\.\\d{2})(?!\\d|[A-Za-z%])';
  const patternC = new RegExp(
    `^(\\d{1,2})\\s+([A-Za-z]{3})\\s+(.+?)\\s{2,}${amtReStr}(?:\\s+${amtReStr})?`
  );

  // Pattern D: Sub-item (dateless) — "Description  Amount  [Balance]"
  // For RBC chequing sub-items that use the previous transaction's date
  const patternD = new RegExp(
    `^([A-Za-z].+?)\\s{2,}${amtReStr}(?:\\s+${amtReStr})?`
  );

  // Track the last chequing date for sub-items (dateless lines)
  let lastChequingDate: string | null = null;

  // Track whether we found any "DD Mon" (chequing-style) transactions
  let isChequingFormat = false;

  // Extract opening balance for chequing statements (used for sign detection)
  const openingBalanceMatch = text.match(/opening\s+balance.*?[\s$]([\d,]+\.\d{2})/i);
  const openingBalance = openingBalanceMatch ? parseAmountValue(openingBalanceMatch[1]) : null;

  // Pattern B: Generic numeric date — "MM/DD/YYYY Description Amount"
  const genericDatePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
  const genericAmountPattern = /([+-]?\$?\s*\d{1,3}(?:,\d{3})*\.\d{2})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip summary/header lines
    if (skipPatterns.some((p) => p.test(line))) continue;

    // --- Try Pattern A: Credit card "Mon DD  Mon DD  Description  Amount" ---
    // Uses "find first amount" approach to handle multicolumn PDFs
    const matchA = line.match(datePrefixA);
    if (matchA) {
      try {
        const [fullPrefix, transMonth, transDay] = matchA;
        const monthIdx = MONTHS[transMonth.toLowerCase()];
        if (monthIdx === undefined) continue;

        // Find FIRST amount after the date prefix
        const rest = line.substring(fullPrefix.length);
        const firstAmount = rest.match(amtRegex);
        if (firstAmount && firstAmount.index !== undefined) {
          const description = rest.substring(0, firstAmount.index).trim();
          const amountStr = firstAmount[1];

          if (description.length > 0) {
            const year = getYearForMonth(monthIdx);
            const date = new Date(year, monthIdx, parseInt(transDay, 10));
            const amount = parseAmountValue(amountStr);

            transactions.push({
              tempId: `temp_${randomUUID()}`,
              date: date.toISOString().split('T')[0],
              description: description.replace(/\s+/g, ' ').trim(),
              amount,
              balance: undefined,
              isDuplicate: false,
              duplicateConfidence: undefined,
            });
            continue;
          }
        }
      } catch {
        // Fall through to next pattern
      }
    }

    // --- Try Pattern A2: Credit card single-date — "Mon DD  Description  Amount" ---
    const matchA2 = line.match(datePrefixA2);
    if (matchA2) {
      try {
        const [fullPrefix, transMonth, transDay] = matchA2;
        const monthIdx = MONTHS[transMonth.toLowerCase()];
        if (monthIdx === undefined) continue;

        // Find FIRST amount after the date prefix
        const rest = line.substring(fullPrefix.length);
        const firstAmount = rest.match(amtRegex);
        if (firstAmount && firstAmount.index !== undefined) {
          const description = rest.substring(0, firstAmount.index).trim();
          const amountStr = firstAmount[1];

          if (description.length > 0) {
            const year = getYearForMonth(monthIdx);
            const date = new Date(year, monthIdx, parseInt(transDay, 10));
            const amount = parseAmountValue(amountStr);

            transactions.push({
              tempId: `temp_${randomUUID()}`,
              date: date.toISOString().split('T')[0],
              description: description.replace(/\s+/g, ' ').trim(),
              amount,
              balance: undefined,
              isDuplicate: false,
              duplicateConfidence: undefined,
            });
            continue;
          }
        }
      } catch {
        // Fall through
      }
    }

    // --- Try Pattern C: Chequing "DD Mon  Description  Amount  [Balance]" ---
    const matchC = line.match(patternC);
    if (matchC) {
      try {
        const [, dayStr, monthStr, description, amountStr, balanceStr] = matchC;
        const monthIdx = MONTHS[monthStr.toLowerCase()];
        if (monthIdx === undefined) continue;

        const year = getYearForMonth(monthIdx);
        const date = new Date(year, monthIdx, parseInt(dayStr, 10));
        const amount = parseAmountValue(amountStr);
        const balance = balanceStr ? parseAmountValue(balanceStr) : undefined;

        // Collect continuation lines (wrapped text without dates/amounts)
        let fullDescription = description.replace(/\s+/g, ' ').trim();
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // Stop if next line is a new transaction, skip pattern, or has amounts at end
          if (
            nextLine.match(/^\d{1,2}\s+[A-Za-z]{3}\s/) || // DD Mon
            nextLine.match(/^[A-Za-z]{3}\s+\d{1,2}\s/) || // Mon DD
            nextLine.match(genericDatePattern) ||
            skipPatterns.some((p) => p.test(nextLine)) ||
            nextLine.length === 0 ||
            /^\d{10,}$/.test(nextLine) || // Reference numbers
            /[\d,]+\.\d{2}\s*$/.test(nextLine) // Ends with an amount
          ) {
            break;
          }
          // It's a continuation line — append to description
          fullDescription += ' ' + nextLine.replace(/\s+/g, ' ').trim();
          i++;
        }

        const dateStr = date.toISOString().split('T')[0];
        lastChequingDate = dateStr; // Track for sub-items
        isChequingFormat = true;

        transactions.push({
          tempId: `temp_${randomUUID()}`,
          date: dateStr,
          description: fullDescription,
          amount,
          balance,
          isDuplicate: false,
          duplicateConfidence: undefined,
        });
        continue;
      } catch {
        // Fall through
      }
    }

    // --- Date-only header line: "DD Mon  Description" (no amount) ---
    // Updates lastChequingDate for subsequent sub-items (Pattern D)
    // e.g., "24 Nov  Direct Deposits (PDS) service total"
    {
      const dateOnlyMatch = line.match(/^(\d{1,2})\s+([A-Za-z]{3})\s/);
      if (dateOnlyMatch) {
        const monthIdx = MONTHS[dateOnlyMatch[2].toLowerCase()];
        if (monthIdx !== undefined) {
          const year = getYearForMonth(monthIdx);
          const date = new Date(year, monthIdx, parseInt(dateOnlyMatch[1], 10));
          lastChequingDate = date.toISOString().split('T')[0];
          isChequingFormat = true;
          // Don't continue — this line has no transaction, just updates the date
        }
      }
    }

    // --- Try Pattern D: Sub-item (dateless line with amount) ---
    // RBC chequing has sub-items like "PAD CCRA  CANADA  879.05  27,837.23"
    // These use the previous dated transaction's date
    if (lastChequingDate) {
      const matchD = line.match(patternD);
      if (matchD) {
        const [, description, amountStr, balanceStr] = matchD;
        // Validate it looks like a real description (not a header/summary)
        const descTrimmed = description.replace(/\s+/g, ' ').trim();
        if (descTrimmed.length > 2 && descTrimmed.length < 120) {
          try {
            const amount = parseAmountValue(amountStr);
            const balance = balanceStr ? parseAmountValue(balanceStr) : undefined;

            transactions.push({
              tempId: `temp_${randomUUID()}`,
              date: lastChequingDate,
              description: descTrimmed,
              amount,
              balance,
              isDuplicate: false,
              duplicateConfidence: undefined,
            });
            continue;
          } catch {
            // Fall through
          }
        }
      }
    }

    // --- Try Pattern B: Generic numeric date format ---
    const dateMatch = line.match(genericDatePattern);
    const amountMatches = line.match(new RegExp(genericAmountPattern, 'g'));

    if (dateMatch && amountMatches && amountMatches.length > 0) {
      try {
        const dateStr = dateMatch[1];
        const date = parseDate(dateStr, dateFormat);

        const amountStr = amountMatches[amountMatches.length - 1];
        const amount = parseAmountValue(amountStr);

        const balance =
          amountMatches.length > 1
            ? parseAmountValue(amountMatches[amountMatches.length - 2])
            : undefined;

        const dateIndex = line.indexOf(dateMatch[0]);
        const amountIndex = line.lastIndexOf(amountStr);
        let description = line.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
        description = description.replace(/\s+/g, ' ').trim();

        if (description.length === 0) description = 'Transaction';

        transactions.push({
          tempId: `temp_${randomUUID()}`,
          date: date.toISOString().split('T')[0],
          description,
          amount,
          balance,
          isDuplicate: false,
          duplicateConfidence: undefined,
        });
      } catch {
        continue;
      }
    }
  }

  // --- Post-processing: Determine sign for chequing transactions using running balance ---
  // Credit card amounts are handled by adjustAmountForAccountType() in import.service.ts,
  // but chequing/bank statements need inline sign detection because the PDF doesn't
  // distinguish debit vs credit columns in flattened text.
  //
  // Algorithm: Group consecutive transactions until we find one with a balance.
  // Then use the known running balance and the target balance to determine which
  // sign combination (+/-) for each transaction produces the correct result.
  // For small groups (<=8), try all 2^n combinations. For larger groups, fall back
  // to checking all-debit vs all-credit.
  if (isChequingFormat && openingBalance !== null && transactions.length > 0) {
    let runningBalance = openingBalance;
    let groupStart = 0;

    while (groupStart < transactions.length) {
      // Find end of group: walk forward until we find a transaction with a balance
      let groupEnd = groupStart;
      while (groupEnd < transactions.length && transactions[groupEnd].balance === undefined) {
        groupEnd++;
      }

      if (groupEnd >= transactions.length) {
        // No balance available — default all remaining to debit
        for (let j = groupStart; j < transactions.length; j++) {
          transactions[j].amount = -Math.abs(transactions[j].amount);
        }
        break;
      }

      const groupSize = groupEnd - groupStart + 1;
      const endBalance = transactions[groupEnd].balance!;
      const netChange = endBalance - runningBalance;

      // Collect absolute amounts for the group
      const amounts: number[] = [];
      for (let j = groupStart; j <= groupEnd; j++) {
        amounts.push(Math.abs(transactions[j].amount));
      }

      if (groupSize === 1) {
        // Simple case: single transaction with balance
        const diffDebit = Math.abs(runningBalance - amounts[0] - endBalance);
        const diffCredit = Math.abs(runningBalance + amounts[0] - endBalance);
        if (diffDebit <= diffCredit) {
          transactions[groupStart].amount = -amounts[0]; // debit
        }
        // else: stays positive (credit)
      } else if (groupSize <= 8) {
        // Brute force: try all 2^n sign combinations to find the one matching netChange
        // Each bit: 0 = credit (+), 1 = debit (-)
        const n = groupSize;
        let bestMask = 0;
        let bestDiff = Infinity;

        for (let mask = 0; mask < (1 << n); mask++) {
          let sum = 0;
          for (let bit = 0; bit < n; bit++) {
            sum += (mask & (1 << bit)) ? -amounts[bit] : amounts[bit];
          }
          const diff = Math.abs(sum - netChange);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestMask = mask;
          }
        }

        // Apply best match (tolerance: 2 cents for rounding)
        if (bestDiff <= 2) {
          for (let bit = 0; bit < n; bit++) {
            const idx = groupStart + bit;
            if (bestMask & (1 << bit)) {
              transactions[idx].amount = -amounts[bit]; // debit
            }
            // else: stays positive (credit)
          }
        } else {
          // No combination matches — default all to debit
          for (let j = groupStart; j <= groupEnd; j++) {
            transactions[j].amount = -Math.abs(transactions[j].amount);
          }
        }
      } else {
        // Group too large for brute force — check all-debit vs all-credit
        const totalAmount = amounts.reduce((s, a) => s + a, 0);
        const diffDebit = Math.abs(runningBalance - totalAmount - endBalance);
        const diffCredit = Math.abs(runningBalance + totalAmount - endBalance);
        const isDebit = diffDebit <= diffCredit;
        for (let j = groupStart; j <= groupEnd; j++) {
          if (isDebit) {
            transactions[j].amount = -Math.abs(transactions[j].amount);
          }
        }
      }

      runningBalance = endBalance;
      groupStart = groupEnd + 1;
    }
  }

  return transactions;
}

/**
 * Extract external identifiers from PDF text (institution, account number, etc.)
 */
function extractExternalIdentifiersFromText(text: string): ExternalAccountData {
  const externalData: ExternalAccountData = {};

  // Extract account number (last 4 digits pattern)
  const accountNumberPattern = /account.*?(\d{4})/i;
  const accountMatch = text.match(accountNumberPattern);
  if (accountMatch) {
    externalData.externalAccountId = `xxxx${accountMatch[1]}`;
  }

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

/**
 * Normalize institution name for matching (used by accountMatcher)
 */
export function normalizeInstitutionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .replace(/bank|banking|creditunion|cu|financial|institution/g, '') // Remove common suffixes
    .trim();
}
