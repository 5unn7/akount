# Information Architecture

> **Consolidates:** `akount-sitemapv1.md` + `figma-sitemap.md`
>
> **Last Updated:** 2026-02-04

## Purpose

The Information Architecture (IA) document serves as:

- **Single source of truth** for application structure
- **Reference for designers and engineers** to stay aligned
- **Onboarding guide** for new team members
- **Audit-ready documentation** for compliance
- **Protection against feature drift** and scope creep

This is a **canonical IA document** that:

- Designers can't "freestyle"
- Engineers can route against
- Auditors can understand
- New hires can learn from

**No fluff. No duplicates. No ambiguity.**

---

## Application Sitemap

### Overview

**Purpose:** Financial orientation & situational awareness
**Read-only by default**

#### Dashboard (Founder)

- Financial Snapshot (KPIs: cash, net worth, income, expenses)
- Accounts Overview (grouped by entity/currency)
- Cash Flow Snapshot (inflow vs outflow)
- AI Attention (prioritized insights)
- Shortcuts (quick actions)

#### Dashboard (Accountant View)

- Financial Integrity Status (verification checks)
- Reconciliation Summary (status by account)
- Exceptions (problems requiring attention)
- Period Lock Status (posting timeline)
- Open Tasks (collaboration queue)

#### Net Worth

- Consolidated view
- By Entity
- By Currency

#### Cash Overview

- Liquidity view
- Upcoming obligations
- Runway (if enabled)

---

### Banking

**Purpose:** What actually moved money (bank truth)

#### Accounts

- Bank Accounts
- Credit Cards
- Loans
- Assets (financial only, not capital assets)
- Sync Health

**Tabs:**

- All
- Active
- Disconnected
- Archived

#### Transactions

**Tabs:**

- All
- Uncategorized
- Categorized
- Reconciled
- Exceptions

**Sub-views:**

- Transaction Detail
- Lineage View
- Correction Flow

#### Reconciliation

**Tabs:**

- In Progress
- Reconciled
- Exceptions
- History

**Sub-views:**

- Match Workspace
- Manual Match
- FX Differences
- Transfer Detection

#### Transfers

- Inter-account transfers
- Inter-currency transfers
- Transfer reconciliation

---

### Business Operations

**Purpose:** Real-world economic activity (AR / AP)

#### Clients

- Client List
- Client Detail
  - Profile
  - Invoices
  - Payments
  - Notes
  - Documents

#### Vendors

- Vendor List
- Vendor Detail
  - Profile
  - Bills
  - Payments
  - Notes
  - Documents

#### Invoices (Accounts Receivable)

**Tabs:**

- All
- Draft
- Sent
- Paid
- Overdue
- Credit Notes

**Sub-views:**

- Invoice Editor
- Invoice Detail
- Payment Allocation
- Credit Note Flow

#### Bills (Accounts Payable)

**Tabs:**

- All
- Draft
- Received
- Approved
- Paid
- Vendor Credits

**Sub-views:**

- Bill Entry
- Bill Detail
- Approval Flow
- Payment Allocation

#### Payments

**Tabs:**

- Incoming
- Outgoing
- Unapplied
- FX Differences

---

### Accounting

**Purpose:** Financial truth, compliance & audit

#### Journal Entries

**Tabs:**

- All
- Draft
- Posted
- Adjustments
- Reversals

**Sub-views:**

- Journal Editor
- Journal Detail
- Lineage View

#### Chart of Accounts

**Tabs:**

- Active
- Archived
- System Accounts

**Sub-views:**

- Account Detail
- Mapping (Tax / Reporting)

#### Assets & Depreciation

**Tabs:**

- Asset Register
- Depreciation Schedule
- Disposals

**Sub-views:**

- Asset Detail
- Capitalization Wizard
- Disposal Workflow

#### Tax Rates

- Tax Types (GST, VAT, Sales Tax)
- Jurisdiction Mapping
- Effective Dates

#### Fiscal Periods

- Period List
- Lock / Unlock
- Status (Open / Review / Locked)

---

### Planning & Analytics

