This is a **regulatory-grade Product Requirements Document (PRD)** suitable for:

* SOC 2 / ISO-aligned reviews
* Accountant & auditor validation
* Enterprise customer due diligence
* Investor technical diligence

This is written at the level where **engineering, compliance, and product are aligned**.

---

# 📘 AKOUNT — REGULATORY-GRADE PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Product:** Akount
**Category:** Global Financial Operating System for Solopreneurs
**Audience:** Founders, Accountants, Auditors, Regulators, Investors
**Document Version:** v1.0
**Status:** Implementation-ready

---

## 1. EXECUTIVE SUMMARY

Akount is an **AI-powered financial command center** designed for globally-operating solopreneurs managing **multiple legal entities, currencies, and jurisdictions**.

Unlike traditional bookkeeping tools, Akount is built as a **system of record** that enforces:

* Double-entry accounting integrity
* Jurisdiction-aware compliance
* Deterministic filing readiness
* Audit-grade traceability
* Role-based professional collaboration

Akount does **not** replace accountants or tax authorities.
It provides a **controlled, explainable, and verifiable financial environment** that professionals trust.

---

## 2. PROBLEM STATEMENT

Globally-operating solopreneurs face a unique gap:

| Existing Tools       | Limitation               |
| -------------------- | ------------------------ |
| Consumer bookkeeping | Too loose, non-compliant |
| Enterprise ERPs      | Too heavy, expensive     |
| Spreadsheets         | Error-prone, unauditable |
| AI tools             | Opaque, unaccountable    |

**Key risks today:**

* Cross-entity contamination
* FX misstatements
* Incomplete reconciliation
* AI decisions without accountability
* Filing errors due to unclear readiness

Akount exists to **systematically eliminate these risks**.

---

## 3. PRODUCT PRINCIPLES (NON-NEGOTIABLE)

1. **Accounting Truth Over Convenience**
2. **Explicit State Over Implicit Assumptions**
3. **AI Assists, Humans Approve**
4. **Every Action Is Auditable**
5. **Jurisdiction Context Is Always Visible**

No feature may violate these principles.

---

## 4. TARGET USERS & ROLES

### 4.1 Primary Users

* Global solopreneurs
* Founders operating across jurisdictions

### 4.2 Professional Users

* Accountants
* Bookkeepers
* Tax preparers

### 4.3 System Roles

* AI Advisor (non-authoritative)
* External auditors (read-only)

---

## 5. SYSTEM ARCHITECTURE OVERVIEW

### 5.1 Core Financial Backbone

* Entity
* GLAccount
* JournalEntry
* JournalLine
* FiscalPeriod
* Currency
* FxRate

All financial data is **double-entry enforced**.

---

### 5.2 Immutability Rules

| Object                 | Editable? |
| ---------------------- | --------- |
| Posted Journal Entry   | ❌         |
| Reconciled Transaction | ❌         |
| Locked Period          | ❌         |
| Audit Logs             | ❌         |

Corrections occur via **reversal entries only**.

---

## 6. FUNCTIONAL REQUIREMENTS

---

### 6.1 Dashboard (Founder View)

**Purpose:** Financial orientation

**Requirements:**

* Multi-entity, multi-currency awareness
* Cash, net worth, income, expense KPIs
* Account balances with sync health
* AI attention surfacing (non-intrusive)

**Constraints:**

* Read-only
* No destructive actions
* Explicit context labeling

---

### 6.2 Accountant Dashboard (v2)

**Purpose:** Financial readiness & integrity validation

**Requirements:**

* Reconciliation status by account
* Integrity checks (balanced books, FX, intercompany)
* Period locking status
* Exception queue

**Constraints:**

* No bank connection access
* No rule creation
* No AI optimization controls

---

### 6.3 Transactions & Bookkeeping

**Requirements:**

* Multi-entity transaction attribution
* Original currency preservation
* AI-assisted categorization (reviewable)
* Bulk actions with audit logging
* Inline drill-down to journal entries

