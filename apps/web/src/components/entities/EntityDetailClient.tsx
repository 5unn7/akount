'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Archive,
    Building2,
    Users,
    FileText,
    Landmark,
    Receipt,
    CreditCard,
    BookOpen,
    Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { EntityDetail, UpdateEntityInput } from '@/lib/api/entities';
import { apiFetch } from '@/lib/api/client-browser';

/** Country flag lookup */
const COUNTRY_FLAGS: Record<string, string> = {
    US: '\u{1F1FA}\u{1F1F8}',
    CA: '\u{1F1E8}\u{1F1E6}',
    IN: '\u{1F1EE}\u{1F1F3}',
    GB: '\u{1F1EC}\u{1F1E7}',
    AU: '\u{1F1E6}\u{1F1FA}',
};

const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    IN: 'India',
    GB: 'United Kingdom',
    AU: 'Australia',
};

const TYPE_LABELS: Record<string, string> = {
    PERSONAL: 'Personal',
    CORPORATION: 'Corporation',
    LLC: 'LLC',
    PARTNERSHIP: 'Partnership',
    SOLE_PROPRIETORSHIP: 'Sole Prop',
};

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Metric card item */
interface MetricItem {
    label: string;
    value: number;
    icon: React.ReactNode;
}

interface EntityDetailClientProps {
    entity: EntityDetail;
}

