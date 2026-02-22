/**
 * Shared CSV utilities — OWASP formula injection prevention.
 *
 * Used by ReportExportService (accounting) and data-export (system).
 */

/**
 * Sanitize a CSV cell value to prevent formula injection.
 * Characters =+-@\t\r at the start of a cell can trigger
 * formula execution in Excel/Google Sheets.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = value instanceof Date
    ? value.toISOString()
    : String(value);

  // Prevent formula injection (starts with =+-@\t\r)
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }

  // Escape if contains comma, quote, or newline
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Format integer cents as dollars with exactly 2 decimal places for CSV export.
 */
export function formatCentsForCsv(cents: number): string {
  return (cents / 100).toFixed(2);
}
