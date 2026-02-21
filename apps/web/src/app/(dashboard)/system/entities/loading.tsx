import { Skeleton } from "@/components/ui/skeleton";

export default function EntitiesLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-xl p-5 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-40" />
                    </div>
                ))}
            </div>
        </div>
    );
}
