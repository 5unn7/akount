import { FileText, MoreVertical, Send, Check, Clock, AlertCircle } from 'lucide-react'
import type { Invoice } from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from '../../shell/components/useSpotlight'

interface InvoiceRowProps {
  invoice: Invoice
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSend?: () => void
  onMarkPaid?: () => void
  onCreateCreditNote?: () => void
}

export function InvoiceRow({
  invoice,
  onView,
  onEdit,
  onDelete,
  onSend,
  onMarkPaid,
  onCreateCreditNote,
}: InvoiceRowProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()

  const statusConfig = {
    draft: {
      icon: FileText,
      label: 'Draft',
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
    },
    sent: {
      icon: Send,
      label: 'Sent',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    paid: {
      icon: Check,
      label: 'Paid',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    overdue: {
      icon: AlertCircle,
      label: 'Overdue',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
  }

  const config = statusConfig[invoice.status]
  const StatusIcon = config.icon

  const formattedIssueDate = new Date(invoice.issueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: invoice.currency,
    minimumFractionDigits: 2,
  }).format(invoice.total)

  const formattedAmountDue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: invoice.currency,
    minimumFractionDigits: 2,
  }).format(invoice.amountDue)

  return (
    <div
      // ref={elementRef}
      // style={spotlightStyle}
      className="relative px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30"
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Invoice Number & Client */}
        <div className="col-span-12 md:col-span-3">
          <button
            onClick={onView}
            className="text-left group w-full"
          >
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors font-[family-name:var(--font-mono)]">
              {invoice.invoiceNumber}
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 font-[family-name:var(--font-body)]">
              {invoice.clientName}
            </p>
          </button>
        </div>

        {/* Issue Date */}
        <div className="col-span-6 md:col-span-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium font-[family-name:var(--font-body)]">
            Issued
          </p>
          <p className="text-sm text-slate-900 dark:text-white font-medium mt-0.5 font-[family-name:var(--font-body)]">
            {formattedIssueDate}
          </p>
        </div>

        {/* Due Date */}
        <div className="col-span-6 md:col-span-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium font-[family-name:var(--font-body)]">
            Due
          </p>
          <p className={`text-sm font-medium mt-0.5 font-[family-name:var(--font-body)] ${
            invoice.status === 'overdue'
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-white'
          }`}>
            {formattedDueDate}
          </p>
        </div>

        {/* Amount */}
        <div className="col-span-6 md:col-span-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium font-[family-name:var(--font-body)]">
            Total
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-[family-name:var(--font-mono)]">
            {formattedTotal}
          </p>
        </div>

        {/* Amount Due */}
        <div className="col-span-6 md:col-span-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium font-[family-name:var(--font-body)]">
            Amount Due
          </p>
          <p className={`text-sm font-bold mt-0.5 font-[family-name:var(--font-mono)] ${
            invoice.amountDue > 0
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {formattedAmountDue}
          </p>
        </div>

        {/* Status & Actions */}
        <div className="col-span-12 md:col-span-1 flex items-center justify-between md:justify-end gap-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
            <span className={`text-xs font-semibold ${config.color} font-[family-name:var(--font-body)]`}>
              {config.label}
            </span>
          </div>

          <div className="relative group/menu">
            <button
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu - Hidden by default, shown on hover/click in real implementation */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
              <div className="py-1">
                <button
                  onClick={onView}
                  className="w-full px-4 py-2 text-left text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-[family-name:var(--font-body)]"
                >
                  View Details
                </button>
                <button
                  onClick={onEdit}
                  className="w-full px-4 py-2 text-left text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-[family-name:var(--font-body)]"
                >
                  Edit
                </button>
                {invoice.status === 'draft' && (
                  <button
                    onClick={onSend}
                    className="w-full px-4 py-2 text-left text-sm text-violet-600 dark:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-[family-name:var(--font-body)]"
                  >
                    Send to Client
                  </button>
                )}
                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                  <button
                    onClick={onMarkPaid}
                    className="w-full px-4 py-2 text-left text-sm text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-[family-name:var(--font-body)]"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={onCreateCreditNote}
                  className="w-full px-4 py-2 text-left text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-[family-name:var(--font-body)]"
                >
                  Create Credit Note
                </button>
                <hr className="my-1 border-slate-200 dark:border-slate-700" />
                <button
                  onClick={onDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-[family-name:var(--font-body)]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
