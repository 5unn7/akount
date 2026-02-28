'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Sprout,
    ListTree,
    Loader2,
    Search,
} from 'lucide-react';
import type {
    GLAccount,
    GLAccountBalance,
    GLAccountType,
    NormalBalance,
    CreateGLAccountInput,
    UpdateGLAccountInput,
} from '@/lib/api/accounting';
import type { Entity } from '@/lib/api/entities';
import { formatCurrency } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    createGLAccountAction,
    updateGLAccountAction,
    deactivateGLAccountAction,
    reactivateGLAccountAction,
    seedDefaultCOAAction,
    fetchGLAccounts,
    fetchAccountBalances,
} from './actions';
import { AccountRow, GroupHeaderRow, buildTree, buildGroupedTree, type AccountNode } from './account-row';
import { GLAccountSheet } from './gl-account-sheet';

// ============================================================================
// Types
// ============================================================================

interface ChartOfAccountsClientProps {
    accounts: GLAccount[];
    balances: GLAccountBalance[];
    entities: Entity[];
    selectedEntityId: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function ChartOfAccountsClient({
    accounts: initialAccounts,
    balances: initialBalances,
    entities,
    selectedEntityId,
}: ChartOfAccountsClientProps) {
    const [accounts, setAccounts] = useState(initialAccounts);
    const [balances, setBalances] = useState(initialBalances);
    const [filterType, setFilterType] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<GLAccount | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedMessage, setSeedMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Form state
    const [formCode, setFormCode] = useState('');
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState<GLAccountType>('ASSET');
    const [formNormalBalance, setFormNormalBalance] = useState<NormalBalance>('DEBIT');
    const [formDescription, setFormDescription] = useState('');
    const [formParentId, setFormParentId] = useState<string>('');

    const entityId = selectedEntityId;

    // Debounced search - refetch when search or filterType changes
    useEffect(() => {
        const timer = setTimeout(async () => {
            const params: { entityId: string; search?: string; type?: string } = { entityId };
            if (search) params.search = search;
            if (filterType !== 'all') params.type = filterType;

            try {
                const newAccounts = await fetchGLAccounts(params);
                setAccounts(newAccounts);
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [search, filterType, entityId]);

    // Filter accounts (client-side filtering is now redundant since backend does it)
    const filtered = accounts;

    const grouped = buildGroupedTree(filtered, balances);

    function openAddSheet() {
        setEditingAccount(null);
        setFormCode('');
        setFormName('');
        setFormType('ASSET');
        setFormNormalBalance('DEBIT');
        setFormDescription('');
        setFormParentId('');
        setSheetOpen(true);
    }

    function openEditSheet(account: GLAccount) {
        setEditingAccount(account);
        setFormCode(account.code);
        setFormName(account.name);
        setFormType(account.type);
        setFormNormalBalance(account.normalBalance);
        setFormDescription(account.description ?? '');
        setFormParentId(account.parentAccountId ?? '');
        setSheetOpen(true);
    }

    async function handleSubmit() {
        setIsSubmitting(true);
        try {
            if (editingAccount) {
                const input: UpdateGLAccountInput = {
                    name: formName,
                    description: formDescription || null,
                };
                const updated = await updateGLAccountAction(editingAccount.id, input);
                setAccounts((prev) =>
                    prev.map((a) => (a.id === updated.id ? updated : a))
                );
                toast.success('Account updated');
            } else {
                const input: CreateGLAccountInput = {
                    entityId,
                    code: formCode,
                    name: formName,
                    type: formType,
                    normalBalance: formNormalBalance,
                    description: formDescription || undefined,
                    parentAccountId: formParentId || undefined,
                };
                const created = await createGLAccountAction(input);
                setAccounts((prev) => [...prev, created]);
                toast.success('Account created');
            }
            setSheetOpen(false);
            setActionError(null);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to save GL account';
            toast.error(msg);
            setActionError(msg);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeactivate(id: string) {
        try {
            const updated = await deactivateGLAccountAction(id);
            setAccounts((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
            );
            toast.success('Account deactivated');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to deactivate account';
            toast.error(msg);
            setActionError(msg);
        }
    }

    async function handleReactivate(id: string) {
        try {
            const updated = await reactivateGLAccountAction(id);
            setAccounts((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
            );
            toast.success('Account reactivated');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to reactivate account';
            toast.error(msg);
            setActionError(msg);
        }
    }

    async function handleSeedCOA() {
        setIsSeeding(true);
        setSeedMessage(null);
        try {
            const result = await seedDefaultCOAAction(entityId);
            if (result.skipped) {
                setSeedMessage('COA already exists — seed skipped.');
                toast.info('Chart of accounts already exists');
            } else {
                setSeedMessage(`Created ${result.created} accounts.`);
                toast.success(`Created ${result.created} accounts`);
                // Refetch accounts and balances to update UI without page reload
                const [newAccounts, newBalances] = await Promise.all([
                    fetchGLAccounts({ entityId }),
                    fetchAccountBalances(entityId).catch(() => []),
                ]);
                setAccounts(newAccounts);
                setBalances(newBalances);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to seed chart of accounts';
            toast.error(msg);
            setActionError(msg);
        } finally {
            setIsSeeding(false);
        }
    }

    // Parent account candidates (active, same type for hierarchy)
    const parentCandidates = accounts.filter(
        (a) => a.isActive && a.id !== editingAccount?.id
    );

    // Empty state
    if (accounts.length === 0) {
        return (
            <Card className="glass rounded-[14px]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-primary/10 mb-4">
                        <ListTree className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-heading font-normal mb-2">
                        No accounts yet
                    </p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        Seed a default chart of accounts to get started, or add accounts manually.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                            onClick={handleSeedCOA}
                            disabled={isSeeding}
                        >
                            {isSeeding ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Sprout className="h-4 w-4 mr-2" />
                            )}
                            Seed Default COA
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-lg border-ak-border-2"
                            onClick={openAddSheet}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Account
                        </Button>
                    </div>
                    {seedMessage && (
                        <p className="mt-4 text-sm text-muted-foreground">{seedMessage}</p>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Compute balance totals from grouped data
    const balanceTotals = {
        assets: grouped.find((g) => g.type === 'ASSET')?.totalBalance ?? 0,
        liabilities: grouped.find((g) => g.type === 'LIABILITY')?.totalBalance ?? 0,
        equity: grouped.find((g) => g.type === 'EQUITY')?.totalBalance ?? 0,
        revenue: grouped.find((g) => g.type === 'REVENUE')?.totalBalance ?? 0,
        expenses: grouped.find((g) => g.type === 'EXPENSE')?.totalBalance ?? 0,
    };

    return (
        <div className="space-y-4">
            {/* Balance Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-4">
                    <p className="text-micro uppercase tracking-wider text-muted-foreground mb-1">Total Assets</p>
                    <p className="text-xl font-mono font-semibold text-ak-green">{formatCurrency(balanceTotals.assets)}</p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-micro uppercase tracking-wider text-muted-foreground mb-1">Total Liabilities</p>
                    <p className="text-xl font-mono font-semibold text-ak-red">{formatCurrency(balanceTotals.liabilities)}</p>
                </div>
                <div className="glass rounded-xl p-4">
                    <p className="text-micro uppercase tracking-wider text-muted-foreground mb-1">Total Equity</p>
                    <p className="text-xl font-mono font-semibold text-ak-blue">{formatCurrency(balanceTotals.equity)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by code or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-lg border-ak-border-2 glass"
                    />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40 rounded-lg border-ak-border-2 glass">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="ASSET">Asset</SelectItem>
                        <SelectItem value="LIABILITY">Liability</SelectItem>
                        <SelectItem value="EQUITY">Equity</SelectItem>
                        <SelectItem value="REVENUE">Revenue</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex-1" />

                <Button
                    variant="outline"
                    className="rounded-lg border-ak-border-2"
                    onClick={handleSeedCOA}
                    disabled={isSeeding}
                >
                    {isSeeding ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Sprout className="h-4 w-4 mr-2" />
                    )}
                    Seed Defaults
                </Button>

                <Button
                    className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                    onClick={openAddSheet}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                </Button>
            </div>

            {seedMessage && (
                <p className="text-sm text-muted-foreground">{seedMessage}</p>
            )}

            {actionError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
                    <span>{actionError}</span>
                    <button
                        onClick={() => setActionError(null)}
                        className="text-red-400/60 hover:text-red-400 text-xs ml-4"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Table */}
            <Card className="glass rounded-[14px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-ak-border text-left text-micro uppercase tracking-wider text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Code</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Normal</th>
                                <th className="px-4 py-3 font-medium text-right">Balance</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium w-20" />
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.map((group) => (
                                <GroupedSection
                                    key={group.type}
                                    type={group.type}
                                    nodes={group.nodes}
                                    totalBalance={group.totalBalance}
                                    onEdit={openEditSheet}
                                    onDeactivate={handleDeactivate}
                                    onReactivate={handleReactivate}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Sheet */}
            <GLAccountSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                editingAccount={editingAccount}
                parentCandidates={parentCandidates}
                formCode={formCode}
                setFormCode={setFormCode}
                formName={formName}
                setFormName={setFormName}
                formType={formType}
                setFormType={setFormType}
                formNormalBalance={formNormalBalance}
                setFormNormalBalance={setFormNormalBalance}
                formDescription={formDescription}
                setFormDescription={setFormDescription}
                formParentId={formParentId}
                setFormParentId={setFormParentId}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

// ============================================================================
// GroupedSection — renders a group header + account rows for one type
// ============================================================================

function GroupedSection({
    type,
    nodes,
    totalBalance,
    onEdit,
    onDeactivate,
    onReactivate,
}: {
    type: GLAccountType;
    nodes: AccountNode[];
    totalBalance: number;
    onEdit: (account: GLAccount) => void;
    onDeactivate: (id: string) => void;
    onReactivate: (id: string) => void;
}) {
    return (
        <>
            <GroupHeaderRow type={type} totalBalance={totalBalance} />
            {nodes.map((node, idx) => (
                <AccountRow
                    key={node.id}
                    node={node}
                    depth={0}
                    isLast={idx === nodes.length - 1}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onReactivate={onReactivate}
                />
            ))}
        </>
    );
}
