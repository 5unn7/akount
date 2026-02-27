'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Percent, Plus, Sparkles, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { createTaxRateAction } from './actions';
import { TaxRateSheet } from './tax-rate-sheet';
import type { CreateTaxRateInput } from '@/lib/api/accounting';

interface TaxRatesEmptyProps {
    entityId?: string;
}

interface PresetRate {
    code: string;
    name: string;
    rateBasisPoints: number; // FIN-32: basis points (500 = 5%)
    jurisdiction: string;
}

interface PresetGroup {
    label: string;
    description: string;
    presets: PresetRate[];
}

const CANADIAN_PRESETS: PresetGroup = {
    label: 'Canadian Tax Rates',
    description: 'GST, HST, and provincial tax rates for Canada',
    presets: [
        {
            code: 'GST',
            name: 'Goods and Services Tax',
            rateBasisPoints: 500, // FIN-32
            jurisdiction: 'Federal (Canada)',

        },
        {
            code: 'HST-ON',
            name: 'Harmonized Sales Tax (Ontario)',
            rateBasisPoints: 1300,
            jurisdiction: 'Ontario',

        },
        {
            code: 'HST-NS',
            name: 'Harmonized Sales Tax (Nova Scotia)',
            rateBasisPoints: 1500,
            jurisdiction: 'Nova Scotia',

        },
        {
            code: 'HST-NB',
            name: 'Harmonized Sales Tax (New Brunswick)',
            rateBasisPoints: 1500,
            jurisdiction: 'New Brunswick',

        },
        {
            code: 'HST-NL',
            name: 'Harmonized Sales Tax (NL)',
            rateBasisPoints: 1500,
            jurisdiction: 'Newfoundland and Labrador',

        },
        {
            code: 'HST-PE',
            name: 'Harmonized Sales Tax (PEI)',
            rateBasisPoints: 1500,
            jurisdiction: 'Prince Edward Island',

        },
        {
            code: 'PST-BC',
            name: 'Provincial Sales Tax (BC)',
            rate: 0.07,
            jurisdiction: 'British Columbia',

        },
        {
            code: 'PST-SK',
            name: 'Provincial Sales Tax (SK)',
            rate: 0.06,
            jurisdiction: 'Saskatchewan',

        },
        {
            code: 'PST-MB',
            name: 'Retail Sales Tax (MB)',
            rate: 0.07,
            jurisdiction: 'Manitoba',

        },
        {
            code: 'QST',
            name: 'Quebec Sales Tax',
            rate: 0.09975,
            jurisdiction: 'Quebec',

        },
    ],
};

const US_PRESETS: PresetGroup = {
    label: 'US Tax Rates',
    description: 'Common US sales tax rates (state-level)',
    presets: [
        {
            code: 'TX-CA',
            name: 'California Sales Tax',
            rateBasisPoints: 725,
            jurisdiction: 'United States - Federal',

        },
        {
            code: 'TX-NY',
            name: 'New York Sales Tax',
            rateBasisPoints: 800,
            jurisdiction: 'United States - Federal',

        },
        {
            code: 'TX-TX',
            name: 'Texas Sales Tax',
            rateBasisPoints: 625,
            jurisdiction: 'United States - Federal',

        },
    ],
};

const PRESET_GROUPS = [CANADIAN_PRESETS, US_PRESETS];

export function TaxRatesEmpty({ entityId }: TaxRatesEmptyProps) {
    const router = useRouter();
    const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
    const [isApplying, setIsApplying] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function togglePreset(code: string) {
        setSelectedPresets((prev) => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    }

    function selectGroup(group: PresetGroup) {
        setSelectedPresets((prev) => {
            const next = new Set(prev);
            const allSelected = group.presets.every((p) => next.has(p.code));
            if (allSelected) {
                group.presets.forEach((p) => next.delete(p.code));
            } else {
                group.presets.forEach((p) => next.add(p.code));
            }
            return next;
        });
    }

    async function applyPresets() {
        if (selectedPresets.size === 0) return;

        setIsApplying(true);
        let created = 0;
        const allPresets = PRESET_GROUPS.flatMap((g) => g.presets);

        try {
            for (const preset of allPresets) {
                if (selectedPresets.has(preset.code)) {
                    await createTaxRateAction({ ...preset, effectiveFrom: new Date().toISOString(), entityId });
                    created++;
                }
            }
            toast.success(`Created ${created} tax rate${created !== 1 ? 's' : ''}`);
            router.refresh();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to create some tax rates'
            );
        } finally {
            setIsApplying(false);
        }
    }

    return (
        <div className="flex flex-col items-center py-12 space-y-8">
            {/* Icon + message */}
            <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
                    <Percent className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-heading font-medium">No tax rates configured</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Set up tax rates for your business. Choose from presets below or create custom rates.
                </p>
            </div>

            {/* Preset groups */}
            <div className="w-full max-w-2xl space-y-6">
                {PRESET_GROUPS.map((group) => {
                    const allSelected = group.presets.every((p) =>
                        selectedPresets.has(p.code)
                    );
                    return (
                        <div key={group.label} className="glass rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        {group.label}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {group.description}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => selectGroup(group)}
                                    className="text-xs"
                                >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {group.presets.map((preset) => {
                                    const isSelected = selectedPresets.has(preset.code);
                                    return (
                                        <button
                                            key={preset.code}
                                            type="button"
                                            onClick={() => togglePreset(preset.code)}
                                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all ${
                                                isSelected
                                                    ? 'glass-3 border border-ak-green/30'
                                                    : 'glass-2 border border-transparent hover:border-ak-border-2'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                                        isSelected
                                                            ? 'bg-ak-green text-white'
                                                            : 'border border-ak-border-2'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {preset.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {preset.code}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="ml-2 shrink-0 font-mono text-xs text-ak-green border-ak-green/20"
                                            >
                                                {(preset.rateBasisPoints / 100).toFixed(
                                                    preset.rateBasisPoints % 100 === 0 ? 0 : 2
                                                )}%
                                            </Badge>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={applyPresets}
                    disabled={selectedPresets.size === 0 || isApplying}
                    className="gap-2"
                >
                    <Sparkles className="h-4 w-4" />
                    {isApplying
                        ? 'Creating...'
                        : `Apply ${selectedPresets.size} Preset${selectedPresets.size !== 1 ? 's' : ''}`}
                </Button>
                <span className="text-xs text-muted-foreground">or</span>
                <Button variant="outline" className="gap-2" onClick={() => setSheetOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create Custom Rate
                </Button>
            </div>

            <div className="text-center">
                <Link
                    href="/accounting"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Accounting Setup
                </Link>
            </div>

            <TaxRateSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                editingRate={null}
                isSubmitting={isSubmitting}
                onSave={async (data) => {
                    setIsSubmitting(true);
                    try {
                        await createTaxRateAction({ ...data as CreateTaxRateInput, entityId });
                        toast.success('Tax rate created');
                        setSheetOpen(false);
                        router.refresh();
                    } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Failed to create tax rate');
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            />
        </div>
    );
}
