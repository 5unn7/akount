# Document Intelligence Platform — Implementation Plan

**Created:** 2026-02-26
**Status:** Draft
**Brainstorm:** [docs/brainstorms/2026-02-26-llm-document-intelligence-platform-brainstorm.md](../brainstorms/2026-02-26-llm-document-intelligence-platform-brainstorm.md)
**Task List:** [2026-02-26-document-intelligence-platform-tasks.md](./2026-02-26-document-intelligence-platform-tasks.md) (47 tasks, IDs reserved: DEV-230..267, SEC-29..38, INFRA-61..62)
**Prerequisites:** AI Auto-Bookkeeper Phase 1 (DEV-185 to DEV-200) — AIAction model, categorization pipeline, Action Feed
**Estimated Effort:** 8 weeks (5 phases, 6 tracks, 47 tasks)

---

## Overview

Transform Akount from "manual data entry" to "upload anything, AI handles it." Six vertical tracks deliver document scanning, smart automation, cross-domain matching, compliance, and per-tenant learning — all powered by Mistral API (cloud now, self-hosted later).

**Key metric:** Receipt upload → Bill created in <10 seconds.

---

## Architectural Decision: Hybrid Approach (Keep + Augment)

**Do NOT ditch existing import infrastructure.** Keep what's deterministic, replace what's fragile, add Mistral for new capabilities.

| Component | Decision | Rationale |
|-----------|----------|-----------|
| CSV parser (PapaParse) | **KEEP** | 100% reliable for structured CSV. LLM adds cost, zero benefit. |
| XLSX parser (ExcelJS) | **KEEP** | Same — structured data doesn't need AI. |
| pdfjs-dist (text extraction) | **DEMOTE to emergency fallback** | Only used if Mistral API is completely unreachable. Not in the normal processing path. |
| parser-pdf.ts regex patterns | **REMOVE** | Fragile, breaks on new formats. Mistral handles ALL PDFs natively — bank statements, invoices, bills, receipts. No regex needed. |
| Custom extraction service | **SUPERSEDE** | Mistral vision replaces all custom extraction logic. One engine for everything. |
| file-scanner.ts (SEC-11) | **KEEP + EXTEND** | Solid 3-layer security. Extend for image formats (JPEG, PNG, HEIC). |
| AI categorization (Claude) | **KEEP** | Works for categorization. Mistral handles document extraction. |
| Duplication service | **KEEP + ENHANCE** | Add semantic similarity via Mistral embeddings alongside exact match. |

### Processing Path Decision Tree

```
Upload arrives
├── CSV/XLSX → PapaParse/ExcelJS (deterministic, no API call)
├── PDF (ANY — bank statement, invoice, bill, receipt)
│   └── file-scanner → PII redaction → Mistral OCR (1 API call)
├── Image (receipt/bill photo — JPEG, PNG, HEIC)
│   └── file-scanner → EXIF strip → PII redaction → Mistral OCR (1 API call)
└── FALLBACK (Mistral API unreachable)
    └── pdfjs-dist text extraction → manual review queue (degraded mode)

Mistral is the SINGLE extraction engine for all documents.
pdfjs-dist is emergency-only — never in the normal path.
```

### AI Provider Strategy

| Phase | Provider | Why |
|-------|----------|-----|
| **MVP (now)** | Mistral API (La Plateforme) | Fast integration, no GPU setup, pay-per-use |
| **Scale (later)** | Self-hosted Mistral OCR 3 (Docker + GPU) | Cost control, data sovereignty, compliance |
| **Categorization** | Keep Claude (existing) | Already works, proven accuracy |

---

## Success Criteria (Full Platform)

- [ ] Receipt photo → Bill created with line items in <10s (async)
- [ ] 85%+ extraction accuracy on common receipts
- [ ] Zero PII in inference logs (redaction verified)
- [ ] All AI decisions logged to AIDecisionLog
- [ ] Consent required before first auto-creation
- [ ] CSV/XLSX imports still work unchanged (regression-free)
- [ ] Natural language: "Paid $50 at Staples" → Transaction created
- [ ] 80%+ of Bills auto-matched to credit card transactions
- [ ] `deleteUserAIData()` purges all AI artifacts (GDPR)
- [ ] User corrections improve next prediction within same session (RAG)

---

## Relationship to Existing Plans

| Existing Plan | Relationship | Status |
|---------------|-------------|--------|
| Auto-Bookkeeper Phase 1 (DEV-185-200) | **PREREQUISITE** — AIAction model, categorization, Action Feed | Ready |
| Auto-Bookkeeper Phase 2 (Smart Rules) | **PARALLEL** — Rules engine enhances categorization | Ready |
| Auto-Bookkeeper Phase 3 (Financial Advisor) | **OVERLAP** — Anomaly detection shared, insights reused | Ready |

