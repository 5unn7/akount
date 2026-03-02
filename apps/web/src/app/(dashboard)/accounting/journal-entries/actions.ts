'use server';

import {
    listJournalEntries,
    approveJournalEntry,
    voidJournalEntry,
    deleteJournalEntry,
    createJournalEntry as createJournalEntryApi,
    type ListJournalEntriesParams,
    type ListJournalEntriesResponse,
    type JournalEntry,
    type CreateJournalEntryInput,
} from '@/lib/api/accounting';

export async function fetchJournalEntries(
    params: ListJournalEntriesParams
): Promise<ListJournalEntriesResponse> {
    return listJournalEntries(params);
}

export async function createEntryAction(
    input: CreateJournalEntryInput
): Promise<JournalEntry> {
    return createJournalEntryApi(input);
}

export async function approveEntryAction(
    id: string
): Promise<JournalEntry> {
    return approveJournalEntry(id);
}

export async function voidEntryAction(
    id: string
): Promise<{ original: JournalEntry; reversal: JournalEntry }> {
    return voidJournalEntry(id);
}

export async function deleteEntryAction(id: string): Promise<void> {
    return deleteJournalEntry(id);
}
