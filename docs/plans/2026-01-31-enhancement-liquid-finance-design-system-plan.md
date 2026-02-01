# Liquid Finance Design System Enhancement Plan

**Date:** 2026-01-31
**Type:** Enhancement
**Status:** Planning
**Related:**
- Brainstorm: `docs/brainstorms/2026-01-31-enhanced-design-system-brainstorm.md`
- Current Design System: `docs/design-system/`
- Demo Page: `apps/web/src/app/(dashboard)/demo/page.tsx`

---

## Summary

Enhance the existing Akount design system with glassmorphism effects, skeumorphic depth, cursor glow interactions, and smooth animations to create a modern "Liquid Finance" aesthetic. This transforms the functional foundation into a visually distinctive, premium experience while maintaining professionalism for financial data.

**Current State:** Solid foundation with dark/light mode, semantic tokens, basic components
**Target State:** Modern iOS-inspired liquid glass aesthetic with delightful micro-interactions
**Effort:** 4-5 days
**Risk:** Low (progressive enhancement, graceful degradation)

---

## User Story

As a Canadian freelancer using Akount, I want the accounting interface to feel modern, premium, and delightful so that managing my finances is less boring and more enjoyable, while still feeling professional and trustworthy.

---

## Success Criteria

### Functional
- [ ] Glass effects applied to dashboard cards, navigation, modals
- [ ] Cursor glow effect tracks mouse on interactive cards
- [ ] Smooth hover animations on cards (lift, shadow expansion)
- [ ] Number counter animations for financial amounts
- [ ] Loading states with skeleton shimmer

### Technical
- [ ] 60 FPS performance maintained (16ms frame budget)
- [ ] WCAG AA contrast ratios (4.5:1 minimum)
- [ ] Respects `prefers-reduced-motion` preference
- [ ] Works in 99% of browsers (with fallbacks)
- [ ] No layout thrashing from cursor tracking

### Quality
- [ ] All animations tested in both light and dark modes
- [ ] Performance profiled on low-end devices
- [ ] Accessibility tested with screen readers
- [ ] Visual QA matches brainstorm specifications

---

## Technical Approach

### Architecture

**Components Affected:**
- **Frontend Pages:** `apps/web/src/app/(dashboard)/**/*.tsx`
- **UI Components:** `apps/web/src/components/ui/*.tsx`
- **Layout:** `apps/web/src/components/layout/*.tsx`
- **Styles:** `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`
- **Utilities:** NEW - `apps/web/src/lib/animations.ts`, `apps/web/src/hooks/useCursorGlow.ts`

**Key Decisions:**

1. **Animation Approach:** Tailwind + Native CSS (NO Framer Motion)
   - **Why:** Project already uses `tailwindcss-animate`, zero runtime cost, server component compatible
   - **Trade-off:** Less flexible than Motion library, but better performance and simpler architecture

2. **Glass Implementation:** Pure CSS with `backdrop-filter`
   - **Why:** 99% browser support, GPU-accelerated, graceful degradation
   - **Fallback:** Higher opacity backgrounds without blur for unsupported browsers

3. **Cursor Tracking:** CSS Variables + Direct DOM Manipulation
   - **Why:** Avoids React re-renders on every mousemove (60fps requirement)
   - **Pattern:** `requestAnimationFrame` + CSS custom properties

4. **Server vs Client:** Maximize Server Components
   - **Server:** All data fetching pages (no animations)
   - **Client:** Only components with interactivity (cursor tracking, hover effects)
   - **Hybrid:** Server Components pass data to Client animation wrappers

### Data Model Changes

**None Required** - Pure visual enhancement, no database changes.

### API Endpoints

**None Required** - No backend changes needed.

### UI Components

**Enhanced Existing Components:**
- `components/ui/card.tsx` - Add glass variants + hover animations
- `components/ui/button.tsx` - Add press animations (scale down)
- `components/ui/input.tsx` - Add focus glow effects
- `components/layout/Sidebar.tsx` - Apply glass background
- `components/layout/Navbar.tsx` - Apply glass background

**New Components:**
- `components/ui/animated-number.tsx` - Counter animation for amounts
- `components/animations/cursor-tracker.tsx` - Cursor glow effect
- `components/animations/fade-in.tsx` - Reusable fade-in wrapper
- `components/animations/slide-in.tsx` - Reusable slide-in wrapper

