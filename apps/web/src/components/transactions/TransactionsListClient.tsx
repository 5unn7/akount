'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Transaction } from '@/lib/api/transactions';
import type { Account } from '@/lib/api/accounts';
import { TransactionsTable } from './TransactionsTable';
import { TransactionsFilters } from './TransactionsFilters';

interface TransactionsListClientProps {
    transactions: Transaction[];
    hasMore: boolean;
    accounts: Account[];
}

export function TransactionsListClient({
    transactions,
    hasMore,
    accounts,
}: TransactionsListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Current filters from URL
    const accountId = searchParams.get('accountId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    function handleFilterChange(filters: {
        accountId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const params = new URLSearchParams();

        if (filters.accountId) {
            params.set('accountId', filters.accountId);
        }

        if (filters.startDate) {
            params.set('startDate', filters.startDate);
        }

        if (filters.endDate) {
            params.set('endDate', filters.endDate);
        }

        // Navigate with new filters
        const query = params.toString();
        router.push(`/money-movement/transactions${query ? `?${query}` : ''}`);
    }

    function handleClearFilters() {
        router.push('/money-movement/transactions');
    }

    return (
        <div className="space-y-4">
            <TransactionsFilters
                accounts={accounts}
                selectedAccountId={accountId}
                startDate={startDate}
                endDate={endDate}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            <TransactionsTable transactions={transactions} />

            {hasMore && (
                <p className="text-center text-sm text-muted-foreground">
                    Showing first {transactions.length} transactions. More available.
                </p>
            )}
        </div>
    );
}