**What's NEW in this plan (not covered by Auto-Bookkeeper):**
- Track A: Mistral provider, PII redaction, Bull queues, SSE
- Track B: Document scanning (bills, invoices, receipts, enhanced statements)
- Track C: NL bookkeeping, NL search, report narration (extends Phase 3)
- Track D: Cross-domain matching (AP/AR reconciliation)
- Track E: Compliance (GDPR, PIPEDA, CCPA, EU AI Act, SOC 2)
- Track F: RAG architecture, feedback loops, per-tenant personalization

---

## Track A: Core AI Infrastructure & Security

> Foundation track. All other tracks depend on this.

### Task A1: Mistral API Provider

**Files:** `apps/api/src/domains/ai/services/providers/mistral.provider.ts`
**What:** Create Mistral provider implementing existing `AIProvider` interface. Support text and vision (image) inputs. Use `@mistralai/mistralai` SDK. Configure model selection (mistral-large for text, pixtral for vision). Include structured output mode (JSON).
**Depends on:** none
**Success:** Provider instantiates, sends text prompt, receives structured JSON response
**Review:** `kieran-typescript-reviewer`

### Task A2: Mistral Vision Integration

**Files:** `apps/api/src/domains/ai/services/providers/mistral.provider.ts`
**What:** Add `extractFromImage(imageBuffer, schema)` method. Accepts image buffer + Zod schema, returns validated structured data. Support JPEG, PNG, PDF (Mistral OCR handles PDFs natively). Pin model version in config.
**Depends on:** A1
**Success:** Pass receipt image → receive structured JSON with vendor, amount, date, line items
**Review:** `kieran-typescript-reviewer`

### Task A3: PII Redaction Service

**Files:** `apps/api/src/lib/pii-redaction.ts`
**What:** Pre-inference redaction pipeline. Detect and redact: credit card numbers (Luhn + regex), SSN/SIN (format patterns), email addresses, bank account numbers. Allowlist vendor names, dates, amounts, currencies. EXIF metadata stripping for images. Returns redacted buffer + redaction log.
**Depends on:** none
**Risk:** high (security — must not leak PII to external API)
**Success:** Image with CC number → redacted before Mistral. Vendor name preserved.
**Review:** `security-sentinel`

### Task A4: Prompt Injection Defense

**Files:** `apps/api/src/lib/prompt-defense.ts`
**What:** Defense layers for adversarial documents: (1) System prompt boundary markers, (2) Invisible text detection (white-on-white, zero-font, Unicode substitution), (3) Monetary threshold gate (>$5K = REVIEW_REQUIRED), (4) Secondary validation (OCR text vs structured extraction amount consistency). All Mistral responses validated through Zod schemas.
**Depends on:** A1
**Risk:** high (security — adversarial invoices could manipulate amounts)
**Success:** Crafted invoice with "IGNORE PREVIOUS INSTRUCTIONS" → defense catches it, amount validated
**Review:** `security-sentinel`

### Task A5: AIDecisionLog Schema & Service

**Files:** `packages/db/prisma/schema.prisma`, `apps/api/src/domains/ai/services/ai-decision-log.service.ts`
**What:** New Prisma model: `AIDecisionLog` with fields from brainstorm (tenantId, entityId, documentId, decisionType, inputHash, modelVersion, confidence, extractedData, routingResult, aiExplanation, consentStatus, processingTimeMs). Service with `logDecision()` and `queryDecisions()`. Linked to existing audit trail via sourceType.
**Depends on:** none
**Risk:** high (financial audit trail)
**Success:** Every AI extraction creates an AIDecisionLog entry. Queryable by tenant, date range, decision type.
**Review:** `prisma-migration-reviewer`, `financial-data-validator`

### Task A6: Redis + BullMQ Queue Infrastructure

**Files:** `apps/api/src/lib/queue/`, `apps/api/package.json`
**What:** Install `bullmq` + `ioredis`. Create queue manager with 5 queues: `bill-scan`, `invoice-scan`, `transaction-import`, `matching`, `anomaly-detection`. Configure: TLS encryption, auth (password + ACL), dead letter queues, 3 retries with exponential backoff, 60s job timeout. Add Bull Board UI (admin-only route).
**Depends on:** none
**Success:** Job enqueued → worker picks up → processes → job marked complete/failed. Bull Board shows queue status.
**Review:** `architecture-strategist`, `security-sentinel`

### Task A7: SSE Real-Time Updates

**Files:** `apps/api/src/domains/ai/routes/job-stream.ts`
**What:** `GET /api/ai/jobs/:jobId/stream` endpoint. Requires Clerk JWT auth. Tenant-scoped validation (IDOR prevention — users can only stream their own jobs). Events: `processing`, `review_required`, `completed`, `failed`. Auto-close on terminal state. Uses Fastify's reply.raw for SSE.
**Depends on:** A6
**Success:** Client connects to SSE → receives real-time status updates → connection closes on completion
**Review:** `security-sentinel`, `fastify-api-reviewer`

### Task A8: File Scanner Extension (Images)

