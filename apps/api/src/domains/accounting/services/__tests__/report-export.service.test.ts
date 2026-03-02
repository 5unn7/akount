import { describe, it, expect } from 'vitest';
import { ReportExportService, reportExportService } from '../report-export.service';
import type {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TrialBalanceReport,
  GLLedgerEntry,
  ReportLineItem,
} from '@akount/types/financial';

// ─────────────────────────────────────────────────────────────────
// Mock Report Data Factories (all monetary values in integer cents)
// ─────────────────────────────────────────────────────────────────

function makeLineItem(overrides: Partial<ReportLineItem> = {}): ReportLineItem {
  return {
    accountId: 'acc-1',
    code: '4000',
    name: 'Sales Revenue',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    balance: 150000, // $1,500.00
    depth: 0,
    isSubtotal: false,
    ...overrides,
  };
}

function makeNestedLineItem(): ReportLineItem {
  return makeLineItem({
    code: '4000',
    name: 'Revenue',
    balance: 250000,
    depth: 0,
    isSubtotal: false,
    children: [
      makeLineItem({
        code: '4100',
        name: 'Product Sales',
        balance: 150000,
        depth: 1,
        isSubtotal: false,
      }),
      makeLineItem({
        code: '4200',
        name: 'Service Revenue',
        balance: 100000,
        depth: 1,
        isSubtotal: false,
      }),
    ],
  });
}

function makeProfitLossReport(overrides: Partial<ProfitLossReport> = {}): ProfitLossReport {
  return {
    entityName: 'Test Corp',
    currency: 'CAD',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    revenue: {
      sections: [makeLineItem({ code: '4000', name: 'Sales', balance: 500000 })],
      total: 500000, // $5,000.00
    },
    expenses: {
      sections: [makeLineItem({ code: '5000', name: 'Cost of Sales', type: 'EXPENSE', balance: 200000 })],
      total: 200000, // $2,000.00
    },
    netIncome: 300000, // $3,000.00
    ...overrides,
  };
}

function makeBalanceSheetReport(overrides: Partial<BalanceSheetReport> = {}): BalanceSheetReport {
  return {
    entityName: 'Test Corp',
    currency: 'CAD',
    asOfDate: '2024-12-31',
    assets: {
      items: [makeLineItem({ code: '1000', name: 'Cash', type: 'ASSET', balance: 500000 })],
      total: 500000,
    },
    liabilities: {
      items: [makeLineItem({ code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 100000 })],
      total: 100000,
    },
    equity: {
      items: [makeLineItem({ code: '3000', name: 'Common Stock', type: 'EQUITY', balance: 100000 })],
      total: 100000,
    },
    retainedEarnings: {
      priorYears: 50000, // $500.00
      currentYear: 250000, // $2,500.00
      total: 300000,
    },
    isBalanced: true,
    totalAssets: 500000,
    totalLiabilitiesAndEquity: 500000,
    ...overrides,
  };
}

function makeCashFlowReport(overrides: Partial<CashFlowReport> = {}): CashFlowReport {
  return {
    entityName: 'Test Corp',
    currency: 'CAD',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    netIncome: 300000,
    operating: {
      items: [makeLineItem({ code: '', name: 'Depreciation', balance: 50000 })],
      total: 350000,
    },
    investing: {
      items: [makeLineItem({ code: '', name: 'Equipment Purchase', balance: -100000 })],
      total: -100000,
    },
    financing: {
      items: [makeLineItem({ code: '', name: 'Loan Repayment', balance: -50000 })],
      total: -50000,
    },
    netCashChange: 200000,
    openingCash: 300000,
    closingCash: 500000,
    isReconciled: true,
    ...overrides,
  };
}

function makeTrialBalanceReport(overrides: Partial<TrialBalanceReport> = {}): TrialBalanceReport {
  return {
    entityName: 'Test Corp',
    currency: 'CAD',
    asOfDate: '2024-12-31',
    accounts: [
      { id: 'gl-1', code: '1000', name: 'Cash', debit: 500000, credit: 0 },
      { id: 'gl-2', code: '2000', name: 'Accounts Payable', debit: 0, credit: 100000 },
      { id: 'gl-3', code: '4000', name: 'Revenue', debit: 0, credit: 400000 },
    ],
    totalDebits: 500000,
    totalCredits: 500000,
    isBalanced: true,
    severity: 'OK',
    ...overrides,
  };
}

