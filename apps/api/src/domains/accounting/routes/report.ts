import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateQuery } from '../../../middleware/validation';
import { statsRateLimitConfig } from '../../../middleware/rate-limit';
import { ReportService } from '../services/report.service';
import { reportExportService } from '../services/report-export.service';
import { AccountingError } from '../errors';
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
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   * - comparisonPeriod?: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR'
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/profit-loss',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(ProfitLossQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as ProfitLossQuery & { format?: string };
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateProfitLoss(query);
        const format = query.format || 'json';

        if (format === 'pdf') {
          const pdfBuffer = await generateProfitLossPdf(report);
          const filename = sanitizeFilename(`profit-loss-${query.startDate}-${query.endDate}`);
          return reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
            .send(pdfBuffer);
        }

        if (format === 'csv') {
          const csv = reportExportService.profitLossToCsv(report);
          const filename = sanitizeFilename(`profit-loss-${query.startDate}-${query.endDate}`);
          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
            .send(csv);
        }

        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/balance-sheet
   * Generate Balance Sheet (Statement of Financial Position)
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - asOfDate: string (ISO date)
   * - comparisonDate?: string (ISO date)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/balance-sheet',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(BalanceSheetQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as BalanceSheetQuery & { format?: string };
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateBalanceSheet(query);
        const format = query.format || 'json';

        if (format === 'pdf') {
          const pdfBuffer = await generateBalanceSheetPdf(report);
          const filename = sanitizeFilename(`balance-sheet-${query.asOfDate}`);
          return reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
            .send(pdfBuffer);
        }

        if (format === 'csv') {
          const csv = reportExportService.balanceSheetToCsv(report);
          const filename = sanitizeFilename(`balance-sheet-${query.asOfDate}`);
          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
            .send(csv);
        }

        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/cash-flow
   * Generate Cash Flow Statement
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/cash-flow',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(CashFlowQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as CashFlowQuery & { format?: string };
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateCashFlow(query);
        const format = query.format || 'json';

        if (format === 'pdf') {
          const pdfBuffer = await generateCashFlowPdf(report);
          const filename = sanitizeFilename(`cash-flow-${query.startDate}-${query.endDate}`);
          return reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
            .send(pdfBuffer);
        }

        if (format === 'csv') {
          const csv = reportExportService.cashFlowToCsv(report);
          const filename = sanitizeFilename(`cash-flow-${query.startDate}-${query.endDate}`);
          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
            .send(csv);
        }

        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/trial-balance
   * Generate Trial Balance (all GL accounts with debits/credits)
   *
   * Query params:
   * - entityId: string (required)
   * - asOfDate?: string (ISO date, defaults to today)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/trial-balance',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(TrialBalanceQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as TrialBalanceQuery & { format?: string };
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateTrialBalance(query);
        const format = query.format || 'json';

        if (format === 'csv') {
          const csv = reportExportService.trialBalanceToCsv(report);
          const filename = sanitizeFilename(`trial-balance-${query.asOfDate}`);
          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
            .send(csv);
        }

        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/general-ledger
   * Generate GL Ledger (account activity detail with running balance)
   *
   * Query params:
   * - entityId: string (required)
   * - glAccountId: string (required)
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   * - cursor?: string (CUID for pagination)
   * - limit?: number (default 50, max 200)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/general-ledger',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(GLLedgerQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as GLLedgerQuery & { format?: string };
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateGLLedger(query);
        const format = query.format || 'json';

        if (format === 'csv') {
          const csv = reportExportService.glLedgerToCsv(
            report.entries,
            report.accountCode,
            report.accountName,
            report.currency
          );
          const filename = sanitizeFilename(`gl-ledger-${report.accountCode}-${query.startDate}-${query.endDate}`);
          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
            .send(csv);
        }

        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/spending
   * Generate Spending by Category Report
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/spending',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(SpendingQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as SpendingQuery;
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateSpendingByCategory(query);
        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );

  /**
   * GET /reports/revenue
   * Generate Revenue by Client Report
   *
   * Query params:
   * - entityId?: string (optional - omit for multi-entity consolidation)
   * - startDate: string (ISO date)
   * - endDate: string (ISO date)
   *
   * Rate limit: 50 req/min (expensive aggregation)
   * Permission: accounting:reports VIEW
   */
  fastify.get(
    '/revenue',
    {
      ...withPermission('accounting', 'reports', 'VIEW'),
      config: {
        rateLimit: statsRateLimitConfig(),
      },
      preValidation: [validateQuery(RevenueQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId || !request.userId) {
        return reply.status(500).send({ error: 'Missing tenant context' });
      }

      const query = request.query as RevenueQuery;
      const service = new ReportService(request.tenantId, request.userId);

      try {
        const report = await service.generateRevenueByClient(query);
        return reply.send(report);
      } catch (error) {
        return handleAccountingError(error, reply);
      }
    }
  );
}

/**
 * Sanitize filename to prevent path traversal and special characters.
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
}

/**
 * Handle AccountingError instances with proper status codes
 */
function handleAccountingError(error: unknown, reply: FastifyReply) {
  if (error instanceof AccountingError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  // Generic server error
  reply.request.log.error({ err: error }, 'Report generation error');
  return reply.status(500).send({
    error: 'Internal server error',
  });
}
