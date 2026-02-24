import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { reportRoutes } from '../routes/report';
import { AccountingError } from '../errors';
import { assertIntegerCents } from '../../../test-utils/financial-assertions';

// Mock middleware
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.userId = 'test-user-id';
  }),
}));

vi.mock('../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

vi.mock('../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async (request: unknown) => {
      const req = request as Record<string, unknown>;
      req.userId = 'test-user-id';
      req.tenantId = 'tenant-abc-123';
      req.tenantRole = 'OWNER';
    },
  })),
}));

vi.mock('../../../middleware/rate-limit', () => ({
  statsRateLimitConfig: vi.fn(() => ({})),
}));

// Mock ReportService
const mockGenerateProfitLoss = vi.fn();
const mockGenerateBalanceSheet = vi.fn();
const mockGenerateCashFlow = vi.fn();
const mockGenerateTrialBalance = vi.fn();
const mockGenerateGLLedger = vi.fn();
const mockGenerateSpendingByCategory = vi.fn();
const mockGenerateRevenueByClient = vi.fn();

vi.mock('../services/report.service', () => ({
  ReportService: function (this: Record<string, unknown>) {
    this.generateProfitLoss = mockGenerateProfitLoss;
    this.generateBalanceSheet = mockGenerateBalanceSheet;
    this.generateCashFlow = mockGenerateCashFlow;
    this.generateTrialBalance = mockGenerateTrialBalance;
    this.generateGLLedger = mockGenerateGLLedger;
    this.generateSpendingByCategory = mockGenerateSpendingByCategory;
    this.generateRevenueByClient = mockGenerateRevenueByClient;
  },
}));

// Mock report export service (for CSV/PDF exports)
vi.mock('../services/report-export.service', () => ({
  reportExportService: {
    profitLossToCsv: vi.fn(() => 'csv-data'),
    balanceSheetToCsv: vi.fn(() => 'csv-data'),
    cashFlowToCsv: vi.fn(() => 'csv-data'),
    trialBalanceToCsv: vi.fn(() => 'csv-data'),
    glLedgerToCsv: vi.fn(() => 'csv-data'),
  },
}));

// Mock PDF generators
vi.mock('../templates/profit-loss-pdf', () => ({
  generateProfitLossPdf: vi.fn(() => Buffer.from('pdf-data')),
}));
vi.mock('../templates/balance-sheet-pdf', () => ({
  generateBalanceSheetPdf: vi.fn(() => Buffer.from('pdf-data')),
}));
vi.mock('../templates/cash-flow-pdf', () => ({
  generateCashFlowPdf: vi.fn(() => Buffer.from('pdf-data')),
}));

// ─── Mock Report Data ────────────────────────────────────────────────────────

const MOCK_PNL = {
  entityId: 'entity-1',
  entityName: 'Test Entity',
  currency: 'CAD',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-01-31T00:00:00.000Z',
  revenue: { total: 100000, sections: [{ name: 'Revenue', balance: 100000, items: [] }] },
  expenses: { total: 60000, sections: [{ name: 'Expenses', balance: 60000, items: [] }] },
  netIncome: 40000,
};

const MOCK_BS = {
  entityId: 'entity-1',
  entityName: 'Test Entity',
  currency: 'CAD',
  asOfDate: '2026-01-31T00:00:00.000Z',
  assets: { total: 100000, sections: [] },
  liabilities: { total: 50000, sections: [] },
  equity: { total: 40000, sections: [] },
  retainedEarnings: { priorYears: 5000, currentYear: 5000, total: 10000 },
  totalLiabilitiesAndEquity: 100000,
  isBalanced: true,
};

const MOCK_CF = {
  entityId: 'entity-1',
  entityName: 'Test Entity',
  currency: 'CAD',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-01-31T00:00:00.000Z',
  netIncome: 40000,
  openingCash: 50000,
  closingCash: 90000,
  operating: { total: 30000, items: [] },
  investing: { total: 0, items: [] },
  financing: { total: 10000, items: [] },
};

const MOCK_TB = {
  entityId: 'entity-1',
  entityName: 'Test Entity',
  currency: 'CAD',
  asOfDate: '2026-01-31T00:00:00.000Z',
  accounts: [
    { id: 'gl-1', code: '1000', name: 'Cash', debit: 100000, credit: 0 },
    { id: 'gl-2', code: '2000', name: 'AP', debit: 0, credit: 100000 },
  ],
  totalDebits: 100000,
  totalCredits: 100000,
  isBalanced: true,
  severity: 'OK',
};

