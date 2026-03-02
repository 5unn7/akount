import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex-1 space-y-6">
            {/* Back link */}
            <Skeleton className="h-4 w-32" />

            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-48" />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-xl p-5 space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                ))}
            </div>

            <Skeleton className="h-px w-full" />

            {/* Amounts */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>
            </div>

            {/* Reason */}
            <div className="glass rounded-xl p-5 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    );
}
