import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for fiscal periods page.
 * Matches the timeline layout: header, stats, current period card, period list.
 */
export default function FiscalPeriodsLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Header */}
            <div className="space-y-1">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Year selector + stats */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <div className="ml-auto flex items-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>

            {/* Current period snapshot */}
            <div className="glass rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-24 ml-auto rounded-full" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
            </div>

            {/* Period timeline */}
            <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                        <Skeleton className="h-3 w-3 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-7 w-14 rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
}
