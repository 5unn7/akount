# Design System Compliance Review -- Dashboard Redesign

**Reviewer:** design-system-enforcer
**Date:** 2026-02-17
**Scope:** Dashboard redesign (8 new/modified files + globals.css)
**Reference:** `.claude/rules/design-aesthetic.md`, `apps/web/CLAUDE.md`

---

## Summary

The dashboard redesign demonstrates **strong adherence** to the Akount design system. Color tokens, glass utilities, typography fonts, and label patterns are used consistently and correctly across all new components. There are no hardcoded hex or rgba values in Tailwind classes. The few issues found are minor consistency concerns and one architectural XSS risk. Overall this is well-built code that follows the design language faithfully.

**Compliance Rating: NEEDS WORK** (4 minor findings, 1 moderate finding, 1 security note)

---

## P0 -- Critical (0 findings)

No critical design system violations found.

---

## P1 -- Moderate (2 findings)

### P1-1: `hover:glass-3` is not a valid Tailwind hover variant of a custom utility

**File:** `apps/web/src/components/dashboard/RecentTransactions.tsx:77`
**Also in:** `apps/web/src/components/dashboard/QuickActions.tsx:28` (not in review scope but same pattern)

**Issue:** The code uses `hover:glass-3` as a class. The `glass-3` utility is defined via `@utility glass-3 { ... }` in globals.css, which sets background, border, and transform as a composite utility. Tailwind v4's `hover:` prefix generates `&:hover { ... }` wrappers around individual utility properties, but applying it to a composite custom `@utility` block may not work as expected -- or it may override the base `glass-2` border and background inconsistently, since both `glass-2` and `glass-3` set their own `border` shorthand.

```tsx
// Found
className="glass-2 rounded-lg p-3 hover:glass-3 transition-all cursor-pointer group"
```

**Impact:** The hover state may not visually transition correctly. Both `glass-2` and `glass-3` set `border: 1px solid ...` as shorthand, so they compete. The transition will snap between states rather than animate smoothly because the `transition-all` can't interpolate a full `border` shorthand swap from one custom utility to another.

**Fix:** Use the established hover pattern from the design system -- `hover:border-ak-border-2` or `hover:border-ak-border-3` for border brightening on hover, and optionally a background change via `hover:bg-ak-bg-3`. This matches the pattern used correctly in `DashboardLeftRail.tsx:126` and `SparkCards.tsx:117`.

```tsx
// Suggested
className="glass-2 rounded-lg p-3 hover:border-ak-border-3 transition-all cursor-pointer group"
```

**Reference:** `.claude/rules/design-aesthetic.md` -- "On hover: border brightens via `hover:border-ak-border-2`, 1px translateY lift"

---

### P1-2: Inline `backgroundColor` from dynamic data in ExpenseChart bypasses token system

**File:** `apps/web/src/components/dashboard/ExpenseChart.tsx:131-135`
**Also at:** `apps/web/src/components/dashboard/ExpenseChart.tsx:154`

**Issue:** The stacked bar chart and legend dots use `style={{ backgroundColor: cat.color }}` where `cat.color` is a string from the `ExpenseCategory` interface. This passes arbitrary color values through inline styles, completely bypassing the design token system.

```tsx
// Found (line 131-135)
<div
    key={cat.name}
    style={{
        height: `${pct}%`,
        backgroundColor: cat.color,
        opacity: 0.7,
    }}
/>

// Found (line 154)
<div
    className="h-2 w-2 rounded-md"
    style={{ backgroundColor: color }}
/>
```

**Impact:** If the data source passes raw hex values (e.g., `#34D399` instead of `var(--ak-green)`), these colors will not adapt between light and dark mode. The chart will display hardcoded colors that may clash with the theme.

**Fix:** Define a finite set of chart category colors using CSS variables, and map category names to token-based colors. The `ExpenseCategory` interface should reference token keys (e.g., `'green' | 'red' | 'blue' | 'purple' | 'teal' | 'primary'`) rather than raw color strings. Then map those to CSS variable values:

