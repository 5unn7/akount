import type { Metadata } from 'next';
import { listGLAccounts, getJournalEntry } from '@/lib/api/accounting';
import type { JournalEntry, JournalLine } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { JournalEntryForm } from '../journal-entry-form';
import type { JournalEntryInitialData } from '../journal-entry-form';
import { EmptyState } from '@akount/ui';
import { Building2 } from 'lucide-react';

interface NewJournalEntryPageProps {
    searchParams: Promise<{ duplicate?: string }>;
}

export async function generateMetadata(
    { searchParams }: NewJournalEntryPageProps
): Promise<Metadata> {
    const { duplicate } = await searchParams;
    return {
        title: duplicate ? 'Duplicate Journal Entry | Akount' : 'New Journal Entry | Akount',
        description: 'Create a new manual journal entry',
    };
}

/**
 * Convert cents (integer) to dollar string for form input.
 * Returns empty string for zero amounts so the field shows as empty.
 */
function centsToFormValue(cents: number): string {
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
}

/**
 * Normalize API response: API returns `journalLines`, frontend uses `lines`.
 */
function normalizeEntry(entry: JournalEntry): JournalEntry {
    const raw = entry as JournalEntry & { journalLines?: JournalLine[] };
    if (raw.journalLines && !raw.lines) {
        return { ...raw, lines: raw.journalLines };
    }
    return entry;
}

function buildInitialData(entry: JournalEntry): JournalEntryInitialData {
    return {
        memo: `Copy of: ${entry.memo}`,
        lines: entry.lines.map((line) => ({
            glAccountId: line.glAccountId,
            debitAmount: centsToFormValue(line.debitAmount),
            creditAmount: centsToFormValue(line.creditAmount),
            description: line.description ?? '',
        })),
    };
}

export default async function NewJournalEntryPage({
    searchParams,
}: NewJournalEntryPageProps) {
    const { duplicate } = await searchParams;

    try {
        const [{ entityId: rawEntityId }, entities] = await Promise.all([
            getEntitySelection(),
            listEntities(),
        ]);

        if (entities.length === 0) {
            return (
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <EmptyState
                        icon={Building2}
                        title="No entities yet"
                        description="Create a business entity in Settings to start recording journal entries."
                    />
                </div>
            );
        }

        // Force entity selection for accounting — fall back to first entity
        const entityId = validateEntityId(rawEntityId, entities) || entities[0].id;
        const accounts = await listGLAccounts({
            entityId,
            isActive: true,
        });

        // If duplicating, fetch the source entry and build initial data
        let initialData: JournalEntryInitialData | undefined;
        if (duplicate) {
            try {
                const sourceEntry = normalizeEntry(await getJournalEntry(duplicate));
                initialData = buildInitialData(sourceEntry);
            } catch {
                // Source entry not found — fall through to blank form
            }
        }

        const isDuplicate = !!initialData;

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        {isDuplicate ? 'Duplicate Journal Entry' : 'New Journal Entry'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isDuplicate
                            ? 'Pre-filled from an existing entry — review and adjust before saving'
                            : 'Create a manual double-entry journal entry'}
                    </p>
                </div>

                <JournalEntryForm
                    key={duplicate ?? 'new'}
                    glAccounts={accounts}
                    entityId={entityId}
                    initialData={initialData}
                />
            </div>
        );
    } catch (error) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-destructive mb-2">Failed to load form data</p>
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Unknown error occurred'}
                    </p>
                </div>
            </div>
        );
    }
}
