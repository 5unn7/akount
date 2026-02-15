# Fix: New User Stuck After Sign-up - API Server Unavailable

**Created:** 2026-02-14
**Status:** Draft
**Type:** Bug Fix
**Priority:** P0 (Critical - blocks user onboarding)

## Overview

New users are stuck after completing the Clerk sign-up with error "API server unavailable". The onboarding flow fails when attempting to call `/api/system/onboarding/initialize` from [EssentialInfoStep.tsx:124](apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx#L124).

## Problem Analysis

### What Works
✅ Backend routes exist and are properly registered:
- `/api/system/onboarding/initialize` exists in [onboarding.ts](apps/api/src/domains/system/routes/onboarding.ts#L71)
- Routes are mounted correctly in [routes.ts:52-55](apps/api/src/domains/system/routes.ts#L52-L55)
- Auth middleware is applied (users must be authenticated via Clerk)
- NO tenant middleware required (users don't have tenants yet during onboarding)

✅ Frontend code exists:
- [EssentialInfoStep.tsx](apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx) has form submission logic
- Uses `apiFetch` from [client-browser.ts](apps/web/src/lib/api/client-browser.ts)

### Root Causes (Hypothesis)

The error "API server unavailable" is a **network-level error**, not an application error. Most likely causes:

1. **Missing/incorrect `NEXT_PUBLIC_API_URL` environment variable** (HIGH PROBABILITY)
   - Defaults to `http://localhost:4000` in code
   - User may not have this env var set
   - OR: env var points to wrong host/port


3. **Port conflict** (LOW PROBABILITY)
   - Port 4000 may be occupied by another process

4. **CORS misconfiguration** (LOW PROBABILITY)
   - Dev mode should allow all origins (index.ts:101)
   - But production CORS_ORIGINS may be too restrictive

5. **Clerk auth token issue** (LOW PROBABILITY)
   - Token may not be available immediately after sign-up
   - window.Clerk session may not be initialized yet

## Success Criteria

- [ ] New users can complete onboarding flow without "API server unavailable" error
- [ ] Clear error messages guide users to fix environment issues
- [ ] Dev setup documentation includes all required env vars

## Tasks

### Task 1: Add Environment Variable Validation
**File:** `apps/web/src/lib/api/client-browser.ts`
**What:** Add runtime check for `NEXT_PUBLIC_API_URL` and show clear error if missing or unreachable
**Depends on:** none
**Success:** Clear error message tells user to check env vars and API server status

**Implementation:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Add this helper
function getAPIUrl(): string {
  if (!API_URL) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not configured. Please set it in your .env.local file.'
    )
  }
  return API_URL
}

// Update apiFetch to use helper and add better error handling
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const clerk = (window as any).Clerk
  const token = await clerk?.session?.getToken()

  if (!token) {
    throw new Error('Not authenticated — please sign in')
  }

  try {
    const apiUrl = getAPIUrl()
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }))
      throw new Error(error.message || error.error || `API error: ${response.status}`)
    }

    if (response.status === 204) return undefined as never
    return response.json()
  } catch (error) {
    // Network errors (ECONNREFUSED, etc)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to API server at ${API_URL}. ` +
        `Please ensure the API server is running (npm run dev at root).`
      )
    }
    throw error
  }
}
```

### Task 2: Create .env.example for Web App
**File:** `apps/web/.env.example`
**What:** Document all required environment variables for web app
**Depends on:** none
**Success:** File exists with clear comments

**Implementation:**
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API Server URL (required)
# Development: http://localhost:4000
# Production: https://api.akount.com
NEXT_PUBLIC_API_URL=http://localhost:4000

# Clerk Sign-in URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Task 3: Update README with Setup Instructions
**File:** `README.md`
**What:** Add clear dev setup instructions with all required env vars
**Depends on:** Task 2
**Success:** README has step-by-step setup guide

**Add section:**
```markdown
## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Environment Setup

1. **Clone and install:**
   ```bash
   git clone <repo>
   cd akount
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Root .env (API + DB)
   cp .env.example .env
   # Edit .env with your database URL and Clerk secret

   # Web app .env.local
   cp apps/web/.env.example apps/web/.env.local
   # Edit with your Clerk publishable key
   ```

3. **Initialize database:**
   ```bash
   npm run db:push
   npm run db:seed  # Optional
   ```

4. **Start dev servers:**
   ```bash
   npm run dev
   ```
   This starts:
   - API server on http://localhost:4000
   - Web app on http://localhost:3000

### Common Issues

**"API server unavailable" error:**
- Ensure both dev servers are running (`npm run dev` at root)
- Check `NEXT_PUBLIC_API_URL` in `apps/web/.env.local`
- Verify API server is listening on port 4000

