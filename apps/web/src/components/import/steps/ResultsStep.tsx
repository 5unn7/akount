'use client';

import { BatchImportResults } from '../BatchImportResults';
import type { ImportAccount, UploadFileItem, BatchImportResult } from '../types';

/**
 * Results Step — Display import results with aggregate stats
 *
 * Simple wrapper around BatchImportResults with state transformation.
 */

interface ResultsStepProps {
    files: UploadFileItem[];
    accounts: ImportAccount[];
    onReset: () => void;
    onRetryFailed: () => void;
}

export function ResultsStep({
    files,
    accounts,
    onReset,
    onRetryFailed,
}: ResultsStepProps) {
    // Build aggregate stats from uploaded files
    const successFiles = files.filter(f => f.status === 'success');
    const aggregate = {
        totalFiles: files.length,
        successFiles: successFiles.length,
        totalTransactions: successFiles.reduce((sum, f) => sum + (f.result?.totalRows ?? 0), 0),
        imported: successFiles.reduce((sum, f) => sum + (f.result?.processedRows ?? 0), 0),
        duplicates: successFiles.reduce((sum, f) => sum + (f.result?.duplicateRows ?? 0), 0),
        errors: successFiles.reduce((sum, f) => sum + (f.result?.errorRows ?? 0), 0),
    };

    const batchResult: BatchImportResult = {
        files,
        aggregateStats: aggregate,
    };

    return (
        <BatchImportResults
            batchResult={batchResult}
            accounts={accounts}
            onAddMoreFiles={onReset}
            onRetryFailed={onRetryFailed}
        />
    );
}
