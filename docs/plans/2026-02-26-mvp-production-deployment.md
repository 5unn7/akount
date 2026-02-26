# Akount MVP Production Deployment Plan

> **Goal:** Get Akount live, accepting users, and processing financial documents within 14 days
> **Architecture:** DigitalOcean Droplet + Managed PostgreSQL + Cloudflare CDN + Mistral API
> **Cost:** ~$40/mo at launch → $80-100/mo with all features enabled

---

## Current State Assessment

| Area | Readiness | Notes |
|------|-----------|-------|
| Backend API (Fastify) | 90% | 36 services, 1,752 tests passing, rate limiting, CORS, auth all working |
| Frontend (Next.js 16) | 85% | All 8 domains, loading/error states, glass design system |
| Database (Prisma/PG) | 90% | 13 migrations, tenant isolation middleware, soft delete |
| Auth (Clerk) | 95% | JWT verification, tenant context, webhook handler |
| CI/CD (GitHub Actions) | 70% | Lint, test, build, security scan — missing deploy job |
| Error Tracking (Sentry) | 10% | Stub exists, packages not installed |
| Logging (Logtail) | 0% | Pino configured but no remote transport |
| Document AI (Mistral) | 0% | No Mistral client, no document scan routes |
| File Storage (S3/Spaces) | 0% | Upload quota/virus scan ready, no storage backend |
| Job Queue (BullMQ) | 0% | No Redis, no queue infrastructure |
| Process Manager (PM2) | 0% | No ecosystem.config.js |
| Reverse Proxy (Nginx) | 0% | No config in repo |
| Deploy Scripts | 0% | No automated deploy |

---

## Three-Track Plan

### Track 1: Production Hardening (Days 1-5)

Everything that needs to exist in the codebase before first deploy.

