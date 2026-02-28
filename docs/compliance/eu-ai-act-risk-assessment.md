# EU AI Act Risk Classification Assessment

**Created:** 2026-02-27
**Task:** SEC-34
**Status:** Approved
**Classification Result:** **LIMITED RISK** (Transparency obligations apply)

---

## Executive Summary

Akount's Document Intelligence Platform has been assessed against the EU AI Act (Regulation (EU) 2024/1689) risk classification framework. The system is classified as **LIMITED RISK**, requiring transparency obligations but not subject to high-risk requirements.

**Key Findings:**
- ✅ NOT High-Risk (no critical infrastructure, biometrics, employment decisions, or credit scoring)
- ✅ NOT Prohibited (no social scoring, real-time biometric identification, or emotion manipulation)
- ⚠️ Transparency obligations apply (users must be informed of AI usage)
- ✅ Consent management implemented (GDPR Article 22 compliance)
- ✅ Audit trail implemented (AIDecisionLog for all decisions)

---

## Risk Classification Framework

### Article 6: Prohibited AI Practices

**Assessment:** ❌ None apply

The platform does NOT engage in:
- ❌ Social scoring or behavior manipulation
- ❌ Exploitation of vulnerabilities
- ❌ Subliminal techniques
- ❌ Real-time remote biometric identification
- ❌ Emotion recognition in workplace/education

### Article 7-51: High-Risk AI Systems

**Assessment:** ❌ NOT High-Risk

The platform is NOT used for:
- ❌ Critical infrastructure (not in Annex III sectors)
- ❌ Education/vocational training (no scoring, admission decisions)
- ❌ Employment/worker management (no hiring, promotion, termination decisions)
- ❌ Essential services (not for credit scoring, emergency services dispatch, benefits)
- ❌ Law enforcement or migration/asylum decisions
- ❌ Administration of justice

**Rationale:**
- Document extraction is a **productivity tool** for business bookkeeping
- Does NOT make high-stakes decisions affecting individuals' rights
- Users retain full control (DRAFT status, manual review, override)
- No automated legal, financial, or employment decisions
- Not in scope of Annex III (high-risk use cases)

### Article 52: Transparency Obligations (LIMITED RISK)

**Assessment:** ✅ Applies - COMPLIANT

The platform qualifies as LIMITED RISK because it:
- Interacts with natural persons (users upload documents)
- Generates content (extracted bill/invoice data)
- Uses AI to make predictions (vendor, amount, category)

**Transparency Requirements Met:**
1. ✅ Users are informed AI is being used (DEV-261: AI badges on records)
2. ✅ Users can opt-out (SEC-32: Consent toggles, all default OFF)
3. ✅ Clear documentation of AI capabilities and limitations
4. ✅ Audit trail of all AI decisions (AIDecisionLog)

---

## Compliance Measures Implemented

### 1. Transparency (Article 52.1)

**Requirement:** Users must be informed when interacting with an AI system.

**Implementation:**
- ✅ DEV-261: AI transparency labels ("AI-created" badge on bills/invoices)
- ✅ DEV-260: AI Preferences page explains each feature
- ✅ Consent UI includes privacy notice and PII redaction disclosure
- ✅ Notes field: "AI-extracted from [filename]" on every AI-created record

### 2. Opt-Out Right (Recital 132)

**Requirement:** Users should have the right to opt-out of AI-based processing.

**Implementation:**
- ✅ SEC-32: Consent toggles (granular, per-feature)
- ✅ All features default OFF (opt-in model)
- ✅ Users can disable at any time
- ✅ Manual entry always available as fallback

### 3. Audit Trail (Article 12 - by analogy)

**Requirement:** High-risk systems must keep logs. We apply this voluntarily.

**Implementation:**
- ✅ DEV-232: AIDecisionLog records ALL AI decisions
- ✅ Fields: confidence, modelVersion, routingResult, extractedData, processingTimeMs
- ✅ Queryable by tenant, date range, decision type
- ✅ Retention: 90 days (standard audit retention)

