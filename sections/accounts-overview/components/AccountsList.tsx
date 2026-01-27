import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Account, Entity, FxRate } from '../types'
import { AccountRow } from './AccountRow'

interface AccountsListProps {
  accounts: Account[]
  entities: Entity[]
  selectedEntityId?: string
  selectedCurrency?: string
  baseCurrency: string
  fxRates: FxRate[]
  onAccountClick?: (accountId: string) => void
}

type AccountType = 'bank' | 'credit_card' | 'loan' | 'asset'

const accountTypeLabels: Record<AccountType, string> = {
  bank: 'Bank Accounts',
  credit_card: 'Credit Cards',
  loan: 'Loans & Mortgages',
  asset: 'Assets',
}

export function AccountsList({
  accounts,
  entities,
  selectedEntityId,
  selectedCurrency,
  baseCurrency,
  fxRates,
  onAccountClick,
}: AccountsListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<AccountType>>(
    new Set(['bank', 'credit_card', 'loan', 'asset'])
  )

  const toggleGroup = (type: AccountType) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedGroups(newExpanded)
  }

  // Filter accounts by selected entity
  const filteredAccounts = selectedEntityId
    ? accounts.filter(acc => acc.entityId === selectedEntityId)
    : accounts

  // Group accounts by type
  const groupedAccounts: Record<AccountType, Account[]> = {
    bank: filteredAccounts.filter(a => a.type === 'bank'),
    credit_card: filteredAccounts.filter(a => a.type === 'credit_card'),
    loan: filteredAccounts.filter(a => a.type === 'loan'),
    asset: filteredAccounts.filter(a => a.type === 'asset'),
  }

  // Calculate totals for each group
  const groupTotals: Record<AccountType, number> = {
    bank: groupedAccounts.bank.reduce((sum, acc) => sum + acc.balance, 0),
    credit_card: groupedAccounts.credit_card.reduce((sum, acc) => sum + acc.balance, 0),
    loan: groupedAccounts.loan.reduce((sum, acc) => sum + acc.balance, 0),
    asset: groupedAccounts.asset.reduce((sum, acc) => sum + acc.balance, 0),
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 font-[family-name:var(--font-heading)]">
        Accounts
      </h2>

      {(Object.keys(groupedAccounts) as AccountType[]).map((type) => {
        const typeAccounts = groupedAccounts[type]
        if (typeAccounts.length === 0) return null

        const isExpanded = expandedGroups.has(type)
        const total = groupTotals[type]
        const formattedTotal = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: baseCurrency,
          minimumFractionDigits: 0,
        }).format(Math.abs(total))

        return (
          <div
            key={type}
            className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(type)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-[family-name:var(--font-body)]">
                    {accountTypeLabels[type]}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-body)]">
                    {typeAccounts.length} {typeAccounts.length === 1 ? 'account' : 'accounts'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold font-[family-name:var(--font-mono)] ${
                  total < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {total < 0 ? '-' : ''}{formattedTotal}
                </p>
              </div>
            </button>

            {/* Group Content */}
            {isExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-800">
                {typeAccounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    entity={entities.find(e => e.id === account.entityId)}
                    selectedCurrency={selectedCurrency}
                    baseCurrency={baseCurrency}
                    fxRates={fxRates}
                    onClick={() => onAccountClick?.(account.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
