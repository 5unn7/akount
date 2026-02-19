'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronsUpDown, Check, Search } from 'lucide-react';
import type { GLAccount } from '@/lib/api/accounting';

interface GLAccountComboboxProps {
    accounts: GLAccount[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const ACCOUNT_TYPE_ORDER = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const;

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses',
};

export function GLAccountCombobox({
    accounts,
    value,
    onValueChange,
    placeholder = 'Select account',
    className,
}: GLAccountComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = accounts.find((a) => a.id === value);

    // Filter accounts by search
    const filtered = useMemo(() => {
        if (!search) return accounts;
        const q = search.toLowerCase();
        return accounts.filter(
            (a) =>
                a.code.toLowerCase().includes(q) ||
                a.name.toLowerCase().includes(q)
        );
    }, [accounts, search]);

    // Group by type
    const grouped = useMemo(() => {
        const groups: Record<string, GLAccount[]> = {};
        for (const account of filtered) {
            const type = account.type || 'OTHER';
            if (!groups[type]) groups[type] = [];
            groups[type].push(account);
        }
        return groups;
    }, [filtered]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    // Keyboard: close on Escape
    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') {
            setOpen(false);
            setSearch('');
        }
    }

    return (
        <div ref={containerRef} className={`relative ${className || ''}`} onKeyDown={handleKeyDown}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full rounded-lg border border-ak-border-2 glass px-3 h-9 text-xs hover:border-ak-border-3 transition-colors"
            >
                {selected ? (
                    <span className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-muted-foreground">{selected.code}</span>
                        <span>{selected.name}</span>
                    </span>
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            </button>

            {open && (
                <div className="absolute z-50 top-full left-0 w-72 mt-1 rounded-lg border border-ak-border-2 glass-2 shadow-lg overflow-hidden">
                    {/* Search input */}
                    <div className="flex items-center border-b border-ak-border px-3 py-2">
                        <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by code or name..."
                            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Account list */}
                    <div className="max-h-60 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                No accounts found
                            </div>
                        ) : (
                            ACCOUNT_TYPE_ORDER.map((type) => {
                                const typeAccounts = grouped[type];
                                if (!typeAccounts || typeAccounts.length === 0) return null;
                                return (
                                    <div key={type}>
                                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                            {ACCOUNT_TYPE_LABELS[type] || type}
                                        </div>
                                        {typeAccounts.map((account) => (
                                            <button
                                                key={account.id}
                                                type="button"
                                                onClick={() => {
                                                    onValueChange(account.id);
                                                    setOpen(false);
                                                    setSearch('');
                                                }}
                                                className="flex items-center w-full px-3 py-1.5 text-xs hover:bg-ak-bg-3 transition-colors"
                                            >
                                                <span className="w-4 mr-1.5 shrink-0">
                                                    {account.id === value && (
                                                        <Check className="h-3.5 w-3.5 text-primary" />
                                                    )}
                                                </span>
                                                <span className="font-mono text-muted-foreground mr-2 shrink-0">
                                                    {account.code}
                                                </span>
                                                <span className="truncate">{account.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