**Design System:**
- Extend existing orange/violet/slate palette with glass utilities
- New Tailwind utilities: `glass`, `glass-card`, `glass-modal`, `glow-hover`
- Shadow system: 3-4 layer shadows for depth
- Animation timing: 200ms (micro), 300ms (standard), 500ms (emphasis)

---

## Implementation Phases

### Phase 1: Foundation & Utilities (Day 1, 6-8 hours)

**Goal:** Create reusable utilities and base animation infrastructure

**Tasks:**

#### 1.1: Tailwind Glass Utilities
- [ ] Add glass effect utilities to `globals.css`
  - `.glass` - Light mode glass (85% opacity, 10px blur)
  - `.glass-dark` - Dark mode glass (85% opacity, 10px blur)
  - `.glass-modal` - Heavier blur for modals (90% opacity, 16px blur)
  - Mobile optimization (8px blur)
  - High contrast mode fallback (remove blur, solid backgrounds)
  - `@supports` fallback for unsupported browsers

```css
@layer utilities {
  .glass {
    position: relative;
    background: rgba(255, 255, 255, 0.85);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transform: translateZ(0);
    contain: layout paint;
  }

  .dark .glass {
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Mobile optimization */
  @media (max-width: 768px) {
    .glass {
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .glass {
      background: rgb(255, 255, 255);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: 2px solid hsl(var(--border));
    }
  }

  /* Unsupported browser fallback */
  @supports not (backdrop-filter: blur(10px)) {
    .glass {
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .glass {
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
    }
  }
}
```

#### 1.2: Multi-Layer Shadow System
- [ ] Define shadow tokens in `globals.css`
  - `shadow-depth-1` - Subtle elevation (cards)
  - `shadow-depth-2` - Medium elevation (modals)
  - `shadow-depth-3` - High elevation (tooltips)
  - Skeumorphic shadows with 3-4 layers (ambient + direct + contact)

```css
@layer utilities {
  .shadow-depth-1 {
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 4px 8px rgba(0, 0, 0, 0.04);
  }

  .shadow-depth-2 {
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.06),
      0 4px 8px rgba(0, 0, 0, 0.06),
      0 8px 16px rgba(0, 0, 0, 0.06),
      0 16px 32px rgba(0, 0, 0, 0.06);
  }

  .dark .shadow-depth-1 {
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.2);
  }
}
```

#### 1.3: Cursor Glow Hook
- [ ] Create `apps/web/src/hooks/useCursorGlow.ts`
  - Uses CSS variables for performance (no React re-renders)
  - `requestAnimationFrame` for smooth updates
  - Cleanup on unmount

```typescript
'use client'

import { useEffect, useRef } from 'react'

export function useCursorGlow(
  enabled: boolean = true,
  color: 'primary' | 'secondary' = 'primary'
) {
  const rafRef = useRef<number>()
  const positionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled) return

    const updatePosition = (e: MouseEvent) => {
      positionRef.current = { x: e.clientX, y: e.clientY }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          '--cursor-x',
          `${positionRef.current.x}px`
        )
        document.documentElement.style.setProperty(
          '--cursor-y',
          `${positionRef.current.y}px`
        )
        document.documentElement.style.setProperty(
          '--cursor-color',
          color === 'primary' ? '25, 95%, 53%' : '262, 83%, 58%'
        )
      })
    }

    window.addEventListener('mousemove', updatePosition)

    return () => {
      window.removeEventListener('mousemove', updatePosition)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [enabled, color])
}
```

#### 1.4: Animation Constants
- [ ] Create `apps/web/src/lib/animations.ts`
  - Duration constants
  - Easing functions
  - Common animation variants

