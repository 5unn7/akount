# Production Launch Plan — Akount

> **Domain:** `akount.ai` (Namecheap) | **Web:** Vercel | **API:** Railway | **DNS/CDN:** Cloudflare (free)
> **Error Tracking:** Sentry | **Analytics:** PostHog | **Database:** Railway PostgreSQL (paid)

---

## Context

Akount has 1162 passing tests, 27 services, full CRUD across 8 domains, and a solid security posture (headers, rate limiting, CORS, auth). The codebase is production-ready but lacks operational infrastructure — no error tracking, no analytics, no deployment pipeline. This plan adds Sentry, PostHog, deployment configs, and DNS setup to go live with beta users.

**Readiness Score: ~45/100** — Strong application code, weak operational infrastructure.

### What's Already Solid
- Railway deployment config (Nixpacks, healthcheck)
- CI/CD pipeline (4-job GitHub Actions: lint, test, security, build)
- Env validation (Zod schema with production safety checks)
- Security headers (Helmet, HSTS, CSP, X-Frame-Options)
- Rate limiting (4 tiers: global/strict/burst/stats)
- Health endpoint (`/health` with DB connectivity check)
- Structured logging (Pino via Fastify, request-scoped)
- CORS (env-based origin whitelist)
- Graceful shutdown (SIGTERM/SIGINT handlers)

---

## Phase 1: Sentry Error Tracking (Web + API)

**Why first:** Production errors are invisible without this. Highest impact.

### 1A: Sentry for Next.js (Web)

**Install:** `@sentry/nextjs` in `apps/web/`

**Create files:**

| File | Purpose |
|------|---------|
| `apps/web/sentry.client.config.ts` | Client-side Sentry init (browser tracing, 10% sample rate) |
| `apps/web/sentry.server.config.ts` | Server-side Sentry init (Node.js runtime) |
| `apps/web/sentry.edge.config.ts` | Edge runtime Sentry init (middleware) |
| `apps/web/src/instrumentation.ts` | Next.js 16 instrumentation hook — `register()` + `onRequestError()` |
| `apps/web/src/app/global-error.tsx` | Root-level error boundary (catches layout errors) |

**Modify files:**

| File | Change |
|------|--------|
| `apps/web/next.config.js` | Wrap with `withSentryConfig()` for source map uploads. Add Sentry to CSP `connect-src`. |
| `apps/web/src/lib/error-tracking.ts` | Replace TODO (line 74) with actual `Sentry.captureException()` call. All 50+ error.tsx files already use `reportError()` — instant coverage. |

**Config values:**
- `tracesSampleRate: 0.1` (10% — stays in free tier)
- `replaysOnErrorSampleRate: 1.0` (replay on errors only)
- `hideSourceMaps: true` (upload to Sentry but hide from browser)

### 1B: Sentry for Fastify (API)

**Install:** `@sentry/node` in `apps/api/`

**Create files:**

| File | Purpose |
|------|---------|
| `apps/api/src/lib/sentry.ts` | Sentry init with `fastifyIntegration()`. Only initializes if `SENTRY_DSN` is set. |

**Modify files:**

| File | Change |
|------|--------|
| `apps/api/src/lib/env.ts` | Add `SENTRY_DSN: z.string().url().optional()`. Add production warning if unset. |
| `apps/api/src/index.ts` | Import `./lib/sentry` at top (before all other imports). Register `Sentry.setupFastifyErrorHandler(server)` after creating Fastify instance. |

**Verify:**
- `npm run build` succeeds in both apps
- All 1162 tests pass (Sentry no-ops without DSN)
- Trigger error with DSN set → appears in Sentry dashboard

---

## Phase 2: PostHog Analytics (Web Only)

**Install:** `posthog-js` in `apps/web/`

**Create files:**

| File | Purpose |
|------|---------|
| `apps/web/src/providers/posthog-provider.tsx` | `'use client'` provider — `posthog.init()` with `capture_pageview: false` (manual capture via App Router) |
| `apps/web/src/lib/analytics.ts` | Type-safe wrapper — `trackEvent()`, `identifyUser()`. No-ops if PostHog not initialized. |

**Modify files:**

| File | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | Add `PostHogProvider` inside `<body>`, wrapping `<ThemeProvider>`. Only renders if `NEXT_PUBLIC_POSTHOG_KEY` is set. |
| `apps/web/next.config.js` | Add PostHog to CSP: `connect-src https://us.i.posthog.com`, `script-src https://us-assets.i.posthog.com` |

**Verify:**
- Without env key: no PostHog calls, no errors
- With key: page navigation triggers events in PostHog dashboard

---

## Phase 3: Deployment Configuration

### 3A: Environment Documentation

**Create:** `.env.example` (root, tracked in git)
- All vars from `env.ts` Zod schema
- New: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- New: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- New: `NEXT_PUBLIC_API_URL` (currently defaults to `http://localhost:4000`)
- Grouped by service with comments

### 3B: Railway Config (API)

**Modify:** `railway.toml` — rewrite for API deployment:

```toml
[build]
builder = "Nixpacks"
buildCommand = "npm ci && npm run db:generate && cd apps/api && npm run build"

[deploy]
startCommand = "cd apps/api && npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

**Railway dashboard env vars:**
- `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CORS_ORIGINS=https://akount.ai,https://www.akount.ai`
- `SENTRY_DSN`, `NODE_ENV=production`, `PORT=4000`, `HOST=0.0.0.0`

