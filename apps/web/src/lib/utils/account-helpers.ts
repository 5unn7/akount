import {
    Landmark,
    CreditCard,
    TrendingUp,
    Home,
    DollarSign,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import type { Account, AccountType } from '@/lib/api/accounts';

export const accountTypeIcons: Record<AccountType, LucideIcon> = {
    BANK: Landmark,
    CREDIT_CARD: CreditCard,
    INVESTMENT: TrendingUp,
    LOAN: DollarSign,
    MORTGAGE: Home,
    OTHER: Wallet,
};

export const accountTypeLabels: Record<AccountType, string> = {
    BANK: 'Bank Account',
    CREDIT_CARD: 'Credit Card',
    INVESTMENT: 'Investment',
    LOAN: 'Loan',
    MORTGAGE: 'Mortgage',
    OTHER: 'Other',
};

export const accountTypeColors: Record<AccountType, string> = {
    BANK: 'bg-ak-blue/15 text-ak-blue',
    CREDIT_CARD: 'bg-primary/15 text-primary',
    INVESTMENT: 'bg-ak-green/15 text-ak-green',
    LOAN: 'bg-ak-red/15 text-ak-red',
    MORTGAGE: 'bg-ak-purple/15 text-ak-purple',
    OTHER: 'glass text-muted-foreground',
};

export interface CurrencyGroup {
    currency: string;
    accounts: Account[];
    totalBalance: number; // integer cents
}

/**
 * Group accounts by currency and sum balances per group.
 * Returns sorted by total balance descending (largest group first).
 */
export function groupAccountsByCurrency(accounts: Account[]): CurrencyGroup[] {
    const map = new Map<string, CurrencyGroup>();

    for (const account of accounts) {
        const existing = map.get(account.currency);
        if (existing) {
            existing.accounts.push(account);
            existing.totalBalance += account.currentBalance;
        } else {
            map.set(account.currency, {
                currency: account.currency,
                accounts: [account],
                totalBalance: account.currentBalance,
            });
        }
    }

    return Array.from(map.values()).sort(
        (a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance)
    );
}

export interface TransactionStats {
    incomeMTD: number;   // integer cents (positive)
    expenseMTD: number;  // integer cents (positive, absolute value)
    unreconciledCount: number;
    totalCount: number;
}

/**
 * Compute transaction stats from an array of transactions.
 * Expects transactions already filtered to the desired date range.
 */
export function computeTransactionStats(
    transactions: Array<{ amount: number; journalEntryId?: string | null }>
): TransactionStats {
    let incomeMTD = 0;
    let expenseMTD = 0;
    let unreconciledCount = 0;

    for (const txn of transactions) {
        if (txn.amount > 0) {
            incomeMTD += txn.amount;
        } else {
            expenseMTD += Math.abs(txn.amount);
        }
        if (!txn.journalEntryId) {
            unreconciledCount++;
        }
    }

    return {
        incomeMTD,
        expenseMTD,
        unreconciledCount,
        totalCount: transactions.length,
    };
}