```typescript
export const ANIMATION_DURATION = {
  micro: 200,      // Quick feedback (button press)
  standard: 300,   // Default transitions
  emphasis: 500,   // Important state changes
  slow: 700,       // Page transitions
} as const

export const ANIMATION_EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const ANIMATION_PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

**Review Points:**
- [ ] Test glass effects in Chrome, Firefox, Safari, Edge
- [ ] Verify contrast ratios with WCAG tool
- [ ] Profile backdrop-filter performance (< 16ms per frame)

---

### Phase 2: Core Component Enhancements (Day 2-3, 12-16 hours)

**Goal:** Apply glass effects and animations to existing components

#### 2.1: Enhanced Card Component
- [ ] Update `components/ui/card.tsx`
  - Add `glass` variant (uses `.glass` utility)
  - Add `glow` prop for cursor tracking
  - Add hover lift animation
  - Expand shadow on hover

```typescript
// components/ui/card.tsx
'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useCursorGlow } from "@/hooks/useCursorGlow"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'glass'
    glow?: boolean
  }
>(({ className, variant = 'default', glow = false, ...props }, ref) => {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = React.useState(false)

  useCursorGlow(glow && isHovered)

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border shadow",
        variant === 'glass' && "glass",
        variant === 'default' && "bg-card text-card-foreground",
        glow && "relative overflow-hidden",
        "transition-all duration-300",
        "hover:-translate-y-2 hover:shadow-depth-2",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {glow && isHovered && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: '200px',
            height: '200px',
            left: 'var(--cursor-x)',
            top: 'var(--cursor-y)',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(
              circle,
              hsla(var(--cursor-color), 0.15),
              transparent 70%
            )`,
            transition: 'opacity 300ms ease',
          }}
        />
      )}
      {props.children}
    </div>
  )
})
Card.displayName = "Card"

export { Card }
```

#### 2.2: Glass Sidebar & Navbar
- [ ] Update `components/layout/Sidebar.tsx`
  - Apply `.glass` background
  - Add smooth transitions on nav item hover
  - Glow effect on active item

```typescript
// Sidebar.tsx enhancement
<div className={cn(
  "pb-12 h-full glass", // Add glass utility
  className
)}>
  {/* Existing content */}
</div>
```

- [ ] Update `components/layout/Navbar.tsx`
  - Apply `.glass` background
  - Ensure theme toggle stays readable

```typescript
// Navbar.tsx enhancement
<div className="flex items-center p-4 border-b h-16 glass">
  {/* Existing content */}
</div>
```

#### 2.3: Enhanced Input Component
- [ ] Update `components/ui/input.tsx`
  - Inner shadow for depth (skeumorphic)
  - Outer glow on focus (brand color)
  - Smooth border transitions

```typescript
// components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input",
          "bg-background/50 px-3 py-1 text-base",
          "shadow-inner", // Skeumorphic depth
          "transition-all duration-300",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:shadow-[0_0_16px_rgba(249,115,22,0.2)]", // Glow
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

#### 2.4: Animated Button Component
- [ ] Update `components/ui/button.tsx`
  - Add press animation (scale down on click)
  - Smooth transitions

```typescript
// buttonVariants enhancement
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-md text-sm font-medium",
    "transition-all duration-200", // Changed from transition-colors
    "active:scale-[0.98]", // Press animation
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
  ),
  // ... rest of variants
)
```

#### 2.5: Animated Number Component (NEW)
- [ ] Create `components/ui/animated-number.tsx`
  - Count up animation for financial amounts
  - Respects `prefers-reduced-motion`
  - Formatted with currency/locale

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { ANIMATION_DURATION, ANIMATION_PREFERS_REDUCED_MOTION } from '@/lib/animations'

interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: 'currency' | 'number' | 'percent'
  currency?: string
  locale?: string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = ANIMATION_DURATION.emphasis,
  format = 'currency',
  currency = 'CAD',
  locale = 'en-CA',
  className = ''
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    if (ANIMATION_PREFERS_REDUCED_MOTION) {
      setDisplayValue(value)
      return
    }

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(value * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  const formatted = new Intl.NumberFormat(locale, {
    style: format === 'currency' ? 'currency' : 'decimal',
    currency: format === 'currency' ? currency : undefined,
    minimumFractionDigits: format === 'currency' ? 2 : 0,
    maximumFractionDigits: format === 'currency' ? 2 : 0,
  }).format(displayValue)

  return <span className={className}>{formatted}</span>
}
```

**Review Points:**
- [ ] Run `nextjs-app-router-reviewer` on Client Components
- [ ] Test all components in both light and dark modes
- [ ] Verify hover states don't conflict with accessibility

---

### Phase 3: Micro-interactions & Polish (Day 3-4, 6-8 hours)

**Goal:** Add delightful animations to enhance user experience

#### 3.1: Loading States with Shimmer
- [ ] Create `components/ui/skeleton.tsx` enhancement
  - Add shimmer animation
  - Glass background variant

```typescript
// components/ui/skeleton.tsx
const Skeleton = ({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'glass'
}) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        variant === 'default' && "bg-muted",
        variant === 'glass' && "glass bg-muted/30",
        "relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

// Add to tailwind.config.ts animations
module.exports = {
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
}
```

#### 3.2: Page Transition Wrapper
- [ ] Create `components/animations/page-transition.tsx`
  - Simple fade-in on page load
  - No complex page transitions (broken in App Router)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ANIMATION_PREFERS_REDUCED_MOTION } from '@/lib/animations'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (ANIMATION_PREFERS_REDUCED_MOTION) {
    return <>{children}</>
  }

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        mounted ? "opacity-100" : "opacity-0"
      )}
    >
      {children}
    </div>
  )
}
```

#### 3.3: Hover Card Enhancement
- [ ] Update `components/ui/hover-card.tsx`
  - Glass background for tooltip
  - Smooth scale-in animation

```typescript
// HoverCardContent enhancement
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "glass-modal z-50 rounded-md p-4", // Use glass-modal
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
```

#### 3.4: Dashboard Enhancements
- [ ] Update dashboard cards to use new variants
- [ ] Add `AnimatedNumber` to financial amounts
- [ ] Apply cursor glow to key cards

```typescript
// apps/web/src/app/(dashboard)/dashboard/page.tsx
<Card variant="glass" glow>
  <CardHeader>
    <CardTitle>Cash Balance</CardTitle>
  </CardHeader>
  <CardContent>
    <AnimatedNumber
      value={45234.50}
      format="currency"
      currency="CAD"
      className="font-mono text-4xl font-bold"
    />
  </CardContent>
