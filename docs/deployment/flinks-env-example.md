# Flinks Environment Variables Reference

> **Purpose:** Template for `.env.example` files that should be copied to:
> - `apps/api/.env.example`
> - `apps/web/.env.example` (subset - no secrets)

---

## API Environment Variables (`apps/api/.env.example`)

```bash
# ─── Environment Configuration Example ───────────────────────────────
# Copy this file to .env and fill in actual values
# NEVER commit .env to version control (it's in .gitignore)

# ─── Application ─────────────────────────────────────────────────────
NODE_ENV=development
PORT=3001

# ─── Database ────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/akount_dev?schema=public

# ─── Clerk Authentication ────────────────────────────────────────────
# Get from: https://dashboard.clerk.com
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# ─── CORS ────────────────────────────────────────────────────────────
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000

# ─── File Upload ─────────────────────────────────────────────────────
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# ─── ClamAV (optional - virus scanning) ──────────────────────────────
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# ─── Flinks Bank Connection ──────────────────────────────────────────
# Required in production for live bank feed integration
# Optional in dev (service falls back to demo mode if not set)
#
# To get these credentials:
# 1. Sign up at https://flinks.com/contact/
# 2. Complete onboarding with Flinks team
# 3. Get credentials from Flinks Dashboard (https://dashboard.flinks.com)
#
# Environments:
# - Toolbox (dev/testing): https://toolbox-iframe.private.fin.ag
# - Production: https://iframe.flinks.com
#
FLINKS_INSTANCE=toolbox                                    # "toolbox" for dev, "prod" for live
FLINKS_CUSTOMER_ID=your_customer_id_here                   # Customer ID from Flinks dashboard
FLINKS_SECRET=your_api_secret_here                         # API secret (NEVER expose client-side)
FLINKS_CONNECT_URL=https://toolbox-iframe.private.fin.ag   # Iframe URL for Connect widget
FLINKS_API_URL=https://toolbox-api.private.fin.ag          # REST API endpoint

# ─── Notes ───────────────────────────────────────────────────────────
# - All FLINKS_* vars must be set for bank connection feature to work in production
# - Demo mode: If FLINKS_* vars are missing, service uses mock data
# - Production checklist: See docs/deployment/flinks-production-activation.md
```

---

## Web Environment Variables (`apps/web/.env.example`)

```bash
# ─── Environment Configuration Example (Web) ─────────────────────────
# Copy this file to .env.local and fill in actual values
# NEVER commit .env.local to version control (it's in .gitignore)

# ─── Clerk Authentication ────────────────────────────────────────────
# Get from: https://dashboard.clerk.com
# Note: Publishable key is safe to expose client-side
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# ─── API Endpoint ────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001

# ─── Notes ───────────────────────────────────────────────────────────
# - Flinks credentials are NOT needed on web side (handled by API)
# - CSP for Flinks iframes is configured in next.config.js
```

---

## Environment Variable Descriptions

| Variable | Required | Description | Example Values |
|----------|----------|-------------|----------------|
| `FLINKS_INSTANCE` | Production | Flinks environment identifier | `toolbox`, `prod` |
| `FLINKS_CUSTOMER_ID` | Production | Customer ID from Flinks dashboard | `abc123def456` |
| `FLINKS_SECRET` | Production | API secret for authentication | `sk_live_xxxxxx` (NEVER commit) |
| `FLINKS_CONNECT_URL` | Production | Iframe URL for Connect widget | `https://iframe.flinks.com` (prod)<br>`https://toolbox-iframe.private.fin.ag` (dev) |
| `FLINKS_API_URL` | Production | REST API endpoint | `https://api.flinks.com` (prod)<br>`https://toolbox-api.private.fin.ag` (dev) |

---

## Security Notes

### Critical: Secret Management

**FLINKS_SECRET must NEVER be:**
- ❌ Committed to git (even in .env.example)
- ❌ Exposed client-side (never in `NEXT_PUBLIC_*`)
- ❌ Logged in error messages
- ❌ Shared in plaintext (use secure channels only)

**Best practices:**
- ✅ Use environment variable injection (Vercel, Docker secrets, etc.)
- ✅ Rotate immediately if leaked
- ✅ Different secrets for dev/staging/prod
- ✅ Access control on Flinks dashboard (who can view credentials)

### CSP Configuration

The Content Security Policy is configured in `apps/web/next.config.js`:

```javascript
{
  key: 'Content-Security-Policy',
  value: "frame-src 'self' https://toolbox-iframe.private.fin.ag https://*.private.fin.ag;",
}
```

**For production**, add production Flinks domain:
```javascript
value: "frame-src 'self' https://iframe.flinks.com https://toolbox-iframe.private.fin.ag https://*.private.fin.ag;",
```

---

## Demo Mode Behavior

If **any** of the 5 Flinks variables are missing:
- Service falls back to **demo mode** automatically
- Uses hardcoded mock accounts (see `flinks.service.ts`)
- No live API calls to Flinks
- Safe for local development

**Demo accounts include:**
- Personal Chequing (CAD) with 10 transactions
- Business Savings (CAD) with 5 transactions
- Visa Infinite Credit Card (CAD) with 2 transactions

---

## Next Steps

1. **Copy templates** to actual .env files:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

2. **Fill in Clerk credentials** (required for auth to work)

3. **Leave Flinks vars commented out** for local dev (uses demo mode)

4. **When ready for production**, follow [Flinks Production Activation Checklist](./flinks-production-activation.md)

---

**Last Updated:** 2026-02-24
