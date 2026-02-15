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
 * Dashboard-wide error boundary fallback
 * Cascades to all child routes that don't define their own error.tsx
 */
export default function DashboardError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Something went wrong
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {error.message || 'An unexpected error occurred. Please try again.'}
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
