# Flinks Production Activation Checklist

> **Status:** Code Complete | **Awaiting:** API Credentials
> **Last Updated:** 2026-02-24
> **Owner:** Infrastructure Team

---

## Overview

Flinks bank connection integration is **fully implemented and tested** in demo mode. This checklist guides the activation of live bank feeds once Flinks API credentials are obtained.

**What's Already Done:**
- ✅ FlinksService with connection, refresh, disconnect flows
- ✅ 4 API endpoints with RBAC + rate limiting
- ✅ FlinksConnect iframe component with postMessage security
- ✅ AddAccountModal 3-view flow (choose → connect → success)
- ✅ Server actions + API client wiring
- ✅ CSP frame-src whitelisting for Flinks domains
- ✅ PII scrubbing (account numbers, holder info)
- ✅ 33 passing tests (21 service + 12 route)
- ✅ Demo mode fallback for development

**What's Needed:**
- 🔑 5 Flinks API credentials (see below)
- 🔧 Environment variable configuration
- ✅ Production deployment
- 🧪 Live bank connection test

---

## Prerequisites

### 1. Flinks Account Setup

**Sign up for Flinks:**
1. Visit [https://flinks.com/contact/](https://flinks.com/contact/)
2. Fill out business information form
3. Complete onboarding call with Flinks team (usually 1-2 weeks)
4. Receive credentials via secure channel

**What You'll Receive:**
- Customer ID
- API Secret
- Instance identifier (e.g., "toolbox" for staging, "prod" for live)
- Iframe URLs (Connect widget + API endpoint)

**Pricing:**
- Contact Flinks for pricing tiers (typically per-connection or transaction-based)
- Development/sandbox access is usually free during onboarding

---

## Environment Variables

### Required Variables (All 5 Must Be Set)

Add these to your production environment configuration:

```bash
# Flinks Bank Connection (PRODUCTION)
FLINKS_INSTANCE=prod                          # "prod" for production, "toolbox" for staging
FLINKS_CUSTOMER_ID=<your_customer_id>         # From Flinks Dashboard
FLINKS_SECRET=<your_api_secret>               # CRITICAL: Never commit to git or expose client-side
FLINKS_CONNECT_URL=https://iframe.flinks.com  # Production iframe URL
FLINKS_API_URL=https://api.flinks.com         # Production REST API
```

### Development/Staging Variables (Toolbox)

For staging environments, use Flinks Toolbox:

```bash
# Flinks Bank Connection (STAGING)
FLINKS_INSTANCE=toolbox
FLINKS_CUSTOMER_ID=<your_toolbox_customer_id>
FLINKS_SECRET=<your_toolbox_secret>
FLINKS_CONNECT_URL=https://toolbox-iframe.private.fin.ag
FLINKS_API_URL=https://toolbox-api.private.fin.ag
```

### Demo Mode (No Credentials)

If **any** of the 5 variables are missing, the service automatically falls back to **demo mode**:
- Uses hardcoded mock accounts (Personal Chequing, Visa Infinite)
- No live bank feeds
- Safe for local development without Flinks access

---

## Deployment Steps

### Step 1: Verify Current Implementation

```bash
# Check that all Flinks code is present
git log --oneline --grep="Flinks"

# Expected commit: a645ce1 - feat(banking): Sprint 2 — Flinks Connect bank connection integration

# Verify files exist
ls -la apps/api/src/domains/banking/services/flinks.service.ts
ls -la apps/api/src/domains/banking/routes/connections.ts
ls -la apps/web/src/components/banking/FlinksConnect.tsx
```

### Step 2: Configure Environment Variables

**For Vercel:**
```bash
vercel env add FLINKS_INSTANCE
# Enter value: prod
vercel env add FLINKS_CUSTOMER_ID
# Enter value: <your_customer_id>
vercel env add FLINKS_SECRET
# Enter value: <your_secret>
vercel env add FLINKS_CONNECT_URL
# Enter value: https://iframe.flinks.com
vercel env add FLINKS_API_URL
# Enter value: https://api.flinks.com

# Redeploy to apply env vars
vercel --prod
```

**For Docker/Self-Hosted:**
```bash
# Add to .env.production or Docker secrets
echo "FLINKS_INSTANCE=prod" >> .env.production
echo "FLINKS_CUSTOMER_ID=<id>" >> .env.production
echo "FLINKS_SECRET=<secret>" >> .env.production
echo "FLINKS_CONNECT_URL=https://iframe.flinks.com" >> .env.production
echo "FLINKS_API_URL=https://api.flinks.com" >> .env.production

# Restart services
docker-compose restart api web
```

### Step 3: Verify Production Safety Checks

The API automatically validates Flinks credentials in production. Check logs after deployment:

```bash
# Expected: No warnings about FLINKS_* vars
tail -f logs/api.log | grep "FLINKS"

# ✅ Good: (no output)
# ❌ Bad: "FLINKS_* env vars missing — bank connection feature disabled"
```

### Step 4: Test Live Connection (Critical)

**Test with a real bank account:**

1. Navigate to `/banking/accounts`
2. Click "Add Account" → "Connect Bank"
3. Select a test bank institution (use your own bank or Flinks test credentials)
4. Complete authentication flow in iframe
5. **Verify:**
   - New `BankConnection` record created in database
   - Accounts imported with correct balances
   - Transactions populated
   - PII scrubbed in `rawData` JSON field

**SQL verification:**
```sql
-- Check latest connection
SELECT
  id,
  entityId,
  institutionName,
  status,
  accountCount,
  transactionCount,
  createdAt
FROM "BankConnection"
WHERE status = 'ACTIVE'
ORDER BY createdAt DESC
LIMIT 1;

-- Verify PII scrubbing (should see ****1234, not full account number)
SELECT
  name,
  accountNumber,
  rawData->>'AccountNumber' as scrubbed_account
FROM "Account"
WHERE connectionId = '<connection_id>'
LIMIT 1;
```

### Step 5: Monitor Error Rates

After activation, monitor for Flinks API errors:

```bash
# Check Flinks-specific errors in logs
grep "FlinksError" logs/api.log | tail -20

# Expected: Zero errors for valid credentials
# Common issues:
# - "INVALID_CREDENTIALS" → wrong secret or customer ID
# - "INSTITUTION_DOWN" → bank temporarily unavailable (normal)
# - "RATE_LIMIT_EXCEEDED" → too many requests (check pricing tier)
```

### Step 6: Update Documentation

Once live, update:
- ✅ Mark Flinks as "Active" in [STATUS.md](../../STATUS.md)
- ✅ Add "Bank Connections" to feature list in [README.md](../../README.md)
- ✅ Update INFRA-13 in [TASKS.md](../../TASKS.md) to "done"

---

## Security Checklist

### Content Security Policy (CSP)

**Already configured** in `apps/web/next.config.js`:

```javascript
{
  key: 'Content-Security-Policy',
  value: "frame-src 'self' https://toolbox-iframe.private.fin.ag https://*.private.fin.ag;",
}
```

**For production**, verify this covers your Flinks iframe URL:
- If using `https://iframe.flinks.com`, add to CSP:
  ```javascript
  value: "frame-src 'self' https://iframe.flinks.com https://toolbox-iframe.private.fin.ag https://*.private.fin.ag;",
  ```

### Origin Validation

**Already implemented** in `FlinksConnect.tsx` (line 50-52):

```typescript
// CRITICAL: Validate origin to prevent cross-site attacks
if (event.origin !== allowedOrigin) {
  return;
}
```

This prevents malicious iframes from sending fake loginIds.

### PII Scrubbing

**Already implemented** in `flinks.service.ts` (`scrubPII` function):

- Account numbers masked (keeps last 4 digits: `****1234`)
- Transit/routing numbers removed
- Holder names redacted (`[REDACTED]`)

**Verify** after first connection:
```sql
SELECT rawData FROM "Account" WHERE connectionId = '<id>' LIMIT 1;
-- Should NOT contain full account numbers or holder emails
```

### Secret Management

**Critical:** NEVER commit `FLINKS_SECRET` to git or expose client-side.

- ❌ Don't: Hardcode in source code
- ❌ Don't: Pass to frontend via props
- ❌ Don't: Log in error messages
- ✅ Do: Use environment variables only
- ✅ Do: Rotate secret if leaked (contact Flinks immediately)

---

## Rollback Procedure

If Flinks integration causes issues in production:

### Option 1: Disable Temporarily (Keep Code)

```bash
# Remove env vars to fall back to demo mode
vercel env rm FLINKS_INSTANCE --yes
vercel env rm FLINKS_CUSTOMER_ID --yes
vercel env rm FLINKS_SECRET --yes
vercel env rm FLINKS_CONNECT_URL --yes
vercel env rm FLINKS_API_URL --yes

# Redeploy
vercel --prod
```

Result: Service falls back to demo mode. "Connect Bank" button still visible but uses mock data.

### Option 2: Disable Feature Flag (If Implemented)

If you have feature flags (e.g., LaunchDarkly, PostHog):

```typescript
if (!featureFlags.bankConnections) {
  // Hide "Connect Bank" button
}
```

### Option 3: Revert Code (Nuclear Option)

```bash
# Revert to commit before Flinks integration
git revert a645ce1

# Or create a hotfix branch without Flinks routes
git checkout -b hotfix/disable-flinks
# Remove Flinks routes from apps/api/src/domains/banking/routes/index.ts
git commit -m "hotfix: disable Flinks integration"
git push origin hotfix/disable-flinks
```

---

## Support Contacts

**Flinks Support:**
- Email: support@flinks.com
- Dashboard: https://dashboard.flinks.com
- Documentation: https://docs.flinks.com

**Akount Internal:**
- Infrastructure Lead: [TBD]
- Banking Domain Owner: [TBD]
- On-call Engineer: [TBD]

---

## Appendix: Architecture Overview

### Flow Diagram

```
User clicks "Connect Bank"
  ↓
AddAccountModal opens (choose → connect → success)
  ↓
FlinksConnect component loads iframe
  ↓
User authenticates with bank in Flinks iframe
  ↓
Flinks sends REDIRECT event with loginId via postMessage
  ↓
FlinksConnect validates origin, calls server action
  ↓
Server action → POST /api/banking/connections
  ↓
FlinksService.processConnection(loginId, entityId)
  ↓
Fetch accounts from Flinks API (GetAccountsDetail)
  ↓
Create BankConnection + Account records
  ↓
Import transactions
  ↓
Scrub PII in rawData field
  ↓
Return success to frontend
  ↓
Show success view with account summary
```

### Database Schema

**BankConnection:**
- `id` (cuid)
- `entityId` (FK to Entity)
- `externalLoginId` (from Flinks)
- `institutionName`
- `status` (ACTIVE, ERROR, DISCONNECTED)
- `accountCount`, `transactionCount`
- `lastSyncAt`, `createdAt`, `updatedAt`

**Account:**
- `id` (cuid)
- `entityId` (FK to Entity)
- `connectionId` (FK to BankConnection, nullable)
- `name`, `accountNumber` (last 4 only), `type`, `currency`
- `currentBalance`, `availableBalance`
- `rawData` (JSON - scrubbed)
- `isFeedConnected` (boolean)

**Transaction:**
- `id` (cuid)
- `accountId` (FK to Account)
- `externalId` (from Flinks)
- `date`, `description`, `amount`, `balance`
- `isReconciled`, `isPosted`

### API Endpoints

All routes protected by:
- Clerk JWT auth
- Tenant isolation middleware
- RBAC (OWNER/ADMIN only)
- Rate limiting (10 req/min per tenant)

**POST /api/banking/connections**
- Body: `{ loginId: string, entityId: string }`
- Returns: `BankConnectionResult` (connection + accounts + transaction counts)

**GET /api/banking/connections/:id**
- Returns: `BankConnection` with accounts

**POST /api/banking/connections/:id/refresh**
- Triggers: Fetch latest transactions from Flinks
- Returns: Updated transaction counts

**DELETE /api/banking/connections/:id**
- Soft delete: Sets `status = 'DISCONNECTED'`
- Note: Keeps historical accounts/transactions for audit

---

## FAQ

**Q: Can we use Flinks in Canada and US?**
A: Yes, Flinks supports 10,000+ institutions across North America. Check [Flinks Coverage](https://flinks.com/coverage/) for full list.

**Q: What happens if a user's bank is down?**
A: Flinks returns `INSTITUTION_DOWN` error. Show friendly message: "Bank temporarily unavailable. Try again later."

**Q: How often should we refresh connections?**
A: Recommended: Daily background job to call `/refresh` for all active connections. Flinks has rate limits, so batch carefully.

**Q: What if Flinks changes their API?**
A: Monitor Flinks changelog (https://docs.flinks.com/changelog). Most updates are backward-compatible. Version is not in our URL, so we auto-get updates.

**Q: Can users connect multiple banks?**
A: Yes, unlimited connections per entity. Each bank = separate `BankConnection` record.

**Q: What about bank account changes (new account, closed account)?**
A: Call `/refresh` endpoint. Flinks returns updated list. Mark missing accounts as closed.

---

**End of Checklist** | Ready for Production Activation 🚀
