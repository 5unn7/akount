'use client';

import { Search } from 'lucide-react';

type TabFilter = 'all' | 'unreconciled' | 'income' | 'expense';

const TABS: { value: TabFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unreconciled', label: 'Unreconciled' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
];

interface TransactionsToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeTab: TabFilter;
    onTabChange: (tab: TabFilter) => void;
}

export function TransactionsToolbar({
    searchQuery,
    onSearchChange,
    activeTab,
    onTabChange,
}: TransactionsToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-ak-border">
            {/* Search */}
            <div className="relative flex-shrink-0 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-8 w-full sm:w-56 pl-9 pr-3 text-xs rounded-lg glass border border-ak-border bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
            </div>

            <div className="flex-1" />

            {/* Tab filters */}
            <div className="flex items-center gap-1 p-0.5 glass rounded-lg">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTab === tab.value
                                ? 'bg-ak-bg-4 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export type { TabFilter };
