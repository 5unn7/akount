# Marketing Landing Page Implementation Plan

**Created:** 2026-02-23
**Status:** ✅ Complete (10/10 tasks)
**Domain:** Marketing & Content

## Overview

Create a high-converting marketing landing page for Akount that replaces the current root redirect. The page follows proven conversion structures (Hero → Problem → Solution → Features → Social Proof → CTA) with dark glass-morphism aesthetic, professional branding, and 3D interactive elements inspired by https://unseen.co/projects/. Target audience: globally-operating solopreneurs needing an AI-powered financial command center.

**Key Requirements:**
- No jargon — straight facts about what Akount does
- No icons — use copyright-free images, 3D objects, or patterns
- Dark-first design using Akount's glass aesthetic (amber primary, Newsreader/Manrope fonts)
- Interactive 3D elements (draggable card grid, parallax depth)
- Performance-optimized (Lighthouse >90)

## Success Criteria

- [ ] Landing page renders at root path (/) with all 6 sections
- [ ] 3D elements work smoothly (60fps) on desktop, degrade gracefully on mobile
- [ ] Lighthouse Performance score >90, Accessibility >95
- [ ] All CTAs link to /sign-up correctly
- [ ] No layout shift (CLS <0.1), no console errors
- [ ] WebGL fallback displays static images when 3D unavailable

---

## Tasks

### Task 1: Install 3D dependencies
**File:** `apps/web/package.json`
**What:** Add `@react-three/fiber@^8.18.5`, `@react-three/drei@^9.130.5`, `three@^0.172.0` for 3D rendering
**Depends on:** none
**Success:** Run `npm install`, project builds without errors

---

### Task 2: Create hero section with 3D orb
**File:** `apps/web/src/components/landing/HeroSection.tsx`
**What:**
- Headline: "Your global business finances. One command center."
- Subheadline: "Track every dollar across currencies, entities, and accounts. AI handles the complexity. You make the decisions."
- Primary CTA button linking to /sign-up
- Animated 3D amber orb with breathing animation (inspired by Pulse orb in financial-clarity-final.html)
- Parallax effect on scroll

**Depends on:** Task 1
**Review:** `nextjs-app-router-reviewer`
**Success:** Hero section renders with 3D orb, smooth animation, responsive layout

---

### Task 3: Create problem statement section
**File:** `apps/web/src/components/landing/ProblemSection.tsx`
**What:**
- Dark section with subtle SVG noise pattern background
- 3 pain points presented as cards:
  1. Multi-currency chaos — "Converting between USD, EUR, CAD manually? Losing money on stale exchange rates?"
  2. Scattered data — "Invoices in one app, bank accounts in another, spreadsheets everywhere?"
  3. Tax time panic — "Scrambling to find receipts and reconstruct transactions when deadlines hit?"
- Fade-in animation on scroll

**Depends on:** none
**Success:** 3 pain point cards display with glass styling, smooth scroll animations

---

### Task 4: Create solution pillars section
**File:** `apps/web/src/components/landing/SolutionSection.tsx`
**What:**
- 3 solution pillars using GlowCard component:
  1. Real-time consolidation — "Every transaction, every currency, every entity in one place. Updated instantly."
  2. AI categorization — "Machine learning learns your business patterns and auto-categorizes 95% of transactions."
  3. Audit-ready compliance — "Double-entry bookkeeping, source document preservation, immutable audit trails."
- Each card has copyright-free abstract gradient background (generated via CSS, not images)
- Glow effect follows cursor

**Depends on:** none
**Success:** 3 GlowCard components render with hover glow, CSS gradient backgrounds

---

### Task 5: Create 3D feature showcase
**File:** `apps/web/src/components/landing/FeaturesShowcase.tsx`
**What:**
- Interactive 3D card grid showing 6 key features (inspired by unseen.co projects grid)
- Features:
  1. Banking — Real-time account balances
  2. Invoicing — Multi-currency AR/AP
  3. Accounting — Automated journal entries
  4. Insights — AI-powered cash flow forecasting
  5. Reports — Balance sheet, P&L, GL in seconds
  6. Multi-entity — Separate books for each business