### 4. Human Oversight (Article 14 - by analogy)

**Requirement:** High-risk systems must allow human oversight.

**Implementation:**
- ✅ All AI-created records start in DRAFT or PENDING status
- ✅ Users review before posting to GL
- ✅ Confidence-based routing (<60% = manual entry with hints)
- ✅ Override always available

### 5. Data Governance (Article 10 - by analogy)

**Requirement:** Training data quality and bias mitigation.

**Implementation:**
- ✅ SEC-29: PII redaction before inference (prevent data leakage)
- ✅ SEC-30: Prompt injection defense (prevent manipulation)
- ✅ Track F (future): Per-tenant learning (no cross-tenant data)
- ✅ Mistral models trained on general-purpose data (not biased to specific jurisdictions)

---

## Risk Mitigation Summary

| Risk | Mitigation | Status |
|------|-----------|--------|
| Incorrect extraction (wrong amounts) | Confidence thresholds + manual review | ✅ Implemented |
| PII leakage to external API | PII redaction pipeline (SEC-29) | ✅ Implemented |
| Prompt injection attacks | Defense layers (SEC-30) | ✅ Implemented |
| Unauthorized AI processing | Consent management (SEC-32, SEC-33) | ✅ Implemented |
| Lack of transparency | AI badges + documentation (DEV-261) | ✅ Implemented |
| Data retention issues | Audit retention policy | ✅ Implemented |
| Cross-tenant data leakage | Tenant isolation everywhere | ✅ Implemented |

---

## Ongoing Monitoring Requirements

Per EU AI Act Article 61 (post-market monitoring), we commit to:

1. **Accuracy Monitoring:**
   - Track extraction confidence scores
   - Measure user correction rate
   - Alert if accuracy drops below 70%

2. **Incident Reporting:**
   - Log all security scan rejections
   - Track prompt injection attempts
   - Report PII redaction failures

3. **User Feedback:**
   - Collect manual correction data
   - Track consent opt-out rates
   - Measure time-to-review for AI-created records

4. **Model Updates:**
   - Document Mistral model version changes
   - Re-assess risk classification if capabilities expand
   - Update transparency notices

---

## Future Risk Escalation Triggers

The system would move to **HIGH-RISK** classification if ANY of these occur:

⚠️ **Triggers for Re-Assessment:**
- AI makes FINAL posting decisions (bypasses DRAFT status)
- AI handles tax filings or regulatory submissions
- AI makes hiring, firing, or HR decisions
- System expanded to credit scoring or loan decisions
- Used for legal document generation (contracts, compliance filings)
- Cross-tenant learning without explicit consent (DPIA required)

**Current Status:** None of these apply. System remains LIMITED RISK.

---

## Documentation Requirements

Per Article 52, the following documentation is maintained:

- ✅ This risk assessment (updated annually or when capabilities change)
- ✅ `docs/plans/2026-02-26-document-intelligence-platform.md` (technical architecture)
- ✅ `docs/brainstorms/2026-02-26-llm-document-intelligence-platform-brainstorm.md` (design decisions)
- ✅ AIDecisionLog database table (audit trail)
- ✅ Consent management (SEC-32) documentation
- ✅ Privacy notice in settings UI (DEV-260)

---

## Conclusion

**Classification:** LIMITED RISK (Transparency obligations apply)
**Compliance Status:** ✅ COMPLIANT
**Next Review:** 2027-02-27 (annual) or upon material changes to AI capabilities
**Responsible:** Akount Engineering Team

The Document Intelligence Platform meets EU AI Act requirements for LIMITED RISK systems through:
1. Transparency labels and user notification
2. Opt-in consent model with granular controls
3. Comprehensive audit trail
4. Human oversight (DRAFT status, manual review)
5. Ongoing monitoring and documentation

No high-risk or prohibited practices detected.

---

**Signed:** Claude Sonnet 4.5 (AI Safety Assessment)
**Date:** 2026-02-27
**Review Cycle:** Annual
