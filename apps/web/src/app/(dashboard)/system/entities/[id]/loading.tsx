import { Skeleton } from '@/components/ui/skeleton';

export default function EntityDetailLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Back link */}
            <Skeleton className="h-4 w-24" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            {/* Metrics row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl p-4 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-7 w-12" />
                    </div>
                ))}
            </div>

            {/* Detail sections */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="glass rounded-xl p-6 space-y-4">
                    <Skeleton className="h-5 w-32" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ))}
                </div>
                <div className="glass rounded-xl p-6 space-y-4">
                    <Skeleton className="h-5 w-32" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
