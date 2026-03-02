import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateQuery } from '../../../middleware/validation';
import { statsRateLimitConfig } from '../../../middleware/rate-limit';
import { ReportService } from '../services/report.service';
import { reportExportService } from '../services/report-export.service';
import { handleAccountingError } from '../errors';
import { generateProfitLossPdf } from '../templates/profit-loss-pdf';
import { generateBalanceSheetPdf } from '../templates/balance-sheet-pdf';
import { generateCashFlowPdf } from '../templates/cash-flow-pdf';
import {
  ProfitLossQuerySchema,
  BalanceSheetQuerySchema,
  CashFlowQuerySchema,
  TrialBalanceQuerySchema,
  GLLedgerQuerySchema,
  SpendingQuerySchema,
  RevenueQuerySchema,
  type ProfitLossQuery,
  type BalanceSheetQuery,
  type CashFlowQuery,
  type TrialBalanceQuery,
  type GLLedgerQuery,
  type SpendingQuery,
  type RevenueQuery,
} from '../schemas/report.schema';

// ============================================================================
// Report Handler Helper
// ============================================================================

interface ExportConfig<TQuery, TReport> {
  pdf?: (report: TReport) => Promise<Buffer>;
  csv?: (report: TReport) => string;
  filename: (query: TQuery, report: TReport) => string;
}

/**
 * Create a standardized report route handler.
 * Eliminates repeated tenant context checks, ReportService creation,
 * format dispatching (pdf/csv/json), and error handling boilerplate.
 */
function createReportHandler<TQuery extends { format?: string }, TReport>(
  generate: (service: ReportService, query: TQuery) => Promise<TReport>,
  exports?: ExportConfig<TQuery, TReport>,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request, reply) => {
    if (!request.tenantId || !request.userId) {
      return reply.status(500).send({ error: 'Missing tenant context' });
    }

    const query = request.query as TQuery;
    const service = new ReportService(request.tenantId, request.userId);

    try {
      const report = await generate(service, query);
      const format = query.format || 'json';

      if (exports) {
        if (format === 'pdf' && exports.pdf) {
          const pdfBuffer = await exports.pdf(report);
          const filename = sanitizeFilename(exports.filename(query, report));
          return reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
            .send(pdfBuffer);
        }

        if (format === 'csv' && exports.csv) {
          const csv = exports.csv(report);
          const filename = sanitizeFilename(exports.filename(query, report));
          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
            .send(csv);
        }
      }

      return reply.send(report);
    } catch (error) {
      return handleAccountingError(error, reply);
    }
  };
}

// ============================================================================
// Routes
// ============================================================================

/** Shared route options for all report endpoints */
const reportRouteOptions = (schema: Parameters<typeof validateQuery>[0]) => ({
  ...withPermission('accounting', 'reports', 'VIEW'),
  config: { rateLimit: statsRateLimitConfig() },
  preValidation: [validateQuery(schema)],
});

/**
 * Accounting Reports Routes
 *
 * Financial statements and management reports.
 * All routes use statsRateLimit (50 req/min) for expensive aggregation queries.
 * All routes require accounting:reports permission (VIEW level).
 */
export async function reportRoutes(fastify: FastifyInstance) {
  /**
   * GET /reports/profit-loss
   * Generate Profit & Loss Statement (Income Statement)
   */
  fastify.get(
    '/profit-loss',
    reportRouteOptions(ProfitLossQuerySchema),
    createReportHandler<ProfitLossQuery, Awaited<ReturnType<ReportService['generateProfitLoss']>>>(
      (service, query) => service.generateProfitLoss(query),
      {
        pdf: (report) => generateProfitLossPdf(report),
        csv: (report) => reportExportService.profitLossToCsv(report),
        filename: (query) => `profit-loss-${query.startDate}-${query.endDate}`,
      },
    ),
  );

  /**
   * GET /reports/balance-sheet
   * Generate Balance Sheet (Statement of Financial Position)
   */
  fastify.get(
    '/balance-sheet',
    reportRouteOptions(BalanceSheetQuerySchema),
    createReportHandler<BalanceSheetQuery, Awaited<ReturnType<ReportService['generateBalanceSheet']>>>(
      (service, query) => service.generateBalanceSheet(query),
      {
        pdf: (report) => generateBalanceSheetPdf(report),
        csv: (report) => reportExportService.balanceSheetToCsv(report),
        filename: (query) => `balance-sheet-${query.asOfDate}`,
      },
    ),
  );

  /**
   * GET /reports/cash-flow
   * Generate Cash Flow Statement
   */
  fastify.get(
    '/cash-flow',
    reportRouteOptions(CashFlowQuerySchema),
    createReportHandler<CashFlowQuery, Awaited<ReturnType<ReportService['generateCashFlow']>>>(
      (service, query) => service.generateCashFlow(query),
      {
        pdf: (report) => generateCashFlowPdf(report),
        csv: (report) => reportExportService.cashFlowToCsv(report),
        filename: (query) => `cash-flow-${query.startDate}-${query.endDate}`,
      },
    ),
  );

  /**
   * GET /reports/trial-balance
   * Generate Trial Balance (all GL accounts with debits/credits)
   */
  fastify.get(
    '/trial-balance',
    reportRouteOptions(TrialBalanceQuerySchema),
    createReportHandler<TrialBalanceQuery, Awaited<ReturnType<ReportService['generateTrialBalance']>>>(
      (service, query) => service.generateTrialBalance(query),
      {
        csv: (report) => reportExportService.trialBalanceToCsv(report),
        filename: (query) => `trial-balance-${query.asOfDate}`,
      },
    ),
  );

  /**
   * GET /reports/general-ledger
   * Generate GL Ledger (account activity detail with running balance)
   */
  fastify.get(
    '/general-ledger',
    reportRouteOptions(GLLedgerQuerySchema),
    createReportHandler<GLLedgerQuery, Awaited<ReturnType<ReportService['generateGLLedger']>>>(
      (service, query) => service.generateGLLedger(query),
      {
        csv: (report) => reportExportService.glLedgerToCsv(
          report.entries, report.accountCode, report.accountName, report.currency,
        ),
        filename: (query, report) => `gl-ledger-${report.accountCode}-${query.startDate}-${query.endDate}`,
      },
    ),
  );

  /**
   * GET /reports/spending
   * Generate Spending by Category Report
   */
  fastify.get(
    '/spending',
    reportRouteOptions(SpendingQuerySchema),
    createReportHandler<SpendingQuery, Awaited<ReturnType<ReportService['generateSpendingByCategory']>>>(
      (service, query) => service.generateSpendingByCategory(query),
    ),
  );

  /**
   * GET /reports/revenue
   * Generate Revenue by Client Report
   */
  fastify.get(
    '/revenue',
    reportRouteOptions(RevenueQuerySchema),
    createReportHandler<RevenueQuery, Awaited<ReturnType<ReportService['generateRevenueByClient']>>>(
      (service, query) => service.generateRevenueByClient(query),
    ),
  );
}

/**
 * Sanitize filename to prevent path traversal and special characters.
 */
function sanitizeFilename(name: string): string {
  const sanitized = name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
  return sanitized || 'report';
}
