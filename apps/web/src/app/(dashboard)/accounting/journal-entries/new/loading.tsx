import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for new journal entry page
 * Shown during route transitions
 */
export default function NewJournalEntryLoading() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-56" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