</Card>
```

**Review Points:**
- [ ] Run `performance-oracle` to check for jank
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Verify loading states look good in both modes

---

### Phase 4: Testing, Accessibility & Documentation (Day 4-5, 6-8 hours)

**Goal:** Ensure quality, accessibility, and maintainability

#### 4.1: Performance Testing
- [ ] Profile animation performance
  - Use Chrome DevTools Performance tab
  - Measure frame rate (target 60 FPS)
  - Check for layout thrashing
  - Test on low-end device (2019 MacBook Air or equivalent)

- [ ] Optimize as needed
  - Reduce blur values if needed
  - Limit number of glassmorphic elements per viewport
  - Use `will-change` sparingly

```typescript
// Performance monitoring component
'use client'

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTime

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed)
        if (fps < 30) {
          console.warn(`⚠️ Poor FPS: ${fps}`)
        }
        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    measureFPS()
  }, [])

  return null
}
```

#### 4.2: Accessibility Audit
- [ ] Test with keyboard navigation
  - Focus indicators visible
  - Tab order logical
  - No keyboard traps

- [ ] Test with screen readers
  - NVDA (Windows)
  - VoiceOver (Mac)
  - Ensure animations don't hide content

- [ ] Verify contrast ratios
  - Use WebAIM Contrast Checker
  - Test text on glass backgrounds
  - Ensure WCAG AA compliance (4.5:1)

- [ ] Respect user preferences
  - `prefers-reduced-motion` - disable/simplify animations
  - `prefers-contrast: high` - remove glass, use solid backgrounds
  - `prefers-color-scheme` - already handled by theme system

#### 4.3: Browser Compatibility Testing
- [ ] Test in major browsers
  - Chrome 120+ (primary)
  - Firefox 120+
  - Safari 17+ (check `-webkit-backdrop-filter`)
  - Edge 120+

- [ ] Test fallbacks
  - Browsers without `backdrop-filter` support
  - Verify solid backgrounds with higher opacity

#### 4.4: Update Demo Page
- [ ] Add new sections to `/demo`
  - Glass effect showcase
  - Cursor glow demonstration
  - Animated number examples
  - Before/after comparison

```typescript
// Add to apps/web/src/app/(dashboard)/demo/page.tsx

