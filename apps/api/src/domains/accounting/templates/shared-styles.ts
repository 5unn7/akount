import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared PDF Report Styles
 *
 * Consistent styling across all report PDFs.
 * Uses Helvetica (built-in) for reliable rendering without font loading.
 */

export const reportStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a2e',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 10,
    color: '#888888',
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f5f5f5',
    padding: 6,
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  rowLabel: {
    flex: 1,
    fontSize: 9,
  },
  rowValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'Courier',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #333333',
    paddingTop: 6,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  totalLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
    fontFamily: 'Courier-Bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '2px solid #1a1a2e',
    paddingTop: 8,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: 'Courier-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e0e0e0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#999999',
  },
  warningBox: {
    backgroundColor: '#fff3f3',
    border: '1px solid #ff4444',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 9,
    color: '#cc0000',
  },
  // Table styles (for Trial Balance, GL Ledger)
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #cccccc',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#666666',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #eeeeee',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellMono: {
    fontSize: 9,
    fontFamily: 'Courier',
    textAlign: 'right',
  },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Truncate long strings for PDF rendering.
 * Prevents layout overflow from user-supplied data.
 */
export function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

/**
 * Format cents as dollar string for PDF.
 * Returns formatted number with 2 decimal places.
 */
export function formatCentsForPdf(cents: number, currency: string = 'CAD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format a Date or ISO string for display.
 */
export function formatDateForPdf(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Count total line items in a hierarchical report.
 * Used to enforce PDF size limits.
 */
export function countLineItems(items: Array<{ children?: unknown[] }>): number {
  let count = 0;
  for (const item of items) {
    count += 1;
    if (Array.isArray(item.children)) {
      count += countLineItems(item.children as Array<{ children?: unknown[] }>);
    }
  }
  return count;
}

/**
 * PDF size and timeout constants.
 */
export const PDF_MAX_ENTRIES = 1000;
export const PDF_TIMEOUT_MS = 30_000;
