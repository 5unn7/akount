'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { cn } from '../utils';

export type AccountClass = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface GLAccount {
  id: string;
  code: string;
  name: string;
  class: AccountClass;
  balance?: number;
  parentId?: string;
}

export interface GLAccountSelectorProps {
  /** Currently selected account ID */
  value: string | null;
  /** Change handler */
  onChange: (accountId: string | null) => void;
  /** Available accounts */
  accounts: GLAccount[];
  /** Show account balance */
  showBalance?: boolean;
  /** Show recent accounts */
  showRecent?: boolean;
  /** Allow "Uncategorized" option */
  allowUncategorized?: boolean;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Additional classes */
  className?: string;
}

const classColors: Record<AccountClass, string> = {
  asset: 'text-blue-600',
  liability: 'text-amber-600',
  equity: 'text-teal-600',
  revenue: 'text-emerald-600',
  expense: 'text-red-600',
};

const classLabels: Record<AccountClass, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};

/**
 * GL Account selector dropdown with search and grouping.
 *
 * @example
 * ```tsx
 * <GLAccountSelector
 *   label="Category"
 *   value={selectedAccountId}
 *   onChange={setSelectedAccountId}
 *   accounts={chartOfAccounts}
 *   showBalance
 *   allowUncategorized
 * />
 * ```
 */
export function GLAccountSelector({
  value,
  onChange,
  accounts,
  showBalance = false,
  showRecent = false,
  allowUncategorized = true,
  label,
  placeholder = 'Select account...',
  error,
  helperText,
  disabled = false,
  required = false,
  className,
}: GLAccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const id = useId();
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const hasError = Boolean(error);

  // Get selected account
  const selectedAccount = value
    ? accounts.find((a) => a.id === value)
    : null;

  // Group accounts by class
  const groupedAccounts = accounts.reduce(
    (acc, account) => {
      if (!acc[account.class]) acc[account.class] = [];
      acc[account.class].push(account);
      return acc;
    },
    {} as Record<AccountClass, GLAccount[]>
  );

  // Filter accounts by search
  const filteredAccounts = search
    ? accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase())
      )
    : accounts;

  // Build flat list for keyboard navigation
  const flatList = search
    ? filteredAccounts
    : Object.entries(groupedAccounts).flatMap(([, accts]) => accts);

  const handleSelect = useCallback(
    (accountId: string | null) => {
      onChange(accountId);
      setIsOpen(false);
      setSearch('');
      setFocusedIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          e.preventDefault();
          handleSelect(flatList[focusedIndex].id);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) =>
            prev < flatList.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : flatList.length - 1
          );
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearch('');
        }
        break;
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const formatBalance = (cents: number) => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dollars);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col gap-1.5', className)}
    >
      {label && (
        <label
          id={labelId}
          className={cn(
            'text-sm font-medium text-slate-700',
            disabled && 'text-slate-400'
          )}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? errorId : helperText ? helperId : undefined
        }
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-10 px-3 w-full rounded-[10px] border bg-white font-sans text-left',
          'flex items-center justify-between gap-2',
          'transition-colors duration-[120ms]',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
            : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500/30',
          disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
          isOpen && 'border-orange-500 ring-2 ring-orange-500/30'
        )}
        data-testid="gl-account-selector"
      >
        <span className={cn('truncate', !selectedAccount && 'text-slate-400')}>
          {selectedAccount ? (
            <span className="flex items-center gap-2">
              <span className={cn('font-mono text-xs', classColors[selectedAccount.class])}>
                {selectedAccount.code}
              </span>
              <span>{selectedAccount.name}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <span
          className={cn(
            'shrink-0 transition-transform duration-[120ms]',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-500">
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 top-full mt-1 w-full',
            'bg-white/95 backdrop-blur-xl',
            'border border-slate-200 rounded-[14px]',
            'shadow-lg',
            'overflow-hidden'
          )}
        >
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(-1);
              }}
              placeholder="Search accounts..."
              className={cn(
                'w-full h-8 px-3 text-sm rounded-md',
                'border border-slate-200 bg-white',
                'focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30'
              )}
              aria-label="Search accounts"
            />
          </div>

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-[300px] overflow-y-auto py-1"
          >
            {/* Uncategorized option */}
            {allowUncategorized && !search && (
              <li
                role="option"
                aria-selected={value === null}
                onClick={() => handleSelect(null)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer',
                  'flex items-center gap-2',
                  'transition-colors duration-75',
                  'hover:bg-orange-50',
                  value === null && 'bg-orange-100 font-medium'
                )}
              >
                <span className="text-slate-400">—</span>
                <span className="text-slate-500 italic">Uncategorized</span>
              </li>
            )}

            {/* Search results */}
            {search ? (
              filteredAccounts.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500 text-center">
                  No accounts found
                </li>
              ) : (
                filteredAccounts.map((account, index) => (
                  <li
                    key={account.id}
                    role="option"
                    aria-selected={account.id === value}
                    onClick={() => handleSelect(account.id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={cn(
                      'px-3 py-2 text-sm cursor-pointer',
                      'flex items-center justify-between gap-2',
                      'transition-colors duration-75',
                      focusedIndex === index && 'bg-orange-50',
                      account.id === value && 'bg-orange-100 font-medium'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn('font-mono text-xs', classColors[account.class])}>
                        {account.code}
                      </span>
                      <span>{account.name}</span>
                    </span>
                    {showBalance && account.balance !== undefined && (
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatBalance(account.balance)}
                      </span>
                    )}
                  </li>
                ))
              )
            ) : (
              /* Grouped accounts */
              (['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountClass[]).map(
                (accountClass) => {
                  const classAccounts = groupedAccounts[accountClass];
                  if (!classAccounts || classAccounts.length === 0) return null;

                  return (
                    <li key={accountClass}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                        {classLabels[accountClass]}
                      </div>
                      <ul>
                        {classAccounts.map((account) => {
                          const flatIndex = flatList.findIndex((a) => a.id === account.id);
                          return (
                            <li
                              key={account.id}
                              role="option"
                              aria-selected={account.id === value}
                              onClick={() => handleSelect(account.id)}
                              onMouseEnter={() => setFocusedIndex(flatIndex)}
                              className={cn(
                                'px-3 py-2 text-sm cursor-pointer',
                                'flex items-center justify-between gap-2',
                                'transition-colors duration-75',
                                focusedIndex === flatIndex && 'bg-orange-50',
                                account.id === value && 'bg-orange-100 font-medium'
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <span className={cn('font-mono text-xs', classColors[account.class])}>
                                  {account.code}
                                </span>
                                <span>{account.name}</span>
                              </span>
                              {showBalance && account.balance !== undefined && (
                                <span className="font-mono text-xs text-slate-500 tabular-nums">
                                  {formatBalance(account.balance)}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                }
              )
            )}
          </ul>
        </div>
      )}

      {hasError && (
        <p id={errorId} className="text-sm text-red-500 flex items-center gap-1">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}

      {!hasError && helperText && (
        <p id={helperId} className="text-sm text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
