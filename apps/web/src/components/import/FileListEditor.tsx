'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileText, X, Plus } from 'lucide-react';
import type { UploadFileItem, ImportAccount } from './types';

interface FileListEditorProps {
    files: UploadFileItem[];
    accounts: ImportAccount[];
    onAccountChange: (fileId: string, accountId: string) => void;
    onRemoveFile: (fileId: string) => void;
    onAddMore: () => void;
    disabled?: boolean;
}

function getFileType(name: string): 'CSV' | 'PDF' | 'OFX' | 'XLSX' {
    const lower = name.toLowerCase();
    if (lower.endsWith('.csv')) return 'CSV';
    if (lower.endsWith('.pdf')) return 'PDF';
    if (lower.endsWith('.ofx') || lower.endsWith('.qfx')) return 'OFX';
    return 'XLSX';
}

const TYPE_COLORS: Record<string, string> = {
    CSV: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20',
    PDF: 'bg-ak-red/10 text-ak-red border-ak-red/20',
    OFX: 'bg-ak-purple/10 text-ak-purple border-ak-purple/20',
    XLSX: 'bg-ak-green/10 text-ak-green border-ak-green/20',
};

export function FileListEditor({
    files,
    accounts,
    onAccountChange,
    onRemoveFile,
    onAddMore,
    disabled = false,
}: FileListEditorProps) {
    const allHaveAccounts = files.every((f) => f.accountId);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                </p>
                {!allHaveAccounts && (
                    <p className="text-xs text-primary">
                        Assign an account to each file
                    </p>
                )}
            </div>

            {files.map((item) => {
                const fileType = getFileType(item.file.name);
                return (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 glass rounded-lg border border-ak-border"
                    >
                        {/* File info */}
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">
                                    {item.file.name}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1.5 py-0 rounded-md ${TYPE_COLORS[fileType]}`}
                                >
                                    {fileType}
                                </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {(item.file.size / 1024).toFixed(1)} KB
                            </span>
                        </div>

                        {/* Account selector */}
                        <Select
                            value={item.accountId || undefined}
                            onValueChange={(val) => onAccountChange(item.id, val)}
                            disabled={disabled}
                        >
                            <SelectTrigger className="w-[200px] h-8 text-xs glass-2 rounded-lg border-ak-border focus:ring-primary">
                                <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        <span className="text-xs">
                                            {account.name} ({account.currency})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Remove button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-ak-red hover:bg-ak-red/10"
                            onClick={() => onRemoveFile(item.id)}
                            disabled={disabled}
                            aria-label={`Remove ${item.file.name}`}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                );
            })}

            {/* Add more files */}
            {files.length < 10 && (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg border-dashed border-ak-border-2 text-muted-foreground hover:text-foreground hover:border-ak-border-3"
                    onClick={onAddMore}
                    disabled={disabled}
                >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Add more files
                </Button>
            )}

            {files.length >= 10 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                    Maximum 10 files per batch
                </p>
            )}
        </div>
    );
}
