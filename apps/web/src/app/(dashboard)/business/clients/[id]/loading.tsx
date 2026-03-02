import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Back link skeleton */}
            <Skeleton className="h-5 w-32" />

            {/* Header section */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl p-6 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-7 w-20" />
                    </div>
                ))}
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-md" />
                <div className="glass rounded-xl p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-48" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
