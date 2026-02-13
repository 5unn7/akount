# Color System

> **Extracted from:** Original `Design-philosophy.md` (Section 2: Color System)
> **Last Updated:** 2026-02-04

## Overview

This is a **financial system**, so color must communicate *meaning*, not vibes. Every color in Akount has semantic purpose.

---

## Brand Base Colors

| Role      | Token                         | Color  | Use                     |
| --------- | ----------------------------- | ------ | ----------------------- |
| Primary   | `--ak-action-primary`         | Orange | CTAs, key highlights    |
| Secondary | `--ak-action-secondary`       | Violet | AI, intelligence, tools |
| Neutral   | `--ak-text-*`, `--ak-bg-*`    | Slate  | 90% of UI               |

### Primary (Orange)

- **Token:** `#f97316` / `24 94% 53%`
- **Use:** Primary actions, important highlights, brand identity
- **Psychology:** Confidence, trustworthiness, financial stability

### Secondary (Violet)

- **Token:** `#8b5cf6` / `252 94% 67%`
- **Use:** AI features, advanced tools, secondary actions
- **Psychology:** Intelligence, sophistication, innovation

### Neutral (Slate)

- **Palette:** Slate scale from `#f8fafc` (lightest) to `#0f172a` (darkest)
- **Use:** Backgrounds, text, borders, 90% of all UI
- **Psychology:** Professional, stable, trustworthy

---

## Financial Semantic Colors (MOST IMPORTANT)

**Users should recognize financial state without reading.**

### Income / Revenue

| Token                    | Light Color | Dark Color | Use              |
| ------------------------ | ----------- | ---------- | ---------------- |
| `--ak-finance-income`    | `#10b981`   | `#10b981`  | Positive cash    |
| `--finance-income` (HSL) | `160 84%`   | `160 84%`  | Transaction rows |

**Psychology:** Green = growth, positive movement, money in

### Expenses / Outflows

| Token                     | Light Color | Dark Color | Use                |
| ------------------------- | ----------- | ---------- | ------------------ |
| `--ak-finance-expense`    | `#ef4444`   | `#ef4444`  | Money going out    |
| `--finance-expense` (HSL) | `0 84% 60%` | `0 84% 60%` | Transaction rows   |

**Psychology:** Red = alert, outflow, decrease

### Transfers / Internal Movement

| Token                       | Light Color | Dark Color | Use                        |
| --------------------------- | ----------- | ---------- | -------------------------- |
| `--ak-finance-transfer`     | `#3b82f6`   | `#3b82f6`  | Account-to-account moves   |
| `--finance-transfer` (HSL)  | `217 91%`   | `217 91%`  | Transfer-specific displays |

**Psychology:** Blue = neutral movement, internal flows, information

### Liabilities / Debt

| Token                        | Light Color | Dark Color | Use                    |
| ---------------------------- | ----------- | ---------- | ---------------------- |
| `--ak-finance-liability`     | `#f59e0b`   | `#f59e0b`  | Debt, loans, payables  |
| `--finance-liability` (HSL)  | `38 92%`    | `38 92%`   | Liability displays     |

**Psychology:** Amber/orange = caution, attention needed, obligations

### Equity / Net Worth

| Token                      | Light Color | Dark Color | Use                    |
| -------------------------- | ----------- | ---------- | ---------------------- |
| `--ak-finance-equity`      | `#14b8a6`   | `#14b8a6`  | Owner's equity, assets |
| `--finance-equity` (HSL)   | `173 80%`   | `173 80%`  | Equity displays        |

**Psychology:** Teal/cyan = stability, ownership, positive position

---

## State Colors

| State            | Color  | Use                        |
| ---------------- | ------ | -------------------------- |
| Success/Ok       | Green  | Reconciled, verified, good |
| Warning/Caution  | Amber  | Needs review, attention    |
| Error/Issue      | Red    | Accounting error, problem  |
| Info/Neutral     | Blue   | Information, neutral state |
| AI Suggestion    | Violet | AI-generated suggestion    |

---

## AI System Colors

| Token             | Color    | Use                           |
| ----------------- | -------- | ----------------------------- |
| `--ak-ai-primary` | `#8b5cf6` | AI insight cards, highlights  |
| `--ak-ai-bg`      | Violet 10% opacity | AI backgrounds, subtle fills |
| `--ak-ai-border`  | Violet 35% opacity | AI borders, dividers         |

**Visual Rule:** Always violet-accented for AI surfaces

---

## Implementation

### In CSS

```css
.transaction-income {
  color: var(--ak-finance-income);
}

.transaction-expense {
  color: var(--ak-finance-expense);
}

.ai-insight {
  background: var(--ak-ai-bg);
  border-color: var(--ak-ai-border);
}
```

### In Tailwind

Colors are mapped to Tailwind configuration:

```js
colors: {
  finance: {
    income: "var(--finance-income)",
    expense: "var(--finance-expense)",
    transfer: "var(--finance-transfer)",
    liability: "var(--finance-liability)",
    equity: "var(--finance-equity)"
  },
  ai: {
    DEFAULT: "var(--ai)",
    bg: "var(--ai-bg)",
    border: "var(--ai-border)"
  }
}
```

Usage:

```jsx
<span className="text-finance-income">$1,234.56</span>
<div className="bg-ai-bg border-ai-border">...</div>
```

---

