import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-5">
            {/* Header skeleton */}
            <div>
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-8 w-64 mb-1" />
                <Skeleton className="h-4 w-48" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="glass rounded-lg px-4 py-3.5">
                        <div className="h-3 w-14 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="glass rounded-[14px] overflow-hidden">
                <div className="p-4 border-b border-ak-border">
                    <Skeleton className="h-5 w-48" />
                </div>
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
