import type { ParsedTransaction, ExternalAccountData, ColumnMappings } from '../../../schemas/import';
import { randomUUID } from 'crypto';

export interface ParseResult {
  transactions: ParsedTransaction[];
  columns?: string[];
  suggestedMappings?: ColumnMappings;
  externalAccountData?: ExternalAccountData;
  preview?: { rows: Array<Record<string, string>> };
}

/**
 * SECURITY: Sanitize string to prevent CSV injection attacks
 * Excel formulas start with =, +, -, @, \t, \r
 * These can be used for code execution or data exfiltration
 */
export function sanitizeCSVInjection(value: string | undefined | null): string {
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

/**
 * Parse date string in various formats
 */
export function parseDate(dateStr: string, format?: string): Date {
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
export function parseAmount(row: Record<string, string>, amountMapping: string): number {
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
export function parseAmountValue(amountStr: string | undefined): number {
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
 * Generate a unique temp ID for parsed transactions
 */
export function generateTempId(): string {
  return `temp_${randomUUID()}`;
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
