'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadProgressList } from '../UploadProgressList';
import { readCsvHeaders, detectMappings } from '../ColumnMappingEditor';
import type { UploadFileItem, ImportResult } from '../types';

/**
 * Upload Progress Step — Sequential file upload with progress tracking
 *
 * Responsibilities:
 * - Sequential upload loop (one file at a time)
 * - CSV column mapping auto-detection
 * - Progress display via UploadProgressList
 * - Result aggregation
 *
 * Runs automatically on mount, calls onComplete when all files finish.
 */

interface UploadProgressStepProps {
    files: UploadFileItem[];
    onComplete: (updatedFiles: UploadFileItem[]) => void;
    onError: (error: string) => void;
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
    onError,
}: UploadProgressStepProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        runBatchUpload();
    }, []); // Run once on mount

    const runBatchUpload = async () => {
        // Get Clerk auth token once
        let token: string;
        try {
            const clerk = (window as any).Clerk;
            token = await clerk?.session?.getToken();
            if (!token) throw new Error('Not authenticated');
        } catch {
            onError('Not authenticated. Please sign in again.');
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const updatedFiles = [...files];

        for (let i = 0; i < updatedFiles.length; i++) {
            setCurrentIndex(i);
            const item = updatedFiles[i];

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
                    sourceType: fileType === 'pdf' ? 'PDF' : 'CSV',
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

        // All uploads complete
        onComplete(updatedFiles);
    };

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
            <CardContent>
                <UploadProgressList
                    files={files}
                    currentIndex={currentIndex}
                />
            </CardContent>
        </Card>
    );
}
