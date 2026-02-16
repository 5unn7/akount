'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { type Bill } from '@/lib/api/bills';
import { CheckCircle, BookOpen, XCircle, Loader2 } from 'lucide-react';

interface BillActionsProps {
    bill: Bill;
}

export function BillActions({ bill }: BillActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleAction = async (
        action: string,
        apiCall: () => Promise<unknown>
    ) => {
        setLoading(action);
        try {
            await apiCall();
            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Action failed';
            alert(message);
        } finally {
            setLoading(null);
        }
    };

    const handleApprove = () =>
        handleAction('approve', async () => {
            const { approveBill } = await import('@/lib/api/bills');
            return approveBill(bill.id);
        });

    const handlePost = () =>
        handleAction('post', async () => {
            const { postBill } = await import('@/lib/api/bills');
            return postBill(bill.id);
        });

    const handleCancel = () =>
        handleAction('cancel', async () => {
            const { cancelBill } = await import('@/lib/api/bills');
            return cancelBill(bill.id);
        });

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
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
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
            )}
        </div>
    );
}
