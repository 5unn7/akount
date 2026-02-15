# Overview Page Comprehensive Refresh — Brainstorm

**Date:** 2026-02-14
**Status:** Brainstormed
**Context:** Refinement of existing Overview page to improve visual hierarchy, data accuracy, spacing, and user guidance

---

## Problem Statement

The Overview page currently has:
1. **Weak visual hierarchy** — all sections have similar visual weight, unclear scanning priority
2. **Missing color guidance** — semantic colors exist in design system but underutilized
3. **Layout issues** — navbar padding, spark card alignment, overall spacing inconsistencies
4. **Demo data** — hardcoded sparkline trends and percentage changes in spark KPIs (Revenue, Expenses, Profit)
5. **Above-the-fold challenge** — need Liquidity Hero, Spark KPIs, AND AI Brief/Action Items visible without scrolling, with clear hierarchy

**For:** Authenticated users landing on dashboard (all roles)
**Desired outcome:** One glance reveals financial position + performance + what needs attention, with zero ambiguity about priority

---

## Chosen Approach: **Blended Hierarchy Layout**

Combines dominant hero concept + color zone guidance + L-shape efficiency.

### Visual Structure (Above-the-Fold)

```
┌─────────────────────────────────────────────────────────────────┐
│ Navbar (14-16px vertical padding added)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZONE 1: LIQUIDITY HERO (Primary — Amber Glow)                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Good morning, Sunny                                       │ │
│  │ Friday, February 14, 2026                                 │ │
│  │                                                           │ │
│  │ ╔═══════════════════════════════════════════════════════╗ │ │
│  │ ║  TOTAL LIQUIDITY                                      ║ │ │
│  │ ║  $142,840.50 CAD                                      ║ │ │
│  │ ║  ↑ +6.8%   +$9,240   (amber glow on hover)            ║ │ │
│  │ ╚═══════════════════════════════════════════════════════╝ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ZONE 2: PERFORMANCE SPARK KPIS (Secondary — Color-Coded)      │
│  ┌──────┬──────┬──────┬──────┬──────┐                          │
│  │ REV  │ EXP  │PROFIT│ A/R  │ACCTS │  (each with colored      │
│  │ ↗ 📈 │ ↘ 📉 │ ↗ 📊 │ → 📋 │ →    │   glow + aligned spark)  │
│  └──────┴──────┴──────┴──────┴──────┘                          │
│                                                                 │
├─────────────────────────────────────┬───────────────────────────┤
│ LEFT: Charts/Metrics (below fold)   │ RIGHT: AI + Actions       │
│                                     │ (Tertiary — Purple Zone)  │
│ ┌─────────────────────────────────┐ │ ┌───────────────────────┐ │
│ │ Cash Flow Chart                 │ │ │ 🤖 AI Brief (purple)  │ │
│ │ Expense Breakdown               │ │ │ ⚡ Action Items (3)   │ │
│ │ Dashboard Metrics (4 cards)     │ │ │ 🎯 Quick Actions      │ │
│ └─────────────────────────────────┘ │ └───────────────────────┘ │
└─────────────────────────────────────┴───────────────────────────┘
```

### Hierarchy Implementation

| Zone | Visual Weight | Color Theme | Font Sizes | Glow Effect |
|------|---------------|-------------|------------|-------------|
| **Zone 1: Liquidity Hero** | **PRIMARY (largest)** | Amber (`--primary`) | Greeting: `text-2xl`<br>Balance: `text-4xl font-mono` | `box-shadow: 0 0 24px rgba(245,158,11,0.12)` on hover |
| **Zone 2: Spark KPIs** | **SECONDARY (medium)** | Color-coded per metric (green/red/amber/blue/purple) | Label: `text-[10px] uppercase`<br>Value: `text-lg font-mono` | Per-card colored glow (8-12px blur, 0.08 opacity) |
| **Zone 3: AI + Actions** | **TERTIARY (smallest)** | Purple accent for AI, Teal for actions | Brief: `text-sm italic font-heading`<br>Items: `text-xs` | Purple glow on AI card (`rgba(167,139,250,0.06)`) |

---

## Key Features

### 1. Visual Hierarchy via Size + Color Zones

**Zone 1 (Liquidity Hero):**
- Glass tier-1 background
- 4xl font size for balance (currently 3xl → **bump to 4xl**)
- Full-width card with prominent amber glow on hover
- Greeting + date context above card

