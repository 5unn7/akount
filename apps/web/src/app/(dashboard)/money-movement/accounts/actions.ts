'use server';

import { revalidatePath } from 'next/cache';
import {
    createAccount,
    updateAccount,
    deleteAccount,
    type CreateAccountInput,
    type UpdateAccountInput,
} from '@/lib/api/accounts';

export async function createAccountAction(input: CreateAccountInput) {
    const account = await createAccount(input);
    revalidatePath('/money-movement/accounts');
    return account;
}

export async function updateAccountAction(id: string, input: UpdateAccountInput) {
    const account = await updateAccount(id, input);
    revalidatePath('/money-movement/accounts');
    return account;
}

export async function deleteAccountAction(id: string) {
    await deleteAccount(id);
    revalidatePath('/money-movement/accounts');
}
