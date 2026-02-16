import type { Metadata } from 'next';
import { listPayments } from '@/lib/api/payments';
import { PaymentTable } from '@/components/business/PaymentTable';

export const metadata: Metadata = {
    title: 'Payments | Akount',
    description: 'Track incoming and outgoing payments',
};

export default async function PaymentsPage() {
    const result = await listPayments({ limit: 50 });

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-heading font-normal">Payments</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Track customer receipts and vendor payments
                </p>
            </div>

            {/* Payment Table */}
            <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                    {result.data.length} payment{result.data.length !== 1 ? 's' : ''} shown
                </p>
                <PaymentTable payments={result.data} />
            </div>
        </div>
    );
}
