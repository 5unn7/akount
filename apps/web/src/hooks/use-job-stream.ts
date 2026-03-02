'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Job Stream Hook (DEV-234)
 *
 * React hook for consuming SSE job status updates from /api/ai/jobs/:jobId/stream
 *
 * **Usage:**
 * ```tsx
 * function UploadStatus({ jobId }: { jobId: string }) {
 *   const { status, progress, result, error, isConnected } = useJobStream(jobId);
 *
 *   if (error) return <div>Error: {error}</div>;
 *   if (result) return <div>Complete: {JSON.stringify(result)}</div>;
 *
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       <ProgressBar value={progress} />
 *     </div>
 *   );
 * }
 * ```
 *
 * **Features:**
 * - Auto-connects to SSE endpoint when jobId changes
 * - Auto-reconnects on connection loss (max 3 attempts)
 * - Cleans up EventSource on unmount
 * - TypeScript-safe event types
 */

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'stalled';

export type JobEvent =
  | { event: 'connected'; jobId: string }
  | { event: 'initial'; state: JobStatus; progress: number; jobId: string }
  | { event: 'progress'; progress: number; jobId: string }
  | { event: 'active'; jobId: string }
  | { event: 'completed'; result: unknown; jobId: string }
  | { event: 'failed'; error: string; jobId: string }
  | { event: 'stalled'; jobId: string }
  | { event: 'timeout'; jobId: string }
  | { event: 'error'; error: string };

export interface UseJobStreamOptions {
  /** Enable auto-reconnect on connection loss (default: true) */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts (default: 3) */
  maxReconnectAttempts?: number;
  /** Initial reconnect delay in ms (default: 1000, doubles each attempt) */
  reconnectDelay?: number;
  /** Custom event handler for all events */
  onEvent?: (event: JobEvent) => void;
}

export interface UseJobStreamResult {
  /** Current job status */
  status: JobStatus | null;
  /** Current progress (0-100) */
  progress: number;
  /** Job result if completed */
  result: unknown | null;
  /** Error message if failed */
  error: string | null;
  /** Whether SSE connection is active */
  isConnected: boolean;
  /** Whether job is complete (success or failure) */
  isComplete: boolean;
  /** Manually reconnect to the stream */
  reconnect: () => void;
  /** Manually disconnect from the stream */
  disconnect: () => void;
}

export function useJobStream(
  jobId: string | null,
  options: UseJobStreamOptions = {}
): UseJobStreamResult {
  const {
    autoReconnect = true,
    maxReconnectAttempts = 3,
    reconnectDelay = 1000,
    onEvent,
  } = options;

  const [status, setStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!jobId) return;

    // Don't reconnect if already complete
    if (isComplete) return;

    // Clean up existing connection
    disconnect();

    try {
      const eventSource = new EventSource(`/api/ai/jobs/${jobId}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset on successful connection
      };

      eventSource.onerror = () => {
        setIsConnected(false);

        // Auto-reconnect if enabled and not at max attempts
        if (
          autoReconnect &&
          !isComplete &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as JobEvent;

          // Call custom event handler if provided
          onEvent?.(data);

          // Update state based on event type
          switch (data.event) {
            case 'connected':
              // Initial connection confirmation
              break;

            case 'initial':
              setStatus(data.state);
              setProgress(data.progress);
              break;

            case 'progress':
              setProgress(typeof data.progress === 'number' ? data.progress : 0);
              break;

            case 'active':
              setStatus('active');
              break;

            case 'completed':
              setStatus('completed');
              setProgress(100);
              setResult(data.result);
              setIsComplete(true);
              disconnect();
              break;

            case 'failed':
              setStatus('failed');
              setError(data.error);
              setIsComplete(true);
              disconnect();
              break;

            case 'stalled':
              setStatus('stalled');
              break;

            case 'timeout':
              setError('Job stream timeout');
              disconnect();
              break;

            case 'error':
              setError(data.error);
              setIsComplete(true);
              disconnect();
              break;
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [jobId, autoReconnect, maxReconnectAttempts, reconnectDelay, onEvent, isComplete, disconnect]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Connect when jobId changes
  useEffect(() => {
    if (jobId) {
      connect();
    }

    // Cleanup on unmount or jobId change
    return () => {
      disconnect();
    };
  }, [jobId, connect, disconnect]);

  return {
    status,
    progress,
    result,
    error,
    isConnected,
    isComplete,
    reconnect,
    disconnect,
  };
}
