import { Skeleton } from "@/components/ui/skeleton";

export default function AssetsLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-36" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl p-4 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-8 w-28" />
                    </div>
                ))}
            </div>

            {/* Search bar skeleton */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-32" />
            </div>

            {/* Asset cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="glass rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
