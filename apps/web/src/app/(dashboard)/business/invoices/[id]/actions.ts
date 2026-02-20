'use server';

import { sendInvoice, postInvoice, cancelInvoice } from '@/lib/api/invoices';

export async function sendInvoiceAction(id: string) {
    return sendInvoice(id);
}

export async function postInvoiceAction(id: string) {
    return postInvoice(id);
}

export async function cancelInvoiceAction(id: string) {
    return cancelInvoice(id);
}
