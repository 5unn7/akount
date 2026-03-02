import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function RulesLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
            </div>

            {/* Stats skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="glass rounded-[14px]">
                        <CardContent className="pt-6 space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Suggestions skeleton */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-ak-border">
                                <Skeleton className="h-4 w-4 rounded" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-64" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Rules list skeleton */}
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="glass rounded-[14px]">
                        <CardContent className="py-4 px-5">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-5 rounded" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-56" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
