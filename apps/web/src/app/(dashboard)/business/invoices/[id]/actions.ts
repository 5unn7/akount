'use server';

import { sendInvoice, postInvoice, cancelInvoice, voidInvoice, deleteInvoice } from '@/lib/api/invoices';

export async function sendInvoiceAction(id: string) {
    return sendInvoice(id);
}

export async function postInvoiceAction(id: string) {
    return postInvoice(id);
}

export async function cancelInvoiceAction(id: string) {
    return cancelInvoice(id);
}

export async function voidInvoiceAction(id: string) {
    return voidInvoice(id);
}

export async function deleteInvoiceAction(id: string) {
    return deleteInvoice(id);
}
