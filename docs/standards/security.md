# Security Standard

**Criticality:** ZERO TOLERANCE - Security violations = data breaches
**Last Updated:** 2026-01-30
**Framework:** OWASP Top 10 Compliance

---

## Core Principles

1. **Zero Trust** - Validate everything, trust nothing
2. **Defense in Depth** - Multiple layers of security
3. **Least Privilege** - Minimum access required
4. **Audit Everything** - Log security events

---

## OWASP Top 10 Protection

### 1. Broken Access Control

**✅ CORRECT: Always Validate Ownership**
```typescript
// Get user's tenant first
const tenantUser = await prisma.tenantUser.findFirst({
  where: { userId: request.userId }
})

// Then check resource ownership
const invoice = await prisma.invoice.findFirst({
  where: {
    id: invoiceId,
    tenantId: tenantUser.tenantId  // REQUIRED
  }
})

if (!invoice) {
  return reply.status(404).send({ error: 'Not found' })
}
```

**❌ WRONG: No Ownership Check**
```typescript
// SECURITY VULNERABILITY
const invoice = await prisma.invoice.findFirst({
  where: { id: invoiceId }  // Any user can access any invoice!
})
```

**See:** `docs/standards/multi-tenancy.md` for complete patterns

---

### 2. Cryptographic Failures

**Sensitive Data Protection:**
```typescript
// Environment variables (NEVER commit)
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
const DATABASE_URL = process.env.DATABASE_URL

// Passwords (use Clerk - never store passwords)
// API keys (use Clerk sessions)

// Encryption at rest (PostgreSQL native)
// Encryption in transit (TLS/HTTPS required)
```

**✅ CORRECT: Secure Logging**
```typescript
// Safe to log
logger.info({ userId: user.id, action: 'invoice_created' })

// NEVER log sensitive data
// ❌ logger.info({ token: request.headers.authorization })
// ❌ logger.info({ password: user.password })
// ❌ logger.info({ apiKey: user.apiKey })
```

---

### 3. Injection Attacks

**✅ CORRECT: Use Prisma (Prevents SQL Injection)**
```typescript
// Prisma parameterizes all queries
const invoices = await prisma.invoice.findMany({
  where: {
    clientName: { contains: searchQuery }  // Safe - parameterized
  }
})
```

**❌ WRONG: Raw SQL with User Input**
```typescript
// SECURITY VULNERABILITY: SQL Injection
const result = await prisma.$queryRaw`
  SELECT * FROM invoices WHERE client_name = ${searchQuery}
`
// If searchQuery = "'; DROP TABLE invoices; --" → disaster
```

**✅ If Raw SQL Needed: Use Parameterization**
```typescript
// Safe - parameterized raw query
const result = await prisma.$queryRaw`
  SELECT * FROM invoices WHERE client_name = ${searchQuery}
`
// Prisma still parameterizes, but prefer Prisma ORM methods
```

---

### 4. Insecure Design

**Authentication: Use Clerk (Industry Standard)**
```typescript
// Clerk handles:
// - Password hashing (bcrypt)
// - Session management
// - Token generation/validation
// - MFA, passkeys (WebAuthn)
// - Device tracking
// - Rate limiting

import { createClerkClient } from '@clerk/backend'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

export async function authMiddleware(request, reply) {
  const token = request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  try {
    const session = await clerkClient.sessions.verifyToken(token)
    request.userId = session.userId
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
```

---

### 5. Security Misconfiguration

**✅ Proper Configuration:**
```typescript
// apps/api/src/index.ts
const fastify = Fastify({
  logger: true,  // Enable logging
  trustProxy: true,  // Behind reverse proxy
  // NEVER expose stack traces in production
  exposeHeadRoutes: false
})

// CORS - Restrict origins
await fastify.register(cors, {
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
})

// Rate limiting
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes'
})

// Helmet (security headers)
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
})
```

---

### 6. Vulnerable and Outdated Components

**Dependency Management:**
```bash
# Regular updates
npm audit
npm audit fix

# Check for vulnerabilities
npx snyk test

# Keep dependencies current
npm outdated
```

**Automated Scanning:**
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=high
```

---

### 7. Identification and Authentication Failures

**Session Management (Clerk):**
```typescript
// Clerk handles:
// - Session tokens (JWT)
// - Token expiration
// - Token refresh
// - Multi-device support
// - Session invalidation

// Verify session on every request
export async function authMiddleware(request, reply) {
  const token = request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const session = await clerkClient.sessions.verifyToken(token)

  if (session.status !== 'active') {
    return reply.status(401).send({ error: 'Session expired' })
  }

  request.userId = session.userId
  request.sessionId = session.id
}
```

---

### 8. Software and Data Integrity Failures

**Audit Logging:**
```typescript
model AuditLog {
  id String @id @default(cuid())
  tenantId String
  userId String
  action String        // 'invoice_created', 'payment_deleted', etc.
  resourceType String  // 'Invoice', 'Payment', etc.
  resourceId String
  oldValue Json?
  newValue Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}

