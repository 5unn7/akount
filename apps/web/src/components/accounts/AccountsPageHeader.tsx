'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, RotateCw, Upload } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import type { Entity } from '@/lib/api/entities';
import { AccountFormSheet } from './AccountFormSheet';
import Link from 'next/link';

const ACCOUNT_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'BANK', label: 'Bank' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'INVESTMENT', label: 'Investment' },
    { value: 'LOAN', label: 'Loan' },
    { value: 'MORTGAGE', label: 'Mortgage' },
    { value: 'OTHER', label: 'Other' },
];

interface AccountsPageHeaderProps {
    entities: Entity[];
    currencies?: string[];
    accountCount?: number;
}

export function AccountsPageHeader({ entities, currencies = [], accountCount = 0 }: AccountsPageHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [createOpen, setCreateOpen] = useState(false);

    const currentType = searchParams.get('type') || 'all';
    const currentCurrency = searchParams.get('currency') || 'all';

    const handleTypeChange = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === 'all') {
                params.delete('type');
            } else {
                params.set('type', value);
            }
            const qs = params.toString();
            router.push(qs ? `?${qs}` : '/banking/accounts', { scroll: false });
        },
        [router, searchParams]
    );

    const handleCurrencyChange = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === 'all') {
                params.delete('currency');
            } else {
                params.set('currency', value);
            }
            const qs = params.toString();
            router.push(qs ? `?${qs}` : '/banking/accounts', { scroll: false });
        },
        [router, searchParams]
    );

    const subtitle = [
        `${accountCount} account${accountCount !== 1 ? 's' : ''}`,
        currencies.length > 0 ? `${currencies.length} currenc${currencies.length !== 1 ? 'ies' : 'y'}` : null,
    ].filter(Boolean).join(', ');

    return (
        <div className="space-y-4 fi fi1">
            <PageHeader
                title="Accounts"
                subtitle={subtitle}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                            asChild
                        >
                            <Link href="/banking/imports">
                                <Upload className="h-3.5 w-3.5" />
                                Import
                            </Link>
                        </Button>
                        <Button
                            onClick={() => setCreateOpen(true)}
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Connect Account
                        </Button>
                    </div>
                }
            />

            {/* Filter pills */}
            <div className="flex items-center gap-3">
                <Select value={currentType} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-[140px] glass rounded-lg border-ak-border text-xs h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {currencies.length > 1 && (
                    <Select value={currentCurrency} onValueChange={handleCurrencyChange}>
                        <SelectTrigger className="w-[140px] glass rounded-lg border-ak-border text-xs h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Currencies</SelectItem>
                            {currencies.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <button
                    onClick={() => router.refresh()}
                    className="h-8 w-8 flex items-center justify-center rounded-lg glass hover:border-ak-border-2 transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Refresh"
                >
                    <RotateCw className="h-3.5 w-3.5" />
                </button>
            </div>

            <AccountFormSheet
                key="create"
                open={createOpen}
                onOpenChange={setCreateOpen}
                entities={entities}
            />
        </div>
    );
}
