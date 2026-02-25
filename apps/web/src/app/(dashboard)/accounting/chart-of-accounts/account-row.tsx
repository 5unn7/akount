'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Pencil, Power, PowerOff } from 'lucide-react';
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
import type { GLAccount, GLAccountType, GLAccountBalance } from '@/lib/api/accounting';
import { formatCurrency } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Types
// ============================================================================

export interface AccountNode extends GLAccount {
    children: AccountNode[];
    balance?: number;
}

// ============================================================================
// Helpers
// ============================================================================

const ACCOUNT_TYPE_LABELS: Record<GLAccountType, string> = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses',
};

const ACCOUNT_TYPE_BADGE_LABELS: Record<GLAccountType, string> = {
    ASSET: 'Asset',
    LIABILITY: 'Liability',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expense',
};

const ACCOUNT_TYPE_COLORS: Record<GLAccountType, string> = {
    ASSET: 'bg-ak-green-dim text-ak-green border-ak-green/20',
    LIABILITY: 'bg-ak-red-dim text-ak-red border-ak-red/20',
    EQUITY: 'bg-ak-blue-dim text-ak-blue border-ak-blue/20',
    REVENUE: 'bg-ak-teal-dim text-ak-teal border-ak-teal/20',
    EXPENSE: 'bg-ak-pri-dim text-primary border-primary/20',
};

const GROUP_HEADER_COLORS: Record<GLAccountType, string> = {
    ASSET: 'text-ak-green',
    LIABILITY: 'text-ak-red',
    EQUITY: 'text-ak-blue',
    REVENUE: 'text-ak-teal',
    EXPENSE: 'text-primary',
};

const GROUP_HEADER_BORDER: Record<GLAccountType, string> = {
    ASSET: 'border-ak-green/20',
    LIABILITY: 'border-ak-red/20',
    EQUITY: 'border-ak-blue/20',
    REVENUE: 'border-ak-teal/20',
    EXPENSE: 'border-primary/20',
};

/** Group order for display — standard accounting order */
const TYPE_ORDER: GLAccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export interface AccountGroup {
    type: GLAccountType;
    nodes: AccountNode[];
    totalBalance: number;
}

export function buildTree(
    accounts: GLAccount[],
    balances: GLAccountBalance[]
): AccountNode[] {
    const balanceMap = new Map(balances.map((b) => [b.accountId, b.balance]));
    const nodeMap = new Map<string, AccountNode>();
    const roots: AccountNode[] = [];

    for (const account of accounts) {
        nodeMap.set(account.id, {
            ...account,
            children: [],
            balance: balanceMap.get(account.id) ?? 0,
        });
    }

    for (const node of Array.from(nodeMap.values())) {
        if (node.parentAccountId && nodeMap.has(node.parentAccountId)) {
            nodeMap.get(node.parentAccountId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

/** Build tree grouped by account type with subtotals */
export function buildGroupedTree(
    accounts: GLAccount[],
    balances: GLAccountBalance[]
): AccountGroup[] {
    const allNodes = buildTree(accounts, balances);
    const groups: AccountGroup[] = [];

    for (const type of TYPE_ORDER) {
        const nodes = allNodes.filter((n) => n.type === type);
        if (nodes.length === 0) continue;

        const sumBalance = (nodeList: AccountNode[]): number =>
            nodeList.reduce(
                (sum, n) => sum + (n.balance ?? 0) + sumBalance(n.children),
                0
            );

        groups.push({
            type,
            nodes,
            totalBalance: sumBalance(nodes),
        });
    }

    return groups;
}

// ============================================================================
// Group Header Row (colored by account type)
// ============================================================================

export function GroupHeaderRow({
    type,
    totalBalance,
}: {
    type: GLAccountType;
    totalBalance: number;
}) {
    return (
        <tr className={`border-b ${GROUP_HEADER_BORDER[type]} bg-ak-bg-3/50`}>
            <td
                colSpan={5}
                className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${GROUP_HEADER_COLORS[type]}`}
            >
                {ACCOUNT_TYPE_LABELS[type]}
            </td>
            <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${GROUP_HEADER_COLORS[type]}`}>
                {formatCurrency(totalBalance)}
            </td>
            <td className="px-4 py-2.5" />
        </tr>
    );
}

// ============================================================================
// Account Row (recursive tree with connector lines)
// ============================================================================

export function AccountRow({
    node,
    depth,
    isLast,
    onEdit,
    onDeactivate,
    onReactivate,
}: {
    node: AccountNode;
    depth: number;
    isLast: boolean;
    onEdit: (account: GLAccount) => void;
    onDeactivate: (id: string) => void;
    onReactivate: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(depth < 1);
    const hasChildren = node.children.length > 0;
    const balance = node.balance ?? 0;

    return (
        <>
            <tr
                className={`group border-b border-ak-border hover:bg-ak-bg-3 transition-colors ${
                    !node.isActive ? 'opacity-50' : ''
                }`}
            >
                <td className="px-4 py-3 font-mono text-sm">
                    <div className="flex items-center gap-1">
                        {/* Tree connector lines */}
                        {depth > 0 && (
                            <span
                                className="inline-flex items-center text-ak-border-3 select-none"
                                style={{ width: `${depth * 20}px`, justifyContent: 'flex-end' }}
                            >
                                <span className="text-xs font-mono leading-none">
                                    {isLast ? '└' : '├'}
                                </span>
                                <span className="text-xs font-mono leading-none">─</span>
                            </span>
                        )}
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

                <td className="px-4 py-3 text-sm">{node.name}</td>

                <td className="px-4 py-3">
                    <span
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-micro font-semibold uppercase tracking-wider ${
                            ACCOUNT_TYPE_COLORS[node.type]
                        }`}
                    >
                        {ACCOUNT_TYPE_BADGE_LABELS[node.type]}
                    </span>
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                    {node.normalBalance}
                </td>

                <td className={`px-4 py-3 text-right font-mono text-sm ${
                    balance > 0 ? 'text-ak-green' : balance < 0 ? 'text-ak-red' : 'text-muted-foreground'
                }`}>
                    {formatCurrency(balance)}
                </td>

                <td className="px-4 py-3">
                    {node.isActive ? (
                        <Badge variant="success" className="text-micro">Active</Badge>
                    ) : (
                        <Badge variant="secondary" className="text-micro">Inactive</Badge>
                    )}
                </td>

                <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(node)}
                            className="p-1.5 rounded-md hover:bg-ak-bg-3 text-muted-foreground hover:text-foreground"
                            title="Edit"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {node.isActive ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                        title="Deactivate"
                                    >
                                        <Power className="h-3.5 w-3.5" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            &ldquo;{node.code} &mdash; {node.name}&rdquo; will be deactivated.
                                            The account and its history will be preserved but hidden from selection.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => onDeactivate(node.id)}
                                        >
                                            Deactivate
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="p-1.5 rounded-md hover:bg-ak-green/10 text-muted-foreground hover:text-ak-green"
                                        title="Reactivate"
                                    >
                                        <PowerOff className="h-3.5 w-3.5" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reactivate account?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            &ldquo;{node.code} &mdash; {node.name}&rdquo; will be reactivated
                                            and available for selection again.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-ak-green text-black hover:bg-ak-green/90"
                                            onClick={() => onReactivate(node.id)}
                                        >
                                            Reactivate
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </td>
            </tr>

            {expanded &&
                node.children.map((child, idx) => (
                    <AccountRow
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                        isLast={idx === node.children.length - 1}
                        onEdit={onEdit}
                        onDeactivate={onDeactivate}
                        onReactivate={onReactivate}
                    />
                ))}
        </>
    );
}
