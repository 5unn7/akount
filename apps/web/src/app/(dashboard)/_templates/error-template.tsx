'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * TEMPLATE: Error boundary for dashboard pages
 *
 * INSTRUCTIONS:
 * 1. Copy this file to your page directory as error.tsx
 * 2. Rename the export function to match your page (e.g., BudgetsError)
 * 3. Update the page title in the h2 tag (line 28)
 * 4. Update the error message in CardTitle (line 35)
 * 5. Update the comment to describe your specific page
 *
 * EXAMPLE:
 * For /planning/budgets/error.tsx:
 * - Export: BudgetsError
 * - Title: "Budgets"
 * - Message: "Failed to load budgets"
 * - Comment: "Error boundary for budgets page"
 */
export default function PageError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Page Title</h2>
            </div>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Failed to load page
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {error.message || 'An error occurred while loading this page.'}
                    </p>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground">
                            Error ID: {error.digest}
                        </p>
                    )}
                    <Button onClick={reset} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
