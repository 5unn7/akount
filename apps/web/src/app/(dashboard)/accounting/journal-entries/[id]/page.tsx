import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getJournalEntry, type JournalEntry, type JournalLine } from '@/lib/api/accounting';
import { JournalEntryDetailClient } from './journal-entry-detail-client';

interface JournalEntryDetailPageProps {
    params: Promise<{ id: string }>;
}

/**
 * Map API response field names to frontend type.
 * API returns `journalLines` (Prisma field name), frontend uses `lines`.
 */
function normalizeEntry(entry: JournalEntry): JournalEntry {
    const raw = entry as JournalEntry & { journalLines?: JournalLine[] };
    if (raw.journalLines && !raw.lines) {
        return { ...raw, lines: raw.journalLines };
    }
    return entry;
}

export async function generateMetadata(
    { params }: JournalEntryDetailPageProps
): Promise<Metadata> {
    const { id } = await params;
    try {
        const entry = normalizeEntry(await getJournalEntry(id));
        const entryLabel = entry.entryNumber
            ? `JE-${String(entry.entryNumber).padStart(3, '0')}`
            : 'Journal Entry';
        return {
            title: `${entryLabel} | Journal Entries | Akount`,
            description: entry.memo || 'View journal entry details',
        };
    } catch {
        return { title: 'Journal Entry Not Found | Akount' };
    }
}

export default async function JournalEntryDetailPage({
    params,
}: JournalEntryDetailPageProps) {
    const { id } = await params;

    let entry: JournalEntry;
    try {
        entry = normalizeEntry(await getJournalEntry(id));
    } catch {
        notFound();
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <Link
                href="/accounting/journal-entries"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Journal Entries
            </Link>

            <JournalEntryDetailClient entry={entry} />
        </div>
    );
}