```tsx
const chartColorMap: Record<string, string> = {
    green: 'var(--ak-green)',
    red: 'var(--ak-red)',
    blue: 'var(--ak-blue)',
    purple: 'var(--ak-purple)',
    teal: 'var(--ak-teal)',
    primary: 'hsl(var(--primary))',
};

// Usage
style={{ backgroundColor: chartColorMap[cat.color] || 'var(--ak-purple)' }}
```

**Reference:** `.claude/rules/design-aesthetic.md` -- "No hardcoded hex colors -- use semantic tokens"

---

## P2 -- Minor (4 findings)

### P2-1: Inconsistent label letter-spacing between `tracking-[0.05em]` and `tracking-wider`

**File:** `apps/web/src/components/dashboard/ExpenseChart.tsx:44, 102, 164, 168, 174`

**Issue:** The design system specifies `tracking-[0.05em]` for uppercase labels (per `.claude/rules/design-aesthetic.md`: "Labels/badges: Manrope uppercase, 0.05em letter-spacing, 10-11px"). The ExpenseChart uses `tracking-wider` (Tailwind's default: `0.05em`) in 5 places. While `tracking-wider` maps to `0.05em` and is functionally identical, every other dashboard component uses the explicit `tracking-[0.05em]` form.

```tsx
// Found in ExpenseChart (5 occurrences)
'px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors'
'text-[9px] uppercase tracking-wider text-muted-foreground'

// Used everywhere else (consistent pattern)
'text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium'
```

**Impact:** No visual difference, but inconsistency makes the codebase harder to audit. A search for `tracking-[0.05em]` would miss these 5 instances.

**Fix:** Replace `tracking-wider` with `tracking-[0.05em]` in ExpenseChart.tsx for consistency with the rest of the dashboard.

---

### P2-2: Label size inconsistency -- `text-[9px]` vs `text-[10px]` for the same element type

**Files:**
- `DashboardLeftRail.tsx:133` -- stat card labels use `text-[9px]`
- `NetWorthHero.tsx:92, 104` -- sub-card labels use `text-[9px]`
- `SparkCards.tsx:125` -- spark card labels use `text-[10px]`
- `DashboardMetrics.tsx:29, 47, 65` -- metric labels use `text-[11px]`
- `ExpenseChart.tsx:140, 164, 168, 174` -- bar labels and summary labels use `text-[9px]`

**Issue:** The design system states labels should be "10-11px" (per design-aesthetic.md). Three distinct sizes are used across the dashboard for semantically equivalent elements (uppercase tracking labels):
- `text-[9px]` -- used in DashboardLeftRail stat labels, NetWorthHero sub-labels, ExpenseChart bar/summary labels
- `text-[10px]` -- used in SparkCards labels, AIBrief, EntitiesList, RecentTransactions
- `text-[11px]` -- used in DashboardMetrics card titles

**Impact:** Subtle visual inconsistency. The `text-[9px]` size is below the design system's stated 10-11px range, though it may be intentionally smaller for compact contexts (left rail cards, chart axis labels).

**Fix:** This is acceptable as a deliberate density choice for compact components (left rail, chart axes). However, document this as an intentional exception. Consider standardizing on `text-[10px]` for all non-chart label contexts and reserving `text-[9px]` only for chart axis labels and the most compact widgets.

---

### P2-3: `border-l-[color:var(--ak-green)]` pattern uses arbitrary value syntax instead of token classes

**File:** `apps/web/src/components/dashboard/EntitiesList.tsx:20-23`

**Issue:** The entity type border colors use Tailwind arbitrary value syntax `border-l-[color:var(--ak-green)]` instead of the semantic token classes. While this does reference CSS variables (good), it is verbose and the `border-l-` direction variant may not work cleanly with the arbitrary `[color:...]` syntax in all Tailwind v4 builds.

```tsx
// Found
const TYPE_COLORS: Record<string, { icon: string; border: string }> = {
    PERSONAL: { icon: 'text-ak-green', border: 'border-l-[color:var(--ak-green)]' },
    CORPORATION: { icon: 'text-ak-blue', border: 'border-l-[color:var(--ak-blue)]' },
    SOLE_PROPRIETORSHIP: { icon: 'text-ak-purple', border: 'border-l-[color:var(--ak-purple)]' },
    PARTNERSHIP: { icon: 'text-ak-teal', border: 'border-l-[color:var(--ak-teal)]' },
    LLC: { icon: 'text-primary', border: 'border-l-primary' },
};
```

**Impact:** The `LLC` variant correctly uses `border-l-primary` (clean token reference). The others use the more fragile arbitrary syntax. All reference CSS variables so they will adapt to light/dark mode, but the pattern is inconsistent within the same map.

**Fix:** Use the Tailwind token pattern consistently. Since `border-l-ak-green` would require `border-color` utilities to exist for directional borders, and Tailwind v4 may not auto-generate `border-l-ak-green` from `--color-ak-green`, the current arbitrary syntax may be the most pragmatic approach. Consider defining dedicated border-left color utilities in globals.css if this pattern is reused across the app, or accept this as a reasonable workaround.

---

### P2-4: AIBrief uses `text-primary` instead of `text-ai` / `bg-ai` for Insights-related elements

**File:** `apps/web/src/components/dashboard/AIBrief.tsx:17, 20-21, 35`

**Issue:** The Insights brief card uses `text-primary` (amber/orange) and `border-l-primary` for its accent styling. The design system defines `text-ai` / `bg-ai` / `border-ai-border` tokens specifically for AI-related elements (mapped to purple/violet). The system instructions state: "AI elements use `text-ai` or `bg-ai` (violet accent)".

```tsx
// Found
<div className="glass rounded-xl p-5 border-l-2 border-l-primary">
    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
    <span className="text-[10px] uppercase tracking-[0.05em] font-semibold text-primary">
        Insights
    </span>
    ...
    <Sparkles className="h-5 w-5 text-primary/40" />
```

**Impact:** The Insights card uses the primary amber color instead of the AI-specific purple/violet tokens. This is a design decision that could be intentional (treating Insights as a primary feature), but it conflicts with the design system specification that AI elements should use the violet accent to differentiate AI-generated content from user-generated content.

**Fix:** If the intent is to follow the design system strictly, update to AI tokens:

```tsx
<div className="glass rounded-xl p-5 border-l-2 border-l-ai-border">
    <div className="h-2 w-2 rounded-full bg-ai animate-pulse" />
    <span className="text-[10px] uppercase tracking-[0.05em] font-semibold text-ai">
        Insights
    </span>
```

If amber is an intentional brand choice for the Insights section, document this as a deliberate exception.

---

## P2-Security: `dangerouslySetInnerHTML` in AIBrief

**File:** `apps/web/src/components/dashboard/AIBrief.tsx:31`

**Issue:** The AI brief body is rendered with `dangerouslySetInnerHTML`. While not a design system concern per se, this introduces an XSS vector if the `body` prop contains unsanitized HTML from the AI service or API.

```tsx
<p
    className="text-sm font-heading italic text-foreground/90 leading-relaxed"
    dangerouslySetInnerHTML={{ __html: body }}
/>
```

**Impact:** If the API returns user-controlled or AI-generated HTML that includes script tags or event handlers, this becomes an XSS vulnerability.

**Fix:** Sanitize the HTML before rendering using a library like `dompurify`, or render as plain text/markdown instead. This should be tracked as a Phase 6 security item.

---

## Passing Checks (What's Done Right)

### Colors
- [x] No hardcoded hex values in Tailwind classes (`text-[#...]`, `bg-[#...]`) -- zero violations
- [x] No hardcoded rgba values in Tailwind classes -- zero violations
- [x] Income/expense colors use `text-ak-green` / `text-ak-red` semantic tokens throughout
- [x] All color references use CSS variables from globals.css
- [x] Chart SVG colors reference CSS variables (`var(--ak-green)`, `var(--ak-red)`, etc.)
- [x] Glass utilities (`glass`, `glass-2`, `glass-3`) used correctly for surfaces
- [x] Border tokens (`border-ak-border`, `border-ak-border-2`) used correctly
- [x] Glow tracking (`glow-track` utility + `--glow-color` CSS var) implemented correctly

### Typography
- [x] Headings use `font-heading` (Newsreader) -- verified in NetWorthHero, ExpenseChart, CashFlowChart, AIBrief, SectionHeader
- [x] All monetary values and numbers use `font-mono` (JetBrains Mono) -- verified across all components
- [x] AI summaries use `font-heading italic` -- correct in AIBrief.tsx
- [x] Body text defaults to `font-sans` (Manrope) via Tailwind base -- no incorrect font-family overrides
- [x] Labels consistently use uppercase + tracking pattern

### Components
- [x] `GlowCard` used correctly for elevated interactive cards (DashboardMetrics, EntitiesList, NetWorthHero)
- [x] `SectionHeader` shared component used for section titles (RecentTransactions, EntitiesSection)
- [x] Dialog component correctly uses `glass` utility, `border-ak-border`, and `font-heading` for title
- [x] Card hover patterns use `hover:border-ak-border-2` + `hover:-translate-y-px` (DashboardLeftRail, SparkCards)
- [x] Staggered fade-in animations (`fi`, `fi1`-`fi6`) applied correctly to page sections

### Layout
- [x] Three-rail layout (left stats + main content + right AI/actions) implemented correctly
- [x] Responsive breakpoints hide left rail below `lg:`, right rail below `xl:`, with mobile fallbacks
- [x] Content spacing uses `space-y-6` and `gap-6` consistently
- [x] `glass rounded-xl` pattern used consistently for card containers

### Tokens / globals.css
- [x] New CSS variables (`--ak-green-fill`, `--ak-red-fill`, etc.) properly defined for both light and dark modes
- [x] Sparkline fill colors use lower opacity variants appropriate for area fills
- [x] Animation utilities (`fi`, `sparkline-path`, `number-transition`) defined correctly
- [x] `glow-track` utility properly implements mouse-following radial glow

---

## Recommendations

1. **Standardize the `hover:glass-3` pattern** -- Replace with explicit `hover:border-ak-border-3` to match the established card hover pattern. This is a small change with high consistency value.

2. **Create a chart color mapping utility** -- The ExpenseChart's inline `backgroundColor` from dynamic data should map through token-based CSS variables. Consider a shared `chartColors` map that other chart components (CashFlowChart, future charts) can reuse.

3. **Decide on AI accent color** -- Either update AIBrief to use `text-ai` / `bg-ai` (purple) per the design system spec, or document that the Insights section intentionally uses `text-primary` (amber) as a brand decision.

4. **Normalize label sizes** -- Consider defining a shared label utility (e.g., `@utility label { ... }`) that standardizes the `uppercase tracking-[0.05em] text-muted-foreground font-medium` pattern at a consistent size, with a compact variant for dense widgets.

5. **Sanitize AI brief HTML** -- Add `dompurify` or equivalent before the Phase 6 security hardening.

---

## Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `apps/web/src/components/dashboard/DashboardLeftRail.tsx` | PASS | Clean token usage, proper glow-track pattern |
| `apps/web/src/components/dashboard/NetWorthHero.tsx` | PASS | Correct font-heading, font-mono, glass-2 |
| `apps/web/src/components/dashboard/RecentTransactions.tsx` | NEEDS WORK | `hover:glass-3` pattern (P1-1) |
| `apps/web/src/components/dashboard/SparkCards.tsx` | PASS | Clean, consistent with DashboardLeftRail |
| `apps/web/src/components/dashboard/AIBrief.tsx` | NEEDS WORK | AI color tokens (P2-4), XSS risk (P2-Security) |
| `apps/web/src/components/dashboard/DashboardMetrics.tsx` | PASS | Proper GlowCard, font-mono, token colors |
| `apps/web/src/components/dashboard/EntitiesList.tsx` | PASS (minor) | Arbitrary border syntax (P2-3) |
| `apps/web/src/components/dashboard/ExpenseChart.tsx` | NEEDS WORK | Inline backgroundColor (P1-2), tracking inconsistency (P2-1) |
| `apps/web/src/components/ui/dialog.tsx` | PASS | Correct glass, border-ak-border, font-heading |
| `apps/web/src/app/globals.css` | PASS | Well-structured light/dark tokens, proper utility definitions |
| `apps/web/src/app/(dashboard)/overview/page.tsx` | PASS | Correct layout, animation stagger, responsive breakpoints |

---

*Review generated by design-system-enforcer agent. 2026-02-17.*
