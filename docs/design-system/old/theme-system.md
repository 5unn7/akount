# Akount Theme System

## Overview

Akount uses a semantic token-based theming system built on CSS variables and `next-themes`. This allows seamless switching between light and dark modes while maintaining consistent brand identity with Orange (primary), Violet (secondary), and Slate (neutral) colors.

## Architecture

### Theme Provider

The app is wrapped with `ThemeProvider` (from `next-themes`) in the root layout:

```tsx
import { ThemeProvider } from '@/components/providers/ThemeProvider';

<ThemeProvider>
  {children}
</ThemeProvider>
```

This provides:
- System preference detection
- Persistent theme storage (localStorage)
- No flash of unstyled content (FOUC)
- Seamless theme switching

### CSS Variables

All colors are defined as CSS variables in HSL format for easy manipulation:

```css
:root {
  --primary: 25 95% 53%; /* Orange-500 */
  --secondary: 258 90% 66%; /* Violet-500 */
  --background: 210 40% 98%; /* Slate-50 */
  /* ... */
}

.dark {
  --primary: 25 95% 53%; /* Orange-500 (same in dark) */
  --background: 222 47% 11%; /* Slate-900 */
  /* ... */
}
```

## Semantic Tokens

### Background & Foreground

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | Slate-50 | Slate-900 | Main page background |
| `--foreground` | Slate-900 | Slate-50 | Primary text color |

```tsx
<div className="bg-background text-foreground">
  Content
</div>
```

### Card System

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--card` | White | Slate-800 | Card backgrounds |
| `--card-foreground` | Slate-900 | Slate-50 | Text on cards |

```tsx
<Card className="bg-card text-card-foreground">
  <CardContent>...</CardContent>
</Card>
```

### Brand Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | Orange-500 | Orange-500 | Primary actions, CTAs |
| `--primary-foreground` | White | White | Text on primary |
| `--secondary` | Violet-500 | Violet-500 | Secondary actions |
| `--secondary-foreground` | White | White | Text on secondary |

```tsx
<Button variant="default" className="bg-primary text-primary-foreground">
  Primary Action
</Button>
```

### Accent & Muted

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--accent` | Violet-500 | Violet-500 | Hover states, highlights |
| `--accent-foreground` | White | White | Text on accent |
| `--muted` | Slate-100 | Slate-800 | Subtle backgrounds |
| `--muted-foreground` | Slate-600 | Slate-400 | Secondary text |

```tsx
<div className="bg-muted text-muted-foreground">
  Secondary information
</div>
```

### Borders & Inputs

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--border` | Slate-200 | Slate-800 | Border color |
| `--input` | Slate-200 | Slate-800 | Input borders |
| `--ring` | Orange-500 | Orange-500 | Focus rings |

```tsx
<input className="border border-input focus:ring-2 focus:ring-ring" />
```

### Status Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--destructive` | Red-500 | Red-700 | Error states, delete actions |
| `--destructive-foreground` | White | Slate-50 | Text on destructive |

```tsx
<Button variant="destructive">Delete</Button>
```

### Chart Colors

| Token | Color | Usage |
|-------|-------|-------|
| `--chart-1` | Orange-500 | Primary chart color |
| `--chart-2` | Violet-500 | Secondary chart color |
| `--chart-3` | Teal | Tertiary chart color |
| `--chart-4` | Yellow | Quaternary chart color |
| `--chart-5` | Pink | Quinary chart color |

## Theme Toggle

Use the `ThemeToggle` component to allow users to switch themes:

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

<ThemeToggle />
```

This provides three options:
1. **Light** - Light mode
2. **Dark** - Dark mode
3. **System** - Follow system preference

## Usage in Components

### Automatic Dark Mode Support

Most components automatically support dark mode through semantic tokens:

```tsx
// Automatically works in both modes
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
</Card>
```

### Manual Dark Mode Classes

For custom styling, use Tailwind's `dark:` prefix:

```tsx
<div className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50">
  Custom styled content
</div>
```

### Accessing Theme in Components

```tsx
'use client';

import { useTheme } from 'next-themes';

export function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      Current theme: {theme}
      <button onClick={() => setTheme('dark')}>Dark</button>
    </div>
  );
}
```

## Best Practices

### 1. Prefer Semantic Tokens

**Good:**
```tsx
<div className="bg-background text-foreground border border-border">
```

**Bad:**
```tsx
<div className="bg-white dark:bg-slate-900 text-black dark:text-white border border-gray-200 dark:border-gray-800">
```

### 2. Brand Colors Stay Consistent

Orange (primary) and Violet (secondary) maintain the same vibrancy in both modes:

```tsx
// Same orange in light and dark
<Button className="bg-primary text-primary-foreground">
  Action
</Button>
```

### 3. Use Appropriate Contrast

Ensure text remains readable in both modes:

```tsx
// Good contrast in both modes
<p className="text-muted-foreground">Secondary text</p>
```

### 4. Test Both Modes

Always test components in both light and dark modes to ensure proper contrast and readability.

## Color Palette Reference

### Light Mode Palette

- **Background:** Slate-50 (very light)
- **Surface:** White
- **Text:** Slate-900 (very dark)
- **Border:** Slate-200 (light gray)
- **Primary:** Orange-500 (vibrant orange)
- **Secondary:** Violet-500 (vibrant violet)

### Dark Mode Palette

- **Background:** Slate-900 (very dark)
- **Surface:** Slate-800 (dark)
- **Text:** Slate-50 (very light)
- **Border:** Slate-800 (dark gray)
- **Primary:** Orange-500 (same vibrant orange)
- **Secondary:** Violet-500 (same vibrant violet)

## Migration Guide

If you have existing components using hardcoded Tailwind colors:

### Before:
```tsx
<div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
  <h2 className="text-slate-900 dark:text-slate-50">Title</h2>
  <p className="text-slate-600 dark:text-slate-400">Description</p>
</div>
```

### After:
```tsx
<div className="bg-card border border-border">
  <h2 className="text-card-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>
```

## Technical Details

### CSS Variable Format

Colors use HSL (Hue, Saturation, Lightness) without the `hsl()` wrapper:

```css
/* Correct */
--primary: 25 95% 53%;

/* Incorrect */
--primary: hsl(25, 95%, 53%);
```

This allows Tailwind to apply opacity modifiers:

```tsx
<div className="bg-primary/50">50% opacity orange</div>
```

### Tailwind Configuration

Colors are registered in `tailwind.config.ts`:

```ts
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))'
  },
  // ...
}
```

This enables usage like:

```tsx
<div className="bg-primary text-primary-foreground" />
```

## Resources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [HSL Color System](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl)
