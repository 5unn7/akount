import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for overview page — matches Command Center grid layout
 */
export default function OverviewLoading() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {/* Row 1: Hero + Right Panel */}
                <div className="xl:col-span-2">
                    <div className="glass rounded-xl p-5 md:p-7 space-y-4">
                        <div className="flex items-end justify-between">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-10 w-40" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-ak-border">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="glass-2 rounded-lg p-3 space-y-2">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="xl:col-span-2">
                    <div className="glass rounded-xl p-4 space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-8 w-24 rounded-lg" />
                            ))}
                        </div>
                        <div className="mt-4 space-y-2">
                            <Skeleton className="h-3 w-28" />
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 2: AI Insights */}
                <div className="xl:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass rounded-xl p-4 space-y-3">
                                <Skeleton className="h-1 w-full rounded" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-2 w-2 rounded-full" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 3: Quick Stats */}
                <div className="xl:col-span-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="glass rounded-lg px-4 py-3.5 space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 4: Cash Flow + Recent Activity */}
                <div className="xl:col-span-2">
                    <div className="glass rounded-xl p-4 space-y-3">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                </div>
                <div className="xl:col-span-2">
                    <div className="glass rounded-xl p-4 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </div>

                {/* Row 5: Expense Chart + Entity Matrix */}
                <div className="xl:col-span-2">
                    <div className="glass rounded-xl p-4 space-y-3">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                </div>
                <div className="xl:col-span-2">
                    <div className="glass rounded-xl p-4 space-y-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
