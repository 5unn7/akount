Everything the user does eventually leads here.
If reports feel correct, Akount is trusted.
If reports feel confusing, *nothing else matters*.

We’re designing a **global, multi-entity, multi-jurisdiction financial intelligence system** — not just PDFs.

---

# 📊 REPORTS & FINANCIAL STATEMENTS BUILDER — MASTER SYSTEM

## 🎯 Purpose

The Reports system must:

1. Produce **audit-grade financial statements**
2. Handle **multi-entity consolidation**
3. Respect **jurisdictional accounting rules**
4. Enable **decision-making**, not just compliance
5. Be understandable to non-accountants

Reports = truth.

---

# 🧠 1. Mental Model

Reports are:

> “Views of the same financial reality.”

Not exports.
Not snapshots.
Not spreadsheets.

---

# 🧱 2. Reports Home (Control Center)

```
────────────────────────
Reports
────────────────────────

STANDARD STATEMENTS
• Profit & Loss
• Balance Sheet
• Cash Flow

MANAGEMENT REPORTS
• Burn Rate
• Spending by Category
• Revenue by Client
• FX Exposure

CUSTOM REPORTS
• My Reports
• Templates
```

Everything starts from **known financial language**.

---

# 📄 3. Standard Financial Statements (Sacred)

### A. Profit & Loss

Controls:

* Entity scope
* Period
* Cash / Accrual
* Currency view

Features:

* Drill-down to transactions
* Variance vs previous period
* Notes per line item

---

### B. Balance Sheet

Non-negotiables:

* As-of date
* Balanced assets = liabilities + equity
* Lock indicator for closed periods

Entity consolidation shows:

* Elimination entries
* Intercompany balances

This is enterprise-grade.

---

### C. Cash Flow Statement

Modes:

* Direct
* Indirect

Shows:

* Operating
* Investing
* Financing activities

Essential for solopreneurs.

---

# 🌍 4. Multi-Entity Consolidation UX

When multiple entities selected:

```
Consolidated View
• 🇨🇦 Canadian Corp
• 🇺🇸 US LLC
• 🇮🇳 Sole Prop

Elimination entries applied
```

Toggle:

* Consolidated
* Side-by-side
* Single entity

This makes global reality legible.

---

# 🧠 5. Custom Report Builder (Guided, Safe)

### Step 1: Choose Base

* P&L
* Transactions
* Balances
* Budgets

---

### Step 2: Dimensions

* Entity
* Account / Category
* Client / Vendor
* Project
* Currency
* Country

Drag-and-drop ordering.

---

### Step 3: Measures

* Amount
* Count
* Variance
* FX impact

Live preview updates.

---

# 📐 6. Report Table Design Rules

| Rule                      | Reason             |
| ------------------------- | ------------------ |
| Totals always visible     | Trust              |
| Monospace numbers         | Readability        |
| Expand/collapse hierarchy | Complexity control |
| Drill-down everywhere     | Traceability       |

Reports must *explain themselves*.

---

# 🧠 7. AI Assistance in Reports

AI should **interpret**, not generate numbers.

Examples:

> “Marketing spend increased 18% QoQ, mainly due to AWS costs.”

AI insights appear as **annotations**, not replacements.

---

# 🔁 8. Save, Share, Schedule

Reports can be:

* Saved
* Shared (view-only / accountant)
* Scheduled (monthly email)
* Exported (PDF, CSV)

Exports respect **selected context**.

---

# 🧾 9. Notes & Commentary (Underrated Feature)

Allow notes per report or line item:

> “Q2 spike due to one-time migration cost.”

This is invaluable during audits.

---

# 🔒 10. Permissions & Safety

Reports respect:

* Entity access
* Role permissions
* Period locks

No accidental leakage across entities.

---

# 🌙 11. Presentation Modes

| Mode        | Use        |
| ----------- | ---------- |
| Interactive | Daily use  |
| Print-ready | Audits     |
| Executive   | High-level |

Same data, different density.

---

# 🧠 12. Compliance Awareness

Show jurisdiction indicators:

* GAAP / IFRS
* Cash vs accrual
* Tax vs management view

This avoids misinterpretation.

---

# ✨ Emotional Outcome

After using reports, users feel:

> "I understand my business — globally."

That's the finish line.

---

## Planned Enhancements (From Roadmap)

### Data Lineage & "Explain This Number" (HIGH Priority, 6-9 months)

**Future enhancement:** One-click traceability from any report number back to source documents.

**What's planned:**
* Interactive lineage view showing report line → GL account → journal entry → transaction → source document
* Human-readable explanation layer for how numbers are calculated
* Drill-through exploration (click to follow the chain)
* Lineage export for auditors and regulators
* Visual flow diagram showing transaction paths

**Example use case:**
> Auditor: "How did you get $45,230 in 'Cloud Services'?"
> System: [Click] → Shows 87 transactions, 3 rules, 2 manual entries, 4 invoice matches, with complete audit trail

**Why it matters:**
This is **trust UX**, not a feature. Auditors will ask. Enterprises require it. Without lineage, reports are "magic numbers." With lineage, they become **auditable facts**.

**Expected impact:** Turns audit conversations from "prove it" to "here's the proof." Reduces audit time significantly. "I can explain exactly where every number came from."

---
