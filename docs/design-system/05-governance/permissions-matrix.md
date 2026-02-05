# Permissions Matrix

> **Extracted from:** Original `navigation-permissions.md`
> **Last Updated:** 2026-02-04

## Purpose

The Permissions Matrix defines what every user role can see and do across the application. It answers four questions for every screen:

1. **Where does it live?** (Sidebar domain)
2. **Who can see it?** (Role)
3. **What can they do?** (Permission level)
4. **How do they navigate inside it?** (Tabs vs global context)

**Key Rule:** If a screen can't be expressed cleanly in this matrix → **it doesn't ship**.

---

## Canonical Roles

| Role       | Description                      | Focus                  |
| ---------- | -------------------------------- | ---------------------- |
| **Owner**  | Founder / primary decision-maker | Strategy, monitoring   |
| **Admin**  | Ops / finance lead               | Operations, integration|
| **Accountant** | External licensed professional   | Verification, compliance |
| **Bookkeeper** | Data entry support               | Transaction entry      |
| **Investor** | Read-only stakeholder            | Reports, dashboards    |
| **Advisor** | Read-only professional           | Strategic insights     |

---

## Standardized Permission Levels

| Level     | Meaning                     | Example                    |
| --------- | --------------------------- | -------------------------- |
| **Hidden**   | Not visible                 | Bookkeeper can't see accounting section |
| **View**     | Read-only access            | Investor can view reports  |
| **Act**      | Create / update (no delete) | Bookkeeper can create transactions |
| **Approve**  | Approve / lock / attest     | Accountant approves reconciliation |
| **Admin**    | Configure / override        | Owner configures entities |

---

## Global Context Controls

These apply everywhere and **never appear as tabs** in the sidebar.

| Control         | Owner | Admin | Accountant | Bookkeeper | Investor |
| --------------- | ----- | ----- | ---------- | ---------- | -------- |
| Entity Switcher | ✓ Act | ✓ Act | ✓ (view only) | ✗ | ✗ |
| Period Selector | ✓ Act | ✓ Act | ✓ Act | ✓ Act | ✓ View |
| Currency View   | ✓ Act | ✓ Act | ✓ Act | ✓ Act | ✓ Act |
| Command Palette | ✓ Act | ✓ Act | ✓ Act | ✗ | ✗ |
| AI Side Panel   | ✓ View | ✓ View | ✓ View | ✗ | ✗ |

**Rule:** These are never hidden or changed to tabs. They are always available in the top command bar.

---

## Sidebar Domain Permissions

### 🏠 OVERVIEW

| Screen                 | Owner | Admin | Accountant | Bookkeeper | Investor |
| ---------------------- | ----- | ----- | ---------- | ---------- | -------- |
| Dashboard (Founder)    | View  | View  | ✗          | ✗          | ✗        |
| Dashboard (Accountant) | ✗     | ✗     | View       | View       | ✗        |
| Net Worth              | View  | View  | View       | ✗          | View     |
| Cash Overview          | View  | View  | View       | ✗          | View     |

**Rules:**
- Always read-only access
- Context-aware (role-specific dashboards)
- No posting actions from overview section

---

### 🧾 MONEY MOVEMENT

| Screen         | Owner | Admin | Accountant | Bookkeeper | Investor |
| -------------- | ----- | ----- | ---------- | ---------- | -------- |
| Accounts       | Act   | Act   | View       | View       | ✗        |
| Transactions   | Act   | Act   | View       | Act        | ✗        |
| Reconciliation | Act   | Act   | Approve    | Act        | ✗        |
| Transfers      | Act   | Act   | View       | ✗          | ✗        |

**Rules:**
- **Accountants only** can approve reconciliation (critical for audit trail)
- Bookkeepers can create transactions but cannot move money (transfers)
- Investors have no access to money movement
- Accountants review but don't create volume

---

### 💼 BUSINESS OPERATIONS (AR/AP)

| Screen        | Owner | Admin | Accountant | Bookkeeper | Investor |
| ------------- | ----- | ----- | ---------- | ---------- | -------- |
| Clients       | Act   | Act   | View       | Act        | ✗        |
| Vendors       | Act   | Act   | View       | Act        | ✗        |
| Invoices (AR) | Act   | Act   | View       | Act        | ✗        |
| Bills (AP)    | Act   | Act   | View       | Act        | ✗        |
| Payments      | Act   | Act   | View       | Act        | ✗        |

**Rules:**
- No deletions after posting (audit trail protection)
- Accountants review, don't generate volume
- Bookkeepers handle day-to-day AR/AP
- Investors never see AP (sensitive vendor info)

---

### 🧮 ACCOUNTING

