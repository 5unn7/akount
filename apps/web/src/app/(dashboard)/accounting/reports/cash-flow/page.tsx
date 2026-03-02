import type { Metadata } from "next";
import { getCashFlowReport } from "@/lib/api/reports";
import { listEntities } from "@/lib/api/entities";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { CFReportView } from "./cf-report-view";

export const metadata: Metadata = {
    title: "Cash Flow Statement | Akount",
    description: "Cash inflows and outflows by operating, investing, and financing activities",
};

interface PageProps {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function CashFlowPage({ searchParams }: PageProps) {
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
            report = await getCashFlowReport({
                entityId,
                startDate: params.startDate,
                endDate: params.endDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <CFReportView initialData={report} initialParams={{ ...params, entityId }} error={error} />;
}
