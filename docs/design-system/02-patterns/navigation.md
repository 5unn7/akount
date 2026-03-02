# Navigation System

> **Consolidates:** `global-sidebar.md` + `top-command-bar.md` + `navigation-permissions.md` (permissions overview)
>
> **Last Updated:** 2026-02-04

## Overview

The navigation system is where Akount's **personality** shows. It's not just navigation—it's the **mental model of global finance**. Together, the sidebar and top command bar form a "financial command center," not bookkeeping software.

Navigation should feel like:
> 🧠 "Financial command center"
> not
> 📒 "Accounting menu"

---

## Mental Model

### Sidebar: The Map

The sidebar answers: **"Where am I in my financial world?"**

- Organized by how solopreneurs think, not accounting terms
- Persistent anchor point (never scrolls away)
- 8 semantic sections grouped by user intent

### Top Command Bar: The Mission Console

The top bar answers: **"What financial universe am I looking at?"**

- Controls scope (entities), time, currency
- Provides global search and AI status
- Makes users feel: "I know exactly what data I'm seeing"

### Together
>
> "I am inside my financial control room."

---

## 1. Global Sidebar Navigation

### Purpose

The sidebar must:

1. Orient users in a **complex financial world**
2. Reflect **entity + global structure**
3. Separate **operations** from **intelligence**
4. Scale as features grow

### Layout Structure

| State     | Width | Purpose                        |
| --------- | ----- | ------------------------------ |
| Collapsed | 80px  | Icon-only, compact mode        |
| Expanded  | 240px | Full labels, clear navigation  |

**Key Rule:** Sticky. Never scrolls away. This is the *anchor of control*.

### Top Section: Workspace + Entity Context

```
[ Workspace Switcher ]
   Akount Workspace ▼

[ Active Entity Filter ]
🌍 All Entities   ▼
```

**Entity filter affects the whole app.** Constant reinforcement prevents the #1 solopreneur error: mixing personal + business in analysis.

### Sidebar Sections (8 Categories)

#### 🏠 OVERVIEW

**Mental Mode:** "Where am I financially?"

| Item      | Icon       | Why                 |
| --------- | ---------- | ------------------- |
| Dashboard | LayoutGrid | Unified view        |
| Net Worth | PieChart   | Personal + business |
| Cash Flow | Activity   | Movement tracking   |
| Insights  | Sparkles   | AI global insights  |

#### 🧾 MONEY MOVEMENT

**Mental Mode:** "What happened to my money?"

| Item           | Icon           | Why                 |
| -------------- | -------------- | ------------------- |
| Accounts       | Landmark       | Bank + credit cards |
| Transactions   | ArrowLeftRight | Core ledger         |
| Reconciliation | CheckCircle2   | Bank matching       |
| Transfers      | ArrowUpDown    | Internal movement   |

#### 🧮 ACCOUNTING

**Mental Mode:** "How is this recorded?"

| Item              | Icon          | Why                    |
| ----------------- | ------------- | ---------------------- |
| Journal Entries   | BookOpen      | Double-entry records   |
| Chart of Accounts | Network       | GL account structure   |
| Tax Rates         | Percent       | Jurisdiction settings  |
| Fiscal Periods    | CalendarRange | Period management      |

**Note:** Hidden from beginners → progressive disclosure as they advance.

#### 💼 BUSINESS OPERATIONS

**Mental Mode:** "How do I run my business?"

| Item     | Icon     | Why           |
| -------- | -------- | ------------- |
| Clients  | Users    | Customer list |
| Invoices | FileText | AR tracking   |
| Vendors  | Store    | Supplier list |
| Bills    | Receipt  | AP tracking   |
| Payments | Wallet   | Payment log   |

#### 📊 PLANNING & ANALYTICS

**Mental Mode:** "What's my future?"

| Item        | Icon       | Why                |
| ----------- | ---------- | ------------------ |
| Reports     | BarChart3  | Financial analysis |
| Budgets     | Target     | Budget planning    |
| Goals       | Flag       | Goal tracking      |
| Forecasting | TrendingUp | Financial forecast |

#### 🧠 INSIGHTS (Differentiator)

**Mental Mode:** "What should I do?"

| Item              | Icon      | Why                     |
| ----------------- | --------- | ----------------------- |
| Insights          | Sparkles  | Main AI insights panel  |
| Tax Opportunities | Lightbulb | Tax optimization tips   |
| Policy Alerts     | Bell      | System policy changes   |
| Optimization      | Wand2     | AI recommendations      |

**Visual Distinction:** Use **violet accent line** on this section to make it feel distinct.

**AI Notification Badge:** If new insight exists, show small violet dot with count badge (e.g., "3").

#### 👥 ACCOUNTANT & SERVICES