**Purpose:** Interpretation, forecasting & decision-making

#### Reports

**Tabs:**

- Standard
- Management
- Custom
- Scheduled

**Standard Reports:**

- P&L
- Balance Sheet
- Cash Flow
- AR Aging
- AP Aging

**Sub-views:**

- Report Builder
- Report Lineage
- Export & Share

#### Budgets

- Budget List
- Budget Detail
- Variance Analysis

#### Forecasts

- Cash Forecast
- Scenario Comparison

#### Goals

- Savings Goals
- Debt Paydown
- Milestones

---

### Insights

**Purpose:** Intelligence, not authority

#### Insight Feed

**Tabs:**

- Attention Required
- Optimization
- Observations
- History

#### Policy & Regulation Alerts

- Jurisdiction-specific updates
- Impact explanations

#### AI History

- All suggestions
- Confidence levels
- Accepted / Ignored

---

### Services

**Purpose:** Human collaboration

#### Accountant Collaboration

- Active Accountants
- Invitations
- Permissions

#### Bookkeeping Services

- Request Help
- Status
- History

#### Document Requests

- Requests from Accountant
- Uploads
- Completion Status

---

### System

**Purpose:** Governance, configuration & trust

#### Entities

- Entity List
- Entity Detail
  - Legal Info
  - Jurisdiction
  - Currency
  - Tax Settings

#### Integrations

- Bank Connections
- Payment Platforms
- Accounting Imports
- Data Exports

#### Rules & Automation

**Tabs:**

- Active Rules
- Draft Rules
- Simulations
- History

#### Users & Permissions

- Users
- Roles
- Entity Access
- Time-bound Access

#### Audit Logs

- System Events
- Financial Events
- Security Events

**Filters:**

- User
- Entity
- Period
- Action Type

#### Security & Compliance

- Account Security
- Sessions & Devices
- Data Controls
- Compliance Status

#### Filing Readiness

- State Machine Overview
- Entity × Period Status
- Blockers
- Approvals
- Filing Metadata

#### Data Management

- Data Lineage Exports
- Migration Tools
- Retention Settings

---

### Global (Not Sidebar Items)

These exist **outside navigation**, always accessible via top command bar and global controls:

- Entity Switcher
- Period Selector
- Currency View
- Global Search
- Command Palette
- Notifications
- AI Side Panel

---

## Figma Organization

### Purpose

The Figma Sitemap page locks the information architecture in design tool, preventing feature drift and maintaining alignment between design, product, and engineering.

**This page is read-only once approved.**

### Canvas Rules

- Left → right reading flow
- One vertical column per **Sidebar Domain**
- No screen mockups here
- No colors except neutral greys
- This page documents structure, not UI

### Grid & Frame System

#### Column Layout

- 8 columns total (one per sidebar domain)
- Each column = one **top-level domain**
- Fixed width per column (280–320px)
- 64px horizontal spacing between domains

#### Frame Stack (inside each column)

```
Domain (Frame)
 ├─ Section Header
 ├─ Primary Screens
 ├─ Nested Screens
 ├─ Tabs / Subviews (indented)
```

Use **Auto Layout (vertical)** everywhere.

### Domain Frame Template (Reusable)

#### Frame Name Pattern

```
Domain / {Domain Name}
```

Example: `Domain / Money Movement`

#### Section Header Component

**Text Style:** Heading / H3

**Format:**

```
🔄 Money Movement
Purpose: What actually moved money
```

Use emoji only on sitemap (not UI).

### Figma Page Setup

#### Page Name

```
🗺️ Sitemap — Akount App
```

#### Domain Columns

| Column | Domain | Emoji | Purpose |
| ------ | ------ | ----- | ------- |
| 1 | Overview | 🏠 | Financial orientation |
| 2 | Money Movement | 🔄 | Bank truth |
| 3 | Business Operations | 💼 | AR/AP |
| 4 | Accounting | 🧮 | Compliance & audit |
| 5 | Planning & Analytics | 📊 | Forecasting |
| 6 | Insights | 🧠 | Intelligence |
| 7 | Services | 🤝 | Collaboration |
| 8 | System | ⚙️ | Governance |
| Right | Global | 🌐 | Always available |

