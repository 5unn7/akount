/**
 * Global error tracking utility for Akount
 *
 * Consolidates error logging and reporting across the application.
 * In production, this can be extended to integrate with services like Sentry.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { reportError } from '@/lib/error-tracking';
 *
 * useEffect(() => {
 *   reportError(error, {
 *     context: 'journal-entries-page',
 *     severity: 'high',
 *     digest: error.digest,
 *   });
 * }, [error]);
 * ```
 */

export interface ErrorContext {
    /**
     * Component or page where error occurred
     * @example "journal-entries-page", "invoice-form", "report-view"
     */
    context?: string;

    /**
     * Severity level for alerting
     * @default 'medium'
     */
    severity?: 'low' | 'medium' | 'high' | 'critical';

    /**
     * Optional error digest from Next.js error boundary
     */
    digest?: string;

    /**
     * Additional contextual data
     */
    metadata?: Record<string, unknown>;
}

/**
 * Report an error to the global error tracking system.
 *
 * In development, logs to console.
 * In production, can be integrated with Sentry or other error tracking services.
 *
 * @param error - The error object to report
 * @param context - Optional context about the error
 */
export function reportError(error: Error, context?: ErrorContext): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        message: error.message,
        stack: error.stack,
        context: context?.context || 'unknown',
        severity: context?.severity || 'medium',
        digest: context?.digest,
        metadata: context?.metadata,
    };

    // Development: log to console
    if (process.env.NODE_ENV === 'development') {
        console.error('[Error Tracking]', errorInfo);
        return;
    }

    // Production: send to error tracking service
    // TODO: Integrate with Sentry or similar service
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { context: context?.context },
    //     level: context?.severity,
    //     contexts: { metadata: context?.metadata },
    //   });
    // }

    // For now, log to console in production too (can be replaced)
    console.error('[Error Tracking]', errorInfo);
}

/**
 * Safely report an error without throwing
 * Useful for error boundaries and async handlers
 *
 * @param error - The error object
 * @param fallbackMessage - Message to use if error.message is empty
 * @param context - Optional error context
 */
export function safeReportError(
    error: unknown,
    fallbackMessage = 'An unexpected error occurred',
    context?: ErrorContext
): string {
    const actualError = error instanceof Error ? error : new Error(fallbackMessage);

    if (!(error instanceof Error)) {
        actualError.stack = undefined;
    }

    reportError(actualError, context);
    return actualError.message || fallbackMessage;
}