**Mental Mode:** "Who helps me?"

| Item             | Icon      | Why              |
| ---------------- | --------- | ---------------- |
| My Accountant    | UserCheck | Accountant portal |
| Bookkeeping Help | LifeBuoy  | Support resources |
| Documents        | Paperclip | Doc management   |

#### ⚙️ SYSTEM

**Mental Mode:** "How do I configure this?"

| Item               | Icon        | Why                   |
| ------------------ | ----------- | --------------------- |
| Entities           | Building2   | Legal entity setup     |
| Integrations       | Plug        | Third-party connections |
| Rules & Automation | Workflow    | Automation rules       |
| Audit Log          | ShieldCheck | Compliance tracking    |
| Settings           | Settings    | User preferences      |

### Visual Hierarchy Rules

| Element       | Style                        |
| ------------- | ---------------------------- |
| Section label | Uppercase, small, muted      |
| Active item   | Filled bg + left accent line |
| AI section    | Violet accent                |
| Hover         | Soft slate background        |
| Icons         | Outline style, 20px size     |

### Entity Awareness

Always show active entity context near relevant items:

```
Transactions  🇨🇦
Accounts      🇨🇦
```

This constant reinforcement = fewer cross-entity mistakes.

### Collapsed State (Icon-Only)

- Only icons shown
- Hover = flyout tooltip with section grouping
- AI section icon has subtle violet glow
- Shows same notification badge as expanded state

### Dark Mode

Sidebar = slightly darker than content area
Creates a stable anchor feeling.

---

## 2. Top Command Bar

### Purpose

The top bar controls:

1. **Scope** → What financial universe am I looking at?
2. **Time** → When?
3. **Currency context** → In what currency?
4. **AI attention** → What does my AI brain know?
5. **Global actions** → What can I do?

This bar should make users feel:
> "I know exactly what data I'm seeing."

### Layout Structure

```
| Entity Scope | Time Range | Currency View | Search | AI Status | Global Actions | User |
```

**Key Rules:** Sticky. Subtle elevation. Never crowded. Height: 56–64px.

### Components

#### 1. Entity Scope Switcher (Most Important)

**Display:**

```
🌍 All Entities ▼
```

or when specific entities selected:

```
🇨🇦 CAN Corp + 🇺🇸 US LLC ▼
```

**Behavior:** Opens structured selector:

```
☑ All Entities
— BUSINESS —
☑ 🇨🇦 Canadian Corp
☐ 🇺🇸 US LLC
☐ 🇮🇳 Sole Prop
— PERSONAL —
☑ 👤 Personal
```

**Why:** This prevents the #1 solopreneur error: **mixing personal + business in analysis.** This control is **always visible**.

#### 2. Time Intelligence Selector

**Display:**

```
Jan 1 – Mar 31, 2026 ▼
```

**Quick Presets:**

- This Month
- Last Month
- This Quarter
- YTD
- Last Fiscal Year
- Custom

**Smart Feature:** Show comparison automatically with subtle ↑ ↓ indicators in KPIs.

#### 3. Currency View Mode

**Display:**

```
Display in: USD ▼
```

**Modes:**

| Mode      | What it means                  |
| --------- | ------------------------------ |
| Native    | Show original currencies       |
| Converted | Convert everything to one base |
| Dual      | Native + converted             |

**FX Rate Source:** Shown on hover.

**Why:** This makes cross-border finances *understandable*.

#### 4. Global Financial Search

Not just text search—**financial search**.

Search across:

- Transactions
- Invoices
- Clients
- Accounts
- Journal entries

Examples:

```
"AWS February"
"$1200 CAD"
"Unreconciled"
```

Feels like searching a **financial database**, not text.

#### 5. AI Awareness Indicator

Right side, subtle but powerful.

**States:**

| State          | UI                 |
| -------------- | ------------------ |
| No alerts      | Violet dot idle    |
| Insights ready | "3 Insights" badge |
| Critical alert | Amber highlight    |

**Behavior:** Click → opens AI side panel (not new page).

Feels like:
> "Your financial brain has something to say."

#### 6. Global Action Button

One persistent CTA:

```
+ Add
```

Opens action palette:

- Transaction
- Invoice
- Bill
- Journal Entry
- Transfer
- Client
- Vendor

Power-user friendly.

#### 7. User / Workspace Controls

| Element          | Purpose          |
| ---------------- | ---------------- |
| Profile          | Account settings |
| Workspace switch | Multi-company    |
| Notifications    | System alerts    |

### Visual Rules

| Element    | Style                         |
| ---------- | ----------------------------- |
| Height     | 56–64px                       |
| Background | Slight elevation over content  |
| Dividers   | Soft vertical lines (muted)   |
| Icons      | Monoline style, consistent    |
| Text       | Compact, readable             |

