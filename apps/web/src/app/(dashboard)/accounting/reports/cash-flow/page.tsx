import type { Metadata } from "next";
import { getCashFlowReport } from "@/lib/api/reports";
import { CFReportView } from "./cf-report-view";

export const metadata: Metadata = {
    title: "Cash Flow Statement | Akount",
    description: "Cash inflows and outflows by operating, investing, and financing activities",
};

interface PageProps {
    searchParams: Promise<{
        entityId?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function CashFlowPage({ searchParams }: PageProps) {
    const params = await searchParams;

    let report = null;
    let error: string | null = null;

    if (params.startDate && params.endDate) {
        try {
            report = await getCashFlowReport({
                entityId: params.entityId,
                startDate: params.startDate,
                endDate: params.endDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <CFReportView initialData={report} initialParams={params} error={error} />;
}
