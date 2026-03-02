import { Skeleton } from '@/components/ui/skeleton';

export default function BillDetailLoading() {
    return (
        <div className="flex-1 space-y-6">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-xl p-5 space-y-3">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                ))}
            </div>
            <div className="glass rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-48 flex-1" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
