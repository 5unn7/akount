import { Suspense } from "react";
import type { Metadata } from "next";
import { EntitiesList } from "@/components/dashboard/EntitiesList";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Card, CardContent } from "@/components/ui/card";
import { listEntities } from "@/lib/api/entities";

export const metadata: Metadata = {
    title: "Overview | Akount",
    description: "View your financial overview, net worth, and account summaries",
};

interface OverviewPageProps {
    searchParams: Promise<{ entityId?: string; currency?: string }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
    // Await searchParams (Next.js 15+ requirement)
    const params = await searchParams;
    const entityId = params.entityId;
    const currency = params.currency || 'CAD';

    // Fetch entities for the filter dropdown
    let entities: Awaited<ReturnType<typeof listEntities>> = [];
    try {
        entities = await listEntities();
    } catch {
        // If entities fail to load, continue with empty list
        // The EntitiesList component will show its own error
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Overview</h2>
                <DashboardFilters entities={entities} />
            </div>

            {/* Entities List - Real data from API */}
            <EntitiesList entities={entities} />

            {/* Dashboard metrics - Real data from API with filters */}
            <Suspense fallback={<DashboardMetricsSkeleton />}>
                <DashboardMetrics entityId={entityId} currency={currency} />
            </Suspense>
        </div>
    );
}

/**
 * Loading skeleton for dashboard metrics
 */
function DashboardMetricsSkeleton(): React.ReactElement {
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
