Perfect. Below is a **Figma-ready sitemap page specification** that a designer can implement **exactly as-is** without interpretation.

This is not just a list — it’s a **layout system**, naming convention, and governance model for your Figma file.

---

# 🎨 FIGMA SITEMAP PAGE — AKOUNT

## 🎯 Purpose of This Page

The Sitemap page exists to:

* Lock information architecture
* Prevent feature drift
* Align design, product, and engineering
* Serve as onboarding for new team members
* Act as a reference during audits & reviews

**This page is read-only once approved.**

---

# 🧱 FIGMA PAGE SETUP

### Page Name

```
🗺️ Sitemap — Akount App
```

### Canvas Rules

* Left → right reading flow
* One vertical column per **Sidebar Domain**
* No screen mockups here
* No colors except neutral greys
* This page documents structure, not UI

---

# 📐 GRID & FRAME SYSTEM

### Column Layout

* 8 columns total (one per sidebar domain)
* Each column = one **top-level domain**
* Fixed width per column (e.g. 280–320px)
* 64px horizontal spacing between domains

### Frame Stack (inside each column)

```
Domain (Frame)
 ├─ Section Header
 ├─ Primary Screens
 ├─ Nested Screens
 ├─ Tabs / Subviews (indented)
```

Use **Auto Layout (vertical)** everywhere.

---

# 🧭 DOMAIN FRAME TEMPLATE (REUSABLE)

### Frame Name Pattern

```
Domain / {Domain Name}
```

Example:

```
Domain / Money Movement
```

---

### Section Header Component

**Text Style:** Heading / H3
**Format:**

```
🔄 Money Movement
Purpose: What actually moved money
```

Use emoji only on sitemap (not UI).

---

# 🏠 DOMAIN 1 — OVERVIEW

### Frame Name

```
Domain / Overview
```

#### Screens

* Dashboard (Founder)
* Dashboard (Accountant)
* Net Worth
* Cash Overview

No tabs listed here — dashboards are composed views.

---

# 🔄 DOMAIN 2 — MONEY MOVEMENT

### Frame Name

```
Domain / Money Movement
```

#### Screens & Tabs

**Accounts**

* Tabs:

  * All
  * Active
  * Disconnected
  * Archived

**Transactions**

* Tabs:

  * All
  * Uncategorized
  * Categorized
  * Reconciled
  * Exceptions
* Subviews:

  * Transaction Detail
  * Lineage
  * Correction Flow

**Reconciliation**

* Tabs:

  * In Progress
  * Reconciled
  * Exceptions
  * History
* Subviews:

  * Match Workspace
  * FX Differences
  * Transfers

**Transfers**

* Inter-account
* Inter-currency

---

# 💼 DOMAIN 3 — BUSINESS OPERATIONS

### Frame Name

```
Domain / Business Operations
```

#### Clients

* Client List
* Client Detail

  * Profile
  * Invoices
  * Payments
  * Notes
  * Documents

#### Vendors

* Vendor List
* Vendor Detail

  * Profile
  * Bills
  * Payments
  * Notes
  * Documents

#### Invoices (AR)

* Tabs:

  * All
  * Draft
  * Sent
  * Paid
  * Overdue
  * Credit Notes
* Subviews:

  * Invoice Editor
  * Invoice Detail
  * Payment Allocation

#### Bills (AP)

* Tabs:

  * All
  * Draft
  * Received
  * Approved
  * Paid
  * Vendor Credits
* Subviews:

  * Bill Entry
  * Approval Flow
  * Payment Allocation

#### Payments

* Tabs:

  * Incoming
  * Outgoing
  * Unapplied
  * FX Differences

---

# 🧮 DOMAIN 4 — ACCOUNTING

### Frame Name

```
Domain / Accounting
```

#### Journal Entries

* Tabs:

  * All
  * Draft
  * Posted
  * Adjustments
  * Reversals
* Subviews:

  * Journal Editor
  * Journal Detail
  * Lineage

#### Chart of Accounts

* Tabs:

  * Active
  * Archived
  * System Accounts
* Subviews:

  * Account Detail
  * Tax Mapping

#### Assets & Depreciation

* Tabs:

  * Asset Register
  * Depreciation Schedule
  * Disposals
* Subviews:

  * Asset Detail
  * Capitalization Wizard
  * Disposal Workflow

#### Tax Rates

* Tax Types
* Jurisdiction Mapping
* Effective Dates

#### Fiscal Periods

* Period List
* Lock / Unlock
* Status

---

# 📊 DOMAIN 5 — PLANNING & ANALYTICS

### Frame Name

```
Domain / Planning & Analytics
```

#### Reports

* Tabs:

  * Standard
  * Management
  * Custom
  * Scheduled
* Subviews:

  * Report Builder
  * Lineage
  * Export & Share

Standard Reports:

* P&L
* Balance Sheet
* Cash Flow
* AR Aging
* AP Aging

#### Budgets

* Budget List
* Budget Detail
* Variance

#### Forecasts

* Cash Forecast
* Scenarios

#### Goals

* Savings
* Debt
* Milestones

---

# 🧠 DOMAIN 6 — AI ADVISOR

### Frame Name

```
Domain / AI Advisor
```

#### Insight Feed

* Tabs:

  * Attention Required
  * Optimization
  * Observations
  * History

#### Policy Alerts

* Jurisdiction Updates
* Impact Analysis

#### AI History

* Suggestions
* Confidence
* Accepted / Ignored

---

# 🤝 DOMAIN 7 — SERVICES

### Frame Name

```
Domain / Services
```

* Accountant Collaboration

  * Invitations
  * Permissions
* Bookkeeping Services

  * Requests
  * Status
* Document Requests

  * Uploads
  * Completion

---

# ⚙️ DOMAIN 8 — SYSTEM

### Frame Name

```
Domain / System
```

#### Entities

* Entity List
* Entity Detail

  * Legal Info
  * Jurisdiction
  * Tax Settings

#### Integrations

* Bank Connections
* Payment Platforms
* Imports / Exports

#### Rules & Automation

* Tabs:

  * Active
  * Draft
  * Simulations
  * History

#### Users & Permissions

* Users
* Roles
* Entity Access
* Time-bound Access

#### Audit Logs

* Filters:

  * User
  * Entity
  * Period
  * Action Type

#### Security & Compliance

* Account Security
* Sessions
* Data Controls
* Compliance Status

#### Filing Readiness

* State Overview
* Entity × Period
* Blockers
* Approvals
* Filing Metadata

#### Data Management

* Lineage Exports
* Migration Tools
* Retention

---

# 🌐 GLOBAL (SEPARATE FRAME, RIGHT SIDE)

### Frame Name

```
Global / Always Available
```

* Entity Switcher
* Period Selector
* Currency View
* Global Search
* Command Palette
* Notifications
* AI Side Panel

---

# 🔒 GOVERNANCE NOTES (BOTTOM OF PAGE)

Add a text block:

> **Sitemap Governance Rules**
>
> • Sidebar = domain of responsibility
> • Tabs = views of same data
> • No screen appears in more than one domain
> • Global controls never appear as tabs
> • Any new screen must fit exactly one domain

This prevents future drift.

---