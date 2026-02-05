'use client';

import { cn } from '../utils';
import { ConfidenceBadge } from './ConfidenceBadge';

export interface SuggestionChipProps {
  /** Current value (if any) */
  currentValue?: string;
  /** AI suggested value */
  suggestedValue: string;
  /** Confidence (0-100) */
  confidence: number;
  /** Brief reasoning */
  reasoning?: string;
  /** Apply handler */
  onApply: () => void;
  /** Ignore handler */
  onIgnore: () => void;
  /** Create rule handler (optional) */
  onCreateRule?: () => void;
  /** Compact mode */
  compact?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Inline AI suggestion chip that appears next to form fields.
 *
 * @example
 * ```tsx
 * <SuggestionChip
 *   currentValue="Marketing"
 *   suggestedValue="Cloud Services"
 *   confidence={87}
 *   reasoning="AWS in description matches cloud vendor pattern"
 *   onApply={handleApply}
 *   onIgnore={handleIgnore}
 * />
 * ```
 */
export function SuggestionChip({
  currentValue,
  suggestedValue,
  confidence,
  reasoning,
  onApply,
  onIgnore,
  onCreateRule,
  compact = false,
  className,
}: SuggestionChipProps) {
  // Only show suggestions with high confidence
  if (confidence < 50) return null;

  return (
    <div
      className={cn(
        'rounded-lg border',
        'bg-violet-50/50 border-violet-200',
        compact ? 'p-2' : 'p-3',
        className
      )}
      role="alert"
      aria-live="polite"
      data-testid="suggestion-chip"
    >
      <div className="flex items-start gap-2">
        {/* AI indicator */}
        <span className="shrink-0 text-violet-500" aria-hidden="true">
          ✨
        </span>

        <div className="flex-1 min-w-0">
          {/* Suggestion text */}
          <div className={cn('text-sm', compact && 'text-xs')}>
            <span className="text-slate-500">AI Suggests: </span>
            <span className="font-medium text-violet-700">{suggestedValue}</span>
          </div>

          {/* Confidence */}
          <div className="mt-1">
            <ConfidenceBadge
              confidence={confidence}
              variant="compact"
              showLabel={false}
            />
          </div>

          {/* Reasoning (non-compact only) */}
          {!compact && reasoning && (
            <p className="mt-2 text-xs text-slate-500">{reasoning}</p>
          )}

          {/* Actions */}
          <div className={cn('flex items-center gap-2', compact ? 'mt-2' : 'mt-3')}>
            <button
              onClick={onApply}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-md',
                'bg-violet-600 text-white',
                'hover:bg-violet-700',
                'transition-colors duration-75',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-1'
              )}
            >
              Apply
            </button>
            <button
              onClick={onIgnore}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md',
                'text-slate-600 hover:bg-slate-200/50',
                'transition-colors duration-75',
                'focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-1'
              )}
            >
              Ignore
            </button>
            {!compact && onCreateRule && (
              <button
                onClick={onCreateRule}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md',
                  'text-violet-600 hover:bg-violet-100',
                  'transition-colors duration-75',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-1'
                )}
              >
                Always use this
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface InlineSuggestionProps {
  /** Suggested value */
  value: string;
  /** Confidence */
  confidence: number;
  /** Apply handler */
  onApply: () => void;
  /** Ignore handler */
  onIgnore: () => void;
  /** Additional classes */
  className?: string;
}

/**
 * Minimal inline suggestion for table cells.
 */
export function InlineSuggestion({
  value,
  confidence,
  onApply,
  onIgnore,
  className,
}: InlineSuggestionProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1',
        'rounded-md bg-violet-50 border border-violet-200',
        'text-xs',
        className
      )}
    >
      <span className="text-violet-500" aria-hidden="true">✨</span>
      <span className="font-medium text-violet-700">{value}</span>
      <span className="text-violet-400">({confidence}%)</span>
      <button
        onClick={onApply}
        className="ml-1 text-violet-600 hover:text-violet-800 font-medium"
        aria-label={`Apply suggestion: ${value}`}
      >
        ✓
      </button>
      <button
        onClick={onIgnore}
        className="text-slate-400 hover:text-slate-600"
        aria-label="Dismiss suggestion"
      >
        ✕
      </button>
    </div>
  );
}
