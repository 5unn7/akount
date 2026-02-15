'use client';

import { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Plus,
    Pencil,
    Power,
    Sprout,
    ListTree,
    Loader2,
} from 'lucide-react';
import type {
    GLAccount,
    GLAccountBalance,
    GLAccountType,
    NormalBalance,
    CreateGLAccountInput,
    UpdateGLAccountInput,
} from '@/lib/api/accounting';
import { formatAmount } from '@/lib/api/accounting';
import type { Entity } from '@/lib/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    createGLAccountAction,
    updateGLAccountAction,
    deactivateGLAccountAction,
    seedDefaultCOAAction,
} from './actions';

// ============================================================================
// Types
// ============================================================================

interface AccountNode extends GLAccount {
    children: AccountNode[];
    balance?: number; // from balances lookup
}

interface ChartOfAccountsClientProps {
    accounts: GLAccount[];
    balances: GLAccountBalance[];
    entities: Entity[];
    selectedEntityId: string;
}

// ============================================================================
// Helpers
// ============================================================================

const ACCOUNT_TYPE_LABELS: Record<GLAccountType, string> = {
    ASSET: 'Asset',
    LIABILITY: 'Liability',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expense',
};

const ACCOUNT_TYPE_COLORS: Record<GLAccountType, string> = {
    ASSET: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    LIABILITY: 'bg-red-500/15 text-red-400 border-red-500/20',
    EQUITY: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    REVENUE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    EXPENSE: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

function buildTree(
    accounts: GLAccount[],
    balances: GLAccountBalance[]
): AccountNode[] {
    const balanceMap = new Map(balances.map((b) => [b.accountId, b.balance]));
    const nodeMap = new Map<string, AccountNode>();
    const roots: AccountNode[] = [];

    // Create nodes
    for (const account of accounts) {
        nodeMap.set(account.id, {
            ...account,
            children: [],
            balance: balanceMap.get(account.id) ?? 0,
        });
    }

    // Build hierarchy
    for (const node of Array.from(nodeMap.values())) {
        if (node.parentAccountId && nodeMap.has(node.parentAccountId)) {
            nodeMap.get(node.parentAccountId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

// ============================================================================
// Account Row (recursive tree)
// ============================================================================

function AccountRow({
    node,
    depth,
    onEdit,
    onDeactivate,
}: {
    node: AccountNode;
    depth: number;
    onEdit: (account: GLAccount) => void;
    onDeactivate: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(depth < 1);
    const hasChildren = node.children.length > 0;

    return (
        <>
            <tr
                className={`group border-b border-ak-border hover:bg-ak-bg-3 transition-colors ${
                    !node.isActive ? 'opacity-50' : ''
                }`}
            >
                {/* Code + expand */}
                <td className="px-4 py-3 font-mono text-sm">
                    <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${depth * 20}px` }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="p-0.5 rounded hover:bg-ak-bg-3"
                            >
                                {expanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                            </button>
                        ) : (
                            <span className="w-[18px]" />
                        )}
                        {node.code}
                    </div>
                </td>

                {/* Name */}
                <td className="px-4 py-3 text-sm">{node.name}</td>

                {/* Type */}
                <td className="px-4 py-3">
                    <span
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            ACCOUNT_TYPE_COLORS[node.type]
                        }`}
                    >
                        {ACCOUNT_TYPE_LABELS[node.type]}
                    </span>
                </td>

                {/* Normal Balance */}
                <td className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                    {node.normalBalance}
                </td>

                {/* Balance */}
                <td className="px-4 py-3 text-right font-mono text-sm">
                    {formatAmount(node.balance ?? 0)}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                    {node.isActive ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                    ) : (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(node)}
                            className="p-1.5 rounded-md hover:bg-ak-bg-3 text-muted-foreground hover:text-foreground"
                            title="Edit"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {node.isActive && (
                            <button
                                onClick={() => onDeactivate(node.id)}
                                className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                title="Deactivate"
                            >
                                <Power className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </td>
            </tr>

            {expanded &&
                node.children.map((child) => (
                    <AccountRow
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                        onEdit={onEdit}
                        onDeactivate={onDeactivate}
                    />
                ))}
        </>
    );
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
    const entity = entities.find((e) => e.id === entityId);

    // Filter accounts
    const filtered =
        filterType === 'all'
            ? accounts
            : accounts.filter((a) => a.type === filterType);

    const tree = buildTree(filtered, balances);

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
            }
            setSheetOpen(false);
            setActionError(null);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Failed to save GL account');
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
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Failed to deactivate account');
        }
    }

    async function handleSeedCOA() {
        setIsSeeding(true);
        setSeedMessage(null);
        try {
            const result = await seedDefaultCOAAction(entityId);
            if (result.skipped) {
                setSeedMessage('COA already exists — seed skipped.');
            } else {
                setSeedMessage(`Created ${result.created} accounts.`);
                // Refresh — refetch via server action
                window.location.reload();
            }
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Failed to seed chart of accounts');
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

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
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
                            <tr className="border-b border-ak-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
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
                            {tree.map((node) => (
                                <AccountRow
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                    onEdit={openEditSheet}
                                    onDeactivate={handleDeactivate}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-md bg-card border-ak-border">
                    <SheetHeader>
                        <SheetTitle>
                            {editingAccount ? 'Edit Account' : 'Add Account'}
                        </SheetTitle>
                        <SheetDescription>
                            {editingAccount
                                ? `Editing ${editingAccount.code} — ${editingAccount.name}`
                                : 'Create a new GL account in the chart of accounts.'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-4">
                        {/* Code (readonly on edit) */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Account Code
                            </Label>
                            <Input
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value)}
                                disabled={!!editingAccount}
                                placeholder="1000"
                                className="rounded-lg border-ak-border-2 glass"
                            />
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Account Name
                            </Label>
                            <Input
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Cash"
                                className="rounded-lg border-ak-border-2 glass"
                            />
                        </div>

                        {/* Type (disabled on edit) */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Account Type
                            </Label>
                            <Select
                                value={formType}
                                onValueChange={(v) => setFormType(v as GLAccountType)}
                                disabled={!!editingAccount}
                            >
                                <SelectTrigger className="rounded-lg border-ak-border-2 glass">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ASSET">Asset</SelectItem>
                                    <SelectItem value="LIABILITY">Liability</SelectItem>
                                    <SelectItem value="EQUITY">Equity</SelectItem>
                                    <SelectItem value="REVENUE">Revenue</SelectItem>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Normal Balance (disabled on edit) */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Normal Balance
                            </Label>
                            <Select
                                value={formNormalBalance}
                                onValueChange={(v) => setFormNormalBalance(v as NormalBalance)}
                                disabled={!!editingAccount}
                            >
                                <SelectTrigger className="rounded-lg border-ak-border-2 glass">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DEBIT">Debit</SelectItem>
                                    <SelectItem value="CREDIT">Credit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Parent Account */}
                        {!editingAccount && (
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Parent Account (optional)
                                </Label>
                                <Select value={formParentId} onValueChange={setFormParentId}>
                                    <SelectTrigger className="rounded-lg border-ak-border-2 glass">
                                        <SelectValue placeholder="None (top-level)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None (top-level)</SelectItem>
                                        {parentCandidates.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.code} — {a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Description (optional)
                            </Label>
                            <Input
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Account description"
                                className="rounded-lg border-ak-border-2 glass"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            className="w-full rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium mt-4"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formCode || !formName}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {editingAccount ? 'Save Changes' : 'Create Account'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