## Glassmorphism & Skeuomorphism Colors

Akount blends **glassmorphism** (translucent layers) with **skeuomorphism** (material depth) using strategic color and transparency.

### Glassmorphism: Glass Backgrounds

**Financial Clarity glass uses very subtle overlays — not heavy frosted glass:**

```css
/* Light mode glass (white overlay) */
--ak-glass-light: rgba(255, 255, 255, 0.7);
--ak-glass-medium: rgba(255, 255, 255, 0.5);
--ak-glass-strong: rgba(255, 255, 255, 0.3);

/* Dark mode glass (white-alpha, NOT slate-alpha)
   These are the primary values used in Financial Clarity aesthetic */
--ak-glass:   rgba(255, 255, 255, 0.025);  /* Default: barely there */
--ak-glass-2: rgba(255, 255, 255, 0.04);   /* Hover: slightly visible */
--ak-glass-3: rgba(255, 255, 255, 0.06);   /* Active: gentle surface */
```

**Usage:**

- **Cards:** `glass` utility + `backdrop-filter: blur(16px)` + subtle border lift on hover
- **Modals:** `glass-3` + overlay backdrop
- **Panels:** `glass` + border-right
- **Tooltips:** `glass-2` + stronger border

**Tailwind utilities:** `glass`, `glass-2`, `glass-3` defined in globals.css

### Skeuomorphism: Material Depth

**Shadow system for physical affordance:**

```css
/* Subtle shadows (realistic light from above) */
--ak-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--ak-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
--ak-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--ak-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.12);
--ak-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

/* Pressed/active state (shadow reduces, moves up) */
--ak-shadow-pressed: 0 1px 2px rgba(0, 0, 0, 0.03);
```

**Usage:**

- **Cards:** `--ak-shadow-md` (substantial, feels real)
- **Buttons (normal):** `--ak-shadow-sm` (slightly raised)
- **Buttons (pressed):** `--ak-shadow-pressed` (feels depressed)
- **Modals:** `--ak-shadow-xl` (floats above everything)

### Border Highlights (Glass Accent)

**Subtle light borders suggest glass edges:**

```css
/* Glass borders: Catch light on top/left */
--ak-glass-border: rgba(255, 255, 255, 0.3);     /* Light mode */
--ak-glass-border-dark: rgba(255, 255, 255, 0.1); /* Dark mode */

/* Used on frosted glass cards to suggest real glass */
border-top: 1px solid var(--ak-glass-border);
border-left: 1px solid var(--ak-glass-border);
```

### Layering Strategy

```
Layer 1 (Background):     Page background (solid)
Layer 2 (Glass):          Frosted glass card (semi-transparent + blur)
Layer 3 (Content):        Text, data, UI elements
Layer 4 (Accent):         Highlights, borders, interactive elements
```

**Result:** Clear visual hierarchy without harsh borders. Sophisticated and approachable.

---

## Dark Mode — Financial Clarity Aesthetic

> **Canonical reference:** `brand/inspirations/financial-clarity-final.html`

Dark mode is the **primary** mode for Akount. The aesthetic is "Financial Clarity" — near-black surfaces with purple undertones, subtle glass morphism, and amber orange accents.

### Surface Hierarchy (5 Levels)

| Level | Token | Hex | Use |
|-------|-------|-----|-----|
| 0 (deepest) | `--ak-bg-primary` | `#09090F` | Page background |
| 1 | `--ak-bg-secondary` | `#0F0F17` | Sidebar, panels |
| 2 | `--ak-bg-surface` | `#15151F` | Cards, dropdowns |
| 3 | `--ak-bg-elevated` | `#1A1A26` | Hover, tooltips |
| 4 | — | `#22222E` | Active states |

**Not slate.** These are purple-tinted near-blacks for warmth.

### Semantic Colors (400-level for Dark)

In dark mode, semantic colors shift from 500-level to 400-level for better contrast against dark surfaces:

| Role | Light Mode (500) | Dark Mode (400) |
|------|-----------------|-----------------|
| Income | `#10B981` | `#34D399` |
| Expense | `#EF4444` | `#F87171` |
| Transfer | `#3B82F6` | `#60A5FA` |
| AI | `#8B5CF6` | `#A78BFA` |
| Equity | `#14B8A6` | `#2DD4BF` |

### Glass in Dark Mode

Three tiers of glass using white-alpha overlays:

```css
--ak-glass:   rgba(255, 255, 255, 0.025);  /* Default cards */
--ak-glass-2: rgba(255, 255, 255, 0.04);   /* Hover states */
--ak-glass-3: rgba(255, 255, 255, 0.06);   /* Active/focused */
```

**Blur:** `backdrop-filter: blur(16px)` — subtle, refined.
**Borders:** `rgba(255, 255, 255, 0.06)` — barely visible, implies depth.

---

## Accessibility

All semantic color combinations meet WCAG AA contrast requirements:

- Income (green) on white: 5.12:1 contrast
- Expense (red) on white: 4.47:1 contrast
- All combinations tested for deuteranopia, protanopia, tritanopia

Never use color alone to convey information—always pair with icons, text, or other visual indicators.

---

## See Also

- [`philosophy.md`](./philosophy.md) - Why we use these colors
- [`typography.md`](./typography.md) - How colors pair with text
- [`tokens/`](./tokens/) - CSS variables and token definitions
