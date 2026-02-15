import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Stats Grid skeleton */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-lg px-4 py-3.5">
                        <Skeleton className="h-3 w-24 mb-2" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                ))}
            </div>

            {/* AR Aging skeleton */}
            <div className="glass rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-12 rounded-lg" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Skeleton className="w-1.5 h-1.5 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AP Aging skeleton */}
            <div className="glass rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-12 rounded-lg" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Skeleton className="w-1.5 h-1.5 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tables skeletons */}
            {[1, 2].map((section) => (
                <div key={section} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="glass rounded-[14px] p-4">
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-24 flex-shrink-0" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-20 flex-shrink-0" />
                                    <Skeleton className="h-4 w-28 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
