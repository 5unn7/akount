import type { Metadata } from "next";
import { getRevenueReport } from "@/lib/api/reports";
import { RevenueReportView } from "./revenue-report-view";

export const metadata: Metadata = {
    title: "Revenue Report | Akount",
    description: "Revenue breakdown by client with invoice counts",
};

interface PageProps {
    searchParams: Promise<{
        entityId?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function RevenuePage({ searchParams }: PageProps) {
    const params = await searchParams;

    let report = null;
    let error: string | null = null;

    if (params.startDate && params.endDate) {
        try {
            report = await getRevenueReport({
                entityId: params.entityId,
                startDate: params.startDate,
                endDate: params.endDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <RevenueReportView initialData={report} initialParams={params} error={error} />;
}
