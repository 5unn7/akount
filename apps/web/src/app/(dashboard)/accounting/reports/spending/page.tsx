import type { Metadata } from "next";
import { getSpendingReport } from "@/lib/api/reports";
import { listEntities } from "@/lib/api/entities";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { SpendingReportView } from "./spending-report-view";

export const metadata: Metadata = {
    title: "Spending Report | Akount",
    description: "Breakdown of spending by GL account category",
};

interface PageProps {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function SpendingPage({ searchParams }: PageProps) {
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
            report = await getSpendingReport({
                entityId,
                startDate: params.startDate,
                endDate: params.endDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <SpendingReportView initialData={report} initialParams={{ ...params, entityId }} error={error} />;
}