**Files:** `apps/api/src/lib/file-scanner.ts`
**What:** Extend existing SEC-11 scanner for image formats: JPEG (FFD8 magic bytes), PNG (89504E47), HEIC, TIFF. Add EXIF metadata stripping before storage. Add image dimension/quality validation (reject <100px, warn on blurry). Add file size limits per doc type (receipts: 10MB, statements: 50MB). Add encrypted PDF detection.
**Depends on:** none
**Success:** Upload JPEG with GPS EXIF → EXIF stripped, image passes security scan. Upload 50px image → rejected.
**Review:** `security-sentinel`

### Task A9: SSE Client Hook (Frontend)

**Files:** `apps/web/src/hooks/use-job-stream.ts`
**What:** React hook `useJobStream(jobId)` that connects to SSE endpoint, parses events, returns `{ status, data, error }`. Auto-reconnect on disconnect. Clean up on unmount. Toast notifications for status changes.
**Depends on:** A7
**Success:** Hook connects, receives events, updates state. Component re-renders on each event.
**Review:** `nextjs-app-router-reviewer`

---

## Track B: Document Intelligence

> Upload documents, auto-extract structured data, create financial records.

### Task B1: DocumentExtractionService (Shared Core)

**Files:** `apps/api/src/domains/ai/services/document-extraction.service.ts`
**What:** Shared service wrapping Mistral vision. Methods: `extractBill(buffer)`, `extractInvoice(buffer)`, `extractStatement(buffer)`. Each returns domain-specific Zod-validated structured data. Includes confidence scoring per field (0-100). Stores `modelVersion` in every result. Processing path: file-scanner → PII redaction → Mistral vision → Zod validation → confidence scoring.
**Depends on:** A1, A2, A3, A4
**Risk:** high (financial data extraction accuracy)
**Success:** Receipt image → `{ vendor: "Starbucks", amount: 1550, currency: "CAD", date: "2026-01-15", confidence: 92, lineItems: [...] }`
**Review:** `financial-data-validator`, `kieran-typescript-reviewer`

### Task B2: Bill Extraction Zod Schemas

**Files:** `apps/api/src/domains/ai/schemas/bill-extraction.schema.ts`
**What:** Zod schemas for bill extraction output: `BillExtractionSchema` (vendor, date, totalAmount in integer cents, currency, lineItems array, taxBreakdown, paymentTerms, confidence). `LineItemSchema` (description, quantity, unitPrice in cents, amount in cents — pre-tax). Amount validation: `z.number().int().positive()`.
**Depends on:** none
**Success:** Schema validates sample extraction output. Rejects floats, negative amounts, missing required fields.

### Task B3: Invoice Extraction Zod Schemas

**Files:** `apps/api/src/domains/ai/schemas/invoice-extraction.schema.ts`
**What:** Similar to B2 but for AR invoices. Additional fields: client name, payment terms (NET 30, due date), invoice number. Links to Client record by name matching.
**Depends on:** none
**Success:** Schema validates invoice extraction output.

### Task B4: BillScanWorker (AP Flow)

**Files:** `apps/api/src/domains/ai/workers/bill-scan.worker.ts`
**What:** BullMQ worker for `bill-scan` queue. Flow: (1) Dequeue job, (2) Extract via DocumentExtractionService, (3) Validate via Zod, (4) Log to AIDecisionLog, (5) Route by confidence: >80% + <$5K auto-create Bill, 50-80% or >$5K queue for review, <50% manual entry with partial data, (6) Emit `BillCreated` event (for matching worker), (7) Push SSE status update.
**Depends on:** A5, A6, B1, B2
**Risk:** high (auto-creates financial records)
**Success:** Upload receipt → worker processes → Bill created with correct vendor, amount, line items → AIDecisionLog entry exists
**Review:** `financial-data-validator`, `security-sentinel`

### Task B5: InvoiceScanWorker (AR Flow)

**Files:** `apps/api/src/domains/ai/workers/invoice-scan.worker.ts`
**What:** BullMQ worker for `invoice-scan` queue. Reuses DocumentExtractionService. Extracts payment terms. Links to Client by vendor name matching. Creates Invoice with line items, tax, payment terms. Same confidence routing as B4.
**Depends on:** A5, A6, B1, B3
**Risk:** high (auto-creates financial records)
**Success:** Upload invoice PDF → Invoice created with line items, payment terms, linked to Client
**Review:** `financial-data-validator`

### Task B6: Bill Scan API Route

**Files:** `apps/api/src/domains/business/routes/bill-scan.ts`
**What:** `POST /api/business/bills/scan` — multipart file upload. Flow: validate file type/size → security scan (file-scanner) → create UploadJob → enqueue to `bill-scan` queue → return jobId immediately. Accepted formats: JPEG, PNG, PDF, HEIC. Max 10MB for receipts, 50MB for statements.
**Depends on:** A6, A8, B4
**Success:** Upload receipt → 202 response with jobId → SSE stream shows progress → Bill created
**Review:** `fastify-api-reviewer`, `security-sentinel`

### Task B7: Invoice Scan API Route