**"Not authenticated" error:**
- Check Clerk keys in `.env` and `apps/web/.env.local`
- Ensure `CLERK_SECRET_KEY` (API) and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (web) match your Clerk project
```

### Task 4: Add API Health Check on Mount
**File:** `apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx`
**What:** Ping API health endpoint on component mount to fail fast with clear error
**Depends on:** Task 1
**Risk:** none
**Success:** User sees clear error if API is unreachable before they fill form

**Implementation:**
```typescript
// Add near top of component
useEffect(() => {
  // Health check on mount
  const checkAPIHealth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/health`,
        { method: 'GET' }
      )
      if (!response.ok) {
        setApiError('API server is not responding. Please ensure the API server is running.')
      }
    } catch (error) {
      setApiError(
        'Cannot connect to API server. Please run "npm run dev" at the project root to start all services.'
      )
    }
  }

  checkAPIHealth()
}, [])
```

### Task 5: Add Startup Validation Script
**File:** `scripts/check-env.mjs`
**What:** Validate all required env vars before starting dev servers
**Depends on:** none
**Success:** Script exits with clear error if env vars are missing

**Implementation:**
```javascript
#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const requiredEnvVars = {
  root: ['DATABASE_URL', 'CLERK_SECRET_KEY'],
  web: ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
}

function checkEnvFile(path, vars, label) {
  if (!existsSync(path)) {
    console.error(`❌ Missing ${label} file: ${path}`)
    console.error(`   Copy from ${path}.example and fill in values`)
    return false
  }

  const content = readFileSync(path, 'utf8')
  const missing = []

  for (const varName of vars) {
    if (!content.includes(`${varName}=`)) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required env vars in ${label}:`)
    missing.forEach((v) => console.error(`   - ${v}`))
    return false
  }

  console.log(`✅ ${label} environment configured`)
  return true
}

const rootOk = checkEnvFile(resolve('.env'), requiredEnvVars.root, 'Root .env')
const webOk = checkEnvFile(
  resolve('apps/web/.env.local'),
  requiredEnvVars.web,
  'Web .env.local'
)

if (!rootOk || !webOk) {
  console.error('\n❌ Environment validation failed. Please fix the issues above.')
  process.exit(1)
}

console.log('\n✅ All environment variables configured correctly')
```

**Update package.json:**
```json
{
  "scripts": {
    "predev": "node scripts/check-env.mjs",
    "dev": "turbo dev"
  }
}
```

## Edge Cases

| Case | Handling |
|------|----------|
| API server crashes mid-onboarding | Show error with "Retry" button and link to setup docs |
| Clerk session expires during form fill | Token refresh should happen automatically via Clerk SDK |
| User has multiple tabs open | Each tab gets own session, should work independently |
| Port 4000 occupied | Env validation script should detect and suggest alternative port |
| Production deployment | CORS_ORIGINS must include production domain |

## Testing Strategy

1. **Manual test: Fresh setup**
   - Clone repo fresh
   - Follow README setup steps
   - Verify new user onboarding works end-to-end

2. **Manual test: Missing env vars**
   - Remove `NEXT_PUBLIC_API_URL` from .env.local
   - Start dev servers
   - Verify clear error message appears

3. **Manual test: API server not running**
   - Start only web server (not API)
   - Attempt onboarding
   - Verify clear error message

4. **Manual test: Port conflict**
   - Run something else on port 4000
   - Start dev servers
   - Verify clear error about port conflict

## Rollback Plan

If validation breaks existing setups:
1. Remove predev script hook
2. Keep improved error messages in client-browser.ts
3. Document manual setup steps more clearly

## Progress

- [x] Task 1: Environment variable validation (client-browser.ts updated)
- [x] Task 2: .env.example for web app (documented in README - .env files blocked by security)
- [x] Task 3: README update (comprehensive setup guide added)
- [x] Task 4: API health check on mount (EssentialInfoStep.tsx updated)
- [x] Task 5: Startup validation script (scripts/check-env.mjs created, check:env command added)
- [ ] Manual testing (requires user with actual environment setup)
- [ ] Documentation review

## Reference Files

- [apps/web/src/lib/api/client-browser.ts](apps/web/src/lib/api/client-browser.ts) — Client API wrapper
- [apps/api/src/domains/system/routes/onboarding.ts](apps/api/src/domains/system/routes/onboarding.ts) — Backend routes
- [apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx](apps/web/src/app/onboarding/components/steps/EssentialInfoStep.tsx) — Form component
- [apps/api/src/index.ts](apps/api/src/index.ts) — API server entry point

## Notes

- This is a **dev experience** issue, not a production bug (production would have proper env vars)
- The actual onboarding API endpoints are working correctly
- Focus is on failing fast with clear errors rather than silent failures
