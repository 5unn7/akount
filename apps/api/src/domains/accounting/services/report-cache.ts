/**
 * Report Cache Service
 *
 * In-memory cache for financial reports with bounded growth and active eviction.
 * Prevents memory exhaustion while providing performance benefits for expensive queries.
 *
 * Security features:
 * - Tenant-scoped keys (prevents cross-tenant cache poisoning)
 * - Bounded to 500 entries (prevents memory exhaustion)
 * - Active sweep every 60s (removes expired entries)
 * - TTL-based expiration (default 5 minutes)
 *
 * Performance features:
 * - O(1) cache hit/miss
 * - LRU-like eviction (deletes oldest when at capacity)
 * - Configurable TTL via REPORT_CACHE_TTL_MS env var
 */

interface CacheEntry {
  data: unknown;
  expiry: number; // Unix timestamp in milliseconds
}

export class ReportCache {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_ENTRIES = 500;
  private readonly DEFAULT_TTL_MS = parseInt(
    process.env.REPORT_CACHE_TTL_MS || '300000',
    10
  ); // 5 minutes
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup (active eviction)
    this.cleanupTimer = setInterval(() => this.sweep(), 60_000); // Every 60 seconds
    this.cleanupTimer.unref(); // Don't block process exit
  }

  /**
   * Get cached report
   * @param tenantId Tenant ID (required for security)
   * @param key Cache key (report type + params)
   * @returns Cached data or null if not found/expired
   */
  get(tenantId: string, key: string): unknown | null {
    if (!tenantId) {
      throw new Error('tenantId required for cache access');
    }

    const fullKey = `${tenantId}:${key}`;
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return null; // Cache miss
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(fullKey); // Lazy eviction
      return null;
    }

    return entry.data;
  }

  /**
   * Store report in cache
   * @param tenantId Tenant ID (required for security)
   * @param key Cache key (report type + params)
   * @param data Report data to cache
   * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
   */
  set(tenantId: string, key: string, data: unknown, ttlMs = this.DEFAULT_TTL_MS): void {
    if (!tenantId) {
      throw new Error('tenantId required for cache access');
    }

    // Evict oldest if at capacity (LRU approximation)
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const fullKey = `${tenantId}:${key}`;
    this.cache.set(fullKey, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate cached reports matching a pattern
   * @param tenantId Tenant ID (required for security)
   * @param pattern Regex pattern to match cache keys
   */
  invalidate(tenantId: string, pattern: RegExp): void {
    if (!tenantId) {
      throw new Error('tenantId required for cache invalidation');
    }

    // Only iterate keys for this tenant (security + performance)
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`) && pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache (use sparingly)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Active eviction - remove expired entries
   * Called every 60 seconds by cleanup timer
   */
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cleanup on shutdown
   * Call this in Fastify onClose hook
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics (for monitoring)
   */
  stats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_ENTRIES,
    };
  }
}

/**
 * Singleton instance
 */
export const reportCache = new ReportCache();
