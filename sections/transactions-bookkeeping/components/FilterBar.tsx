import { Search, X } from 'lucide-react'
import type { Entity, Account, Category } from '../types'

interface FilterBarProps {
  entities: Entity[]
  accounts: Account[]
  categories: Category[]
  filters: {
    entityId: string | null
    accountId: string | null
    categoryId: string | null
    searchQuery: string
  }
  onFilterChange: (filters: any) => void
  onSearch: (query: string) => void
}

export function FilterBar({
  entities,
  accounts,
  categories,
  filters,
  onFilterChange,
  onSearch,
}: FilterBarProps) {
  const activeFilterCount = [
    filters.entityId,
    filters.accountId,
    filters.categoryId,
  ].filter(Boolean).length

  const clearAllFilters = () => {
    onFilterChange({
      entityId: null,
      accountId: null,
      categoryId: null,
      searchQuery: '',
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.searchQuery}
            onChange={(e) => {
              onFilterChange({ searchQuery: e.target.value })
              onSearch(e.target.value)
            }}
            className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-[family-name:var(--font-body)]"
          />
        </div>

        {/* Entity Filter */}
        <select
          value={filters.entityId || ''}
          onChange={(e) => onFilterChange({ entityId: e.target.value || null })}
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-slate-900 dark:text-white font-[family-name:var(--font-body)]"
        >
          <option value="">All Entities</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>

        {/* Account Filter */}
        <select
          value={filters.accountId || ''}
          onChange={(e) => onFilterChange({ accountId: e.target.value || null })}
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-slate-900 dark:text-white font-[family-name:var(--font-body)]"
        >
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={filters.categoryId || ''}
          onChange={(e) => onFilterChange({ categoryId: e.target.value || null })}
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-slate-900 dark:text-white font-[family-name:var(--font-body)]"
        >
          <option value="">All Categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories
            .filter((cat) => !cat.parentId)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>

        {/* Active Filter Count & Clear */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-[family-name:var(--font-body)]"
          >
            <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
