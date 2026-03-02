import type { Metadata } from 'next';
import { listTaxRates } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { TaxRatesClient } from './tax-rates-client';
import { TaxRatesEmpty } from './tax-rates-empty';

export const metadata: Metadata = {
    title: 'Tax Rates | Akount',
    description: 'Manage tax rates and GST/HST settings',
};

export default async function TaxRatesPage() {
    const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities) ?? undefined;

    const taxRates = await listTaxRates({ entityId });

    if (taxRates.length === 0) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Tax Rates</h2>
                </div>
                <TaxRatesEmpty entityId={entityId} />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Tax Rates</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage sales tax, GST/HST, and provincial tax rates
                    </p>
                </div>
            </div>
            <TaxRatesClient initialTaxRates={taxRates} entityId={entityId} />
        </div>
    );
}
