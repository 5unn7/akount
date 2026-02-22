'use client';

import { useState, useEffect } from 'react';
import type { TaxRate, CreateTaxRateInput, UpdateTaxRateInput } from '@/lib/api/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface TaxRateSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingRate: TaxRate | null;
    isSubmitting: boolean;
    onSave: (data: CreateTaxRateInput | UpdateTaxRateInput) => void;
}

const JURISDICTIONS = [
    'Federal (Canada)',
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon',
    'United States - Federal',
    'Other',
];

export function TaxRateSheet({
    open,
    onOpenChange,
    editingRate,
    isSubmitting,
    onSave,
}: TaxRateSheetProps) {
    const isEdit = editingRate !== null;

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [ratePercent, setRatePercent] = useState('');
    const [jurisdiction, setJurisdiction] = useState('');
    const [isInclusive, setIsInclusive] = useState(false);
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo, setEffectiveTo] = useState('');

    // Reset form when sheet opens/closes or editing rate changes
    useEffect(() => {
        if (open && editingRate) {
            setCode(editingRate.code);
            setName(editingRate.name);
            setRatePercent(String(editingRate.rate * 100));
            setJurisdiction(editingRate.jurisdiction);
            setIsInclusive(editingRate.isInclusive);
            setEffectiveFrom(editingRate.effectiveFrom.split('T')[0]);
            setEffectiveTo(editingRate.effectiveTo ? editingRate.effectiveTo.split('T')[0] : '');
        } else if (open && !editingRate) {
            setCode('');
            setName('');
            setRatePercent('');
            setJurisdiction('');
            setIsInclusive(false);
            setEffectiveFrom(new Date().toISOString().split('T')[0]);
            setEffectiveTo('');
        }
    }, [open, editingRate]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const rateDecimal = parseFloat(ratePercent) / 100;

        if (isEdit) {
            const data: UpdateTaxRateInput = {
                name,
                rate: rateDecimal,
                jurisdiction,
                isInclusive,
                effectiveFrom: new Date(effectiveFrom).toISOString(),
                effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
            };
            onSave(data);
        } else {
            const data: CreateTaxRateInput = {
                code: code.toUpperCase(),
                name,
                rate: rateDecimal,
                jurisdiction,
                isInclusive,
                effectiveFrom: new Date(effectiveFrom).toISOString(),
                effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : undefined,
            };
            onSave(data);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md bg-card border-ak-border overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEdit ? 'Edit Tax Rate' : 'Create Tax Rate'}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? `Update details for ${editingRate?.name}`
                            : 'Add a new tax rate to your system'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    {/* Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code">Code</Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. GST, HST-ON, QST"
                            className="glass border-ak-border font-mono"
                            required
                            disabled={isEdit}
                            maxLength={20}
                        />
                        <p className="text-xs text-muted-foreground">
                            Uppercase letters, numbers, and hyphens only
                        </p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Goods and Services Tax"
                            className="glass border-ak-border"
                            required
                        />
                    </div>

                    {/* Rate */}
                    <div className="space-y-2">
                        <Label htmlFor="rate">Rate (%)</Label>
                        <div className="relative">
                            <Input
                                id="rate"
                                type="number"
                                value={ratePercent}
                                onChange={(e) => setRatePercent(e.target.value)}
                                placeholder="e.g. 13"
                                className="glass border-ak-border font-mono pr-8"
                                required
                                min={0}
                                max={100}
                                step="0.001"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                %
                            </span>
                        </div>
                    </div>

                    {/* Jurisdiction */}
                    <div className="space-y-2">
                        <Label htmlFor="jurisdiction">Jurisdiction</Label>
                        <Select value={jurisdiction} onValueChange={setJurisdiction}>
                            <SelectTrigger className="glass border-ak-border">
                                <SelectValue placeholder="Select jurisdiction" />
                            </SelectTrigger>
                            <SelectContent>
                                {JURISDICTIONS.map((j) => (
                                    <SelectItem key={j} value={j}>
                                        {j}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tax-inclusive toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Tax-inclusive pricing</Label>
                            <p className="text-xs text-muted-foreground">
                                Tax is included in the displayed price
                            </p>
                        </div>
                        <Switch
                            checked={isInclusive}
                            onCheckedChange={setIsInclusive}
                        />
                    </div>

                    {/* Effective dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="effectiveFrom">Effective From</Label>
                            <Input
                                id="effectiveFrom"
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                className="glass border-ak-border"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="effectiveTo">Effective Until</Label>
                            <Input
                                id="effectiveTo"
                                type="date"
                                value={effectiveTo}
                                onChange={(e) => setEffectiveTo(e.target.value)}
                                className="glass border-ak-border"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !code || !name || !ratePercent || !jurisdiction || !effectiveFrom}
                            className="flex-1"
                        >
                            {isSubmitting
                                ? 'Saving...'
                                : isEdit
                                    ? 'Update Rate'
                                    : 'Create Rate'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
