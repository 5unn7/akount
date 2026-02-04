# 🔐 AKOUNT — SOC 2 NARRATIVE

**Trust Services Criteria: Security, Availability, Confidentiality, Processing Integrity**

**Document Version:** 1.0
**System Scope:** Akount SaaS Platform
**Prepared For:** SOC 2 Type I / Type II Readiness

---

## 1. SYSTEM DESCRIPTION

Akount is a **cloud-based financial operating system** that enables globally operating solopreneurs and their accountants to manage financial records across **multiple entities, currencies, and jurisdictions**.

The system processes:

* Bank transaction data (read-only access)
* Accounting records (double-entry)
* Financial reports
* Audit logs
* AI-generated insights (non-authoritative)

Akount **does not** move funds, initiate payments, or file taxes.

---

## 2. TRUST SERVICES CRITERIA — SECURITY (CC1–CC7)

### CC1 — Control Environment

**Control Objective:**
Akount establishes a control environment that prioritizes accountability, auditability, and professional discipline.

**Implementation:**

* Clearly defined roles (Owner, Admin, Accountant, Bookkeeper, Viewer)
* Entity-level and feature-level permissions
* Explicit separation of duties
* Immutable audit logs

**Evidence:**

* Role-based permission matrices
* Audit log records
* Period-lock enforcement

---

### CC2 — Communication & Information

**Control Objective:**
Security responsibilities and system behavior are clearly communicated to users.

**Implementation:**

* Explicit permission previews during invitations
* Clear UI indicators for role, entity, and period context
* Plain-language explanations for security controls (e.g., locking, reversals)

**Evidence:**

* Invite flow screenshots
* Security & Compliance center
* Inline guardrail messaging

---

### CC3 — Risk Assessment

**Control Objective:**
Akount identifies and mitigates risks related to financial data integrity, unauthorized access, and cross-entity contamination.

**Key Risks Addressed:**

* Unauthorized access → enforced 2FA, session tracking
* Data tampering → immutable audit logs, reversal-only edits
* Contextual errors → explicit entity & period awareness
* AI misuse → AI never acts autonomously

**Evidence:**

* Threat modeling documentation
* Filing-readiness state machine
* AI restriction policies

---

### CC4 — Monitoring Activities

**Control Objective:**
Akount continuously monitors system activity and security posture.

**Implementation:**

* Active session tracking
* Audit logs for every material action
* Reconciliation and integrity checks
* Readiness state monitoring

**Evidence:**

* Audit log samples
* Reconciliation reports
* Period readiness dashboards

---

### CC5 — Control Activities

**Control Objective:**
Akount enforces preventive and detective controls over all financial operations.

**Preventive Controls:**

* Double-entry enforcement (debits must equal credits)
* Period locking
* Role-based access
* Explicit confirmations for destructive actions

**Detective Controls:**

* Reconciliation mismatches
* Uncategorized transaction detection
* FX variance detection
* Intercompany imbalance detection

**Evidence:**

* Journal entry validation rules
* Reconciliation workflows
* Exception dashboards

---

### CC6 — Logical & Physical Access Controls

**Control Objective:**
Only authorized users can access Akount systems and data.

**Implementation:**

* Mandatory authentication
* Optional SSO
* Required 2FA for professional roles
* Time-bound and revocable access
* Device/session visibility

**Evidence:**

* Authentication configuration
* Session management UI
* Access revocation logs

---

### CC7 — System Operations

**Control Objective:**
Akount ensures system stability, integrity, and controlled change management.

**Implementation:**

* No silent system actions
* Deterministic state transitions
* Controlled automation via rules
* Audit logging for all changes

**Evidence:**

* Rules engine audit logs
* Change history
* Deployment and rollback policies

---

## 3. AVAILABILITY (A1)

**Control Objective:**
Akount ensures system availability consistent with user expectations.

**Implementation:**

* Cloud-based infrastructure
* Asynchronous bank data syncing
* Graceful degradation (read-only access during outages)
* No dependency on real-time bank availability for core access

**Evidence:**

* Incident response procedures
* Uptime monitoring
* Status communication processes

---

## 4. PROCESSING INTEGRITY (PI1)

**Control Objective:**
Akount ensures financial data is processed **accurately, completely, and validly**.

**Key Guarantees:**

* Double-entry accounting enforced
* No posting without balance
* Reconciliation required for readiness
* Filing-readiness state machine enforces completeness

**AI-Specific Controls:**

* AI suggestions are advisory only
* Human approval required for all actions
* Confidence levels disclosed
* Jurisdiction context attached

**Evidence:**

* Journal entry constraints
* Filing-readiness logic
* AI insight audit metadata

---

## 5. CONFIDENTIALITY (C1)

**Control Objective:**
Akount protects confidential financial and personal data from unauthorized disclosure.

**Implementation:**

* Role- and entity-based data access
* Explicit export workflows (no background exports)
* Watermarked exports (optional)
* Audit logs for all data access

**Evidence:**

* Export confirmation flows
* Access logs
* Permission matrices

---

## 6. DATA GOVERNANCE & RETENTION

**Policies:**

* Financial records retained per jurisdictional requirements
* Audit logs immutable and retained
* Deleted data is logically archived, not silently removed

**Corrections:**

* Reversal entries only
* Original data preserved

This supports audit defensibility.

---

## 7. AI GOVERNANCE (SOC-RELEVANT)

**AI in Akount is governed by strict constraints:**

| AI Capability          | Allowed |
| ---------------------- | ------- |
| Suggest categorization | ✅       |
| Surface insights       | ✅       |
| Explain reasoning      | ✅       |
| Auto-post entries      | ❌       |
| Approve filings        | ❌       |
| Modify locked data     | ❌       |

**Key Principle:**

> AI assists. Humans remain accountable.

**Evidence:**

* AI UX constraints
* Approval requirements
* AI confidence disclosures

---

## 8. INCIDENT RESPONSE

**Incident Handling:**

* Detection via monitoring
* Isolation of affected systems
* User notification when required
* Root-cause analysis
* Corrective actions documented

**No silent incidents.**

---

## 9. AUDIT READINESS STATEMENT

Akount is designed to be:

* Auditable by third parties
* Defensible during tax or regulatory review
* Transparent in system behavior
* Deterministic in financial outcomes

Every financial state, transition, and decision is:

* Logged
* Attributable
* Explainable

---

## 10. SOC 2 POSITIONING STATEMENT

> **Akount treats financial data as regulated infrastructure, not application data.**
>
> Security, integrity, and accountability are enforced at the product level — not delegated to user behavior.

---

## 11. CONCLUSION

Akount’s architecture, workflows, and UX collectively enforce SOC 2–aligned controls across:

* Security
* Availability
* Processing Integrity
* Confidentiality

This is achieved **by design**, not by policy alone.