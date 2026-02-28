import { prisma, AIDecisionType, AIRoutingResult } from '@akount/db';
import { MistralProvider } from './providers/mistral.provider';
import { AIDecisionLogService } from './ai-decision-log.service';
import { logger } from '../../../lib/logger';
import { env } from '../../../lib/env';

/**
 * Communication Drafts Service
 *
 * Generates AI-powered drafts for client communications:
 * - Payment reminders for overdue invoices
 * - Monthly summary reports (optional)
 *
 * **CRITICAL: User Review Required**
 * - Drafts are NEVER auto-sent
 * - User must review and manually send via their email client
 * - Service returns text only (no email sending functionality)
 *
 * **Compliance:**
 * - All AI decisions logged to AIDecisionLog
 * - Respects user consent (via middleware)
 * - Professional, friendly tone
 *
 * @module communication-drafts
 */

export interface PaymentReminderInput {
  /** Invoice ID to generate reminder for */
  invoiceId: string;
  /** Tenant ID (required for isolation) */
  tenantId: string;
  /** Entity ID (required for context) */
  entityId: string;
  /** Optional custom tone override */
  tone?: 'formal' | 'friendly' | 'urgent';
}

export interface PaymentReminderDraft {
  /** Email subject line */
  subject: string;
  /** Email body (plain text) */
  body: string;
  /** Tone used for generation */
  tone: 'formal' | 'friendly' | 'urgent';
  /** AI confidence score 0-100 */
  confidence: number;
  /** Invoice details for context */
  invoiceDetails: {
    invoiceNumber: string;
    clientName: string;
    total: number; // Integer cents
    currency: string;
    dueDate: Date;
    daysOverdue: number;
  };
  /** Disclaimer text */
  disclaimer: string;
}

export class CommunicationDraftsService {
  private mistral: MistralProvider;
  private decisionLog: AIDecisionLogService;

  constructor() {
    this.mistral = new MistralProvider(env.MISTRAL_API_KEY);
    this.decisionLog = new AIDecisionLogService();
  }

  /**
   * Generate a payment reminder draft for an overdue invoice.
   *
   * @param input - Payment reminder input
   * @returns Draft email with subject, body, and context
   */
  async generatePaymentReminder(
    input: PaymentReminderInput
  ): Promise<PaymentReminderDraft> {
    const startTime = Date.now();

    // Fetch invoice with client details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: input.invoiceId,
        entity: { tenantId: input.tenantId },
        deletedAt: null,
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        currency: true,
        dueDate: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found or access denied');
    }

    if (!invoice.client.email) {
      throw new Error('Client has no email address on file');
    }

    // Calculate days overdue
    const now = new Date();
    const daysOverdue = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue < 0) {
      throw new Error('Invoice is not overdue');
    }

    // Determine tone (default: friendly if <30 days, formal if 30-60, urgent if >60)
    const tone =
      input.tone ||
      (daysOverdue > 60 ? 'urgent' : daysOverdue > 30 ? 'formal' : 'friendly');

    // Build prompt for Mistral
    const prompt = this.buildPaymentReminderPrompt(
      invoice.client.name,
      invoice.invoiceNumber,
      invoice.total,
      invoice.currency,
      invoice.dueDate,
      daysOverdue,
      tone
    );

    // Call Mistral to generate draft
    const response = await this.mistral.chat(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.3, // Lower temp for consistent, professional tone
        maxTokens: 512,
      }
    );

    const draftText = response.content.trim();

    // Extract subject and body (format: "Subject: ...\n\nBody: ...")
    const { subject, body } = this.parseEmailDraft(draftText);

    // Calculate confidence (simple heuristic: longer = more confident)
    const confidence = Math.min(85, Math.max(70, Math.floor(body.length / 10)));

    const processingTimeMs = Date.now() - startTime;

    // Log decision to audit trail
    await this.decisionLog.logDecision({
      tenantId: input.tenantId,
      entityId: input.entityId,
      documentId: invoice.id,
      decisionType: AIDecisionType.NL_BOOKKEEPING, // Closest existing type for communication generation
      input: prompt,
      modelVersion: response.model || 'mistral-large-latest',
      confidence,
      extractedData: {
        subject,
        bodyLength: body.length,
        tone,
        daysOverdue,
      },
      routingResult: AIRoutingResult.QUEUED_FOR_REVIEW, // Always requires review before sending
      aiExplanation: `Generated ${tone} payment reminder for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`,
      processingTimeMs,
      tokensUsed: response.usage?.totalTokens,
    });

    logger.info(
      {
        tenantId: input.tenantId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        daysOverdue,
        tone,
        confidence,
        processingTimeMs,
      },
      'Generated payment reminder draft'
    );

    return {
      subject,
      body,
      tone,
      confidence,
      invoiceDetails: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.name,
        total: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        daysOverdue,
      },
      disclaimer:
        'This is an AI-generated draft. Please review and edit before sending to ensure accuracy and tone.',
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Build Mistral prompt for payment reminder generation.
   */
  private buildPaymentReminderPrompt(
    clientName: string,
    invoiceNumber: string,
    total: number,
    currency: string,
    dueDate: Date,
    daysOverdue: number,
    tone: 'formal' | 'friendly' | 'urgent'
  ): string {
    const formattedAmount = this.formatCurrency(total, currency);
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const toneInstructions = {
      friendly:
        'Use a friendly, conversational tone. Be polite and understanding. Assume this is the first reminder.',
      formal:
        'Use a professional, formal tone. Be respectful but firm. This is a follow-up reminder.',
      urgent:
        'Use an urgent but professional tone. Emphasize the seriousness of the overdue status. This is a final reminder before escalation.',
    };

    return `Generate a payment reminder email for an overdue invoice.

**Client Details:**
- Name: ${clientName}
- Invoice Number: ${invoiceNumber}
- Amount Due: ${formattedAmount}
- Original Due Date: ${formattedDueDate}
- Days Overdue: ${daysOverdue}

**Tone:** ${tone}
${toneInstructions[tone]}

**Instructions:**
- Start with "Subject:" followed by the subject line
- Then "Body:" followed by the email body
- Address the client by name
- Mention the invoice number and amount
- Request payment as soon as possible
- Provide a clear call-to-action
- Keep the email concise (2-3 paragraphs maximum)
- Do NOT include sender signature or company name (user will add this)
- Use professional language throughout

Generate the email now:`;
  }

  /**
   * Parse Mistral output into subject and body.
   */
  private parseEmailDraft(draftText: string): { subject: string; body: string } {
    const lines = draftText.split('\n');

    let subject = '';
    let bodyLines: string[] = [];
    let inBody = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Subject:')) {
        subject = trimmed.replace('Subject:', '').trim();
      } else if (trimmed.startsWith('Body:')) {
        inBody = true;
      } else if (inBody && trimmed) {
        bodyLines.push(trimmed);
      }
    }

    // Fallback: if format not matched, use heuristic
    if (!subject || bodyLines.length === 0) {
      const fallbackLines = draftText.split('\n').filter((l) => l.trim());
      subject = fallbackLines[0] || 'Payment Reminder';
      bodyLines = fallbackLines.slice(1);
    }

    return {
      subject,
      body: bodyLines.join('\n\n'),
    };
  }

  /**
   * Format currency for display.
   * Integer cents → locale string.
   */
  private formatCurrency(cents: number, currency: string): string {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(dollars);
  }
}
