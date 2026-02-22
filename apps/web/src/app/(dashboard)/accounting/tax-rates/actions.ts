'use server';

import {
    listTaxRates,
    createTaxRate,
    updateTaxRate,
    deactivateTaxRate,
    type ListTaxRatesParams,
    type CreateTaxRateInput,
    type UpdateTaxRateInput,
} from '@/lib/api/accounting';

export async function listTaxRatesAction(params: ListTaxRatesParams = {}) {
    return listTaxRates(params);
}

export async function createTaxRateAction(input: CreateTaxRateInput) {
    return createTaxRate(input);
}

export async function updateTaxRateAction(id: string, input: UpdateTaxRateInput) {
    return updateTaxRate(id, input);
}

export async function deactivateTaxRateAction(id: string) {
    return deactivateTaxRate(id);
}
