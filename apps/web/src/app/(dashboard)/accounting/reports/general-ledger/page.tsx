import type { Metadata } from "next";
import { getGLLedgerReport } from "@/lib/api/reports";
import { GLReportView } from "./gl-report-view";

export const metadata: Metadata = {
    title: "General Ledger | Akount",
    description: "Detailed transaction history for any GL account with running balance",
};

interface PageProps {
    searchParams: Promise<{
        entityId?: string;
        glAccountId?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function GeneralLedgerPage({ searchParams }: PageProps) {
    const params = await searchParams;

    let report = null;
    let error: string | null = null;

    if (params.entityId && params.glAccountId && params.startDate && params.endDate) {
        try {
            report = await getGLLedgerReport({
                entityId: params.entityId,
                glAccountId: params.glAccountId,
                startDate: params.startDate,
                endDate: params.endDate,
                limit: 50,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <GLReportView initialData={report} initialParams={params} error={error} />;
}
