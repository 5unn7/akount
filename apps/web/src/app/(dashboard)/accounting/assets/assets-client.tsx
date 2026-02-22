'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
    FixedAsset,
    AssetCategory,
    AssetStatus,
    DepreciationMethod,
    DepreciationResult,
} from '@/lib/api/accounting';
import { formatCurrency } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Pencil,
    Search,
    Package,
    Trash2,
    Play,
    Calendar,
    TrendingDown,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Building2,
    Car,
    Wrench,
    Armchair,
    Monitor,
    Code2,
    FileText,
    HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    disposeAssetAction,
    deleteAssetAction,
    runDepreciationAction,
} from './actions';
import { AssetSheet } from './asset-sheet';

// ============================================================================
// Types & Constants
// ============================================================================

interface AssetsClientProps {
    initialAssets: FixedAsset[];
    entityId: string;
}

const CATEGORY_CONFIG: Record<AssetCategory, { label: string; icon: typeof Package }> = {
    BUILDING: { label: 'Building', icon: Building2 },
    VEHICLE: { label: 'Vehicle', icon: Car },
    EQUIPMENT: { label: 'Equipment', icon: Wrench },
    FURNITURE: { label: 'Furniture', icon: Armchair },
    COMPUTER: { label: 'Computer', icon: Monitor },
    SOFTWARE: { label: 'Software', icon: Code2 },
    LEASEHOLD: { label: 'Leasehold', icon: FileText },
    OTHER: { label: 'Other', icon: HelpCircle },
};

const STATUS_CONFIG: Record<AssetStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-ak-green-dim text-ak-green border-ak-green/20' },
    FULLY_DEPRECIATED: { label: 'Fully Depreciated', className: 'bg-ak-purple-dim text-ak-purple border-ak-purple/20' },
    DISPOSED: { label: 'Disposed', className: 'text-muted-foreground border-ak-border' },
};

const METHOD_LABELS: Record<DepreciationMethod, string> = {
    STRAIGHT_LINE: 'Straight Line',
    DECLINING_BALANCE: 'Declining Balance',
    UNITS_OF_PRODUCTION: 'Units of Production',
};

// ============================================================================
// Main Component
// ============================================================================