**Zone 2 (Spark KPIs):**
- 5 cards in responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-5`)
- Each card has **color-coded glow** matching semantic meaning:
  - Revenue: Green glow (`rgba(52,211,153,0.08)`)
  - Expenses: Red glow (`rgba(248,113,113,0.08)`)
  - Profit: Amber glow (`rgba(245,158,11,0.08)`)
  - Receivables: Blue glow (`rgba(96,165,250,0.08)`)
  - Accounts: Purple glow (`rgba(167,139,250,0.08)`)
- Sparkline alignment fix (see below)

**Zone 3 (AI Brief + Actions):**
- Right sidebar, fixed width (340px)
- AI Brief in glass-3 with purple border-left accent
- Action Items as compact chips (not full cards)
- Sticks to viewport on scroll (optional enhancement)

### 2. Sparkline Alignment Fix

**Current issue:** `justify-between` causes misalignment when sparkline is absent.

**Solution:**
```tsx
// SparkCards.tsx changes
<div className="flex items-start justify-between gap-2">
  <div className="min-w-0 flex-1"> {/* Add flex-1 */}
    <p className="text-[10px] uppercase ...">Label</p>
    <p className="text-lg font-mono ...">Value</p>
  </div>
  {card.sparkline && card.sparkline.length > 1 && (
    <div className="shrink-0 w-20"> {/* Fixed width container */}
      <MiniSparkline data={card.sparkline} color={card.color} />
    </div>
  )}
</div>
```

This ensures:
- Value stays left-aligned even without sparkline
- Sparkline occupies fixed 80px width (matches SVG width)
- Vertical centering via `items-start` (aligns with label top)

### 3. Navbar Padding Enhancement

**Current:** `h-14 px-4 md:px-6` (no explicit vertical padding)

**Fix:**
```tsx
// Navbar.tsx line 192
<div className="flex items-center px-4 md:px-6 py-3 min-h-14 glass-blur border-b border-ak-border">
```

Changes:
- Add `py-3` for 12px vertical breathing room
- Change `h-14` to `min-h-14` to allow content to breathe
- Improves tap targets on mobile

### 4. Real Data Wiring — New API Endpoint

**New endpoint:** `GET /api/dashboard/performance`

**Query params:**
- `entityId` (optional) — filter to specific entity
- `currency` (optional) — return values in specified currency
- `period` (optional) — default `30d` (last 30 days)

**Response schema:**
```typescript
interface PerformanceMetrics {
  revenue: {
    current: number;        // cents
    previous: number;       // cents (prior period)
    percentChange: number;  // -100 to +∞
    sparkline: number[];    // 10-15 data points
  };
  expenses: {
    current: number;
    previous: number;
    percentChange: number;
    sparkline: number[];
  };
  profit: {
    current: number;
    previous: number;
    percentChange: number;
    sparkline: number[];
  };
  receivables: {
    outstanding: number;
    overdue: number;
    sparkline: number[];
  };
  accounts: {
    active: number;
    total: number;
  };
  currency: string;
}
```

**Data source:** Transaction aggregates
- Revenue: `SUM(amount WHERE category.type = 'income')`
- Expenses: `SUM(amount WHERE category.type = 'expense')`
- Profit: `revenue - expenses`
- Period comparison: Current 30d vs prior 30d (days -60 to -30)
- Sparkline: Daily aggregates (15 points for 30d period = every 2 days)

**Implementation file:** `apps/api/src/domains/overview/services/performance.service.ts`

### 5. Color-Coded Glow Effects

Each spark card gets a subtle glow effect matching its semantic color:

```tsx
// Add to SparkCards.tsx
const glowMap = {
  green: 'hover:shadow-[0_0_12px_rgba(52,211,153,0.08)]',
  red: 'hover:shadow-[0_0_12px_rgba(248,113,113,0.08)]',
  blue: 'hover:shadow-[0_0_12px_rgba(96,165,250,0.08)]',
  purple: 'hover:shadow-[0_0_12px_rgba(167,139,250,0.08)]',
  primary: 'hover:shadow-[0_0_12px_rgba(245,158,11,0.08)]',
} as const;

// Apply in card className
<div
  className={cn(
    'glass rounded-lg px-4 py-3.5 transition-all hover:border-ak-border-2 hover:-translate-y-px',
    glowMap[card.color ?? 'primary']
  )}
