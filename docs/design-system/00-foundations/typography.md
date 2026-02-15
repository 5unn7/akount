# Typography

> **Extracted from:** Original `Design-philosophy.md` (Section 3: Typography System)
> **Last Updated:** 2026-02-04

## Overview

Typography in Akount is purposeful and role-based. Each font family serves a specific function in the hierarchy, supporting both authority and clarity.

---

## Font Families

### Newsreader (Display/Headings)

- **Use:** H1, H2, H3, significant headings
- **Role:** Authority, seriousness, editorial weight
- **Characteristics:** Serif, distinctive, commands attention
- **Example:** Dashboard titles, page headers, section headings

**Why:** Serif fonts communicate credibility and authority—important for financial products.

### Manrope (Body/UI Text)

- **Use:** Body copy, form labels, UI text, descriptions
- **Role:** Clean financial readability, UI clarity
- **Characteristics:** Sans-serif, geometric, modern
- **Example:** Descriptions, buttons, labels, body paragraphs

**Why:** Geometric sans-serif provides excellent UI readability without sacrificing professionalism.

### JetBrains Mono (Numbers & Data)

- **Use:** All monetary values, transaction IDs, journal entries, codes
- **Role:** Precision, scanability, data clarity
- **Characteristics:** Monospace, fixed-width, designed for code
- **Example:** `$1,234.56`, account numbers, reference IDs

**Why:** Monospace fonts make numbers easier to scan and compare—critical for financial data.

---

## Core Rule: All Money Values → Monospace

```
✓ Correct:  $1,234.56    (monospace)
✗ Wrong:    $1,234.56    (sans-serif)
```

This subtle improvement serves two purposes:

1. **Scanability:** Fixed-width aligns digits vertically
2. **Trust:** Signals precision and technical accuracy

---

## Type Scale

| Level    | Size       | Font      | Weight  | Usage                          |
| -------- | ---------- | --------- | ------- | ------------------------------ |
| **H1**   | 48px       | Newsreader | Bold   | Page title                     |
| **H2**   | 36px       | Newsreader | Bold   | Major sections                 |
| **H3**   | 28px       | Newsreader | Bold   | Subsections                    |
| **H4**   | 24px       | Newsreader | Semibold | Section headers              |
| **H5**   | 20px       | Newsreader | Semibold | Card titles                   |
| **H6**   | 18px       | Newsreader | Medium | Labels, badges                |
| **Body** | 16px       | Manrope   | Regular | Standard body text            |
| **Small**| 14px       | Manrope   | Regular | Secondary text, form hints    |
| **Tiny** | 12px       | Manrope   | Regular | Captions, small UI text       |
| **Code** | 14px       | Mono      | Regular | Transaction data, IDs, codes  |

---

## Text Hierarchy

### Visual Hierarchy Example

```
H1: Dashboard
    H2: Cash Position           ← Section header
    Data: $45,234.56            ← Monospace number
    Description: Updated 2 min ago  ← Small text

    H2: Recent Transactions     ← Section header
    Table rows:
    - Description (Body)
    - Amount: $1,234.56         ← Monospace
    - Category (Small)
```

### Line Height

- **Headings:** 1.2x font-size (tight, authoritative)
- **Body:** 1.6x font-size (readable, spacious)
- **Code/Data:** 1.4x font-size (clear, scannable)

### Letter Spacing

- **Headings:** -0.5px (tighter, more impact)
- **Body:** 0px (normal, optimal readability)
- **Code/Data:** 0px (fixed-width inherent)

---

## Font Weights

### Newsreader

| Weight   | Use            |
| -------- | -------------- |
| Regular  | Body in serif  |
| Medium   | Secondary     |
| Semibold | H4, H5, H6    |
| Bold     | H1, H2, H3    |

### Manrope

| Weight   | Use                           |
| -------- | ----------------------------- |
| Regular  | Body, labels, form text       |
| Semibold | Emphasis, column headers      |
| Bold     | Strong emphasis, button text  |

### JetBrains Mono

| Weight   | Use                       |
| -------- | ------------------------- |
| Regular  | All numbers and codes     |
| Semibold | Emphasized numbers/codes  |

---

## Implementation

### In CSS

```css
/* Headings */
h1, h2, h3 {
  font-family: 'Newsreader', serif;
}

h1 {
  font-size: 48px;
  font-weight: bold;
}

/* Body */
body, p, span {
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

/* Money */
.amount, .currency, [data-type="currency"] {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}
```

### In Tailwind

```js
theme: {
  fontFamily: {
    'display': ['Newsreader', 'serif'],
    'sans': ['Manrope', 'sans-serif'],
    'mono': ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    'h1': ['48px', { lineHeight: '1.2' }],
    'h2': ['36px', { lineHeight: '1.2' }],
    'h3': ['28px', { lineHeight: '1.2' }],
    'body': ['16px', { lineHeight: '1.6' }],
    'small': ['14px', { lineHeight: '1.6' }],
    'code': ['14px', { lineHeight: '1.4', letterSpacing: '0' }],
  }
}
```

Usage:

```jsx
<h1 className="text-h1 font-display">Dashboard</h1>
<p className="text-body font-sans">Body text here</p>
<span className="text-code font-mono">$1,234.56</span>
```

---

## Special Cases

### Buttons

Use **Manrope Semibold** for button text to provide weight differentiation from body text:

```jsx
<button className="font-semibold">Add Invoice</button>
```

### Table Headers

Use **Manrope Semibold** for column headers to create clear visual hierarchy:

```jsx
<th className="font-semibold">Amount</th>
```

### Numbers in Tables

Always use **JetBrains Mono**, left-aligned:

```jsx
<td className="font-mono text-right">$1,234.56</td>
```

### Form Labels

Use **Manrope Regular** with `text-small`:

```jsx
<label className="text-small font-sans">Invoice Amount</label>
```

---

## Accessibility

- **Minimum font size:** 12px (captions only)
- **Standard reading:** 16px minimum
- **Contrast ratio:** All text meets WCAG AA (4.5:1 for normal, 3:1 for large text)
- **Font selection:** All fonts fully support Latin + extended characters

---

## See Also

- [`colors.md`](./colors.md) - How colors pair with typography
- [`spacing-layout.md`](./spacing-layout.md) - Type + spacing relationships
- [`philosophy.md`](./philosophy.md) - Why we prioritize readability
