# 🎨 Akount Screen Builder v2.0

**Full-featured Figma plugin for building screens with the Akount design system.**

Build production-ready screens using 24+ shadcn/ui components with Akount branding — all design tokens built-in.

---

## ✨ Features

### 📦 Component Library (24+ Components)

**Buttons** (6 variants)
- Primary, Destructive, Outline, Secondary, Ghost, Link
- 4 sizes: Default, Small, Large, Icon

**Badges** (6 variants)
- Default, Secondary, Destructive, Success, Warning, Outline

**Cards** (2 variants)
- Default (solid background)
- Glass (glassmorphism with blur)

**Form Inputs**
- Text Input (with placeholder)
- Table (configurable rows/columns)

**Custom Akount Components**
- **Stat Card** — Label + Value + Trend (used in dashboards)
- **Skeleton** — Loading placeholder

---

### 🚀 Quick Screens (Pre-built Templates)

1. **📊 Dashboard** — Overview with stat cards + CTAs
2. **📄 Invoice Detail** — Invoice header + status badge
3. **🏦 Banking Overview** — Account cards + transactions table

All screens are **1440x900px** with full Akount branding.

---

## 🎯 How to Use

### Installation

1. **Install dependencies:**
   ```bash
   cd figma-screen-builder-plugin
   npm install
   ```

2. **Compile TypeScript:**
   ```bash
   npm run build
   ```

3. **Import into Figma Desktop:**
   - Open **Figma Desktop**
   - Navigate to **Plugins → Development → Import plugin from manifest**
   - Select the `manifest.json` file from this directory

4. **Run the plugin:**
   - Right-click on canvas → **Plugins → Development → Akount Screen Builder**

### Building Components

1. **Select a tab** — Components, Quick Screens, or Custom
2. **Click a component type** (e.g., Button → Primary)
3. **Configure options** — Label, size, variant, etc.
4. **Click "Create"** — Component appears on canvas

### Quick Screens

1. Navigate to **Quick Screens** tab
2. Click a screen template (Dashboard, Invoice, Banking)
3. Full screen created instantly at cursor position

---

## 🎨 Design Tokens (Built-in)

All components use Akount design tokens from `globals.css`:

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#F59E0B` | CTAs, brand accents |
| `green` | `#34D399` | Income, success states |
| `red` | `#F87171` | Expenses, errors |
| `blue` | `#60A5FA` | Transfers, info |
| `purple` | `#A78BFA` | AI features |
| `teal` | `#2DD4BF` | Teal accent |

### Glass Variants

| Level | Opacity | Use |
|-------|---------|-----|
| Glass 1 | `rgba(255,255,255,0.025)` | Default cards |
| Glass 2 | `rgba(255,255,255,0.04)` | Hover states |
| Glass 3 | `rgba(255,255,255,0.06)` | Active states |

### Spacing

- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px

### Border Radius

- **sm:** 4px
- **md:** 8px (buttons)
- **lg:** 12px (badges)
- **xl:** 16px (cards)

---

## 📋 Component API Reference

### Button

```typescript
createButton(
  label: string,
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link',
  size: 'default' | 'sm' | 'lg' | 'icon',
  x: number,
  y: number
)
```

**Example:**
```javascript
createButton('Sign Up', 'default', 'lg', 100, 100)
```

---

### Badge

```typescript
createBadge(
  label: string,
  variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline',
  x: number,
  y: number
)
```

**Example:**
```javascript
createBadge('NEW', 'success', 200, 50)
```

---

### Card

```typescript
createCard(
  width: number,
  height: number,
  variant: 'default' | 'glass',
  x: number,
  y: number
)
```

**Example:**
```javascript
createCard(400, 300, 'glass', 50, 50)
```

---

### Stat Card (Custom Akount Component)

```typescript
createStatCard(
  label: string,
  value: string,
  trend: string,
  trendPositive: boolean,
  x: number,
  y: number
)
```

**Example:**
```javascript
createStatCard('Total Revenue', '$48,392', '+12.3%', true, 100, 100)
```

---

### Table

```typescript
createTable(
  rows: number,
  cols: number,
  x: number,
  y: number
)
```

**Example:**
```javascript
createTable(5, 4, 0, 0) // 5 rows, 4 columns
```

---

### Input

```typescript
createInput(
  placeholder: string,
  x: number,
  y: number
)
```

**Example:**
```javascript
createInput('Enter your email...', 100, 200)
```

---

### Skeleton

```typescript
createSkeleton(
  width: number,
  height: number,
  x: number,
  y: number
)
```

**Example:**
```javascript
createSkeleton(200, 20, 0, 0)
```

---

## 🛠️ Development

### Build the Plugin

```bash
npm install
npm run build
```

This compiles `code.ts` to `code.js` using TypeScript.

### Watch Mode (Auto-recompile)

```bash
npm run watch
```

TypeScript will recompile automatically when you save `code.ts`.

After recompiling, **reload the plugin in Figma**:
- Right-click canvas → Plugins → Development → Akount Screen Builder (reload icon)

### File Structure

```
figma-screen-builder-plugin/
├── manifest.json       # Plugin metadata
├── code.ts            # TypeScript plugin logic (24+ component builders)
├── code.js            # Compiled JavaScript (generated)
├── ui.html            # Plugin UI (component library browser)
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── README.md          # This file
```

---

## 📚 Design System Alignment

This plugin follows the **Akount Design System**:

- **Base:** shadcn/ui components (headless, accessible)
- **Styling:** Tailwind v4.1.18 (CSS config)
- **Tokens:** `apps/web/src/app/globals.css`
- **Fonts:** Newsreader (headings), Manrope (body), JetBrains Mono (mono)

**All components match the production codebase** at `apps/web/src/components/ui/`.

---

## 🚀 Roadmap

### ✅ Completed (v2.0)

- [x] Button (6 variants, 4 sizes)
- [x] Badge (6 variants)
- [x] Card (2 variants)
- [x] Input
- [x] Table
- [x] Skeleton
- [x] Stat Card (custom)
- [x] Quick Screens (Dashboard, Invoice, Banking)
- [x] Component library browser UI
- [x] Tabbed interface

### 🔮 Future Enhancements (v3.0)

- [ ] Select, Switch, Checkbox
- [ ] Dialog, Alert Dialog, Sheet
- [ ] Dropdown Menu, Hover Card
- [ ] Avatar, Circular Progress
- [ ] Toast notifications
- [ ] Advanced screen templates (Settings, Reports, AI Insights)
- [ ] Import design tokens from Figma variables
- [ ] Export to React components
- [ ] Grid layout builder

---

## 🐛 Troubleshooting

### "Cannot find name 'figma'"

**Solution:** Make sure you installed `@figma/plugin-typings`:

```bash
npm install --save-dev @figma/plugin-typings
```

### Plugin not appearing in Figma

**Solution:** Make sure you:
1. Compiled TypeScript (`npm run build` created `code.js`)
2. Imported via **Plugins → Development → Import plugin from manifest**
3. Selected the correct `manifest.json` file

### Changes not reflecting

**Solution:**
1. Save your TypeScript file
2. Run `npm run build` (or use watch mode)
3. Reload the plugin in Figma (right-click → Plugins → reload icon)

---

## 📝 License

Internal Akount project — not for external distribution.

---

**Built with ❤️ by the Akount team**
