'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Receipt, CreditCard } from 'lucide-react';

const InvoiceForm = dynamic(
    () => import('./InvoiceForm').then(m => m.InvoiceForm),
    { ssr: false }
);
const BillForm = dynamic(
    () => import('./BillForm').then(m => m.BillForm),
    { ssr: false }
);
const PaymentForm = dynamic(
    () => import('./PaymentForm').then(m => m.PaymentForm),
    { ssr: false }
);

interface InvoicingActionsProps {
  clients: Array<{ id: string; name: string; paymentTerms?: string | null }>;
  vendors: Array<{ id: string; name: string; paymentTerms?: string | null }>;
}

export function InvoicingActions({ clients, vendors }: InvoicingActionsProps) {
  const router = useRouter();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setInvoiceOpen(true)}
          className="gap-1.5"
        >
          <FileText className="h-4 w-4" />
          New Invoice
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setBillOpen(true)}
          className="gap-1.5"
        >
          <Receipt className="h-4 w-4" />
          New Bill
        </Button>
        <Button
          size="sm"
          onClick={() => setPaymentOpen(true)}
          className="gap-1.5"
        >
          <CreditCard className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <InvoiceForm
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        clients={clients}
        onSuccess={handleSuccess}
      />
      <BillForm
        open={billOpen}
        onOpenChange={setBillOpen}
        vendors={vendors}
        onSuccess={handleSuccess}
      />
      <PaymentForm
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        clients={clients}
        vendors={vendors}
        onSuccess={handleSuccess}
      />
    </>
  );
}