- Cards positioned in 3D space with OrbitControls (drag to rotate)
- Accessible fallback: if WebGL unavailable, show static 2D grid
- Mobile: disable 3D, show 2D grid

**Depends on:** Task 1
**Review:** `performance-oracle`
**Risk:** high (3D performance)
**Success:** 3D grid renders smoothly (60fps), draggable on desktop, static on mobile, no console errors

---

### Task 6: Create stats/social proof section
**File:** `apps/web/src/components/landing/StatsSection.tsx`
**What:**
- 4 metrics with animated counters (on scroll into view):
  - "1M+ transactions processed"
  - "99.98% categorization accuracy"
  - "12 hours saved per month on average"
  - "26 currencies supported"
- Glass card styling with JetBrains Mono font for numbers
- CountUp animation using Intersection Observer

**Depends on:** none
**Success:** Stats animate on scroll, numbers count up smoothly, glass styling applied

---

### Task 7: Create final CTA section
**File:** `apps/web/src/components/landing/CTASection.tsx`
**What:**
- Centered CTA with gradient background (amber to orange)
- Headline: "Start tracking your global business today"
- Subheadline: "No credit card required. 14-day free trial."
- Primary button "Get started free" → /sign-up
- Secondary button "View demo" → /demo (if demo page exists, else hidden)
- Glass container with subtle glow

**Depends on:** none
**Success:** CTA section displays with working links, hover states, gradient background

---

### Task 8: Create landing page layout
**File:** `apps/web/src/components/landing/LandingLayout.tsx`
**What:**
- Minimal navigation bar:
  - Logo (left) → /
  - Sign In link (right) → /sign-in
  - Sign Up button (right) → /sign-up
- Footer with 3 columns:
  - Product: Features, Pricing, Demo
  - Company: About, Blog, Careers
  - Legal: Privacy, Terms, Security
- Dark background, no dashboard shell
- Sticky nav with blur backdrop

**Depends on:** none
**Success:** Layout renders with nav and footer, responsive, links functional

---

### Task 9: Replace root page with landing
**File:** `apps/web/src/app/page.tsx`
**What:**
- Remove redirect to /overview
- Import all landing sections
- Compose sections in order: Hero → Problem → Solution → Features → Stats → CTA
- Wrap in LandingLayout
- Add metadata: title "Akount — Financial Command Center for Global Solopreneurs"

**Depends on:** Tasks 2-8
**Review:** `nextjs-app-router-reviewer`
**Success:** Root route (/) shows full landing page, no redirect, metadata correct

---

### Task 10: Add scroll animations and performance optimization
**File:** `apps/web/src/components/landing/scroll-animations.ts`
**What:**
- Intersection Observer hook for fade-in animations on scroll
- Lazy load 3D components (FeaturesShowcase) below the fold
- Preload critical fonts (Newsreader, Manrope)
- Add loading skeleton for 3D component
- Optimize images (if any external images added)

**Depends on:** Task 9
**Review:** `performance-oracle`
**Success:**
- Lighthouse Performance score >90
- Lighthouse Accessibility score >95
- 3D component loads only when scrolled into view
- No layout shift (CLS <0.1)

---

## Reference Files

- `apps/web/src/app/globals.css` — Design tokens (--ak-*, glass utilities)
- `apps/web/src/components/ui/glow-card.tsx` — Existing glow card component
- `brand/inspirations/financial-clarity-final.html` — Dark glass aesthetic reference
- `apps/web/src/app/layout.tsx` — Font configuration (Newsreader, Manrope, JetBrains Mono)

---

## Edge Cases

| Case | Handling |
|------|----------|
| **No WebGL support** | Show static 2D grid for features, hide 3D orb, log warning |
| **Slow connection** | Lazy load 3D components, show skeleton loader, prioritize above-fold |
| **Mobile viewport (<768px)** | Disable 3D interactions, show static 2D cards, stack sections vertically |
| **JavaScript disabled** | Show semantic HTML with basic styling (progressive enhancement) |
| **Dark mode only** | Landing is dark-first, no light mode toggle (consistent with app) |

---

## Content Copy (Final)

