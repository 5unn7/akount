---
title: "Debug Endpoints Exposing Internal Data"
category: security
date: 2026-02-02
severity: critical
module: apps/api
tags: [fastify, security, owasp, endpoints]
---

# Debug Endpoints Exposing Internal Data

## Problem

During code review, discovered three publicly accessible debug endpoints in the Fastify API that could leak sensitive information:

```typescript
// VULNERABLE: No authentication required
server.post('/validation/debug', async (request) => {
    return {
        body: request.body,
        bodyType: typeof request.body,
        headers: request.headers,  // Exposes ALL headers including auth tokens
    };
});

server.post('/validation/test', ...);  // Exposes request parsing behavior
server.get('/validation/query', ...);  // Exposes query validation
```

**Risk:** An attacker could:

1. Probe API for parsing behavior
2. See all request headers (potentially including leaked tokens)
3. Use endpoints for reconnaissance before targeted attacks

## Root Cause

Test/debug endpoints created during development were not:

1. Protected with authentication middleware
2. Removed before production
3. Restricted to development environment only

## Solution

**Removed all debug endpoints entirely:**

```typescript
// BEFORE: Dangerous debug endpoints
server.post('/validation/debug', ...)
server.post('/validation/test', ...)
server.get('/validation/query', ...)

// AFTER: Endpoints removed from index.ts
// Validation middleware still available for routes that need it
```

**Alternative if debug endpoints are needed:**

```typescript
// Option 1: Protect with auth + environment check
server.post('/validation/debug', {
    onRequest: [authMiddleware],
    preHandler: async (request, reply) => {
        if (process.env.NODE_ENV === 'production') {
            return reply.status(404).send({ error: 'Not found' });
        }
    }
}, handler);

// Option 2: Use a separate debug server on different port (dev only)
if (process.env.NODE_ENV === 'development') {
    const debugServer = Fastify();
    debugServer.post('/debug', ...);
    debugServer.listen({ port: 4001 });
}
```

## Prevention

### Code Review Checklist

- [ ] Are all endpoints protected with `authMiddleware`?
- [ ] Do any endpoints return `request.headers` or `request.body` directly?
- [ ] Are test endpoints removed or environment-gated?

### Fastify Best Practice

```typescript
// Always protect non-health endpoints
server.addHook('onRequest', async (request, reply) => {
    const publicPaths = ['/', '/health'];
    if (!publicPaths.includes(request.url)) {
        // Require authentication for everything else
        await authMiddleware(request, reply);
    }
});
```

### OWASP Reference

- **A01:2021 - Broken Access Control**: Endpoints must enforce authentication
- **A05:2021 - Security Misconfiguration**: Debug features enabled in production

## Files Changed

- `apps/api/src/index.ts` - Removed `/validation/debug`, `/validation/test`, `/validation/query`

## Time to Fix

- Investigation: 5 minutes (found during multi-agent review)
- Fix: 2 minutes
- **Future lookup: 1 minute**