**Files:** `apps/api/src/domains/business/routes/invoice-scan.ts`
**What:** `POST /api/business/invoices/scan` — same pattern as B6 but enqueues to `invoice-scan` queue.
**Depends on:** A6, A8, B5
**Success:** Upload invoice → 202 response with jobId → Invoice created

### Task B8: Bank Statement Parsing — Mistral Primary

**Files:** `apps/api/src/domains/banking/services/parser-pdf.ts`
**What:** Replace the entire regex-based PDF parser with Mistral as the single extraction engine. Remove all institution-specific regex patterns (CIBC, RBC, TD, etc.). All PDFs go through: file-scanner → PII redaction → Mistral vision → Zod-validated transaction array. Keep CSV/XLSX parsers unchanged (deterministic, no AI needed). Add semantic duplicate detection via Mistral embeddings (catches "AMZN" = "Amazon Marketplace"). Emergency fallback: if Mistral API is unreachable, use pdfjs-dist text extraction → route to manual review queue (degraded mode, never silent failure).
**Depends on:** A1, A2, B1
**Risk:** high (replaces existing parser entirely — thorough regression testing needed)
**Success:** Import ANY bank statement PDF (CIBC, RBC, unknown format) → Mistral extracts all transactions correctly. "AMZN" flagged as duplicate of "Amazon Marketplace". Mistral down → pdfjs fallback → user sees "Manual review required."
**Review:** `financial-data-validator`, `architecture-strategist`

### Task B9: Upload UI (Bill Scan)

**Files:** `apps/web/src/app/(dashboard)/business/bills/bill-scan-upload.tsx`
**What:** Client component with drag-and-drop file upload (accept images + PDFs). Shows upload progress → processing status (via SSE hook) → result preview (extracted data) → approve/edit/reject. Camera capture button for mobile. Glass card design matching existing UI.
**Depends on:** A9, B6
**Success:** Drag receipt → upload → see real-time processing → review extracted data → approve creates Bill
**Review:** `nextjs-app-router-reviewer`, `design-system-enforcer`

### Task B10: Upload UI (Invoice Scan)

**Files:** `apps/web/src/app/(dashboard)/business/invoices/invoice-scan-upload.tsx`
**What:** Same pattern as B9 but for invoices. Shows extracted line items, payment terms, client matching.
**Depends on:** A9, B7
**Success:** Upload invoice PDF → review extracted data with line items → approve creates Invoice

### Task B11: Review Queue UI

**Files:** `apps/web/src/app/(dashboard)/business/review-queue/`
**What:** New page at `/business/review` showing medium-confidence extractions pending review. Pre-filled form with extracted data. User approves/edits/rejects. Inline notification: "3 receipts need review." Sortable by date, confidence, amount.
**Depends on:** B4, B5
**Success:** Medium-confidence extractions appear in queue → user edits and approves → Bill/Invoice created

---

## Track C: Smart Automation

> AI capabilities beyond document scanning. Complements Auto-Bookkeeper Phase 3.

### Task C1: Natural Language Bookkeeping Endpoint

**Files:** `apps/api/src/domains/ai/routes/natural-bookkeeping.ts`, `apps/api/src/domains/ai/services/natural-bookkeeping.service.ts`
**What:** `POST /api/ai/bookkeeping/natural` — accepts natural language text. Mistral function calling parses into structured data: vendor, amount (integer cents), category, GL account, date (inferred if missing). Confidence-based routing (same thresholds as Track B). AI explanation: "Categorized as Travel because vendor 'Uber' matches transportation pattern." Log to AIDecisionLog.
**Depends on:** A1, A5
**Success:** "Paid $47 for Uber to airport" → Transaction created with vendor=Uber, amount=4700, category=Travel, GL=5400
**Review:** `financial-data-validator`

### Task C2: Natural Language Bookkeeping UI

**Files:** `apps/web/src/app/(dashboard)/overview/nl-bookkeeping-bar.tsx`
**What:** Text input bar on dashboard. Mobile-optimized (full-width on small screens). Placeholder: "What did you spend on?" Submit → Mistral processes → show result with approve/edit. Glass card styling.
**Depends on:** C1
**Success:** Type "Paid $50 at Staples for office supplies" → see extracted data → approve → Transaction created

### Task C3: Smart Natural Language Search

**Files:** `apps/api/src/domains/ai/routes/natural-search.ts`, `apps/api/src/domains/ai/services/natural-search.service.ts`
**What:** `POST /api/ai/search/natural` — accepts natural language query. Mistral function calling maps to existing API filter parameters (category, amountMin/Max, dateFrom/To, vendor). Fallback: "I couldn't understand that. Try: 'expenses over $100 last quarter'." Log to AIDecisionLog.
**Depends on:** A1, A5
**Success:** "Show me all restaurant expenses over $100 in Q4" → returns correct filtered results

### Task C4: Natural Language Search UI

**Files:** `apps/web/src/components/shared/NLSearchBar.tsx`
**What:** Search bar with NL mode toggle (magnifying glass → sparkle icon for AI mode). Inline in transaction list header. Results appear in existing table with filter chips showing parsed parameters.
**Depends on:** C3
**Success:** Toggle AI search → type query → filter chips appear → table shows filtered results