export function EntityDetailClient({ entity }: EntityDetailClientProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [archiveBlockers, setArchiveBlockers] = useState<string[]>([]);

    // Editable fields
    const [name, setName] = useState(entity.name);
    const [taxId, setTaxId] = useState(entity.taxId ?? '');
    const [address, setAddress] = useState(entity.address ?? '');
    const [city, setCity] = useState(entity.city ?? '');
    const [state, setState] = useState(entity.state ?? '');
    const [postalCode, setPostalCode] = useState(entity.postalCode ?? '');
    const [fiscalYearStart, setFiscalYearStart] = useState(entity.fiscalYearStart ?? 1);

    const flag = COUNTRY_FLAGS[entity.country] ?? '\u{1F30D}';
    const countryName = COUNTRY_NAMES[entity.country] ?? entity.country;

    const metrics: MetricItem[] = [
        { label: 'Accounts', value: entity._count.accounts, icon: <CreditCard className="h-4 w-4" /> },
        { label: 'GL Accounts', value: entity._count.glAccounts, icon: <Landmark className="h-4 w-4" /> },
        { label: 'Clients', value: entity._count.clients, icon: <Users className="h-4 w-4" /> },
        { label: 'Vendors', value: entity._count.vendors, icon: <Building2 className="h-4 w-4" /> },
        { label: 'Invoices', value: entity._count.invoices, icon: <FileText className="h-4 w-4" /> },
        { label: 'Bills', value: entity._count.bills, icon: <Receipt className="h-4 w-4" /> },
        { label: 'Journal Entries', value: entity._count.journalEntries, icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Payments', value: entity._count.payments, icon: <Wallet className="h-4 w-4" /> },
    ];

    const hasChanges =
        name !== entity.name ||
        taxId !== (entity.taxId ?? '') ||
        address !== (entity.address ?? '') ||
        city !== (entity.city ?? '') ||
        state !== (entity.state ?? '') ||
        postalCode !== (entity.postalCode ?? '') ||
        fiscalYearStart !== (entity.fiscalYearStart ?? 1);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setError(null);

        const updates: UpdateEntityInput = {};
        if (name !== entity.name) updates.name = name;
        if (taxId !== (entity.taxId ?? '')) updates.taxId = taxId || null;
        if (address !== (entity.address ?? '')) updates.address = address || null;
        if (city !== (entity.city ?? '')) updates.city = city || null;
        if (state !== (entity.state ?? '')) updates.state = state || null;
        if (postalCode !== (entity.postalCode ?? '')) updates.postalCode = postalCode || null;
        if (fiscalYearStart !== (entity.fiscalYearStart ?? 1)) updates.fiscalYearStart = fiscalYearStart;

        try {
            await apiFetch(`/api/system/entities/${entity.id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            });
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    }, [name, taxId, address, city, state, postalCode, fiscalYearStart, entity, router]);

    const handleArchive = useCallback(async () => {
        setIsArchiving(true);
        setArchiveError(null);
        setArchiveBlockers([]);

        try {
            const result = await apiFetch<{ success: boolean; message?: string; blockers?: string[] }>(
                `/api/system/entities/${entity.id}/archive`,
                { method: 'POST' }
            );

            if (result.success) {
                router.push('/system/entities');
                router.refresh();
            } else {
                setArchiveError(result.message ?? 'Cannot archive entity');
                setArchiveBlockers(result.blockers ?? []);
            }
        } catch (err) {
            setArchiveError(err instanceof Error ? err.message : 'Failed to archive entity');
        } finally {
            setIsArchiving(false);
        }
    }, [entity.id, router]);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Back link */}
            <Link
                href="/system/entities"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Entities
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-normal tracking-tight">
                        {entity.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {flag} {countryName} &middot; {TYPE_LABELS[entity.type] ?? entity.type}
                        {entity.entitySubType && ` \u2022 ${entity.entitySubType.replace(/_/g, ' ')}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {entity.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-ak-green-dim text-ak-green">
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-ak-bg-3 text-muted-foreground">
                            Archived
                        </span>
                    )}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            {/* Metrics row */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {metrics.map((m) => (
                    <div key={m.label} className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            {m.icon}
                            <span className="text-[10px] uppercase tracking-[0.05em] font-medium">
                                {m.label}
                            </span>
                        </div>
                        <span className="text-xl font-mono">{m.value}</span>
                    </div>
                ))}
            </div>

            {/* Detail sections */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Entity Settings */}
                <div className="glass rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-medium">Entity Settings</h3>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="entity-name" className="block text-xs text-muted-foreground mb-1">
                                Name
                            </label>
                            <input
                                id="entity-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={entity.status === 'ARCHIVED'}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                                Fiscal Year Start
                            </label>
                            <div className="flex gap-1 flex-wrap">
                                {MONTH_NAMES.map((month, i) => {
                                    const monthNum = i + 1;
                                    return (
                                        <button
                                            key={month}
                                            type="button"
                                            onClick={() => setFiscalYearStart(monthNum)}
                                            disabled={entity.status === 'ARCHIVED'}
                                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                                                fiscalYearStart === monthNum
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-input bg-background text-foreground hover:bg-ak-bg-3'
                                            } disabled:opacity-50`}
                                        >
                                            {month.slice(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Currency</span>
                            <span className="font-mono">{entity.functionalCurrency}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Created</span>
                            <span className="font-mono text-xs">
                                {new Date(entity.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Business Details */}
                <div className="glass rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-medium">Business Details</h3>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="entity-taxid" className="block text-xs text-muted-foreground mb-1">
                                Tax ID
                            </label>
                            <input
                                id="entity-taxid"
                                type="text"
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                                placeholder="e.g., 123456789"
                                disabled={entity.status === 'ARCHIVED'}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="entity-address" className="block text-xs text-muted-foreground mb-1">
                                Address
                            </label>
                            <input
                                id="entity-address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Street address"
                                disabled={entity.status === 'ARCHIVED'}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="entity-city" className="block text-xs text-muted-foreground mb-1">
                                    City
                                </label>
                                <input
                                    id="entity-city"
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    disabled={entity.status === 'ARCHIVED'}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="entity-state" className="block text-xs text-muted-foreground mb-1">
                                    State / Province
                                </label>
                                <input
                                    id="entity-state"
                                    type="text"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    disabled={entity.status === 'ARCHIVED'}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="w-1/2">
                            <label htmlFor="entity-postal" className="block text-xs text-muted-foreground mb-1">
                                Postal / ZIP Code
                            </label>
                            <input
                                id="entity-postal"
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                disabled={entity.status === 'ARCHIVED'}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {entity.status === 'ACTIVE' && (
                <div className="flex items-center justify-between pt-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50">
                                <Archive className="h-4 w-4" />
                                Archive Entity
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Archive &ldquo;{entity.name}&rdquo;?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This entity will be hidden from the active list and entity switcher.
                                    All data is preserved and can be accessed later.
                                    Entities with active accounts, unpaid invoices, or open bills cannot be archived.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {archiveError && (
                                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                                    <p>{archiveError}</p>
                                    {archiveBlockers.length > 0 && (
                                        <ul className="mt-2 list-disc list-inside text-xs">
                                            {archiveBlockers.map((b) => (
                                                <li key={b}>{b}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleArchive}
                                    disabled={isArchiving}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isArchiving ? 'Archiving...' : 'Archive'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </div>
    );
}
