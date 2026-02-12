---
name: quality:design-system-enforce
description: Validate UI follows Akount design system
model: claude-haiku-4-20250101  # Fast pattern matching
aliases:
  - design-check
  - ui-check
  - design-system
keywords:
  - design
  - ui
  - styling
  - components
  - colors
  - fonts
---

# Design System Enforcer

Ensures UI code follows Akount design system rules.

## Design System Rules

**Location:** `docs/design-system/`

**Colors (Tailwind semantic tokens):**
- ✅ Use: `bg-background`, `text-foreground`, `bg-primary`, `text-primary`
- ❌ Avoid: `bg-white`, `text-black`, `bg-orange-500`, `text-slate-900`

**Palette:**
- Primary: Orange (50-950 scale)
- Secondary: Violet (50-950 scale)
- Neutral: Slate (50-950 scale)

**Typography:**
- Headings: Newsreader (serif)
- Body: Manrope (sans-serif)
- Code: JetBrains Mono (monospace)

**Components:**
- Use shadcn/ui components
- Prefer composition over custom
- Dark mode support required

## What to Check

1. **Color Usage:** Semantic tokens only
2. **Font Families:** Correct variables used
3. **Component Patterns:** shadcn/ui preferred
4. **Dark Mode:** All colors have dark variants
5. **Spacing:** Consistent scale (4px increments)

## Usage

```bash
/quality:design-system-enforce
```

Checks recent UI changes against design system rules.

## Review Process

### Step 1: Find UI Files

```bash
# Find all UI components
Glob "apps/web/**/*.{tsx,ts,css}"

# Check recent changes
git diff main --name-only | grep -E '\.(tsx|css)$'
```

### Step 2: Check Color Usage

**Pattern to find:**
```typescript
// ❌ BAD - Hardcoded colors
className="bg-white text-black"
className="bg-orange-500"
className="text-slate-900"

// ✅ GOOD - Semantic tokens
className="bg-background text-foreground"
className="bg-primary text-primary-foreground"
```

**Search for violations:**
```bash
Grep "bg-(white|black|slate-[0-9]|orange-[0-9]|violet-[0-9])" apps/web/ --type=tsx
```

### Step 3: Check Typography

**Pattern to find:**
```typescript
// ❌ BAD - Hardcoded fonts
style={{ fontFamily: 'Arial' }}
className="font-sans"

// ✅ GOOD - Design system fonts
className="font-heading"  // Newsreader
className="font-body"     // Manrope
className="font-mono"     // JetBrains Mono
```

### Step 4: Check Component Usage

**Look for custom components that should use shadcn/ui:**
```typescript
// ❌ BAD - Custom button
<button className="rounded px-4 py-2 bg-blue-500">

// ✅ GOOD - shadcn/ui Button
import { Button } from '@/components/ui/button'
<Button variant="default">
```

### Step 5: Check Dark Mode

**Every color must have dark variant:**
```typescript
// ❌ BAD - No dark mode
className="bg-white"

// ✅ GOOD - Dark mode support
className="bg-background"  // Uses dark:bg-slate-950 automatically
```

## Common Violations

### 1. Hardcoded Colors

**Issue:**
```tsx
<div className="bg-white border border-gray-200">
```

**Fix:**
```tsx
<div className="bg-background border border-border">
```

### 2. Inline Styles for Colors

**Issue:**
```tsx
<div style={{ backgroundColor: '#fff' }}>
```

**Fix:**
```tsx
<div className="bg-background">
```

### 3. Wrong Font Variables

**Issue:**
```tsx
<h1 className="font-sans">
```

**Fix:**
```tsx
<h1 className="font-heading">
```

### 4. Custom Components Instead of shadcn/ui

**Issue:**
```tsx
<button onClick={...} className="rounded-md bg-orange-500 px-4 py-2">
```

**Fix:**
```tsx
import { Button } from '@/components/ui/button'
<Button onClick={...}>
```

### 5. No Dark Mode Consideration

**Issue:**
```tsx
<div className="bg-slate-50 text-slate-900">
```

**Fix:**
```tsx
<div className="bg-muted text-muted-foreground">
```

## Approved Patterns

### Colors

```tsx
// Background colors
bg-background          // Main background
bg-card               // Card background
bg-popover            // Popover background
bg-primary            // Primary actions
bg-secondary          // Secondary actions
bg-muted              // Muted backgrounds
bg-accent             // Accent backgrounds
bg-destructive        // Destructive actions

// Text colors
text-foreground       // Main text
text-primary          // Primary colored text
text-secondary        // Secondary colored text
text-muted-foreground // Muted text
text-accent-foreground // Accent text
text-destructive      // Error text

// Border colors
border-border         // Default borders
border-input          // Input borders
border-ring           // Focus rings
```

### Typography

```tsx
// Headings (Newsreader)
<h1 className="font-heading text-4xl">
<h2 className="font-heading text-3xl">

// Body (Manrope)
<p className="font-body text-base">

// Code (JetBrains Mono)
<code className="font-mono">
```

### Components

```tsx
// Always use shadcn/ui components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
```

## Spacing Scale

Use Tailwind's spacing scale (4px increments):

```tsx
// ✅ GOOD
p-4    // 16px
m-8    // 32px
gap-2  // 8px

// ❌ BAD
p-[13px]  // Arbitrary value
m-[25px]  // Off-scale
```

## Output Format

### Summary
- **Files Checked:** X files
- **Violations Found:** Y violations
- **Severity:** [Low / Medium / High]

### Violations

For each violation:
```
❌ File: apps/web/components/InvoiceCard.tsx:45
Pattern: bg-white
Should use: bg-background
Severity: Medium
Auto-fix: Available
```

### Auto-Fix Available?

If violations are simple find/replace:
```bash
# Suggested fix
sed -i 's/bg-white/bg-background/g' apps/web/components/InvoiceCard.tsx
```

### Approval

- ✅ **APPROVED** - Follows design system
- ⚠️ **SUGGESTIONS** - Minor improvements
- ❌ **REQUIRES CHANGES** - Design system violations

## Related Resources

- `docs/design-system/tailwind-colors.md` - Color palette
- `docs/design-system/fonts.md` - Typography system
- `docs/design-system/tokens.css` - CSS custom properties
- shadcn/ui documentation (external)
