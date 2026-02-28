/**
 * NLSearchBar Integration Example
 *
 * This file demonstrates how to integrate NLSearchBar into transaction lists,
 * invoice lists, or any other filterable list component.
 *
 * NOT FOR PRODUCTION - This is a reference implementation showing usage patterns.
 */

'use client';

import { useState } from 'react';
import { NLSearchBar, type SearchFilters } from './NLSearchBar';
import type { ListTransactionsParams } from '@/lib/api/transactions.types';

/**
 * Example 1: Simple Integration in Transaction List
 *
 * Basic usage with minimal setup - filters passed directly to parent state.
 */
export function TransactionListExample({ entityId }: { entityId: string }) {
  const [filters, setFilters] = useState<SearchFilters>({});

  // Convert SearchFilters to API params
  const apiParams: ListTransactionsParams = {
    entityId,
    ...(filters.description && { search: filters.description }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.accountId && { accountId: filters.accountId }),
    ...(filters.dateFrom && { startDate: filters.dateFrom }),
    ...(filters.dateTo && { endDate: filters.dateTo }),
    // Note: amountMin/amountMax need backend support
  };

  return (
    <div className="space-y-4">
      <NLSearchBar
        entityId={entityId}
        onFiltersChange={setFilters}
        scope="transactions"
      />

      {/* Your transaction table component */}
      {/* <TransactionTable filters={apiParams} /> */}
    </div>
  );
}

/**
 * Example 2: Integration with Existing Filters
 *
 * Combine NL search with traditional filter UI (account selector, date range).
 */
export function TransactionListWithFiltersExample({ entityId }: { entityId: string }) {
  const [nlFilters, setNlFilters] = useState<SearchFilters>({});
  const [accountFilter, setAccountFilter] = useState<string>();
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  // Merge all filter sources
  const combinedFilters: ListTransactionsParams = {
    entityId,
    // NL Search filters take precedence
    ...(nlFilters.description && { search: nlFilters.description }),
    ...(nlFilters.categoryId && { categoryId: nlFilters.categoryId }),
    // Traditional filters as fallback
    ...(accountFilter && !nlFilters.accountId && { accountId: accountFilter }),
    ...(dateRange.start && !nlFilters.dateFrom && { startDate: dateRange.start }),
    ...(dateRange.end && !nlFilters.dateTo && { endDate: dateRange.end }),
  };

  return (
    <div className="space-y-4">
      {/* Natural Language Search */}
      <NLSearchBar
        entityId={entityId}
        onFiltersChange={setNlFilters}
        scope="transactions"
      />

      {/* Traditional Filters (hidden when NL search active) */}
      {Object.keys(nlFilters).length === 0 && (
        <div className="flex gap-2">
          {/* Account Selector */}
          {/* <AccountSelect value={accountFilter} onChange={setAccountFilter} /> */}

          {/* Date Range Picker */}
          {/* <DateRangePicker value={dateRange} onChange={setDateRange} /> */}
        </div>
      )}

      {/* Transaction Table */}
      {/* <TransactionTable filters={combinedFilters} /> */}
    </div>
  );
}

/**
 * Example 3: Inline in Page Header
 *
 * NL Search as primary UI in page header, full-width layout.
 */
export function TransactionPageExample({ entityId }: { entityId: string }) {
  const [filters, setFilters] = useState<SearchFilters>({});

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Page Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Search using natural language or keywords
          </p>
        </div>
      </div>

      {/* Full-width NL Search */}
      <NLSearchBar
        entityId={entityId}
        onFiltersChange={setFilters}
        scope="transactions"
        placeholder="Try: 'Show me all restaurant expenses over $100 in Q4'"
      />

      {/* Content */}
      <div className="space-y-4">
        {/* Transaction List */}
      </div>
    </div>
  );
}

/**
 * Example 4: Standalone Card (Dashboard Widget)
 *
 * NL Search as a dashboard widget with glass styling.
 */
export function NLSearchWidgetExample({ entityId }: { entityId: string }) {
  const [filters, setFilters] = useState<SearchFilters>({});

  function handleFiltersChange(newFilters: SearchFilters) {
    setFilters(newFilters);
    // Navigate to transactions page with filters
    // router.push(`/banking/transactions?filters=${JSON.stringify(newFilters)}`);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Quick Search
      </h3>
      <NLSearchBar
        entityId={entityId}
        onFiltersChange={handleFiltersChange}
        scope="transactions"
        placeholder="Ask me anything about your finances..."
      />
    </div>
  );
}

/**
 * Example 5: Multi-Domain Search
 *
 * Search across transactions, invoices, and bills.
 */
export function UnifiedSearchExample({ entityId }: { entityId: string }) {
  const [scope, setScope] = useState<'transactions' | 'invoices' | 'bills' | 'all'>('all');
  const [filters, setFilters] = useState<SearchFilters>({});

  return (
    <div className="space-y-4">
      {/* Scope Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setScope('all')}
          className={`px-3 py-1 rounded-lg text-xs ${
            scope === 'all' ? 'bg-primary text-black' : 'glass-2 text-muted-foreground'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setScope('transactions')}
          className={`px-3 py-1 rounded-lg text-xs ${
            scope === 'transactions' ? 'bg-primary text-black' : 'glass-2 text-muted-foreground'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setScope('invoices')}
          className={`px-3 py-1 rounded-lg text-xs ${
            scope === 'invoices' ? 'bg-primary text-black' : 'glass-2 text-muted-foreground'
          }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setScope('bills')}
          className={`px-3 py-1 rounded-lg text-xs ${
            scope === 'bills' ? 'bg-primary text-black' : 'glass-2 text-muted-foreground'
          }`}
        >
          Bills
        </button>
      </div>

      {/* NL Search */}
      <NLSearchBar
        entityId={entityId}
        onFiltersChange={setFilters}
        scope={scope}
        placeholder={`Search ${scope === 'all' ? 'everywhere' : scope}...`}
      />

      {/* Results */}
      {/* Render results based on scope and filters */}
    </div>
  );
}

/**
 * Example 6: Error Handling & Loading States
 *
 * Demonstrates proper error handling and loading indicators.
 */
export function RobustSearchExample({ entityId }: { entityId: string }) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiltersChange(newFilters: SearchFilters) {
    setFilters(newFilters);
    setError(null);
    setIsLoading(true);

    try {
      // Fetch results with new filters
      // const results = await fetchTransactions(entityId, newFilters);
      // setResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <NLSearchBar
        entityId={entityId}
        onFiltersChange={handleFiltersChange}
        scope="transactions"
      />

      {/* Error Display */}
      {error && (
        <div className="glass-2 rounded-lg border-destructive p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="glass-2 rounded-lg p-8 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <div>{/* Transaction results */}</div>
      )}
    </div>
  );
}
