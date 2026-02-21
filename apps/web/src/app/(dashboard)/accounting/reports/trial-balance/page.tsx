import type { Metadata } from "next";
import { getTrialBalanceReport } from "@/lib/api/reports";
import { listEntities } from "@/lib/api/entities";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { TBReportView } from "./tb-report-view";

export const metadata: Metadata = {
    title: "Trial Balance | Akount",
    description: "Verify that total debits equal total credits across all accounts",
};

interface PageProps {
    searchParams: Promise<{
        asOfDate?: string;
    }>;
}

export default async function TrialBalancePage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Force entity selection for accounting — trial balance requires entityId
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) || entities[0]?.id;

    let report = null;
    let error: string | null = null;

    if (entityId) {
        try {
            report = await getTrialBalanceReport({
                entityId,
                asOfDate: params.asOfDate,
            });
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load report';
        }
    }

    return <TBReportView initialData={report} initialParams={{ ...params, entityId }} error={error} />;
}
