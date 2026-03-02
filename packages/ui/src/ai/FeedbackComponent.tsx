'use client';

import { useState } from 'react';
import { cn } from '../utils';

export interface FeedbackComponentProps {
  /** ID of the item being reviewed */
  itemId: string;
  /** Feedback submit handler */
  onFeedback: (helpful: boolean, comment?: string) => void;
  /** Show detailed feedback option */
  showDetailedOption?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Feedback collection component for AI suggestions.
 *
 * @example
 * ```tsx
 * <FeedbackComponent
 *   itemId={insight.id}
 *   onFeedback={(helpful, comment) => {
 *     submitFeedback({ insightId: insight.id, helpful, comment });
 *   }}
 * />
 * ```
 */
export function FeedbackComponent({
  itemId,
  onFeedback,
  showDetailedOption = true,
  compact = false,
  className,
}: FeedbackComponentProps) {
  const [submitted, setSubmitted] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<boolean | null>(null);

  const handleFeedback = (helpful: boolean) => {
    setSelectedFeedback(helpful);
    if (!showDetailedOption) {
      onFeedback(helpful);
      setSubmitted(true);
    }
  };

  const handleSubmitComment = () => {
    if (selectedFeedback !== null) {
      onFeedback(selectedFeedback, comment || undefined);
      setSubmitted(true);
      setShowCommentForm(false);
    }
  };

  if (submitted) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-slate-500',
          compact && 'text-xs',
          className
        )}
      >
        <span className="text-emerald-500" aria-hidden="true">✓</span>
        Thanks for your feedback!
      </div>
    );
  }

  if (showCommentForm) {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-sm text-slate-600">
          {selectedFeedback
            ? 'Great! Tell us more about why this was helpful (optional):'
            : 'Sorry to hear that. What could be better?'}
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Your feedback..."
          rows={3}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-slate-300',
            'text-sm placeholder:text-slate-400',
            'focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30',
            'resize-none'
          )}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmitComment}
            className={cn(
              'px-3 py-1.5 text-sm font-semibold rounded-md',
              'bg-violet-600 text-white',
              'hover:bg-violet-700',
              'transition-colors duration-75'
            )}
          >
            Submit
          </button>
          <button
            onClick={() => {
              if (selectedFeedback !== null) {
                onFeedback(selectedFeedback);
                setSubmitted(true);
              }
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md',
              'text-slate-600 hover:bg-slate-100',
              'transition-colors duration-75'
            )}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className={cn('text-slate-600', compact ? 'text-xs' : 'text-sm')}>
        Was this helpful?
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            handleFeedback(true);
            if (showDetailedOption) setShowCommentForm(true);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
            'border border-slate-200',
            'text-sm font-medium',
            'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700',
            'transition-colors duration-75',
            selectedFeedback === true &&
              'bg-emerald-50 border-emerald-300 text-emerald-700'
          )}
          aria-pressed={selectedFeedback === true}
        >
          <span aria-hidden="true">👍</span>
          Yes
        </button>
        <button
          onClick={() => {
            handleFeedback(false);
            if (showDetailedOption) setShowCommentForm(true);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
            'border border-slate-200',
            'text-sm font-medium',
            'hover:bg-red-50 hover:border-red-200 hover:text-red-700',
            'transition-colors duration-75',
            selectedFeedback === false &&
              'bg-red-50 border-red-300 text-red-700'
          )}
          aria-pressed={selectedFeedback === false}
        >
          <span aria-hidden="true">👎</span>
          No
        </button>
      </div>
    </div>
  );
}

export interface AILearningIndicatorProps {
  /** Number of feedback entries */
  feedbackCount: number;
  /** Current accuracy percentage */
  accuracy?: number;
  /** Additional classes */
  className?: string;
}

/**
 * Indicator showing AI learning progress.
 */
export function AILearningIndicator({
  feedbackCount,
  accuracy,
  className,
}: AILearningIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg',
        'bg-violet-50/50 border border-violet-200/50',
        className
      )}
    >
      <span className="text-violet-500 text-lg" aria-hidden="true">✨</span>
      <div>
        <h4 className="text-sm font-medium text-violet-800">AI is learning</h4>
        <p className="text-xs text-violet-600 mt-0.5">
          We've recorded {feedbackCount} categorization{' '}
          {feedbackCount === 1 ? 'preference' : 'preferences'}.
          {accuracy && (
            <span className="block mt-1">
              Current accuracy: <strong>{accuracy}%</strong>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
