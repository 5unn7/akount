'use client';

import { useState, useMemo } from 'react';
import { GitCompare } from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@akount/ui';
import { formatCurrency } from '@/lib/utils/currency';
import type { Forecast, ForecastScenario } from '@/lib/api/planning';

const SCENARIO_COLOR: Record<ForecastScenario, { text: string; bg: string }> = {
    BASELINE: { text: 'text-ak-blue', bg: 'bg-ak-blue-dim' },
    OPTIMISTIC: { text: 'text-ak-green', bg: 'bg-ak-green-dim' },
    PESSIMISTIC: { text: 'text-ak-red', bg: 'bg-ak-red-dim' },
};

interface ScenarioComparisonProps {
    forecasts: Forecast[];
    entityId: string;
}

function pickDefaults(forecasts: Forecast[]): string[] {
    if (forecasts.length < 2) return forecasts.map(f => f.id);
    const byScenario = (s: ForecastScenario) => forecasts.find(f => f.scenario === s);
    const baseline = byScenario('BASELINE');
    const optimistic = byScenario('OPTIMISTIC');
    const pessimistic = byScenario('PESSIMISTIC');
    if (baseline && optimistic && pessimistic) {
        return [baseline.id, optimistic.id, pessimistic.id];
    }
    return forecasts.slice(0, Math.min(3, forecasts.length)).map(f => f.id);
}

function collectMonths(selected: Forecast[]): string[] {
    const set = new Set<string>();
    for (const f of selected) {
        for (const dp of f.data) set.add(dp.month);
    }
    return Array.from(set).sort();
}

export function ScenarioComparison({ forecasts, entityId: _entityId }: ScenarioComparisonProps) {
    const defaults = useMemo(() => pickDefaults(forecasts), [forecasts]);
    const [selectedIds, setSelectedIds] = useState<(string | null)[]>(
        [defaults[0] ?? null, defaults[1] ?? null, defaults[2] ?? null],
    );

    const selected = useMemo(
        () => selectedIds
            .filter((id): id is string => id !== null)
            .map(id => forecasts.find(f => f.id === id))
            .filter((f): f is Forecast => !!f),
        [selectedIds, forecasts],
    );
    const months = useMemo(() => collectMonths(selected), [selected]);
    const totals = useMemo(
        () => selected.map(f => f.data.reduce((sum, dp) => sum + dp.amount, 0)),
        [selected],
    );

    if (forecasts.length < 2) {
        return (
            <EmptyState
                icon={GitCompare}
                title="Not enough forecasts"
                description="Create at least 2 forecasts to compare scenarios"
            />
        );
    }

    function handleSlotChange(slot: number, forecastId: string) {
        setSelectedIds(prev => {
            const next = [...prev];
            next[slot] = forecastId === '__none' ? null : forecastId;
            return next;
        });
    }

    return (
        <div className="space-y-4">
            {/* Header + Selects */}
            <div className="glass rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-heading font-normal">Scenario Comparison</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map(slot => (
                        <Select
                            key={slot}
                            value={selectedIds[slot] ?? '__none'}
                            onValueChange={v => handleSlotChange(slot, v)}
                        >
                            <SelectTrigger className="border-ak-border bg-transparent">
                                <SelectValue placeholder={`Scenario ${slot + 1}`} />
                            </SelectTrigger>
                            <SelectContent className="glass-2 border-ak-border">
                                {slot >= 2 && <SelectItem value="__none">None</SelectItem>}
                                {forecasts.map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.name} ({f.scenario})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}
                </div>
            </div>

            {/* Comparison Grid */}
            {selected.length >= 2 && (
                <div className="glass rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-ak-border">
                                    <th className="px-4 py-3 text-left text-micro uppercase tracking-[0.05em] text-muted-foreground">
                                        Month
                                    </th>
                                    {selected.map(f => (
                                        <th
                                            key={f.id}
                                            className={`px-4 py-3 text-right text-micro uppercase tracking-[0.05em] ${SCENARIO_COLOR[f.scenario].text}`}
                                        >
                                            {f.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {months.map(month => (
                                    <tr key={month} className="border-b border-ak-border hover:bg-ak-bg-3 transition-colors">
                                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{month}</td>
                                        {selected.map(f => {
                                            const dp = f.data.find(d => d.month === month);
                                            return (
                                                <td key={f.id} className={`px-4 py-2.5 text-right font-mono ${SCENARIO_COLOR[f.scenario].text}`}>
                                                    {dp ? formatCurrency(dp.amount) : '\u2014'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {/* Summary totals */}
                                <tr className="border-t-2 border-ak-border-2 bg-ak-bg-3">
                                    <td className="px-4 py-3 text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                                        Total
                                    </td>
                                    {selected.map((f, i) => (
                                        <td key={f.id} className={`px-4 py-3 text-right font-mono font-medium ${SCENARIO_COLOR[f.scenario].text}`}>
                                            {formatCurrency(totals[i])}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selected.length < 2 && (
                <div className="glass rounded-xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Select at least 2 forecasts above to compare scenarios
                    </p>
                </div>
            )}
        </div>
    );
}
