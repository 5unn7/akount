import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-5">
            {/* Row 1: Hero + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="lg:col-span-3">
                    <div className="glass rounded-xl p-6 md:p-8 space-y-5">
                        {/* Breadcrumbs */}
                        <Skeleton className="h-3 w-48" />
                        {/* Name + badges */}
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-48" />
                                <Skeleton className="h-4 w-32" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-14 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                    <Skeleton className="h-5 w-10 rounded-full" />
                                </div>
                            </div>
                        </div>
                        {/* Balance */}
                        <div>
                            <Skeleton className="h-3 w-24 mb-2" />
                            <Skeleton className="h-10 w-48" />
                            <Skeleton className="h-3 w-32 mt-2" />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass rounded-xl p-5 space-y-3">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="glass rounded-xl p-5 space-y-2">
                        <Skeleton className="h-3 w-28 mb-3" />
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="flex justify-between py-1.5"
                            >
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="glass rounded-lg px-4 py-3.5 space-y-2"
                    >
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>

            {/* Row 3: Chart + Spending */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl p-6 space-y-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-3 w-28" />
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-6 w-8 rounded"
                                />
                            ))}
                        </div>
                    </div>
                    <Skeleton className="h-40 w-full rounded" />
                </div>
                <div className="glass rounded-xl p-6 space-y-3">
                    <Skeleton className="h-3 w-32" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Row 4: Transactions Table */}
            <div className="glass rounded-[14px] p-0 overflow-hidden">
                <div className="p-4 border-b border-ak-border">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <div className="flex-1" />
                        <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-7 w-24 rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-4 py-3"
                        >
                            <Skeleton className="h-4 w-20 rounded" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-40 rounded" />
                                <Skeleton className="h-3 w-24 rounded" />
                            </div>
                            <Skeleton className="h-4 w-20 rounded" />
                            <Skeleton className="h-4 w-24 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
