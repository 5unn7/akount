import { Skeleton } from '@/components/ui/skeleton';

export default function AccountsLoading() {
    return (
        <div className="flex-1 space-y-5">
            {/* Row 1: Hero + Insight Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="lg:col-span-3">
                    <div className="glass rounded-xl p-6 md:p-8 space-y-4">
                        <div className="flex justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-28" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20 rounded-lg" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                                <Skeleton className="h-8 w-20 rounded-lg" />
                                <Skeleton className="h-8 w-28 rounded-lg" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-10 w-48" />
                        <div className="flex gap-6 pt-2 border-t border-ak-border">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass rounded-xl p-5 space-y-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="glass rounded-xl p-5 space-y-3">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </div>

            {/* Row 2: Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-lg px-4 py-3.5 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>

            {/* Row 3: Account Cards Grid */}
            <div className="space-y-4">
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-20 rounded-lg" />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="glass rounded-xl p-4 space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-28" />
                            <div className="pt-2 border-t border-ak-border flex justify-between">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
