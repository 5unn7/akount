# globals.css Restructure Plan

**Created:** 2026-02-14
**Status:** Complete

## Overview

Audit and restructure `apps/web/src/app/globals.css` to fix dead tokens, broken references, naming inconsistencies, and bridge Akount tokens to Tailwind utilities so components can stop hardcoding colors.

> **Scope:** Only `apps/web/src/` and `packages/ui/src/`. The `brand/` directory is reference material — not touched.

## Audit Findings

### 1. Dead / Broken Tokens in `@theme inline`

| Token Group | Count | Status |
|---|---|---|
| `--shadow-ak-*` | 3 | **Dead** — defined, never used anywhere |
| `gradient-radial/conic` | 2 | **Dead** — defined, never used |
| `--color-chart-*` | 5 | **Broken** — references undefined `--chart-1` etc. |
| `--color-ai-*` | 3 | **Dead** — defined, never used in components |
| `--color-finance-*` | 5 | **Nearly dead** — 1 usage in forbidden page |

### 2. `--ak-*` Tokens Not Bridged to Tailwind

27 `--ak-*` tokens defined in `.dark {}` but no Tailwind utilities exist for them. Devs can't write `text-ak-green` or `bg-ak-pri-dim` — so they hardcode raw hex/rgba instead.

**Result:** 180 hardcoded color values across 44 component files.

### 3. No Light Mode for `--ak-*`

All `--ak-*` tokens live exclusively inside `.dark {}`. Mode-agnostic values (`--ak-sidebar`, `--ak-topbar`, `--ak-r`, `--ak-ease`) are also trapped inside `.dark {}`.

### 4. Financial Colors Don't Switch Modes

`@theme inline` defines financial colors with **light-mode 500-level** values (`#10B981`) but the design aesthetic calls for **dark-mode 400-level** (`#34D399`). They're static.

### 5. Structural Nits

- Two separate `@layer base {}` blocks
- Glass utilities duplicate raw rgba values instead of referencing `--ak-border*` tokens
- No clear section headers for token groups

---

## Success Criteria

- [ ] Zero dead tokens — every token consumed somewhere
- [ ] `--ak-*` bridged to Tailwind → enables `text-ak-green`, `bg-ak-pri-dim`, etc.
- [ ] Financial/semantic colors switch between light & dark mode
- [ ] Mode-agnostic values (`sidebar`, `topbar`, `r`, `ease`) in `:root`
- [ ] Single `@layer base {}` block with clear section headers
- [ ] Glass/glow utilities reference token vars, not duplicated rgba
- [ ] Component files migrated from hardcoded hex to token utilities
- [ ] `npm run build` passes in apps/web

---

## Tasks

### Task 1: Remove dead tokens from `@theme inline`
**File:** `apps/web/src/app/globals.css`
**What:** Remove completely unused tokens: `--shadow-ak-*` (3), `gradient-radial/conic` (2), `--color-chart-*` (5). Keep `--color-finance-*` and `--color-ai-*` — they'll be fixed in Task 3.
**Depends on:** none
**Success:** No dangling references; build passes

### Task 2: Move mode-agnostic tokens to `:root`
**File:** `apps/web/src/app/globals.css`
**What:** Move layout/easing tokens from `.dark {}` to `:root {}`: `--ak-sidebar`, `--ak-topbar`, `--ak-r`, `--ak-r-sm`, `--ak-r-xs`, `--ak-ease`, `--ak-ease2`
**Depends on:** none
**Success:** Values available in both light and dark mode

### Task 3: Make `--ak-*` color tokens mode-aware
**File:** `apps/web/src/app/globals.css`
**What:**
- Define color `--ak-*` tokens in BOTH `:root` (light) and `.dark {}` (dark)
- Light: 500-level values + darker orange variants (from `design-system.css` `.light` class)
- Dark: 400-level values (current)
- Update `@theme inline` financial/AI tokens to resolve from `--ak-*` vars
- Add light-mode glass/border/surface overrides (inverted for light bg)
**Depends on:** Task 1
**Success:** Colors correct in both themes

