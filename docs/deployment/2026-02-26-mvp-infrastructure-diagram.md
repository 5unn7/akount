# Akount MVP Infrastructure Diagram (1,000 Users)

**Last Updated:** 2026-02-26
**Scale:** First 1,000 users
**Monthly Cost:** ~$225

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         USERS (1,000)                          │
│  Solopreneurs, Bookkeepers, Accountants                        │
│  Devices: Desktop, Mobile, Tablet                              │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            │ HTTPS (encrypted)
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE (Free Tier)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐│
│  │ CDN Cache    │  │ SSL Cert     │  │ DDoS Protection      ││
│  │ (Static      │  │ (Auto-renew) │  │ (Unlimited)          ││
│  │  Assets)     │  │              │  │                      ││
│  └──────────────┘  └──────────────┘  └──────────────────────┘│
│                                                                 │
│  DNS Records:                                                   │
│  - app.akount.com → 123.45.67.89 (Droplet IP)                  │
│  - api.akount.com → 123.45.67.89 (Droplet IP)                  │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│              DIGITALOCEAN DROPLET ($24/month)                  │
│                 4GB RAM / 2 vCPU / 80GB SSD                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ NGINX (Reverse Proxy)                                     │ │
│  │  - Routes app.akount.com → :3000 (Next.js)               │ │
│  │  - Routes api.akount.com → :4000 (Fastify)               │ │
│  └────────────┬───────────────────┬─────────────────────────┘ │
│               │                   │                            │
│               ▼                   ▼                            │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │ Next.js App (:3000) │  │ Fastify API (:4000)          │   │
│  │ ─────────────────── │  │ ──────────────────────────── │   │
│  │ - Server Components │  │ - Business Logic             │   │
│  │ - Client Components │  │ - Authentication (Clerk)     │   │
│  │ - Pages/Routes      │  │ - Database Queries           │   │
│  │ - Auth UI (Clerk)   │  │ - Queue Management (Bull)    │   │
│  └─────────────────────┘  └──────────────────────────────┘   │
│                                    │                            │
│  Managed by PM2 (Process Manager)  │                            │
│  - Auto-restart on crash           │                            │
│  - Log rotation                    │                            │
└────────────────────────────────────┼────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
┌──────────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ POSTGRESQL           │  │ REDIS           │  │ SPACES              │
│ (Managed DB)         │  │ (Managed Cache) │  │ (Object Storage)    │
│ $15/month            │  │ $15/month       │  │ $5/month            │
│ ──────────────────── │  │ ─────────────── │  │ ───────────────── │
│ - Users              │  │ - Bull Queues:  │  │ - Receipts/Invoices │
│ - Tenants            │  │   • bill-scan   │  │ - Bank Statements   │
│ - Entities           │  │   • invoice-scan│  │ - Uploaded PDFs     │
│ - Transactions       │  │   • txn-import  │  │                     │
│ - Bills/Invoices     │  │   • matching    │  │ Encrypted at rest   │
│ - Journal Entries    │  │                 │  │ Pre-signed URLs     │
│ - Categories         │  │ Job Status:     │  │ (1hr expiration)    │
│ - GL Accounts        │  │ - PENDING       │  │                     │
│ - Audit Logs         │  │ - PROCESSING    │  │ 250GB included      │
│                      │  │ - COMPLETED     │  │ then $0.02/GB       │
│ 1GB RAM / 10GB SSD   │  │ - FAILED        │  │                     │
│ Daily auto-backups   │  │                 │  │                     │
│ SSL enforced         │  │ 1GB RAM         │  │                     │
└──────────────────────┘  └─────────────────┘  └─────────────────────┘
                                  │
                                  │ Workers poll queue
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────┐
│              BULL WORKERS (Running on Droplet)                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │ BillScan     │  │ InvoiceScan   │  │ TransactionImport│   │
│  │ Worker       │  │ Worker        │  │ Worker           │   │
│  │              │  │               │  │                  │   │
│  │ Polls:       │  │ Polls:        │  │ Polls:           │   │
│  │ bill-scan    │  │ invoice-scan  │  │ txn-import       │   │
│  │ queue        │  │ queue         │  │ queue            │   │
│  └──────┬───────┘  └───────┬───────┘  └─────────┬────────┘   │
│         │                  │                     │             │
│         └──────────────────┼─────────────────────┘             │
│                            │                                    │
│                            │ Calls Mistral OCR                  │
│                            │ via HTTP (port 8000)               │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ Private network
                             │ (Firewall: only Droplet IP allowed)
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│         LAMBDA LABS GPU SERVER ($150/month)                    │
│               NVIDIA T4 (16GB VRAM)                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Docker Container: Mistral OCR 2503 (Pixtral OCR)         │ │
│  │ ──────────────────────────────────────────────────────── │ │
│  │ - Vision-Language Model (self-hosted)                    │ │
│  │ - OCR + Data Extraction in one pass                      │ │
│  │ - Handles:                                               │ │
│  │   • Receipt photos                                       │ │
│  │   • Invoice PDFs                                         │ │
│  │   • Bank statement PDFs                                  │ │
│  │                                                           │ │
│  │ Input: Image/PDF (via HTTP POST)                         │ │
│  │ Output: JSON {vendor, date, total, lineItems, tax, ...}  │ │
│  │                                                           │ │
│  │ Port: 8000 (only accessible from Droplet IP)             │ │
│  │ Auto-restart: unless-stopped                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Security:                                                      │
│  - Firewall: ufw allow from DROPLET_IP to any port 8000        │
│  - No public internet access                                   │
│  - SSH key-only login                                           │
│                                                                 │
│  Performance:                                                   │
│  - <5s per receipt extraction (with GPU)                        │
│  - Batch processing: up to 10 receipts in parallel             │
└─────────────────────────────────────────────────────────────────┘


                    EXTERNAL SERVICES (SaaS)

