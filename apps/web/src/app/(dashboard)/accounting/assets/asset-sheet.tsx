'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { capitalizeAssetAction, updateAssetAction } from './actions';
import type { FixedAsset, AssetCategory, DepreciationMethod } from '@/lib/api/accounting';

interface AssetSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityId?: string;
    editingAsset?: FixedAsset | null;
}

const CATEGORIES: { value: AssetCategory; label: string }[] = [
    { value: 'BUILDING', label: 'Building' },
    { value: 'VEHICLE', label: 'Vehicle' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'COMPUTER', label: 'Computer' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'LEASEHOLD', label: 'Leasehold Improvement' },
    { value: 'OTHER', label: 'Other' },
];

const METHODS: { value: DepreciationMethod; label: string; description: string }[] = [
    { value: 'STRAIGHT_LINE', label: 'Straight Line', description: 'Equal monthly amounts' },
    { value: 'DECLINING_BALANCE', label: 'Declining Balance', description: 'Double-declining rate on NBV' },
    { value: 'UNITS_OF_PRODUCTION', label: 'Units of Production', description: 'Based on usage output' },
];

export function AssetSheet({ open, onOpenChange, entityId, editingAsset }: AssetSheetProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState(editingAsset?.name ?? '');
    const [description, setDescription] = useState(editingAsset?.description ?? '');
    const [category, setCategory] = useState<AssetCategory>(editingAsset?.category ?? 'EQUIPMENT');
    const [acquiredDate, setAcquiredDate] = useState(
        editingAsset?.acquiredDate
            ? new Date(editingAsset.acquiredDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [costDollars, setCostDollars] = useState(
        editingAsset ? String(editingAsset.cost / 100) : ''
    );
    const [salvageDollars, setSalvageDollars] = useState(
        editingAsset ? String(editingAsset.salvageValue / 100) : ''
    );
    const [usefulLifeMonths, setUsefulLifeMonths] = useState(
        editingAsset ? String(editingAsset.usefulLifeMonths) : '36'
    );
    const [method, setMethod] = useState<DepreciationMethod>(
        editingAsset?.depreciationMethod ?? 'STRAIGHT_LINE'
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!entityId) {
            toast.error('No entity selected');
            return;
        }

        const costCents = Math.round(parseFloat(costDollars) * 100);
        const salvageCents = Math.round(parseFloat(salvageDollars || '0') * 100);
        const months = parseInt(usefulLifeMonths);

        if (isNaN(costCents) || costCents <= 0) {
            toast.error('Cost must be a positive number');
            return;
        }
        if (salvageCents >= costCents) {
            toast.error('Salvage value must be less than cost');
            return;
        }
        if (isNaN(months) || months < 1) {
            toast.error('Useful life must be at least 1 month');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingAsset) {
                await updateAssetAction(editingAsset.id, {
                    name,
                    description: description || null,
                    category,
                    salvageValue: salvageCents,
                    usefulLifeMonths: months,
                    depreciationMethod: method,
                });
                toast.success('Asset updated');
            } else {
                await capitalizeAssetAction({
                    entityId,
                    name,
                    description: description || undefined,
                    category,
                    acquiredDate: new Date(acquiredDate).toISOString(),
                    cost: costCents,
                    salvageValue: salvageCents,
                    usefulLifeMonths: months,
                    depreciationMethod: method,
                });
                toast.success('Asset capitalized');
            }
            onOpenChange(false);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save asset');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="font-heading">
                        {editingAsset ? 'Edit Asset' : 'Capitalize New Asset'}
                    </SheetTitle>
                    <SheetDescription>
                        {editingAsset
                            ? 'Update asset details. Cost and acquisition date cannot be changed.'
                            : 'Record a new fixed asset for depreciation tracking.'}
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Asset Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Office Laptop"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., MacBook Pro 16-inch M3"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="acquiredDate">Acquired Date</Label>
                            <Input
                                id="acquiredDate"
                                type="date"
                                value={acquiredDate}
                                onChange={(e) => setAcquiredDate(e.target.value)}
                                disabled={!!editingAsset}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cost">Cost ($)</Label>
                            <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={costDollars}
                                onChange={(e) => setCostDollars(e.target.value)}
                                placeholder="2500.00"
                                disabled={!!editingAsset}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salvage">Salvage Value ($)</Label>
                            <Input
                                id="salvage"
                                type="number"
                                step="0.01"
                                min="0"
                                value={salvageDollars}
                                onChange={(e) => setSalvageDollars(e.target.value)}
                                placeholder="250.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="usefulLife">Useful Life (months)</Label>
                            <Input
                                id="usefulLife"
                                type="number"
                                min="1"
                                max="1200"
                                value={usefulLifeMonths}
                                onChange={(e) => setUsefulLifeMonths(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Depreciation Method</Label>
                            <Select value={method} onValueChange={(v) => setMethod(v as DepreciationMethod)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {METHODS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            <div>
                                                <span>{m.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Saving...'
                                : editingAsset
                                    ? 'Update Asset'
                                    : 'Capitalize Asset'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
