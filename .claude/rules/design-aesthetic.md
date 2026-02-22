# Design Aesthetic — Financial Clarity

---
paths:

- "apps/web/**"
- "packages/ui/**"
- "packages/design-tokens/**"

---

> **Canonical reference:** `brand/inspirations/financial-clarity-final.html`
> Dark-first. Zen. Glass. Glowy. Minimalist. One glance, zero anxiety.

## CRITICAL: Use Semantic Tokens, NEVER Hardcode Colors

**All colors are defined as CSS variables in `globals.css` with Tailwind utility classes. NEVER use arbitrary hex values like `text-[#34D399]` or `bg-[rgba(255,255,255,0.06)]`.**

### Color Token Mapping (USE LEFT COLUMN, NOT RIGHT)

| Tailwind Class | Replaces (NEVER use) | Meaning |
|----------------|----------------------|---------|
| `text-primary` / `bg-primary` | `text-[#F59E0B]` / `bg-[#F59E0B]` | Primary amber |
| `hover:bg-ak-pri-hover` | `hover:bg-[#FBBF24]` | Primary hover |
| `bg-ak-pri-dim` | `bg-[rgba(245,158,11,0.14)]` | Primary subtle bg |
| `text-ak-pri-text` | `text-[#FFB02E]` | Primary text on dark |
| `text-ak-green` / `bg-ak-green` | `text-[#34D399]` / `bg-[#34D399]` | Income/success |
| `bg-ak-green-dim` | `bg-[rgba(52,211,153,0.18)]` | Green subtle bg |
| `text-ak-red` / `bg-ak-red` | `text-[#F87171]` / `bg-[#F87171]` | Expense/error |
| `text-destructive` | `text-[#F87171]` | Destructive (shadcn) |
| `bg-ak-red-dim` | `bg-[rgba(248,113,113,0.18)]` | Red subtle bg |
| `text-ak-blue` / `bg-ak-blue` | `text-[#60A5FA]` / `bg-[#60A5FA]` | Transfer/info |
| `bg-ak-blue-dim` | `bg-[rgba(96,165,250,0.18)]` | Blue subtle bg |
| `text-ak-purple` / `bg-ak-purple` | `text-[#A78BFA]` / `bg-[#A78BFA]` | AI/purple |
| `bg-ak-purple-dim` | `bg-[rgba(167,139,250,0.18)]` | Purple subtle bg |
| `text-ak-teal` / `bg-ak-teal` | `text-[#2DD4BF]` / `bg-[#2DD4BF]` | Teal accent |
| `text-finance-income` | `text-[#34D399]` | Income (semantic) |
| `text-finance-expense` | `text-[#F87171]` | Expense (semantic) |
| `text-finance-transfer` | `text-[#60A5FA]` | Transfer (semantic) |

### Glass & Border Tokens (USE LEFT COLUMN, NOT RIGHT)

| Tailwind Class / Utility | Replaces (NEVER use) | Meaning |
|---------------------------|----------------------|---------|
| `glass` (utility class) | `bg-[rgba(255,255,255,0.025)]` + manual border | Glass tier 1 |
| `glass-2` | `bg-[rgba(255,255,255,0.04)]` + manual border | Glass tier 2 |
| `glass-3` | `bg-[rgba(255,255,255,0.06)]` + manual border | Glass tier 3 |
| `border-ak-border` | `border-[rgba(255,255,255,0.06)]` | Default border |
| `border-ak-border-2` | `border-[rgba(255,255,255,0.09)]` | Medium border |
| `border-ak-border-3` | `border-[rgba(255,255,255,0.13)]` | Strong border |
| `bg-ak-bg-3` | `bg-[#1A1A26]` | Hover surface |
| `bg-ak-bg-4` | `bg-[#22222E]` | Active surface |
| `text-muted-foreground` | `text-[#71717A]` | Muted text |

**Why this matters:** Tokens auto-switch between light/dark mode. Hardcoded hex values break in the opposite mode. Every `text-[#34D399]` is a light-mode bug waiting to happen.

---

## Dark Mode Surface Hierarchy

Five levels of depth — near-black with subtle purple undertones:

| Token | Hex | Use |
|-------|-----|-----|
| `bg-0` | `#09090F` | Page background (deepest) |
| `bg-1` | `#0F0F17` | Sidebar, panels, cards |
| `bg-2` | `#15151F` | Elevated cards, dropdowns |
| `bg-3` | `#1A1A26` | Hover states, tooltips |
| `bg-4` | `#22222E` | Highest elevation, active states |

**Not slate.** These are purple-tinted near-blacks. The subtle warmth avoids "cold terminal" feel.

## Glass Morphism (3 Tiers)