┌───────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│ CLERK             │  │ SENTRY           │  │ LOGTAIL             │
│ (Auth)            │  │ (Error Tracking) │  │ (Logging)           │
│ Free up to 10K    │  │ Free 5K errors   │  │ Free 3GB/month      │
│ ───────────────── │  │ ──────────────── │  │ ─────────────────── │
│ - User signup     │  │ - Crash reports  │  │ - Centralized logs  │
│ - Login           │  │ - Stack traces   │  │ - Search/filter     │
│ - Password reset  │  │ - Email alerts   │  │ - Real-time stream  │
│ - 2FA             │  │ - User impact    │  │ - Alerts            │
│ - Social OAuth    │  │                  │  │                     │
│                   │  │ Monitors:        │  │ Sources:            │
│ JWT tokens        │  │ - Web app        │  │ - Web logs          │
│ (verified by API) │  │ - API server     │  │ - API logs          │
└───────────────────┘  └──────────────────┘  └─────────────────────┘

┌───────────────────┐  ┌──────────────────┐
│ RESEND            │  │ UPTIMEROBOT      │
│ (Email)           │  │ (Uptime Monitor) │
│ Free 3K/month     │  │ Free             │
│ ───────────────── │  │ ──────────────── │
│ - Password reset  │  │ Checks every 5min│
│ - Welcome email   │  │ - app.akount.com │
│ - Invoices        │  │ - api health     │
│ - Notifications   │  │                  │
│                   │  │ Alerts via email │
│ Domain verified   │  │ on downtime      │
└───────────────────┘  └──────────────────┘
```

---

## Data Flow Examples

### Example 1: User Uploads Receipt

```
1. User clicks "Upload Receipt" in web app
   ↓
2. Next.js uploads to Spaces (pre-signed URL)
   ↓
3. Frontend calls API: POST /api/business/bills/scan
   ↓
4. Fastify API creates UploadJob record in PostgreSQL
   ↓
5. API adds job to Redis queue (bill-scan-queue)
   ↓
6. API returns immediately: { jobId: 'xxx', status: 'PENDING' }
   ↓
