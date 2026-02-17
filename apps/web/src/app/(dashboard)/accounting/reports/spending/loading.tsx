import { Skeleton } from "@/components/ui/skeleton";

export default function SpendingLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="glass rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="space-y-1 text-right">
                                <Skeleton className="h-3 w-20 ml-auto" />
                                <Skeleton className="h-6 w-28" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </div>

                <div className="glass rounded-xl overflow-hidden">
                    <div className="bg-ak-red-dim border-b border-ak-border px-6 py-3">
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <div className="p-6 space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
