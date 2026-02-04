# Typography

Akount uses three Google Fonts for typography:

## Font Families

### Newsreader (Headings)
A classic serif font used for headings and emphasis.

**Google Fonts Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&display=swap" rel="stylesheet">
```

**CSS:**
```css
font-family: 'Newsreader', serif;
```

**Tailwind v4:**
```tsx
<h1 className="font-[family-name:Newsreader]">Heading</h1>
```

### Manrope (Body)
A modern sans-serif font used for body text and UI elements.

**Google Fonts Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**CSS:**
```css
font-family: 'Manrope', sans-serif;
```

**Tailwind v4:**
```tsx
<p className="font-[family-name:Manrope]">Body text</p>
```

### JetBrains Mono (Monospace)
A coding font used for numerical data, account codes, and technical content.

**Google Fonts Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

**CSS:**
```css
font-family: 'JetBrains Mono', monospace;
```

**Tailwind v4:**
```tsx
<code className="font-[family-name:JetBrains_Mono]">$1,234.56</code>
```

## All Fonts Combined

For convenience, here's a single import for all three fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

## Usage Guidelines

### Headings (Newsreader)
```tsx
<h1 className="font-[family-name:Newsreader] text-4xl font-bold text-slate-900 dark:text-slate-50">
  Main Heading
</h1>

<h2 className="font-[family-name:Newsreader] text-3xl font-semibold text-slate-900 dark:text-slate-50">
  Section Heading
</h2>

<h3 className="font-[family-name:Newsreader] text-2xl font-semibold text-slate-900 dark:text-slate-50">
  Subsection Heading
</h3>
```

### Body Text (Manrope)
```tsx
<p className="font-[family-name:Manrope] text-base text-slate-700 dark:text-slate-300">
  Regular body text
</p>

<span className="font-[family-name:Manrope] text-sm text-slate-600 dark:text-slate-400">
  Small text
</span>
```

### Monospace (JetBrains Mono)
```tsx
<span className="font-[family-name:JetBrains_Mono] text-sm text-slate-900 dark:text-slate-50">
  $12,345.67 CAD
</span>

<code className="font-[family-name:JetBrains_Mono] text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
  Account #1001
</code>
```

## Font Weights

- **Regular (400):** Default body text
- **Medium (500):** Emphasized text, labels
- **Semibold (600):** Subheadings, important UI elements
- **Bold (700):** Main headings, strong emphasis

```tsx
<p className="font-normal">Regular (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>
```

## Responsive Typography

Use responsive text sizes for better mobile experience:

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>

<p className="text-sm sm:text-base md:text-lg">
  Responsive Body
</p>
```
