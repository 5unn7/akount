'use server';

import {
  createTransfer,
  listTransfers,
  type CreateTransferInput,
  type ListTransfersParams,
} from '@/lib/api/transfers';

export async function createTransferAction(input: CreateTransferInput) {
  return createTransfer(input);
}

export async function listTransfersAction(params: ListTransfersParams) {
  return listTransfers(params);
}
