'use client';

import { useState } from 'react';
import { Download, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DataExportCard() {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setError(null);
        setIsExporting(true);

        try {
            const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
            const token = await clerk?.session?.getToken();

            if (!token) {
                throw new Error('Not authenticated — please sign in');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/system/data-export`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Export failed' }));
                throw new Error(err.error || err.message || 'Export failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const disposition = response.headers.get('Content-Disposition');
            const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
            a.download = filenameMatch?.[1] || `akount-backup-${new Date().toISOString().split('T')[0]}.zip`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Data Export
                </CardTitle>
                <CardDescription>
                    Download a full backup of your data as a ZIP archive containing CSV files.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-ak-green" />
                    <p>
                        Your export includes all entities, accounts, transactions, invoices, bills,
                        payments, journal entries, and categories. Soft-deleted records are included
                        for a complete backup.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="gap-2"
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            Download All Data
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
