---
review_id: dashboard-overview
date: 2026-02-17
branch: main
verdict: changes_required
agents: [security-sentinel, architecture-strategist, performance-oracle, kieran-typescript-reviewer, nextjs-app-router-reviewer, design-system-enforcer]
p0_count: 1
p1_count: 7
p2_count: 13
fix_effort_hours: 4

anti_patterns:
  - id: xss-dangerouslysetinnerhtml
    pattern: "Rendering unsanitized HTML via dangerouslySetInnerHTML"
    files: [apps/web/src/components/dashboard/AIBrief.tsx]
    fix: "Sanitize with DOMPurify, use markdown renderer, or render as plain text"
    severity: P0
    line: "31"

  - id: duplicated-sparkline-component
    pattern: "MiniSparkline SVG component copy-pasted across files"
    files: [apps/web/src/components/dashboard/DashboardLeftRail.tsx, apps/web/src/components/dashboard/SparkCards.tsx]
    fix: "Extract shared MiniSparkline component with size props"
    severity: P1
    line: "58-98"

  - id: server-component-transformation-bloat
    pattern: "120+ lines of data transformation logic inside Server Component page"
    files: [apps/web/src/app/(dashboard)/overview/page.tsx]
    fix: "Extract to lib/dashboard/transformers.ts"
    severity: P1
    line: "59-182"

recurring_issues:
  - issue: "Code duplication between SparkCards and DashboardLeftRail"
    occurrences: 4
    domains: [dashboard]
    files: [DashboardLeftRail.tsx, SparkCards.tsx]
    pattern: "Shared interfaces, color maps, glow maps, MiniSparkline SVG"

  - issue: "SVG gradient ID collision from static IDs"
    occurrences: 2
    domains: [dashboard]
    files: [SparkCards.tsx, DashboardLeftRail.tsx]
    pattern: "Gradient IDs like spark-grad-green collide when same color renders twice"

architecture_strengths:
  - pattern: "Parallel data fetching via Promise.allSettled (4 API calls)"
    effectiveness: high
    reuse: true
    location: "apps/web/src/app/(dashboard)/overview/page.tsx:39-44"

  - pattern: "Proper Server/Client component boundary (page fetches, components render)"
    effectiveness: high
    reuse: true
    location: "apps/web/src/app/(dashboard)/overview/page.tsx"

  - pattern: "Semantic color tokens used consistently (zero hardcoded hex)"
    effectiveness: high
    reuse: true
    location: "apps/web/src/components/dashboard/"

  - pattern: "Glass morphism tiers with glow-track hover effects"
    effectiveness: high
    reuse: true
    location: "apps/web/src/components/dashboard/DashboardLeftRail.tsx"

  - pattern: "FX rate batch fetching avoids N+1 in DashboardService"
    effectiveness: high
    reuse: true
    location: "apps/api/src/domains/overview/services/dashboard.service.ts"

cross_domain_impacts:
  - change: "AIBrief XSS becomes exploitable when Insights is wired up"
    affected: [apps/web/src/components/dashboard/AIBrief.tsx, apps/api/src/domains/ai/]
    lesson: "Sanitize all HTML before dangerouslySetInnerHTML, even for internal API responses"

high_confidence:
  - issue: "XSS via dangerouslySetInnerHTML in AIBrief"
    agents: [security-sentinel, kieran-typescript-reviewer, design-system-enforcer]
    priority: P0

  - issue: "Code duplication between SparkCards and DashboardLeftRail (~90% shared)"
    agents: [kieran-typescript-reviewer, architecture-strategist]
    priority: P1

  - issue: "Server component data transformation bloat (120+ lines in page.tsx)"
    agents: [kieran-typescript-reviewer, architecture-strategist]
    priority: P1
---

# Dashboard Overview — Review Summary

