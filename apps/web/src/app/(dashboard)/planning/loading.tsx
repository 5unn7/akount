import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass rounded-xl p-6 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map(i => (
                    <div key={i} className="glass rounded-xl p-6 space-y-4">
                        <Skeleton className="h-5 w-28" />
                        {[1, 2, 3].map(j => (
                            <Skeleton key={j} className="h-8 w-full" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
