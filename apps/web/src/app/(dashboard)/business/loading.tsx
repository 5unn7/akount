import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for business domain redirect
 * Shows briefly while redirect to /business/clients happens
 */
export default function BusinessLoading() {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="glass rounded-xl p-8 space-y-4 w-full max-w-md">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
        </div>
    );
}
