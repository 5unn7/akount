'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to error reporting service
        console.error('Account detail page error:', error);
    }, [error]);

    return (
        <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <CardTitle>Something went wrong</CardTitle>
                    </div>
                    <CardDescription>
                        We encountered an error while loading this account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {error.message || 'An unexpected error occurred'}
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={reset} variant="default">
                            Try again
                        </Button>
                        <Button onClick={() => window.history.back()} variant="outline">
                            Go back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
