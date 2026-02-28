# Production Signals

Real-time feedback from production systems to local development workflow.

## Purpose

Bridge production monitoring (Sentry, Vercel, logs) with local development context:
- Errors surfaced at session start (no checking dashboards)
- Performance regressions caught early
- Security signals prioritized
- Deprecation warnings tracked

**Shown in:** `/processes:begin` "Production Signals" section

---

## Signal Schema

Each signal in `signals.json`:

```json
{
  "id": "sig-001",
  "timestamp": "2026-02-27T10:30:00.000Z",
  "type": "error | performance | security | deprecation | usage",
  "severity": "high | medium | low",
  "source": "sentry | vercel | manual | monitoring",
  "message": "P2002 Unique constraint failed on Invoice.invoiceNumber",
  "file": "apps/api/src/domains/business/services/invoice.service.ts",
  "line": 145,
  "frequency": 12,
  "firstSeen": "2026-02-27T08:00:00.000Z",
  "lastSeen": "2026-02-27T10:30:00.000Z",
  "resolved": false
}
```

## Signal Types

| Type | When to Use |
|------|-------------|
| `error` | Runtime exceptions, crashes, unhandled errors |
| `performance` | Slow endpoints (>2s), memory leaks, timeouts |
| `security` | Auth failures, IDOR attempts, suspicious activity |
| `deprecation` | Using deprecated APIs, libraries with CVEs |
| `usage` | Unusual patterns, feature adoption stats |

## Signal Severity

| Severity | Meaning | Examples |
|----------|---------|----------|
| `high` | Blocks users, data loss risk, security breach | 500 errors, database crashes, auth bypass |
| `medium` | Degrades experience, impacts subset of users | Slow queries, partial failures, rate limit hits |
| `low` | Minor issues, FYI only | Deprecation warnings, usage stats, non-critical logs |

## How to Populate

### 1. Manual CLI (INFRA-66)

```bash
# Add a new signal
node .claude/scripts/add-production-signal.js \
  --type error \
  --severity high \
  --message "P2002 Unique constraint on Invoice" \
  --file apps/api/src/domains/business/services/invoice.service.ts \
  --line 145

# Mark signal as resolved
node .claude/scripts/add-production-signal.js --resolve sig-001

# List unresolved signals
node .claude/scripts/add-production-signal.js --list
```

### 2. Sentry Webhook (Future)

Sentry error webhook can append to `signals.json`:

```javascript
// Example Sentry webhook handler
POST /api/webhooks/sentry
{
  "event": { message, stack, frequency },
  "tags": { environment: "production" }
}

// Maps to signal:
{
  "type": "error",
  "severity": basedOnFrequency(frequency),
  "source": "sentry",
  "message": event.message,
  "file": extractFromStack(stack),
  "frequency": event.count
}
```

### 3. Vercel Logs (Future)

Parse Vercel logs for performance signals:

```bash
# Slow requests (>2s)
vercel logs --since 1h | grep "duration>" | parse

# Maps to signal:
{
  "type": "performance",
  "severity": "medium",
  "source": "vercel",
  "message": "POST /api/reports/trial-balance took 3.2s"
}
```

### 4. Manual Entry (Quick)

Directly edit `signals.json`:

```json
{
  "signals": [
    {
      "id": "sig-001",
      "timestamp": "2026-02-27T10:00:00.000Z",
      "type": "error",
      "severity": "high",
      "source": "manual",
      "message": "User reported: invoice PDF generation fails for invoices > 50 lines",
      "file": "apps/api/src/domains/business/services/pdf.service.ts",
      "frequency": 1,
      "firstSeen": "2026-02-27T10:00:00.000Z",
      "lastSeen": "2026-02-27T10:00:00.000Z",
      "resolved": false
    }
  ]
}
```

## Gitignore Rules

**Template committed:**
- `.claude/production/signals.json` (empty template)
- `.claude/production/README.md`

**Actual signals gitignored:**
- `.claude/production/signals-*.json` (timestamped backups)
- Production-specific data stays local

---

## Workflow Integration

**Session start** (`/processes:begin` Phase 1.5):
1. Run `node .claude/scripts/read-production-signals.js`
2. Display unresolved signals with severity badges
3. Link to files for quick fixing

**During work:**
- Check signal file for context on reported issues
- Mark signals as resolved when fixed

**End of day:**
- Review unresolved high-severity signals
- Triage: fix now, defer, or close as won't-fix

---

_Production Signals v1 — Real-time production feedback in local dev workflow._