// Log critical actions
async function logAudit(data: {
  tenantId: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  oldValue?: any
  newValue?: any
}) {
  await prisma.auditLog.create({ data })
}

// Usage
await logAudit({
  tenantId: user.tenantId,
  userId: user.id,
  action: 'invoice_deleted',
  resourceType: 'Invoice',
  resourceId: invoice.id,
  oldValue: invoice
})
```

---

### 9. Security Logging and Monitoring Failures

**Critical Events to Log:**
```typescript
// Authentication events
logger.info({ event: 'login_success', userId, ip })
logger.warn({ event: 'login_failed', username, ip })
logger.warn({ event: 'invalid_token', ip })

// Authorization failures
logger.warn({ event: 'access_denied', userId, resource, ip })

// Data modifications
logger.info({ event: 'invoice_created', userId, invoiceId })
logger.warn({ event: 'invoice_deleted', userId, invoiceId })

// Security events
logger.error({ event: 'sql_injection_attempt', query, ip })
logger.error({ event: 'xss_attempt', input, ip })
```

**Monitoring:**
- Use Sentry for error tracking
- Use Vercel Analytics for frontend
- Set up alerts for suspicious patterns

---

### 10. Server-Side Request Forgery (SSRF)

**✅ Validate External URLs:**
```typescript
// If accepting URLs from users
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false

    // Block private IPs
    const host = parsed.hostname
    if (
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.')
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

// Usage
if (!isValidUrl(userProvidedUrl)) {
  return reply.status(400).send({ error: 'Invalid URL' })
}
```

---

## Input Validation

### Always Validate with Zod

**✅ CORRECT:**
```typescript
const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  date: z.string().datetime(),
  amount: z.number().int().positive().max(999999999),  // $9,999,999.99 max
  clientId: z.string().uuid(),
  notes: z.string().max(5000).optional()
})

// Fastify + Zod integration
server.post('/invoices', {
  schema: {
    body: createInvoiceSchema
  }
}, async (request, reply) => {
  // request.body is validated and typed
})
```

**Common Validation Patterns:**
```typescript
// Email
z.string().email()

// URL
z.string().url()

// UUID
z.string().uuid()

// Enum
z.enum(['draft', 'sent', 'paid'])

// Integer range
z.number().int().min(0).max(100)

// String length
z.string().min(1).max(255)

// Sanitize HTML (if accepting rich text)
import DOMPurify from 'isomorphic-dompurify'
const sanitized = DOMPurify.sanitize(userInput)
```

---

## Sensitive Data Handling

### Never Log Secrets

**❌ NEVER Log:**
- Passwords
- API keys
- Session tokens
- Authentication headers
- Credit card numbers
- Social insurance numbers
- Any PII (Personal Identifiable Information)

**✅ Safe to Log:**
- User IDs (UUIDs)
- Resource IDs
- Action names
- Timestamps
- IP addresses (for audit)
- User agent strings (for audit)

### Environment Variables

**✅ CORRECT:**
```bash
# .env (NEVER commit to git)
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY="sk_..."
CLERK_PUBLISHABLE_KEY="pk_..."

# .env.example (commit to git)
DATABASE_URL="postgresql://user:pass@host:5432/db"
CLERK_SECRET_KEY="sk_your_secret_key"
CLERK_PUBLISHABLE_KEY="pk_your_publishable_key"
```

**.gitignore:**
```
.env
.env.local
.env.*.local
```

---

## Security Checklist

Before deploying code, verify:

**Authentication & Authorization:**
- [ ] All routes require authentication (authMiddleware)
- [ ] All queries filter by tenantId (tenant isolation)
- [ ] No hard-coded credentials
- [ ] Environment variables used for secrets

**Input Validation:**
- [ ] All user input validated with Zod
- [ ] All UUIDs validated with z.string().uuid()
- [ ] All amounts validated as positive integers
- [ ] String lengths limited (prevent DoS)
- [ ] No raw SQL with user input

**Data Protection:**
- [ ] No sensitive data in logs
- [ ] HTTPS/TLS in production
- [ ] Database encrypted at rest
- [ ] Soft delete used (audit trail)

**Error Handling:**
- [ ] No stack traces exposed to users
- [ ] Generic error messages (don't leak internals)
- [ ] Detailed errors logged server-side only

**Dependencies:**
- [ ] npm audit passes
- [ ] No critical vulnerabilities
- [ ] Dependencies up to date

---

## Related Standards

- `docs/standards/multi-tenancy.md` - Tenant isolation (access control)
- `docs/standards/financial-data.md` - Audit trails, soft delete
- `docs/standards/api-design.md` - Input validation, error handling
- `docs/architecture/operations.md` - Monitoring, incident response

---

**Security is not optional. Every line of code must follow these standards.**
