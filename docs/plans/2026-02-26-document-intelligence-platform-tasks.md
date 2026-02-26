# Document Intelligence Platform — Task List

**Created:** 2026-02-26
**Plan:** [2026-02-26-document-intelligence-platform.md](./2026-02-26-document-intelligence-platform.md)
**Brainstorm:** [../brainstorms/2026-02-26-llm-document-intelligence-platform-brainstorm.md](../brainstorms/2026-02-26-llm-document-intelligence-platform-brainstorm.md)
**Status:** Draft — Pending approval
**Reserved IDs:** DEV-230..267, SEC-29..38, INFRA-61..62

---

## Progress Summary

| Phase | Scope | Tasks | Done | Status |
|-------|-------|-------|------|--------|
| **1** | Foundation (A + B core + E basics) | 22 | 0 | Not started |
| **2** | Expand + Smart (B UIs + C1-C4) | 8 | 0 | Not started |
| **3** | Compliance + Narration (C5-C9 + E6-E9) | 8 | 0 | Not started |
| **4** | Matching + Learning (D + F) | 9 | 0 | Not started |
| **5** | Polish + Scale | — | — | Not started |
| **Total** | | **47** | **0** | **0%** |

---

## Phase 1: Foundation (Week 1-2)

> Secure AI infrastructure + receipt scanning + consent management

### Track A: Core AI Infrastructure & Security

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| DEV-230 | A1 | Mistral API provider (`providers/mistral.provider.ts`) | 2-4h | Critical | Ready | — | plan:doc-intel |
| DEV-231 | A2 | Mistral vision integration (`extractFromImage` + Zod) | 2-4h | Critical | Ready | DEV-230 | plan:doc-intel |
| SEC-29 | A3 | PII redaction service (`lib/pii-redaction.ts`) | 4-6h | Critical | Ready | — | plan:doc-intel |
| SEC-30 | A4 | Prompt injection defense (`lib/prompt-defense.ts`) | 3-4h | Critical | Ready | DEV-230 | plan:doc-intel |
| DEV-232 | A5 | AIDecisionLog schema + service (Prisma + audit trail) | 3-4h | Critical | Ready | — | plan:doc-intel |
| INFRA-61 | A6 | Redis + BullMQ queue infrastructure (5 queues, TLS, DLQ) | 4-6h | Critical | Ready | — | plan:doc-intel |
| DEV-233 | A7 | SSE real-time job updates (`/api/ai/jobs/:jobId/stream`) | 2-3h | High | Ready | INFRA-61 | plan:doc-intel |
| SEC-31 | A8 | File scanner extension (JPEG, PNG, HEIC, EXIF strip) | 2-3h | High | Ready | — | plan:doc-intel |
| DEV-234 | A9 | SSE client hook (`useJobStream` React hook) | 2-3h | High | Ready | DEV-233 | plan:doc-intel |

### Track B: Document Intelligence (Core)

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| DEV-235 | B1 | DocumentExtractionService (shared Mistral vision core) | 4-6h | Critical | Ready | DEV-230, DEV-231, SEC-29, SEC-30 | plan:doc-intel |
| DEV-236 | B2 | Bill extraction Zod schemas (vendor, amount, line items) | 1-2h | High | Ready | — | plan:doc-intel |
| DEV-237 | B3 | Invoice extraction Zod schemas (+ payment terms, client) | 1-2h | High | Ready | — | plan:doc-intel |
| DEV-238 | B4 | BillScanWorker (AP flow: extract → validate → create Bill) | 4-6h | Critical | Ready | DEV-232, INFRA-61, DEV-235, DEV-236 | plan:doc-intel |
| DEV-239 | B5 | InvoiceScanWorker (AR flow: extract → create Invoice) | 3-4h | Critical | Ready | DEV-232, INFRA-61, DEV-235, DEV-237 | plan:doc-intel |
| DEV-240 | B6 | Bill scan API route (`POST /api/business/bills/scan`) | 2-3h | Critical | Ready | INFRA-61, SEC-31, DEV-238 | plan:doc-intel |
| DEV-241 | B7 | Invoice scan API route (`POST /api/business/invoices/scan`) | 2-3h | High | Ready | INFRA-61, SEC-31, DEV-239 | plan:doc-intel |

### Track E: Compliance & Privacy (Basics)

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| SEC-32 | E1 | Consent management service + AIConsent schema | 3-4h | Critical | Ready | — | plan:doc-intel |
| SEC-33 | E2 | Consent gate middleware (preHandler on AI routes) | 2-3h | Critical | Ready | SEC-32 | plan:doc-intel |
| DEV-260 | E3 | Consent settings UI (4 toggles, 30-day training banner) | 2-3h | High | Ready | SEC-32 | plan:doc-intel |
| SEC-34 | E4 | EU AI Act risk classification assessment (documentation) | 2-3h | High | Ready | — | plan:doc-intel |
| DEV-261 | E5 | AI transparency labels (badges on AI-created records) | 2-3h | High | Ready | DEV-232 | plan:doc-intel |

