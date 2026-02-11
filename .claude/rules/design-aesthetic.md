# Design Aesthetic — Financial Clarity

---
paths:
  - "apps/web/**"
  - "packages/ui/**"
  - "packages/design-tokens/**"
---

> **Canonical reference:** `brand/inspirations/financial-clarity-final.html`
> Dark-first. Zen. Glass. Glowy. Minimalist. One glance, zero anxiety.

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

## Component Patterns

**Cards:** Glass background + 1px subtle border + gentle hover lift
```
background: var(--glass);
border: 1px solid rgba(255,255,255,0.06);
border-radius: 14px;
transition: border-color 0.2s, transform 0.2s;
```
On hover: border brightens, 1px translateY lift, subtle shadow.

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

- No heavy drop shadows — prefer subtle border + glow
- No solid white backgrounds in dark mode — always use glass tiers
- No flat gray borders — use rgba white with low opacity
- No 500-level semantic colors on dark backgrounds — too muted
- No dense text walls — progressive disclosure, expand on click
- No competing accent colors — orange is primary, everything else supports
