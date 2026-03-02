import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for cash flow page
 * Shown during route transitions
 */
export default function CashFlowLoading() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-8 w-28" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}
