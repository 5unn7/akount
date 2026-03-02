'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Budget, Goal } from '@/lib/api/planning';

interface ExportPlanningButtonProps {
    type: 'budgets' | 'goals';
    data: Budget[] | Goal[];
    className?: string;
}

function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function centsToDollars(cents: number): string {
    return (cents / 100).toFixed(2);
}

function generateBudgetCSV(budgets: Budget[]): string {
    const headers = [
        'Name',
        'Period',
        'Amount',
        'Start Date',
        'End Date',
        'Category',
        'GL Account',
    ];

    const rows = budgets.map((b) => [
        escapeCSV(b.name),
        b.period,
        centsToDollars(b.amount),
        b.startDate,
        b.endDate,
        escapeCSV(b.category?.name ?? ''),
        escapeCSV(
            b.glAccount ? `${b.glAccount.code} - ${b.glAccount.name}` : ''
        ),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function generateGoalCSV(goals: Goal[]): string {
    const headers = [
        'Name',
        'Type',
        'Target Amount',
        'Current Amount',
        'Progress %',
        'Target Date',
        'Status',
    ];

    const rows = goals.map((g) => {
        const progress =
            g.targetAmount > 0
                ? ((g.currentAmount / g.targetAmount) * 100).toFixed(1)
                : '0.0';

        return [
            escapeCSV(g.name),
            g.type,
            centsToDollars(g.targetAmount),
            centsToDollars(g.currentAmount),
            progress,
            g.targetDate,
            g.status,
        ];
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function triggerDownload(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function ExportPlanningButton({
    type,
    data,
    className,
}: ExportPlanningButtonProps) {
    const handleExport = () => {
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `akount-${type}-${dateStr}.csv`;

        const csv =
            type === 'budgets'
                ? generateBudgetCSV(data as Budget[])
                : generateGoalCSV(data as Goal[]);

        triggerDownload(csv, filename);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={data.length === 0}
            className={className}
        >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    );
}
