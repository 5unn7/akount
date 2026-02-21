import type { Metadata } from "next";
import { getProfitLossReport } from "@/lib/api/reports";
import { listEntities } from "@/lib/api/entities";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { PLReportView } from "./pl-report-view";

export const metadata: Metadata = {
    title: "Profit & Loss Statement | Akount",
    description: "Income statement showing revenue, expenses, and net income",
};

interface PageProps {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
        comparison?: string;
    }>;
}

export default async function ProfitLossPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Force entity selection for accounting
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) || entities[0]?.id;

    let report = null;
    let error: string | null = null;

    if (params.startDate && params.endDate) {
        try {
            report = await getProfitLossReport({
                entityId,
                startDate: params.startDate,
                endDate: params.endDate,
                comparisonPeriod: params.comparison,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <PLReportView initialData={report} initialParams={{ ...params, entityId }} error={error} />;
}
