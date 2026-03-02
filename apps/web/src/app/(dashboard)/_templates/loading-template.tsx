import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * TEMPLATE: Loading state for dashboard pages
 *
 * INSTRUCTIONS:
 * 1. Copy this file to your page directory as loading.tsx
 * 2. Rename the export function to match your page (e.g., BudgetsLoading)
 * 3. Customize the skeleton pattern to match your page layout
 * 4. Update the comment to describe your specific page
 *
 * EXAMPLE:
 * For /planning/budgets/loading.tsx:
 * - Export: BudgetsLoading
 * - Comment: "Loading state for budgets page"
 */
export default function PageLoading() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-36" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-28" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
