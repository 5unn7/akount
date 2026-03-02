import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <Skeleton className="h-4 w-32" />

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-xl p-6 space-y-4">
                        <Skeleton className="h-5 w-40" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        ))}
                    </div>
                    <div className="glass rounded-xl p-6 space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
}