### Task C5: Financial Report Narration

**Files:** `apps/api/src/domains/ai/routes/report-narration.ts`, `apps/api/src/domains/ai/services/report-narration.service.ts`
**What:** `GET /api/ai/reports/:reportId/narration` — generates plain-English summary of existing reports (P&L, Balance Sheet, Cash Flow, Month-end). Uses Mistral with report data as context. Cached per report version (regenerate only when data changes). Disclaimer: "AI-generated summary — review underlying data for accuracy."
**Depends on:** A1, A5
**Success:** P&L report → "Revenue grew 12% MoM, driven by 3 new clients. Operating expenses increased 18% due to equipment purchase."
**Review:** `financial-data-validator`

### Task C6: Report Narration UI

**Files:** Modify existing report pages in `apps/web/src/app/(dashboard)/accounting/reports/`
**What:** Add collapsible narration section at top of each report page. Newsreader italic font (AI summary styling per design system). "Generate summary" button on first load, auto-refresh when report data changes. Loading skeleton while generating.
**Depends on:** C5
**Success:** Open P&L report → click "Generate summary" → see AI narrative in italics above the numbers

### Task C7: Anomaly Detection Enhancement

**Files:** `apps/api/src/domains/ai/services/anomaly-detection.service.ts`
**What:** Extend Phase 3's insight analyzers with Mistral-powered anomaly detection: (1) Subscription creep (new recurring charges), (2) Cash flow danger zones (projected expenses > revenue), (3) Missing expected transactions (monthly rent not seen). Integrates with existing Insight model. Runs via `anomaly-detection` queue (scheduled daily or on-demand).
**Depends on:** A1, A5, A6, Auto-Bookkeeper Phase 3
**Success:** New monthly subscription detected → Insight created: "New recurring charge: $14.99/mo Netflix detected"
**Review:** `financial-data-validator`

### Task C8: Client Communication Drafts

**Files:** `apps/api/src/domains/ai/services/communication-drafts.service.ts`, `apps/api/src/domains/ai/routes/communication-drafts.ts`
**What:** Generate payment reminder emails for overdue invoices. Draft monthly summary reports for clients. Auto-fill with actual data from invoicing/payment records. User reviews and sends (NEVER auto-sent). `GET /api/ai/communications/draft?invoiceId=xxx&type=payment_reminder`
**Depends on:** A1
**Success:** Overdue invoice → generate draft → "Dear [Client], Invoice #1234 for $5,000 was due on Feb 15..."

### Task C9: Tax Optimization Suggestions

**Files:** `apps/api/src/domains/ai/services/tax-suggestions.service.ts`
**What:** Analyze categorized expenses against common tax deduction rules. Surface missed deductions: home office, vehicle, equipment depreciation. Estimate quarterly tax payments. Disclaimer: "Suggestions, not tax advice. Consult your accountant." Jurisdiction-aware (US, Canada, EU).
**Depends on:** A1, A5
**Success:** Home office expenses detected but uncategorized → Suggestion: "You may be eligible for home office deduction"

---

## Track D: Cross-Domain Matching & Reconciliation

> Auto-match documents to bank transactions. Massive time saver for month-end close.

### Task D1: MatchingWorker

