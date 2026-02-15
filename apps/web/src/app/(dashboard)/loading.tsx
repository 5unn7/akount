import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard-wide loading fallback
 * Cascades to all child routes that don't define their own loading.tsx
 */
export default function DashboardLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Page header skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-[120px]" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[120px] rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}
