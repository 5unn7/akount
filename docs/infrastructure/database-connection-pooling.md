# Database Connection Pooling Configuration

**Task:** ARCH-9
**Date:** 2026-02-26
**Status:** Documented (requires production deployment)

---

## Prisma Connection Pool Settings

Prisma's connection pool is configured via DATABASE_URL query parameters:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=50&pool_timeout=30&connect_timeout=10"
```

### Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `connection_limit` | 50 | Maximum connections to database |
| `pool_timeout` | 30 | Timeout (seconds) waiting for connection from pool |
| `connect_timeout` | 10 | Timeout (seconds) for initial connection |

### Default Values (Without Config)

- **connection_limit:** `num_physical_cpus * 2 + 1` (typically ~9 connections)
- **pool_timeout:** 10 seconds
- **connect_timeout:** 5 seconds

### Scale Impact

| User Scale | Default (9 connections) | Configured (50 connections) |
|-----------|-------------------------|------------------------------|
| 10K users | ⚠️ Pool exhaustion likely | ✅ Adequate |
| 50K users | ❌ Frequent P1001 errors | ✅ Adequate |
| 100K users | ❌ Unusable | ⚠️ May need read replicas |
| 1M+ users | ❌ Unusable | ❌ Requires horizontal scaling |

---

## Deployment Steps

### Local Development

Update `.env`:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/akount_dev?connection_limit=50&pool_timeout=30&connect_timeout=10"
```

Restart API server:
```bash
cd apps/api && npm run dev
```

### Railway Production

1. Navigate to Railway project → API service → Variables
2. Click on `DATABASE_URL` variable
3. Append query parameters to the existing URL:
   ```
   ?connection_limit=50&pool_timeout=30&connect_timeout=10
   ```
4. Click "Save"
5. Railway will automatically redeploy

**Example:**
```
Before: postgresql://user:pass@caboose.proxy.rlwy.net:26768/railway
After:  postgresql://user:pass@caboose.proxy.rlwy.net:26768/railway?connection_limit=50&pool_timeout=30&connect_timeout=10
```

---

## Verification

After deployment, verify connection pool is configured:

```sql
-- Check current connection count
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'railway';

-- Check max_connections setting
SHOW max_connections;
```

**Expected Results:**
- Active connections: < 50
- Max connections: ≥ 100 (database server limit, should exceed app pool limit)

---

## Monitoring Queries

Add to your monitoring dashboard:

```sql
-- Connection pool utilization
SELECT
  count(*) as active,
  count(*) FILTER (WHERE state = 'active') as executing,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'railway';

-- Long-running queries (potential connection leaks)
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE datname = 'railway'
  AND now() - query_start > interval '30 seconds'
ORDER BY duration DESC;
```

---

## Troubleshooting

### P1001: Can't reach database server

**Symptom:** `PrismaClientInitializationError: Can't reach database server`

**Causes:**
1. Connection pool exhausted (all 50 connections in use)
2. Database server down
3. Network timeout

**Fix:**
1. Check active connections: `SELECT count(*) FROM pg_stat_activity`
2. If > 45, scale vertically (increase `connection_limit`) or add read replicas
3. Check for connection leaks (queries running >60s)
4. Add connection timeout monitoring

### Slow Query Performance Despite Pool

**Symptom:** Queries slow even with adequate connections

**Causes:**
1. Missing indexes (see PERF-24)
2. N+1 queries (see PERF-23)
3. Large dataset scans

**Fix:**
1. Run `EXPLAIN ANALYZE` on slow queries
2. Add composite indexes
3. Implement read replicas for analytics queries

---

**Status:** ✅ Documented
**Production Deployment:** Pending (Railway env var update required)
**Estimated Impact:** 5x capacity increase, supports 50K users
