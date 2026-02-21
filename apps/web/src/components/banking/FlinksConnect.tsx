'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { createBankConnectionAction } from '@/app/(dashboard)/banking/accounts/actions';
import type { BankConnectionResult, ConnectionAccount } from '@/lib/api/accounts';

interface FlinksConnectProps {
    entityId: string;
    connectUrl?: string;
    onSuccess?: (result: BankConnectionResult) => void;
    onCancel?: () => void;
    onError?: (error: string) => void;
}

type FlinksState = 'loading' | 'connecting' | 'processing' | 'success' | 'error';

/**
 * Flinks Connect iframe wrapper.
 *
 * Renders the Flinks Connect iframe for bank authentication.
 * On REDIRECT: extracts loginId and calls server action.
 * On CANCEL: notifies parent.
 *
 * Must be loaded via `next/dynamic` with `ssr: false`.
 */
export function FlinksConnect({
    entityId,
    connectUrl = 'https://toolbox-iframe.private.fin.ag/v2/',
    onSuccess,
    onCancel,
    onError,
}: FlinksConnectProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [state, setState] = useState<FlinksState>('loading');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BankConnectionResult | null>(null);
    const [isPending, startTransition] = useTransition();

    // Derive allowed origin from connectUrl for postMessage validation
    const allowedOrigin = new URL(connectUrl).origin;

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            // CRITICAL: Validate origin to prevent cross-site attacks
            if (event.origin !== allowedOrigin) {
                return;
            }

            const data = event.data;
            if (!data || typeof data !== 'object') return;

            // Flinks sends events like { step: 'REDIRECT', loginId: '...' }
            if (data.step === 'REDIRECT' && data.loginId) {
                setState('processing');

                startTransition(async () => {
                    const actionResult = await createBankConnectionAction(
                        data.loginId,
                        entityId,
                    );

                    if (!actionResult.success) {
                        setState('error');
                        setError(actionResult.error);
                        onError?.(actionResult.error);
                        return;
                    }

                    setState('success');
                    setResult(actionResult.data);
                    onSuccess?.(actionResult.data);
                });
            }

            // User cancelled in iframe
            if (data.step === 'COMPONENT_CLOSE' || data.step === 'CANCEL') {
                onCancel?.();
            }
        },
        [allowedOrigin, entityId, onSuccess, onCancel, onError],
    );

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    // Success view
    if (state === 'success' && result) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-ak-green" />
                    <div>
                        <h3 className="font-heading font-normal text-lg">Bank Connected!</h3>
                        <p className="text-sm text-muted-foreground">
                            {result.accountCount} account{result.accountCount !== 1 ? 's' : ''} connected,{' '}
                            {result.transactionCount} transaction{result.transactionCount !== 1 ? 's' : ''} synced
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {result.accounts.map((account: ConnectionAccount) => (
                        <GlowCard key={account.id} variant="glass" className="border-ak-border">
                            <CardContent className="flex items-center justify-between p-3">
                                <span className="text-sm font-medium">{account.name}</span>
                                <span className="text-sm font-mono font-bold">
                                    {formatCurrency(account.currentBalance, account.currency)}
                                </span>
                            </CardContent>
                        </GlowCard>
                    ))}
                </div>
            </div>
        );
    }

    // Error view
    if (state === 'error') {
        return (
            <div className="glass rounded-xl border-destructive p-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <p className="text-sm font-medium">Connection Failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setState('connecting');
                        setError(null);
                    }}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    // Processing view (after iframe redirect, calling server action)
    if (state === 'processing' || isPending) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Connecting your accounts...</p>
                <p className="text-xs text-muted-foreground">This may take a moment</p>
            </div>
        );
    }

    // Iframe view (loading + connecting)
    return (
        <div className="relative w-full" style={{ minHeight: 500 }}>
            {state === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-full h-full rounded-lg" />
                </div>
            )}
            <iframe
                ref={iframeRef}
                src={connectUrl}
                title="Connect your bank account"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="w-full border-0 rounded-lg"
                style={{ height: 500 }}
                onLoad={() => setState('connecting')}
            />
        </div>
    );
}
