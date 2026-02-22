import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getBalanceSheetReport } from "@/lib/api/reports";
import { listEntities } from "@/lib/api/entities";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";

const BSReportView = dynamic(() => import("./bs-report-view").then(m => ({ default: m.BSReportView })), { ssr: false });

export const metadata: Metadata = {
    title: "Balance Sheet | Akount",
    description: "Financial position snapshot showing assets, liabilities, and equity",
};

interface PageProps {
    searchParams: Promise<{
        asOfDate?: string;
        comparison?: string;
    }>;
}

export default async function BalanceSheetPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Force entity selection for accounting
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) || entities[0]?.id;

    let report = null;
    let error: string | null = null;

    if (params.asOfDate) {
        try {
            report = await getBalanceSheetReport({
                entityId,
                asOfDate: params.asOfDate,
                comparisonDate: params.comparison,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <BSReportView entities={entities} initialData={report} initialParams={{ ...params, entityId }} error={error} />;
}
