import type { Metadata } from "next";
import { getBalanceSheetReport } from "@/lib/api/reports";
import { BSReportView } from "./bs-report-view";

export const metadata: Metadata = {
    title: "Balance Sheet | Akount",
    description: "Financial position snapshot showing assets, liabilities, and equity",
};

interface PageProps {
    searchParams: Promise<{
        entityId?: string;
        asOfDate?: string;
        comparison?: string;
    }>;
}

export default async function BalanceSheetPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Server-side data fetch (auth handled by apiClient)
    let report = null;
    let error: string | null = null;

    if (params.asOfDate) {
        try {
            report = await getBalanceSheetReport({
                entityId: params.entityId,
                asOfDate: params.asOfDate,
                comparisonDate: params.comparison,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <BSReportView initialData={report} initialParams={params} error={error} />;
}
