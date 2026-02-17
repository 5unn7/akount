import type { Metadata } from "next";
import { getTrialBalanceReport } from "@/lib/api/reports";
import { TBReportView } from "./tb-report-view";

export const metadata: Metadata = {
    title: "Trial Balance | Akount",
    description: "Verify that total debits equal total credits across all accounts",
};

interface PageProps {
    searchParams: Promise<{
        entityId?: string;
        asOfDate?: string;
    }>;
}

export default async function TrialBalancePage({ searchParams }: PageProps) {
    const params = await searchParams;

    let report = null;
    let error: string | null = null;

    if (params.entityId) {
        try {
            report = await getTrialBalanceReport({
                entityId: params.entityId,
                asOfDate: params.asOfDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <TBReportView initialData={report} initialParams={params} error={error} />;
}