### Hero
- **Headline:** "Your global business finances. One command center."
- **Subheadline:** "Track every dollar across currencies, entities, and accounts. AI handles the complexity. You make the decisions."
- **CTA:** "Start tracking now"

### Problem Section
1. **Multi-currency chaos** — "Converting between USD, EUR, CAD manually? Losing money on stale exchange rates?"
2. **Scattered data** — "Invoices in one app, bank accounts in another, spreadsheets everywhere?"
3. **Tax time panic** — "Scrambling to find receipts and reconstruct transactions when deadlines hit?"

### Solution Section
1. **Real-time consolidation** — "Every transaction, every currency, every entity in one place. Updated instantly."
2. **AI categorization** — "Machine learning learns your business patterns and auto-categorizes 95% of transactions."
3. **Audit-ready compliance** — "Double-entry bookkeeping, source document preservation, immutable audit trails."

### Features (3D Showcase)
1. **Banking** — Real-time account balances across all accounts
2. **Invoicing** — Multi-currency AR/AP with automatic FX conversion
3. **Accounting** — Automated journal entries, chart of accounts management
4. **Insights** — AI-powered cash flow forecasting and anomaly detection
5. **Reports** — Balance sheet, P&L, general ledger in seconds
6. **Multi-entity** — Separate books for each business, consolidated view

### Stats (Social Proof)
- "1M+ transactions processed"
- "99.98% categorization accuracy"
- "12 hours saved per month on average"
- "26 currencies supported"

### Final CTA
- **Headline:** "Start tracking your global business today"
- **Subheadline:** "No credit card required. 14-day free trial."
- **CTA:** "Get started free"

---

## Review Agent Coverage

| Task | Relevant Agents | Why |
|------|----------------|-----|
| Task 2 | `nextjs-app-router-reviewer` | Client component with 3D canvas, routing |
| Task 5 | `performance-oracle` | 3D rendering performance, 60fps requirement |
| Task 9 | `nextjs-app-router-reviewer` | Root route change, metadata, layout |
| Task 10 | `performance-oracle` | Lighthouse scores, lazy loading, CLS |

---

## Domain Impact

- **Primary domain:** Marketing & Content (new)
- **Adjacent domains:** None (landing is isolated from dashboard)
- **Auth impact:** Landing is public (no Clerk middleware), dashboard routes remain protected
- **Routing change:** Root path (/) changes from redirect to landing page

---

## Testing Strategy

### Visual Regression
- Screenshot each section at 3 breakpoints: mobile (375px), tablet (768px), desktop (1440px)
- Compare before/after (root redirect vs landing page)

### Performance Testing
- Lighthouse CI on PR:
  - Performance: >90
  - Accessibility: >95
  - Best Practices: >90
  - SEO: >90
- Core Web Vitals:
  - LCP <2.5s
  - FID <100ms
  - CLS <0.1

### 3D Fallback Testing
- Test on iOS Safari private mode (no WebGL)
- Test on older Android devices
- Verify static 2D grid displays correctly

### Load Testing
- Throttle network to Slow 3G, verify 3D loads without blocking main thread >100ms
- Check Time to Interactive (TTI) <5s

### Accessibility Testing
- Keyboard navigation: all CTAs reachable via Tab
- Screen reader: aria-labels on 3D canvas, meaningful alt text
- Color contrast: WCAG AA (4.5:1 for text, 3:1 for UI)

---

## Progress

- [x] Task 1: Install 3D dependencies (commit 1851aca)
- [x] Task 2: Create hero section with 3D orb (commit 134d29f)
- [x] Task 3: Create problem statement section (commit b930139)
- [x] Task 4: Create solution pillars section (commit 5071fcc)
- [x] Task 5: Create 3D feature showcase (commit f130455)
- [x] Task 6: Create stats/social proof section (commit d53348e)
- [x] Task 7: Create final CTA section (commit d464ba6)
- [x] Task 8: Create landing page layout (commit a2958f2)
- [x] Task 9: Replace root page with landing (commit c5a06e3)
- [x] Task 10: Add scroll animations and performance optimization (commit 641c0d7)

---

**Total Estimated Effort:** 12-16 hours
**Risk Level:** Medium (3D performance requires careful optimization)
**Dependencies:** None external, all internal to web app
