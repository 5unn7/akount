import type { Metadata } from "next";
import { getGLLedgerReport } from "@/lib/api/reports";
import { listEntities } from "@/lib/api/entities";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { GLReportView } from "./gl-report-view";

export const metadata: Metadata = {
    title: "General Ledger | Akount",
    description: "Detailed transaction history for any GL account with running balance",
};

interface PageProps {
    searchParams: Promise<{
        glAccountId?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function GeneralLedgerPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Force entity selection for accounting — GL ledger requires entityId
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) || entities[0]?.id;

    let report = null;
    let error: string | null = null;

    if (entityId && params.glAccountId && params.startDate && params.endDate) {
        try {
            report = await getGLLedgerReport({
                entityId,
                glAccountId: params.glAccountId,
                startDate: params.startDate,
                endDate: params.endDate,
                limit: 50,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <GLReportView initialData={report} initialParams={{ ...params, entityId }} error={error} />;
}