### Task 4: Bridge `--ak-*` to Tailwind utilities via `@theme inline`
**File:** `apps/web/src/app/globals.css`
**What:** Register all `--ak-*` color tokens in `@theme inline`:
```css
--color-ak-green: var(--ak-green);
--color-ak-green-dim: var(--ak-green-dim);
--color-ak-pri-dim: var(--ak-pri-dim);
--color-ak-pri-hover: var(--ak-pri-hover);
--color-ak-pri-glow: var(--ak-pri-glow);
--color-ak-pri-text: var(--ak-pri-text);
--color-ak-blue: var(--ak-blue);
--color-ak-blue-dim: var(--ak-blue-dim);
--color-ak-teal: var(--ak-teal);
--color-ak-teal-dim: var(--ak-teal-dim);
--color-ak-red-dim: var(--ak-red-dim);
--color-ak-purple-dim: var(--ak-purple-dim);
--color-ak-bg-3: var(--ak-bg-3);
--color-ak-bg-4: var(--ak-bg-4);
--color-ak-t3: var(--ak-t3);
--color-ak-t4: var(--ak-t4);
```
This enables `text-ak-green`, `bg-ak-pri-dim`, `border-ak-border-2` in className.
**Depends on:** Task 3
**Success:** `className="text-ak-green"` renders correct color in both modes

### Task 5: Merge `@layer base` blocks + refactor glass/glow to use token vars
**File:** `apps/web/src/app/globals.css`
**What:**
- Merge the two `@layer base {}` blocks into one
- Glass utilities: replace hardcoded `rgba(255,255,255,0.09)` with `var(--ak-border)` etc.
- Glow utilities: reference `var(--ak-pri-glow)`, `var(--ak-green)` etc.
- Add clear section headers: Imports, Theme, Base, Utilities, Animations
**Depends on:** Task 4
**Success:** Single `@layer base` block. DRY glass/glow values.

### Task 6: Migrate hardcoded colors in component files
**Files:** ~44 files in `apps/web/src/` (180 occurrences)
**What:** Replace raw hex/rgba with token-backed Tailwind utilities:
- `#F59E0B` → `text-primary` / `bg-primary`
- `#34D399` → `text-ak-green`
- `#F87171` → `text-destructive` (already mapped) or `text-ak-red`
- `rgba(245,158,11,0.18)` → `bg-ak-pri-dim`
- `rgba(255,255,255,0.06)` → `border-white/[0.06]` (keep) or `border-ak-border`
- `#FBBF24` → `hover:bg-ak-pri-hover`

**Approach:** Work file-by-file, grouped by domain:
1. Layout (`Sidebar.tsx`, `Navbar.tsx`, `layout.tsx`) — 3 files
2. Accounts (`AccountRow`, `AccountCard`, `AccountDetail*`, etc.) — 8 files
3. Transactions (`TransactionsTable`, `Filters`, `BulkAction*`) — 5 files
4. Import (`ImportUploadForm`, `FileList*`, `ColumnMapping*`, etc.) — 8 files
5. Onboarding (`WelcomeStep`, `EssentialInfo*`, `EntityDetails*`, etc.) — 9 files
6. Dashboard (`DashboardMetrics`, `EntitiesList`, etc.) — 4 files
7. Accounting (`chart-of-accounts`, `journal-entries`) — 4 files
8. Shared/UI (`StatPill`, `circular-progress`, `switch`, `glow-card`) — 5 files

**Depends on:** Task 4 (utilities must exist first)
**Risk:** high — touches many files, needs visual spot-checking
**Success:** `Grep "#F59E0B|#34D399|#F87171|#60A5FA|#A78BFA|#2DD4BF|#FBBF24" apps/web/src --glob="*.tsx"` returns 0 (or near-zero for edge cases)

---

## Reference Files

- `brand/explorations/html/styles/design-system.css` — canonical token values with `.light` overrides
- `.claude/rules/design-aesthetic.md` — color tables, glass tiers, anti-patterns
- `brand/inspirations/financial-clarity-final.html` — visual reference (read-only)

## Edge Cases

- **shadcn HSL system** (`hsl(var(--primary))`) must stay intact — `--ak-*` supplements it
- **`glass-2` class** used in ~15 components — refactoring internals is safe since output identical
- **`rgba(255,255,255,0.06)` borders** in JSX — some may stay as Tailwind `border-white/[0.06]` if not worth a new token

## Testing Strategy

- Build: `npm run build` passes after each task
- Visual: toggle dark/light class, verify financial colors switch correctly
- Spot-check: verify 3-4 components per domain group after Task 6 migration
- Grep audit: confirm hardcoded hex counts decrease to target

## Progress

- [x] Task 1: Remove dead tokens
- [x] Task 2: Move mode-agnostic tokens to :root
- [x] Task 3: Make colors mode-aware
- [x] Task 4: Bridge to Tailwind utilities
- [x] Task 5: Merge @layer base + refactor glass/glow
- [x] Task 6: Migrate 44 component files

## Results

**Before:** 180 hardcoded hex/rgba values across 44 files, 18 dead tokens
**After:** 0 hardcoded hex values in .tsx files (verified via grep), all tokens live and consumed

**Files edited:** ~45 component files + globals.css
**Dev server:** Starts clean (Next.js 16.1.5 Turbopack)
