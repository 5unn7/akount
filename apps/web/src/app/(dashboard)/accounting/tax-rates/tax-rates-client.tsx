'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TaxRate, CreateTaxRateInput, UpdateTaxRateInput } from '@/lib/api/accounting';
import { formatDate } from '@/lib/api/accounting';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Pencil,
    Search,
    Percent,
    Power,
    Globe2,
    ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    createTaxRateAction,
    updateTaxRateAction,
    deactivateTaxRateAction,
} from './actions';
import { TaxRateSheet } from './tax-rate-sheet';

interface TaxRatesClientProps {
    initialTaxRates: TaxRate[];
    entityId?: string;
}

export function TaxRatesClient({ initialTaxRates, entityId }: TaxRatesClientProps) {
    const router = useRouter();
    const [taxRates, setTaxRates] = useState<TaxRate[]>(initialTaxRates);
    const [search, setSearch] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter by search
    const filtered = taxRates.filter(
        (tr) =>
            tr.name.toLowerCase().includes(search.toLowerCase()) ||
            tr.code.toLowerCase().includes(search.toLowerCase()) ||
            tr.jurisdiction.toLowerCase().includes(search.toLowerCase())
    );

    const activeRates = filtered.filter((tr) => tr.isActive);
    const inactiveRates = filtered.filter((tr) => !tr.isActive);

    // Group active rates by jurisdiction
    const byJurisdiction = activeRates.reduce<Record<string, TaxRate[]>>((acc, tr) => {
        const key = tr.jurisdiction;
        if (!acc[key]) acc[key] = [];
        acc[key].push(tr);
        return acc;
    }, {});

    function openCreate() {
        setEditingRate(null);
        setSheetOpen(true);
    }

    function openEdit(rate: TaxRate) {
        setEditingRate(rate);
        setSheetOpen(true);
    }

    async function handleSave(data: CreateTaxRateInput | UpdateTaxRateInput) {
        setIsSubmitting(true);
        try {
            if (editingRate) {
                const updated = await updateTaxRateAction(editingRate.id, data as UpdateTaxRateInput);
                setTaxRates((prev) =>
                    prev.map((tr) => (tr.id === editingRate.id ? updated : tr))
                );
                toast.success(`Tax rate "${updated.name}" updated`);
            } else {
                const created = await createTaxRateAction({
                    ...data as CreateTaxRateInput,
                    entityId,
                });
                setTaxRates((prev) => [...prev, created]);
                toast.success(`Tax rate "${created.name}" created`);
            }
            setSheetOpen(false);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save tax rate');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeactivate(rate: TaxRate) {
        try {
            const updated = await deactivateTaxRateAction(rate.id);
            setTaxRates((prev) =>
                prev.map((tr) => (tr.id === rate.id ? updated : tr))
            );
            toast.success(`Tax rate "${rate.name}" deactivated`);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to deactivate tax rate');
        }
    }

    // Tax collection summary — total combined rate across active rates
    const totalCombinedRate = activeRates.reduce((sum, tr) => sum + tr.rate, 0);

    return (
        <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Rates</p>
                    <p className="text-2xl font-mono font-semibold mt-1">{activeRates.length}</p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Jurisdictions</p>
                    <p className="text-2xl font-mono font-semibold mt-1">
                        {Object.keys(byJurisdiction).length}
                    </p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Combined Rate</p>
                    <p className="text-2xl font-mono font-semibold mt-1 text-ak-green">
                        {(totalCombinedRate * 100).toFixed(2)}%
                    </p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Inactive</p>
                    <p className="text-2xl font-mono font-semibold mt-1 text-muted-foreground">
                        {inactiveRates.length}
                    </p>
                </div>
            </div>

            {/* Tax flow example — illustrative only */}
            {activeRates.length > 0 && (
                <div className="glass rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Example: Tax on $1,000 Sale
                        </h3>
                        <span className="text-micro text-muted-foreground/60">
                            Illustrative only
                        </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="glass-2 rounded-lg px-4 py-2 text-center">
                            <p className="text-xs text-muted-foreground">Sale</p>
                            <p className="text-sm font-mono font-medium">$1,000.00</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="glass-2 rounded-lg px-4 py-2 text-center border border-ak-green/20">
                            <p className="text-xs text-ak-green">Tax Collected</p>
                            <p className="text-sm font-mono font-medium text-ak-green">
                                +${(1000 * totalCombinedRate).toFixed(2)}
                            </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="glass-2 rounded-lg px-4 py-2 text-center border border-ak-blue/20">
                            <p className="text-xs text-ak-blue">Customer Pays</p>
                            <p className="text-sm font-mono font-medium text-ak-blue">
                                ${(1000 + 1000 * totalCombinedRate).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search + Add */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tax rates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 glass border-ak-border"
                    />
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Tax Rate
                </Button>
            </div>

            {/* Tax rates by jurisdiction */}
            {Object.entries(byJurisdiction).map(([jurisdiction, rates]) => (
                <div key={jurisdiction} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">{jurisdiction}</h3>
                        <span className="text-xs text-muted-foreground">
                            ({rates.length} rate{rates.length !== 1 ? 's' : ''})
                        </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {rates.map((rate) => (
                            <TaxRateCard
                                key={rate.id}
                                rate={rate}
                                onEdit={() => openEdit(rate)}
                                onDeactivate={() => handleDeactivate(rate)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* Inactive rates */}
            {inactiveRates.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Inactive Rates ({inactiveRates.length})
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {inactiveRates.map((rate) => (
                            <TaxRateCard
                                key={rate.id}
                                rate={rate}
                                onEdit={() => openEdit(rate)}
                                onDeactivate={() => handleDeactivate(rate)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty filtered state */}
            {filtered.length === 0 && taxRates.length > 0 && (
                <div className="text-center py-12">
                    <Search className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-xs text-muted-foreground mt-2">
                        No tax rates match &quot;{search}&quot;
                    </p>
                </div>
            )}

            {/* Form sheet */}
            <TaxRateSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                editingRate={editingRate}
                isSubmitting={isSubmitting}
                onSave={handleSave}
            />
        </div>
    );
}

// ============================================================================
// TaxRateCard
// ============================================================================

interface TaxRateCardProps {
    rate: TaxRate;
    onEdit: () => void;
    onDeactivate: () => void;
}

function TaxRateCard({ rate, onEdit, onDeactivate }: TaxRateCardProps) {
    const ratePercent = (rate.rate * 100).toFixed(rate.rate * 100 % 1 === 0 ? 0 : 3);

    return (
        <div className="glass rounded-xl p-4 transition-all hover:border-ak-border-2 hover:-translate-y-px group">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-ak-green" />
                        <span className="font-medium text-sm">{rate.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{rate.code}</p>
                </div>
                <div className="flex items-center gap-1">
                    {rate.isActive ? (
                        <Badge variant="outline" className="text-xs bg-ak-green-dim text-ak-green border-ak-green/20">
                            Active
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground border-ak-border">
                            Inactive
                        </Badge>
                    )}
                </div>
            </div>

            {/* Rate display */}
            <div className="mt-3">
                <p className="text-2xl font-mono font-semibold text-ak-green">
                    {ratePercent}%
                </p>
                {rate.isInclusive && (
                    <p className="text-xs text-muted-foreground mt-0.5">Tax-inclusive</p>
                )}
            </div>

            {/* Rate bar visualization */}
            <div className="mt-3 h-1.5 rounded-full bg-ak-bg-3 overflow-hidden">
                <div
                    className="h-full rounded-full bg-ak-green transition-all"
                    style={{ width: `${Math.min(rate.rate * 100 * 4, 100)}%` }}
                />
            </div>

            {/* Metadata */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>From {formatDate(rate.effectiveFrom)}</span>
                {rate.effectiveTo && <span>Until {formatDate(rate.effectiveTo)}</span>}
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs gap-1">
                    <Pencil className="h-3 w-3" />
                    Edit
                </Button>
                {rate.isActive && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDeactivate}
                        className="h-7 text-xs gap-1 text-ak-red hover:text-ak-red"
                    >
                        <Power className="h-3 w-3" />
                        Deactivate
                    </Button>
                )}
            </div>
        </div>
    );
}
