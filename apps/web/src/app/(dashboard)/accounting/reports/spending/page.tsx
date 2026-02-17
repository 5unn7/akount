import type { Metadata } from "next";
import { getSpendingReport } from "@/lib/api/reports";
import { SpendingReportView } from "./spending-report-view";

export const metadata: Metadata = {
    title: "Spending Report | Akount",
    description: "Breakdown of spending by GL account category",
};

interface PageProps {
    searchParams: Promise<{
        entityId?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function SpendingPage({ searchParams }: PageProps) {
    const params = await searchParams;

    let report = null;
    let error: string | null = null;

    if (params.startDate && params.endDate) {
        try {
            report = await getSpendingReport({
                entityId: params.entityId,
                startDate: params.startDate,
                endDate: params.endDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <SpendingReportView initialData={report} initialParams={params} error={error} />;
}
