'use server';

import {
    listJournalEntries,
    approveJournalEntry,
    voidJournalEntry,
    deleteJournalEntry,
    type ListJournalEntriesParams,
    type ListJournalEntriesResponse,
    type JournalEntry,
} from '@/lib/api/accounting';

export async function fetchJournalEntries(
    params: ListJournalEntriesParams
): Promise<ListJournalEntriesResponse> {
    return listJournalEntries(params);
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