> **Quick scan for EOD/Audit agents.** Read [detailed findings](#detailed-findings) or [agent reports](./agents/) for deeper context.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Date** | 2026-02-17 |
| **Branch** | `main` (uncommitted dashboard redesign) |
| **Files Reviewed** | 34 (10 pages, 24 components, 8 backend files) |
| **Agents** | 6/6 completed (security, architecture, performance, typescript, nextjs, design-system) |
| **Verdict** | ⚠️ **CHANGES REQUIRED** |

---

## At-a-Glance Metrics

| Priority | Count | Effort | Blocking? |
|----------|-------|--------|-----------|
| **P0 (Critical)** | 1 | ~30 min | ⚠️ Fix before Insights wired up |
| **P1 (Important)** | 7 | ~3 hours | ⚠️ Fix before production |
| **P2 (Nice-to-Have)** | 13 | ~4 hours | Optional |

**Estimated fix effort:** ~30 min for P0, ~3 hours for P1s

---

## Top 5 Findings (Must Fix)

### 🔴 P0-1: XSS via `dangerouslySetInnerHTML` in AIBrief
**Risk:** Arbitrary script execution when Insights body is populated
**Fix:** Sanitize with DOMPurify or use markdown renderer (30 min)
**Agents:** security-sentinel, kieran-typescript-reviewer, design-system-enforcer

### 🟡 P1-1: Duplicated interfaces, constants, and MiniSparkline component
**Risk:** Maintenance burden, diverging behavior between mobile and desktop sparklines
**Fix:** Extract shared types, constants, and component to `components/dashboard/shared/` (45 min)
**Agents:** kieran-typescript-reviewer, architecture-strategist

### 🟡 P1-2: SVG gradient ID collision risk
**Risk:** Visual glitches when multiple sparklines of same color render on one page
**Fix:** Use `React.useId()` for unique gradient IDs per instance (15 min)
**Agents:** kieran-typescript-reviewer

### 🟡 P1-3: Server component data transformation bloat (120+ lines)
**Risk:** Untestable logic, SRP violation, local `formatCurrency` shadows shared utility
**Fix:** Extract to `lib/dashboard/transformers.ts` with named `formatCurrencyCompact` (30 min)
**Agents:** kieran-typescript-reviewer, architecture-strategist

### 🟡 P1-4: `hover:glass-3` unreliable as Tailwind hover variant
**Risk:** Hover transitions snap instead of animate; competing border definitions
**Fix:** Replace with `hover:border-ak-border-3` per design system spec (10 min)
**Agents:** design-system-enforcer

---

## High-Confidence Issues (3+ Agents Agree)

| Issue | Agents | Priority |
|-------|--------|----------|
| XSS via `dangerouslySetInnerHTML` in AIBrief | security, typescript, design-system | P0 |
| Code duplication SparkCards / DashboardLeftRail | typescript, architecture | P1 |
| Server component bloat in page.tsx (120+ lines) | typescript, architecture | P1 |

---

## Architecture Strengths

✅ Parallel data fetching via `Promise.allSettled` (4 API calls)
✅ Proper Server/Client component boundary (page fetches, components render)
✅ Semantic color tokens used consistently (zero hardcoded hex in Tailwind classes)
✅ Glass morphism tiers applied correctly with glow-track hover effects
✅ Typography tokens correct: `font-heading`, `font-mono`, `font-heading italic` for AI
✅ Loading/error states present for all overview page routes
✅ Backend: tenant isolation enforced, FX batch fetching (no N+1), soft delete filters
✅ Responsive 3-column layout with mobile fallbacks

---

## Fix Timeline

### Before Insights Integration (P0) — ~30 min
1. Sanitize AIBrief body content (30 min)

### Before Production (P1) — ~3 hours
2. Extract shared sparkline types/constants/component (45 min)
3. Use `React.useId()` for SVG gradient IDs (15 min)
4. Extract page.tsx transformations to `lib/dashboard/transformers.ts` (30 min)
5. Remove dead `handleSkipStep` in OnboardingHeroCard (5 min)
6. Type entity maps as `Record<EntityType, ...>` (10 min)
7. Replace `hover:glass-3` with `hover:border-ak-border-3` (10 min)
8. Map ExpenseChart colors through token system (30 min)

### Phase 6 Scope (P2)
- Delete dead `SparkCardsSkeleton` (5 min)
- Fix `useEffect` cleanup for `cancelAnimationFrame` (10 min)
- Resolve `text-[9px]` vs `text-[10px]` inconsistency (15 min)
- Replace `console.error` with error boundary in OnboardingHeroCard (15 min)

---

## Detailed Findings

Complete P0/P1/P2 issue descriptions with file locations, code examples, and fix approaches are captured in the YAML frontmatter above and in individual agent reports.

**P2 findings table (13 items):**

| # | Finding | File | Agent |
|---|---------|------|-------|
| P2-1 | Dead `SparkCardsSkeleton` function | `page.tsx:256-268` | typescript |
| P2-2 | `ExpenseChart` period state unused (cosmetic toggle) | `ExpenseChart.tsx:31` | typescript |
| P2-3 | `text-[9px]` vs `text-[10px]` inconsistency | Multiple files | design-system |
| P2-4 | Missing `useEffect` cleanup for `cancelAnimationFrame` | `DashboardLeftRail.tsx:103` | typescript |
| P2-5 | `DashboardRightRail` className uses `\|\|` instead of `cn()` | `DashboardRightRail.tsx:12` | typescript |
| P2-6 | Unused import `TrendingUp` in DashboardMetrics | `DashboardMetrics.tsx:3` | typescript |
| P2-7 | `formatCurrency` shadows shared utility | `page.tsx:66-70` | typescript |
| P2-8 | `tracking-wider` vs `tracking-[0.05em]` inconsistency | `ExpenseChart.tsx` | design-system |
| P2-9 | AIBrief uses `text-primary` (amber) not AI tokens (purple) | `AIBrief.tsx:17,20-21` | design-system |
| P2-10 | Verbose `border-l-[color:var(--ak-green)]` syntax | `EntitiesList.tsx:20-23` | design-system |
| P2-11 | `React.ReactElement` return type without import | `EntitiesList.tsx:27` | typescript |
| P2-12 | `ExpenseCategory.color` typed as `string` not token ref | `ExpenseChart.tsx:10` | typescript |
| P2-13 | `NetWorthHero` `trend` prop always `undefined` | `page.tsx:198` | typescript |

## Backend Notes

- **DashboardService**: FX batch query avoids N+1. `Math.abs(balance)` treats overdrafts as positive assets (minor).
- **PerformanceService**: Tenant isolation correct, soft delete respected. Sparkline O(points * transactions) fine at MVP scale.
- **Routes**: Auth + tenant middleware applied. `request.tenantId as string` cast safe but could use type guard.

## Agent Reports

Individual agent analysis in [agents/](./agents/) directory:
- [security.md](./agents/security.md) — Tenant isolation, XSS, injection vectors
- [architecture.md](./agents/architecture.md) — System design, SRP, maintainability
- [performance.md](./agents/performance.md) — Query optimization, sparkline rendering
- [typescript.md](./agents/typescript.md) — Type safety, dead code, duplication
- [nextjs.md](./agents/nextjs.md) — Server/client boundaries, metadata, accessibility
- [design-system.md](./agents/design-system.md) — Token compliance, glass tiers, typography

---

*Generated by `/processes:review` — 6 agents, ~2,500 lines reviewed across 34 files.*
