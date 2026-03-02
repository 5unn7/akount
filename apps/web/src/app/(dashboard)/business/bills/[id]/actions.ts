'use server';

import { approveBill, postBill, cancelBill, deleteBill } from '@/lib/api/bills';

export async function approveBillAction(id: string) {
    return approveBill(id);
}

export async function postBillAction(id: string) {
    return postBill(id);
}

export async function cancelBillAction(id: string) {
    return cancelBill(id);
}

export async function deleteBillAction(id: string) {
    return deleteBill(id);
}