**Phase 1 total: 22 tasks**

---

## Phase 2: Expand + Smart Features (Week 3)

> Enhanced statement parsing + NL bookkeeping + NL search + upload UIs

### Track B: Document Intelligence (UI + Statement Parsing)

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| DEV-242 | B8 | Bank statement parsing — Mistral primary (replace regex) | 6-8h | Critical | Ready | DEV-230, DEV-231, DEV-235 | plan:doc-intel |
| DEV-243 | B9 | Upload UI — bill scan (drag-drop, SSE progress, review) | 4-6h | High | Ready | DEV-234, DEV-240 | plan:doc-intel |
| DEV-244 | B10 | Upload UI — invoice scan (line items, payment terms) | 3-4h | High | Ready | DEV-234, DEV-241 | plan:doc-intel |
| DEV-245 | B11 | Review queue UI (`/business/review` — pending extractions) | 4-6h | High | Ready | DEV-238, DEV-239 | plan:doc-intel |

### Track C: Smart Automation (NL Features)

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| DEV-246 | C1 | NL bookkeeping endpoint + service (Mistral function calling) | 4-6h | High | Ready | DEV-230, DEV-232 | plan:doc-intel |
| DEV-247 | C2 | NL bookkeeping UI (text input bar on dashboard) | 2-3h | High | Ready | DEV-246 | plan:doc-intel |
| DEV-248 | C3 | Smart NL search endpoint (query → structured filter) | 3-4h | Medium | Ready | DEV-230, DEV-232 | plan:doc-intel |
| DEV-249 | C4 | NL search UI (search bar with AI mode toggle) | 2-3h | Medium | Ready | DEV-248 | plan:doc-intel |

**Phase 2 total: 8 tasks**

---

## Phase 3: Compliance Hardening + Smart Features (Week 4)

> Full compliance posture + report narration + anomaly enhancement

### Track C: Smart Automation (Advanced)

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| DEV-250 | C5 | Financial report narration endpoint (P&L, BS, CF) | 3-4h | Medium | Ready | DEV-230, DEV-232 | plan:doc-intel |
| DEV-251 | C6 | Report narration UI (Newsreader italic, collapsible) | 2-3h | Medium | Ready | DEV-250 | plan:doc-intel |
| DEV-252 | C7 | Anomaly detection enhancement (Mistral-powered) | 4-6h | Medium | Ready | DEV-230, DEV-232, INFRA-61 | plan:doc-intel |
| DEV-253 | C8 | Client communication drafts (payment reminders) | 3-4h | Low | Ready | DEV-230 | plan:doc-intel |
| DEV-254 | C9 | Tax optimization suggestions (jurisdiction-aware) | 3-4h | Low | Ready | DEV-230, DEV-232 | plan:doc-intel |

### Track E: Compliance & Privacy (Full)

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| SEC-35 | E6 | GDPR right to erasure (`deleteUserAIData` cascade) | 4-6h | Critical | Ready | DEV-232, SEC-32 | plan:doc-intel |
| SEC-36 | E7 | Data retention policies (extend audit-retention.ts) | 2-3h | High | Ready | DEV-232 | plan:doc-intel |
| DEV-262 | E8 | CCPA ADMT pre-use notice (California users) | 2-3h | High | Ready | SEC-32, DEV-260 | plan:doc-intel |
| SEC-37 | E9 | SOC 2 AI controls documentation | 2-3h | High | Ready | DEV-232, SEC-32 | plan:doc-intel |

**Phase 3 total: 9 tasks**

---

## Phase 4: Matching + Learning (Week 5-6)

> Auto-reconciliation + per-tenant AI personalization

### Track D: Cross-Domain Matching

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| DEV-255 | D1 | MatchingWorker (BullMQ, amount+date+semantic matching) | 6-8h | High | Ready | DEV-230, DEV-232, INFRA-61, DEV-238, DEV-239 | plan:doc-intel |
| DEV-256 | D2 | Receipt-to-transaction matching (AP flow, link not post) | 3-4h | High | Ready | DEV-255 | plan:doc-intel |
| DEV-257 | D3 | Invoice-to-deposit matching (AR flow, auto-mark PAID) | 3-4h | High | Ready | DEV-255 | plan:doc-intel |
| DEV-258 | D4 | Internal transfer detection enhancement (Mistral embeddings) | 2-3h | Medium | Ready | DEV-255 | plan:doc-intel |
| DEV-259 | D5 | Matching review UI (confidence scores, batch approve) | 4-6h | High | Ready | DEV-255 | plan:doc-intel |

