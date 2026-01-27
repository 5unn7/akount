import { Plus, Search, Filter, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useState } from 'react'
import type { InvoiceListProps } from '../types'
import { InvoiceRow } from './InvoiceRow'

export function InvoiceList({
  invoices,
  clients,
  onView,
  onEdit,
  onDelete,
  onSend,
  onMarkPaid,
  onCreate,
  onCreateCreditNote,
}: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Calculate summary metrics
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amountDue, 0)

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amountDue, 0)

  const paidThisMonth = invoices
    .filter(inv => {
      if (inv.status !== 'paid' || !inv.paidDate) return false
      const paidDate = new Date(inv.paidDate)
      const now = new Date()
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, inv) => sum + inv.total, 0)

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
                Invoices
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-[family-name:var(--font-body)]">
                Manage accounts receivable and track payments
              </p>
            </div>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-sm rounded-lg font-semibold transition-colors shadow-sm font-[family-name:var(--font-body)]"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                    Outstanding
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-[family-name:var(--font-mono)]">
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-[family-name:var(--font-body)]">
                {filteredInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').length} unpaid invoices
              </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                    Overdue
                  </p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 font-[family-name:var(--font-mono)]">
                    {formatCurrency(overdueAmount)}
                  </p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-[family-name:var(--font-body)]">
                {filteredInvoices.filter(i => i.status === 'overdue').length} past due
              </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                    Paid This Month
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-[family-name:var(--font-mono)]">
                    {formatCurrency(paidThisMonth)}
                  </p>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-[family-name:var(--font-body)]">
                {filteredInvoices.filter(i => i.status === 'paid' && i.paidDate).length} payments received
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by invoice number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent font-[family-name:var(--font-body)]"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent appearance-none cursor-pointer font-[family-name:var(--font-body)]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-[family-name:var(--font-body)]">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <div className="col-span-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Invoice & Client
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Issued
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Due
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Total
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Amount Due
              </span>
            </div>
            <div className="col-span-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Status
              </span>
            </div>
          </div>

          {/* Invoice Rows */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onView={() => onView?.(invoice.id)}
                  onEdit={() => onEdit?.(invoice.id)}
                  onDelete={() => onDelete?.(invoice.id)}
                  onSend={() => onSend?.(invoice.id)}
                  onMarkPaid={() => onMarkPaid?.(invoice.id)}
                  onCreateCreditNote={() => onCreateCreditNote?.(invoice.id)}
                />
              ))
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-900 dark:text-white font-semibold mb-1 font-[family-name:var(--font-body)]">
                  No invoices found
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-[family-name:var(--font-body)]">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first invoice to get started'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        {filteredInvoices.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </p>
          </div>
        )}
    </div>
  )
}
