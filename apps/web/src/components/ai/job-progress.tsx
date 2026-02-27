'use client';

import { useJobStream } from '@/hooks/use-job-stream';
import { ProgressBar, Badge, Button } from '@akount/ui';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Job Progress Component (DEV-234 Example)
 *
 * Displays real-time job status and progress using the useJobStream hook.
 *
 * @example
 * ```tsx
 * <JobProgress jobId="12345" onComplete={(result) => console.log('Done!', result)} />
 * ```
 */
export interface JobProgressProps {
  /** BullMQ job ID */
  jobId: string;
  /** Job title/description */
  title?: string;
  /** Callback when job completes successfully */
  onComplete?: (result: unknown) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
}

export function JobProgress({ jobId, title, onComplete, onError }: JobProgressProps) {
  const { status, progress, result, error, isConnected, isComplete, reconnect } =
    useJobStream(jobId, {
      autoReconnect: true,
      maxReconnectAttempts: 3,
      onEvent: (event) => {
        if (event.event === 'completed' && onComplete) {
          onComplete(event.result);
        }
        if (event.event === 'failed' && onError) {
          onError(event.error);
        }
      },
    });

  // Status icon
  const StatusIcon = () => {
    if (error || status === 'failed') {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-ak-green" />;
    }
    if (status === 'stalled') {
      return <AlertCircle className="h-5 w-5 text-ak-red" />;
    }
    if (status === 'active') {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
    return <Loader2 className="h-5 w-5 text-muted-foreground" />;
  };

  // Status badge variant
  const getStatusVariant = (): 'default' | 'error' | 'success' | 'warning' | 'info' => {
    if (error || status === 'failed') return 'error';
    if (status === 'completed') return 'success';
    if (status === 'stalled') return 'error';
    return 'info';
  };

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon />
          <div>
            <p className="text-sm font-medium">{title || 'Processing...'}</p>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant()} className="text-xs">
                {status || 'waiting'}
              </Badge>
              {!isConnected && !isComplete && (
                <Badge variant="warning" className="text-xs">
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Reconnect button (only show if disconnected and not complete) */}
        {!isConnected && !isComplete && (
          <Button variant="secondary" size="sm" onClick={reconnect}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {!isComplete && (
        <div className="space-y-2">
          <ProgressBar value={progress} size="md" />
          <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Result preview (if completed) */}
      {status === 'completed' && (
        <div className="bg-ak-green-dim border border-ak-green/20 rounded-lg p-3">
          <p className="text-sm text-ak-green">Job completed successfully</p>
        </div>
      )}

      {/* Debug info */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Debug Info</summary>
        <pre className="mt-2 p-2 bg-ak-bg-2 rounded text-[10px] overflow-auto">
          {JSON.stringify({ jobId, status, progress, isConnected, isComplete }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
