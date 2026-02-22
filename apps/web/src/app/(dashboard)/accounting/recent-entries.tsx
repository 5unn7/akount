import type { ListJournalEntriesResponse } from '@/lib/api/accounting';
import { formatDate } from '@/lib/api/accounting';
import { formatCurrency } from '@/lib/utils/currency';
import Link from 'next/link';
import { JournalEntryStatusBadge } from '@akount/ui/business';
import { BookOpen, CheckCircle2, XCircle, Archive } from 'lucide-react';

interface RecentEntriesProps {
    journalEntries: ListJournalEntriesResponse;
}

const STATUS_ICONS = {
    DRAFT: BookOpen,
    POSTED: CheckCircle2,
    VOIDED: XCircle,
    ARCHIVED: Archive,
};

export function RecentEntries({ journalEntries }: RecentEntriesProps) {
    const { entries } = journalEntries;

    if (entries.length === 0) {
        return (
            <div className="glass rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-heading">Recent Journal Entries</h3>
                <p className="text-sm text-muted-foreground">
                    No journal entries yet
                </p>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading">Recent Journal Entries</h3>
                <Link
                    href="/accounting/journal-entries"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all →
                </Link>
            </div>

            <div className="space-y-2">
                {entries.map((entry) => {
                    const Icon = STATUS_ICONS[entry.status] ?? BookOpen;

                    // Calculate total debits/credits
                    const totalDebits = entry.lines.reduce(
                        (sum, line) => sum + line.debitAmount,
                        0
                    );

                    return (
                        <Link
                            key={entry.id}
                            href={`/accounting/journal-entries/${entry.id}`}
                            className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-ak-bg-3 transition-colors border border-transparent hover:border-ak-border"
                        >
                            <div className="flex items-start gap-3 flex-1">
                                <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            JE-{entry.entryNumber}
                                        </span>
                                        <JournalEntryStatusBadge status={entry.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {entry.memo || 'No description'}
                                    </p>
                                    <p className="text-micro text-muted-foreground mt-1">
                                        {formatDate(entry.date)} • {entry.lines.length} lines
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-mono font-semibold">
                                    {formatCurrency(totalDebits)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
