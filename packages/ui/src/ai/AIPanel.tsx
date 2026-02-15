'use client';

import { type ReactNode } from 'react';
import { cn } from '../utils';
import { InsightCard, type InsightType } from './InsightCard';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  summary: string;
  entity?: { name: string; flag: string };
  period?: string;
  impact?: string;
  confidence: number;
}

export interface AIPanelProps {
  /** Whether panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Insights grouped by type */
  insights: Insight[];
  /** Insight click handler */
  onInsightClick?: (id: string) => void;
  /** Insight ignore handler */
  onInsightIgnore?: (id: string) => void;
  /** View history handler */
  onViewHistory?: () => void;
  /** Additional classes */
  className?: string;
}

/**
 * AI Advisor side panel for displaying insights.
 *
 * @example
 * ```tsx
 * <AIPanel
 *   isOpen={showAIPanel}
 *   onClose={() => setShowAIPanel(false)}
 *   insights={insights}
 *   onInsightClick={(id) => openInsightDetail(id)}
 * />
 * ```
 */
export function AIPanel({
  isOpen,
  onClose,
  insights,
  onInsightClick,
  onInsightIgnore,
  onViewHistory,
  className,
}: AIPanelProps) {
  // Group insights by type
  const alertInsights = insights.filter((i) => i.type === 'alert');
  const optimizationInsights = insights.filter((i) => i.type === 'optimization');
  const observationInsights = insights.filter((i) => i.type === 'observation');
  const confirmationInsights = insights.filter((i) => i.type === 'confirmation');

  const groups = [
    { key: 'alert', label: 'Attention Required', insights: alertInsights },
    { key: 'optimization', label: 'Optimizations', insights: optimizationInsights },
    { key: 'observation', label: 'Observations', insights: observationInsights },
    { key: 'confirmation', label: 'Confirmations', insights: confirmationInsights },
  ].filter((g) => g.insights.length > 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-[360px] z-50',
          'bg-white/95 backdrop-blur-xl',
          'border-l border-slate-200/50',
          'shadow-xl',
          'flex flex-col',
          'transition-transform duration-[240ms] ease-[cubic-bezier(0.2,0,0,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        aria-label="AI Advisor panel"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
          <div className="flex items-center gap-2">
            <span className="text-violet-500 text-xl" aria-hidden="true">✨</span>
            <div>
              <h2 className="font-heading font-semibold text-slate-900">
                Akount Advisor
              </h2>
              <p className="text-xs text-slate-500">Watching your finances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg',
              'text-slate-400 hover:text-slate-600',
              'hover:bg-slate-100',
              'transition-colors duration-75'
            )}
            aria-label="Close panel"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-4xl mb-4" aria-hidden="true">🎉</span>
              <h3 className="font-medium text-slate-900 mb-1">All caught up!</h3>
              <p className="text-sm text-slate-500">
                No new insights at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.key}>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    {group.label}
                    <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">
                      {group.insights.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {group.insights.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        type={insight.type}
                        title={insight.title}
                        summary={insight.summary}
                        entity={insight.entity}
                        period={insight.period}
                        impact={insight.impact}
                        confidence={insight.confidence}
                        onReview={
                          onInsightClick
                            ? () => onInsightClick(insight.id)
                            : undefined
                        }
                        onIgnore={
                          onInsightIgnore
                            ? () => onInsightIgnore(insight.id)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {onViewHistory && (
          <div className="p-4 border-t border-slate-200/50">
            <button
              onClick={onViewHistory}
              className={cn(
                'w-full px-4 py-2 text-sm font-medium rounded-lg',
                'text-slate-600 hover:bg-slate-100',
                'transition-colors duration-75'
              )}
            >
              View History
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
