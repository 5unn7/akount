'use client';

import { useState } from 'react';
import type { Account } from '@/lib/api/accounts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface TransactionsFiltersProps {
    accounts: Account[];
    selectedAccountId?: string;
    startDate?: string;
    endDate?: string;
    onFilterChange: (filters: {
        accountId?: string;
        startDate?: string;
        endDate?: string;
    }) => void;
    onClearFilters: () => void;
}

export function TransactionsFilters({
    accounts,
    selectedAccountId,
    startDate,
    endDate,
    onFilterChange,
    onClearFilters,
}: TransactionsFiltersProps) {
    const [localAccountId, setLocalAccountId] = useState(selectedAccountId || '');
    const [localStartDate, setLocalStartDate] = useState(startDate || '');
    const [localEndDate, setLocalEndDate] = useState(endDate || '');

    const hasFilters = selectedAccountId || startDate || endDate;

    function handleApplyFilters() {
        onFilterChange({
            accountId: localAccountId || undefined,
            startDate: localStartDate || undefined,
            endDate: localEndDate || undefined,
        });
    }

    function handleClear() {
        setLocalAccountId('');
        setLocalStartDate('');
        setLocalEndDate('');
        onClearFilters();
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Filters</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    {/* Account filter */}
                    <div className="space-y-2">
                        <Label htmlFor="account-filter" className="text-xs">
                            Account
                        </Label>
                        <Select
                            value={localAccountId}
                            onValueChange={setLocalAccountId}
                        >
                            <SelectTrigger id="account-filter">
                                <SelectValue placeholder="All accounts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All accounts</SelectItem>
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.name} ({account.currency})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Start date filter */}
                    <div className="space-y-2">
                        <Label htmlFor="start-date" className="text-xs">
                            Start Date
                        </Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={localStartDate}
                            onChange={(e) => setLocalStartDate(e.target.value)}
                        />
                    </div>

                    {/* End date filter */}
                    <div className="space-y-2">
                        <Label htmlFor="end-date" className="text-xs">
                            End Date
                        </Label>
                        <Input
                            id="end-date"
                            type="date"
                            value={localEndDate}
                            onChange={(e) => setLocalEndDate(e.target.value)}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-end gap-2">
                        <Button onClick={handleApplyFilters} className="flex-1">
                            Apply
                        </Button>
                        {hasFilters && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleClear}
                                title="Clear filters"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
