# Adding New Design Tokens

This guide explains how to add new design tokens to the Akount design system. Design tokens are semantic CSS variables that control colors, spacing, and other design properties across the entire application.

## Why Design Tokens?

Design tokens provide:
- **Single Source of Truth:** Change a color in one place, update everywhere
- **Consistency:** All components use the same values
- **Scalability:** Easy to add new colors without modifying components
- **Multi-Tenancy Ready:** Tokens can be overridden per tenant in the future
- **Dark Mode Support:** Light and dark variants managed in one place

## Token System Overview

The Akount design token system uses:
1. **CSS Variables** (`globals.css`) - Define token values in HSL format
2. **Tailwind Config** (`tailwind.config.ts`) - Map CSS variables to Tailwind classes
3. **Components** - Use Tailwind classes or `cn()` utility

### Token Structure

```
globals.css (CSS Variables)
    ↓
tailwind.config.ts (Tailwind Mappings)
    ↓
Components (Tailwind classes or cn() utility)
```

## Step-by-Step: Adding a New Token

### Example: Add `--status-pending` Token

#### Step 1: Add CSS Variable

Edit `apps/web/src/app/globals.css`:

```css
@layer base {
  :root {
    /* Existing tokens... */
    --ring: 25 95% 53%; /* orange-500 for focus rings */

    /* NEW: Add status color for pending state */
    --status-pending: 43 96% 56%; /* amber-500 */

    --radius: 0.5rem;
  }

  .dark {
    /* Existing tokens... */
    --ring: 25 95% 53%; /* orange-500 */

    /* NEW: Dark mode variant (same hue, adjusted for contrast) */
    --status-pending: 43 96% 56%; /* amber-500 (same in dark mode) */
  }
}
```

**HSL Format:**
- First value: Hue (0-360°)
- Second value: Saturation (0-100%)
- Third value: Lightness (0-100%)

Example: `43 96% 56%` = amber-500 color

**Tip:** Use [uicolors.app](https://uicolors.app) to convert hex colors to HSL format.

#### Step 2: Add Tailwind Mapping

Edit `apps/web/tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        // ... existing colors ...

        // NEW: Map the CSS variable to a Tailwind color name
        statusPending: 'hsl(var(--status-pending))',
      },
      // ... rest of config
    },
  },
}
```

#### Step 3: Use in Components

Now you can use the token in two ways:

**Option A: Tailwind Class**
```tsx
<div className="bg-statusPending text-white">
  Order Pending
</div>
```

**Option B: cn() Utility** (when conditionally applying classes)
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "p-4 rounded-lg",
  status === 'pending' && "bg-statusPending text-white",
  status === 'completed' && "bg-green-500 text-white"
)}>
  {statusLabel}
</div>
```

#### Step 4: Verify in Both Modes

Test your token in light and dark modes:

```bash
# Start dev server
npm run dev

