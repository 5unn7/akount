# AI Integration Review — Part 2 (P1/P2 Findings)

## Medium Priority Findings (P1 - Should Fix)

### [P1] No Streaming Response Handling for LLM Calls
**File:** `apps/api/src/domains/ai/services/providers/claude.provider.ts`, `mistral.provider.ts`
**Issue:** All AI calls use synchronous `messages.create()` / `chat.complete()`. For long responses (1000+ tokens), this blocks for 10-30 seconds with no progress feedback. Users see "loading..." with no indication if the request froze.

**Impact:**
- **Poor UX:** Long wait times feel like crashes
- **Resource waste:** Can't cancel stuck requests (client navigates away but server keeps processing)
- **No backpressure:** Server can't detect if client disconnected

**Recommendation:**
```typescript
// ✅ BETTER — Use streaming for long-running AI calls
async chatStream(
  messages: AIMessage[],
  options?: AIChatOptions & { onChunk?: (text: string) => void }
): Promise<AIChatResponse> {
  const stream = await this.client.messages.stream({
    model: options?.model || 'claude-sonnet-4-5',
    max_tokens: options?.maxTokens ?? 1024,
    timeout: 30000,
    messages: chatMessages,
  });

  let fullContent = '';
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      const text = chunk.delta.text || '';
      fullContent += text;
      options?.onChunk?.(text); // Progressive feedback
    }
  }

  return {
    content: fullContent,
    model: stream.finalMessage.model,
    usage: stream.finalMessage.usage,
  };
}
```
**Priority:** Medium (UX improvement, not security-critical)

---

