import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsLoading() {
    return (
        <div className="flex-1 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-28 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            </div>

            {/* Stats Row (5 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="glass rounded-lg px-4 py-3.5 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>

            {/* Spending + Intelligence Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Spending Breakdown */}
                <div className="glass rounded-xl p-5 space-y-4">
                    <Skeleton className="h-3 w-32" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Intelligence Panel */}
                <div className="space-y-4">
                    <div className="glass rounded-xl p-5 space-y-3">
                        <Skeleton className="h-3 w-28" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass rounded-xl p-5 space-y-3">
                            <Skeleton className="h-3 w-24" />
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                        <div className="glass rounded-xl p-5 space-y-3">
                            <Skeleton className="h-3 w-28" />
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Cash Flow */}
            <div className="glass rounded-xl p-5 space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-32 w-full rounded-lg" />
            </div>

            {/* Table Skeleton */}
            <div className="glass rounded-[14px] overflow-hidden">
                <div className="p-4">
                    <Skeleton className="h-8 w-full max-w-xs rounded-lg" />
                </div>
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-4 py-3"
                        >
                            <Skeleton className="h-4 w-20" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
