---
title: "Dead Code: Duplicate Plugin Files Not Imported"
category: architecture
date: 2026-02-02
severity: medium
module: apps/api
tags: [fastify, plugins, dead-code, maintenance]
---

# Dead Code: Duplicate Plugin Files Not Imported

## Problem

Found two Fastify plugin files that were never imported or used:

- `apps/api/src/plugins/rateLimit.ts`
- `apps/api/src/plugins/security.ts`

Meanwhile, identical functionality was configured inline in `apps/api/src/index.ts`.

```
apps/api/src/
├── plugins/
│   ├── rateLimit.ts   # NEVER IMPORTED - dead code
│   └── security.ts    # NEVER IMPORTED - dead code
└── index.ts           # Has inline rate-limit and helmet config
```

**Problems:**

1. Confusion about which code is active
2. Developers might update wrong file
3. Configurations can drift apart
4. Wasted mental overhead during code reviews

## Root Cause

Evolution of codebase without cleanup:

1. Initially configured inline in `index.ts`
2. Later, someone created plugin files (better architecture)
3. Plugin files were never wired up
4. Original inline config remained active

## Solution

**Chose Option A: Keep inline, delete plugins**

For a small API, inline configuration in `index.ts` is acceptable and simpler:

```typescript
// index.ts - Keep this (it's actually being used)
server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // ... config
});

server.register(helmet, {
    contentSecurityPolicy: { /* ... */ },
    // ... config
});
```

Deleted unused files:

```bash
rm apps/api/src/plugins/rateLimit.ts
rm apps/api/src/plugins/security.ts
rmdir apps/api/src/plugins/
```

**When to choose Option B (use plugins):**

- Larger API with many plugins
- Need to test plugins in isolation
- Configuration is complex (100+ lines)
- Multiple servers share same plugins

```typescript
// Option B example (for larger projects)
// plugins/rateLimit.ts
export async function registerRateLimit(app: FastifyInstance) {
    await app.register(rateLimit, { /* config */ });
}

// index.ts
import { registerRateLimit } from './plugins/rateLimit';
await registerRateLimit(server);
```

## Prevention

### Before Creating Plugin Files

1. Check if functionality already exists inline
2. If extracting to plugin, remove inline version immediately
3. Verify plugin is imported in `index.ts`

### Code Review Checklist

- [ ] Are all files in `plugins/` imported somewhere?
- [ ] Is there duplicate configuration between plugins and index.ts?
- [ ] Run: `grep -r "from './plugins" src/` to verify imports

### IDE Tip

Most IDEs highlight unused imports/exports. Check for:

- Files with 0 references
- Exported functions never called

## Files Changed

- Deleted: `apps/api/src/plugins/rateLimit.ts`
- Deleted: `apps/api/src/plugins/security.ts`
- Deleted: `apps/api/src/plugins/` directory

## Time to Fix

- Investigation: 3 minutes
- Fix: 1 minute
- **Future lookup: 30 seconds**
