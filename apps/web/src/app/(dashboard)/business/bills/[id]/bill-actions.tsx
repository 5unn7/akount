'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import type { Bill } from '@/lib/api/bills';
import { approveBillAction, postBillAction, cancelBillAction, deleteBillAction } from './actions';
import { CheckCircle, BookOpen, XCircle, Loader2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BillForm } from '@/components/business/BillForm';

interface BillActionsProps {
    bill: Bill;
    vendors: Array<{ id: string; name: string; paymentTerms?: string | null }>;
}

export function BillActions({ bill, vendors }: BillActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [journalEntryId, setJournalEntryId] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    const ACTION_LABELS: Record<string, string> = {
        approve: 'Bill approved',
        post: 'Bill posted to GL',
        cancel: 'Bill cancelled',
        delete: 'Bill deleted',
    };

    const handleAction = async (
        action: string,
        apiCall: () => Promise<unknown>
    ) => {
        setLoading(action);
        try {
            const result = await apiCall();
            toast.success(ACTION_LABELS[action] ?? 'Action completed');

            // If posting to GL, capture journal entry ID
            if (action === 'post' && result && typeof result === 'object' && 'id' in result) {
                setJournalEntryId(result.id as string);
            }

            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Action failed';
            toast.error(message);
        } finally {
            setLoading(null);
        }
    };

    const handleApprove = () =>
        handleAction('approve', () => approveBillAction(bill.id));

    const handlePost = () =>
        handleAction('post', () => postBillAction(bill.id));

    const handleCancel = () =>
        handleAction('cancel', () => cancelBillAction(bill.id));

    const handleDelete = async () => {
        setLoading('delete');
        try {
            await deleteBillAction(bill.id);
            toast.success('Bill deleted');
            router.push('/business/bills');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete bill';
            toast.error(message);
            setLoading(null);
        }
    };

    const canEdit = bill.status === 'DRAFT';
    const canApprove = bill.status === 'DRAFT';
    const canPost = !['CANCELLED', 'DRAFT'].includes(bill.status);
    const canCancel = ['DRAFT', 'PENDING'].includes(bill.status);
    const canDelete = ['DRAFT', 'CANCELLED'].includes(bill.status);

    return (
        <div className="flex gap-2">
            {canEdit && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditOpen(true)}
                    disabled={loading !== null}
                    className="gap-1.5"
                >
                    <Pencil className="h-4 w-4" />
                    Edit
                </Button>
            )}
            {canApprove && (
                <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={loading !== null}
                    className="gap-1.5"
                >
                    {loading === 'approve' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle className="h-4 w-4" />
                    )}
                    Approve
                </Button>
            )}
            {canPost && !journalEntryId && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePost}
                    disabled={loading !== null}
                    className="gap-1.5"
                >
                    {loading === 'post' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <BookOpen className="h-4 w-4" />
                    )}
                    Post to GL
                </Button>
            )}
            {journalEntryId && (
                <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="gap-1.5 text-emerald-400 hover:text-emerald-300"
                >
                    <Link href={`/accounting/journal-entries/${journalEntryId}`}>
                        <ExternalLink className="h-4 w-4" />
                        View Journal Entry
                    </Link>
                </Button>
            )}
            {canCancel && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={loading !== null}
                            className="gap-1.5 text-ak-red hover:text-ak-red"
                        >
                            {loading === 'cancel' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            Cancel
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this bill?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This bill will be marked as cancelled.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Bill</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleCancel}
                            >
                                Cancel Bill
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={loading !== null}
                            className="gap-1.5 text-ak-red hover:text-ak-red"
                        >
                            {loading === 'delete' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This bill will be permanently removed.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Bill</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDelete}
                            >
                                Delete Bill
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {canEdit && (
                <BillForm
                    key={bill.id}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    vendors={vendors}
                    editBill={bill}
                    onSuccess={() => router.refresh()}
                />
            )}
        </div>
    );
}
