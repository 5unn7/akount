'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InvoiceForm } from './InvoiceForm';
import { BillForm } from './BillForm';
import { PaymentForm } from './PaymentForm';
import { Plus, FileText, Receipt, CreditCard } from 'lucide-react';

interface InvoicingActionsProps {
  clients: Array<{ id: string; name: string }>;
  vendors: Array<{ id: string; name: string }>;
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