{/* Glass Effect Showcase */}
<Card>
  <CardHeader>
    <CardTitle>Glass Morphism Effects</CardTitle>
    <CardDescription>
      Liquid glass effects with backdrop blur
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card variant="glass" className="p-6">
        <p className="font-medium">Glass Card (Light)</p>
        <p className="text-sm text-muted-foreground">
          85% opacity, 10px blur
        </p>
      </Card>

      <Card variant="glass" glow className="p-6">
        <p className="font-medium">Glass Card with Glow</p>
        <p className="text-sm text-muted-foreground">
          Hover to see cursor effect
        </p>
      </Card>
    </div>
  </CardContent>
</Card>

{/* Animated Numbers */}
<Card>
  <CardHeader>
    <CardTitle>Animated Numbers</CardTitle>
    <CardDescription>
      Financial amounts with counter animations
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <p className="text-sm text-muted-foreground mb-2">Currency</p>
      <AnimatedNumber
        value={45234.50}
        format="currency"
        currency="CAD"
        className="font-mono text-3xl font-bold text-foreground"
      />
    </div>
    <div>
      <p className="text-sm text-muted-foreground mb-2">Percentage</p>
      <AnimatedNumber
        value={87.5}
        format="percent"
        className="font-mono text-2xl font-semibold text-green-600"
      />
    </div>
  </CardContent>