export function AssetsClient({ initialAssets, entityId }: AssetsClientProps) {
    const router = useRouter();
    const [assets, setAssets] = useState<FixedAsset[]>(initialAssets);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<AssetStatus | 'ALL'>('ALL');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);

    // Dispose dialog state
    const [disposeTarget, setDisposeTarget] = useState<FixedAsset | null>(null);
    const [disposedDate, setDisposedDate] = useState(new Date().toISOString().split('T')[0]);
    const [disposalDollars, setDisposalDollars] = useState('');
    const [isDisposing, setIsDisposing] = useState(false);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<FixedAsset | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Run depreciation state
    const [runDialogOpen, setRunDialogOpen] = useState(false);
    const [runPeriodDate, setRunPeriodDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRunning, setIsRunning] = useState(false);
    const [runResult, setRunResult] = useState<DepreciationResult | null>(null);

    // Filter assets
    const filtered = assets.filter((a) => {
        const matchesSearch =
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            (a.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const activeAssets = assets.filter((a) => a.status === 'ACTIVE');
    const totalCost = assets.reduce((sum, a) => sum + a.cost, 0);
    const totalAccumDepr = assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
    const totalNBV = totalCost - totalAccumDepr;
    const fullyDepreciated = assets.filter((a) => a.status === 'FULLY_DEPRECIATED').length;

    // ---- Handlers ----

    function openCreate() {
        setEditingAsset(null);
        setSheetOpen(true);
    }

    function openEdit(asset: FixedAsset) {
        setEditingAsset(asset);
        setSheetOpen(true);
    }

    async function handleDispose() {
        if (!disposeTarget) return;
        setIsDisposing(true);
        try {
            const disposalCents = Math.round(parseFloat(disposalDollars || '0') * 100);
            await disposeAssetAction(disposeTarget.id, {
                disposedDate: new Date(disposedDate).toISOString(),
                disposalAmount: disposalCents,
            });
            toast.success(`"${disposeTarget.name}" disposed`);
            setDisposeTarget(null);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to dispose asset');
        } finally {
            setIsDisposing(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteAssetAction(deleteTarget.id);
            setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
            toast.success(`"${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete asset');
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleRunDepreciation() {
        setIsRunning(true);
        try {
            const result = await runDepreciationAction({
                entityId,
                periodDate: new Date(runPeriodDate).toISOString(),
            });
            setRunResult(result);
            toast.success(
                `Depreciation run: ${result.processed} processed, ${result.skipped} skipped`
            );
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to run depreciation');
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* ---- Portfolio Health Stats ---- */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cost</p>
                    <p className="text-2xl font-mono font-semibold mt-1">
                        {formatCurrency(totalCost)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {assets.length} asset{assets.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Book Value</p>
                    <p className="text-2xl font-mono font-semibold mt-1 text-ak-green">
                        {formatCurrency(totalNBV)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {totalCost > 0 ? ((totalNBV / totalCost) * 100).toFixed(0) : 0}% of cost
                    </p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Accumulated Depreciation
                    </p>
                    <p className="text-2xl font-mono font-semibold mt-1 text-ak-red">
                        {formatCurrency(totalAccumDepr)}
                    </p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Fully Depreciated</p>
                    <p className="text-2xl font-mono font-semibold mt-1 text-ak-purple">
                        {fullyDepreciated}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {activeAssets.length} active
                    </p>
                </div>
            </div>

            {/* ---- Search + Filters + Actions ---- */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 glass border-ak-border"
                    />
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-1.5">
                    {(['ALL', 'ACTIVE', 'FULLY_DEPRECIATED', 'DISPOSED'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${
                                statusFilter === s
                                    ? 'bg-primary text-primary-foreground'
                                    : 'glass text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            setRunResult(null);
                            setRunDialogOpen(true);
                        }}
                    >
                        <Play className="h-4 w-4" />
                        Run Depreciation
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Capitalize Asset
                    </Button>
                </div>
            </div>

            {/* ---- Asset Register Cards ---- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((asset) => (
                    <AssetCard
                        key={asset.id}
                        asset={asset}
                        onEdit={() => openEdit(asset)}
                        onDispose={() => {
                            setDisposeTarget(asset);
                            setDisposalDollars('');
                            setDisposedDate(new Date().toISOString().split('T')[0]);
                        }}
                        onDelete={() => setDeleteTarget(asset)}
                    />
                ))}
            </div>

            {/* Empty filtered state */}
            {filtered.length === 0 && assets.length > 0 && (
                <div className="text-center py-12">
                    <Search className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-xs text-muted-foreground mt-2">
                        No assets match your search
                    </p>
                </div>
            )}

            {/* ---- Depreciation Schedule (stacked bars) ---- */}
            {activeAssets.length > 0 && (
                <div className="glass rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Depreciation by Method
                    </h3>
                    <div className="space-y-3">
                        {(['STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION'] as const).map(
                            (method) => {
                                const methodAssets = assets.filter(
                                    (a) => a.depreciationMethod === method && a.status !== 'DISPOSED'
                                );
                                if (methodAssets.length === 0) return null;
                                const methodCost = methodAssets.reduce((s, a) => s + a.cost, 0);
                                const methodDepr = methodAssets.reduce(
                                    (s, a) => s + a.accumulatedDepreciation,
                                    0
                                );
                                const pct = methodCost > 0 ? (methodDepr / methodCost) * 100 : 0;

                                return (
                                    <div key={method} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {METHOD_LABELS[method]}{' '}
                                                <span className="text-muted-foreground/60">
                                                    ({methodAssets.length})
                                                </span>
                                            </span>
                                            <span className="font-mono">
                                                {formatCurrency(methodDepr)} / {formatCurrency(methodCost)}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-ak-bg-3 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-ak-purple to-ak-blue transition-all"
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            )}

            {/* ---- Create/Edit Sheet ---- */}
            <AssetSheet
                open={sheetOpen}
                onOpenChange={(open) => {
                    setSheetOpen(open);
                    if (!open) setEditingAsset(null);
                }}
                entityId={entityId}
                editingAsset={editingAsset}
            />

            {/* ---- Dispose Dialog ---- */}
            <Dialog open={!!disposeTarget} onOpenChange={(open) => !open && setDisposeTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-heading">
                            <AlertTriangle className="h-5 w-5 text-ak-red" />
                            Dispose Asset
                        </DialogTitle>
                        <DialogDescription>
                            Record the disposal of &quot;{disposeTarget?.name}&quot;. This action is irreversible.
                        </DialogDescription>
                    </DialogHeader>
                    {disposeTarget && (
                        <div className="space-y-4">
                            <div className="glass rounded-lg p-3 space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Cost</span>
                                    <span className="font-mono">{formatCurrency(disposeTarget.cost)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Accumulated Depreciation</span>
                                    <span className="font-mono text-ak-red">
                                        {formatCurrency(disposeTarget.accumulatedDepreciation)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm font-medium border-t border-ak-border pt-1.5">
                                    <span>Net Book Value</span>
                                    <span className="font-mono text-ak-green">
                                        {formatCurrency(disposeTarget.cost - disposeTarget.accumulatedDepreciation)}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="disposeDate">Disposal Date</Label>
                                    <Input
                                        id="disposeDate"
                                        type="date"
                                        value={disposedDate}
                                        onChange={(e) => setDisposedDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disposalAmount">Sale Amount ($)</Label>
                                    <Input
                                        id="disposalAmount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={disposalDollars}
                                        onChange={(e) => setDisposalDollars(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisposeTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDispose}
                            disabled={isDisposing}
                        >
                            {isDisposing ? 'Disposing...' : 'Dispose Asset'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ---- Delete Confirmation Dialog ---- */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-heading">
                            <Trash2 className="h-5 w-5 text-ak-red" />
                            Delete Asset
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
                            This will soft-delete the asset record.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Asset'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ---- Run Depreciation Dialog ---- */}
            <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-heading">
                            <Calendar className="h-5 w-5 text-ak-blue" />
                            Run Depreciation
                        </DialogTitle>
                        <DialogDescription>
                            Calculate and record depreciation for all active assets for the selected period.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="periodDate">Period Date</Label>
                            <Input
                                id="periodDate"
                                type="date"
                                value={runPeriodDate}
                                onChange={(e) => setRunPeriodDate(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Depreciation will be calculated up to this date.
                                Each asset can only be depreciated once per period.
                            </p>
                        </div>

                        {/* Run result */}
                        {runResult && (
                            <div className="glass rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle2 className="h-4 w-4 text-ak-green" />
                                    Depreciation Complete
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="glass-2 rounded-md p-2 text-center">
                                        <p className="text-muted-foreground">Processed</p>
                                        <p className="font-mono text-lg font-semibold text-ak-green">
                                            {runResult.processed}
                                        </p>
                                    </div>
                                    <div className="glass-2 rounded-md p-2 text-center">
                                        <p className="text-muted-foreground">Skipped</p>
                                        <p className="font-mono text-lg font-semibold text-muted-foreground">
                                            {runResult.skipped}
                                        </p>
                                    </div>
                                </div>
                                {runResult.entries.length > 0 && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {runResult.entries.map((entry) => (
                                            <div
                                                key={entry.assetId}
                                                className="flex items-center justify-between text-xs glass-2 rounded-md px-2 py-1.5"
                                            >
                                                <span className="truncate mr-2">{entry.assetName}</span>
                                                <span className="font-mono text-ak-red shrink-0">
                                                    {formatCurrency(entry.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRunDialogOpen(false)}>
                            {runResult ? 'Close' : 'Cancel'}
                        </Button>
                        {!runResult && (
                            <Button onClick={handleRunDepreciation} disabled={isRunning} className="gap-2">
                                <Play className="h-4 w-4" />
                                {isRunning ? 'Running...' : 'Run Depreciation'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ============================================================================
// AssetCard
// ============================================================================

interface AssetCardProps {
    asset: FixedAsset;
    onEdit: () => void;
    onDispose: () => void;
    onDelete: () => void;
}

function AssetCard({ asset, onEdit, onDispose, onDelete }: AssetCardProps) {
    const catConfig = CATEGORY_CONFIG[asset.category];
    const statusConfig = STATUS_CONFIG[asset.status];
    const CatIcon = catConfig.icon;

    const nbv = asset.cost - asset.accumulatedDepreciation;
    const depreciableBase = asset.cost - asset.salvageValue;
    const lifeProgress =
        depreciableBase > 0 ? (asset.accumulatedDepreciation / depreciableBase) * 100 : 0;

    // Life bar color based on health
    const lifeBarColor =
        lifeProgress >= 100
            ? 'from-ak-purple to-ak-purple'
            : lifeProgress >= 75
              ? 'from-ak-red to-ak-purple'
              : lifeProgress >= 50
                ? 'from-primary to-ak-red'
                : 'from-ak-green to-primary';

    const acquiredFormatted = new Date(asset.acquiredDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
    });

    return (
        <div className="glass rounded-xl p-4 transition-all hover:border-ak-border-2 hover:-translate-y-px group">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 w-8 h-8 rounded-lg glass-2 flex items-center justify-center">
                        <CatIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{catConfig.label}</p>
                    </div>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${statusConfig.className}`}>
                    {statusConfig.label}
                </Badge>
            </div>

            {/* Financial data */}
            <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="text-sm font-mono font-medium">{formatCurrency(asset.cost)}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">NBV</p>
                    <p className="text-sm font-mono font-medium text-ak-green">
                        {formatCurrency(nbv)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Depreciated</p>
                    <p className="text-sm font-mono font-medium text-ak-red">
                        {formatCurrency(asset.accumulatedDepreciation)}
                    </p>
                </div>
            </div>

            {/* Life bar */}
            <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{METHOD_LABELS[asset.depreciationMethod]}</span>
                    <span className="font-mono">{Math.min(lifeProgress, 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-ak-bg-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${lifeBarColor} transition-all`}
                        style={{ width: `${Math.min(lifeProgress, 100)}%` }}
                    />
                </div>
            </div>

            {/* Metadata */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Acquired {acquiredFormatted}</span>
                <span>{asset.usefulLifeMonths}mo useful life</span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs gap-1">
                    <Pencil className="h-3 w-3" />
                    Edit
                </Button>
                {asset.status === 'ACTIVE' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDispose}
                        className="h-7 text-xs gap-1 text-ak-red hover:text-ak-red"
                    >
                        <TrendingDown className="h-3 w-3" />
                        Dispose
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-ak-red ml-auto"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
