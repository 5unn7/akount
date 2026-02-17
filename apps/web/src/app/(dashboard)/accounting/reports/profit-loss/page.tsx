import type { Metadata } from "next";
import { getProfitLossReport } from "@/lib/api/reports";
import { PLReportView } from "./pl-report-view";

export const metadata: Metadata = {
    title: "Profit & Loss Statement | Akount",
    description: "Income statement showing revenue, expenses, and net income",
};

interface PageProps {
    searchParams: Promise<{
        entityId?: string;
        startDate?: string;
        endDate?: string;
        comparison?: string;
    }>;
}

export default async function ProfitLossPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Server-side data fetch (auth handled by apiClient)
    let report = null;
    let error: string | null = null;

    if (params.startDate && params.endDate) {
        try {
            report = await getProfitLossReport({
                entityId: params.entityId,
                startDate: params.startDate,
                endDate: params.endDate,
                comparisonPeriod: params.comparison,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <PLReportView initialData={report} initialParams={params} error={error} />;
}
