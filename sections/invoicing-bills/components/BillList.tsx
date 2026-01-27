import { Plus, Search, Filter, Download, TrendingDown, AlertCircle, DollarSign } from 'lucide-react'
import { useState } from 'react'
import type { BillListProps } from '../types'
import { BillRow } from './BillRow'

export function BillList({
  bills,
  vendors,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
  onCreate,
  onCreateCreditNote,
}: BillListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Calculate summary metrics
  const totalOwed = bills
    .filter(bill => bill.status === 'sent' || bill.status === 'overdue')
    .reduce((sum, bill) => sum + bill.amountDue, 0)

  const overdueAmount = bills
    .filter(bill => bill.status === 'overdue')
    .reduce((sum, bill) => sum + bill.amountDue, 0)

  const paidThisMonth = bills
    .filter(bill => {
      if (bill.status !== 'paid' || !bill.paidDate) return false
      const paidDate = new Date(bill.paidDate)
      const now = new Date()
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, bill) => sum + bill.total, 0)

  // Filter bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendorName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter

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
                Bills
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-[family-name:var(--font-body)]">
                Manage accounts payable and track vendor payments
              </p>
            </div>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white text-sm rounded-lg font-semibold transition-colors shadow-sm font-[family-name:var(--font-body)]"
            >
              <Plus className="w-4 h-4" />
              New Bill
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                    Total Owed
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-[family-name:var(--font-mono)]">
                    {formatCurrency(totalOwed)}
                  </p>
                </div>
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-[family-name:var(--font-body)]">
                {filteredBills.filter(b => b.status === 'sent' || b.status === 'overdue').length} unpaid bills
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
                {filteredBills.filter(b => b.status === 'overdue').length} past due
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
                {filteredBills.filter(b => b.status === 'paid' && b.paidDate).length} payments made
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by bill number or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent font-[family-name:var(--font-body)]"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent appearance-none cursor-pointer font-[family-name:var(--font-body)]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Received</option>
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

        {/* Bill List */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <div className="col-span-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Bill & Vendor
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-[family-name:var(--font-body)]">
                Received
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

          {/* Bill Rows */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredBills.length > 0 ? (
              filteredBills.map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  onView={() => onView?.(bill.id)}
                  onEdit={() => onEdit?.(bill.id)}
                  onDelete={() => onDelete?.(bill.id)}
                  onMarkPaid={() => onMarkPaid?.(bill.id)}
                  onCreateCreditNote={() => onCreateCreditNote?.(bill.id)}
                />
              ))
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-900 dark:text-white font-semibold mb-1 font-[family-name:var(--font-body)]">
                  No bills found
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-[family-name:var(--font-body)]">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first bill to get started'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        {filteredBills.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
              Showing {filteredBills.length} of {bills.length} bills
            </p>
          </div>
        )}
    </div>
  )
}
