import { prisma, AIDecisionType, AIRoutingResult, Prisma } from '@akount/db';
import { createHash } from 'crypto';
import { logger } from '../../../lib/logger';

/**
 * AI Decision Log Service
 *
 * Comprehensive audit trail for all AI-powered decisions.
 * Required for compliance (GDPR Article 22, PIPEDA, EU AI Act, SOC 2).
 *
 * **Every AI decision MUST be logged:**
 * - Document extraction (bills, invoices, statements)
 * - Transaction categorization
 * - Auto-matching
 * - Anomaly detection
 * - Natural language bookkeeping
 *
 * @module ai-decision-log
 */

export interface LogDecisionInput {
  /** Tenant ID (required for isolation) */
  tenantId: string;
  /** Entity ID (optional, for entity-scoped decisions) */
  entityId?: string;
  /** Source document ID (Bill, Invoice, Transaction, etc.) */
  documentId?: string;
  /** Type of AI decision */
  decisionType: AIDecisionType;
  /** Input data for hashing (PII-safe, for duplicate detection) */
  input: string | Buffer;
  /** Model version used (e.g., "pixtral-large-latest") */
  modelVersion: string;
  /** Confidence score 0-100 (optional) */
  confidence?: number;
  /** Extracted structured data (JSON) */
  extractedData?: Record<string, unknown>;
  /** Routing decision (auto-create, review, manual) */
  routingResult: AIRoutingResult;
  /** Human-readable explanation */
  aiExplanation?: string;
  /** Consent status at time of decision */
  consentStatus?: string;
  /** Processing time in milliseconds */
  processingTimeMs?: number;
  /** Total tokens consumed (input + output) for cost attribution (P0-2) */
  tokensUsed?: number;
}

export interface QueryDecisionsInput {
  /** Tenant ID (required for isolation) */
  tenantId: string;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by decision type */
  decisionType?: AIDecisionType;
  /** Filter by routing result */
  routingResult?: AIRoutingResult;
  /** Date range: from */
  dateFrom?: Date;
  /** Date range: to */
  dateTo?: Date;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export class AIDecisionLogService {
  /**
   * Log an AI decision for audit trail.
   *
   * @param input - Decision details
   * @returns Created log entry
   */
  async logDecision(input: LogDecisionInput) {
    // Create SHA256 hash of input (PII-safe, for duplicate detection)
    const inputHash = createHash('sha256')
      .update(typeof input.input === 'string' ? input.input : input.input.toString('base64'))
      .digest('hex');

    try {
      const entry = await prisma.aIDecisionLog.create({
        data: {
          tenantId: input.tenantId,
          entityId: input.entityId,
          documentId: input.documentId,
          decisionType: input.decisionType,
          inputHash,
          modelVersion: input.modelVersion,
          confidence: input.confidence,
          extractedData: input.extractedData ? (input.extractedData as Prisma.InputJsonValue) : Prisma.JsonNull,
          routingResult: input.routingResult,
          aiExplanation: input.aiExplanation,
          consentStatus: input.consentStatus,
          processingTimeMs: input.processingTimeMs,
          tokensUsed: input.tokensUsed, // P0-2: Track token usage for cost attribution
        },
        select: {
          id: true,
          tenantId: true,
          decisionType: true,
          routingResult: true,
          confidence: true,
          createdAt: true,
        },
      });

      logger.info(
        {
          logId: entry.id,
          tenantId: input.tenantId,
          decisionType: input.decisionType,
          routingResult: input.routingResult,
          confidence: input.confidence,
        },
        'AI decision logged'
      );

      return entry;
    } catch (error: unknown) {
      logger.error(
        {
          err: error,
          tenantId: input.tenantId,
          decisionType: input.decisionType,
        },
        'Failed to log AI decision'
      );

      throw error;
    }
  }

  /**
   * Query AI decision logs with filters.
   *
   * @param query - Query filters (tenantId required)
   * @returns Array of decision log entries
   */
  async queryDecisions(query: QueryDecisionsInput) {
    const where: {
      tenantId: string;
      entityId?: string;
      decisionType?: AIDecisionType;
      routingResult?: AIRoutingResult;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      tenantId: query.tenantId,
    };

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.decisionType) {
      where.decisionType = query.decisionType;
    }

    if (query.routingResult) {
      where.routingResult = query.routingResult;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = query.dateFrom;
      if (query.dateTo) where.createdAt.lte = query.dateTo;
    }

    try {
      const entries = await prisma.aIDecisionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
        select: {
          id: true,
          tenantId: true,
          entityId: true,
          documentId: true,
          decisionType: true,
          modelVersion: true,
          confidence: true,
          extractedData: true,
          routingResult: true,
          aiExplanation: true,
          consentStatus: true,
          processingTimeMs: true,
          createdAt: true,
        },
      });

      logger.info(
        {
          tenantId: query.tenantId,
          count: entries.length,
          filters: {
            decisionType: query.decisionType,
            routingResult: query.routingResult,
            dateRange: query.dateFrom || query.dateTo ? 'filtered' : 'all',
          },
        },
        'Queried AI decision logs'
      );

      return entries;
    } catch (error: unknown) {
      logger.error(
        {
          err: error,
          tenantId: query.tenantId,
        },
        'Failed to query AI decision logs'
      );

      throw error;
    }
  }

  /**
   * Get statistics for AI decisions by tenant.
   *
   * @param tenantId - Tenant ID
   * @param entityId - Optional entity ID filter
   * @returns Statistics summary
   */
  async getStatistics(tenantId: string, entityId?: string) {
    const where: { tenantId: string; entityId?: string } = { tenantId };
    if (entityId) where.entityId = entityId;

    try {
      const [
        totalDecisions,
        byType,
        byRouting,
        avgConfidence,
        avgProcessingTime,
      ] = await Promise.all([
        // Total count
        prisma.aIDecisionLog.count({ where }),

        // Group by decision type
        prisma.aIDecisionLog.groupBy({
          by: ['decisionType'],
          where,
          _count: { id: true },
        }),

        // Group by routing result
        prisma.aIDecisionLog.groupBy({
          by: ['routingResult'],
          where,
          _count: { id: true },
        }),

        // Average confidence
        prisma.aIDecisionLog.aggregate({
          where: { ...where, confidence: { not: null } },
          _avg: { confidence: true },
        }),

        // Average processing time
        prisma.aIDecisionLog.aggregate({
          where: { ...where, processingTimeMs: { not: null } },
          _avg: { processingTimeMs: true },
        }),
      ]);

      return {
        totalDecisions,
        byType: byType.map((g) => ({
          decisionType: g.decisionType,
          count: g._count.id,
        })),
        byRouting: byRouting.map((g) => ({
          routingResult: g.routingResult,
          count: g._count.id,
        })),
        avgConfidence: avgConfidence._avg.confidence || 0,
        avgProcessingTimeMs: avgProcessingTime._avg.processingTimeMs || 0,
      };
    } catch (error: unknown) {
      logger.error(
        { err: error, tenantId },
        'Failed to get AI decision statistics'
      );

      throw error;
    }
  }
}
