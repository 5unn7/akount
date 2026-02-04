design needs to feel:

> 🧠 intelligent
> 🧾 trustworthy
> 🌍 global
> 🧘‍♂️ calm under financial complexity

Not “startup playful.” Not “corporate sterile.”
More like **Bloomberg Terminal × Notion clarity × Apple-level calm**.

Let’s design the system at that level.

---

# 🧭 1. Design Philosophy (The Rulebook)

### Core Principles

| Principle                     | What it means in UI                                       |
| ----------------------------- | --------------------------------------------------------- |
| **Clarity over decoration**   | Data must be easier to read than to admire                |
| **Calm complexity**           | Advanced systems, zero visual stress                      |
| **AI = Advisor, not gimmick** | AI UI should feel like a senior accountant, not a chatbot |
| **Global-first**              | Currency, tax, entity, country context always visible     |
| **Trust-first UI**            | Stable layouts, predictable patterns, strong alignment    |

---

# 🎨 2. Color System (Semantic, not aesthetic)

This is a **financial system**, so color must communicate *meaning*, not vibes.

### 🎯 Brand Base

| Role      | Token                         | Use                              |
| --------- | ----------------------------- | -------------------------------- |
| Primary   | `--ak-primary-500` (Orange)   | CTAs, key highlights             |
| Secondary | `--ak-secondary-500` (Violet) | AI, intelligence, advanced tools |
| Neutral   | Slate scale                   | 90% of UI                        |

---

### 💰 Financial Semantic Colors (MOST IMPORTANT)

| Meaning    | Color    | Used For             |
| ---------- | -------- | -------------------- |
| Income     | Emerald  | Positive cash flow   |
| Expense    | Rose/Red | Outflow              |
| Transfer   | Sky      | Internal movement    |
| Liability  | Amber    | Debt                 |
| Equity     | Teal     | Net worth            |
| Warning    | Amber    | Risk                 |
| Error      | Red      | Accounting issue     |
| AI Insight | Violet   | AI-generated content |

Users should recognize financial state **without reading**.

---

# ✍️ 3. Typography System

| Level          | Font               | Purpose                        |
| -------------- | ------------------ | ------------------------------ |
| H1–H3          | **Newsreader**     | Authority, seriousness         |
| Body           | **Manrope**        | Clean financial readability    |
| Numbers, codes | **JetBrains Mono** | Currency, IDs, journal entries |

**Rule:**
All money values → **monospace**
This subtly improves scanning + trust.

---

# 🧱 4. Layout System

### Base Grid

* 12-column grid desktop
* Max width: 1440px
* Sidebar: 80px collapsed / 240px expanded

### Spacing Scale

Use Tailwind spacing but define roles:

| Token    | Meaning                   |
| -------- | ------------------------- |
| space-xs | micro UI (chips)          |
| space-sm | form spacing              |
| space-md | card padding              |
| space-lg | section spacing           |
| space-xl | page-level breathing room |

---

# 🧩 5. Core UI Patterns

This system is **pattern-driven**, not page-driven.

---

## 🧾 A. Data Table System (Your Core Surface)

Tables = your primary interface.

**Must support:**

* Sorting
* Bulk actions
* Multi-currency
* Entity badges
* AI flags
* Reconciliation states

### Row Anatomy

| Element            | Why                      |
| ------------------ | ------------------------ |
| Direction icon ↑ ↓ | Financial direction      |
| Description        | Human readable           |
| Entity badge       | Multi-entity clarity     |
| Category chip      | Accounting mapping       |
| Account            | Source                   |
| Amount (mono)      | Precision                |
| Status badge       | Reconciled / AI / Manual |

---

## 🧠 B. AI System UI (Your Differentiator)

AI must feel like **a senior accountant whispering insights**, not a chat bubble.

### AI Surface Types

| Surface                    | Purpose                    |
| -------------------------- | -------------------------- |
| **Inline suggestion chip** | Transaction categorization |
| **Insight cards**          | Tax, burn rate, deductions |
| **Alert banners**          | Policy changes             |
| **Side panel advisor**     | Deep explanation           |

### AI Visual Rules

* Always violet-accented
* Sparkle icon, never robot icons
* Language: advisory, not certain

---

## 🏢 C. Entity System UI

Multi-entity is your killer feature.

### Entity Badge Format:

`[🇨🇦 CAN Corp]`
`[🇺🇸 US LLC]`
`[👤 Personal]`

Visible on:

* Transactions
* Invoices
* Reports
* Accounts

---

## 💱 D. Multi-Currency System

Every amount can have:
`$1,200 CAD (~$890 USD)`

FX rate shown on hover.
Never hide original currency.

---

# 🧮 6. Accounting UI Components

| Component                 | Purpose                |
| ------------------------- | ---------------------- |
| Journal Entry Editor      | Debits/Credits table   |
| Reconciliation Match Card | Bank ↔ System matching |
| Tax Rate Selector         | Jurisdiction aware     |
| GL Account Picker         | Hierarchical dropdown  |
| Transfer Flow UI          | Account A → Account B  |

These must feel **serious, structured, and stable**.

---

# 📊 7. Analytics System

Charts are **secondary to numbers**.

| Rule                          | Reason                 |
| ----------------------------- | ---------------------- |
| Big KPIs above charts         | Decision-first design  |
| Variance indicators           | Finance = comparison   |
| Entity filters always visible | Multi-entity awareness |

---

# 🧠 8. State System (Critical)

| State         | Visual       |
| ------------- | ------------ |
| Draft         | Slate badge  |
| Reconciled    | Green badge  |
| AI Suggested  | Violet       |
| Needs Review  | Amber        |
| Locked/Posted | Gray w/ lock |

---

# 🧩 9. Component Hierarchy

### Foundation

Colors, typography, spacing

### Primitives

Buttons, inputs, badges, chips, icons

### Composites

* Table
* AI Insight Card
* Journal Entry Grid
* Reconciliation Matcher
* Report Block
* Entity Switcher

---

# ⚙️ 10. Tailwind Strategy

Use **design tokens → Tailwind utilities**.

Example:

```css
--ak-color-income: #10b981;
--ak-color-expense: #ef4444;
--ak-color-ai: #8b5cf6;
```

Then map in Tailwind theme.

---

# 🧠 Final Philosophy

This product should feel like:

> “I am in control of my global finances.”

Not

> “I am using bookkeeping software.”

---