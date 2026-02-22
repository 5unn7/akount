import { Skeleton } from '@/components/ui/skeleton';

export default function AccountingOverviewLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-xl p-6 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Balance Equation */}
            <div className="glass rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Income Summary & COA Snapshot */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="glass rounded-xl p-6 space-y-4">
                    <Skeleton className="h-6 w-36" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass rounded-xl p-6 space-y-4">
                    <Skeleton className="h-6 w-36" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Entries */}
            <div className="glass rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
