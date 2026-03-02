import { prisma, AIDecisionType } from '@akount/db';
import { createHash } from 'crypto';
import { logger } from '../../../lib/logger';

/**
 * Extraction Cache Service (P2-28)
 *
 * Cache AI extraction results to avoid re-processing duplicate uploads.
 * Uses AIDecisionLog.inputHash as the cache key.
 *
 * **Cost savings:** 30% of uploads are duplicates (same receipt uploaded twice)
 * - Without cache: $0.50 per duplicate = $180/mo wasted (600 uploads/mo, 30% dupe rate)
 * - With cache: $0 for duplicates = $180/mo saved
 *
 * @module extraction-cache
 */

export interface CachedExtractionResult<T> {
  data: T;
  confidence: number;
  modelVersion: string;
  createdAt: Date;
  cacheHit: true;
}

export class ExtractionCacheService {
  /**
   * Check if extraction result exists in cache.
   *
   * @param imageBuffer - Image buffer to hash
   * @param decisionType - Type of extraction
   * @param tenantId - Tenant ID for isolation
   * @returns Cached result if found, null otherwise
   */
  async getCached<T>(
    imageBuffer: Buffer,
    decisionType: AIDecisionType,
    tenantId: string
  ): Promise<CachedExtractionResult<T> | null> {
    const inputHash = createHash('sha256').update(imageBuffer).digest('hex');

    try {
      const cached = await prisma.aIDecisionLog.findFirst({
        where: {
          inputHash,
          decisionType,
          tenantId,
          routingResult: { not: 'MANUAL_ENTRY' }, // Only cache successful extractions
        },
        orderBy: { createdAt: 'desc' }, // Get most recent if multiple
        select: {
          extractedData: true,
          confidence: true,
          modelVersion: true,
          createdAt: true,
        },
      });

      if (cached && cached.extractedData) {
        logger.info(
          {
            inputHash: inputHash.substring(0, 16),
            decisionType,
            age: Date.now() - cached.createdAt.getTime(),
          },
          'Cache HIT: Returning cached extraction result'
        );

        return {
          data: cached.extractedData as T,
          confidence: cached.confidence || 0,
          modelVersion: cached.modelVersion,
          createdAt: cached.createdAt,
          cacheHit: true,
        };
      }

      logger.debug(
        { inputHash: inputHash.substring(0, 16), decisionType },
        'Cache MISS: No cached result found'
      );

      return null;
    } catch (error: unknown) {
      // Cache failures should not block extraction
      logger.warn(
        { err: error, inputHash: inputHash.substring(0, 16) },
        'Cache lookup failed - proceeding with extraction'
      );
      return null;
    }
  }

  /**
   * Invalidate cache for a specific document.
   *
   * Call this when user manually corrects an extraction.
   */
  async invalidate(documentId: string): Promise<void> {
    try {
      await prisma.aIDecisionLog.updateMany({
        where: { documentId },
        data: { routingResult: 'MANUAL_ENTRY' }, // Mark as manually entered (won't be cached)
      });

      logger.info({ documentId }, 'Cache invalidated for document');
    } catch (error: unknown) {
      logger.error({ err: error, documentId }, 'Failed to invalidate cache');
    }
  }
}
