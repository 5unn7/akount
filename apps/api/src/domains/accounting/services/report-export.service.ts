import type {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TrialBalanceReport,
  GLLedgerEntry,
  ReportLineItem,
} from './report.service';

/**
 * Report Export Service
 *
 * Converts report data to CSV format with security protections:
 * - Formula injection prevention (OWASP CSV Injection)
 * - Proper quoting and escaping
 * - Integer cents → 2-decimal formatting
 *
 * @see https://owasp.org/www-community/attacks/CSV_Injection
 */
export class ReportExportService {
  /**
   * Sanitize CSV cell to prevent formula injection.
   * Characters =+\-@\t\r at the start of a cell can trigger
   * formula execution in Excel/Google Sheets.
   */
  private sanitizeCsvCell(value: string | null | undefined): string {
    if (!value) return '';

    // Prevent formula injection (starts with =+\-@\t\r)
    if (/^[=+\-@\t\r]/.test(value)) {
      return `"'${value.replace(/"/g, '""')}"`; // Prefix with ' AND wrap in quotes
    }

    // Escape quotes and wrap if contains comma, quote, or newline
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Format cents as dollars with exactly 2 decimal places.
   */
  private formatCentsForCsv(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  /**
   * Build a CSV row from an array of values.
   */
  private buildRow(values: string[]): string {
    return values.join(',');
  }

  /**
   * Flatten hierarchical report items into a flat list for CSV.
   */
  private flattenItems(items: ReportLineItem[], prefix: string = ''): Array<{
    code: string;
    name: string;
    type: string;
    balance: number;
    previousBalance?: number;
    depth: number;
    isSubtotal: boolean;
  }> {
    const result: Array<{
      code: string;
      name: string;
      type: string;
      balance: number;
      previousBalance?: number;
      depth: number;
      isSubtotal: boolean;
    }> = [];

    for (const item of items) {
      const indent = '  '.repeat(item.depth);
      result.push({
        code: item.code,
        name: `${indent}${prefix}${item.name}`,
        type: item.type,
        balance: item.balance,
        previousBalance: item.previousBalance,
        depth: item.depth,
        isSubtotal: item.isSubtotal,
      });
      if (item.children) {
        result.push(...this.flattenItems(item.children, ''));
      }
    }

    return result;
  }

  /**
   * Export Profit & Loss as CSV.
   */
  profitLossToCsv(report: ProfitLossReport): string {
    const rows: string[] = [];

    // Header row
    rows.push(this.buildRow(['Account Code', 'Account Name', 'Type', 'Balance']));

    // Revenue items
    rows.push(this.buildRow(['', '--- Revenue ---', '', '']));
    for (const item of this.flattenItems(report.revenue?.items || [])) {
      rows.push(this.buildRow([
        this.sanitizeCsvCell(item.code),
        this.sanitizeCsvCell(item.name),
        this.sanitizeCsvCell(item.type),
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Revenue', '', this.formatCentsForCsv(report.revenue?.total || 0)]));

    // Expenses items
    rows.push(this.buildRow(['', '--- Expenses ---', '', '']));
    for (const item of this.flattenItems(report.expenses?.items || [])) {
      rows.push(this.buildRow([
        this.sanitizeCsvCell(item.code),
        this.sanitizeCsvCell(item.name),
        this.sanitizeCsvCell(item.type),
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Expenses', '', this.formatCentsForCsv(report.expenses?.total || 0)]));

    // Net Income
    rows.push(this.buildRow(['', 'Net Income', '', this.formatCentsForCsv(report.netIncome)]));

    return rows.join('\n');
  }

  /**
   * Export Balance Sheet as CSV.
   */
  balanceSheetToCsv(report: BalanceSheetReport): string {
    const rows: string[] = [];

    rows.push(this.buildRow(['Account Code', 'Account Name', 'Type', 'Balance']));

    // Assets
    rows.push(this.buildRow(['', '--- Assets ---', '', '']));
    for (const item of this.flattenItems(report.assets?.items || [])) {
      rows.push(this.buildRow([
        this.sanitizeCsvCell(item.code),
        this.sanitizeCsvCell(item.name),
        'ASSET',
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Assets', '', this.formatCentsForCsv(report.totalAssets)]));

    // Liabilities
    rows.push(this.buildRow(['', '--- Liabilities ---', '', '']));
    for (const item of this.flattenItems(report.liabilities?.items || [])) {
      rows.push(this.buildRow([
        this.sanitizeCsvCell(item.code),
        this.sanitizeCsvCell(item.name),
        'LIABILITY',
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Liabilities', '', this.formatCentsForCsv(report.liabilities?.total || 0)]));

    // Equity
    rows.push(this.buildRow(['', '--- Equity ---', '', '']));
    for (const item of this.flattenItems(report.equity?.items || [])) {
      rows.push(this.buildRow([
        this.sanitizeCsvCell(item.code),
        this.sanitizeCsvCell(item.name),
        'EQUITY',
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['3100', 'Retained Earnings (Prior Years)', 'EQUITY', this.formatCentsForCsv(report.retainedEarnings.priorYears)]));
    rows.push(this.buildRow(['', 'Net Income (Current Year)', 'EQUITY', this.formatCentsForCsv(report.retainedEarnings.currentYear)]));
    rows.push(this.buildRow(['', 'Total Equity', '', this.formatCentsForCsv(report.equity?.total || 0)]));

    // Grand total
    rows.push(this.buildRow(['', 'Total Liabilities & Equity', '', this.formatCentsForCsv(report.totalLiabilitiesAndEquity)]));

    return rows.join('\n');
  }

  /**
   * Export Cash Flow as CSV.
   */
  cashFlowToCsv(report: CashFlowReport): string {
    const rows: string[] = [];

    rows.push(this.buildRow(['Category', 'Item', 'Amount']));

    // Operating
    rows.push(this.buildRow(['Operating', 'Net Income', this.formatCentsForCsv(report.netIncome)]));
    for (const item of report.operating?.items || []) {
      rows.push(this.buildRow([
        'Operating',
        this.sanitizeCsvCell(item.name),
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['Operating', 'Total', this.formatCentsForCsv(report.operating?.total || 0)]));

    // Investing
    for (const item of report.investing?.items || []) {
      rows.push(this.buildRow([
        'Investing',
        this.sanitizeCsvCell(item.name),
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['Investing', 'Total', this.formatCentsForCsv(report.investing?.total || 0)]));

    // Financing
    for (const item of report.financing?.items || []) {
      rows.push(this.buildRow([
        'Financing',
        this.sanitizeCsvCell(item.name),
        this.formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['Financing', 'Total', this.formatCentsForCsv(report.financing?.total || 0)]));

    // Summary
    rows.push(this.buildRow(['', 'Opening Cash Balance', this.formatCentsForCsv(report.openingCash)]));
    rows.push(this.buildRow(['', 'Net Cash Change', this.formatCentsForCsv(report.netCashChange)]));
    rows.push(this.buildRow(['', 'Closing Cash Balance', this.formatCentsForCsv(report.closingCash)]));

    return rows.join('\n');
  }

  /**
   * Export Trial Balance as CSV.
   */
  trialBalanceToCsv(report: TrialBalanceReport): string {
    const rows: string[] = [];

    rows.push(this.buildRow(['Account Code', 'Account Name', 'Debit', 'Credit']));

    for (const account of report.accounts) {
      rows.push(this.buildRow([
        this.sanitizeCsvCell(account.code),
        this.sanitizeCsvCell(account.name),
        account.debit > 0 ? this.formatCentsForCsv(account.debit) : '',
        account.credit > 0 ? this.formatCentsForCsv(account.credit) : '',
      ]));
    }

    rows.push(this.buildRow(['', 'Totals', this.formatCentsForCsv(report.totalDebits), this.formatCentsForCsv(report.totalCredits)]));

    return rows.join('\n');
  }

  /**
   * Export GL Ledger entries as CSV.
   */
  glLedgerToCsv(
    entries: GLLedgerEntry[],
    accountCode: string,
    accountName: string,
    currency: string
  ): string {
    const rows: string[] = [];

    rows.push(this.buildRow(['Date', 'Entry #', 'Memo', 'Debit', 'Credit', 'Running Balance']));

    for (const entry of entries) {
      const date = new Date(entry.date).toLocaleDateString('en-CA');
      rows.push(this.buildRow([
        date,
        String(entry.entryNumber),
        this.sanitizeCsvCell(entry.memo),
        entry.debitAmount > 0 ? this.formatCentsForCsv(entry.debitAmount) : '',
        entry.creditAmount > 0 ? this.formatCentsForCsv(entry.creditAmount) : '',
        this.formatCentsForCsv(entry.runningBalance),
      ]));
    }

    return rows.join('\n');
  }
}

/**
 * Singleton instance
 */
export const reportExportService = new ReportExportService();
