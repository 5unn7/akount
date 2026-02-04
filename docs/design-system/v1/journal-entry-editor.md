This is the **moment of truth** for credibility.

If the Journal Entry Editor feels amateur, accountants won’t trust Akount.
If it feels right, Akount earns *professional legitimacy*.

We’re designing **double-entry accounting UX** for global, multi-entity reality.

---

# 🧮 JOURNAL ENTRY EDITOR — MASTER SYSTEM

## 🎯 Purpose

The Journal Entry Editor must:

* Enforce **double-entry integrity**
* Support **multi-entity + multi-currency**
* Be fast for power users
* Be safe for non-accountants
* Leave a perfect **audit trail**

This is not a form.
This is a **financial instrument**.

---

# 🧠 1. Mental Model

The editor should feel like:

> “I am recording a financial fact.”

Not:

> “I’m filling out a form.”

---

# 🧱 2. Entry Points

Journal entries are created from:

* Transactions table (manual adjustment)
* AI Advisor (“Apply deduction”)
* Invoices / Bills posting
* Transfers
* Opening balances
* Accruals / adjustments

The editor must adapt contextually.

---

# 🪟 3. Layout Structure

Two-level structure:

```
────────────────────────
Journal Entry
────────────────────────
[ Header Context ]
────────────────────────
[ Debit / Credit Grid ]
────────────────────────
[ Footer + Audit ]
```

No scrolling chaos. Everything visible.

---

# 📌 4. Header Context (Always Required)

### Fields

| Field        | Why                           |
| ------------ | ----------------------------- |
| Entity       | Legal ownership               |
| Posting Date | Accounting period             |
| Journal Type | Manual / Adjustment / Accrual |
| Currency     | Base currency                 |
| Reference    | Traceability                  |
| Description  | Human explanation             |

Entity is **locked** once entry lines exist.

---

# 🧾 5. Debit / Credit Grid (The Core)

This is sacred territory.

### Grid Columns

| Column       | Notes                 |
| ------------ | --------------------- |
| Account (GL) | Hierarchical picker   |
| Description  | Optional              |
| Debit        | Monospace             |
| Credit       | Monospace             |
| Currency     | If multi-currency     |
| FX Rate      | Editable with warning |

---

### Live Validation Rules

* Total Debits = Total Credits → **Required**
* Visual balance bar:

  * Green → balanced
  * Amber → off
* Prevent save unless balanced

Users should *feel* balance.

---

# 🌍 6. Multi-Currency Handling

If foreign currency involved:

```
USD Amount | FX Rate | CAD Amount
```

Original currency preserved.
FX rate timestamped.

Editing FX rate requires confirmation.

---

# 🧠 7. AI-Assisted Journal Entries

When AI triggers an entry:

```
🧠 Suggested Entry — Tax Deduction
Confidence: High

[Accept Entry] [Edit] [Decline]
```

AI pre-fills:

* Accounts
* Amounts
* Entity
* Description

User always has final control.

---

# 🔁 8. Linked Objects (Context Preservation)

Journal entries show links to:

* Bank transaction
* Invoice / Bill
* AI Insight
* Transfer pair

This creates an **audit web**, not isolated entries.

---

# 🧷 9. Line-Level Controls

* Add line (⌘ + Enter)
* Duplicate line
* Split line
* Remove line (with undo)

Keyboard-first design for accountants.

---

# 🔒 10. Posting & Locking Rules

Once posted:

* Entry becomes **read-only**
* Edits require reversal entry
* Fiscal period lock enforced

This protects integrity.

---

# 🧠 11. Audit Trail (Non-Negotiable)

Every entry includes:

```
Created by: User / AI
Created at: Timestamp
Source: Manual / AI / Invoice
Modified: Never (or via reversal)
```

Audit logs are always visible.

---

# ⚠️ 12. Guardrails & Warnings

Examples:

* Posting to wrong entity
* Using inactive GL account
* Backdating into closed period
* FX rate outside normal range

Warnings explain *why*, not just block.

---

# 🎨 13. Visual Design Rules

| Element           | Rule                         |
| ----------------- | ---------------------------- |
| Grid              | Structured, spreadsheet-like |
| Numbers           | Monospace, right-aligned     |
| Balance indicator | Prominent                    |
| Buttons           | Calm, deliberate             |

No playful UI here. This is accounting law.

---

# 🧠 14. Progressive Disclosure

Non-accountants see:

* Simple version (2–3 lines)
* “Advanced mode” toggle

Accountants see full power.

---

# ✨ The Emotional Outcome

After using this editor, users should feel:

> “This would pass an audit.”

That’s the gold standard.

---

## 🧩 Akount Core Systems Completed So Far

✔ Global Sidebar
✔ Top Command Bar
✔ Entity Switching
✔ Transaction Table
✔ AI Advisor
✔ Journal Entry Editor


