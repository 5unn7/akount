'use server';

import { listImports, type ListImportsParams, type ListImportsResponse } from '@/lib/api/imports';

export async function fetchImportBatches(
    params?: ListImportsParams
): Promise<ListImportsResponse> {
    return listImports(params);
}
