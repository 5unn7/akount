'use server';

import { revalidatePath } from 'next/cache';
import {
    createAccount,
    updateAccount,
    deleteAccount,
    type CreateAccountInput,
    type UpdateAccountInput,
    type Account,
} from '@/lib/api/accounts';

export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function createAccountAction(
    input: CreateAccountInput
): Promise<ActionResult<Account>> {
    try {
        const account = await createAccount(input);
        revalidatePath('/banking/accounts');
        return { success: true, data: account };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to create account',
        };
    }
}

export async function updateAccountAction(
    id: string,
    input: UpdateAccountInput
): Promise<ActionResult<Account>> {
    try {
        const account = await updateAccount(id, input);
        revalidatePath('/banking/accounts');
        return { success: true, data: account };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to update account',
        };
    }
}

export async function deleteAccountAction(
    id: string
): Promise<ActionResult> {
    try {
        await deleteAccount(id);
        revalidatePath('/banking/accounts');
        return { success: true, data: undefined };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to delete account',
        };
    }
}
