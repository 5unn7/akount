import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ActionsLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Skeleton className="h-9 w-40" />

            {/* Stats skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="glass rounded-[14px]">
                        <CardContent className="pt-6 space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filter bar skeleton */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Skeleton className="h-9 w-[140px]" />
                        <Skeleton className="h-9 w-[160px]" />
                        <Skeleton className="h-9 w-16" />
                    </div>
                </CardContent>
            </Card>

            {/* Action list skeleton */}
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="glass rounded-[14px]">
                        <CardContent className="py-4 px-5">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-5 w-16 rounded-lg" />
                                        <Skeleton className="h-4 w-8" />
                                    </div>
                                    <Skeleton className="h-4 w-64" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <div className="flex gap-1">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
