'use server';

import { listInvoices, type ListInvoicesParams, type ListInvoicesResponse } from '@/lib/api/invoices';
import { listBills, type ListBillsParams, type ListBillsResponse } from '@/lib/api/bills';
import { listClients, type ListClientsParams, type ListClientsResponse } from '@/lib/api/clients';
import { listVendors, type ListVendorsParams, type ListVendorsResponse } from '@/lib/api/vendors';
import { listCreditNotes, type ListCreditNotesParams, type ListCreditNotesResponse } from '@/lib/api/credit-notes';

export async function fetchMoreInvoices(params: ListInvoicesParams): Promise<ListInvoicesResponse> {
    return listInvoices(params);
}

export async function fetchMoreBills(params: ListBillsParams): Promise<ListBillsResponse> {
    return listBills(params);
}

export async function fetchMoreClients(params: ListClientsParams): Promise<ListClientsResponse> {
    return listClients(params);
}

export async function fetchMoreVendors(params: ListVendorsParams): Promise<ListVendorsResponse> {
    return listVendors(params);
}

export async function fetchMoreCreditNotes(params: ListCreditNotesParams): Promise<ListCreditNotesResponse> {
    return listCreditNotes(params);
}
