import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsLoading() {
    return (
        <div className="flex-1 space-y-6">
            <div>
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Card className="glass rounded-[14px]">
                <CardContent className="p-0">
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-8 ml-auto" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
