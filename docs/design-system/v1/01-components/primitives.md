# Primitive Components

> **Purpose:** Reusable UI building blocks used throughout Akount
>
> **Last Updated:** 2026-02-04

## Overview

Primitive components are the foundational building blocks that combine to create more complex UI patterns and screens. They are:

- **Atomically functional** - Each does one thing well
- **Composable** - Combine to create patterns and screens
- **Accessible** - Full keyboard/screen reader support
- **Brand-consistent** - Use Akount design tokens
- **Responsive** - Work across desktop, tablet, mobile

---

## Buttons

### Types

**Primary Button** (Call-to-Action)
- Background: `--ak-orange-500`
- Text: White
- Use for: Main actions (Save, Post, Submit, Confirm)
- Hover: `--ak-orange-600`
- Disabled: Gray with opacity

**Secondary Button** (Alternative Action)
- Background: `--ak-violet-100`
- Text: `--ak-violet-700`
- Use for: Alternative paths (Cancel, Skip, More options)
- Hover: `--ak-violet-200`

**Ghost Button** (Low-Priority)
- Background: Transparent
- Border: 1px `--ak-border-color`
- Text: `--foreground`
- Use for: Tertiary actions (Learn more, View details)
- Hover: Light background

**Danger Button** (Destructive)
- Background: `hsl(0, 84%, 60%)` (red)
- Text: White
- Use for: Delete, Remove, Hard actions
- Requires confirmation

### States

```
Normal     → Hover     → Pressed    → Disabled
 ↓           ↓           ↓            ↓
[Button]   [Button*]  [Button↓]   [Button]
           (lighter)  (darker)    (grayed)
```

### Properties

- **Size:** sm (32px), md (40px), lg (48px)
- **Width:** Auto, Block (full-width)
- **Loading:** Show spinner, disable interaction
- **Icon:** Optional left/right icon
- **Text:** Uppercase labels (e.g., "POST ENTRY")

### Accessibility

- Keyboard: Tab, Enter/Space to activate
- Screen reader: Button role + descriptive label
- Focus: Visible 2px ring (brand color)
- Minimum touch target: 44px

---

## Inputs

### Text Input

```
Label
[Placeholder text............]
 ↑
Icon (optional)
```

**States:**
- Empty (placeholder visible)
- Focused (border color, cursor)
- Filled (value shown)
- Error (red border, error message below)
- Disabled (gray, no interaction)

**Types:**
- Text (default)
- Number (numeric keyboard on mobile)
- Email (email keyboard)
- Password (masking)
- Search (with clear button)

### Textarea

- Multi-line text input
- Auto-expand as user types (up to max rows)
- Character counter (optional)
- Format hint below

### Dropdown/Select

```
Label
[Selected value ........................▼]

▼ Option 1
  Option 2
  Option 3
  (searchable for large lists)
```

**Features:**
- Keyboard navigation (arrow keys)
- Search/filter (type to filter)
- Multi-select variant
- Grouped options
- Option icons

### Amount Input

**Special type for financial data:**
- Monospace font (JetBrains Mono)
- Always shows sign (+/–) and currency code
- Right-aligned
- Format: `–$1,234.56 CAD`
- Validation: Rejects non-numeric input

```typescript
<AmountInput
  value={1234.56}
  currency="CAD"
  sign="negative"
  onChange={(value) => {...}}
/>
```

---

## Badges

### Status Badges

Show transaction/entry state:

| Badge | Color | Use Case |
|-------|-------|----------|
| ✓ Reconciled | Green | Bank matched |
| ✨ AI Categorized | Violet | AI suggestion applied |
| ⚠ Review Needed | Amber | Needs attention |
| 🔒 Locked | Gray | Fiscal period closed |
| ✗ Error | Red | Validation error |

### Entity Badge

Shows which legal entity a row/transaction belongs to:

```
🇨🇦 Canadian Corp
```

- Flag emoji
- Short entity name
- Hover → Full name + tax jurisdiction
- Sticky in table (always visible)

### Confidence Badge

Shows AI confidence level:

```
87% confident
High    ████░░░░
Medium  ███░░░░░
Low     ██░░░░░░
```