# Visit your app and check:
# 1. Light mode (default)
# 2. Dark mode (toggle theme)
```

Visual checklist:
- [ ] Color looks correct in light mode
- [ ] Color looks correct in dark mode
- [ ] Text is readable (contrast is good)
- [ ] Hover/focus states work if applicable

#### Step 5: Verify Color Contrast

For accessibility, ensure text contrast meets WCAG AA standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum

**Tools:**
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)

**Example Verification:**
```
Color: --status-pending (amber-500)
Hex: #FBBF24
Background: white (#FFFFFF)
Contrast: 7.2:1 ✓ WCAG AAA (best)
```

## Common Token Types

### Semantic Colors

Used for UI semantics (not specific colors):

```css
--primary: 25 95% 53%;           /* Brand primary (Orange) */
--secondary: 262 83% 58%;        /* Brand secondary (Violet) */
--accent: 262 83% 58%;           /* Accent highlights */
--destructive: 0 84% 60%;        /* Danger/Delete actions */
--muted: 210 40% 96%;            /* Disabled/Secondary text */
```

**When to add:** When a semantic concept (success, warning, error, info) needs representation across multiple components.

### Status Colors

Used for state indication:

```css
--status-success: 134 61% 41%;    /* Green for success */
--status-warning: 38 92% 50%;     /* Amber for warning */
--status-error: 0 84% 60%;        /* Red for error */
--status-info: 198 93% 60%;       /* Blue for info */
```

**When to add:** When you have a consistent status system that appears in multiple places.

### Chart/Visualization Colors

Used for data visualization:

```css
--chart-1: 25 95% 53%;            /* Primary (orange) */
--chart-2: 262 83% 58%;           /* Secondary (violet) */
/* Add more as needed for your specific charts */
```

**When to add:** When building dashboards and reports (Phase 5).

## Updating Existing Tokens

### Scenario: Brand Color Change

If the primary brand color needs to change from orange to red:

1. Update CSS variable in `globals.css`:
```css
--primary: 0 84% 60%;  /* Change from orange to red */
```

2. **No other changes needed!** All components automatically use the new color.

### Scenario: Dark Mode Adjustment

If a color needs to be lighter in dark mode for contrast:

1. Update the `.dark` variant in `globals.css`:
```css
.dark {
  --secondary: 262 83% 68%;  /* Lightened from 58% to 68% for dark mode */
}
```

2. **No component changes needed!** CSS automatically applies the right value.

## Testing Your Token

### Unit Test Example

Create `apps/web/__tests__/design-tokens.test.ts`:

```typescript
describe('Design Tokens', () => {
  it('status-pending is defined', () => {
    const root = document.documentElement
    const color = getComputedStyle(root).getPropertyValue('--status-pending')
    expect(color.trim()).toBe('43 96% 56%')
  })

  it('status-pending renders correctly in light mode', () => {
    const element = document.createElement('div')
    element.className = 'bg-statusPending'
    document.body.appendChild(element)

    const styles = getComputedStyle(element)
    expect(styles.backgroundColor).toBeTruthy()

    document.body.removeChild(element)
  })
})
```

### Manual Testing

1. Create a test component:
```tsx
export function TokenTest() {
  return (
    <div className="space-y-4 p-8">
      <div className="h-16 bg-statusPending rounded-lg flex items-center justify-center text-white">
        Status Pending Token Test
      </div>
      <p className="text-sm text-muted-foreground">
        This should show your new color in light mode and adjust in dark mode
      </p>
    </div>
  )
}
```

2. Add to a test page and verify in browser

## Common Mistakes to Avoid

### ❌ Hardcoding Colors in Components

```typescript
// BAD - Color hardcoded, not using design tokens
<div className="bg-[#FBBF24] text-white">
  Hardcoded color
</div>
```

### ✅ Using Design Tokens

```typescript
// GOOD - Uses design token system
<div className="bg-statusPending text-white">
  Token-based color
</div>
```

### ❌ Forgetting Dark Mode

```css
/* BAD - Only light mode */
--status-warning: 38 92% 50%;
```

### ✅ Supporting Both Modes

```css
/* GOOD - Light mode */
:root {
  --status-warning: 38 92% 50%;
}

/* GOOD - Dark mode */
.dark {
  --status-warning: 38 92% 50%;  /* Adjust if needed for contrast */
}
```

## Guidelines for New Tokens

### Add a token when:
- ✅ A color/style is used in 2+ places
- ✅ A semantic concept needs consistent styling
- ✅ A design system concept (status, severity level)
- ✅ Future multi-tenant customization is planned

### Don't add a token for:
- ❌ One-off styling for a single component
- ❌ Highly specific overrides that break semantics
- ❌ Layout values (spacing, sizing) not yet systematized
- ❌ Premature "future" tokens not needed yet

## Token Naming Convention

Use clear, semantic names:

**Good:**
- `--status-success`
- `--primary`
- `--destructive`
- `--muted-foreground`

**Bad:**
- `--color1`
- `--blue-thing`
- `--button-bg`
- `--text-dark`

## Current Token Reference

### Base Semantic Tokens

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--primary` | Orange-500 | Orange-500 | Brand primary |
| `--secondary` | Violet-500 | Violet-500 | Brand secondary |
| `--accent` | Violet-500 | Violet-500 | Highlights |
| `--destructive` | Red-500 | Red-700 | Danger/Delete |
| `--muted` | Slate-100 | Slate-800 | Disabled text |
| `--background` | Slate-50 | Slate-900 | App background |
| `--foreground` | Slate-900 | Slate-50 | Text color |
| `--card` | White | Slate-800 | Card background |
| `--border` | Slate-200 | Slate-800 | Borders |
| `--ring` | Orange-500 | Orange-500 | Focus rings |

## Next Steps

1. **Understand existing tokens:** Review `apps/web/src/app/globals.css`
2. **Review tailwind.config.ts:** See how tokens map to Tailwind
3. **Add your token:** Follow steps 1-5 above
4. **Test thoroughly:** Both light/dark modes, contrast ratio
5. **Update this guide:** If adding a common pattern, document it

## Questions?

Refer to:
- **Theme System Design:** `docs/design-system/theme-system.md`
- **Components Reference:** `docs/design-system/COMPONENTS-REFERENCE.md`
- **Tailwind Docs:** [https://tailwindcss.com/docs/customizing-colors](https://tailwindcss.com/docs/customizing-colors)
- **WCAG Contrast:** [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)
