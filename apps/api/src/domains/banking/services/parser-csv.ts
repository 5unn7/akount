import Papa, { ParseResult as PapaParseResult } from 'papaparse';
import * as XLSX from 'xlsx';
import type { ColumnMappings, ExternalAccountData } from '../../../schemas/import';
import {
  type ParseResult,
  sanitizeCSVInjection,
  parseDate,
  parseAmount,
  parseAmountValue,
  generateTempId,
} from './parser-shared';

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
  const transactions = rows.map((row) => {
    const date = parseDate(row[mappings.date], dateFormat);
    // SECURITY: Sanitize description to prevent CSV injection
    const description = sanitizeCSVInjection(row[mappings.description]);
    const amount = parseAmount(row, mappings.amount);
    const balance = mappings.balance ? parseAmountValue(row[mappings.balance]) : undefined;

    return {
      tempId: generateTempId(),
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
      tempId: generateTempId(),
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