- Percentage + visual bar
- Three levels: High (75+%), Medium (50-74%), Low (<50%)
- Used in AI suggestion cards

### Pill Badge

General-purpose category label:

```
[✕ Marketing]  [✕ Cloud Services]  [+ Add tag]
```

- Optional close button
- Optional add button
- Color-coded by category

---

## Chips

### Suggestion Chip

Inline suggestion (appears next to form field):

```
Category: Marketing
AI Suggests: Cloud Services  [Apply] [Ignore]
              87%
```

**States:**
- Show (suggested)
- Hide (dismissed)
- Applied (shows checkmark)

### Filter Chip

Removable filter tag:

```
[Date: This Month ✕]  [Entity: All ✕]  [Category ✕]
```

- Shows active filters
- Clickable to remove
- Visual feedback on active

### Action Chip

Small clickable element:

```
[View Details]  [Edit]  [Split]
```

- Icon optional
- Compact size
- No background, text-only style

---

## Icons

### Guidelines

- **Consistency:** Use same icon set throughout
- **Meaning:** Icon should be self-explanatory
- **Size:** 16px (inline), 20px (UI), 24px (large)
- **Color:** Inherit text color or use semantic color
- **Accessibility:** Icon + text (never icon-only unless labeled)

### Common Icons

| Icon | Use | Semantic |
|------|-----|----------|
| 🔄 | Reconcile, sync | Neutral |
| ✓ | Confirmed, done | Success (green) |
| ✨ | AI suggestion | AI (violet) |
| ⚠ | Warning, review | Attention (amber) |
| ✕ | Close, delete, remove | Danger (red) |
| 🔒 | Locked, secure | Locked (gray) |
| ↑ | Inflow, income | Income (green) |
| ↓ | Outflow, expense | Expense (red) |
| ⟷ | Transfer | Transfer (slate) |

---

## Form Groups

### Layout

```
Label *
[Input field with helper text]
⚠ Error message (if applicable)
Hint text below (optional)
```

**Spacing:**
- Label to input: 8px
- Input to helper: 6px
- Helper to next field: 16px

### Label

- Required fields marked with `*`
- Font: Medium weight
- Size: 14px
- Color: `--foreground`

### Helper Text

- Size: 12px
- Color: `--muted-foreground`
- Below input, explains purpose

### Error Message

- Size: 12px
- Color: Red (`hsl(0, 84%, 60%)`)
- Icon: ✕ or ⚠
- Below input, only shown on error
- Specific guidance (not just "Invalid")

---

## Component Hierarchy

```
Primitives (this file)
    ↓
Composed into → Patterns (forms, tables, navigation)
    ↓
Which build → Screens (dashboards, transactions)
```

**Example:**
- Primitive: `<AmountInput />`
- Pattern: `<JournalEntryForm />` (composes AmountInput + Dropdown + etc.)
- Screen: `<DashboardKPIs />` (displays financial data)

---

## Accessibility Checklist

Every primitive must:
- ✓ Support keyboard navigation (Tab, arrow keys, Enter)
- ✓ Have proper ARIA labels and roles
- ✓ Show visible focus indicator (2px ring)
- ✓ Meet WCAG AA contrast (4.5:1 for text)
- ✓ Work with screen readers
- ✓ Handle disabled state visually + functionally
- ✓ Provide error messages accessible to screen readers

---

## Dark Mode

All primitives must support dark mode:
- Text colors invert appropriately
- Borders become lighter
- Hover states adjusted for visibility
- Focus rings remain visible
- Semantic colors (green/red) adjusted for contrast

Test with `[data-theme="dark"]` and `.dark` class.

---

## Performance

- No unnecessary re-renders
- Memoize when appropriate
- Debounce onChange handlers (300ms for search/filter)
- Lazy-load large option lists

---

## See Also

- [`../00-foundations/colors.md`](../00-foundations/colors.md) - Color tokens
- [`../00-foundations/typography.md`](../00-foundations/typography.md) - Font usage
- [`../02-patterns/forms-input.md`](../02-patterns/forms-input.md) - Complex form patterns
- [`../02-patterns/tables-data.md`](../02-patterns/tables-data.md) - Table components