>
```

---

## Constraints & Considerations

### Above-the-Fold Requirements
- **Target viewport:** 1440x900 (standard laptop) to 1920x1080 (desktop)
- **Mobile:** Stack zones vertically, collapse right sidebar below main content
- **Tablet:** 2-column layout for Spark KPIs, sidebar below

### Performance
- Fetch performance metrics and dashboard metrics in parallel (already done via `Promise.allSettled`)
- Cache performance endpoint response (5 min TTL) via React Query

### Accessibility
- Sparklines are decorative — no aria-label needed (values + trends are in text)
- Color is NOT the only indicator (icons + text also convey trend direction)
- Ensure 4.5:1 contrast ratio for all text (already met via design system)

### Design System Compliance
- All colors via semantic tokens (no hardcoded hex)
- Glass utilities: `glass`, `glass-2`, `glass-3`
- Border tiers: `border-ak-border`, `border-ak-border-2`, `border-ak-border-3`
- Font mono for all numbers/amounts (already enforced)

---

## Open Questions

- [x] Should AI Brief show on mobile? **Decision:** Yes, but collapsed/expandable accordion
- [x] How many Action Items to show above fold? **Decision:** Top 3 only, "View all" link
- [ ] Should Liquidity Hero show currency breakdown pills? (CAD 60%, USD 40%) **Ask user**
- [ ] Should sparklines be clickable to drill into detail view? **Phase 4 enhancement**

---

## Technical Implementation Checklist

### Phase 1: Layout & Hierarchy (Frontend)
- [ ] Bump Liquidity Hero balance font size: `text-3xl` → `text-4xl`
- [ ] Add navbar vertical padding: `py-3` + `min-h-14`
- [ ] Fix sparkline alignment: wrap in `w-20 shrink-0`, value in `flex-1`
- [ ] Add color-coded glow effects to spark cards (hover state)
- [ ] Adjust spacing between zones (use `space-y-6` → `space-y-8` for more breathing room)
- [ ] Add subtle border-left accent to AI Brief card (purple, 2px)

### Phase 2: Real Data Wiring (Backend + Frontend)
- [ ] Create `apps/api/src/domains/overview/services/performance.service.ts`
- [ ] Implement `calculatePerformanceMetrics(entityId, currency, period)` function
- [ ] Add route: `GET /api/overview/performance` with Zod schema validation
- [ ] Write tests for performance calculations (15+ tests for edge cases)
- [ ] Update `apps/web/src/app/(dashboard)/overview/page.tsx` to fetch from new endpoint
- [ ] Remove hardcoded sparkline arrays and trend text
- [ ] Add loading skeleton for spark cards (same as DashboardMetrics)
- [ ] Handle empty state (no transactions yet → show placeholder)

### Phase 3: Polish & Edge Cases
- [ ] Mobile responsiveness: stack zones vertically, test on 375px width
- [ ] Empty state UI when no entities exist (show onboarding prompt)
- [ ] Error boundary for performance fetch failures
- [ ] Add React Query caching with 5min TTL
- [ ] Accessibility audit: keyboard nav, screen reader testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## Success Metrics

**Before:**
- User confusion: "What should I look at first?"
- Visual flatness: All sections blend together
- Demo data: Misleading trends and percentages
- Alignment issues: Sparklines jump around

**After:**
- Clear visual hierarchy: Eyes drawn to Liquidity → Spark KPIs → AI Brief
- Color guidance: Green = good, Red = attention needed, Amber = primary action
- Real data: Accurate trends based on actual transactions
- Polish: Consistent spacing, aligned sparklines, breathing room

**Validation:**
- Screenshot comparison (before/after)
- User flows: "Within 3 seconds, identify your current profit trend" (should be instant)
- Mobile test: All three zones visible and functional on iPhone 13 Pro

---

## Next Steps

1. **Proceed to planning** — `/processes:plan Overview Page Comprehensive Refresh`
   - Break down into tasks (FE layout, BE API, data wiring, tests)
   - Estimate effort (2-3 sessions)
   - Identify blockers (none anticipated)

2. **Quick prototype** — Build Zone 1 + Zone 2 layout changes first (1 session), validate with user before API work

3. **Full implementation** — Execute plan systematically with `/processes:work`

---

**Recommendation:** Start with Phase 1 (Layout & Hierarchy) to validate the visual approach, then proceed to Phase 2 (Real Data) once layout is approved.
