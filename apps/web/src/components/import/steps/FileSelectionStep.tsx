'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle } from 'lucide-react';
import { FileListEditor } from '../FileListEditor';
import type { ImportAccount, UploadFileItem } from '../types';

/**
 * File Selection Step — Drag-drop zone, validation, account assignment
 *
 * Responsibilities:
 * - File drag-drop and browse interface
 * - File validation (type, size, duplicates)
 * - Account assignment per file
 * - Error display
 *
 * Financial Clarity: glass cards, amber drag state, semantic tokens
 */

interface FileSelectionStepProps {
    accounts: ImportAccount[];
    files: UploadFileItem[];
    onFilesChange: (files: UploadFileItem[]) => void;
    onNext: () => void;
}

const VALID_EXTENSIONS = ['.csv', '.pdf', '.ofx', '.qfx', '.xlsx', '.xls'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

function validateFile(file: File): string | null {
    const fileName = file.name.toLowerCase();
    const isValid = VALID_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!isValid) return 'Invalid file type. Supported: CSV, PDF, OFX, XLSX';
    if (file.size > MAX_FILE_SIZE) return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`;
    return null;
}

export function FileSelectionStep({
    accounts,
    files,
    onFilesChange,
    onNext,
}: FileSelectionStepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [lastSelectedAccountId, setLastSelectedAccountId] = React.useState('');

    const addFiles = (newFiles: File[]) => {
        setError(null);

        const currentCount = files.length;
        if (currentCount + newFiles.length > MAX_FILES) {
            setError(`Maximum ${MAX_FILES} files per batch. You have ${currentCount}, tried to add ${newFiles.length}.`);
            return;
        }

        const validItems: UploadFileItem[] = [];
        const errors: string[] = [];

        for (const file of newFiles) {
            const validationError = validateFile(file);
            if (validationError) {
                errors.push(`${file.name}: ${validationError}`);
                continue;
            }

            // Skip duplicate filenames
            const alreadyAdded = files.some(f => f.file.name === file.name) ||
                validItems.some(f => f.file.name === file.name);
            if (alreadyAdded) continue;

            validItems.push({
                id: crypto.randomUUID(),
                file,
                accountId: lastSelectedAccountId,
                status: 'pending',
            });
        }

        if (errors.length > 0) {
            setError(errors.join('\n'));
        }

        if (validItems.length > 0) {
            onFilesChange([...files, ...validItems]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            addFiles(Array.from(e.target.files));
            // Reset input so same files can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAccountChange = (fileId: string, accountId: string) => {
        setLastSelectedAccountId(accountId);
        onFilesChange(files.map(f => f.id === fileId ? { ...f, accountId } : f));
    };

    const handleRemoveFile = (fileId: string) => {
        onFilesChange(files.filter(f => f.id !== fileId));
    };

    const handleReset = () => {
        onFilesChange([]);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImport = () => {
        const missingAccount = files.find(f => !f.accountId);
        if (missingAccount) {
            setError('Please assign an account to every file before uploading.');
            return;
        }
        onNext();
    };

    const allHaveAccounts = files.length > 0 && files.every(f => f.accountId);

    return (
        <div className="space-y-6">
            <Card variant="glass">
                <CardHeader>
                    <CardTitle className="font-heading font-normal">
                        Upload your bank statements to import transactions
                    </CardTitle>
                    <CardDescription>
                        Supports CSV, PDF, Excel, and OFX/QFX files. Up to {MAX_FILES} files, {MAX_FILE_SIZE / 1024 / 1024}MB each.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* No accounts warning */}
                    {accounts.length === 0 && (
                        <div className="p-4 bg-primary/[0.08] border border-primary/20 rounded-lg">
                            <p className="text-sm font-medium text-primary mb-1">No Accounts Found</p>
                            <p className="text-sm text-muted-foreground">
                                You need to create a bank account before importing transactions.{' '}
                                <a href="/banking/accounts" className="text-primary hover:text-ak-pri-hover underline">
                                    Create an account
                                </a>
                            </p>
                        </div>
                    )}

                    {/* Drop zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                            dragActive
                                ? 'border-primary bg-primary/[0.06] glow-primary'
                                : 'border-ak-border-2 hover:border-ak-border-3'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-ak-pri-dim rounded-full">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    {files.length === 0
                                        ? 'Drag and drop your files here, or click to browse'
                                        : 'Drop more files to add them'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    CSV, PDF, OFX, or XLSX up to 10MB each
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".csv,.pdf,.ofx,.qfx,.xlsx,.xls"
                                multiple
                                onChange={handleFileInputChange}
                            />

                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Browse Files
                            </Button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-start space-x-3 p-4 bg-ak-red/[0.08] border border-ak-red/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-ak-red flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-ak-red">Error</p>
                                <p className="text-sm text-ak-red/80 whitespace-pre-line">{error}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File list with per-file account assignment */}
            {files.length > 0 && (
                <>
                    <FileListEditor
                        files={files}
                        accounts={accounts}
                        onAccountChange={handleAccountChange}
                        onRemoveFile={handleRemoveFile}
                        onAddMore={() => fileInputRef.current?.click()}
                    />

                    {/* Import button */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            className="rounded-lg border-ak-border-2"
                            onClick={handleReset}
                        >
                            Clear All
                        </Button>
                        <Button
                            className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleImport}
                            disabled={!allHaveAccounts || accounts.length === 0}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import {files.length} File{files.length !== 1 ? 's' : ''}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