#### T1.1 — Error Tracking (Sentry)
**Files:** `apps/api/src/lib/sentry.ts` (new), `apps/web/sentry.client.config.ts` (new), `apps/web/sentry.server.config.ts` (new), `apps/web/next.config.js` (modify)
**Packages:** `@sentry/node @sentry/nextjs`
**What:**
- Install Sentry packages in both apps
- Wire `@sentry/node` into Fastify error handler (global catch)
- Wire `@sentry/nextjs` into Next.js via `withSentryConfig` wrapper
- Replace `reportError()` stub in `apps/web/src/lib/error-tracking.ts` with real Sentry calls
- Add `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to env validation (`apps/api/src/lib/env.ts`)

#### T1.2 — Centralized Logging (Logtail/Pino)
**Files:** `apps/api/src/lib/logger.ts` (new), `apps/api/src/index.ts` (modify)
**Packages:** `pino-http @logtail/pino`
**What:**
- Create pino transport that ships logs to Logtail (Better Stack) in production
- Keep console transport for development
- Add `LOGTAIL_SOURCE_TOKEN` to env validation
- Wire into Fastify logger config (replace `logger: true` with custom config)

#### T1.3 — Database Connection Pooling
**Files:** `packages/db/index.ts` (modify)
**What:**
- Add `connection_limit=10` to DATABASE_URL or PrismaClient datasource config
- Current: 5 PM2 workers × 5 default connections = 25 (exactly at DO 1GB PG limit of 25)
- Target: 5 workers × 10 connections = 50 with PgBouncer, or hard cap at 4 per worker
- Add connection pool exhaustion logging

#### T1.4 — Security Headers (CSP + HSTS)
**Files:** `apps/web/next.config.js` (modify), `apps/api/src/index.ts` (modify)
**What:**
- Expand CSP from just `frame-src` to full policy: `default-src 'self'`, `script-src`, `style-src`, `img-src`, `connect-src` (Clerk, Sentry, API domain)
- Move HSTS from `/api/*` only to ALL routes
- Add `Permissions-Policy` header (disable camera, microphone, geolocation)
- Add `X-Content-Type-Options: nosniff` to API responses

#### T1.5 — Environment Template
**Files:** `.env.example` (new)
**What:**
- Create comprehensive `.env.example` with ALL required vars documented
- Currently missing from template: `CORS_ORIGINS` (critical — app breaks without it), `CLERK_WEBHOOK_SECRET`, `SENTRY_DSN`, `LOGTAIL_SOURCE_TOKEN`, `MISTRAL_API_KEY`, `SPACES_*`, `REDIS_URL`
- Group by category: Database, Auth, API, Storage, AI, Monitoring
- Add comments explaining each variable

#### T1.6 — PM2 Process Manager Config
**Files:** `apps/api/ecosystem.config.js` (new), `apps/web/ecosystem.config.js` (new)
**What:**
- API: cluster mode, 2 instances (for 2GB droplet), max memory 512MB, auto-restart
- Web: fork mode, 1 instance, max memory 768MB
- Log rotation, error log separation
- Graceful shutdown handling (already in Fastify code)
- Environment variable passthrough

#### T1.7 — Nginx Reverse Proxy Config
**Files:** `infra/nginx/akount.conf` (new)
**What:**
- HTTPS termination (Let's Encrypt / Certbot)
- Proxy pass: `/` → Next.js (port 3000), `/api` → Fastify (port 3001)
- Rate limiting: 10 req/s burst 20 (defense in depth with Fastify rate limiter)
- Body size limit: 10MB (match Fastify multipart config)
- Gzip compression for static assets
- WebSocket support for hot reload in dev (optional)
- Security headers that Nginx should set (X-Request-ID, X-Real-IP forwarding)
- SSL stapling and OCSP

#### T1.8 — Deploy Scripts
**Files:** `infra/scripts/deploy.sh` (new), `infra/scripts/setup-server.sh` (new)
**What:**
- `setup-server.sh`: One-time server setup (Node.js 22, PM2, Nginx, Certbot, firewall, non-root deploy user)
- `deploy.sh`: Repeatable deploy (git pull, install deps, build, run migrations, restart PM2)
- Pre-migration database backup (pg_dump before `prisma migrate deploy`)
- Health check after deploy (curl /health endpoint)
- Rollback script (revert to previous build)
- **No root SSH** — create `deploy` user with sudo for specific commands only

#### T1.9 — CI/CD Deploy Job
**Files:** `.github/workflows/deploy.yml` (new), `.github/workflows/ci.yml` (modify)
**What:**
- New workflow: deploy on push to `main` (after CI passes)
- SSH into droplet as `deploy` user, run `deploy.sh`
- Environment: GitHub Secrets for SSH key, server IP
- Slack/Discord notification on deploy success/failure (optional)
- Manual trigger option for rollbacks

---

### Track 2: Infrastructure Deployment (Days 5-10)

Setting up the actual servers and services.

#### T2.1 — DigitalOcean Droplet Setup
**What:**
- Create 2GB/2vCPU droplet ($18/mo) — Ubuntu 24.04
- Run `setup-server.sh` (from T1.8)
- Configure firewall: SSH (port 22, key-only), HTTP (80), HTTPS (443)
- Create `deploy` user, disable root login
- Install Node.js 22 via nvm, PM2 globally

#### T2.2 — Managed PostgreSQL Setup
**What:**
- Create DigitalOcean Managed PostgreSQL 1GB ($15/mo)
- Configure trusted sources (droplet IP only)
- Run `prisma migrate deploy` to apply 13 migrations
- Verify tenant isolation middleware works
- Enable automated backups (included in managed tier)
- Set connection limit alerts

#### T2.3 — Cloudflare Setup
**What:**
- Add domain to Cloudflare (free tier)
- DNS: A record → droplet IP (proxied through CF)
- SSL: Full (strict) mode
- Cache rules: static assets (JS, CSS, images) = 1 month, API = no cache
- Page rules: force HTTPS
- Rate limiting: 1000 req/10s per IP (DDoS baseline)
- Bot protection (free tier)

#### T2.4 — Clerk Production Setup
**What:**
- Create Clerk production instance
- Configure custom domain (auth.akount.app or accounts.akount.app)
- Set up webhook endpoint for user sync
- Generate production API keys
- Configure allowed origins

#### T2.5 — First Deploy
**What:**
- Set all environment variables on server
- Run deploy script
- Verify health endpoint responds
- Verify Clerk auth works end-to-end
- Verify database queries work
- Test one full user flow (signup → create entity → navigate dashboard)

#### T2.6 — Monitoring Setup
**What:**
- Sentry: Verify errors captured (trigger test error)
- Logtail: Verify logs flowing (check dashboard)
- DigitalOcean monitoring: CPU, memory, disk alerts
- Uptime monitoring: UptimeRobot or Better Stack (free tier) — ping /health every 60s
- PostgreSQL monitoring: Connection count, slow queries

#### T2.7 — Smoke Tests
**What:**
- Create a simple smoke test script that verifies:
  - Homepage loads (200)
  - API health endpoint (200)
  - Auth redirect works (302 to Clerk)
  - Protected route requires auth (401)
  - Database reads work (list entities)
- Run after every deploy

#### T2.8 — Production Readiness Checklist
**What:**
- Verify all security headers present (use securityheaders.com)
- Verify SSL grade (use ssllabs.com — target A+)
- Verify no sensitive data in client bundle (search for API keys in built JS)
- Verify error pages work (404, 500)
- Test graceful shutdown (PM2 restart, no dropped requests)
- **LAUNCH GATE** — app is live and accepting users after this step

---

### Track 3: Mistral Document Intelligence (Days 10-14)

Building the AI-powered document scanning that differentiates Akount.

#### T3.1 — Mistral API Client
**Files:** `apps/api/src/lib/mistral.ts` (new), `apps/api/src/lib/env.ts` (modify)
**What:**
- Create typed Mistral API client (REST, not SDK — lighter)
- Pixtral model for document OCR (receipts, invoices, bank statements)
- Mistral Large for structured extraction (JSON output)
- Zero-retention header (`x-data-retention: none`) for financial data privacy
- Retry logic with exponential backoff
- Rate limiting (respect Mistral's API limits)
- Add `MISTRAL_API_KEY` to env validation
- Cost tracking per request (log token usage)

#### T3.2 — DigitalOcean Spaces (S3-Compatible Storage)
**Files:** `apps/api/src/lib/storage.ts` (new), `apps/api/src/lib/env.ts` (modify)
**Packages:** `@aws-sdk/client-s3`
**What:**
- S3-compatible client for DigitalOcean Spaces ($5/mo for 250GB)
- Upload with content-type validation (PDF, PNG, JPG only)
- Presigned URLs for secure download (expire in 1 hour)
- Folder structure: `{tenantId}/{entityId}/documents/{year}/{filename}`
- Virus scanning integration (existing `file-scanner.ts` ClamAV)
- Add `SPACES_*` vars to env validation

#### T3.3 — BullMQ Job Queue
**Files:** `apps/api/src/lib/queue.ts` (new), `apps/api/src/workers/document-scan.worker.ts` (new)
**Packages:** `bullmq ioredis`
**What:**
- Redis connection (DigitalOcean Managed Redis $10/mo, or free Upstash for MVP)
- Document scan queue: upload → OCR → extract → categorize → create transaction
- Job retry (3 attempts, exponential backoff)
- Job progress tracking (upload → scanning → extracting → complete)
- Dead letter queue for failed jobs
- Add `REDIS_URL` to env validation
- Graceful worker shutdown on SIGTERM

#### T3.4 — Document Scan API Routes
**Files:** `apps/api/src/domains/services/routes/documents.ts` (new), `apps/api/src/domains/services/services/document-scan.service.ts` (new), `apps/api/src/domains/services/schemas/document.schema.ts` (new)
**What:**
- `POST /api/services/documents/upload` — Upload document, enqueue scan job
- `GET /api/services/documents/:id/status` — Check scan progress
- `GET /api/services/documents/:id` — Get scan results (extracted data)
- `POST /api/services/documents/:id/approve` — Approve and create transaction from scan
- All routes tenant-isolated, rate-limited (AI tier: 20/min)
- Zod validation for all inputs

#### T3.5 — Frontend Document Upload UI
**Files:** `apps/web/src/app/(dashboard)/services/documents/page.tsx` (new), + loading.tsx, error.tsx, client components
**What:**
- Drag-and-drop upload zone (or file picker)
- Upload progress indicator
- Scan status polling (pending → scanning → complete)
- Review extracted data before approval
- Create transaction from approved scan
- Document history list

---

## File Summary

### New Files (18)
| File | Track | Purpose |
|------|-------|---------|
| `apps/api/src/lib/sentry.ts` | T1.1 | Sentry Node.js integration |
| `apps/web/sentry.client.config.ts` | T1.1 | Sentry browser config |
| `apps/web/sentry.server.config.ts` | T1.1 | Sentry server config |
| `apps/api/src/lib/logger.ts` | T1.2 | Pino + Logtail transport |
| `.env.example` | T1.5 | Environment variable template |
| `apps/api/ecosystem.config.js` | T1.6 | PM2 config (API) |
| `apps/web/ecosystem.config.js` | T1.6 | PM2 config (Web) |
| `infra/nginx/akount.conf` | T1.7 | Nginx reverse proxy config |
| `infra/scripts/deploy.sh` | T1.8 | Repeatable deploy script |
| `infra/scripts/setup-server.sh` | T1.8 | One-time server setup |
| `.github/workflows/deploy.yml` | T1.9 | CI/CD deploy workflow |
| `apps/api/src/lib/mistral.ts` | T3.1 | Mistral API client |
| `apps/api/src/lib/storage.ts` | T3.2 | S3/Spaces storage client |
| `apps/api/src/lib/queue.ts` | T3.3 | BullMQ queue setup |
| `apps/api/src/workers/document-scan.worker.ts` | T3.3 | Document scan worker |
| `apps/api/src/domains/services/routes/documents.ts` | T3.4 | Document API routes |
| `apps/api/src/domains/services/services/document-scan.service.ts` | T3.4 | Document scan service |
| `apps/api/src/domains/services/schemas/document.schema.ts` | T3.4 | Document Zod schemas |

### Modified Files (12)
| File | Track | Change |
|------|-------|--------|
| `apps/api/src/lib/env.ts` | T1.1-T3.3 | Add SENTRY_DSN, LOGTAIL_TOKEN, MISTRAL_API_KEY, SPACES_*, REDIS_URL |
| `apps/web/next.config.js` | T1.1, T1.4 | Sentry wrapper + full CSP + HSTS on all routes |
| `apps/api/src/index.ts` | T1.2, T1.4 | Custom pino logger, expanded security headers |
| `packages/db/index.ts` | T1.3 | Connection limit parameter |
| `apps/web/src/lib/error-tracking.ts` | T1.1 | Replace stub with real Sentry calls |
| `.github/workflows/ci.yml` | T1.9 | Trigger deploy workflow on success |
| `apps/api/package.json` | T1.1-T3.3 | New dependencies |
| `apps/web/package.json` | T1.1 | Sentry packages |
| `packages/db/package.json` | — | If connection pooling needs package |
| `apps/api/src/domains/services/routes/index.ts` | T3.4 | Register document routes |
| `apps/api/src/domains/ai/services/categorization.service.ts` | T3.4 | Hook into document scan results |
| `apps/web/src/lib/navigation.ts` | T3.5 | Add Documents to Services domain nav |

### NPM Packages (6)
| Package | Track | App |
|---------|-------|-----|
| `@sentry/node` | T1.1 | API |
| `@sentry/nextjs` | T1.1 | Web |
| `@logtail/pino` | T1.2 | API |
| `@aws-sdk/client-s3` | T3.2 | API |
| `bullmq` | T3.3 | API |
| `ioredis` | T3.3 | API |

---

## Cost Breakdown

### At Launch (Day 9) — ~$40/mo
| Service | Cost | Notes |
|---------|------|-------|
| DO Droplet 2GB/2vCPU | $18/mo | API + Web + PM2 |
| DO Managed PostgreSQL 1GB | $15/mo | 25 connections, auto-backup |
| Cloudflare | $0 | Free tier (DNS, CDN, SSL, DDoS) |
| Clerk | $0 | Free up to 10K MAU |
| Sentry | $0 | Free tier (5K errors/mo) |
| Better Stack (Logtail) | $0 | Free tier (1GB logs/mo) |
| UptimeRobot | $0 | Free tier (5-min checks) |
| Domain | ~$12/yr | ≈$1/mo |
| **Total** | **~$34-40/mo** | |

### With Document Intelligence (Day 14) — ~$80-100/mo
| Service | Cost | Notes |
|---------|------|-------|
| Above baseline | $40/mo | |
| DO Spaces 250GB | $5/mo | Document storage |
| Upstash Redis (free) OR DO Redis | $0-10/mo | Job queue |
| Mistral API | $5-20/mo | ~$0.002/page OCR, ~$0.006/extraction |
| Resend | $0 | Free tier (100 emails/day) |
| **Total** | **~$50-75/mo** | |

### At 1,000 Users — ~$100-140/mo
| Upgrade | Cost | Trigger |
|---------|------|---------|
| Droplet → 4GB/2vCPU | +$6/mo | Memory pressure |
| PostgreSQL → 2GB | +$15/mo | Connection limit |
| Mistral API | ~$30-50/mo | Higher document volume |

---

## Timeline

| Day | Track | Milestone |
|-----|-------|-----------|
| 1-2 | T1.1-T1.4 | Sentry, Logtail, DB pooling, security headers |
| 3-4 | T1.5-T1.8 | .env template, PM2, Nginx, deploy scripts |
| 5 | T1.9 + T2.1-T2.2 | CI/CD deploy job, Droplet + PostgreSQL setup |
| 6-7 | T2.3-T2.5 | Cloudflare, Clerk production, first deploy |
| 8 | T2.6-T2.7 | Monitoring, smoke tests |
| **9** | **T2.8** | **LAUNCH GATE — App is live** |
| 10-11 | T3.1-T3.2 | Mistral client, Spaces storage |
| 12-13 | T3.3-T3.4 | BullMQ queue, document scan API |
| **14** | **T3.5** | **v1.1 — Document intelligence live** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Database connection exhaustion | T1.3 connection limit + monitoring alerts (T2.6) |
| Unnoticed errors in production | Sentry (T1.1) + Logtail (T1.2) + uptime monitoring (T2.6) |
| Deploy breaks production | Pre-deploy backup (T1.8), health check post-deploy, rollback script |
| Mistral API downtime | Graceful degradation — upload succeeds, scan queued, retry on API recovery |
| Financial data in Mistral API | Zero-retention header, SOC 2 Type II, DPA, EU-hosted |
| Cost overrun on Mistral | Per-request cost logging, monthly budget alerts, rate limiting |
| Server compromise | Non-root deploy user, firewall, key-only SSH, Cloudflare WAF |

---

## What We're NOT Doing (Intentional Scope Cuts)

- **No Docker/Kubernetes** — PM2 + Nginx is sufficient for 0-1K users
- **No staging environment** — Deploy to production with health checks (add staging when team grows)
- **No self-hosted Mistral** — API calls until volume justifies $150/mo GPU
- **No multi-region** — Single droplet until latency matters
- **No PgBouncer** — Connection limit in Prisma is sufficient at this scale
- **No Terraform/IaC** — Manual setup once, automate deploys. IaC when infra grows.