| Level | Background | Use |
|-------|-----------|-----|
| Glass 1 | `rgba(255,255,255, 0.025)` | Default cards, containers |
| Glass 2 | `rgba(255,255,255, 0.04)` | Hover states, elevated items |
| Glass 3 | `rgba(255,255,255, 0.06)` | Active states, focused elements |

**Blur:** `backdrop-filter: blur(16px)` (not 6px — subtler, more refined)
**Borders:** `rgba(255,255,255, 0.06)` default, `0.09` medium, `0.13` strong

## Primary Color: Amber Orange

| Token | Value | Use |
|-------|-------|-----|
| Primary | `#F59E0B` | CTAs, brand accents, active states |
| Primary hover | `#FBBF24` | Hover variant |
| Primary dim | `rgba(245,158,11, 0.14)` | Subtle backgrounds |
| Primary glow | `rgba(245,158,11, 0.08)` | Glow effects, shadows |

## Semantic Colors (400-level for dark contrast)

Dark backgrounds need lighter semantic colors than light mode:

| Role | Dark Mode | Light Mode | Notes |
|------|-----------|------------|-------|
| Income/green | `#34D399` | `#10B981` | Emerald 400 vs 500 |
| Expense/red | `#F87171` | `#EF4444` | Red 400 vs 500 |
| Transfer/blue | `#60A5FA` | `#3B82F6` | Blue 400 vs 500 |
| AI/purple | `#A78BFA` | `#8B5CF6` | Purple 400 vs 500 |
| Teal | `#2DD4BF` | `#14B8A6` | Teal 400 vs 500 |

## Typography Rules

- **Headings:** `font-heading` (Newsreader), normal weight, serif elegance
- **AI summaries/briefs:** Newsreader *italic* — signals "interpreted, not raw"
- **Body text:** `font-sans` (Manrope), clean and readable
- **All numbers/amounts:** `font-mono` (JetBrains Mono) — tabular, precise
- **Labels/badges:** Manrope uppercase, 0.05em letter-spacing, 10-11px
- **Micro text (10px):** Use `text-micro` utility (defined in `globals.css`), NEVER `text-[10px]`

## Component Patterns

**Cards:** Use `glass` utility (includes background + border). Add hover lift.

```html
<div className="glass rounded-xl transition-all hover:border-ak-border-2 hover:-translate-y-px">
```

On hover: border brightens via `hover:border-ak-border-2`, 1px translateY lift.

**Buttons:** 8px radius. Three tiers:

- Ghost: transparent + border
- Dim: primary-dim background + subtle primary border
- Solid: full primary background

**Badges/Pills:** 12px border-radius, 9px font, colored dim background.

**Stat cards:** Label (muted, uppercase, tiny) → Value (mono, large) → Trend (green/red, tiny)

## Glow Effects

Subtle use of `box-shadow` with color-matched transparency:

- Orange glow: `0 0 16px rgba(245,158,11, 0.08)`
- Green glow: `0 0 12px rgba(52,211,153, 0.06)`
- The Pulse orb: `radial-gradient` with breathing animation

### Mouse-Tracking Radial Glow (Cards)

Interactive cards use a cursor-following radial glow via `GlowCard` component.
A `::after` pseudo-element renders a `radial-gradient` positioned at CSS vars `--glow-x`/`--glow-y`, updated on `mousemove`. Fades in on hover, invisible otherwise.

**Usage:** `<GlowCard variant="glass">` (see `components/ui/glow-card.tsx`)
**CSS utility:** `glow-track` (in `globals.css`)
**Custom color:** pass `glowColor="rgba(139,92,246,0.04)"` for non-default hues (e.g. purple for AI cards)
**Where to use:** Feature cards, stat cards, settings panels — any glass card that benefits from interactivity. Not for dense lists or small items.

## Anti-Patterns (DO NOT)

- **No hardcoded hex colors** — use semantic tokens from the mapping table above. `text-[#F59E0B]` = WRONG, `text-primary` = RIGHT
- **No hardcoded rgba values** — use glass utilities (`glass`, `glass-2`, `glass-3`) and border tokens (`border-ak-border`)
- **No arbitrary font sizes** — NEVER `text-[10px]`, `text-[11px]`, etc. Use Tailwind size classes or custom utilities:
  - `text-[10px]` → `text-micro` (defined in `globals.css` as `@utility text-micro`)
  - `text-[11px]` → `text-xs` (Tailwind default, 12px — close enough, or define `text-micro-lg` if needed)
  - **Why:** Arbitrary values bypass the type scale, create inconsistency, and drift from design tokens
- No heavy drop shadows — prefer subtle border + glow
- No solid white backgrounds in dark mode — always use glass tiers
- No flat gray borders — use border token tiers (`border-ak-border`, `-2`, `-3`)
- No 500-level semantic colors on dark backgrounds — too muted, tokens handle this automatically
- No dense text walls — progressive disclosure, expand on click
- No competing accent colors — orange is primary, everything else supports