**Files:** `apps/api/src/domains/ai/workers/matching.worker.ts`
**What:** BullMQ worker for `matching` queue. Listens to events: BillCreated, InvoiceCreated, TransactionCreated. Implements matching algorithm: amount exact match (+-$0.50 FX tolerance), date range (+-3 days auth vs settlement), semantic description similarity via Mistral embeddings. Confidence score: weighted (amount 50%, date 30%, description 20%). All matches logged to AIDecisionLog with explanation.
**Depends on:** A1, A5, A6, B4, B5
**Risk:** high (must NOT create duplicate JEs — match just LINKS, doesn't post)
**Success:** Bill created for $15.50 Starbucks → MatchingWorker finds "STARBUCKS #1234" transaction → links them
**Review:** `financial-data-validator`, `architecture-strategist`

### Task D2: Receipt-to-Transaction Matching (AP)

**Files:** Extends D1 matching worker
**What:** When BillCreated event fires, search for matching Transaction by amount + date + vendor similarity. Auto-link Bill.id to Transaction. Update Transaction status to MATCHED. Does NOT create duplicate JEs (Bill creates AP JE, Transaction creates bank JE, match just links).
**Depends on:** D1
**Risk:** high (double-entry integrity)
**Success:** Upload Starbucks receipt → Bill created → auto-matched to credit card transaction
**Review:** `financial-data-validator`

### Task D3: Invoice-to-Deposit Matching (AR)

**Files:** Extends D1 matching worker
**What:** When InvoiceCreated or TransactionCreated (deposit) fires, search for matching counterpart. Auto-mark Invoice as PAID when matched to deposit. Link Invoice to Transaction.
**Depends on:** D1
**Success:** Deposit from "Client ABC" $5,000 → matched to outstanding Invoice #1234 → Invoice marked PAID

### Task D4: Internal Transfer Detection Enhancement

**Files:** Extends D1 matching worker + existing transfer detection (DEV-46)
**What:** Enhance existing transfer detection with Mistral embeddings. Withdrawal from Account X + Deposit to Account Y with same amount within 3 days → suggest as internal transfer. Uses existing transfer infrastructure.
**Depends on:** D1
**Success:** $500 withdrawal + $500 deposit (different accounts, same date) → flagged as potential transfer

### Task D5: Matching Review UI

**Files:** `apps/web/src/app/(dashboard)/banking/matching-review/`
**What:** Page showing suggested matches with confidence scores. User can approve, reject, or manually link. Shows both sides (Bill/Invoice + Transaction) with visual comparison. Batch approve for high-confidence matches.
**Depends on:** D1
**Success:** Review page shows 5 suggested matches → batch approve 3 high-confidence → manually link 1 → reject 1

---

## Track E: Compliance & Privacy

> GDPR, PIPEDA, CCPA, EU AI Act, SOC 2 from day one.

### Task E1: Consent Management Service

**Files:** `apps/api/src/domains/system/services/ai-consent.service.ts`, `packages/db/prisma/schema.prisma`
**What:** New `AIConsent` model: userId, tenantId, autoCreateBills (bool), autoMatchTransactions (bool), autoCategorize (bool), useCorrectionsForLearning (bool). Defaults: ALL OFF for new users. Service: `getConsent()`, `updateConsent()`, `checkConsent(feature)`. 30-day training period: new users require manual confirmation regardless of confidence.
**Depends on:** none
**Risk:** high (compliance — GDPR Article 22, PIPEDA 4.3)
**Success:** New user → all toggles OFF → tries bill scan → prompted to opt in → toggle ON → scan proceeds
**Review:** `security-sentinel`

### Task E2: Consent Gate Middleware

**Files:** `apps/api/src/lib/middleware/consent-gate.ts`
**What:** Fastify preHandler that checks consent status before AI processing. Routes protected: bill-scan, invoice-scan, NL bookkeeping, auto-matching. If consent not given → return 403 with explanation. Consent status logged in every AIDecisionLog entry.
**Depends on:** E1
**Success:** User without consent → POST /api/business/bills/scan → 403 "Enable AI processing in settings"
**Review:** `security-sentinel`, `fastify-api-reviewer`

### Task E3: Consent Settings UI

**Files:** `apps/web/src/app/(dashboard)/system/settings/ai-preferences.tsx`
**What:** Settings page section with 4 granular toggles (using SwitchGlass). Explanatory text for each. Banner for new users during 30-day training period. "Learn more" links to privacy policy.
**Depends on:** E1
**Success:** User toggles "Auto-create bills" ON → confirmed → future bill scans auto-create

### Task E4: EU AI Act Documentation

**Files:** `docs/compliance/eu-ai-act-assessment.md`
**What:** Document risk classification assessment: Akount's bookkeeping AI is NOT high-risk (Annex III exemption — narrow procedural tasks, no creditworthiness/legal effects). Document transparency requirements met (AI labels on all outputs). Document reassessment trigger (if adding credit scoring, assessment changes).
**Depends on:** none
**Success:** Documented assessment ready for legal review. Key dates tracked (Aug 2026 deadline).

### Task E5: AI Transparency Labels

**Files:** Modify existing UI components across dashboard
**What:** Every AI-generated or AI-modified record shows transparency label: "AI extracted: Starbucks, $15.50, Jan 15 (92% confidence)" on Bills/Invoices. "AI categorized as Office Supplies" on Transactions. Small badge/chip styling. Human override capability on all labels (click to recategorize).
**Depends on:** A5
**Success:** AI-created Bill shows "AI extracted" badge. User can click to edit any AI-populated field.
**Review:** `design-system-enforcer`

### Task E6: GDPR Right to Erasure

**Files:** `apps/api/src/domains/system/services/ai-data-deletion.service.ts`
**What:** `deleteUserAIData(userId)` cascade function. Deletes: uploaded documents, AIDecisionLog entries, LLM prompt/response logs, correction/training data, RAG retrieval store entries. Financial records created by AI REMAIN (they're user-owned). `AITrainingDataSource` table maps every training example to source. Maximum 24h fulfillment SLA.
**Depends on:** A5, E1
**Risk:** high (compliance — GDPR Article 17)
**Success:** User requests deletion → all AI data purged within 24h → financial records preserved → audit log entry
**Review:** `security-sentinel`

### Task E7: Data Retention Policies

**Files:** Extend `apps/api/src/lib/audit-retention.ts`
**What:** Add retention tiers for AI data categories: uploaded documents (7yr ENTERPRISE, 1yr PRO, 90d FREE), AIDecisionLog (same as audit logs), LLM prompt/response logs (90d all plans), user corrections (until deletion request), RAG store (linked to document lifecycle). Automated cleanup job.
**Depends on:** A5
**Success:** 91-day-old LLM logs auto-purged. Retention tiers match existing audit-retention.ts pattern.

### Task E8: CCPA ADMT Notice

**Files:** `apps/web/src/components/shared/ADMTNotice.tsx`
**What:** Pre-use notice displayed before first AI feature use for California users. Explains automated decision-making. Links to opt-out (E3 consent settings). AI decision export capability (download AIDecisionLog as CSV).
**Depends on:** E1, E3
**Success:** California user first uses AI feature → ADMT notice displayed → user acknowledges → proceeds

### Task E9: SOC 2 AI Controls Documentation

**Files:** `docs/compliance/soc2-ai-controls.md`
**What:** Document expanded SOC 2 scope: Security (model weight integrity, endpoint auth, network isolation), Availability (graceful degradation, failover), Processing Integrity (Zod validation, version pinning, I/O logging), Confidentiality (tenant isolation, encrypted storage), Privacy (PII redaction, consent, deletion cascade). Map to CC7.2 (monitoring via AIDecisionLog), CC8.1 (model governance via version control).
**Depends on:** A5, E1
**Success:** SOC 2 documentation complete, ready for auditor review.

---

## Track F: Learning & Personalization

> AI gets smarter per tenant while preserving privacy.

### Task F1: RAG Vector Store Setup

**Files:** `apps/api/src/domains/ai/services/rag-store.service.ts`, `packages/db/prisma/schema.prisma`
**What:** Per-tenant vector store using Mistral embeddings. New `RAGEntry` model: tenantId, entityId, embedding (vector), sourceType (CORRECTION, VENDOR_ALIAS, CATEGORY_PREF), sourceData (JSON), createdAt. Service: `addEntry()`, `search(query, tenantId, limit)`, `deleteByTenant()`. Vector similarity search via pgvector extension OR in-memory for MVP.
**Depends on:** A1, E1 (consent for learning)
**Risk:** high (tenant isolation — RAG entries must NEVER cross tenants)
**Success:** User corrects "AMZN" → "Amazon" → stored in RAG. Next "AMZN" transaction → RAG retrieves correction → "Amazon" suggested.
**Review:** `security-sentinel`

### Task F2: User Correction Feedback Loop

**Files:** `apps/api/src/domains/ai/services/correction-tracking.service.ts`
**What:** When user overrides AI categorization: log correction {original, corrected, vendor, context}. Store in tenant RAG store (F1). Track correction rate per category (>20% corrections = flag for review). Next time same vendor appears, RAG includes correction context in Mistral prompt. Requires "use corrections for learning" consent (E1).
**Depends on:** E1, F1
**Success:** Correct "Starbucks" from "Food & Dining" to "Business Meals" → next Starbucks → AI suggests "Business Meals"

### Task F3: Vendor Name Normalization

**Files:** `apps/api/src/domains/ai/services/vendor-normalization.service.ts`
**What:** Per-tenant learned aliases: "AMZN MKTP" = "Amazon Marketplace", "SBUX" = "Starbucks". Stored in RAG. Mistral embeddings + cosine similarity for fuzzy matching. Applied during transaction import and matching. User can edit/delete aliases.
**Depends on:** F1
**Success:** Import "AMZN MKTP US" → normalized to "Amazon Marketplace" → consistent vendor across all transactions

### Task F4: Per-Tenant Category Preferences

**Files:** Extends F2 correction tracking
**What:** Track per-tenant category preferences: "This solopreneur uses 'Advertising' not 'Marketing' for Google Ads." Stored in RAG. Applied during categorization as additional context. Higher priority than default AI suggestions.
**Depends on:** F1, F2
**Success:** After 3 corrections Google Ads → Advertising, all future Google Ads auto-categorized as Advertising

---

## Phased Rollout (from Brainstorm)

### Phase 1: Foundation (Week 1-2)

**Tracks:** A (all), B (B1-B6), E (E1-E5)

**Goal:** Secure AI infrastructure + solopreneurs can snap receipt photos and auto-create bills.

**Deliverables:**
- Mistral provider with vision (A1, A2)
- PII redaction + prompt defense (A3, A4)
- AIDecisionLog schema + service (A5)
- Redis + BullMQ + SSE (A6, A7, A8, A9)
- DocumentExtractionService + schemas (B1, B2, B3)
- BillScanWorker + API route (B4, B6)
- InvoiceScanWorker + API route (B5, B7)
- Consent management (E1, E2, E3)
- EU AI Act assessment + transparency labels (E4, E5)

**Success:** Upload receipt → Bill created in <10s → zero PII in logs → consent required

### Phase 2: Expand + Smart Features (Week 3)

**Tracks:** B (B8-B11), C (C1-C4)

**Goal:** Enhanced statement parsing + natural language bookkeeping + search

**Deliverables:**
- Replace regex PDF parser with hybrid (B8)
- Upload UIs for bill/invoice scan (B9, B10)
- Review queue UI (B11)
- NL bookkeeping endpoint + UI (C1, C2)
- NL search endpoint + UI (C3, C4)

**Success:** Import unknown bank PDF → Mistral extracts. "Paid $50 at Staples" → Transaction created.

### Phase 3: Compliance Hardening + Narration (Week 4)

**Tracks:** C (C5-C9), E (E6-E9)

**Goal:** Full compliance posture + report narration + anomaly enhancement

**Deliverables:**
- Report narration (C5, C6)
- Anomaly detection enhancement (C7)
- Client communication drafts (C8)
- Tax optimization suggestions (C9)
- GDPR deletion cascade (E6)
- Data retention policies (E7)
- CCPA ADMT notice (E8)
- SOC 2 documentation (E9)

**Success:** `deleteUserAIData()` works. Reports have AI narratives. Anomalies surfaced in insights.

### Phase 4: Matching + Learning (Week 5-6)

**Tracks:** D (all), F (F1-F4)

**Goal:** Auto-reconciliation + per-tenant AI personalization

**Deliverables:**
- MatchingWorker + AP/AR matching (D1-D4)
- Matching review UI (D5)
- RAG vector store (F1)
- Correction feedback loop (F2)
- Vendor normalization (F3)
- Category preferences (F4)

**Success:** 80%+ Bills auto-matched. User corrections improve predictions within same session.

### Phase 5: Polish + Scale (Week 7-8)

**Tracks:** Performance tuning, migration to self-hosted Mistral assessment

**Goal:** Production hardening, GPU server assessment, cross-tenant learning decision

**Deliverables:**
- Load testing all AI endpoints
- Mistral self-hosting feasibility assessment
- Performance optimization (caching, batching)
- End-to-end integration tests
- Cross-tenant learning DPIA (go/no-go decision)

---

## Reference Files

| File | Purpose |
|------|---------|
| `apps/api/src/domains/ai/services/providers/claude.provider.ts` | Pattern for new Mistral provider |
| `apps/api/src/domains/ai/services/categorization.service.ts` | Pattern for AI service with structured output |
| `apps/api/src/domains/banking/services/import.service.ts` | Existing import orchestration |
| `apps/api/src/domains/banking/services/parser-pdf.ts` | Current regex parser to replace |
| `apps/api/src/lib/file-scanner.ts` | Security scanner to extend |
| `apps/api/src/lib/audit-retention.ts` | Retention policy pattern |
| `packages/db/prisma/schema.prisma` | Data model (AIDecisionLog, AIConsent, RAGEntry) |
| `apps/web/src/hooks/` | Pattern for SSE hook |

## Edge Cases

- **Blurry photo** — Confidence <50% → prompt user to retake with better lighting
- **Multiple matches** — Two bills same amount/date → show both, user picks
- **Duplicate upload** — SHA256 hash check → warn "This receipt was already uploaded"
- **Mistral API down** — Graceful degradation: CSV/XLSX still work (deterministic). PDFs/images → pdfjs-dist emergency text extraction → route to manual review queue. Never silent failure — user always knows when in degraded mode.
- **FX rounding** — +-$0.50 tolerance in matching for currency conversion differences
- **User opts out after auto-creation** — Existing records remain, future AI processing stops

## Review Agent Coverage

| Task Range | Relevant Agents |
|------------|----------------|
| A1-A4, A8 | `security-sentinel`, `kieran-typescript-reviewer` |
| A5 | `prisma-migration-reviewer`, `financial-data-validator` |
| A6-A7 | `architecture-strategist`, `security-sentinel` |
| B1-B8 | `financial-data-validator`, `kieran-typescript-reviewer` |
| B9-B11 | `nextjs-app-router-reviewer`, `design-system-enforcer` |
| C1-C9 | `financial-data-validator` |
| D1-D4 | `financial-data-validator`, `architecture-strategist` |
| E1-E9 | `security-sentinel` |
| F1-F4 | `security-sentinel` (tenant isolation) |

## Domain Impact

**Primary domains:** AI (new services), Business (bill/invoice scan), Banking (enhanced parsing)
**Adjacent domains:** Accounting (JE matching), System (consent, audit), Insights (anomaly detection)
**New data flows:**
- Business → AI → Business (document scan → extraction → record creation)
- Banking → AI → Banking (import → enhanced categorization → matching)
- AI → System (consent checks, audit trail)
- System → AI (consent gates)

## Testing Strategy

- **Unit tests:** Every service method, every Zod schema validation
- **Integration tests:** Full upload → extraction → creation flow
- **Financial invariant tests:** Integer cents, balanced JEs, tenant isolation, soft delete
- **Security tests:** PII redaction (no CC numbers in logs), prompt injection defense
- **Regression tests:** Existing CSV/XLSX imports still work unchanged
- **E2E tests:** Upload receipt → review → approve → Bill appears in list

## Progress

- [ ] Phase 1: Foundation (Week 1-2)
- [ ] Phase 2: Expand + Smart (Week 3)
- [ ] Phase 3: Compliance + Narration (Week 4)
- [ ] Phase 4: Matching + Learning (Week 5-6)
- [ ] Phase 5: Polish + Scale (Week 7-8)
