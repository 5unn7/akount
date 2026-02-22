'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Link
                href="/business/vendors"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Vendors
            </Link>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Failed to load vendor
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground">
                            Error ID: {error.digest}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={reset} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Try again
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href="/business/vendors">Back to Vendors</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
