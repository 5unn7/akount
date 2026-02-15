'use client';

import { CheckCircle2, XCircle, Circle, Loader2, FileText } from 'lucide-react';
import type { UploadFileItem } from './types';

interface UploadProgressListProps {
    files: UploadFileItem[];
    currentIndex: number;
}

export function UploadProgressList({ files, currentIndex }: UploadProgressListProps) {
    const completedCount = files.filter((f) => f.status === 'success').length;
    const errorCount = files.filter((f) => f.status === 'error').length;

    return (
        <div className="space-y-4">
            {/* Progress summary */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Uploading file {Math.min(currentIndex + 1, files.length)} of {files.length}...
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {completedCount > 0 && (
                        <span className="flex items-center gap-1 text-ak-green">
                            <CheckCircle2 className="h-3 w-3" /> {completedCount} done
                        </span>
                    )}
                    {errorCount > 0 && (
                        <span className="flex items-center gap-1 text-ak-red">
                            <XCircle className="h-3 w-3" /> {errorCount} failed
                        </span>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${(Math.min(currentIndex + 1, files.length) / files.length) * 100}%`,
                    }}
                />
            </div>

            {/* File list */}
            <div className="space-y-1.5">
                {files.map((item, idx) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            item.status === 'uploading'
                                ? 'glass-2 border border-primary/20'
                                : 'glass'
                        }`}
                    >
                        {/* Status icon */}
                        <div className="flex-shrink-0">
                            {item.status === 'pending' && (
                                <Circle className="h-4 w-4 text-white/20" />
                            )}
                            {item.status === 'uploading' && (
                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            )}
                            {item.status === 'success' && (
                                <CheckCircle2 className="h-4 w-4 text-ak-green" />
                            )}
                            {item.status === 'error' && (
                                <XCircle className="h-4 w-4 text-ak-red" />
                            )}
                        </div>

                        {/* File name */}
                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className={`text-sm flex-1 truncate ${
                            item.status === 'uploading' ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>
                            {item.file.name}
                        </span>

                        {/* Result info */}
                        {item.status === 'success' && item.result && (
                            <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                                {item.result.processedRows} imported
                                {item.result.duplicateRows > 0 && (
                                    <span className="text-primary">, {item.result.duplicateRows} dup</span>
                                )}
                            </span>
                        )}

                        {item.status === 'error' && item.error && (
                            <span className="text-xs text-ak-red truncate max-w-[200px] flex-shrink-0">
                                {item.error}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
