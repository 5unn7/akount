# Spacing & Layout

> **Extracted from:** Original `Design-philosophy.md` (Section 4: Layout System)
> **Last Updated:** 2026-02-04

## Overview

Layout in Akount follows a consistent grid system with semantic spacing roles. This creates predictable, scannable interfaces that feel organized and trustworthy.

---

## Grid System

### Base Grid

- **Desktop:** 12-column grid
- **Tablet:** 8-column grid
- **Mobile:** Single-column layout

### Layout Constraints

| Property      | Value  |
| ------------- | ------ |
| Max width     | 1440px |
| Sidebar (closed) | 80px |
| Sidebar (open) | 240px |
| Gutter width  | 24px   |

### Example Grid Usage

```
Desktop (12 column):
[Sidebar] [Main Content Area - 11 columns]

Tablet (8 column):
[Sidebar closed] [Main Content - 7 columns]

Mobile:
[Full width, sidebar hidden]
```

---

## Spacing Scale

The spacing scale uses consistent increments based on an 8px baseline:

| Token      | Size  | Meaning                 | Use Cases                            |
| ---------- | ----- | ----------------------- | ------------------------------------ |
| `space-xs` | 4px   | Micro UI                | Icon spacing, tight groups           |
| `space-sm` | 8px   | Compact spacing         | Form field gaps, list items          |
| `space-md` | 16px  | Card padding            | Card internals, component padding    |
| `space-lg` | 24px  | Section spacing         | Section separators, column gaps      |
| `space-xl` | 32px  | Page breathing room     | Section breaks, top-level spacing   |
| `space-2xl`| 48px  | Major breathing room    | Page margins, section breaks         |

### Spacing Relationships

```
Component internal:     space-md (16px)
Between components:     space-lg (24px)
Between sections:       space-xl (32px)
Between major sections: space-2xl (48px)
```

---

## Common Layout Patterns

### Card Layout

```
┌─────────────────────┐
│ space-md (16px)     │
│ ┌─────────────────┐ │
│ │ Card Content    │ │
│ └─────────────────┘ │
│ space-md (16px)     │
└─────────────────────┘

Padding: space-md all sides
```

### Form Spacing

```
┌─────────────────────┐
│ Label               │
│ space-sm (8px)      │
│ [Input Field]       │
│ space-md (16px)     │
│ [Next Field Label]  │
└─────────────────────┘
```

### List/Table Spacing

```
Header Row
space-sm gap between columns (8px)
Item Row
space-sm between list items (8px)
Item Row
space-md below list group (16px)
[Next section]
```

### Section Separators

```
[Section 1 content]
space-xl gap (32px)
[Section 2 content]
space-xl gap (32px)
[Section 3 content]
```

---

## Container Layouts

### Full-Width Container

Maximum width with side margins:

```css
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 space-xl; /* 32px on sides */
}
```

### Content Area with Sidebar

```
Sidebar (240px open / 80px closed)
+ Gutter (24px)
+ Main content (remaining space)
```

### Multi-Column Grid

Use Tailwind grid for flexible layouts:

```jsx
<div className="grid grid-cols-12 gap-lg">
  <div className="col-span-8">Main content</div>
  <div className="col-span-4">Sidebar</div>
</div>
```

---

## Responsive Breakpoints

| Breakpoint | Width  | Columns | Sidebar |
| ---------- | ------ | ------- | ------- |
| Mobile     | <768px | 1       | Hidden  |
| Tablet     | 768px+ | 8       | 80px    |
| Desktop    | 1280px+| 12      | 240px   |

### Spacing Adjustments

- **Mobile:** Reduce all spacing by 50% (space-md = 8px)
- **Tablet:** Use normal spacing scale
- **Desktop:** Use normal spacing scale

---

## Component Padding

| Component Type   | Padding      | Example                       |
| ---------------- | ------------ | ----------------------------- |
| **Card**         | space-md     | 16px all sides                |
| **Button**       | space-sm     | 8px vertical, 16px horizontal |
| **Form Field**   | space-sm     | 8px vertical, 12px horizontal |
| **Section**      | space-xl     | 32px all sides                |
| **Modal**        | space-lg     | 24px all sides                |
| **Sidebar Item** | space-md     | 16px vertical, 12px horizontal|

---

## Vertical Rhythm

Maintain consistent vertical spacing for readability:

```
H2 heading (36px)
space-md gap (16px)
Paragraph text (16px, 1.6 line-height)
space-md gap (16px)
Component/Card
space-lg gap (24px)
H2 heading
```

**Rule:** Spaces between elements equal multiples of the baseline 8px.

---

## Implementation

### In CSS

```css
/* Spacing tokens */
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Layout constraints */
  --sidebar-closed: 80px;
  --sidebar-open: 240px;
  --gutter: 24px;
  --max-width: 1440px;
}

/* Common patterns */
.card {
  padding: var(--space-md);
}

.section {
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-xl);
}
```

### In Tailwind

```js
theme: {
  spacing: {
    'xs': '4px',
    'sm': '8px',
    'md': '16px',
    'lg': '24px',
    'xl': '32px',
    '2xl': '48px',
  },
  maxWidth: {
    'container': '1440px',
  }
}
```

Usage:

```jsx
<div className="p-md mb-lg">Card content</div>
<section className="p-lg space-y-xl">Section</section>
```

---

## Special Cases

### Data Tables

- **Column gap:** space-md (16px)
- **Row height:** 48px minimum
- **Cell padding:** space-sm vertical, space-md horizontal

### Modal Dialogs

- **Padding:** space-lg (24px)
- **Gap between title and content:** space-md (16px)
- **Gap between content and actions:** space-lg (24px)

### Navigation

- **Sidebar item height:** 40px minimum
- **Sidebar item padding:** space-md (16px)
- **Icon + text gap:** space-sm (8px)

---

## Accessibility

- **Minimum touch target:** 44px × 44px (mobile)
- **Hover/focus areas:** Minimum 8px padding around
- **Reading width:** Optimal line length 70-80 characters

---

## See Also

- [`colors.md`](./colors.md) - Color in spatial design
- [`typography.md`](./typography.md) - Typography + spacing relationships
- [`philosophy.md`](./philosophy.md) - Why we emphasize calm complexity