---

### 6.4 Journal Entry Editor

**Requirements:**

* Balanced debit/credit enforcement
* Entity locking once lines exist
* FX traceability
* Source linkage (invoice, bank, AI)
* Full audit metadata

**Constraints:**

* No save unless balanced
* No edits after posting
* Reversals required for corrections

---

### 6.5 Bank Reconciliation

**Requirements:**

* Bank feed vs book transaction matching
* One-to-many and many-to-one matching
* Transfer detection
* FX difference handling
* Match confidence explanation

**Constraints:**

* No silent auto-matching
* Manual confirmation required
* Reconciliation state logged immutably

---

### 6.6 AI Advisor System

**Requirements:**

* Contextual insights only
* Entity & jurisdiction specificity
* Confidence scoring
* Explainable reasoning
* Explicit user action required

**Explicit Prohibitions:**

* No autonomous posting
* No autonomous approvals
* No silent rule creation

---

### 6.7 Rules & Automation Engine

**Requirements:**

* User-authored rules take priority
* Rule simulation before activation
* Retroactive application requires confirmation
* Rule audit logs
* Undo via reversal logic

---

### 6.8 Reports & Financial Statements

**Requirements:**

* P&L, Balance Sheet, Cash Flow
* Consolidated & entity views
* Drill-down to source transactions
* Period awareness (locked vs open)
* Jurisdiction indicators (GAAP / IFRS)

---

## 7. FILING-READINESS STATE MACHINE (REGULATORY CORE)

Each **Entity × Period × Jurisdiction** follows:

```
RAW → IN PROGRESS → REVIEW READY → APPROVED → FILED → LOCKED
```

### 7.1 State Transition Rules

| Transition                 | Authority              |
| -------------------------- | ---------------------- |
| RAW → IN PROGRESS          | System                 |
| IN PROGRESS → REVIEW READY | System (checks passed) |
| REVIEW READY → APPROVED    | Accountant             |
| APPROVED → FILED           | Accountant / Owner     |
| FILED → LOCKED             | Owner / System         |

### 7.2 Deterministic Readiness Checks

* Uncategorized transactions = 0
* All accounts reconciled
* Debits = credits
* FX differences resolved
* Intercompany balances net to zero

Failures block progression with explicit reasons.

---

## 8. PERMISSIONS & COLLABORATION

### 8.1 Permission Axes

* Workspace
* Entity
* Feature

### 8.2 Accountant Defaults

* Can post journals
* Can review reconciliation
* Cannot delete data
* Cannot connect banks

All permission changes are logged.

---

## 9. SECURITY & COMPLIANCE UX

### 9.1 Mandatory Controls

* 2FA
* Session tracking
* Period locking
* Immutable audit logs

### 9.2 Audit Logs

* Human-readable
* Filterable
* Non-deletable

### 9.3 AI Transparency

* Data source disclosure
* Confidence level display
* Jurisdiction tagging

---

## 10. NON-FUNCTIONAL REQUIREMENTS

### 10.1 Performance

* Virtualized tables
* Cursor-based pagination
* Async bank syncing

### 10.2 Reliability

* No silent failures
* Explicit error states
* Idempotent financial operations

---

## 11. OUT-OF-SCOPE (EXPLICIT)

Akount does **not**:

* File taxes on behalf of users
* Replace licensed professionals
* Provide legal advice
* Auto-correct financial records

---

## 12. SUCCESS CRITERIA (AUDIT-LEVEL)

Akount is successful if:

* Accountants accept it as system of record
* No financial state is ambiguous
* Every number is traceable
* Every decision is explainable
* Every filing is defensible

---

## 13. POSITIONING STATEMENT (INTERNAL)

> **Akount is not bookkeeping software.
> It is financial infrastructure for global founders.**

---

## FINAL NOTE

This PRD defines **behavioral guarantees**, not just features.

Any implementation that violates:

* determinism
* traceability
* role accountability

is **non-compliant with Akount’s product contract**.