### The Psychological Effect

Without this bar:
> "I'm looking at numbers."

With this bar:
> "I am controlling a financial system across countries and time."

That's the difference between bookkeeping software and **Akount**.

---

## 3. Permission-Based Visibility

> **Full permissions matrix in:** [`05-governance/permissions-matrix.md`](../05-governance/permissions-matrix.md)

**Navigation visibility varies by role.** Below is a simplified overview; see full matrix for complete details.

### Global Context Controls (Not Sidebar)

| Control         | Owner | Accountant | Bookkeeper | Investor |
| --------------- | ----- | ---------- | ---------- | -------- |
| Entity Switcher | ✓     | ✓ (limit)  | ✗          | ✗        |
| Period Selector | ✓     | ✓          | ✓          | ✓ (read) |
| Currency View   | ✓     | ✓          | ✓          | ✓        |
| Command Palette | ✓     | ✓          | ✗          | ✗        |
| AI Side Panel   | ✓     | ✓          | ✗          | ✗        |

### Sidebar Section Visibility by Role

**OVERVIEW** (Always visible, read-only for all)

- Dashboard (role-specific): Owner/Admin/Accountant see different dashboards
- Net Worth: All roles
- Cash Flow: All roles except Bookkeeper
- Insights: All except Investor

**MONEY MOVEMENT** (Access varies)

- Accounts: All roles
- Transactions: Owner/Admin/Bookkeeper can create; Accountant reads only
- Reconciliation: Owner/Admin/Accountant can act; Bookkeeper can assist
- Transfers: Owner/Admin only

**ACCOUNTING** (Advanced users only)

- Journal Entries: Owner/Admin/Accountant
- Chart of Accounts: Owner/Admin/Accountant
- Assets & Depreciation: Owner/Admin/Accountant
- Tax Rates: Owner/Admin/Accountant
- Fiscal Periods: Owner/Admin/Accountant
- **Hidden from:** Bookkeeper, Investor

**BUSINESS OPERATIONS** (AR/AP)

- Clients/Vendors: Owner/Admin/Accountant/Bookkeeper
- Invoices/Bills: Owner/Admin/Accountant/Bookkeeper
- Payments: Owner/Admin/Accountant/Bookkeeper

**PLANNING & ANALYTICS**

- Reports: All roles (read-only)
- Budgets: Owner/Admin only
- Goals: Owner only
- Forecasts: Owner/Admin/Investor

**INSIGHTS**

- Insights: Owner/Admin/Accountant
- Tax Opportunities: Owner/Admin/Accountant
- Policy Alerts: Owner/Admin/Accountant
- **Hidden from:** Bookkeeper, Investor

**ACCOUNTANT & SERVICES**

- My Accountant: All roles
- Bookkeeping Help: All roles
- Documents: All roles

**SYSTEM**

- Entities: Owner/Admin
- Integrations: Owner/Admin
- Rules & Automation: Owner/Admin
- Audit Log: Owner/Admin/Accountant
- Settings: Owner/Admin

---

## Implementation Guidelines

### Dark Mode

Both sidebar and top bar adapt to dark mode:

- Sidebar: Slightly darker than content area for anchor effect
- Top bar: Maintains subtle elevation
- Icons: Remain visible with adjusted contrast

### Responsive Behavior

**Desktop (1280px+):**

- Sidebar: 240px expanded, collapsible to 80px
- Top bar: Full width with all controls

**Tablet (768px–1279px):**

- Sidebar: Collapsed to 80px by default, swipeable
- Top bar: Compact layout, some controls in menu

**Mobile (<768px):**

- Sidebar: Hidden, accessible via hamburger menu
- Top bar: Essential controls only (scope, search, user)

### Keyboard Navigation

- `Alt+1` through `Alt+8`: Jump to sidebar sections
- `Cmd/Ctrl+K`: Open global search
- `Cmd/Ctrl+Shift+A`: Open action palette
- `Escape`: Close any open dropdown
- `Tab`: Navigate top bar controls

### Accessibility

- All controls have visible labels (icons + text when expanded)
- Focus indicators visible on all interactive elements
- Color not the only indicator (icons, text, structure)
- ARIA labels for screen readers on icons
- Keyboard-navigable without mouse

---

## See Also

- [`../05-governance/information-architecture.md`](../05-governance/information-architecture.md) - Complete sitemap
- [`../05-governance/permissions-matrix.md`](../05-governance/permissions-matrix.md) - Full permission details
- [`../04-workflows/entity-selection.md`](../04-workflows/entity-selection.md) - Entity switcher workflow
- [`../03-screens/dashboards.md`](../03-screens/dashboards.md) - Uses this navigation system
- [`../00-foundations/colors.md`](../00-foundations/colors.md) - Navigation styling
