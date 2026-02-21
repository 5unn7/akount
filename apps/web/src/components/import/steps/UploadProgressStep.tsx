'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, XCircle } from 'lucide-react';
import { UploadProgressList } from '../UploadProgressList';
import { readCsvHeaders, detectMappings } from '../ColumnMappingEditor';
import type { UploadFileItem, ImportResult } from '../types';

/**
 * Upload Progress Step — Sequential file upload with progress tracking
 *
 * - Sequential upload loop (one file at a time)
 * - CSV column mapping auto-detection
 * - Per-file error tracking (no silent reset)
 * - Cancel button to return to file selection
 * - Auth failure shown inline with retry guidance
 */

interface UploadProgressStepProps {
    files: UploadFileItem[];
    onComplete: (updatedFiles: UploadFileItem[]) => void;
    onCancel: () => void;
}

function getFileType(name: string): 'csv' | 'xlsx' | 'pdf' {
    const lower = name.toLowerCase();
    if (lower.endsWith('.csv')) return 'csv';
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
    return 'pdf';
}

export function UploadProgressStep({
    files,
    onComplete,
    onCancel,
}: UploadProgressStepProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const cancelledRef = useRef(false);

    useEffect(() => {
        cancelledRef.current = false;
        runBatchUpload();
        return () => { cancelledRef.current = true; };
    }, []); // Run once on mount

    const runBatchUpload = async () => {
        setIsUploading(true);
        setAuthError(null);

        // Get Clerk auth token once
        let token: string;
        try {
            const clerk = (window as unknown as { Clerk?: { session?: { getToken(): Promise<string> } } }).Clerk;
            const t = await clerk?.session?.getToken();
            if (!t) throw new Error('Not authenticated');
            token = t;
        } catch {
            setAuthError('Not authenticated. Please sign in again and retry.');
            setIsUploading(false);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const updatedFiles = [...files];

        for (let i = 0; i < updatedFiles.length; i++) {
            if (cancelledRef.current) break;

            setCurrentIndex(i);
            const item = updatedFiles[i];

            // Skip already-successful files (for retry scenarios)
            if (item.status === 'success') continue;

            // Mark current as uploading
            updatedFiles[i] = { ...item, status: 'uploading' };

            try {
                const fileType = getFileType(item.file.name);

                // IMPORTANT: Fields must come BEFORE the file for Fastify multipart
                const formData = new FormData();
                formData.append('accountId', item.accountId);

                // Auto-detect column mappings for tabular formats (CSV, XLSX)
                if (fileType === 'csv') {
                    try {
                        const { columns } = await readCsvHeaders(item.file);
                        const mappings = detectMappings(columns);
                        formData.append('columnMappings', JSON.stringify(mappings));
                    } catch {
                        // If header detection fails, let backend try without mappings
                    }
                }

                formData.append('file', item.file);

                const endpointMap = {
                    csv: '/api/banking/imports/csv',
                    xlsx: '/api/banking/imports/xlsx',
                    pdf: '/api/banking/imports/pdf'
                };
                const endpoint = endpointMap[fileType];
                const response = await fetch(`${apiUrl}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(errorData.message || errorData.error || 'Upload failed');
                }

                const data = await response.json();

                const result: ImportResult = {
                    id: data.id,
                    sourceType: fileType === 'pdf' ? 'PDF' : fileType === 'xlsx' ? 'XLSX' : 'CSV',
                    sourceFileName: item.file.name,
                    status: data.status,
                    totalRows: data.stats?.total ?? 0,
                    processedRows: data.stats?.imported ?? 0,
                    duplicateRows: data.stats?.duplicates ?? 0,
                    errorRows: data.stats?.skipped ?? 0,
                };

                updatedFiles[i] = { ...updatedFiles[i], status: 'success', result };
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                updatedFiles[i] = {
                    ...updatedFiles[i],
                    status: 'error',
                    error: errorMessage,
                };
            }
        }

        setIsUploading(false);

        // Always proceed to results — per-file status shown there
        if (!cancelledRef.current) {
            onComplete(updatedFiles);
        }
    };

    // Auth error state — show inline with guidance
    if (authError) {
        return (
            <Card variant="glass">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3 p-4 bg-ak-red-dim border border-ak-red/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-ak-red flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-ak-red">Authentication Error</p>
                            <p className="text-xs text-ak-red/80 mt-1">{authError}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            className="rounded-lg border-ak-border-2"
                            onClick={onCancel}
                        >
                            Back to Files
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="glass">
            <CardHeader>
                <CardTitle className="font-heading font-normal">
                    Importing Statements...
                </CardTitle>
                <CardDescription>
                    Parsing files, detecting duplicates, and categorizing transactions.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <UploadProgressList
                    files={files}
                    currentIndex={currentIndex}
                />

                {/* Cancel button */}
                {isUploading && (
                    <div className="flex justify-end pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-ak-red"
                            onClick={() => {
                                cancelledRef.current = true;
                                onCancel();
                            }}
                        >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Cancel
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
