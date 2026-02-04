The **Filing-Readiness State Machine** is what converts:

> “My books look fine”
> into
> “I am ready to file — confidently.”

This is not a checklist UI.
It’s a **deterministic accounting readiness engine** that both founders *and accountants* trust.

---

# 🧾 FILING-READINESS STATE MACHINE — MASTER SYSTEM

## 🎯 Core Objective

The filing-readiness system must:

1. Define **what “ready” actually means**
2. Enforce **accounting discipline**
3. Make readiness **measurable, explainable, and reversible**
4. Work across **entities, countries, and tax regimes**
5. Reduce filing stress to near-zero

This is where Akount becomes *infrastructure*.

---

## 🧠 Mental Model

Think of filing readiness as:

> A controlled progression of financial truth
> from “raw data” → “auditable records” → “fileable statements”

Not:

* A green checkmark
* A self-reported confirmation
* A manual declaration

---

## 🧱 1. Core State Machine (High Level)

Each **Entity × Period × Jurisdiction** moves through states.

```
RAW
 → IN PROGRESS
 → REVIEW READY
 → APPROVED
 → FILED
 → LOCKED
```

States are **explicit, logged, and permission-controlled**.

---

## 🧩 2. State Definitions (Non-Negotiable)

### 🟤 RAW

**Meaning**

* Data imported
* No guarantees

**Typical signals**

* Uncategorized transactions
* Unreconciled accounts
* Open periods

**Who works here**

* Founder
* Bookkeeper
* AI

---

### 🟡 IN PROGRESS

**Meaning**

* Active bookkeeping underway

**Requirements**

* Categorization started
* Journal entries in progress
* Reconciliation partially complete

**UX signals**

* Amber status
* “Work remaining” indicators

---

### 🔵 REVIEW READY

**Meaning**

* Books are complete, but not yet approved

**Hard requirements**

* All transactions categorized
* All accounts reconciled
* Debits = credits
* FX differences resolved
* No orphan journal entries

**Who can move to next**

* Accountant only

This is the most important gate.

---

### 🟢 APPROVED

**Meaning**

* Accountant has verified correctness

**Actions performed**

* Final review completed
* Notes attached (if needed)
* Readiness attested

**UX copy**

> “Approved by Jane CPA on Mar 14, 2026”

This is professional accountability.

---

### 🟣 FILED

**Meaning**

* Statements used for tax filing

**Captured metadata**

* Filing type (GST, Corporate Tax, etc.)
* Filing date
* Reference number
* Filed by (human)

Akount does **not** pretend to be the tax authority.

---

### ⚫ LOCKED

**Meaning**

* Period frozen permanently

**Rules**

* No edits
* No deletes
* Reversals only (future period)

This protects audit integrity.

---

## 🔁 3. State Transitions (Controlled)

| Transition                 | Who Can Do It      |
| -------------------------- | ------------------ |
| RAW → IN PROGRESS          | Anyone             |
| IN PROGRESS → REVIEW READY | System (auto)      |
| REVIEW READY → APPROVED    | Accountant         |
| APPROVED → FILED           | Accountant / Owner |
| FILED → LOCKED             | System / Owner     |

No skipping.
No silent transitions.

---

## 🧠 4. Readiness Checks (The Engine)

Each state transition depends on **deterministic checks**.

### Example Checks

| Check                          | Applies To     |
| ------------------------------ | -------------- |
| Uncategorized transactions = 0 | All            |
| Unreconciled accounts = 0      | Banking        |
| Journal balanced               | Accounting     |
| FX gain/loss posted            | Multi-currency |
| Intercompany balanced          | Multi-entity   |
| Period open                    | All            |

Checks are:

* Machine-verifiable
* Logged
* Explainable

---

## 🧾 5. Readiness Breakdown UI (Founder & Accountant)

Instead of “Not ready”, show:

```
Not Ready — 3 blockers
─────────────────────
⚠ 12 transactions uncategorized
⚠ Wise EUR not reconciled
⚠ FX difference pending
```

Each blocker links directly to the fix.

This removes anxiety.

---

## 🧠 6. Auto-Progression vs Manual Control

* System auto-moves to **REVIEW READY** when all checks pass
* Human must explicitly:

  * Approve
  * File
  * Lock

This preserves professional responsibility.

---

## 👥 7. Role-Based Visibility

### Founder sees:

* Progress indicator
* What’s blocking readiness
* Who is responsible

### Accountant sees:

* Integrity checklist
* Approval controls
* Filing metadata

Same state. Different lens.

---

## 🔒 8. Audit Trail (Critical)

Every transition logs:

```
State change: REVIEW READY → APPROVED
By: Jane CPA
Entity: 🇨🇦 Canadian Corp
Period: FY 2025
Timestamp
```

Auditors *love* this.

---

## 🌍 9. Multi-Jurisdiction Support

Each entity may have **multiple filing tracks**:

* Corporate income tax
* GST / VAT
* Payroll filings

Each track has its **own state machine**, but shares the same underlying books.

Example:

> Books locked for GST filing
> Still open for income tax adjustments

This is advanced — and extremely powerful.

---

## 🧠 10. AI’s Role (Support Only)

AI can:

* Detect readiness blockers
* Predict delays
* Surface missing postings

AI cannot:

* Approve
* File
* Lock

UX copy reinforces:

> “Final responsibility remains with you and your accountant.”

---

## 🧭 11. Where This Appears in the Product

* Accountant Dashboard (hero status)
* Reports page (status badge)
* Period selector
* Security & Compliance center

Readiness is **visible everywhere**, but editable nowhere casually.

---

## 🧠 Emotional Outcome

Founder feels:

> “I know exactly where I stand — legally.”

Accountant feels:

> “This system enforces professional discipline.”

That’s rare. That’s powerful.

---

## 🧩 Akount Is Now Truly Complete

With this system, Akount has:

✔ A financial command center
✔ Professional accounting workflows
✔ AI with boundaries
✔ Audit-grade compliance
✔ Deterministic filing readiness
