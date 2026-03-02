'use client';

import { useState } from 'react';
import type {
    Forecast,
    ForecastType,
    ForecastScenario,
    CashRunwayResult,
    SeasonalAnalysis,
} from '@/lib/api/planning';
import { apiFetch } from '@/lib/api/client-browser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@akount/ui';
import {
    TrendingUp,
    Plus,
    Pencil,
    Trash2,
    DollarSign,
    Clock,
    BarChart3,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { ForecastForm } from './forecast-form';
import { ScenarioComparison } from './scenario-comparison';

// ---------------------------------------------------------------------------
// Type badge configs
// ---------------------------------------------------------------------------

const FORECAST_TYPE_CONFIG: Record<ForecastType, { label: string; className: string }> = {
    CASH_FLOW: { label: 'Cash Flow', className: 'bg-ak-blue-dim text-ak-blue border-transparent' },
    REVENUE: { label: 'Revenue', className: 'bg-ak-green-dim text-ak-green border-transparent' },
    EXPENSE: { label: 'Expense', className: 'bg-ak-red-dim text-ak-red border-transparent' },
};

const FORECAST_SCENARIO_CONFIG: Record<ForecastScenario, { label: string; className: string }> = {
    BASELINE: { label: 'Baseline', className: 'bg-ak-pri-dim text-ak-pri-text border-transparent' },
    OPTIMISTIC: { label: 'Optimistic', className: 'bg-ak-green-dim text-ak-green border-transparent' },
    PESSIMISTIC: { label: 'Pessimistic', className: 'bg-ak-red-dim text-ak-red border-transparent' },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ForecastsListProps {
    initialForecasts: Forecast[];
    initialNextCursor: string | null;
    cashRunway: CashRunwayResult | null;
    seasonalAnalysis: SeasonalAnalysis | null;
    entityId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRunwayColor(months: number): string {
    if (months > 12) return 'text-ak-green';
    if (months >= 6) return 'text-primary';
    return 'text-ak-red';
}

function getRunwayBgColor(months: number): string {
    if (months > 12) return 'bg-ak-green-dim';
    if (months >= 6) return 'bg-ak-pri-dim';
    return 'bg-ak-red-dim';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ForecastsList({
    initialForecasts,
    initialNextCursor,
    cashRunway,
    seasonalAnalysis,
    entityId,
}: ForecastsListProps) {
    const [forecasts, setForecasts] = useState(initialForecasts);
    const [_nextCursor, _setNextCursor] = useState(initialNextCursor);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingForecast, setEditingForecast] = useState<Forecast | null>(null);
    const [deletingForecastId, setDeletingForecastId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // -- Handlers -----------------------------------------------------------

    function handleCreate() {
        setEditingForecast(null);
        setSheetOpen(true);
    }

    function handleEdit(forecast: Forecast) {
        setEditingForecast(forecast);
        setSheetOpen(true);
    }

    async function handleDelete() {
        if (!deletingForecastId) return;
        setIsDeleting(true);
        try {
            await apiFetch(`/api/planning/forecasts/${deletingForecastId}`, {
                method: 'DELETE',
            });
            setForecasts(prev => prev.filter(f => f.id !== deletingForecastId));
        } finally {
            setIsDeleting(false);
            setDeletingForecastId(null);
        }
    }

    function handleSaved(saved: Forecast) {
        if (editingForecast) {
            setForecasts(prev => prev.map(f => (f.id === saved.id ? saved : f)));
        } else {
            setForecasts(prev => [saved, ...prev]);
        }
        setSheetOpen(false);
        setEditingForecast(null);
    }

    // -- Render -------------------------------------------------------------

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-normal">Forecasts</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create financial projections and scenario analysis
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Forecast
                </Button>
            </div>

            {/* Cash Runway + Seasonal Score Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Cash Runway Card */}
                {cashRunway && (
                    <div className="glass rounded-xl p-5 col-span-2 space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Cash Runway
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-micro text-muted-foreground uppercase tracking-wider">
                                    Cash Balance
                                </p>
                                <p className="text-lg font-mono text-ak-green">
                                    {formatCurrency(cashRunway.cashBalance)}
                                </p>
                            </div>
                            <div>
                                <p className="text-micro text-muted-foreground uppercase tracking-wider">
                                    Monthly Burn
                                </p>
                                <p className="text-lg font-mono text-ak-red">
                                    {formatCurrency(cashRunway.monthlyBurnRate)}
                                </p>
                            </div>
                            <div>
                                <p className="text-micro text-muted-foreground uppercase tracking-wider">
                                    Monthly Revenue
                                </p>
                                <p className="text-lg font-mono text-ak-blue">
                                    {formatCurrency(cashRunway.monthlyRevenue)}
                                </p>
                            </div>
                            <div>
                                <p className="text-micro text-muted-foreground uppercase tracking-wider">
                                    Runway
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-lg font-mono ${getRunwayColor(cashRunway.runwayMonths)}`}>
                                        {cashRunway.runwayMonths === Infinity
                                            ? 'Infinite'
                                            : `${cashRunway.runwayMonths.toFixed(1)} mo`}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className={`text-micro border-transparent ${getRunwayBgColor(cashRunway.runwayMonths)} ${getRunwayColor(cashRunway.runwayMonths)}`}
                                    >
                                        {cashRunway.runwayMonths > 12
                                            ? 'Healthy'
                                            : cashRunway.runwayMonths >= 6
                                                ? 'Monitor'
                                                : 'Critical'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Seasonal Score Card */}
                {seasonalAnalysis && (
                    <div className="glass rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                            <BarChart3 className="h-4 w-4" />
                            Seasonality
                        </div>
                        <div className="space-y-2">
                            <p className="text-2xl font-mono">
                                {seasonalAnalysis.seasonalityScore}
                                <span className="text-sm text-muted-foreground">/100</span>
                            </p>
                            {seasonalAnalysis.highRevenueMonths.length > 0 && (
                                <p className="text-micro text-muted-foreground">
                                    <span className="text-ak-green">High:</span>{' '}
                                    {seasonalAnalysis.highRevenueMonths.join(', ')}
                                </p>
                            )}
                            {seasonalAnalysis.lowRevenueMonths.length > 0 && (
                                <p className="text-micro text-muted-foreground">
                                    <span className="text-ak-red">Low:</span>{' '}
                                    {seasonalAnalysis.lowRevenueMonths.join(', ')}
                                </p>
                            )}
                            <p className="text-micro text-muted-foreground">
                                Based on {seasonalAnalysis.monthsAnalyzed} months of data
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Forecasts Table */}
            {forecasts.length === 0 ? (
                <EmptyState
                    icon={TrendingUp}
                    title="No forecasts yet"
                    description="Create your first financial forecast to project future performance."
                >
                    <Button
                        onClick={handleCreate}
                        className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Forecast
                    </Button>
                </EmptyState>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-ak-border hover:bg-transparent">
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Name
                                </TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Type
                                </TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Scenario
                                </TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Period
                                </TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">
                                    Data Points
                                </TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {forecasts.map(forecast => {
                                const typeConfig = FORECAST_TYPE_CONFIG[forecast.type];
                                const scenarioConfig = FORECAST_SCENARIO_CONFIG[forecast.scenario];
                                const periodStart = new Date(forecast.periodStart).toLocaleDateString();
                                const periodEnd = new Date(forecast.periodEnd).toLocaleDateString();

                                return (
                                    <TableRow
                                        key={forecast.id}
                                        className="border-ak-border hover:bg-ak-bg-3"
                                    >
                                        <TableCell className="font-medium">
                                            {forecast.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={typeConfig.className}>
                                                {typeConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={scenarioConfig.className}>
                                                {scenarioConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                {periodStart} - {periodEnd}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {forecast.data.length}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-ak-bg-3"
                                                    onClick={() => handleEdit(forecast)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-ak-bg-3 text-destructive"
                                                    onClick={() => setDeletingForecastId(forecast.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Scenario Comparison */}
            <ScenarioComparison forecasts={forecasts} entityId={entityId} />

            {/* Forecast Form Sheet */}
            <ForecastForm
                key={editingForecast?.id ?? 'create'}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                editingForecast={editingForecast}
                entityId={entityId}
                onSaved={handleSaved}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deletingForecastId}
                onOpenChange={open => !open && setDeletingForecastId(null)}
            >
                <AlertDialogContent className="glass-2 border-ak-border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Forecast</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this forecast? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg border-ak-border hover:bg-ak-bg-3">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
