import { cn } from '../utils';

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit?: number;
  credit?: number;
}

export interface FiscalPeriod {
  id: string;
  name: string;
  status: 'open' | 'review' | 'locked';
}

export interface JournalEntryEntity {
  name: string;
  flag: string;
}

export interface JournalEntryUser {
  name: string;
}

export interface JournalEntryPreviewProps {
  /** Entity context */
  entity?: JournalEntryEntity;
  /** Fiscal period */
  period?: FiscalPeriod;
  /** Entry date */
  date: string;
  /** Journal lines */
  lines: JournalLine[];
  /** Currency */
  currency: string;
  /** Created by user */
  createdBy?: JournalEntryUser;
  /** Created timestamp */
  createdAt?: string;
  /** Cancel handler */
  onCancel?: () => void;
  /** Save draft handler */
  onSaveDraft?: () => void;
  /** Post handler */
  onPost?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Journal entry preview component showing debits/credits before posting.
 *
 * @example
 * ```tsx
 * <JournalEntryPreview
 *   entity={{ name: "Canadian Corp", flag: "🇨🇦" }}
 *   period={{ id: "q4-2025", name: "Q4 2025", status: "open" }}
 *   date="2025-12-31"
 *   currency="CAD"
 *   lines={[
 *     { accountId: "1", accountCode: "5100", accountName: "Cloud Services", debit: 120000 },
 *     { accountId: "2", accountCode: "1000", accountName: "Chase Account", credit: 120000 }
 *   ]}
 *   onCancel={handleCancel}
 *   onSaveDraft={handleSaveDraft}
 *   onPost={handlePost}
 * />
 * ```
 */
export function JournalEntryPreview({
  entity,
  period,
  date,
  lines,
  currency,
  createdBy,
  createdAt,
  onCancel,
  onSaveDraft,
  onPost,
  loading = false,
  className,
}: JournalEntryPreviewProps) {
  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = totalDebits === totalCredits;
  const difference = totalDebits - totalCredits;

  const formatAmount = (cents: number | undefined) => {
    if (cents === undefined || cents === 0) return '';
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  };

  const periodStatusColors = {
    open: 'bg-emerald-100 text-emerald-700',
    review: 'bg-amber-100 text-amber-700',
    locked: 'bg-slate-100 text-slate-600',
  };

  return (
    <div
      className={cn(
        'rounded-[14px] border border-slate-200',
        'bg-white shadow-sm',
        'overflow-hidden',
        className
      )}
      data-testid="journal-entry-preview"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
        <h3 className="font-heading font-semibold text-slate-900 mb-3">
          Journal Entry Preview
        </h3>

        <div className="grid grid-cols-3 gap-4 text-sm">
          {entity && (
            <div>
              <span className="text-slate-500">Entity:</span>
              <span className="ml-2 font-medium">
                {entity.flag} {entity.name}
              </span>
            </div>
          )}
          {period && (
            <div>
              <span className="text-slate-500">Period:</span>
              <span className="ml-2 font-medium">{period.name}</span>
              <span
                className={cn(
                  'ml-2 px-1.5 py-0.5 text-xs rounded',
                  periodStatusColors[period.status]
                )}
              >
                {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
              </span>
            </div>
          )}
          <div>
            <span className="text-slate-500">Date:</span>
            <span className="ml-2 font-medium">{date}</span>
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="px-5 py-4">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="text-left pb-2">Account</th>
              <th className="text-right pb-2 w-32">Debit</th>
              <th className="text-right pb-2 w-32">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, index) => (
              <tr key={index}>
                <td className="py-2">
                  <span className="font-mono text-xs text-slate-500 mr-2">
                    {line.accountCode}
                  </span>
                  <span className="text-sm text-slate-700">{line.accountName}</span>
                </td>
                <td className="py-2 text-right">
                  <span className="font-mono text-sm tabular-nums text-slate-900">
                    {formatAmount(line.debit)}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <span className="font-mono text-sm tabular-nums text-slate-900">
                    {formatAmount(line.credit)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td className="pt-3 font-semibold text-slate-900">Total</td>
              <td className="pt-3 text-right">
                <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                  {formatAmount(totalDebits)}
                </span>
              </td>
              <td className="pt-3 text-right">
                <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                  {formatAmount(totalCredits)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Balance indicator */}
        <div
          className={cn(
            'mt-4 p-3 rounded-lg flex items-center gap-2',
            isBalanced ? 'bg-emerald-50' : 'bg-red-50'
          )}
        >
          <span
            className={cn(
              'text-lg',
              isBalanced ? 'text-emerald-600' : 'text-red-500'
            )}
            aria-hidden="true"
          >
            {isBalanced ? '✓' : '✕'}
          </span>
          <span
            className={cn(
              'text-sm font-medium',
              isBalanced ? 'text-emerald-700' : 'text-red-700'
            )}
          >
            {isBalanced ? 'Balanced' : `Difference: ${formatAmount(Math.abs(difference))}`}
          </span>
        </div>

        {/* Audit info */}
        {(createdBy || createdAt) && (
          <div className="mt-4 text-xs text-slate-500">
            {createdBy && <span>By {createdBy.name}</span>}
            {createdBy && createdAt && <span> · </span>}
            {createdAt && <span>{createdAt}</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      {(onCancel || onSaveDraft || onPost) && (
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg',
                'text-slate-600 hover:bg-slate-200/50',
                'transition-colors duration-75',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Cancel
            </button>
          )}
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              disabled={loading}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg',
                'border border-slate-300 text-slate-700',
                'hover:bg-slate-100',
                'transition-colors duration-75',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Save Draft
            </button>
          )}
          {onPost && (
            <button
              onClick={onPost}
              disabled={loading || !isBalanced || period?.status === 'locked'}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-lg',
                'bg-orange-500 text-white',
                'hover:bg-orange-600',
                'transition-colors duration-75',
                'disabled:bg-slate-300 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Posting...
                </span>
              ) : (
                'Post to GL'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