### Track F: Learning & Personalization

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| DEV-263 | F1 | RAG vector store setup (per-tenant, pgvector or in-memory) | 6-8h | High | Ready | DEV-230, SEC-32 | plan:doc-intel |
| DEV-264 | F2 | User correction feedback loop (store → RAG → improve) | 3-4h | High | Ready | SEC-32, DEV-263 | plan:doc-intel |
| DEV-265 | F3 | Vendor name normalization (per-tenant aliases via RAG) | 2-3h | Medium | Ready | DEV-263 | plan:doc-intel |
| DEV-266 | F4 | Per-tenant category preferences (correction → preference) | 2-3h | Medium | Ready | DEV-263, DEV-264 | plan:doc-intel |

**Phase 4 total: 9 tasks**

---

## Phase 5: Polish + Scale (Week 7-8)

> Performance tuning, self-hosted Mistral assessment, E2E testing

| ID | Track | Task | Effort | Priority | Status | Deps | Source |
|----|-------|------|--------|----------|--------|------|--------|
| SEC-38 | — | Cross-tenant learning DPIA (go/no-go decision) | 4-6h | Medium | Ready | All Track F | plan:doc-intel |
| DEV-267 | — | Load testing + performance optimization (all AI endpoints) | 4-6h | High | Ready | All phases | plan:doc-intel |
| INFRA-62 | — | Self-hosted Mistral feasibility assessment (GPU, Docker) | 4-6h | Medium | Ready | All phases | plan:doc-intel |

**Phase 5 total: 3 tasks (+ ad-hoc E2E test tasks as needed)**

---

## Spare IDs

None remaining. If additional tasks discovered during implementation, reserve new IDs via:
```bash
node .claude/scripts/reserve-task-ids.js DEV <count>
```

---

## Dependency Graph (Critical Path)

```
Phase 1 (Foundation):
  DEV-230 (Mistral provider) ──┬── DEV-231 (vision) ──── DEV-235 (extraction service)
                               ├── SEC-30 (prompt defense) ──┘
  SEC-29 (PII redaction) ──────┘

  INFRA-61 (Redis+Bull) ──┬── DEV-233 (SSE) ── DEV-234 (SSE hook)
                          ├── DEV-238 (BillScanWorker) ── DEV-240 (bill scan route)
                          └── DEV-239 (InvoiceScanWorker) ── DEV-241 (invoice scan route)

  DEV-232 (AIDecisionLog) ──── used by B4, B5, C1, C3, C5, D1, E5, E6

  SEC-32 (Consent service) ── SEC-33 (consent gate) ── DEV-260 (consent UI)

Phase 2 (Expand):
  DEV-235 ── DEV-242 (statement parsing — Mistral primary)
  DEV-234 ── DEV-243 (bill upload UI), DEV-244 (invoice upload UI)
  DEV-230 ── DEV-246 (NL bookkeeping) ── DEV-247 (NL UI)
  DEV-230 ── DEV-248 (NL search) ── DEV-249 (search UI)

Phase 3 (Compliance):
  DEV-230 ── DEV-250 (narration) ── DEV-251 (narration UI)
  SEC-32 ── SEC-35 (GDPR deletion)

Phase 4 (Matching + Learning):
  DEV-255 (MatchingWorker) ──┬── DEV-256 (AP matching)
                             ├── DEV-257 (AR matching)
                             ├── DEV-258 (transfer detection)
                             └── DEV-259 (matching review UI)

  DEV-263 (RAG store) ──┬── DEV-264 (corrections)
                        ├── DEV-265 (vendor normalization)
                        └── DEV-266 (category preferences)
```

---

## Review Agent Assignments

| Task IDs | Review Agent | Trigger |
|----------|-------------|---------|
| DEV-230, DEV-231, DEV-234 | `kieran-typescript-reviewer` | New provider pattern |
| SEC-29, SEC-30, SEC-31, SEC-33 | `security-sentinel` | PII, injection, file security |
| DEV-232, SEC-32 | `prisma-migration-reviewer` | New Prisma models |
| DEV-238, DEV-239, DEV-242, DEV-255-258 | `financial-data-validator` | Financial record creation, matching |
| DEV-240, DEV-241, DEV-233, DEV-246, DEV-248 | `fastify-api-reviewer` | New API routes |
| DEV-243, DEV-244, DEV-245, DEV-247, DEV-249, DEV-251, DEV-259 | `nextjs-app-router-reviewer` | New frontend pages |
| DEV-243, DEV-244, DEV-260, DEV-261 | `design-system-enforcer` | UI components |
| DEV-255, INFRA-61 | `architecture-strategist` | Queue architecture, matching engine |
| SEC-35, SEC-36, SEC-37 | `security-sentinel` | Compliance implementation |

---

## Cross-Reference

This task list is the execution board for the Document Intelligence Platform.

- **Implementation plan:** `docs/plans/2026-02-26-document-intelligence-platform.md`
- **Brainstorm:** `docs/brainstorms/2026-02-26-llm-document-intelligence-platform-brainstorm.md`
- **Main TASKS.md:** Reference entry points here for high-level tracking
- **Prerequisites:** Auto-Bookkeeper Phase 1 (DEV-185 to DEV-200 in main TASKS.md)