### Global Controls Frame

#### Frame Name

```
Global / Always Available
```

Items:

- Entity Switcher
- Period Selector
- Currency View
- Global Search
- Command Palette
- Notifications
- AI Side Panel

Placed on right side, accessible from all domains.

### Governance Notes (Bottom of Figma Page)

Add a text block:

> **Sitemap Governance Rules**
>
> • Sidebar = domain of responsibility
> • Tabs = views of same data
> • No screen appears in more than one domain
> • Global controls never appear as tabs
> • Any new screen must fit exactly one domain

---

## Governance Rules

### What This Sitemap Guarantees

✔ No duplicated ownership
✔ Clear mental models
✔ Accountant-friendly IA
✔ Audit-ready structure
✔ Scales from MVP → enterprise
✔ Designers and engineers stay aligned

This is **ERP-grade information architecture without ERP complexity**.

### Hard Governance Rules (Non-Negotiable)

#### Rule 1: Domain Ownership

**Sidebar defines domain ownership**

Each domain is responsible for one user task:

- Overview: "Where am I?"
- Money Movement: "What moved?"
- Business Operations: "Who is involved?"
- Accounting: "How is it recorded?"
- Planning: "What comes next?"
- AI: "What should I know?"
- Services: "Who helps me?"
- System: "How is this configured?"

#### Rule 2: Tabs vs Domains

**Tabs define views of the same data**

Tabs **may:**

- Filter (e.g., "Draft" vs "Sent" invoices)
- Segment by status
- Change lifecycle state

Tabs **may not:**

- Change permissions
- Change entity context
- Introduce new data owners
- Create new domains

Invalid example:

```
Invoices | Reports
```

(These are different domains)

#### Rule 3: No Duplication

**A screen belongs to exactly one domain**

If you can't place a screen cleanly, it doesn't belong in Akount.

#### Rule 4: Role Changes Visibility

**Role changes visibility, never hierarchy**

Permission matrix (in `permissions-matrix.md`) controls what each role sees, but the IA structure never changes.

#### Rule 5: Global Controls Stay Global

**Global context controls never appear as tabs**

These always stay in top command bar:

- Entity Switcher
- Period Selector
- Currency View
- Global Search

They are **never** moved into a domain as tabs.

#### Rule 6: Clarity Enforcement

**If permissions are unclear, the feature is incomplete**

Before shipping any new screen:

1. Identify which domain owns it
2. Define which roles can see it
3. Define what actions each role can take
4. Update permissions matrix if needed
5. Update sitemap if needed

---

## Feature Addition Checklist

When adding a new feature, use this checklist:

1. **[ ] Domain Identified**
   - Which sidebar section owns this screen?
   - Does it fit cleanly in one domain?

2. **[ ] Mental Model Aligned**
   - What question does this answer?
   - Does it match domain purpose?

3. **[ ] Hierarchy Clear**
   - Primary screen or sub-view?
   - If tabs needed, what dimension? (status, type, date range)

4. **[ ] Permissions Defined**
   - Who can see this?
   - What can each role do?
   - Need to update permissions-matrix.md?

5. **[ ] Global Context Applied**
   - Respect entity filter?
   - Respect time period filter?
   - Respect currency view?

6. **[ ] Figma Updated**
   - Add to correct domain column
   - Update parent screen hierarchy
   - List tabs if applicable

7. **[ ] Audit Trail Ready**
   - Can this be audited?
   - Do we track changes?
   - Can we show lineage?

---

## Final Governance Rule (CRITICAL)

> **If a new screen cannot be placed cleanly in exactly one domain above, it does not belong in Akount.**

That rule alone will protect the product for years.

---

## See Also

- [`permissions-matrix.md`](./permissions-matrix.md) - Who can see/do what
- [`../02-patterns/navigation.md`](../02-patterns/navigation.md) - Navigation UI implementation
- [`../03-screens/`](../03-screens/) - Individual feature specifications
- [`../01-components/`](../01-components/) - Reusable UI components
