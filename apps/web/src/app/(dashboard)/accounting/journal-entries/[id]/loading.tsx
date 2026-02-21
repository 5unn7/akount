import { Skeleton } from '@/components/ui/skeleton';

export default function JournalEntryDetailLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Back link */}
            <Skeleton className="h-4 w-40" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            {/* Metadata row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl p-4 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>

            {/* Lines table */}
            <div className="glass rounded-xl p-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
