import Papa from 'papaparse';
import type { ParsedTransaction, ExternalAccountData, ColumnMappings } from '../schemas/import';
import { randomUUID } from 'crypto';

/**
 * Parser service for extracting transactions from various file formats
 */

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
  const parseResult = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep everything as strings for manual parsing
    encoding: 'utf-8',
  });

  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
  }

  const rows = parseResult.data as Array<Record<string, string>>;
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
    const description = row[mappings.description]?.trim() || '';
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
  const preview = {
    rows: rows.slice(0, 5),
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
 * Auto-detect CSV column mappings based on common header names
 */
function detectColumnMappings(columns: string[]): ColumnMappings {
  const normalizedColumns = columns.map(c => c.toLowerCase().trim());

  // Detect date column
  const dateKeywords = ['date', 'transaction date', 'posting date', 'trans date', 'value date'];
  const dateColumn = columns.find((_, i) =>
    dateKeywords.some(keyword => normalizedColumns[i].includes(keyword))
  ) || columns[0]; // Default to first column if no match

  // Detect description column
  const descKeywords = ['description', 'merchant', 'details', 'memo', 'payee', 'transaction'];
  const descColumn = columns.find((_, i) =>
    descKeywords.some(keyword => normalizedColumns[i].includes(keyword))
  ) || columns[1]; // Default to second column

  // Detect amount columns (can be single or debit/credit pair)
  const debitKeywords = ['debit', 'withdrawal', 'payments', 'amount'];
  const creditKeywords = ['credit', 'deposit', 'deposits', 'amount'];

  const debitColumn = columns.find((_, i) =>
    debitKeywords.some(keyword => normalizedColumns[i].includes(keyword))
  );

  const creditColumn = columns.find((_, i) =>
    creditKeywords.some(keyword => normalizedColumns[i].includes(keyword))
  );

  let amountMapping: string;
  if (debitColumn && creditColumn) {
    // Two-column format (debit and credit separate)
    amountMapping = `${debitColumn}|${creditColumn}`;
  } else if (debitColumn) {
    amountMapping = debitColumn;
  } else if (creditColumn) {
    amountMapping = creditColumn;
  } else {
    // Fallback: find column with "amount" keyword
    amountMapping = columns.find((_, i) =>
      normalizedColumns[i].includes('amount')
    ) || columns[2]; // Default to third column
  }

  // Detect balance column (optional)
  const balanceKeywords = ['balance', 'running balance', 'account balance'];
  const balanceColumn = columns.find((_, i) =>
    balanceKeywords.some(keyword => normalizedColumns[i].includes(keyword))
  );

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
    if (institutionKeywords.some(keyword => lowerValue.includes(keyword))) {
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
  const descriptions = rows.map(r => Object.values(r).join(' ').toLowerCase());
  const combinedText = descriptions.slice(0, 10).join(' '); // First 10 rows

  if (combinedText.includes('checking') || combinedText.includes('chequing')) {
    externalData.accountType = 'checking';
  } else if (combinedText.includes('savings')) {
    externalData.accountType = 'savings';
  } else if (combinedText.includes('credit card') || combinedText.includes('mastercard') || combinedText.includes('visa')) {
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
 * Normalize institution name for matching (used by accountMatcher)
 */
export function normalizeInstitutionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .replace(/bank|banking|creditunion|cu|financial|institution/g, '') // Remove common suffixes
    .trim();
}
