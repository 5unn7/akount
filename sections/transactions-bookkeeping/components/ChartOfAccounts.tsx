import { Plus, TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react'
import type { GLAccount, Entity } from '../types'
import { GLAccountRow } from './GLAccountRow'

interface ChartOfAccountsProps {
  glAccounts: GLAccount[]
  entities: Entity[]
  selectedEntityId: string | null
  onEntityChange: (entityId: string) => void
  onCreateAccount?: (account: Partial<GLAccount>) => void
}

export function ChartOfAccounts({
  glAccounts,
  entities,
  selectedEntityId,
  onEntityChange,
  onCreateAccount,
}: ChartOfAccountsProps) {
  const filteredAccounts = selectedEntityId
    ? glAccounts.filter(gl => gl.entityId === selectedEntityId)
    : glAccounts

  const accountsByType = {
    asset: filteredAccounts.filter(gl => gl.type === 'asset'),
    liability: filteredAccounts.filter(gl => gl.type === 'liability'),
    equity: filteredAccounts.filter(gl => gl.type === 'equity'),
    income: filteredAccounts.filter(gl => gl.type === 'income'),
    expense: filteredAccounts.filter(gl => gl.type === 'expense'),
  }

  const typeConfig = {
    asset: {
      label: 'Assets',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    liability: {
      label: 'Liabilities',
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    equity: {
      label: 'Equity',
      icon: DollarSign,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    income: {
      label: 'Income',
      icon: Plus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    expense: {
      label: 'Expenses',
      icon: Minus,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Chart of Accounts
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-[family-name:var(--font-body)]">
            General ledger account structure for financial reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Entity Filter */}
          <select
            value={selectedEntityId || ''}
            onChange={(e) => onEntityChange(e.target.value || '')}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-slate-900 dark:text-white font-[family-name:var(--font-body)]"
          >
            <option value="">All Entities</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => onCreateAccount?.({})}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-lg transition-colors font-medium font-[family-name:var(--font-body)]"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Account Groups */}
      <div className="space-y-6">
        {(Object.keys(accountsByType) as Array<keyof typeof accountsByType>).map((type) => {
          const accounts = accountsByType[type]
          const config = typeConfig[type]
          const TypeIcon = config.icon

          if (accounts.length === 0) return null

          return (
            <div key={type} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Type Header */}
              <div className={`px-6 py-3 border-b border-slate-200 dark:border-slate-800 ${config.bg}`}>
                <div className="flex items-center gap-2">
                  <TypeIcon className={`w-5 h-5 ${config.color}`} />
                  <h3 className={`font-semibold ${config.color} font-[family-name:var(--font-body)]`}>
                    {config.label}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-body)]">
                    ({accounts.length} account{accounts.length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {/* Accounts Table */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((account) => (
                  <GLAccountRow key={account.id} account={account} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6 py-12 text-center">
          <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium font-[family-name:var(--font-body)] mb-1">
            No accounts in chart
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 font-[family-name:var(--font-body)]">
            Create your first GL account to start building your chart of accounts
          </p>
        </div>
      )}
    </div>
  )
}