</Card>
```

#### 4.5: Update Documentation
- [ ] Update `docs/design-system/README.md`
  - Add glass utilities section
  - Document animation constants
  - Link to new components

- [ ] Update `docs/design-system/theme-system.md`
  - Add glass effect usage guide
  - Document performance considerations

- [ ] Create `docs/design-system/animations.md` (NEW)
  - Animation timing guidelines
  - Performance best practices
  - Accessibility considerations

- [ ] Update `docs/design-system/COMPONENTS-REFERENCE.md`
  - Document new Card variants
  - Add AnimatedNumber usage
  - Include cursor glow examples

**Review Points:**
- [ ] Run full suite of review agents (architecture, performance, accessibility)
- [ ] Get stakeholder sign-off on visual direction
- [ ] Verify demo page works in all scenarios

---

## Security Considerations

**N/A** - Pure visual enhancement, no security implications.

- [ ] No user data in animations or effects
- [ ] No authentication/authorization changes
- [ ] No sensitive data exposed in DOM
- [ ] No XSS vectors introduced

---

## Performance Considerations

### GPU Optimization
- [ ] Use `transform` and `opacity` only (GPU-accelerated)
- [ ] Avoid animating `backdrop-filter` directly (expensive)
- [ ] Use `will-change` sparingly (only during active animations)
- [ ] Apply `contain: layout paint` for performance isolation

### Frame Budget
- [ ] Target 60 FPS (16.67ms per frame)
- [ ] Profile with Chrome DevTools Performance tab
- [ ] Monitor for layout thrashing (read/write cycles)
- [ ] Test on low-end devices (2019 MacBook Air baseline)

### Blur Values
- [ ] Desktop: 10-12px (sweet spot for performance)
- [ ] Mobile: 6-8px (lower-powered devices)
- [ ] Maximum 2-3 glassmorphic elements per viewport
- [ ] Reduce blur in `prefers-reduced-motion`

### Cursor Tracking
- [ ] Use CSS variables (no React state updates)
- [ ] `requestAnimationFrame` for batched DOM updates
- [ ] No layout thrashing (separate reads from writes)
- [ ] Cleanup on unmount (cancel RAF, remove listeners)

### Caching & Memoization
- [ ] Use React.memo for expensive animated components
- [ ] Memoize animation constants
- [ ] Avoid recreating functions in render

---

## Accessibility Considerations

### WCAG AA Compliance
- [ ] Text contrast: 4.5:1 minimum on glass backgrounds
- [ ] Large text contrast: 3:1 minimum
- [ ] Use semi-opaque backing layers for critical text

### Motion Preferences
- [ ] Respect `prefers-reduced-motion`
  - Disable/simplify animations
  - Reduce blur values
  - Skip cursor tracking
- [ ] Provide visual feedback without motion (color changes)

### High Contrast Mode
- [ ] Remove glass effects in `prefers-contrast: high`
- [ ] Use solid backgrounds with strong borders
- [ ] Maintain all functionality

### Keyboard Navigation
- [ ] Visible focus indicators
- [ ] Animations don't trap focus
- [ ] Glass effects don't obscure focused elements

### Screen Readers
- [ ] Animations don't hide content from AT
- [ ] ARIA labels remain readable
- [ ] No animation-dependent functionality

---

## Testing Strategy

### Unit Tests
**Not Required** - Pure visual enhancements, no business logic to test.

### Visual Regression Tests
- [ ] Screenshot testing (optional)
  - Capture demo page in light/dark modes
  - Compare before/after screenshots
  - Tools: Percy, Chromatic, or manual QA

### Performance Tests
- [ ] Chrome DevTools Performance profiling
  - Record 10 seconds of interaction
  - Verify 60 FPS maintained
  - Check for long tasks (>50ms)

### Browser Tests
- [ ] Manual testing in 4 major browsers
- [ ] Test fallbacks for unsupported features
- [ ] Verify mobile responsiveness

### Accessibility Tests
- [ ] WAVE browser extension
- [ ] axe DevTools
- [ ] Manual keyboard navigation
- [ ] Screen reader testing (NVDA, VoiceOver)

---

## Rollout Plan

### Development
1. Create feature branch: `feature/liquid-finance-design-system`
2. Implement in phases (1 → 2 → 3 → 4)
3. Self-review after each phase
4. Commit after each phase completes

### Staging
1. Deploy to staging environment
2. Manual QA in all browsers
3. Performance profiling
4. Accessibility audit
5. Stakeholder review

### Production
1. Merge to main after approval
2. Deploy during low-traffic period
3. Monitor performance metrics
4. Monitor error rates
5. Gather user feedback

### Rollback Plan
- If performance issues detected (FPS < 30):
  - Reduce blur values
  - Limit glassmorphic elements
  - Disable cursor glow
- If accessibility issues:
  - Increase opacity of glass backgrounds
  - Strengthen borders
  - Enhance contrast
- If browser compatibility issues:
  - Verify fallbacks working
  - Adjust feature detection

---

## Open Questions

- [x] ~~Should we use Framer Motion?~~ → No, use Tailwind + native CSS
- [x] ~~Which areas need glass effects?~~ → Cards, nav, modals
- [x] ~~Animation intensity level?~~ → Moderate
- [ ] Do we need sound effects for interactions? (e.g., subtle click sounds)
- [ ] Should we add parallax scrolling on dashboard?
- [ ] Custom cursor pointer to replace default arrow?

---

## Dependencies

**Blocked by:** None - can start immediately
**Blocks:** Phase 1 dashboard development (benefits from enhanced design system)

---

## Resources

**Internal:**
- Brainstorm: `docs/brainstorms/2026-01-31-enhanced-design-system-brainstorm.md`
- Current Demo: `apps/web/src/app/(dashboard)/demo/page.tsx`
- Design System: `docs/design-system/`

**External Research:**
- Glassmorphism best practices (web.dev, CSS-Tricks)
- WCAG 2.2 contrast guidelines
- Next.js 16 animation patterns
- Cursor tracking performance optimization

**Inspiration:**
- Apple iOS Wallet (glass effects)
- Stripe Dashboard (professional + modern)
- Linear app (subtle animations)
- Vercel Dashboard (minimal + polished)

---

## Estimation

**Complexity:** Medium
**Effort:** 4-5 days (32-40 hours)
**Risk:** Low

**Effort Breakdown:**
- Phase 1 (Foundation): 6-8 hours
- Phase 2 (Components): 12-16 hours
- Phase 3 (Micro-interactions): 6-8 hours
- Phase 4 (Testing & Docs): 6-8 hours

**Risk Factors:**
- **Low Risk:** Pure visual enhancement, graceful degradation
- **Performance:** Mitigated by GPU optimization and blur limits
- **Accessibility:** Mitigated by fallbacks and motion preferences
- **Browser Compat:** 99% support with fallbacks

**Why Low Risk:**
1. Progressive enhancement (works without effects)
2. No data model changes
3. No API changes
4. Existing foundation solid
5. Graceful degradation built-in

---

**Next Step:** Begin Phase 1 implementation with `/processes:work` or start coding directly.
