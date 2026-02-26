'use client';

import { useState } from 'react';
import type {
    Forecast,
    ForecastType,
    ForecastScenario,
    ForecastDataPoint,
} from '@/lib/api/planning';
import { apiFetch } from '@/lib/api/client-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FORECAST_TYPES: { value: ForecastType; label: string }[] = [
    { value: 'CASH_FLOW', label: 'Cash Flow' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'EXPENSE', label: 'Expense' },
];

const FORECAST_SCENARIOS: { value: ForecastScenario; label: string }[] = [
    { value: 'BASELINE', label: 'Baseline' },
    { value: 'OPTIMISTIC', label: 'Optimistic' },
    { value: 'PESSIMISTIC', label: 'Pessimistic' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ForecastFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingForecast: Forecast | null;
    entityId: string;
    onSaved: (forecast: Forecast) => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ForecastForm({
    open,
    onOpenChange,
    editingForecast,
    entityId,
    onSaved,
}: ForecastFormProps) {
    const isEditing = !!editingForecast;

    const [name, setName] = useState(editingForecast?.name ?? '');
    const [type, setType] = useState<ForecastType>(editingForecast?.type ?? 'CASH_FLOW');
    const [scenario, setScenario] = useState<ForecastScenario>(
        editingForecast?.scenario ?? 'BASELINE'
    );
    const [periodStart, setPeriodStart] = useState(
        editingForecast?.periodStart
            ? new Date(editingForecast.periodStart).toISOString().split('T')[0]
            : ''
    );
    const [periodEnd, setPeriodEnd] = useState(
        editingForecast?.periodEnd
            ? new Date(editingForecast.periodEnd).toISOString().split('T')[0]
            : ''
    );
    const [dataPoints, setDataPoints] = useState<ForecastDataPoint[]>(
        editingForecast?.data ?? []
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // -- Data point handlers ------------------------------------------------

    function addDataPoint() {
        setDataPoints(prev => [...prev, { month: '', amount: 0 }]);
    }

    function removeDataPoint(index: number) {
        setDataPoints(prev => prev.filter((_, i) => i !== index));
    }

    function updateDataPointMonth(index: number, month: string) {
        setDataPoints(prev =>
            prev.map((dp, i) => (i === index ? { ...dp, month } : dp))
        );
    }

    function updateDataPointAmount(index: number, dollarValue: string) {
        const cents = Math.round(parseFloat(dollarValue || '0') * 100);
        setDataPoints(prev =>
            prev.map((dp, i) => (i === index ? { ...dp, amount: isNaN(cents) ? 0 : cents } : dp))
        );
    }

    // -- Submit -------------------------------------------------------------

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            if (!name.trim()) {
                setError('Name is required');
                setIsSaving(false);
                return;
            }

            if (!periodStart || !periodEnd) {
                setError('Both start and end dates are required');
                setIsSaving(false);
                return;
            }

            if (periodStart >= periodEnd) {
                setError('End date must be after start date');
                setIsSaving(false);
                return;
            }

            // Filter out incomplete data points
            const validDataPoints = dataPoints.filter(dp => dp.month.length > 0);

            let saved: Forecast;

            if (isEditing) {
                saved = await apiFetch<Forecast>(
                    `/api/planning/forecasts/${editingForecast.id}`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            name,
                            type,
                            scenario,
                            periodStart,
                            periodEnd,
                            data: validDataPoints,
                        }),
                    }
                );
            } else {
                saved = await apiFetch<Forecast>('/api/planning/forecasts', {
                    method: 'POST',
                    body: JSON.stringify({
                        name,
                        entityId,
                        type,
                        scenario,
                        periodStart,
                        periodEnd,
                        data: validDataPoints,
                    }),
                });
            }

            await onSaved(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save forecast');
        } finally {
            setIsSaving(false);
        }
    }

    // -- Render -------------------------------------------------------------

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="glass-2 border-ak-border-2 sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="font-heading">
                        {isEditing ? 'Edit Forecast' : 'New Forecast'}
                    </SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? 'Update forecast details and data points.'
                            : 'Create a financial projection with scenario modeling.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    {error && (
                        <div className="rounded-lg bg-ak-red-dim border border-ak-red/20 p-3">
                            <p className="text-sm text-ak-red">{error}</p>
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="forecast-name" className="text-xs text-muted-foreground">
                            Name
                        </Label>
                        <Input
                            id="forecast-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Q2 Cash Flow Projection"
                            required
                            className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                        />
                    </div>

                    {/* Type + Scenario */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="forecast-type" className="text-xs text-muted-foreground">
                                Type
                            </Label>
                            <Select value={type} onValueChange={v => setType(v as ForecastType)}>
                                <SelectTrigger
                                    id="forecast-type"
                                    className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    {FORECAST_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="forecast-scenario"
                                className="text-xs text-muted-foreground"
                            >
                                Scenario
                            </Label>
                            <Select
                                value={scenario}
                                onValueChange={v => setScenario(v as ForecastScenario)}
                            >
                                <SelectTrigger
                                    id="forecast-scenario"
                                    className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    {FORECAST_SCENARIOS.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Period */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="forecast-start"
                                className="text-xs text-muted-foreground"
                            >
                                Period Start
                            </Label>
                            <Input
                                id="forecast-start"
                                type="date"
                                value={periodStart}
                                onChange={e => setPeriodStart(e.target.value)}
                                required
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="forecast-end"
                                className="text-xs text-muted-foreground"
                            >
                                Period End
                            </Label>
                            <Input
                                id="forecast-end"
                                type="date"
                                value={periodEnd}
                                onChange={e => setPeriodEnd(e.target.value)}
                                required
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Data Points */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Data Points</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addDataPoint}
                                className="h-7 text-xs gap-1 hover:bg-ak-bg-3"
                            >
                                <Plus className="h-3 w-3" />
                                Add
                            </Button>
                        </div>

                        {dataPoints.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-3">
                                No data points yet. Add monthly projections.
                            </p>
                        )}

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {dataPoints.map((dp, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        type="month"
                                        value={dp.month}
                                        onChange={e => updateDataPointMonth(index, e.target.value)}
                                        placeholder="YYYY-MM"
                                        className="glass-2 rounded-lg border-ak-border focus:ring-primary flex-1"
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={dp.amount ? String(dp.amount / 100) : ''}
                                        onChange={e => updateDataPointAmount(index, e.target.value)}
                                        placeholder="Amount ($)"
                                        className="glass-2 rounded-lg border-ak-border focus:ring-primary font-mono w-32"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 hover:bg-ak-bg-3 text-destructive"
                                        onClick={() => removeDataPoint(index)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-lg border-ak-border hover:bg-ak-bg-3"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {isEditing ? 'Update Forecast' : 'Create Forecast'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
