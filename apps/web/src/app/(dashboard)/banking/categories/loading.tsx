import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-9 w-32" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-xl p-6 space-y-3">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>

            <div className="glass rounded-xl p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}