### 3C: Vercel Config (Web)

No `vercel.json` needed — configure via Vercel dashboard:
- Root Directory: `apps/web`
- Build Command: `cd ../.. && npm run db:generate && cd apps/web && npm run build`
- Framework: Next.js (auto-detected)

**Vercel dashboard env vars:**
- `NEXT_PUBLIC_API_URL=https://api.akount.ai`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (live key)
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `DATABASE_URL` (needed for Prisma client generation at build time)

---

## Phase 4: Cloudflare DNS Setup

**Manual steps** (documented in `docs/infra/dns-setup.md`):

1. Create Cloudflare account (free tier)
2. Add site: `akount.ai`
3. **Namecheap:** Change nameservers to Cloudflare's assigned NS
4. **DNS records:**
   - `CNAME @ → cname.vercel-dns.com` (Proxied) — `akount.ai`
   - `CNAME www → cname.vercel-dns.com` (Proxied) — `www.akount.ai`
   - `CNAME api → <railway-domain>.railway.app` (Proxied) — `api.akount.ai`
5. **Vercel:** Add `akount.ai` + `www.akount.ai` as custom domains
6. **Railway:** Add `api.akount.ai` as custom domain
7. **Cloudflare SSL:** Full (Strict) mode
8. **Cloudflare page rule:** `api.akount.ai/*` → Cache Level: Bypass

---

## Phase 5: CI/CD Pipeline Update

**Approach:** Use Vercel + Railway **GitHub integrations** for auto-deploy (simpler than CI-driven). CI only handles Sentry release creation.

**Modify:** `.github/workflows/ci.yml`

Add job after `build` (on push to main only):

```yaml
sentry-release:
  needs: [build]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  # Create Sentry release with commit association
  # Upload source maps
```

**GitHub Secrets to add:**
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT_WEB`, `SENTRY_PROJECT_API`

---

## Phase 6: Pre-Launch Checklist

**Create:** `docs/infra/pre-launch-checklist.md`

Key verification items:
- [ ] Clerk live keys (not test keys)
- [ ] Railway PostgreSQL on paid plan (daily backups)
- [ ] `prisma migrate deploy` run against production DB
- [ ] Seed data: default COA templates
- [ ] CORS origins = production domains
- [ ] All env vars set in Vercel + Railway
- [ ] DNS propagated (`dig akount.ai`)
- [ ] SSL valid on both domains
- [ ] Sentry alerts configured
- [ ] Smoke test: sign up → onboarding → create entity → navigate all domains
- [ ] Uptime monitoring (UptimeRobot free or Cloudflare Health Checks)

---

## Files Summary

### New Files (8)
| File | Phase |
|------|-------|
| `apps/web/sentry.client.config.ts` | 1A |
| `apps/web/sentry.server.config.ts` | 1A |
| `apps/web/sentry.edge.config.ts` | 1A |
| `apps/web/src/instrumentation.ts` | 1A |
| `apps/web/src/app/global-error.tsx` | 1A |
| `apps/api/src/lib/sentry.ts` | 1B |
| `apps/web/src/providers/posthog-provider.tsx` | 2 |
| `apps/web/src/lib/analytics.ts` | 2 |

### Modified Files (6)
| File | Phase |
|------|-------|
| `apps/web/next.config.js` | 1A, 2 |
| `apps/web/src/lib/error-tracking.ts` | 1A |
| `apps/web/src/app/layout.tsx` | 2 |
| `apps/api/src/lib/env.ts` | 1B |
| `apps/api/src/index.ts` | 1B |
| `railway.toml` | 3B |

### New Documentation (3)
| File | Phase |
|------|-------|
| `.env.example` | 3A |
| `docs/infra/dns-setup.md` | 4 |
| `docs/infra/pre-launch-checklist.md` | 6 |

### CI/CD Update (1)
| File | Phase |
|------|-------|
| `.github/workflows/ci.yml` | 5 |

---

## Execution Order

```
Phase 1A (Sentry Web)     ~2h   ← Start here
Phase 1B (Sentry API)     ~1h
Phase 2  (PostHog)         ~1h
Phase 3  (Deploy Config)   ~2h
Phase 4  (DNS)             ~1h   ← Can start in parallel with Phase 1
Phase 5  (CI/CD)           ~1h
Phase 6  (Checklist)       ~1h
                          ------
Total:                     ~9h
```

Phase 4 (DNS) is purely manual/documentation — can start anytime. Phases 1-3 are code changes that build on each other.

---

## Architecture Decision: Cloudflare over Hostinger

| | Hostinger | Cloudflare (Free) |
|---|---|---|
| DNS management | Basic | Advanced (fast propagation) |
| CDN | None | Global CDN included |
| SSL | Manual/paid | Free automatic SSL |
| DDoS protection | None | Built-in |
| Works with Vercel | Manual config | Native integration |
| Works with Railway | Manual CNAME | Easy CNAME |
| Cost | Hosting plan required | Free |

**Recommendation:** Use Cloudflare for DNS/CDN. Change Namecheap nameservers to Cloudflare. No hosting plan needed — Vercel and Railway handle application hosting.