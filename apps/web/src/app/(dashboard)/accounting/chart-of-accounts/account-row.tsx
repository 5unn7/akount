'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Pencil, Power } from 'lucide-react';
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
import { formatAmount } from '@/lib/api/transactions.types';
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
    ASSET: 'Asset',
    LIABILITY: 'Liability',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expense',
};

const ACCOUNT_TYPE_COLORS: Record<GLAccountType, string> = {
    ASSET: 'bg-ak-blue-dim text-ak-blue border-ak-blue/20',
    LIABILITY: 'bg-ak-red-dim text-ak-red border-ak-red/20',
    EQUITY: 'bg-ak-purple-dim text-ak-purple border-ak-purple/20',
    REVENUE: 'bg-ak-green-dim text-ak-green border-ak-green/20',
    EXPENSE: 'bg-ak-pri-dim text-primary border-primary/20',
};

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

// ============================================================================
// Account Row (recursive tree)
// ============================================================================

export function AccountRow({
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

                <td className="px-4 py-3 text-sm">{node.name}</td>

                <td className="px-4 py-3">
                    <span
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-micro font-semibold uppercase tracking-wider ${
                            ACCOUNT_TYPE_COLORS[node.type]
                        }`}
                    >
                        {ACCOUNT_TYPE_LABELS[node.type]}
                    </span>
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                    {node.normalBalance}
                </td>

                <td className="px-4 py-3 text-right font-mono text-sm">
                    {formatAmount(node.balance ?? 0)}
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
                        {node.isActive && (
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
