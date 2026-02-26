import { prisma } from '@akount/db';
import { JournalEntryService } from '../../accounting/services/journal-entry.service';
import { InsightService } from './insight.service';
import { AIError } from '../errors';
import { logger } from '../../../lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Payload shape for JE_DRAFT actions (created by JESuggestionService) */
interface JEDraftPayload {
  journalEntryId: string;
  transactionId: string;
  lines: Array<{
    glAccountId: string;
    debitAmount: number;
    creditAmount: number;
  }>;
}

/** Payload shape for CATEGORIZATION actions */
interface CategorizationPayload {
  transactionId: string;
  categoryId: string;
  categoryName: string;
  confidence: number;
}

/** Payload shape for RULE_SUGGESTION actions */
interface RuleSuggestionPayload {
  ruleSuggestionId: string;
  suggestedRule: Record<string, unknown>;
  patternSummary: string;
  exampleTransactions: Array<{ id: string; description: string; amount: number }>;
  estimatedImpact: number;
}

/** Payload shape for ALERT actions (created by InsightGeneratorService) */
interface AlertPayload {
  insightType: string;
  triggerId: string;
  metadata: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  actionId: string;
  type: string;
  detail?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Action Executor Service
// ---------------------------------------------------------------------------

/**
 * Dispatches approved AI actions to their domain-specific execution logic.
 *
 * Registry pattern: each AIActionType maps to an executor method.
 * If execution fails, the error is captured but the action remains APPROVED
 * (the user explicitly approved it; we log the execution failure).
 */
export class ActionExecutorService {
  constructor(
    private tenantId: string,
    private entityId: string,
    private userId: string
  ) {}