7. User sees "Processing..." in UI (via SSE)
   ↓
8. BillScanWorker polls Redis queue, picks up job
   ↓
9. Worker fetches receipt from Spaces
   ↓
10. Worker sends receipt to Mistral OCR GPU server
   ↓
11. Mistral OCR extracts data: {vendor: "Starbucks", date: "2026-02-26", total: 1550}
   ↓
12. Worker creates Bill record in PostgreSQL
   ↓
13. Worker updates UploadJob status: COMPLETED
   ↓
14. SSE pushes update to frontend: "Bill created!"
   ↓
15. User sees bill in dashboard
```

**Total time:** <10 seconds (async)

---

### Example 2: User Imports Bank Statement

```
1. User uploads CSV file
   ↓
2. Frontend calls API: POST /api/banking/transactions/import
   ↓
3. API creates ImportBatch record
   ↓
4. API adds job to Redis queue (txn-import-queue)
   ↓
5. TransactionImportWorker picks up job
   ↓
6. Worker parses CSV, extracts 50 transactions
   ↓
7. Worker checks for duplicates (exact + semantic via Mistral embeddings)
   ↓
8. Worker creates 48 Transaction records (2 duplicates skipped)
   ↓
9. Worker calls CategorizationService (rule-based + Mistral LLM)
   ↓
10. Worker updates Transaction.categoryId for high-confidence matches
   ↓
11. Worker emits TransactionCreatedEvent to matching-queue
   ↓
12. MatchingWorker picks up event, searches for Bills/Invoices
   ↓
13. MatchingWorker finds 3 Bills that match transactions (date + amount)
   ↓
14. MatchingWorker links Bill.id to Transaction.sourceId
   ↓
15. User sees 48 transactions imported, 45 categorized, 3 matched to bills
```

**Total time:** <30 seconds for 50 transactions

---

### Example 3: User Signs Up

```
1. User fills sign-up form
   ↓
2. Frontend calls Clerk API (client-side)
   ↓
3. Clerk creates user, sends verification email
   ↓
4. User clicks link in email
   ↓
5. Clerk verifies email, issues JWT token
   ↓
6. Frontend redirects to /dashboard
   ↓
7. Next.js SSR calls API with JWT token
   ↓
8. Fastify verifies JWT with Clerk (via Clerk SDK)
   ↓
9. API checks if user has TenantUser record
   ↓
10. If not, API creates Tenant + TenantUser + default Entity
   ↓
11. API returns user data
   ↓
