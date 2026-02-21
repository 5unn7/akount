'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { approveBillAction, postBillAction, cancelBillAction } from './actions';
import { CheckCircle, BookOpen, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BillActionsProps {
    bill: Bill;
}

export function BillActions({ bill }: BillActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const ACTION_LABELS: Record<string, string> = {
        approve: 'Bill approved',
        post: 'Bill posted to GL',
        cancel: 'Bill cancelled',
    };

    const handleAction = async (
        action: string,
        apiCall: () => Promise<unknown>
    ) => {
        setLoading(action);
        try {
            await apiCall();
            toast.success(ACTION_LABELS[action] ?? 'Action completed');
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

    const canApprove = bill.status === 'DRAFT';
    const canPost = !['CANCELLED', 'DRAFT'].includes(bill.status);
    const canCancel = ['DRAFT', 'PENDING'].includes(bill.status);

    return (
        <div className="flex gap-2">
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
            {canPost && (
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
        </div>
    );
}
