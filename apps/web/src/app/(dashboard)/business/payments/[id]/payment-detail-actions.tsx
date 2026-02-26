'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
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
import { apiFetch } from '@/lib/api/client-browser';
import { toast } from 'sonner';

export function PaymentDetailActions({ paymentId }: { paymentId: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiFetch(`/api/business/payments/${paymentId}`, {
                method: 'DELETE',
            });
            toast.success('Payment deleted');
            router.push('/business/payments');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete payment');
            setDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                    disabled={deleting}
                >
                    {deleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This payment will be permanently removed. All allocations will be
                        reversed, restoring outstanding balances on associated invoices and bills.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Payment</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDelete}
                    >
                        Delete Payment
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
