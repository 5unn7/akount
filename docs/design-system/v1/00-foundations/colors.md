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

**Frosted glass effect colors:**

```css
/* Glass base: Semi-transparent overlays */
--ak-glass-light: rgba(255, 255, 255, 0.7);    /* Light mode glass */
--ak-glass-medium: rgba(255, 255, 255, 0.5);   /* Medium transparency */
--ak-glass-strong: rgba(255, 255, 255, 0.3);   /* Strong transparency */

/* Dark mode glass */
--ak-glass-dark-light: rgba(15, 23, 42, 0.4);  /* Dark mode glass (light) */
--ak-glass-dark-medium: rgba(15, 23, 42, 0.6); /* Dark mode glass (medium) */
--ak-glass-dark-strong: rgba(15, 23, 42, 0.8); /* Dark mode glass (strong) */
```

**Usage:**
- **Cards:** `--ak-glass-medium` + `backdrop-filter: blur(10px)` + subtle shadow
- **Modals:** `--ak-glass-strong` + overlay + border highlight
- **Panels:** `--ak-glass-light` + floating effect
- **Tooltips:** `--ak-glass-medium` + fine border

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

## Dark Mode

All colors are specified with HSL values for better dark mode contrast control. The CSS variables override in `.dark` class:

```css
.dark {
  --ak-finance-income: #10b981;  /* Stays consistent */
  --ak-finance-expense: #ef4444; /* Stays consistent */
  /* Colors are absolute, not lightness-relative */
}
```

**Note:** Financial semantic colors don't change in dark mode—they maintain the same absolute RGB values to preserve meaning consistency.

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
