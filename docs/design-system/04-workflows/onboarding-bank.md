This is the **trust engine** of Akount.

If reconciliation feels confusing, users doubt the numbers.
If it feels controlled and inevitable, users *trust the system*.

We’re designing a **bank-grade reconciliation experience** for global, multi-entity finance.

---

# 🔁 RECONCILIATION MATCHING UX — MASTER SYSTEM

## 🎯 Purpose

Reconciliation UX must:

* Prove that **bank = books**
* Handle **noise, delays, FX, transfers**
* Support **automation without blind trust**
* Leave a clean **audit trail**

This is not a checklist.
It’s **financial proof**.

---

# 🧠 1. Mental Model

Reconciliation is a **matching exercise**, not categorization.

Users should feel:

> “Every real-world transaction has been accounted for.”

---

# 🧱 2. Entry Point

From sidebar:

**Money Movement → Reconciliation**

Context inherited from:

* Entity scope
* Date range
* Account

---

# 🪟 3. Reconciliation Workspace Layout

Split-pane layout. No scrolling chaos.

```
────────────────────────────────────
Bank Feed (Source of Truth)
────────────────────────────────────
| LEFT: Bank Transactions | RIGHT: Book Transactions |
────────────────────────────────────
| Match Preview / Details Panel     |
────────────────────────────────────
```

This reinforces **two realities being aligned**.

---

# 🧾 4. Left Pane: Bank Feed Transactions

### Row Contents

| Element     | Why                 |
| ----------- | ------------------- |
| Date        | Bank posted date    |
| Description | Bank narrative      |
| Amount      | Monospace           |
| Balance     | Running balance     |
| Status      | Matched / Unmatched |

Unmatched rows are visually prominent.

---

# 📘 5. Right Pane: Book Transactions

Filtered automatically to:

* Same amount (± tolerance)
* Similar date
* Same entity
* Same currency (or FX-linked)

Each row shows:

* Source (Invoice, Manual, AI)
* GL category
* Entity
* Status

---

# 🧠 6. Match Confidence System

For each potential match:

```
Confidence: 92%
Reason:
✔ Amount match
✔ Date proximity
✔ Same entity
✔ Description similarity
```

This is huge for trust.

---

# 🧩 7. Match Actions (Explicit)

| Action             | Result                              |
| ------------------ | ----------------------------------- |
| Auto-match         | System matches with high confidence |
| Drag & drop        | Manual match                        |
| One-to-many        | Split bank transaction              |
| Many-to-one        | Consolidated payment                |
| Create transaction | New book entry                      |
| Ignore             | Mark as non-business                |

No magic. Always explicit.

---

# 🔁 8. Transfers & Inter-Account Moves

Special handling:

* Detect mirrored amounts
* Show connector arrow
* Mark as **Internal Transfer**
* No P&L impact

This prevents false income/expense.

---

# 🌍 9. Multi-Currency Reconciliation

If FX involved:

```
Bank: €1,000
Book: $1,080
FX diff: $12
```

Option to:

* Post FX gain/loss entry
* Attach FX rate source

This is **enterprise-grade** behavior.

---

# ⚠️ 10. Exceptions & Edge Cases

Handled explicitly:

| Case              | UX                     |
| ----------------- | ---------------------- |
| Timing difference | “Pending”              |
| Bank fee          | Auto-suggest fee entry |
| Rounding error    | Tolerance slider       |
| Duplicate         | Flag                   |
| Reversal          | Paired view            |

No silent assumptions.

---

# 🧠 11. AI Assistance (Subtle, Smart)

AI can suggest:

* Matches
* Split logic
* Fee categorization

But always framed as:

> “Suggested by Akount”

User must confirm.

---

# 🔒 12. Completion & Locking

Once reconciled:

* Transaction locked
* Reconciliation date stamped
* Audit trail updated

No silent edits later.

---

# 🧾 13. Reconciliation Summary Bar

Always visible at top:

```
Account: RBC CAD
Period: Jan 2026
Bank Balance: $12,430
Book Balance: $12,430 ✓
```

This is the emotional “done” moment.

---

# 🎨 14. Visual Design Rules

| Element         | Rule             |
| --------------- | ---------------- |
| Split pane      | Clear divider    |
| Unmatched items | High contrast    |
| Matched         | Subdued          |
| Confidence      | Visible but calm |

Finance should feel **inevitable**, not chaotic.

---

# 🧠 15. Audit Trail (Non-Optional)

Every match records:

* Who matched
* When
* Method (AI / Manual)
* Confidence score

Auditors love this.

---

# ✨ Emotional Outcome

After reconciliation, user feels:

> “My books reflect reality.”

That’s the deepest trust signal in finance software.

---
