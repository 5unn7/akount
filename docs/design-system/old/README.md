# Akount Design System

This directory contains the complete design system for the Akount platform, including colors, typography, spacing, and theming.

## Quick Links

- **[Theme System](./theme-system.md)** - Complete guide to light/dark mode, semantic tokens, and theme switching
- **[Tailwind Colors](./tailwind-colors.md)** - Akount color palette (Orange, Violet, Slate) and usage examples
- **[Typography](./fonts.md)** - Font families (Newsreader, Manrope, JetBrains Mono) and text styles
- **[Design Tokens](./tokens.css)** - CSS custom properties and design tokens

## Design Principles

### 1. Semantic Tokens First

Always prefer semantic tokens (`bg-background`, `text-foreground`) over direct color classes:

```tsx
// ✅ Good - Uses semantic tokens
<div className="bg-background text-foreground">

// ❌ Bad - Direct color classes
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
```

### 2. Brand Consistency

Akount's brand colors remain consistent across light and dark modes:
- **Primary (Orange):** Actions, CTAs, emphasis
- **Secondary (Violet):** Accents, hover states
- **Neutral (Slate):** Text, backgrounds, borders

### 3. Accessibility

All color combinations meet WCAG AA standards for contrast ratios in both light and dark modes.

### 4. Component-Based

Design system is implemented through reusable components in `apps/web/src/components/ui/`.

## Color System

### Brand Colors

| Color | Tailwind Class | Use Case |
|-------|---------------|----------|
| Orange | `bg-orange-500` | Primary actions, brand emphasis |
| Violet | `bg-violet-500` | Secondary actions, accents |
| Slate | `bg-slate-*` | Text, backgrounds, UI chrome |

### Semantic Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | Slate-50 | Slate-900 | Page backgrounds |
| `foreground` | Slate-900 | Slate-50 | Primary text |
| `primary` | Orange-500 | Orange-500 | Primary actions |
| `secondary` | Violet-500 | Violet-500 | Secondary actions |
| `muted` | Slate-100 | Slate-800 | Subtle backgrounds |
| `border` | Slate-200 | Slate-800 | Borders, dividers |

See [Theme System](./theme-system.md) for complete token reference.

## Typography

### Font Families

- **Newsreader** (Serif) - Headings and emphasis
- **Manrope** (Sans-serif) - Body text and UI
- **JetBrains Mono** (Monospace) - Financial data, codes

### Font Weights

- **400 (Regular)** - Body text
- **500 (Medium)** - Labels, emphasized text
- **600 (Semibold)** - Subheadings
- **700 (Bold)** - Main headings

See [Typography](./fonts.md) for detailed usage.

## Components

### UI Components

Located in `apps/web/src/components/ui/`:

- `button.tsx` - Button component with variants
- `card.tsx` - Card containers with header/content/footer
- `input.tsx` - Form inputs
- `badge.tsx` - Status badges
- `theme-toggle.tsx` - Light/dark mode switcher

### Layout Components

Located in `apps/web/src/components/layout/`:

- `Navbar.tsx` - Top navigation bar with theme toggle
- `Sidebar.tsx` - Side navigation menu

## Dark Mode Implementation

### Setup

1. Theme provider wraps the app in `layout.tsx`
2. CSS variables define light/dark colors in `globals.css`
3. Components use semantic tokens automatically
4. Theme toggle allows user preference

### Usage

```tsx
// Automatically works in both modes
<Card>
  <CardTitle>Automatic Dark Mode</CardTitle>
</Card>

// Manual dark mode classes
<div className="bg-slate-100 dark:bg-slate-800">
  Custom styling
</div>

// Access theme in JavaScript
import { useTheme } from 'next-themes';
const { theme } = useTheme();
```

See [Theme System](./theme-system.md) for comprehensive guide.

## Responsive Design

### Breakpoints

Akount uses Tailwind's default breakpoints:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

### Mobile-First

Always design mobile-first, then enhance for larger screens:

```tsx
<div className="
  text-sm sm:text-base md:text-lg
  p-4 md:p-6 lg:p-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
```

## Spacing Scale

Akount uses Tailwind's default spacing scale (0.25rem = 4px increments):

| Class | Size | Usage |
|-------|------|-------|
| `p-2` | 8px | Tight padding |
| `p-4` | 16px | Standard padding |
| `p-6` | 24px | Card padding |
| `p-8` | 32px | Section padding |
| `gap-2` | 8px | Tight gaps |
| `gap-4` | 16px | Standard gaps |

## Status Colors

| Status | Color | Tailwind Class |
|--------|-------|---------------|
| Success | Green | `bg-green-500` |
| Warning | Amber | `bg-amber-500` |
| Error | Red | `bg-red-500` |
| Info | Blue | `bg-blue-500` |

## Getting Started

### For Designers

1. Review [Theme System](./theme-system.md) for color usage
2. Check [Typography](./fonts.md) for text styles
3. Use semantic tokens instead of direct colors
4. Design for both light and dark modes

### For Developers

1. Use existing components from `apps/web/src/components/ui/`
2. Apply semantic tokens (`bg-background`, `text-foreground`, etc.)
3. Test components in both light and dark modes
4. Follow responsive design patterns

### For New Components

1. Use shadcn/ui as base: `npx shadcn-ui@latest add [component]`
2. Customize with Akount semantic tokens
3. Ensure dark mode compatibility
4. Add to component library

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [Radix UI Primitives](https://www.radix-ui.com/)

## Questions?

Refer to specific guides for detailed information:
- Theme questions → [Theme System](./theme-system.md)
- Color questions → [Tailwind Colors](./tailwind-colors.md)
- Typography questions → [Typography](./fonts.md)
