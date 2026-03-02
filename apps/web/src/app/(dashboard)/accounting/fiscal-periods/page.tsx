import type { Metadata } from 'next';
import { listFiscalCalendars } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { FiscalPeriodsClient } from './fiscal-periods-client';
import { FiscalPeriodsEmpty } from './fiscal-periods-empty';

export const metadata: Metadata = {
    title: 'Fiscal Periods | Akount',
    description: 'Manage your fiscal year and accounting periods',
};

export default async function FiscalPeriodsPage() {
    const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities) ?? undefined;

    let calendars: Awaited<ReturnType<typeof listFiscalCalendars>> = [];
    if (entityId) {
        calendars = await listFiscalCalendars(entityId);
    }

    if (calendars.length === 0) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Fiscal Periods
                    </h2>
                </div>
                <FiscalPeriodsEmpty entityId={entityId} />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Fiscal Periods
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage accounting periods, lock months, and close fiscal years
                    </p>
                </div>
            </div>
            <FiscalPeriodsClient initialCalendars={calendars} entityId={entityId} />
        </div>
    );
}
