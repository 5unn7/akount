import { Skeleton } from '@/components/ui/skeleton';

export default function TaxRatesLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Title */}
            <div>
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-4 w-64 mt-2" />
            </div>

            {/* Summary stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl p-4 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>

            {/* Tax flow */}
            <div className="glass rounded-xl p-5">
                <Skeleton className="h-3 w-32 mb-4" />
                <div className="flex items-center gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-14 w-28 rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-32" />
            </div>

            {/* Cards grid */}
            <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="glass rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-14" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-1.5 w-full rounded-full" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
