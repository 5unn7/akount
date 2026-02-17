import { Skeleton } from "@/components/ui/skeleton";

export default function GeneralLedgerLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            <div className="glass rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-64" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>

                <div className="glass rounded-xl overflow-hidden">
                    <div className="border-b border-ak-border bg-ak-bg-3 px-6 py-3 flex gap-6">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="divide-y divide-ak-border">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <div key={i} className="px-6 py-3 flex gap-6">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-20 ml-auto" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
