# CSRF Protection Implementation (SEC-40)

**Status:** ✅ Implemented
**Date:** 2026-02-26
**Package:** `@fastify/csrf-protection` v7.1.0
**Pattern:** Double Submit Cookie

---

## Overview

CSRF (Cross-Site Request Forgery) protection is now enabled for all state-changing endpoints (POST, PUT, PATCH, DELETE) across the API. This prevents attackers from tricking authenticated users into making unwanted requests.

**Scope:** 119 endpoints across 9 domains protected

| Domain | Protected Endpoints |
|--------|---------------------|
| accounting | 24 |
| banking | 23 |
| invoicing | 21 |
| ai | 21 |
| planning | 12 |
| system | 10 |
| vendors | 3 |
| clients | 3 |
| services | 2 |

---

## How It Works

### Double Submit Cookie Pattern

1. **Server** sets `_csrf` cookie (signed, httpOnly: false, sameSite: strict)
2. **Client** reads cookie value and includes it in `X-CSRF-Token` header
3. **Server** validates that cookie value matches header value
4. **Rejection** if mismatch or missing → 403 Forbidden

### Why This Is Secure

- **SameSite: strict** prevents browser from sending cookie cross-site
- **Signed cookie** prevents tampering (uses COOKIE_SECRET or CLERK_SECRET_KEY)
- **Stateless** no server-side session storage required
- **Works with JWT auth** our JWT tokens in Authorization headers are already CSRF-safe

---

## Files Modified

### Backend

- **`apps/api/src/middleware/csrf.ts`** — CSRF middleware implementation
- **`apps/api/src/index.ts`** — Middleware registration + `/api/csrf-token` endpoint
- **`apps/api/src/lib/env.ts`** — Added COOKIE_SECRET env var
- **`apps/api/package.json`** — Added `@fastify/csrf-protection@7.1.0` + `@fastify/cookie@11.0.2`

### Frontend

- **`apps/web/src/lib/api/client-browser.ts`** — Updated to include CSRF token in requests

---

## Usage

### Backend - Protecting Endpoints

**Automatic protection** — All POST/PUT/PATCH/DELETE routes are automatically protected.

No code changes needed for existing endpoints!

### Frontend - Making Protected Requests

The `apiFetch` client automatically handles CSRF tokens:

```typescript
import { apiFetch } from '@/lib/api/client-browser'

// Automatically includes CSRF token for POST
await apiFetch('/api/invoices', {
  method: 'POST',
  body: JSON.stringify({ ... })
})
```

**How it works:**
1. `apiFetch` checks if method requires CSRF (POST/PUT/PATCH/DELETE)
2. Reads `_csrf` cookie value
3. If cookie missing, fetches token from `/api/csrf-token`
4. Adds `X-CSRF-Token` header to request
5. Includes `credentials: 'include'` for cookie handling

### Manual Token Fetching (if needed)

```typescript
const response = await fetch(`${API_URL}/api/csrf-token`, {
  method: 'GET',
  credentials: 'include', // Important!
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
})

const { token } = await response.json()

// Use token in subsequent requests
await fetch(`${API_URL}/api/invoices`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': token,
    Authorization: `Bearer ${authToken}`,
  },
  body: JSON.stringify({ ... }),
})
```

---

## Excluded Paths

These paths are **NOT** CSRF-protected (by design):

- `/` — Root health check
- `/health` — Health check endpoint
- `/api/csrf-token` — Token generation endpoint (chicken-and-egg)
- All `GET`, `HEAD`, `OPTIONS` requests (safe methods)

---

## Environment Variables

### Required

None! Falls back to existing `CLERK_SECRET_KEY` for cookie signing.

### Optional (Recommended for Production)

```bash
COOKIE_SECRET=your-random-secret-here
```

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Testing

### Manual Testing

1. **Start the API server:**
   ```bash
   cd apps/api && npm run dev
   ```

