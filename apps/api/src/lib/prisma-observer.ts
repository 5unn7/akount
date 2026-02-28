import { PrismaClient } from '@akount/db';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Prisma Query Observer
 * Monitors query performance and detects N+1 patterns when PRISMA_QUERY_LOG=true
 */

interface QueryLogEntry {
    timestamp: string;
    query: string; // Truncated to 200 chars
    params: string; // Sanitized (no PII)
    duration: number; // milliseconds
    model: string | null;
    operation: string | null;
    fingerprint: string; // Normalized query for duplicate detection
    isSlowQuery: boolean; // >100ms
    isN1Suspect: boolean; // Same fingerprint appeared >5x
}

interface QueryLog {
    entries: QueryLogEntry[];
    metadata: {
        lastRotation: string;
        totalQueriesLogged: number;
    };
}

const SLOW_QUERY_THRESHOLD_MS = 100;
const N1_THRESHOLD = 5;
const MAX_LOG_ENTRIES = 50;
const LOG_FILE_PATH = join(process.cwd(), '.claude', 'runtime', 'query-log.json');

// In-memory fingerprint tracker for N+1 detection within a request
// Reset periodically to avoid unbounded growth
const fingerprintTracker = new Map<string, number>();
let lastReset = Date.now();
const RESET_INTERVAL_MS = 60000; // Reset every 60 seconds

/**
 * Generate query fingerprint for duplicate detection
 * Normalizes query by removing specific values
 */
function generateFingerprint(query: string): string {
    return query
        .replace(/'\w+'/g, "'?'") // Replace string literals
        .replace(/\d+/g, '?') // Replace numbers
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

/**
 * Sanitize params to remove sensitive data
 */
function sanitizeParams(params: string): string {
    try {
        const parsed = JSON.parse(params);
        // Remove potential PII fields
        const sanitized = JSON.stringify(parsed)
            .replace(/"email":"[^"]*"/g, '"email":"***"')
            .replace(/"password":"[^"]*"/g, '"password":"***"')
            .replace(/"token":"[^"]*"/g, '"token":"***"')
            .replace(/"clerkUserId":"[^"]*"/g, '"clerkUserId":"***"');
        return sanitized.length > 200 ? sanitized.substring(0, 197) + '...' : sanitized;
    } catch {
        return params.length > 200 ? params.substring(0, 197) + '...' : params;
    }
}

/**
 * Extract model and operation from Prisma query event
 */
function extractModelAndOperation(target: string): { model: string | null; operation: string | null } {
    // Example target: "MyModel.findMany" or "MyModel.create"
    const parts = target.split('.');
    if (parts.length === 2) {
        return { model: parts[0], operation: parts[1] };
    }
    return { model: null, operation: null };
}

/**
 * Read existing query log
 */
function readQueryLog(): QueryLog {
    if (!existsSync(LOG_FILE_PATH)) {
        return {
            entries: [],
            metadata: {
                lastRotation: new Date().toISOString(),
                totalQueriesLogged: 0,
            },
        };
    }

    try {
        const content = readFileSync(LOG_FILE_PATH, 'utf-8');
        return JSON.parse(content);
    } catch {
        // Corrupted file, start fresh
        return {
            entries: [],
            metadata: {
                lastRotation: new Date().toISOString(),
                totalQueriesLogged: 0,
            },
        };
    }
}

/**
 * Write query log with rotation
 */
function writeQueryLog(log: QueryLog): void {
    // Ensure directory exists
    const dir = join(process.cwd(), '.claude', 'runtime');
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    // Rotate if exceeds max entries (keep last 50)
    if (log.entries.length > MAX_LOG_ENTRIES) {
        log.entries = log.entries.slice(-MAX_LOG_ENTRIES);
        log.metadata.lastRotation = new Date().toISOString();
    }

    writeFileSync(LOG_FILE_PATH, JSON.stringify(log, null, 2), 'utf-8');
}

/**
 * Track query fingerprint and detect N+1 patterns
 */
function trackFingerprint(fingerprint: string): { count: number; isN1Suspect: boolean } {
    // Reset tracker periodically to avoid unbounded growth
    const now = Date.now();
    if (now - lastReset > RESET_INTERVAL_MS) {
        fingerprintTracker.clear();
        lastReset = now;
    }

    const currentCount = (fingerprintTracker.get(fingerprint) || 0) + 1;
    fingerprintTracker.set(fingerprint, currentCount);

    return {
        count: currentCount,
        isN1Suspect: currentCount > N1_THRESHOLD,
    };
}

/**
 * Log query event
 */
function logQueryEvent(event: { query: string; params: string; duration: number; target: string }): void {
    const fingerprint = generateFingerprint(event.query);
    const { model, operation } = extractModelAndOperation(event.target);
    const isSlowQuery = event.duration > SLOW_QUERY_THRESHOLD_MS;
    const { isN1Suspect } = trackFingerprint(fingerprint);

    // Only log if slow query OR N+1 suspect
    if (!isSlowQuery && !isN1Suspect) {
        return;
    }

    const entry: QueryLogEntry = {
        timestamp: new Date().toISOString(),
        query: event.query.length > 200 ? event.query.substring(0, 197) + '...' : event.query,
        params: sanitizeParams(event.params),
        duration: event.duration,
        model,
        operation,
        fingerprint,
        isSlowQuery,
        isN1Suspect,
    };

    const log = readQueryLog();
    log.entries.push(entry);
    log.metadata.totalQueriesLogged += 1;
    writeQueryLog(log);
}

/**
 * Attach query observer to Prisma client
 * Only activates when PRISMA_QUERY_LOG=true
 */
export function attachPrismaObserver(prisma: PrismaClient): void {
    // Zero overhead when env var not set
    if (process.env.PRISMA_QUERY_LOG !== 'true') {
        return;
    }

    // Check if $on is available (not in Edge Runtime)
    if (typeof prisma.$on !== 'function') {
        console.warn('Prisma query observer not available in Edge Runtime');
        return;
    }

    try {
        prisma.$on('query', (event: any) => {
            logQueryEvent({
                query: event.query,
                params: event.params,
                duration: event.duration,
                target: event.target,
            });
        });

        console.log('✅ Prisma query observer attached (PRISMA_QUERY_LOG=true)');
    } catch (error) {
        console.error('Failed to attach Prisma query observer:', error);
    }
}
