# @akount/db — Database Package

Prisma schema, migrations, and database client for Akount.

---

## Connection Pool Configuration (ARCH-9)

### Production Setup

Add connection pool parameters to your `DATABASE_URL`:

```bash
# For 10K-50K users
DATABASE_URL="postgresql://user:pass@host:5432/akount?connection_limit=50&pool_timeout=30"

# For 100K+ users (with read replicas)
DATABASE_URL="postgresql://user:pass@host:5432/akount?connection_limit=100&pool_timeout=30"
```

### Parameters

| Parameter | Default | Recommended | Description |
|-----------|---------|-------------|-------------|
| `connection_limit` | `num_cpus * 2 + 1` (~9) | 50-100 | Max connections in pool |
| `pool_timeout` | 10s | 30s | Wait time for available connection |

### Scale Guidelines

- **10K users:** `connection_limit=20`
- **50K users:** `connection_limit=50`
- **100K users:** `connection_limit=100` + read replicas
- **1M+ users:** Sharding + connection pooling per shard

---

## Development

```bash
# Run migrations
npx prisma migrate dev

# Apply existing migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

---

## Testing

```bash
# Run database tests
cd ../api && npx vitest run --grep "database"
```
