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
 * Error boundary for tax rates page
 * Catches and displays errors with retry option
 */
export default function TaxRatesError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Tax rates page error:', error);
    }, [error]);

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Tax Rates</h2>
            </div>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Failed to load tax rates
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {error.message || 'An error occurred while loading tax rates.'}
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