  /**
   * Execute an approved action by dispatching to the correct handler.
   * Returns execution result (never throws — captures errors internally).
   */
  async execute(action: {
    id: string;
    type: string;
    payload: unknown;
  }): Promise<ExecutionResult> {
    try {
      switch (action.type) {
        case 'JE_DRAFT':
          return await this.executeJEDraft(action.id, action.payload as JEDraftPayload);

        case 'CATEGORIZATION':
          return await this.executeCategorization(action.id, action.payload as CategorizationPayload);

        case 'RULE_SUGGESTION':
          return await this.executeRuleSuggestion(action.id, action.payload as RuleSuggestionPayload);

        case 'ALERT':
          // ALERT approval is just acknowledgment — no automated execution
          return {
            success: true,
            actionId: action.id,
            type: 'ALERT',
            detail: 'Acknowledged (no automated execution)',
          };

        default:
          return {
            success: false,
            actionId: action.id,
            type: action.type,
            error: `Unknown action type: ${action.type}`,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown execution error';
      logger.error(
        { err: error, actionId: action.id, actionType: action.type },
        'Action execution failed'
      );
      return {
        success: false,
        actionId: action.id,
        type: action.type,
        error: message,
      };
    }
  }

  /**
   * Execute a RULE_SUGGESTION action: approve the linked RuleSuggestion,
   * which creates an active Rule from the suggested data.
   *
   * Idempotent: if the suggestion was already approved, returns success.
   */
  private async executeRuleSuggestion(
    actionId: string,
    payload: RuleSuggestionPayload
  ): Promise<ExecutionResult> {
    const { ruleSuggestionId } = payload;

    if (!ruleSuggestionId) {
      return {
        success: false,
        actionId,
        type: 'RULE_SUGGESTION',
        error: 'Missing ruleSuggestionId in action payload',
      };
    }

    try {
      const { RuleSuggestionService } = await import('./rule-suggestion.service');
      const service = new RuleSuggestionService(this.tenantId, this.userId);
      const { ruleId } = await service.approveSuggestion(ruleSuggestionId);

      return {
        success: true,
        actionId,
        type: 'RULE_SUGGESTION',
        detail: `Rule suggestion approved — created rule ${ruleId}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rule suggestion approval failed';

      // If already reviewed, treat as idempotent success
      if (message.includes('already reviewed')) {
        return {
          success: true,
          actionId,
          type: 'RULE_SUGGESTION',
          detail: 'Rule suggestion already reviewed (idempotent)',
        };
      }

      return {
        success: false,
        actionId,
        type: 'RULE_SUGGESTION',
        error: message,
      };
    }
  }

  /**
   * Execute a JE_DRAFT action: approve the linked DRAFT journal entry.
   *
   * Idempotent: if the JE is already POSTED, returns success.
   * If JE is VOIDED or deleted, returns failure (user must re-draft).
   */
  private async executeJEDraft(
    actionId: string,
    payload: JEDraftPayload
  ): Promise<ExecutionResult> {
    const { journalEntryId } = payload;

    if (!journalEntryId) {
      return {
        success: false,
        actionId,
        type: 'JE_DRAFT',
        error: 'Missing journalEntryId in action payload',
      };
    }

    // Verify the JE exists and check its current status
    const je = await prisma.journalEntry.findFirst({
      where: {
        id: journalEntryId,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      select: { id: true, status: true, entityId: true },
    });

    if (!je) {
      return {
        success: false,
        actionId,
        type: 'JE_DRAFT',
        error: 'Journal entry not found or deleted',
      };
    }

    // Idempotent: already approved
    if (je.status === 'POSTED') {
      return {
        success: true,
        actionId,
        type: 'JE_DRAFT',
        detail: 'Journal entry already posted (idempotent)',
      };
    }

    // Cannot approve voided entries
    if (je.status === 'VOIDED') {
      return {
        success: false,
        actionId,
        type: 'JE_DRAFT',
        error: 'Journal entry has been voided — cannot approve',
      };
    }

    // Approve via JournalEntryService (handles fiscal period, separation of duties)
    try {
      const jeService = new JournalEntryService(this.tenantId, this.userId);
      await jeService.approveEntry(journalEntryId);

      return {
        success: true,
        actionId,
        type: 'JE_DRAFT',
        detail: `Journal entry ${journalEntryId} approved and posted`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JE approval failed';
      return {
        success: false,
        actionId,
        type: 'JE_DRAFT',
        error: message,
      };
    }
  }

  /**
   * Execute a CATEGORIZATION action: apply the suggested category to a transaction.
   *
   * Idempotent: if already categorized with the same category, returns success.
   */
  private async executeCategorization(
    actionId: string,
    payload: CategorizationPayload
  ): Promise<ExecutionResult> {
    const { transactionId, categoryId } = payload;

    if (!transactionId || !categoryId) {
      return {
        success: false,
        actionId,
        type: 'CATEGORIZATION',
        error: 'Missing transactionId or categoryId in payload',
      };
    }

    // Verify the transaction exists with tenant isolation
    const txn = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { entity: { tenantId: this.tenantId } },
        deletedAt: null,
      },
      select: { id: true, categoryId: true },
    });

    if (!txn) {
      return {
        success: false,
        actionId,
        type: 'CATEGORIZATION',
        error: 'Transaction not found or deleted',
      };
    }

    // Idempotent: already categorized with same category
    if (txn.categoryId === categoryId) {
      return {
        success: true,
        actionId,
        type: 'CATEGORIZATION',
        detail: 'Transaction already categorized (idempotent)',
      };
    }

    // Verify the category exists and belongs to tenant
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!category) {
      return {
        success: false,
        actionId,
        type: 'CATEGORIZATION',
        error: 'Category not found or access denied',
      };
    }

    // Apply the category
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId },
    });

    return {
      success: true,
      actionId,
      type: 'CATEGORIZATION',
      detail: `Transaction ${transactionId} categorized`,
    };
  }

  /**
   * Handle rejection side-effects for JE_DRAFT actions.
   * Soft-deletes the linked draft JE so it doesn't appear in the GL.
   */
  async handleRejection(action: {
    id: string;
    type: string;
    payload: unknown;
  }): Promise<void> {
    switch (action.type) {
      case 'JE_DRAFT':
        return this.handleJEDraftRejection(action.payload as JEDraftPayload);
      case 'RULE_SUGGESTION':
        return this.handleRuleSuggestionRejection(action.payload as RuleSuggestionPayload);
      case 'ALERT':
        return this.handleAlertRejection(action.payload as AlertPayload);
      default:
        // Other types have no rejection side-effects
        return;
    }
  }

  /**
   * ALERT rejection: dismiss the linked insight so it doesn't resurface.
   * The triggerId in the payload maps to the insight's triggerId field.
   */
  private async handleAlertRejection(payload: AlertPayload): Promise<void> {
    if (!payload.triggerId) return;

    try {
      // Find the insight by triggerId
      const insight = await prisma.insight.findFirst({
        where: {
          triggerId: payload.triggerId,
          entity: { tenantId: this.tenantId },
          status: 'active',
        },
        select: { id: true },
      });

      if (insight) {
        const insightService = new InsightService(this.tenantId, this.userId);
        await insightService.dismissInsight(insight.id);
        logger.info(
          { triggerId: payload.triggerId, insightId: insight.id },
          'Dismissed insight linked to rejected ALERT action'
        );
      }
    } catch (error) {
      // Non-critical — log but don't propagate
      logger.error(
        { err: error, triggerId: payload.triggerId },
        'Failed to dismiss insight for rejected ALERT'
      );
    }
  }

  /** JE_DRAFT rejection: soft-delete the draft JE and unlink transaction */
  private async handleJEDraftRejection(payload: JEDraftPayload): Promise<void> {
    if (!payload.journalEntryId) return;

    try {
      // Soft-delete the draft JE (only if still DRAFT)
      const je = await prisma.journalEntry.findFirst({
        where: {
          id: payload.journalEntryId,
          entity: { tenantId: this.tenantId },
          status: 'DRAFT',
          deletedAt: null,
        },
        select: { id: true },
      });

      if (je) {
        await prisma.journalEntry.update({
          where: { id: je.id },
          data: { deletedAt: new Date() },
        });

        // Unlink the transaction from the draft JE
        if (payload.transactionId) {
          await prisma.transaction.updateMany({
            where: {
              id: payload.transactionId,
              journalEntryId: payload.journalEntryId,
            },
            data: { journalEntryId: null },
          });
        }

        logger.info(
          { journalEntryId: payload.journalEntryId },
          'Soft-deleted rejected draft JE'
        );
      }
    } catch (error) {
      // Non-critical: log but don't fail the rejection
      logger.warn(
        { err: error, journalEntryId: payload.journalEntryId },
        'Failed to cleanup rejected draft JE'
      );
    }
  }

  /**
   * RULE_SUGGESTION rejection: reject the linked RuleSuggestion.
   * This updates its status to REJECTED so it doesn't resurface.
   */
  private async handleRuleSuggestionRejection(payload: RuleSuggestionPayload): Promise<void> {
    if (!payload.ruleSuggestionId) return;

    try {
      const { RuleSuggestionService } = await import('./rule-suggestion.service');
      const service = new RuleSuggestionService(this.tenantId, this.userId);
      await service.rejectSuggestion(payload.ruleSuggestionId, 'Rejected via AI Action Feed');

      logger.info(
        { ruleSuggestionId: payload.ruleSuggestionId },
        'Rejected rule suggestion linked to AI action'
      );
    } catch (error) {
      // Non-critical: log but don't fail the rejection
      logger.warn(
        { err: error, ruleSuggestionId: payload.ruleSuggestionId },
        'Failed to reject rule suggestion for rejected action'
      );
    }
  }
}