12. Dashboard renders with user's data
```

**Total time:** <2 seconds (after email verification)

---

## Security Layers

### Layer 1: Edge (Cloudflare)
- ✅ DDoS protection (unlimited)
- ✅ SSL/TLS encryption (TLS 1.3)
- ✅ Rate limiting (configurable)
- ✅ Bot detection

### Layer 2: Application (Droplet)
- ✅ Firewall (ufw): only ports 22, 80, 443 open
- ✅ NGINX reverse proxy
- ✅ JWT authentication (Clerk)
- ✅ CORS (only app.akount.com allowed)
- ✅ Helmet.js security headers

### Layer 3: Data (PostgreSQL + Spaces)
- ✅ Database encryption at rest
- ✅ SSL-enforced connections
- ✅ Row-level security (tenant isolation)
- ✅ File encryption (Spaces)
- ✅ Pre-signed URLs (1-hour expiration)

### Layer 4: GPU Server (Lambda Labs)
- ✅ Firewall: ONLY Droplet IP allowed
- ✅ No public internet access
- ✅ SSH key-only authentication
- ✅ Data never leaves your infrastructure

---

## Monitoring & Alerts

### What Gets Monitored

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| **Uptime** | UptimeRobot | Down for >1 minute |
| **Errors** | Sentry | >10 errors/minute |
| **CPU** | DigitalOcean | >90% for 5 minutes |
| **Memory** | DigitalOcean | >90% for 5 minutes |
| **Disk** | DigitalOcean | >80% used |
| **Job Failures** | Logtail | Any FAILED job |
| **GPU Offline** | Logtail | No heartbeat for 5 min |
| **Slow Queries** | Logtail | Query >1 second |

### Where Alerts Go

- 📧 Email (for all alerts)
- 📱 Slack (optional, for critical alerts)
- 📊 Dashboard (Sentry/Logtail web UI)

---

## Backup & Disaster Recovery

### Automated Backups

| Service | Frequency | Retention | Restore Time |
|---------|-----------|-----------|--------------|
| **PostgreSQL** | Daily (3am UTC) | 7 days | <5 minutes |
| **Spaces** | On-demand | Versioning enabled | <1 minute |
| **Code** | Git push | Infinite | <10 minutes (redeploy) |

### Disaster Recovery Plan

**Scenario: Droplet crashes**
1. Spin up new Droplet (5 minutes)
2. Restore PostgreSQL backup (5 minutes)
3. Deploy code from Git (10 minutes)
4. Update DNS in Cloudflare (15 minutes for propagation)
**Total downtime:** ~20 minutes

**Scenario: GPU server crashes**
1. Receipts queue in Redis (no data loss)
2. Restart Lambda Labs instance (2 minutes)
3. Workers resume processing
**User impact:** Delayed processing, no data loss

**Scenario: Database corruption**
1. Restore from daily backup (5 minutes)
2. Replay transaction log to latest state
**Data loss:** <1 hour of data

---

## Scaling Path (When to Upgrade)

### At 2,000 users (~$450/month)
- ✅ Upgrade Droplet to $48/month (8GB RAM / 4 vCPU)
- ✅ Upgrade PostgreSQL to $30/month (2GB RAM)
- ✅ Keep everything else the same

### At 5,000 users (~$800/month)
- ✅ Add Load Balancer ($12/month)
- ✅ Add second Droplet ($48/month)
- ✅ Add PostgreSQL read replica ($60/month)
- ✅ Add second GPU server ($150/month)

### At 10,000 users (~$1,500/month)
- ✅ Add third Droplet
- ✅ Upgrade PostgreSQL to $60/month (4GB RAM)
- ✅ Upgrade Redis to $30/month (2GB RAM)
- ✅ CDN bandwidth costs increase (~$50/month)

---

## Cost Breakdown (1,000 Users)

| Service | Monthly Cost | Annual Cost |
|---------|--------------|-------------|
| DigitalOcean Droplet (4GB) | $24 | $288 |
| PostgreSQL (1GB) | $15 | $180 |
| Redis (1GB) | $15 | $180 |
| Spaces | $5 | $60 |
| Lambda Labs GPU (T4) | $150 | $1,800 |
| Cloudflare | $0 | $0 |
| Clerk | $0 | $0 |
| Sentry | $0 | $0 |
| Logtail | $0 | $0 |
| Resend | $0 | $0 |
| UptimeRobot | $0 | $0 |
| Domain (akount.com) | $1 | $12 |
| **Total** | **$210/month** | **$2,520/year** |

**Per-user cost:** $0.21/month (very affordable!)

---

## FAQ

**Q: Why not use AWS instead of DigitalOcean?**
A: DigitalOcean is simpler and 30-40% cheaper for small scale. You can migrate to AWS later if needed.

**Q: Can I use a cheaper GPU than Lambda Labs?**
A: Yes - RunPod or Vast.ai are cheaper (~$100/month) but less reliable. Lambda Labs has better uptime.

**Q: Do I need a separate server for the GPU?**
A: Yes - for security (financial data) and performance (GPU workloads). Never mix GPU and web traffic.

**Q: What happens if Redis goes down?**
A: Jobs queue in memory temporarily. When Redis comes back online, jobs resume. No data loss.

**Q: Can I self-host Clerk too?**
A: No - Clerk is SaaS only. But it's SOC2 compliant and handles auth better than custom solutions.

---

**Created:** 2026-02-26
**Next Review:** When hitting 1,000 users (update scaling recommendations)
