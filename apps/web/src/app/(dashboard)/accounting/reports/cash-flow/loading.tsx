import { Skeleton } from "@/components/ui/skeleton";

export default function CashFlowLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-96" />
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
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>

                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-blue-dim border-b border-ak-border px-6 py-3">
                            <Skeleton className="h-5 w-36" />
                        </div>
                        <div className="p-6 space-y-2">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex justify-between">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                            <div className="flex justify-between pt-4 border-t border-ak-border mt-4">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-28" />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="glass rounded-xl p-6 space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-ak-border">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-7 w-32" />
                    </div>
                </div>
            </div>
        </div>
    );
}
