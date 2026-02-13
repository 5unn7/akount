What you need is **not “Asset Management”** in the NetSuite sense.
You need an **Asset & Capitalization workspace** that exists for *accounting truth*, not operational inventory.

Below is the **right way to do it for Akount**.

---

# 🏗️ ASSETS & DEPRECIATION — DEDICATED WORKSPACE

## 🎯 Why a Separate Screen Is Necessary

Depreciation, capitalization, and disposals have **unique characteristics** that don’t belong in:

* Transactions
* Journals
* Reports

### Key reasons

1. **Assets live across time**
   Transactions are moments. Assets are timelines.

2. **Accountants expect an asset register**
   This is a non-negotiable professional artifact.

3. **Depreciation must be explainable**
   Auditors ask for schedules, not just journal entries.

4. **Corrections are common**
   Useful life, capitalization threshold, partial disposals.

5. **Lineage depends on a canonical asset object**
   Without this, depreciation becomes “magic journals”.

If you skip this screen, people will:

> export to Excel
> lose trust
> break audit continuity

---

## 🧠 Mental Model (Critical)

This screen is **not for daily use**.

It should feel like:

> “This is where long-term financial facts live.”

Not:

> “This is another operational dashboard.”

---

## 🧱 WHERE IT LIVES IN NAVIGATION

Sidebar placement:

```
Accounting
• Journal Entries
• Chart of Accounts
• Assets & Depreciation   ← HERE
• Tax Rates
• Fiscal Periods
```

Not under “Operations”.
Not under “Planning”.

Assets are accounting infrastructure.

---

## 🧩 ASSETS & DEPRECIATION — SCREEN DESIGN

### 1. Asset Register (Primary View)

A **table-first** screen.

```
Assets & Depreciation
────────────────────────

[ Filter: Entity | Status | Category ]

Asset           Entity     Cost      NBV       Status
──────────────────────────────────────────────────────
MacBook Pro     🇨🇦 Corp   $3,200    $2,711    Active
AWS Credits     🇺🇸 LLC   $1,800    $1,200    Active
Office Furniture🇮🇳 SP    ₹95,000   ₹82,000   Active
```

#### Columns (Non-negotiable)

* Asset name
* Entity
* Acquisition date
* Original cost
* Accumulated depreciation
* Net book value (NBV)
* Status (Active / Fully depreciated / Disposed)

---

### 2. Asset Detail View (Slide-over)

Click asset → right-side panel.

```
MacBook Pro
────────────────────────
Entity: 🇨🇦 Canadian Corp
Category: Computer Equipment
Acquired: Jan 10, 2026
Cost: $3,200 CAD
Useful Life: 36 months
Method: Straight-line
Residual Value: $0

Depreciation Summary
Accumulated: $489
NBV: $2,711

[ View Schedule ]  [ Dispose Asset ]
```

---

### 3. Depreciation Schedule (Mandatory)

Expandable table:

```
Month    Depreciation   Accumulated   NBV
──────────────────────────────────────────
Jan 26   $88.89         $88.89         $3,111
Feb 26   $88.89         $177.78        $3,022
...
```

Each row links to the **actual journal entry**.

This is audit gold.

---

### 4. Automatic Journal Posting (Visible, Controlled)

System generates depreciation journals:

* Monthly
* Per asset
* Per entity

Journal preview:

```
Dr Depreciation Expense
Cr Accumulated Depreciation
```

Posted automatically **only when period is open**.

If period locked → queued for next open period.

---

### 5. Capitalization Workflow (How Assets Are Created)

Assets can be created from:

1. Bill / Transaction
2. Manual asset creation
3. AI suggestion (“This looks like a capital asset”)

Capitalization wizard:

* Select expense
* Convert to asset
* Reverse original expense
* Create asset record
* Generate depreciation schedule

Preview impact before committing.

---

### 6. Asset Disposal & Impairment (Important)

Disposal flow:

```
Dispose Asset
Date:
Proceeds:
Reason:
```

System auto-calculates:

* Gain / loss
* Final journal entries

No manual math.

---

### 7. Controls & Guardrails

| Rule                                | Reason          |
| ----------------------------------- | --------------- |
| No delete after depreciation starts | Audit integrity |
| Useful life changes logged          | Transparency    |
| Entity cannot change                | Legal ownership |
| Disposal irreversible               | Accounting law  |

---

## 🧠 WHO USES THIS SCREEN

| Role       | Usage                |
| ---------- | -------------------- |
| Founder    | Rarely               |
| Accountant | Regularly            |
| Auditor    | During review        |
| AI         | Suggests, never acts |

This is fine.
Some screens exist **for correctness, not frequency**.

---

## 🧠 HOW IT TIES INTO EXISTING SYSTEMS

* **Journal Entry Editor** → source of postings
* **Reports** → shows depreciation expense & NBV
* **Data Lineage** → links asset → journals → reports
* **Corrections UX** → handles life changes properly
* **Filing Readiness** → checks asset completeness

Assets are not a silo.
They are a **pillar**.

---

* Keep it accounting-focused
* Table-first
* Schedule-visible
* Audit-grade
* No inventory features
* No operational clutter

Done this way, it:

* Increases trust
* Reduces Excel exports
* Makes Akount credible to professionals
* Doesn’t bloat the product

---