| Screen                | Owner | Admin   | Accountant | Bookkeeper | Investor |
| --------------------- | ----- | ------- | ---------- | ---------- | -------- |
| Journal Entries       | View  | Act     | Act        | ✗          | ✗        |
| Chart of Accounts     | View  | Act     | Act        | ✗          | ✗        |
| Assets & Depreciation | View  | Act     | Act        | ✗          | ✗        |
| Tax Rates             | View  | Act     | Act        | ✗          | ✗        |
| Fiscal Periods        | View  | Approve | Approve    | ✗          | ✗        |

**Rules:**
- **Bookkeepers never** touch accounting structure (strict separation)
- Accountants are primary actors here
- Owner can view but not modify (governance)
- Only Admin/Accountant can close fiscal periods

---

### 📊 PLANNING & ANALYTICS

| Screen     | Owner | Admin | Accountant | Bookkeeper | Investor |
| ---------- | ----- | ----- | ---------- | ---------- | -------- |
| Reports    | View  | View  | View       | ✗          | View     |
| Budgets    | Act   | Act   | View       | ✗          | ✗        |
| Goals      | Act   | Act   | ✗          | ✗          | ✗        |
| Forecasts  | Act   | Act   | View       | ✗          | View     |

**Rules:**
- Investors see *outputs* (final reports, forecasts) never drafts
- Accountants validate, don't plan
- Bookkeepers excluded (forward-looking, not operational)
- Budgets/Goals only for strategic users

---

### 🧠 AI ADVISOR

| Screen        | Owner | Admin | Accountant | Bookkeeper | Investor |
| ------------- | ----- | ----- | ---------- | ---------- | -------- |
| Insight Feed  | View  | View  | View       | ✗          | ✗        |
| Policy Alerts | View  | View  | View       | ✗          | ✗        |
| AI History    | View  | View  | View       | ✗          | ✗        |

**Rules:**
- AI never performs actions (humans always approve/execute)
- AI visibility ≠ authority (view-only always)
- Bookkeepers excluded (strategic intelligence)
- Investors excluded (operational insights)

---

### 🤝 SERVICES & COLLABORATION

| Screen                   | Owner | Admin | Accountant | Bookkeeper | Investor |
| ------------------------ | ----- | ----- | ---------- | ---------- | -------- |
| Accountant Collaboration | Admin | Admin | View       | ✗          | ✗        |
| Bookkeeping Services     | Act   | Act   | ✗          | ✗          | ✗        |
| Document Requests        | Act   | Act   | Act        | ✗          | ✗        |

**Rules:**
- Only Owner/Admin can manage accountant relationships
- External accountants have view-only (no operations)
- Bookkeeping is internal service, not visible to accountant

---

### ⚙️ SYSTEM ADMINISTRATION

| Screen                | Owner | Admin     | Accountant | Bookkeeper | Investor |
| --------------------- | ----- | --------- | ---------- | ---------- | -------- |
| Entities              | Admin | Admin     | View       | ✗          | ✗        |
| Integrations          | Admin | Admin     | ✗          | ✗          | ✗        |
| Rules & Automation    | Admin | Admin     | View       | ✗          | ✗        |
| Users & Permissions   | Admin | Admin     | ✗          | ✗          | ✗        |
| Audit Logs            | View  | View      | View       | ✗          | ✗        |
| Security & Compliance | View  | View      | View       | ✗          | ✗        |
| Filing Readiness      | View  | View      | Approve    | ✗          | ✗        |
| Data Management       | Admin | Admin     | ✗          | ✗          | ✗        |

**Rules:**
- Only Owner/Admin can configure system
- Accountants can audit but not configure
- Bookkeepers excluded from all system access
- Filing readiness requires accountant sign-off

---

## Implementation Rules

### Tab-Level Governance

Tabs **may:**
- Filter (e.g., "Draft" vs "Sent" invoices)
- Segment by status (e.g., "Reconciled" vs "Pending")
- Change lifecycle state

Tabs **may not:**
- Change permissions (no role-specific tabs)
- Change entity context
- Introduce new data owners

**Example (Invoices):**
```
Invoices
[ All | Draft | Sent | Paid | Overdue ]
```
✔ Valid: These are views of the same data

**Example (Invalid):**
```
Invoices | Reports
```
❌ Invalid: Different domains (should be separate sidebar sections)

### Hard Governance Rules (Non-Negotiable)

> **Navigation Governance**
>
> • Sidebar defines domain ownership
> • Tabs define views of the same data
> • A screen belongs to exactly one domain
> • Role changes visibility, never hierarchy
> • Global context controls never appear as tabs
> • If permissions are unclear, the feature is incomplete

