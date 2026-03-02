'use client';

import { type ReactNode } from 'react';
import { cn } from '../utils';
import { ConfidenceBadge } from './ConfidenceBadge';

export type InsightType = 'optimization' | 'alert' | 'observation' | 'confirmation';

export interface InsightCardProps {
  /** Insight type */
  type: InsightType;
  /** Insight title */
  title: string;
  /** Summary text */
  summary: string;
  /** Entity context */
  entity?: {
    name: string;
    flag: string;
  };
  /** Period context */
  period?: string;
  /** Impact statement */
  impact?: string;
  /** AI confidence (0-100) */
  confidence: number;
  /** Reasoning points */
  reasoning?: string[];
  /** Sources */
  sources?: string[];
  /** Review handler */
  onReview?: () => void;
  /** Ignore handler */
  onIgnore?: () => void;
  /** Apply handler (for actionable insights) */
  onApply?: () => void;
  /** Expanded state */
  expanded?: boolean;
  /** Additional classes */
  className?: string;
}

const typeConfig: Record<InsightType, { icon: string; borderColor: string; iconBg: string }> = {
  optimization: {
    icon: '💡',
    borderColor: 'border-l-violet-500',
    iconBg: 'bg-violet-100',
  },
  alert: {
    icon: '⚠',
    borderColor: 'border-l-amber-500',
    iconBg: 'bg-amber-100',
  },
  observation: {
    icon: '📊',
    borderColor: 'border-l-slate-400',
    iconBg: 'bg-slate-100',
  },
  confirmation: {
    icon: '✓',
    borderColor: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100',
  },
};

/**
 * AI insight card component with context and actions.
 *
 * @example
 * ```tsx
 * <InsightCard
 *   type="optimization"
 *   title="Tax Optimization"
 *   summary="You may deduct $48,000 for home office expenses."
 *   entity={{ name: "Canadian Corp", flag: "🇨🇦" }}
 *   impact="+$12,500 tax savings"
 *   confidence={87}
 *   onReview={() => openDetail(insight.id)}
 *   onIgnore={() => dismissInsight(insight.id)}
 * />
 * ```
 */
export function InsightCard({
  type,
  title,
  summary,
  entity,
  period,
  impact,
  confidence,
  reasoning,
  sources,
  onReview,
  onIgnore,
  onApply,
  expanded = false,
  className,
}: InsightCardProps) {
  const config = typeConfig[type];

  return (
    <div
      className={cn(
        'rounded-[10px] border border-l-4',
        'bg-violet-50/30',
        'border-violet-200/50',
        config.borderColor,
        'transition-all duration-[180ms]',
        'hover:shadow-md',
        className
      )}
      data-testid="insight-card"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg',
              config.iconBg
            )}
            aria-hidden="true"
          >
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-violet-600 text-sm" aria-hidden="true">✨</span>
              <h4 className="font-semibold text-slate-900 truncate">{title}</h4>
            </div>
            <p className="text-sm text-slate-600">{summary}</p>

            {/* Context strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-slate-500">
              {entity && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true">{entity.flag}</span>
                  {entity.name}
                </span>
              )}
              {period && <span>{period}</span>}
              {impact && (
                <span className="font-medium text-emerald-600">{impact}</span>
              )}
            </div>

            {/* Confidence */}
            <div className="mt-3">
              <ConfidenceBadge confidence={confidence} variant="compact" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (reasoning || sources) && (
        <div className="px-4 pb-4 pt-0 border-t border-violet-200/30">
          {reasoning && reasoning.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Why this matters
              </h5>
              <ul className="space-y-1">
                {reasoning.map((reason, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 mt-1" aria-hidden="true">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sources && sources.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Sources
              </h5>
              <ul className="space-y-1">
                {sources.map((source, i) => (
                  <li key={i} className="text-xs text-slate-500">
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {(onReview || onIgnore || onApply) && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-violet-200/30">
          {onIgnore && (
            <button
              onClick={onIgnore}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md',
                'text-slate-600 hover:bg-slate-100',
                'transition-colors duration-75'
              )}
            >
              Ignore
            </button>
          )}
          {onReview && (
            <button
              onClick={onReview}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md',
                'text-violet-700 hover:bg-violet-100',
                'transition-colors duration-75'
              )}
            >
              Review
            </button>
          )}
          {onApply && (
            <button
              onClick={onApply}
              className={cn(
                'px-3 py-1.5 text-sm font-semibold rounded-md',
                'bg-violet-600 text-white',
                'hover:bg-violet-700',
                'transition-colors duration-75'
              )}
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
