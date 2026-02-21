import type { Metadata } from "next";
import { getRevenueReport } from "@/lib/api/reports";
import { listEntities } from "@/lib/api/entities";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { RevenueReportView } from "./revenue-report-view";

export const metadata: Metadata = {
    title: "Revenue Report | Akount",
    description: "Revenue breakdown by client with invoice counts",
};

interface PageProps {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function RevenuePage({ searchParams }: PageProps) {
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
            report = await getRevenueReport({
                entityId,
                startDate: params.startDate,
                endDate: params.endDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <RevenueReportView initialData={report} initialParams={{ ...params, entityId }} error={error} />;
}