---

## Why This Matrix Works

This matrix:

1. **Prevents permission creep** - Explicit per-screen rules prevent feature bloat
2. **Makes audits easier** - Clear role separation for compliance
3. **Stops PMs from inventing shortcuts** - "Where does this go?" has an answer
4. **Keeps Akount accountant-credible** - Professional, regulated access patterns
5. **Allows safe feature expansion** - New features follow established patterns

---

## Quick Reference by Role

### Owner
- **Access:** Nearly everything (view exceptions for sensitive vendor data)
- **Actions:** Create/update in operations; view accounting; plan budgets
- **Restrictions:** Can't delete (audit trail); can't force approve (requires accountant)

### Admin
- **Access:** Everything Owner sees + system configuration
- **Actions:** Configure integrations, automation, user management
- **Restrictions:** Can't delete; transactions require accountant approval

### Accountant
- **Access:** Accounting core + AR/AP + compliance + reports
- **Actions:** Approve reconciliation, journal entries; manage tax rates
- **Restrictions:** Can't access integrations or user management; read-only on budgets

### Bookkeeper
- **Access:** AR/AP + transaction entry + basic overview
- **Actions:** Create transactions, invoices, bills, payments
- **Restrictions:** No accounting, no system, no AI, no planning

### Investor
- **Access:** Reports, dashboards, final forecasts
- **Actions:** None (view-only)
- **Restrictions:** No operations, no AR/AP, no AI insights, no system access

### Advisor
- **Access:** Reports, dashboards, final forecasts
- **Actions:** None (view-only)
- **Restrictions:** Same as Investor (external stakeholder)

---

## Migration Path for Features

When adding new features, follow this checklist:

1. **Identify domain** → Which sidebar section owns this?
2. **Define roles** → Who performs what action?
3. **Assign permissions** → Use standardized levels (Hidden/View/Act/Approve/Admin)
4. **Tab structure** → If needed, define tab types (status, category, date range)
5. **Global context** → Does it need entity/period/currency awareness?
6. **Audit trail** → Can this be audited? If not, restrict to Admin/Accountant
7. **Test cases** → Verify each role sees exactly what they should

---

## Planned Enhancements (From Roadmap)

### Read-Only Stakeholder Views (HIGH Priority, 3-6 months)

**Future enhancement:** Enable founders to share financial data with investors, advisors, and external stakeholders.

**What's planned:**
- Investor/advisor read-only dashboards (view reports, forecasts)
- Sanitized views (hide bank details, vendor information, tax data)
- Snapshot-based sharing (static, point-in-time reports)
- Time-bound access (temporary stakeholder access with expiration)
- Custom report subscriptions (regular delivery of specific reports)
- Activity logging (audit trail of who viewed what)

**Stakeholder types to support:**
- Investors (strategic view, financial health only)
- Advisors (similar to investors, may include forecasts)
- External auditors (compliance view)
- Lenders (covenant monitoring view)
- Tax professionals (tax-specific view)

**Why it matters:**
Founders will ask for this immediately. "Can I share my P&L with my accountant?" Requires different access levels than current Owner/Admin/Accountant model. Essential for fundraising and stakeholder communication.

**Expected impact:** Founders can confidently share reports without sharing operational details. "I can give my investor a dashboard view without exposing everything."

---

### Jurisdiction-Specific Permission Rules (MEDIUM Priority, 12+ months)

**Future enhancement:** Adjust permissions based on legal jurisdiction requirements.

**What's planned:**
- Permission templates by jurisdiction (Canada, US, India, EU, etc.)
- Locale-specific role requirements (e.g., some jurisdictions require licensed accountant sign-off)
- Compliance-driven access restrictions (e.g., certain tax data requires role-specific access)
- Audit compliance rules (who can lock periods, approve entries)
- Data residency awareness (restrict export for certain jurisdictions)

**Regulatory complexity examples:**
- Canada: Who can approve GST/HST returns?
- US: Who can authorize 1099 reporting?
- India: Who can authorize GST reconciliation?
- EU: GDPR-driven access restrictions

**Why it matters:**
Different jurisdictions have different regulatory requirements for who can perform financial operations. Cannot design global with only Canadian lens.

**Expected impact:** System remains compliant as you expand internationally. "Permissions automatically adjust to local requirements."

---

## See Also

- [`information-architecture.md`](./information-architecture.md) - Complete sitemap
- [`../02-patterns/navigation.md`](../02-patterns/navigation.md) - Navigation system overview
- [`../03-screens/`](../03-screens/) - Feature-specific permission implementations
- [`../06-compliance/security.md`](../06-compliance/security.md) - Security requirements
