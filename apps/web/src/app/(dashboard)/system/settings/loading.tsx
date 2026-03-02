import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for settings page
 * Shown during route transitions
 */
export default function SettingsLoading() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-36" />
            </div>

            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
