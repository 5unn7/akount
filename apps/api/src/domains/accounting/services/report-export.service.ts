import type {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TrialBalanceReport,
  GLLedgerEntry,
  ReportLineItem,
} from './report.service';
import { sanitizeCsvCell, formatCentsForCsv } from '../../../lib/csv';

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
  // sanitizeCsvCell and formatCentsForCsv imported from lib/csv.ts

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
    for (const item of this.flattenItems(report.revenue?.sections || [])) {
      rows.push(this.buildRow([
        sanitizeCsvCell(item.code),
        sanitizeCsvCell(item.name),
        sanitizeCsvCell(item.type),
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Revenue', '', formatCentsForCsv(report.revenue?.total || 0)]));

    // Expenses items
    rows.push(this.buildRow(['', '--- Expenses ---', '', '']));
    for (const item of this.flattenItems(report.expenses?.sections || [])) {
      rows.push(this.buildRow([
        sanitizeCsvCell(item.code),
        sanitizeCsvCell(item.name),
        sanitizeCsvCell(item.type),
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Expenses', '', formatCentsForCsv(report.expenses?.total || 0)]));

    // Net Income
    rows.push(this.buildRow(['', 'Net Income', '', formatCentsForCsv(report.netIncome)]));

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
        sanitizeCsvCell(item.code),
        sanitizeCsvCell(item.name),
        'ASSET',
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Assets', '', formatCentsForCsv(report.totalAssets)]));

    // Liabilities
    rows.push(this.buildRow(['', '--- Liabilities ---', '', '']));
    for (const item of this.flattenItems(report.liabilities?.items || [])) {
      rows.push(this.buildRow([
        sanitizeCsvCell(item.code),
        sanitizeCsvCell(item.name),
        'LIABILITY',
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['', 'Total Liabilities', '', formatCentsForCsv(report.liabilities?.total || 0)]));

    // Equity
    rows.push(this.buildRow(['', '--- Equity ---', '', '']));
    for (const item of this.flattenItems(report.equity?.items || [])) {
      rows.push(this.buildRow([
        sanitizeCsvCell(item.code),
        sanitizeCsvCell(item.name),
        'EQUITY',
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['3100', 'Retained Earnings (Prior Years)', 'EQUITY', formatCentsForCsv(report.retainedEarnings.priorYears)]));
    rows.push(this.buildRow(['', 'Net Income (Current Year)', 'EQUITY', formatCentsForCsv(report.retainedEarnings.currentYear)]));
    rows.push(this.buildRow(['', 'Total Equity', '', formatCentsForCsv(report.equity?.total || 0)]));

    // Grand total
    rows.push(this.buildRow(['', 'Total Liabilities & Equity', '', formatCentsForCsv(report.totalLiabilitiesAndEquity)]));

    return rows.join('\n');
  }

  /**
   * Export Cash Flow as CSV.
   */
  cashFlowToCsv(report: CashFlowReport): string {
    const rows: string[] = [];

    rows.push(this.buildRow(['Category', 'Item', 'Amount']));

    // Operating
    rows.push(this.buildRow(['Operating', 'Net Income', formatCentsForCsv(report.netIncome)]));
    for (const item of report.operating?.items || []) {
      rows.push(this.buildRow([
        'Operating',
        sanitizeCsvCell(item.name),
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['Operating', 'Total', formatCentsForCsv(report.operating?.total || 0)]));

    // Investing
    for (const item of report.investing?.items || []) {
      rows.push(this.buildRow([
        'Investing',
        sanitizeCsvCell(item.name),
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['Investing', 'Total', formatCentsForCsv(report.investing?.total || 0)]));

    // Financing
    for (const item of report.financing?.items || []) {
      rows.push(this.buildRow([
        'Financing',
        sanitizeCsvCell(item.name),
        formatCentsForCsv(item.balance),
      ]));
    }
    rows.push(this.buildRow(['Financing', 'Total', formatCentsForCsv(report.financing?.total || 0)]));

    // Summary
    rows.push(this.buildRow(['', 'Opening Cash Balance', formatCentsForCsv(report.openingCash)]));
    rows.push(this.buildRow(['', 'Net Cash Change', formatCentsForCsv(report.netCashChange)]));
    rows.push(this.buildRow(['', 'Closing Cash Balance', formatCentsForCsv(report.closingCash)]));

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
        sanitizeCsvCell(account.code),
        sanitizeCsvCell(account.name),
        account.debit > 0 ? formatCentsForCsv(account.debit) : '',
        account.credit > 0 ? formatCentsForCsv(account.credit) : '',
      ]));
    }

    rows.push(this.buildRow(['', 'Totals', formatCentsForCsv(report.totalDebits), formatCentsForCsv(report.totalCredits)]));

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
        sanitizeCsvCell(entry.memo),
        entry.debitAmount > 0 ? formatCentsForCsv(entry.debitAmount) : '',
        entry.creditAmount > 0 ? formatCentsForCsv(entry.creditAmount) : '',
        formatCentsForCsv(entry.runningBalance),
      ]));
    }

    return rows.join('\n');
  }
}

/**
 * Singleton instance
 */
export const reportExportService = new ReportExportService();