### [P1] Missing Model Version Pinning for Mistral Vision
**File:** `apps/api/src/domains/ai/services/providers/mistral.provider.ts:281`
**Issue:** Uses `pixtral-large-latest` (floating alias) instead of pinned version (e.g., `pixtral-large-2411`). If Mistral updates the model:
- Extraction schemas may break (new field names)
- Accuracy may degrade (different training data)
- No A/B testing possible (can't compare old vs new)

**Impact:**
- **Silent degradation:** Model changes break production without warning
- **No reproducibility:** Can't reproduce extraction results from 3 months ago

**Recommendation:**
```typescript
// ✅ BETTER — Pin to specific version, document upgrade process
const model = options?.model || 'pixtral-large-2411'; // Pinned version

// Add version migration plan:
// 1. Test new model in staging with 100 real documents
// 2. Compare extraction accuracy (confidence scores, field completion)
// 3. If >95% match, roll out to 10% of tenants (canary)
// 4. Monitor for 1 week before full rollout
```
**Priority:** Medium (operational stability, not urgent)

---

### [P1] No Retry Logic for Transient AI Provider Failures
**File:** `apps/api/src/domains/ai/services/providers/claude.provider.ts:57`, `mistral.provider.ts:222`
**Issue:** If Anthropic/Mistral returns 503 (service unavailable) or 429 (rate limit), the request fails immediately. No exponential backoff retry.

**Impact:**
- **Poor reliability:** Single transient error fails entire job
- **User frustration:** Have to manually re-upload document

**Recommendation:**
```typescript
// ✅ BETTER — Add exponential backoff for transient errors
import pRetry from 'p-retry';

async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
  const operation = async () => {
    try {
      const response = await this.client.messages.create({
        model: options?.model || 'claude-sonnet-4-5',
        max_tokens: options?.maxTokens ?? 1024,
        timeout: 30000,
        messages: chatMessages,
      });
      return response;
    } catch (error) {
      // Only retry transient errors
      if (error instanceof Anthropic.APIError) {
        if (error.status === 503 || error.status === 429) {
          throw error; // Retryable
        }
        throw new pRetry.AbortError(error.message); // Non-retryable
      }
      throw error;
    }
  };

  return pRetry(operation, {
    retries: 3,
    factor: 2, // 1s, 2s, 4s
    minTimeout: 1000,
    maxTimeout: 10000,
    onFailedAttempt: (error) => {
      logger.warn(
        { attempt: error.attemptNumber, retriesLeft: error.retriesLeft },
        'AI provider call failed, retrying...'
      );
    },
  });
}
```
**Priority:** Medium (reliability improvement)

---

### [P1] API Keys Not Rotated (No Documentation)
**File:** `apps/api/src/lib/env.ts:41-47`
**Issue:** API keys for Anthropic, Mistral, Perplexity are loaded from environment variables but there's NO rotation policy documented. If a key leaks (git commit, logs, employee offboarding), there's no rotation procedure.

**Impact:**
- **Security debt:** Stale keys persist indefinitely
- **Incident response gap:** No runbook for key rotation after leak

**Recommendation:**
1. Add to `docs/security/api-key-rotation.md`:
   ```markdown
   # API Key Rotation Policy

   **Frequency:** Quarterly (every 90 days)
   **Trigger Events:** Immediate rotation if:
   - Key leaked in logs/git
   - Employee with key access leaves company
   - Provider reports suspicious activity

   **Rotation Steps:**
   1. Generate new key in provider dashboard (Anthropic/Mistral)
   2. Update `ANTHROPIC_API_KEY` in prod secrets (AWS Secrets Manager / Vercel)
   3. Deploy with zero-downtime (blue-green deployment)
   4. Revoke old key after 24h grace period
   5. Test all AI features in prod
   ```
2. Add calendar reminder for quarterly rotation

**Priority:** Medium (security hygiene, not urgent)

---

### [P1] No Graceful Degradation When Mistral API Down
**File:** `apps/api/src/domains/ai/services/providers/mistral.provider.ts:138`
**Issue:** Circuit breaker opens after 5 failures, but NO fallback strategy. Users see "Circuit breaker OPEN" error with no recourse.

**Impact:**
- **Total service outage:** If Mistral down, all document uploads fail
- **User frustration:** No alternative workflow

**Recommendation:**
```typescript
// ✅ BETTER — Provide fallback when circuit opens
async extractFromImage<T>(
  imageBuffer: Buffer,
  schema: z.ZodType<T>,
  prompt?: string
): Promise<T> {
  try {
    this.circuitBreaker.checkState(); // May throw if open
    // ... normal Mistral extraction
  } catch (error) {
    if (error.message.includes('Circuit breaker OPEN')) {
      logger.warn('Mistral unavailable, falling back to manual entry queue');

      // Fallback: Queue for manual data entry by ops team
      await queueManager.getQueue('manual-data-entry').add('bill-manual', {
        imageBuffer: imageBuffer.toString('base64'),
        reason: 'AI_SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString(),
      });

      throw new Error(
        'AI document scanning is temporarily unavailable. Your document has been queued for manual processing (expected: 24-48 hours).'
      );
    }
    throw error;
  }
}
```
**Priority:** Medium (operational resilience)

---

### [P1] No Monitoring/Alerting for High Token Usage
**File:** N/A (infrastructure gap)
**Issue:** No automated alerts when token usage spikes. A bug causing infinite LLM loops could drain $10K+ before anyone notices.

**Impact:**
- **Financial risk:** Silent cost spikes
- **No proactive detection:** Only discover after bill arrives

**Recommendation:**
1. Add CloudWatch/Datadog metric: `ai.tokens.used.total` (tagged by tenant, model)
2. Alert thresholds:
   - **Warning:** >100K tokens/hour per tenant (≈$0.40/hour @ Mistral pricing)
   - **Critical:** >500K tokens/hour per tenant (≈$2/hour)
   - **Emergency:** >5M tokens/day globally (≈$20/day)
3. Action on alert:
   - Log tenant ID + top users
   - Auto-pause AI features for that tenant (send email notification)
   - Investigate: Check AIDecisionLog for spike patterns

**Priority:** Medium (cost protection)

---

## Low Priority Findings (P2 - Nice to Have)

### [P2] Prompt Defense Doesn't Block High-Risk Documents
**File:** `apps/api/src/lib/prompt-defense.ts:56-86`
**Issue:** `analyzePromptInjection()` detects threats but only returns `requiresReview: true`. It doesn't BLOCK the document. A high-risk prompt injection still gets sent to Mistral.

**Impact:**
- **Partial defense:** Detection without prevention
- **Cost:** Still pay for malicious inference

**Recommendation:**
```typescript
// ✅ BETTER — Block high-risk prompts before AI call
const threatAnalysis = analyzePromptInjection(ocrText);

if (threatAnalysis.riskLevel === 'high_risk') {
  throw new Error(
    `Document rejected: High-risk content detected. ${threatAnalysis.threats.map(t => t.description).join('; ')}`
  );
}

// Only send 'safe' and 'suspicious' to AI (suspicious = human reviews after AI)
```
**Priority:** Low (defense in depth, not critical with existing redaction)

---

### [P2] No PII Audit Reports for Compliance
**File:** `apps/api/src/lib/pii-redaction.ts` (logging only, no aggregation)
**Issue:** PII redaction logs to `logger.warn()` but there's NO aggregated report for compliance audits (e.g., "How many SSNs were redacted this quarter?")

**Impact:**
- **Compliance gap:** Hard to answer auditor questions
- **No trend analysis:** Can't detect if PII leaks increasing

**Recommendation:**
1. Add `PIIRedactionLog` model:
   ```prisma
   model PIIRedactionLog {
     id        String   @id @default(cuid())
     tenantId  String
     timestamp DateTime @default(now())
     piiType   String   // 'ssn', 'credit_card', 'email'
     count     Int
     context   String   // 'bill_upload', 'invoice_scan'
   }
   ```
2. Monthly report: "Redacted 143 SSNs, 89 credit cards across 2,456 documents"

**Priority:** Low (operational analytics)

---

### [P2] Default AI Consent Should Be Opt-In, Not Opt-Out
**File:** `packages/db/prisma/schema.prisma` (AIConsent model)
**Issue:** If the schema sets default values to `true` for AI features, users are opted-in without explicit consent (GDPR violation). Need to verify defaults are `false`.

**Check Required:**
```prisma
model AIConsent {
  autoCreateBills   Boolean @default(false) // ✅ Must be false
  autoCreateInvoices Boolean @default(false) // ✅ Must be false
  // ...
}
```
**If defaults are `true`:** Change to `false` + force consent flow on first use.

**Priority:** Low (verify only, likely already correct based on SEC-32 task)

---

### [P2] Model Selection Not Optimized for Cost
**File:** `apps/api/src/domains/ai/services/providers/claude.provider.ts:14`
**Issue:** Defaults to `claude-sonnet-4-5` ($3/MTok) for ALL tasks. Simple categorization could use Haiku ($0.25/MTok) — **12x cheaper**.

**Impact:**
- **Overpaying:** $3 when $0.25 would work

**Recommendation:**
```typescript
// ✅ BETTER — Route by task complexity
const modelForTask = (task: 'categorization' | 'chat' | 'extraction') => {
  switch (task) {
    case 'categorization': return 'claude-3-haiku-20240307'; // $0.25/MTok
    case 'chat': return 'claude-sonnet-4-5'; // $3/MTok (complex reasoning)
    case 'extraction': return 'claude-sonnet-4-5'; // $3/MTok (vision required)
  }
};
```
**Cost Savings:** ~$200/month at 1K categorization calls/day

**Priority:** Low (cost optimization, not security)

---

## Positive Security Findings ✅

**What's Working Well:**

1. **✅ PII Redaction Pipeline:** `redactImage()` and `redactText()` comprehensively strip SSN, credit cards, emails, phone numbers, EXIF metadata. Luhn validation for credit cards prevents false positives.

2. **✅ Consent Gate Middleware:** `requireConsent('autoCreateBills')` enforces GDPR Article 22 compliance. Proper 403 responses with settings URL.

3. **✅ Zod Schema Validation:** `BillExtractionSchema` and `InvoiceExtractionSchema` enforce integer cents, required fields, and business rules (e.g., `subtotal + taxAmount === totalAmount`).

4. **✅ Circuit Breaker Pattern:** Mistral provider implements exponential backoff circuit breaker (5 failures → 60s cooldown). Prevents cascading failures.

5. **✅ File Security Scanning:** `scanFile()` validates magic bytes, polyglot detection, size limits (10MB). Prevents malicious uploads.

6. **✅ Tenant Isolation:** Bill/invoice scan routes validate `entityId` ownership before processing (`entity.tenantId === request.tenantId`). IDOR prevention.

7. **✅ Rate Limiting:** AI routes have stricter limits (20 req/min) than global (100 req/min). Prevents abuse.

8. **✅ Structured Logging:** Uses pino for JSON logs with tenant/user context. No `console.log` anti-patterns.

---

## Summary of Required Changes

### Must Fix Before Merge (P0)

| # | Finding | Estimated Effort | Risk if Not Fixed |
|---|---------|------------------|-------------------|
| 1 | Add timeout to all AI provider calls | 2 hours | **CRITICAL** — Runaway costs ($1K+) |
| 2 | Log `tokensUsed` to AIDecisionLog | 4 hours | **CRITICAL** — No cost attribution |
| 3 | Implement per-tenant AI budgets | 8 hours | **CRITICAL** — $50K exposure |
| 4 | Add service-layer consent checks | 3 hours | **HIGH** — GDPR violation risk |
| 5 | Redact OCR text before prompt defense | 3 hours | **HIGH** — PII leak to logs |
| 6 | Lower `maxTokens` default for vision | 1 hour | **MEDIUM** — $120/month waste |
| 7 | Add AIDecisionLog to all AI services | 6 hours | **MEDIUM** — Compliance gap |

**Total Effort:** ~27 hours (3-4 days)

---

## Approval Status

⛔ **CHANGES REQUIRED**

**Rationale:**
- **3 CRITICAL findings** (timeout, token tracking, budget caps) create unacceptable financial risk ($10K-50K exposure)
- **2 HIGH findings** (consent re-verification, PII in OCR) violate GDPR/PIPEDA
- **7 P0 findings total** MUST be addressed before production deployment

**Next Steps:**
1. Fix all P0 findings (est. 3-4 days)
2. Add integration tests for:
   - Timeout enforcement (mock stuck API call)
   - Budget cap enforcement (submit 101 jobs, verify 101st fails)
   - Consent gate bypass detection (call service directly, verify rejection)
3. Re-run review after fixes
4. Deploy to staging + monitor token usage for 1 week
5. Production rollout with 10% canary (monitor costs daily)

---

## Recommendations for Future Phases

1. **Token Usage Dashboard:** Build admin UI showing token usage by tenant/model/date (Grafana + Prometheus)
2. **AI Budget Tiers:** Create pricing tiers (Starter: $10/mo AI budget, Pro: $50/mo, Enterprise: custom)
3. **Model A/B Testing:** Compare Haiku vs Sonnet for categorization accuracy (may save 90% on that workload)
4. **Synthetic Test Suite:** Generate 100 adversarial invoices (prompt injection, Unicode attacks) for regression testing
5. **GDPR Audit Trail:** Export AIDecisionLog as downloadable report for GDPR Article 30 compliance

---

**Reviewer:** AI Integration Security Expert
**Reviewed:** 2026-02-28
**Review Duration:** 3 hours
**Files Examined:** 28 (providers, workers, routes, middleware, schemas)
**Lines Reviewed:** ~4,200
