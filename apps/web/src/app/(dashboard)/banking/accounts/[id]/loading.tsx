import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
    return (
        <div className="flex-1 space-y-6">
            {/* Header Skeleton */}
            <Card>
                <CardHeader className="space-y-3">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Skeleton */}
            <Card>
                <CardHeader>
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="text-right space-y-2">
                                <div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" />
                                <div className="h-3 w-24 bg-muted animate-pulse rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
