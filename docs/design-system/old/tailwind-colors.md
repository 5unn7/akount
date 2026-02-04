# Tailwind CSS Color Usage

Akount uses Tailwind CSS v4 with three color palettes:

## Primary Color: Orange

Used for primary actions, active states, and brand emphasis.

```tsx
// Backgrounds
bg-orange-50    // Lightest
bg-orange-100
bg-orange-500   // Base
bg-orange-600   // Hover
bg-orange-700   // Active

// Text
text-orange-600
text-orange-700
text-orange-800

// Borders
border-orange-500
border-orange-600

// Ring (focus states)
ring-orange-500
```

## Secondary Color: Violet

Used for secondary actions, hover states, and accents.

```tsx
// Backgrounds
bg-violet-50    // Lightest
bg-violet-100
bg-violet-500   // Base
bg-violet-600   // Hover
bg-violet-700   // Active

// Text
text-violet-600
text-violet-700
text-violet-800

// Borders
border-violet-500
border-violet-600
```

## Neutral Color: Slate

Used for text, backgrounds, borders, and UI chrome.

```tsx
// Backgrounds
bg-slate-50     // Light mode surface
bg-slate-100    // Light mode subtle
bg-slate-900    // Dark mode surface
bg-slate-950    // Dark mode deeper

// Text
text-slate-900  // Primary text (light mode)
text-slate-700  // Secondary text (light mode)
text-slate-500  // Tertiary text (light mode)
text-slate-50   // Primary text (dark mode)
text-slate-300  // Secondary text (dark mode)
text-slate-400  // Tertiary text (dark mode)

// Borders
border-slate-200  // Light mode
border-slate-700  // Dark mode
```

## Dark Mode Support

All color utilities should include dark mode variants:

```tsx
// Example button
<button className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700">
  Click me
</button>

// Example text
<p className="text-slate-900 dark:text-slate-50">
  Body text
</p>

// Example border
<div className="border border-slate-200 dark:border-slate-700">
  Card content
</div>
```

## Responsive Usage

Combine with responsive prefixes for mobile-first design:

```tsx
<div className="
  text-sm sm:text-base md:text-lg
  p-4 md:p-6 lg:p-8
  bg-slate-50 dark:bg-slate-900
">
  Responsive content
</div>
```

## Status Colors

Use Tailwind's semantic colors for status indicators:

```tsx
// Success
bg-green-500 text-green-700

// Warning
bg-amber-500 text-amber-700

// Error
bg-red-500 text-red-700

// Info
bg-blue-500 text-blue-700
```
