'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@akount/ui';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/client-browser';

/**
 * Report Narration Component (DEV-251)
 *
 * Displays AI-generated plain-English summaries of financial reports.
 * Collapsible section with Newsreader italic font (AI styling per design system).
 *
 * **Features:**
 * - "Generate Summary" button on first load
 * - Collapsible narration section
 * - Loading skeleton while generating
 * - Refresh capability
 * - Confidence badge
 * - Disclaimer
 *
 * @example
 * ```tsx
 * <ReportNarration
 *   reportType="PROFIT_LOSS"
 *   reportData={plData}
 *   entityId={entityId}
 * />
 * ```
 */

type ReportType = 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'MONTH_END';

interface ReportNarrationResponse {
  narration: string;
  disclaimer: string;
  confidence: number;
  cached: boolean;
  generatedAt: string;
}

export interface ReportNarrationProps {
  /** Report type for narration */
  reportType: ReportType;
  /** Report data to summarize */
  reportData: unknown;
  /** Entity ID (for tenant isolation) */
  entityId: string;
  /** Optional custom title */
  title?: string;
}

export function ReportNarration({
  reportType,
  reportData,
  entityId,
  title = 'AI Summary',
}: ReportNarrationProps) {
  const [narration, setNarration] = useState<ReportNarrationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate narration by calling the API
   */
  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<ReportNarrationResponse>(
        '/api/ai/reports/narration',
        {
          method: 'POST',
          body: JSON.stringify({
            reportType,
            reportData,
            entityId,
          }),
        }
      );

      setNarration(response);
      setIsExpanded(true);
      toast.success(response.cached ? 'Loaded from cache' : 'Summary generated');
    } catch (err) {
      console.error('[ReportNarration] Generation failed:', err);

      // Check for missing consent (403)
      if (err instanceof Error && err.message.includes('403')) {
        setError('Enable AI features in Settings to use report summaries');
        toast.error('Enable AI in Settings');
      } else if (err instanceof Error && err.message.includes('503')) {
        setError('AI service temporarily unavailable. Try again in a moment.');
        toast.error('AI service unavailable');
      } else {
        setError('Failed to generate summary. Please try again.');
        toast.error('Generation failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Refresh narration (regenerate from API)
   */
  async function handleRefresh() {
    await handleGenerate();
  }

  // Show generate button if no narration yet
  if (!narration && !isLoading && !error) {
    return (
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ak-purple" />
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <Badge variant="ai" className="text-micro px-2 py-0.5">
              Beta
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            className="gap-2 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
          >
            <Sparkles className="h-3.5 w-3.5 text-ak-purple" />
            Generate Summary
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-ak-purple animate-spin" />
          <p className="text-sm text-muted-foreground">
            Generating AI summary...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="glass rounded-xl p-6 mb-6 border border-destructive/30">
        <div className="flex items-center justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerate}
            className="gap-2 rounded-lg hover:bg-ak-bg-3"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show narration (narration is guaranteed non-null here)
  if (!narration) return null;

  return (
    <div className="glass rounded-xl mb-6 overflow-hidden">
      {/* Header (always visible) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-ak-bg-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ak-purple" />
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <Badge variant="ai" className="text-micro px-2 py-0.5">
            {narration.confidence}% confidence
          </Badge>
          {narration.cached && (
            <Badge variant="default" className="text-micro px-2 py-0.5">
              Cached
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isLoading}
            className="h-7 w-7 p-0 rounded-lg hover:bg-ak-bg-4"
            title="Refresh summary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Narration Content (collapsible) */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-3 border-t border-ak-border">
          {/* AI Narrative - Newsreader italic (AI styling) */}
          <p className="text-sm text-foreground font-heading italic leading-relaxed pt-4">
            {narration.narration}
          </p>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground">
            {narration.disclaimer}
          </p>

          {/* Metadata (subtle) */}
          <p className="text-micro text-muted-foreground/60">
            Generated {new Date(narration.generatedAt).toLocaleString()}
            {narration.cached && ' (from cache)'}
          </p>
        </div>
      )}
    </div>
  );
}
