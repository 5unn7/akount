import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Reports grid skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="glass rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-11 w-11 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Help text skeleton */}
            <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
