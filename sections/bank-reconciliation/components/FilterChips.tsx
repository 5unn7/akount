interface FilterChipsProps {
  statusCounts: {
    all: number
    matched: number
    suggested: number
    unmatched: number
  }
  activeFilter: 'all' | 'matched' | 'suggested' | 'unmatched'
  onFilterChange?: (status: 'all' | 'matched' | 'suggested' | 'unmatched') => void
}

export function FilterChips({ statusCounts, activeFilter, onFilterChange }: FilterChipsProps) {
  const filters = [
    { key: 'all' as const, label: 'All', count: statusCounts.all },
    { key: 'suggested' as const, label: 'Suggested', count: statusCounts.suggested },
    { key: 'unmatched' as const, label: 'Unmatched', count: statusCounts.unmatched },
    { key: 'matched' as const, label: 'Matched', count: statusCounts.matched },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key
        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange?.(filter.key)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all font-[family-name:var(--font-body)]
              ${isActive
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }
            `}
          >
            {filter.label}
            <span className={`ml-2 ${isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
              {filter.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
