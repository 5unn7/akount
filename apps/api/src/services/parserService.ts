import Papa from 'papaparse';
import pdf from 'pdf-parse';
import type { ParsedTransaction, ExternalAccountData, ColumnMappings } from '../schemas/import';
import { randomUUID } from 'crypto';

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
  if (dangerousChars.some(char => trimmed.startsWith(char))) {
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
    rows: rows.slice(0, 5).map(row => {
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
 * Parse PDF bank statement and extract transactions
 *
 * PDF parsing is more complex than CSV - uses regex patterns to find transactions
 */
export async function parsePDF(
  fileBuffer: Buffer,
  dateFormat?: string
): Promise<ParseResult> {
  try {
    // Extract text from PDF
    const data = await pdf(fileBuffer);
    const text = data.text;

    if (!text || text.trim().length === 0) {
      throw new Error('PDF contains no readable text. Please ensure the file is not password-protected or image-only.');
    }

    // Extract external account identifiers from PDF text
    const externalAccountData = extractExternalIdentifiersFromText(text);

    // Parse transactions using common bank statement patterns
    const transactions = parseTransactionsFromPDFText(text, dateFormat);

    if (transactions.length === 0) {
      throw new Error('No transactions found in PDF. Please ensure this is a valid bank statement with transaction details.');
    }

    return {
      transactions,
      externalAccountData,
      preview: {
        rows: [], // PDF doesn't have column preview like CSV
      },
    };
  } catch (error: any) {
    if (error.message?.includes('No transactions found') || error.message?.includes('no readable text')) {
      throw error;
    }
    throw new Error(`PDF parsing error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Extract transactions from PDF text using regex patterns
 *
 * Supports common bank statement formats
 */
function parseTransactionsFromPDFText(
  text: string,
  dateFormat?: string
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Common transaction patterns:
  // Pattern 1: MM/DD/YYYY Description Amount Balance
  // Pattern 2: DD/MM/YYYY Description $Amount
  // Pattern 3: Date | Description | Amount | Balance

  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
  const amountPattern = /([+-]?\$?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;

  for (const line of lines) {
    // Try to find date and amount in the line
    const dateMatch = line.match(datePattern);
    const amountMatches = line.match(new RegExp(amountPattern, 'g'));

    if (dateMatch && amountMatches && amountMatches.length > 0) {
      try {
        const dateStr = dateMatch[1];
        const date = parseDate(dateStr, dateFormat);

        // Amount is usually the last number on the line (sometimes second-to-last if balance is included)
        const amountStr = amountMatches[amountMatches.length - 1];
        const amount = parseAmountValue(amountStr);

        // Balance might be the last number if there are 2+ numbers
        const balance = amountMatches.length > 1
          ? parseAmountValue(amountMatches[amountMatches.length - 2])
          : undefined;

        // Extract description (everything between date and amount)
        const dateIndex = line.indexOf(dateMatch[0]);
        const amountIndex = line.lastIndexOf(amountStr);
        let description = line.substring(dateIndex + dateMatch[0].length, amountIndex).trim();

        // Clean up description (remove extra spaces, special chars)
        description = description.replace(/\s+/g, ' ').trim();

        if (description.length === 0) {
          description = 'Transaction';
        }

        transactions.push({
          tempId: `temp_${randomUUID()}`,
          date: date.toISOString().split('T')[0],
          description,
          amount,
          balance,
          isDuplicate: false,
          duplicateConfidence: undefined,
        });
      } catch (error) {
        // Skip lines that can't be parsed
        continue;
      }
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
    'TD Bank', 'RBC', 'BMO', 'Scotiabank', 'CIBC',
    'Chase', 'Bank of America', 'Wells Fargo', 'Citibank',
    'Capital One', 'US Bank', 'PNC Bank'
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
  } else if (textLower.includes('credit card') || textLower.includes('mastercard') || textLower.includes('visa')) {
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
