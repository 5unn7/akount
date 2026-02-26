import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for forecasts page.
 * Matches page structure: header, runway card, seasonal card, table skeleton.
 */
export default function ForecastsLoading() {
    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-36 rounded-lg" />
            </div>

            {/* Cash Runway + Seasonal Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Runway card skeleton */}
                <div className="glass rounded-xl p-5 col-span-2 space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-7 w-24" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seasonal card skeleton */}
                <div className="glass rounded-xl p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-28" />
                </div>
            </div>

            {/* Table skeleton */}
            <div className="glass rounded-xl overflow-hidden">
                <div className="p-4 space-y-4">
                    {/* Table header */}
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    {/* Table rows */}
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 py-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-5 w-10" />
                            <Skeleton className="h-8 w-16 ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