function makeGLLedgerEntries(): GLLedgerEntry[] {
  return [
    {
      id: 'jl-1',
      date: new Date('2024-01-15'),
      entryNumber: 'JE-001',
      memo: 'Invoice #INV-001',
      debitAmount: 150000,
      creditAmount: 0,
      runningBalance: 150000,
    },
    {
      id: 'jl-2',
      date: new Date('2024-02-10'),
      entryNumber: 'JE-002',
      memo: 'Payment received',
      debitAmount: 0,
      creditAmount: 100000,
      runningBalance: 50000,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('ReportExportService', () => {
  const service = new ReportExportService();

  // ──────────────────────────────────────────────────────────────
  // Singleton
  // ──────────────────────────────────────────────────────────────

  describe('singleton export', () => {
    it('should export a singleton instance', () => {
      expect(reportExportService).toBeInstanceOf(ReportExportService);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // profitLossToCsv
  // ──────────────────────────────────────────────────────────────

  describe('profitLossToCsv', () => {
    it('should include header row with correct columns', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport());
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Account Code,Account Name,Type,Balance');
    });

    it('should include Revenue section separator', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport());
      expect(csv).toContain('--- Revenue ---');
    });

    it('should include Expenses section separator', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport());
      expect(csv).toContain('--- Expenses ---');
    });

    it('should output revenue items with formatted cents', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport());
      // 500000 cents = $5000.00
      expect(csv).toContain('5000.00');
    });

    it('should output Total Revenue row', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport());
      expect(csv).toContain(',Total Revenue,,5000.00');
    });

    it('should output Total Expenses row', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport());
      expect(csv).toContain(',Total Expenses,,2000.00');
    });

    it('should output Net Income as last row', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport());
      const lines = csv.split('\n');
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toBe(',Net Income,,3000.00');
    });

    it('should handle empty revenue and expenses sections', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport({
        revenue: { sections: [], total: 0 },
        expenses: { sections: [], total: 0 },
        netIncome: 0,
      }));
      expect(csv).toContain(',Total Revenue,,0.00');
      expect(csv).toContain(',Total Expenses,,0.00');
      expect(csv).toContain(',Net Income,,0.00');
    });

    it('should format monetary values as 2-decimal strings from integer cents', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport({ netIncome: 123456 }));
      // 123456 cents = $1234.56
      expect(csv).toContain('1234.56');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // balanceSheetToCsv
  // ──────────────────────────────────────────────────────────────

  describe('balanceSheetToCsv', () => {
    it('should include header row', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport());
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Account Code,Account Name,Type,Balance');
    });

    it('should include Assets section with items', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport());
      expect(csv).toContain('--- Assets ---');
      expect(csv).toContain('Cash');
    });

    it('should include Liabilities section', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport());
      expect(csv).toContain('--- Liabilities ---');
      expect(csv).toContain('Accounts Payable');
    });

    it('should include Equity section', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport());
      expect(csv).toContain('--- Equity ---');
      expect(csv).toContain('Common Stock');
    });

    it('should include Retained Earnings rows (prior + current year)', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport());
      expect(csv).toContain('3100,Retained Earnings (Prior Years),EQUITY,500.00');
      expect(csv).toContain(',Net Income (Current Year),EQUITY,2500.00');
    });

    it('should output Total Assets row', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport());
      expect(csv).toContain(',Total Assets,,5000.00');
    });

    it('should output Total Liabilities & Equity row', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport());
      expect(csv).toContain(',Total Liabilities & Equity,,5000.00');
    });

    it('should handle empty sections gracefully', () => {
      const csv = service.balanceSheetToCsv(makeBalanceSheetReport({
        assets: { items: [], total: 0 },
        liabilities: { items: [], total: 0 },
        equity: { items: [], total: 0 },
        retainedEarnings: { priorYears: 0, currentYear: 0, total: 0 },
        totalAssets: 0,
        totalLiabilitiesAndEquity: 0,
      }));
      expect(csv).toContain(',Total Assets,,0.00');
      expect(csv).toContain(',Total Liabilities & Equity,,0.00');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // cashFlowToCsv
  // ──────────────────────────────────────────────────────────────

  describe('cashFlowToCsv', () => {
    it('should include header row with Category, Item, Amount', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport());
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Category,Item,Amount');
    });

    it('should output Operating section with Net Income first', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport());
      const lines = csv.split('\n');
      expect(lines[1]).toBe('Operating,Net Income,3000.00');
    });

    it('should output Operating items', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport());
      expect(csv).toContain('Operating,Depreciation,500.00');
    });

    it('should output Operating Total', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport());
      expect(csv).toContain('Operating,Total,3500.00');
    });

    it('should output Investing and Financing sections', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport());
      expect(csv).toContain('Investing,Total,-1000.00');
      expect(csv).toContain('Financing,Total,-500.00');
    });

    it('should include Opening Cash, Net Cash Change, Closing Cash summary', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport());
      expect(csv).toContain(',Opening Cash Balance,3000.00');
      expect(csv).toContain(',Net Cash Change,2000.00');
      expect(csv).toContain(',Closing Cash Balance,5000.00');
    });

    it('should handle empty investing and financing sections', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport({
        investing: { items: [], total: 0 },
        financing: { items: [], total: 0 },
      }));
      expect(csv).toContain('Investing,Total,0.00');
      expect(csv).toContain('Financing,Total,0.00');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // trialBalanceToCsv
  // ──────────────────────────────────────────────────────────────

  describe('trialBalanceToCsv', () => {
    it('should include header row', () => {
      const csv = service.trialBalanceToCsv(makeTrialBalanceReport());
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Account Code,Account Name,Debit,Credit');
    });

    it('should output accounts with debit or credit amounts', () => {
      const csv = service.trialBalanceToCsv(makeTrialBalanceReport());
      // Cash: 500000 cents debit = 5000.00
      expect(csv).toContain('1000,Cash,5000.00,');
    });

    it('should leave blank for zero debit or credit', () => {
      const csv = service.trialBalanceToCsv(makeTrialBalanceReport());
      // AP: 0 debit, 100000 credit
      expect(csv).toContain('2000,Accounts Payable,,1000.00');
    });

    it('should include Totals row at bottom', () => {
      const csv = service.trialBalanceToCsv(makeTrialBalanceReport());
      const lines = csv.split('\n');
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toBe(',Totals,5000.00,5000.00');
    });

    it('should handle empty accounts array', () => {
      const csv = service.trialBalanceToCsv(makeTrialBalanceReport({
        accounts: [],
        totalDebits: 0,
        totalCredits: 0,
      }));
      const lines = csv.split('\n');
      expect(lines.length).toBe(2); // header + totals
      expect(lines[1]).toBe(',Totals,0.00,0.00');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // glLedgerToCsv
  // ──────────────────────────────────────────────────────────────

  describe('glLedgerToCsv', () => {
    it('should include header row', () => {
      const csv = service.glLedgerToCsv(makeGLLedgerEntries(), '1000', 'Cash', 'CAD');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Date,Entry #,Memo,Debit,Credit,Running Balance');
    });

    it('should format dates as en-CA locale', () => {
      const csv = service.glLedgerToCsv(makeGLLedgerEntries(), '1000', 'Cash', 'CAD');
      // Dates are formatted via toLocaleDateString('en-CA') which produces YYYY-MM-DD
      // UTC midnight dates may shift by ±1 day in local timezone, so check format pattern
      const lines = csv.split('\n');
      // Line 1 (first entry) should contain a date-like pattern YYYY-MM-DD
      expect(lines[1]).toMatch(/^\d{4}-\d{2}-\d{2},/);
      // Line 2 (second entry)
      expect(lines[2]).toMatch(/^\d{4}-\d{2}-\d{2},/);
    });

    it('should output entry numbers', () => {
      const csv = service.glLedgerToCsv(makeGLLedgerEntries(), '1000', 'Cash', 'CAD');
      expect(csv).toContain('JE-001');
      expect(csv).toContain('JE-002');
    });

    it('should leave blank for zero debit or credit amounts', () => {
      const csv = service.glLedgerToCsv(makeGLLedgerEntries(), '1000', 'Cash', 'CAD');
      const lines = csv.split('\n');
      // First entry: 150000 debit, 0 credit
      expect(lines[1]).toContain('1500.00,,1500.00');
      // Second entry: 0 debit, 100000 credit
      expect(lines[2]).toContain(',1000.00,500.00');
    });

    it('should format running balance', () => {
      const csv = service.glLedgerToCsv(makeGLLedgerEntries(), '1000', 'Cash', 'CAD');
      // First: runningBalance 150000 = 1500.00
      expect(csv).toContain('1500.00');
      // Second: runningBalance 50000 = 500.00
      expect(csv).toContain('500.00');
    });

    it('should handle empty entries array', () => {
      const csv = service.glLedgerToCsv([], '1000', 'Cash', 'CAD');
      const lines = csv.split('\n');
      expect(lines.length).toBe(1); // header only
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Hierarchical flattening
  // ──────────────────────────────────────────────────────────────

  describe('hierarchical flattening', () => {
    it('should indent nested items with 2-space prefix per depth level', () => {
      const report = makeProfitLossReport({
        revenue: {
          sections: [makeNestedLineItem()],
          total: 250000,
        },
      });
      const csv = service.profitLossToCsv(report);
      // Depth 0: no indent
      expect(csv).toContain('Revenue');
      // Depth 1: 2 spaces indent
      expect(csv).toContain('  Product Sales');
      expect(csv).toContain('  Service Revenue');
    });

    it('should recursively flatten children', () => {
      const deepNested = makeLineItem({
        code: '4000',
        name: 'Top Level',
        balance: 500000,
        depth: 0,
        children: [
          makeLineItem({
            code: '4100',
            name: 'Mid Level',
            balance: 300000,
            depth: 1,
            children: [
              makeLineItem({
                code: '4110',
                name: 'Leaf Level',
                balance: 100000,
                depth: 2,
              }),
            ],
          }),
        ],
      });
      const report = makeProfitLossReport({
        revenue: { sections: [deepNested], total: 500000 },
      });
      const csv = service.profitLossToCsv(report);
      expect(csv).toContain('Top Level');
      expect(csv).toContain('  Mid Level');
      expect(csv).toContain('    Leaf Level');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // CSV formula injection prevention
  // ──────────────────────────────────────────────────────────────

  describe('CSV formula injection prevention', () => {
    it('should sanitize values starting with = character', () => {
      const report = makeProfitLossReport({
        revenue: {
          sections: [makeLineItem({ name: '=SUM(A1:A10)', code: '=MALICIOUS' })],
          total: 100000,
        },
      });
      const csv = service.profitLossToCsv(report);
      // sanitizeCsvCell wraps formula-like strings: "'=MALICIOUS"
      expect(csv).not.toContain(',=SUM(A1:A10),');
      expect(csv).not.toContain(',=MALICIOUS,');
    });

    it('should sanitize values starting with + character', () => {
      const report = makeProfitLossReport({
        revenue: {
          sections: [makeLineItem({ name: '+cmd|...' })],
          total: 100000,
        },
      });
      const csv = service.profitLossToCsv(report);
      expect(csv).not.toContain(',+cmd|...,');
    });

    it('should sanitize values starting with - character', () => {
      const entries: GLLedgerEntry[] = [{
        id: 'jl-1',
        date: new Date('2024-01-01'),
        entryNumber: 'JE-001',
        memo: '-dangerous formula',
        debitAmount: 100000,
        creditAmount: 0,
        runningBalance: 100000,
      }];
      const csv = service.glLedgerToCsv(entries, '1000', 'Cash', 'CAD');
      expect(csv).not.toMatch(/,-dangerous formula,/);
    });

    it('should sanitize values starting with @ character', () => {
      const report = makeProfitLossReport({
        revenue: {
          sections: [makeLineItem({ name: '@SUM(A1)' })],
          total: 100000,
        },
      });
      const csv = service.profitLossToCsv(report);
      expect(csv).not.toContain(',@SUM(A1),');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Financial invariants
  // ──────────────────────────────────────────────────────────────

  describe('financial invariants', () => {
    it('should format all monetary values as 2-decimal strings from integer cents', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport({
        netIncome: 1, // 1 cent = $0.01
      }));
      expect(csv).toContain('0.01');
    });

    it('should format zero correctly', () => {
      const csv = service.profitLossToCsv(makeProfitLossReport({
        revenue: { sections: [], total: 0 },
        expenses: { sections: [], total: 0 },
        netIncome: 0,
      }));
      expect(csv).toContain('0.00');
    });

    it('should format negative values correctly', () => {
      const csv = service.cashFlowToCsv(makeCashFlowReport({
        investing: {
          items: [makeLineItem({ name: 'Equipment', balance: -100000 })],
          total: -100000,
        },
      }));
      // -100000 cents = -$1000.00
      expect(csv).toContain('-1000.00');
    });

    it('should format large values correctly', () => {
      const csv = service.trialBalanceToCsv(makeTrialBalanceReport({
        accounts: [{ id: 'gl-1', code: '1000', name: 'Cash', debit: 99999999, credit: 0 }],
        totalDebits: 99999999,
        totalCredits: 99999999,
      }));
      // 99999999 cents = $999999.99
      expect(csv).toContain('999999.99');
    });
  });
});
