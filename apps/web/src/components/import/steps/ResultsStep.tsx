'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { BatchImportResults } from '../BatchImportResults';
import { revalidateAfterImport } from '@/app/(dashboard)/banking/transactions/actions';
import type { ImportAccount, UploadFileItem, BatchImportResult } from '../types';

/**
 * Results Step — Display import results with aggregate stats
 *
 * Shows current batch results + collapsible previous batch summaries.
 */

interface ResultsStepProps {
    files: UploadFileItem[];
    accounts: ImportAccount[];
    onReset: () => void;
    onRetryFailed: () => void;
    completedBatches?: UploadFileItem[][];
}

function buildBatchStats(files: UploadFileItem[]) {
    const successFiles = files.filter(f => f.status === 'success');
    return {
        totalFiles: files.length,
        successFiles: successFiles.length,
        totalTransactions: successFiles.reduce((sum, f) => sum + (f.result?.totalRows ?? 0), 0),
        imported: successFiles.reduce((sum, f) => sum + (f.result?.processedRows ?? 0), 0),
        duplicates: successFiles.reduce((sum, f) => sum + (f.result?.duplicateRows ?? 0), 0),
        errors: successFiles.reduce((sum, f) => sum + (f.result?.errorRows ?? 0), 0),
    };
}

export function ResultsStep({
    files,
    accounts,
    onReset,
    onRetryFailed,
    completedBatches = [],
}: ResultsStepProps) {
    const [showPrevious, setShowPrevious] = useState(false);

    // Revalidate dashboard paths so imported data shows immediately
    useEffect(() => {
        revalidateAfterImport();
    }, []);

    const aggregate = buildBatchStats(files);

    const batchResult: BatchImportResult = {
        files,
        aggregateStats: aggregate,
    };

    return (
        <div className="space-y-4">
            {/* Previous batch summaries (collapsed) */}
            {completedBatches.length > 0 && (
                <div className="glass rounded-lg border border-ak-border">
                    <button
                        type="button"
                        onClick={() => setShowPrevious(prev => !prev)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPrevious ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>
                            {completedBatches.length} previous batch{completedBatches.length !== 1 ? 'es' : ''}
                        </span>
                    </button>
                    {showPrevious && (
                        <div className="px-4 pb-3 space-y-2">
                            {completedBatches.map((batch, idx) => {
                                const stats = buildBatchStats(batch);
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2.5 px-3 py-2 glass-2 rounded-lg text-xs"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-ak-green shrink-0" />
                                        <span className="text-foreground font-medium">
                                            Batch {idx + 1}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {stats.successFiles}/{stats.totalFiles} files
                                        </span>
                                        <span className="text-muted-foreground font-mono">
                                            {stats.imported} transactions
                                        </span>
                                        {stats.duplicates > 0 && (
                                            <span className="text-muted-foreground font-mono">
                                                ({stats.duplicates} dupes)
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <BatchImportResults
                batchResult={batchResult}
                accounts={accounts}
                onAddMoreFiles={onReset}
                onRetryFailed={onRetryFailed}
            />
        </div>
    );
}