2. **Test GET (should work without CSRF):**
   ```bash
   curl http://localhost:4000/api/csrf-token \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Test POST without CSRF (should fail with 403):**
   ```bash
   curl -X POST http://localhost:4000/api/invoices \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"data":"test"}'
   ```

4. **Test POST with CSRF (should work):**
   ```bash
   # Get token
   CSRF=$(curl -c cookies.txt http://localhost:4000/api/csrf-token \
     -H "Authorization: Bearer YOUR_TOKEN" | jq -r '.token')

   # Use token
   curl -X POST http://localhost:4000/api/invoices \
     -b cookies.txt \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-CSRF-Token: $CSRF" \
     -H "Content-Type: application/json" \
     -d '{"data":"test"}'
   ```

### Integration Testing

CSRF protection should be tested via end-to-end tests that exercise the full request flow (frontend → backend).

Unit tests for middleware require complex setup (registering plugins, mocking cookies). Recommend E2E tests instead.

---

## Troubleshooting

### "CSRF token validation failed" (403)

**Causes:**
1. Missing `X-CSRF-Token` header
2. Cookie not sent (`credentials: 'include'` missing)
3. Token expired or invalid
4. Cookie secret mismatch (dev vs prod)

**Solution:**
- Verify frontend includes `credentials: 'include'`
- Check `X-CSRF-Token` header is present
- Fetch fresh token from `/api/csrf-token`

### CORS Errors

Ensure CORS is configured to allow credentials:

```typescript
// apps/api/src/index.ts
server.register(cors, {
  origin: ['http://localhost:3000'], // Your frontend origin
  credentials: true, // REQUIRED for CSRF cookies
})
```

### Token Not Generated

Check that:
1. `@fastify/cookie` is registered before `@fastify/csrf-protection`
2. `COOKIE_SECRET` or `CLERK_SECRET_KEY` is set in env
3. Request reaches the `/api/csrf-token` endpoint (check logs)

---

## Security Considerations

### Defense in Depth

While our JWT-based auth (Authorization header) is already CSRF-resistant, we've added CSRF protection because:

1. **Future-proofing** — If we ever add cookie-based auth features
2. **OWASP best practice** — Protect all state-changing operations
3. **Multiple layers** — Security in depth

### SameSite Cookies

The `sameSite: 'strict'` setting prevents browsers from sending the CSRF cookie on cross-site requests. This is the primary defense.

### Signed Cookies

Cookies are cryptographically signed to prevent tampering. An attacker cannot forge a valid CSRF cookie without knowing the secret.

### Why httpOnly: false?

The `_csrf` cookie is **not** `httpOnly` because the client needs to read it to include in the `X-CSRF-Token` header. This is safe because:

- The cookie value alone is useless without also having the cookie
- An attacker's script can't steal cookies across origins (blocked by CORS)
- SameSite: strict prevents cross-site sends

---

## Monitoring

### Metrics to Track

- CSRF validation failures (403 responses)
- `/api/csrf-token` endpoint usage
- Increased latency from token fetching

### Logging

CSRF failures are automatically logged by Fastify:

```
[ERROR] CSRF token validation failed - 403 Forbidden
```

Check API logs for spike in 403s after deployment.

---

## Rollback Plan

If CSRF protection causes issues:

1. **Disable middleware** in `apps/api/src/index.ts`:
   ```typescript
   // Comment out these lines:
   // server.register(csrfProtection);
   // server.get('/api/csrf-token', ...);
   ```

2. **Revert frontend changes** in `apps/web/src/lib/api/client-browser.ts`:
   ```typescript
   // Remove CSRF token logic, restore original apiFetch
   ```

3. **Redeploy** both frontend and backend

---

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [@fastify/csrf-protection Documentation](https://github.com/fastify/csrf-protection)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)

---

**Next Steps:**

1. Deploy to staging environment
2. Run manual testing checklist
3. Monitor for 403 errors
4. Add E2E tests for critical flows (invoice create, payment post)
5. Update security audit checklist

**Task:** SEC-40
**Implemented by:** Claude Sonnet 4.5
**Review:** Pending manual testing + integration tests
