import { Badge, type BadgeProps } from '../primitives/Badge';
import { Sparkles } from 'lucide-react';

/**
 * AI Transparency Badge (DEV-261)
 *
 * Visual indicator that a record was created or modified by AI.
 *
 * **EU AI Act Article 52:** Users must be informed when interacting with AI systems.
 *
 * **Usage:**
 * ```tsx
 * // On AI-created bills/invoices
 * <AIBadge />
 *
 * // With confidence score
 * <AIBadge confidence={85} />
 *
 * // Custom variant
 * <AIBadge variant="review" confidence={65} />
 * ```
 *
 * @module ai-badge
 */

export interface AIBadgeProps {
  /** Confidence score (0-100) - optional */
  confidence?: number;
  /** Visual variant override */
  variant?: 'ai' | 'review' | 'warning';
  /** Additional classes */
  className?: string;
}

/**
 * Badge indicating AI-created/modified content.
 *
 * **Variants:**
 * - `ai` (default): Purple badge for AI-created content
 * - `review`: Orange badge for AI content needing review
 * - `warning`: Yellow badge for low-confidence AI extractions
 *
 * **Confidence indicator:**
 * - ≥80%: ai variant (high confidence)
 * - 60-79%: review variant (needs review)
 * - <60%: warning variant (low confidence)
 */
export function AIBadge({ confidence, variant, className }: AIBadgeProps) {
  // Auto-select variant based on confidence if not explicitly provided
  const badgeVariant = variant || (
    confidence !== undefined
      ? confidence >= 80
        ? 'ai'
        : confidence >= 60
        ? 'review'
        : 'warning'
      : 'ai'
  );

  const label = confidence !== undefined
    ? `AI ${confidence}%`
    : 'AI';

  return (
    <Badge
      variant={badgeVariant}
      icon={<Sparkles className="h-3 w-3" />}
      size="sm"
      className={className}
    >
      {label}
    </Badge>
  );
}

/**
 * Helper to determine if a record was AI-created.
 *
 * Checks for indicators like notes starting with "AI-extracted" or billNumber starting with "AI-".
 *
 * @param record - Bill, Invoice, or any record with notes
 * @returns true if AI-created
 */
export function isAICreated(record: { notes?: string | null; billNumber?: string; invoiceNumber?: string }): boolean {
  return (
    (record.notes?.startsWith('AI-extracted') ?? false) ||
    (record.billNumber?.startsWith('AI-') ?? false) ||
    (record.invoiceNumber?.startsWith('AI-') ?? false)
  );
}
