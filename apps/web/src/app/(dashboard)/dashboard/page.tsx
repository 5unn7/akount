import { Suspense } from "react";
import { EntitiesList } from "@/components/dashboard/EntitiesList";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h2>
            </div>

            {/* Entities List - Real data from API */}
            <EntitiesList />

            {/* Dashboard metrics - Real data from API */}
            <Suspense fallback={<DashboardMetricsSkeleton />}>
                <DashboardMetrics />
            </Suspense>
        </div>
    );
}

/**
 * Loading skeleton for dashboard metrics
 */
function DashboardMetricsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
