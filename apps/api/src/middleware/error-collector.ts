import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

interface ErrorLogEntry {
  timestamp: string
  message: string
  stack: string[] // First 10 lines
  request: {
    url: string
    method: string
    tenantId?: string
  }
  count: number
}

const ERROR_LOG_PATH = join(process.cwd(), '.claude', 'runtime', 'error-log.json')
const MAX_ENTRIES = 50
const DEDUP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Error collector middleware (dev-only)
 * Wraps existing error handler to ALSO log unhandled/500 errors to runtime log
 */
export function collectError(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // Only collect unhandled errors (no statusCode) or 500 errors
  const is500 = 'statusCode' in error && error.statusCode === 500
  const isUnhandled = !('statusCode' in error)

  if (!is500 && !isUnhandled) {
    return
  }

  try {
    // Ensure runtime directory exists
    const runtimeDir = join(process.cwd(), '.claude', 'runtime')
    if (!existsSync(runtimeDir)) {
      mkdirSync(runtimeDir, { recursive: true })
    }

    // Load existing log (or initialize)
    let entries: ErrorLogEntry[] = []
    if (existsSync(ERROR_LOG_PATH)) {
      try {
        const raw = readFileSync(ERROR_LOG_PATH, 'utf-8')
        entries = JSON.parse(raw)
      } catch {
        // Corrupted file, start fresh
        entries = []
      }
    }

    // Extract stack trace (first 10 lines)
    const stackLines = error.stack?.split('\n').slice(0, 10) || []

    // Check for duplicate within 5-minute window
    const now = Date.now()
    const dedupThreshold = now - DEDUP_WINDOW_MS
    const existingEntry = entries.find(
      (e) =>
        e.message === error.message &&
        new Date(e.timestamp).getTime() > dedupThreshold
    )

    if (existingEntry) {
      // Increment count instead of duplicating
      existingEntry.count += 1
    } else {
      // Create new entry
      const newEntry: ErrorLogEntry = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: stackLines,
        request: {
          url: request.url,
          method: request.method,
          tenantId: request.tenantId,
        },
        count: 1,
      }

      entries.unshift(newEntry) // Add to front
    }

    // Rotate at 50 entries
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(0, MAX_ENTRIES)
    }

    // Write back to file
    writeFileSync(ERROR_LOG_PATH, JSON.stringify(entries, null, 2))
  } catch (collectorError) {
    // Never crash on logging errors
    request.log.error({ collectorError }, 'Error collector failed')
  }
}