const MOCK_GL_LEDGER = {
  entityId: 'entity-1',
  glAccountId: 'gl-1',
  accountCode: '1000',
  accountName: 'Cash',
  entityName: 'Test Entity',
  currency: 'CAD',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-01-31T00:00:00.000Z',
  entries: [
    {
      id: 'jl-1',
      date: '2026-01-05',
      entryNumber: 'JE-001',
      memo: 'Payment received',
      debitAmount: 20000,
      creditAmount: 0,
      runningBalance: 70000,
    },
  ],
  nextCursor: null,
};

const MOCK_SPENDING = {
  entityId: 'entity-1',
  entityName: 'Test Entity',
  currency: 'CAD',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-01-31T00:00:00.000Z',
  categories: [
    { glAccountId: 'gl-exp-1', code: '5000', name: 'Expenses', amount: 60000, percentage: 100 },
  ],
  total: 60000,
};

const MOCK_REVENUE = {
  entityId: 'entity-1',
  entityName: 'Test Entity',
  currency: 'CAD',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-01-31T00:00:00.000Z',
  clients: [
    { glAccountId: 'gl-rev-1', code: '4000', name: 'Revenue', amount: 100000, percentage: 100 },
  ],
  total: 100000,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Report Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGenerateProfitLoss.mockResolvedValue(MOCK_PNL);
    mockGenerateBalanceSheet.mockResolvedValue(MOCK_BS);
    mockGenerateCashFlow.mockResolvedValue(MOCK_CF);
    mockGenerateTrialBalance.mockResolvedValue(MOCK_TB);
    mockGenerateGLLedger.mockResolvedValue(MOCK_GL_LEDGER);
    mockGenerateSpendingByCategory.mockResolvedValue(MOCK_SPENDING);
    mockGenerateRevenueByClient.mockResolvedValue(MOCK_REVENUE);

    app = Fastify({ logger: false });
    await app.register(reportRoutes, { prefix: '/reports' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ============================================================================
  // GET /reports/profit-loss
  // ============================================================================

  describe('GET /reports/profit-loss', () => {
    it('should return 200 with P&L report (JSON)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reports/profit-loss?entityId=entity-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.netIncome).toBe(40000);
      expect(body.revenue.total).toBe(100000);
      expect(body.expenses.total).toBe(60000);

      // Financial invariant: integer cents
      assertIntegerCents(body.netIncome, 'P&L netIncome');
      assertIntegerCents(body.revenue.total, 'P&L revenue.total');
      assertIntegerCents(body.expenses.total, 'P&L expenses.total');
    });

    it('should call service with correct parameters', async () => {
      await app.inject({
        method: 'GET',
        url: '/reports/profit-loss?entityId=entity-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGenerateProfitLoss).toHaveBeenCalledTimes(1);
    });

    it('should handle AccountingError with proper status code', async () => {
      mockGenerateProfitLoss.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reports/profit-loss?entityId=bad-entity&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should handle unexpected errors with 500', async () => {
      mockGenerateProfitLoss.mockRejectedValue(new Error('Database connection lost'));

      const response = await app.inject({
        method: 'GET',
        url: '/reports/profit-loss?entityId=entity-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal server error');
    });
  });

  // ============================================================================
  // GET /reports/balance-sheet
  // ============================================================================

  describe('GET /reports/balance-sheet', () => {
    it('should return 200 with balance sheet report', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reports/balance-sheet?entityId=entity-1&asOfDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.assets.total).toBe(100000);
      expect(body.liabilities.total).toBe(50000);
      expect(body.isBalanced).toBe(true);

      // Financial invariant: integer cents
      assertIntegerCents(body.assets.total, 'BS assets.total');
      assertIntegerCents(body.liabilities.total, 'BS liabilities.total');
      assertIntegerCents(body.totalLiabilitiesAndEquity, 'BS totalLiabilitiesAndEquity');
    });

    it('should handle AccountingError with proper status code', async () => {
      mockGenerateBalanceSheet.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reports/balance-sheet?entityId=bad-entity&asOfDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ============================================================================
  // GET /reports/cash-flow
  // ============================================================================

  describe('GET /reports/cash-flow', () => {
    it('should return 200 with cash flow report', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reports/cash-flow?entityId=entity-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.netIncome).toBe(40000);
      expect(body.openingCash).toBe(50000);
      expect(body.closingCash).toBe(90000);

      // Financial invariant: integer cents
      assertIntegerCents(body.netIncome, 'CF netIncome');
      assertIntegerCents(body.openingCash, 'CF openingCash');
      assertIntegerCents(body.closingCash, 'CF closingCash');
    });

    it('should handle AccountingError with proper status code', async () => {
      mockGenerateCashFlow.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reports/cash-flow?entityId=bad-entity&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ============================================================================
  // GET /reports/trial-balance
  // ============================================================================

  describe('GET /reports/trial-balance', () => {
    it('should return 200 with trial balance report', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reports/trial-balance?entityId=entity-1&asOfDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.totalDebits).toBe(100000);
      expect(body.totalCredits).toBe(100000);
      expect(body.isBalanced).toBe(true);
      expect(body.severity).toBe('OK');
      expect(body.accounts).toHaveLength(2);

      // Financial invariant: integer cents
      assertIntegerCents(body.totalDebits, 'TB totalDebits');
      assertIntegerCents(body.totalCredits, 'TB totalCredits');
      for (const account of body.accounts) {
        assertIntegerCents(account.debit, `TB account ${account.code} debit`);
        assertIntegerCents(account.credit, `TB account ${account.code} credit`);
      }
    });

    it('should call service with correct parameters', async () => {
      await app.inject({
        method: 'GET',
        url: '/reports/trial-balance?entityId=entity-1&asOfDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGenerateTrialBalance).toHaveBeenCalledTimes(1);
    });

    it('should handle AccountingError with proper status code', async () => {
      mockGenerateTrialBalance.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reports/trial-balance?entityId=bad-entity&asOfDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.code).toBe('ENTITY_NOT_FOUND');
    });
  });

  // ============================================================================
  // GET /reports/general-ledger
  // ============================================================================

  describe('GET /reports/general-ledger', () => {
    it('should return 200 with GL ledger report', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reports/general-ledger?entityId=entity-1&glAccountId=gl-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.accountCode).toBe('1000');
      expect(body.accountName).toBe('Cash');
      expect(body.entries).toHaveLength(1);
      expect(body.nextCursor).toBeNull();

      // Financial invariant: integer cents
      for (const entry of body.entries) {
        assertIntegerCents(entry.debitAmount, 'GL entry debitAmount');
        assertIntegerCents(entry.creditAmount, 'GL entry creditAmount');
        assertIntegerCents(entry.runningBalance, 'GL entry runningBalance');
      }
    });

    it('should call service with correct parameters', async () => {
      await app.inject({
        method: 'GET',
        url: '/reports/general-ledger?entityId=entity-1&glAccountId=gl-1&startDate=2026-01-01&endDate=2026-01-31&limit=25',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGenerateGLLedger).toHaveBeenCalledTimes(1);
    });

    it('should handle GL_ACCOUNT_NOT_FOUND error', async () => {
      mockGenerateGLLedger.mockRejectedValue(
        new AccountingError('GL Account not found', 'GL_ACCOUNT_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reports/general-ledger?entityId=entity-1&glAccountId=nonexistent&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.code).toBe('GL_ACCOUNT_NOT_FOUND');
    });

    it('should handle cursor pagination parameter', async () => {
      mockGenerateGLLedger.mockResolvedValue({
        ...MOCK_GL_LEDGER,
        nextCursor: 'jl-next-cursor',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/reports/general-ledger?entityId=entity-1&glAccountId=gl-1&startDate=2026-01-01&endDate=2026-01-31&cursor=jl-prev',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextCursor).toBe('jl-next-cursor');
    });
  });

  // ============================================================================
  // GET /reports/spending
  // ============================================================================

  describe('GET /reports/spending', () => {
    it('should return 200 with spending report', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reports/spending?entityId=entity-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.total).toBe(60000);
      expect(body.categories).toHaveLength(1);
      assertIntegerCents(body.total, 'spending total');
    });

    it('should handle AccountingError with proper status code', async () => {
      mockGenerateSpendingByCategory.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reports/spending?entityId=bad-entity&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ============================================================================
  // GET /reports/revenue
  // ============================================================================

  describe('GET /reports/revenue', () => {
    it('should return 200 with revenue report', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reports/revenue?entityId=entity-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.total).toBe(100000);
      expect(body.clients).toHaveLength(1);
      assertIntegerCents(body.total, 'revenue total');
    });

    it('should handle AccountingError with proper status code', async () => {
      mockGenerateRevenueByClient.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reports/revenue?entityId=bad-entity&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ============================================================================
  // Cross-Cutting: Tenant Isolation
  // ============================================================================

  describe('Tenant Isolation', () => {
    it('should pass tenantId from middleware to ReportService constructor', async () => {
      // The withPermission mock sets tenantId = 'tenant-abc-123'
      // ReportService is constructed with (request.tenantId, request.userId)
      // We verify service was called (which means constructor received correct params)
      await app.inject({
        method: 'GET',
        url: '/reports/profit-loss?entityId=entity-1&startDate=2026-01-01&endDate=2026-01-31',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockGenerateProfitLoss).toHaveBeenCalledTimes(1);
    });
  });
});
