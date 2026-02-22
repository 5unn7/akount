'use server';

import {
    createTaxRate,
    updateTaxRate,
    deactivateTaxRate,
    type CreateTaxRateInput,
    type UpdateTaxRateInput,
} from '@/lib/api/accounting';

export async function createTaxRateAction(input: CreateTaxRateInput) {
    return createTaxRate(input);
}

export async function updateTaxRateAction(id: string, input: UpdateTaxRateInput) {
    return updateTaxRate(id, input);
}

export async function deactivateTaxRateAction(id: string) {
    return deactivateTaxRate(id);
}
