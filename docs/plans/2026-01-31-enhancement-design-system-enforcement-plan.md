# Design System Enforcement - Implementation Plan

**Date:** 2026-01-31
**Type:** Enhancement
**Status:** Planning
**Priority:** MEDIUM
**Related:** `docs/plans/2026-01-31-enhancement-claude-code-modular-plan.md`, `docs/design-system/`

---

## Summary

Add comprehensive design system enforcement through both automatic rules (`.claude/rules/design-system.md`) and deep review agent (`.claude/agents/review/design-system-reviewer.md`). Rules auto-enforce critical patterns (color palette, component library, typography) while agent provides on-demand deep review (spacing, contrast, accessibility).

**Scope:** All UI rendering (web app + email templates + PDF generation + reports)

**Timeline:** 3-4 hours
- Phase 0: Audit current state (1 hour)
- Phase 1: Create design system rules file (1 hour)
- Phase 2: Create design system review agent (1 hour)
- Phase 3: Fix existing violations (1 hour, if needed)

---

## User Story

As a **developer building UI**, I want **automatic design system enforcement** so that **I use correct colors, typography, and components without thinking, and can run deep accessibility/spacing reviews before PRs**.

---

## Success Criteria

### Immediate (Implementation Complete)
- [ ] `.claude/rules/design-system.md` created with path-scoped enforcement
- [ ] `.claude/agents/review/design-system-reviewer.md` created for deep reviews
- [ ] Current violations identified (if any)
- [ ] Team understands when rules apply vs when to use agent

### Short-Term (Week 1-2)
- [ ] No new design system violations introduced
- [ ] Existing violations fixed (if any found)
- [ ] Team comfortable with enforcement level
- [ ] Agent used in at least 2 PRs

### Medium-Term (Month 1)
- [ ] 100% color token compliance (no hardcoded colors)
- [ ] 100% component library usage (reuse before create)
- [ ] 100% typography scale compliance
- [ ] Accessibility issues caught before production

---

## Technical Approach

### Phase 0: Audit Current State (1 hour)

**Goal:** Understand existing violations before enforcing

#### Audit Checklist

**Color Palette Violations:**
```bash
# Find hardcoded colors (not using Tailwind tokens)
grep -r "bg-\[#" apps/web/src/
grep -r "text-\[#" apps/web/src/
grep -r "border-\[#" apps/web/src/

# Find inline styles with colors
grep -r "style.*color:" apps/web/src/
grep -r "style.*background:" apps/web/src/

# Expected: Should use bg-orange-*, text-violet-*, border-slate-*
```

**Component Library Violations:**
```bash
# Find custom buttons (should use Button from ui/)
grep -r "<button" apps/web/src/ --exclude-dir=components/ui

# Find custom inputs (should use Input from ui/)
grep -r "<input" apps/web/src/ --exclude-dir=components/ui

# Find custom cards (should use Card from ui/)
grep -r "className.*border.*rounded" apps/web/src/ --exclude-dir=components/ui
```

**Typography Violations:**
```bash
# Find arbitrary font sizes
grep -r "text-\[" apps/web/src/

# Find inline font styles
grep -r "style.*fontSize" apps/web/src/

# Expected: Should use text-sm, text-base, text-lg, text-xl, text-2xl, etc.
```

**Spacing Violations:**
```bash
# Find arbitrary spacing values
grep -r "m-\[" apps/web/src/
grep -r "p-\[" apps/web/src/
grep -r "gap-\[" apps/web/src/

# Expected: Should use m-1, m-2, m-4, m-8 (4px grid)
```

**Accessibility Violations:**
```bash
# Find images without alt text
grep -r "<img" apps/web/src/ | grep -v "alt="

# Find buttons without aria-label (if no text)
grep -r "<button" apps/web/src/ | grep -v "aria-label" | grep ">"

# Find non-semantic divs used as buttons/links
grep -r "onClick" apps/web/src/ | grep "<div"
```

**Result:** Document findings in `audit-report.md` (temporary file)

---

### Phase 1: Create Design System Rules (1 hour)

**Goal:** Auto-enforce critical design patterns

#### File: `.claude/rules/design-system.md`

**Path Scoping:**
```yaml
paths:
  - "apps/web/**/*.{ts,tsx}"           # Web app components
  - "apps/web/src/components/**/*"     # Component library
  - "apps/api/src/templates/**/*"      # Email templates (if TSX)
  - "apps/api/src/lib/pdf/**/*"        # PDF generation
  - "!apps/web/src/components/ui/**/*" # Exclude design system itself
```

**Content Structure:**

```markdown
---
paths:
  - "apps/web/**/*.{ts,tsx}"
  - "apps/web/src/components/**/*"
  - "apps/api/src/templates/**/*"
  - "apps/api/src/lib/pdf/**/*"
  - "!apps/web/src/components/ui/**/*"
---

# Design System Rules

**Akount Design System:** Orange (primary), Violet (secondary), Slate (neutral)
**Typography:** Newsreader (headings), Manrope (body), JetBrains Mono (code)
**Component Library:** `components/ui/` - Reuse before creating

---

## 1. Color Palette (STRICT ENFORCEMENT)

**ALWAYS use Tailwind color tokens - NEVER hardcoded colors**

```tsx
// ✓ CORRECT: Use design tokens
<div className="bg-orange-500 text-white">...</div>
<Button variant="primary">...</Button>  // Uses orange internally

// ✗ WRONG: Hardcoded colors
<div className="bg-[#FF5733] text-[#FFFFFF]">...</div>
<div style={{ backgroundColor: '#FF5733' }}>...</div>
```

**Approved Color Tokens:**
- **Primary (Orange):** `bg-orange-50` to `bg-orange-950`
- **Secondary (Violet):** `bg-violet-50` to `bg-violet-950`
- **Neutral (Slate):** `bg-slate-50` to `bg-slate-950`
- **Semantic:** `bg-red-*` (error), `bg-green-*` (success), `bg-yellow-*` (warning), `bg-blue-*` (info)

**No Exceptions:** If you need a color not in the palette, discuss with design team first.

---

## 2. Component Library (REUSE BEFORE CREATE)

**ALWAYS check `components/ui/` before creating new components**

```tsx
// ✓ CORRECT: Use component library
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

<Button onClick={handleClick}>Save</Button>
<Input value={name} onChange={setName} />
<Card>...</Card>

// ✗ WRONG: Custom implementation
<button className="px-4 py-2 bg-orange-500 rounded">Save</button>
<input className="border rounded px-2" value={name} />
<div className="border rounded shadow p-4">...</div>
```

**Available Components:**
- **Forms:** Button, Input, Textarea, Select, Checkbox, Radio, Switch
- **Layout:** Card, CardHeader, CardContent, CardFooter, Separator
- **Typography:** (use semantic HTML + Tailwind classes)
- **Feedback:** Alert, Toast, Dialog, Popover
- **Navigation:** (check component library)

**When to Create New:**
- Component doesn't exist in library
- Existing component can't be extended with props
- Discussed with team first

---

## 3. Typography Scale (STRICT ENFORCEMENT)

**ALWAYS use typography scale - NEVER arbitrary sizes**

```tsx
// ✓ CORRECT: Use typography scale
<h1 className="font-newsreader text-4xl font-bold">Page Title</h1>
<p className="font-manrope text-base">Body text</p>
<code className="font-mono text-sm">Code snippet</code>

// ✗ WRONG: Arbitrary sizes
<h1 className="text-[32px]">Page Title</h1>
<p style={{ fontSize: '17px' }}>Body text</p>
```

**Typography Scale:**
- **Headings (Newsreader):** `text-4xl`, `text-3xl`, `text-2xl`, `text-xl`, `text-lg`
- **Body (Manrope):** `text-base` (16px), `text-sm` (14px), `text-xs` (12px)
- **Code (JetBrains Mono):** `font-mono` + appropriate size

**Font Families:**
```tsx
// Headings
className="font-newsreader"

// Body text (default)
className="font-manrope"  // or omit (Manrope is default)

// Code
className="font-mono"
```

---

## 4. Spacing Scale (4px GRID)

**ALWAYS use spacing scale - NEVER arbitrary values**

```tsx
// ✓ CORRECT: Use spacing scale (4px grid)
<div className="p-4 m-2 gap-6">...</div>  // 16px padding, 8px margin, 24px gap

// ✗ WRONG: Arbitrary spacing
<div className="p-[17px] m-[9px] gap-[23px]">...</div>
<div style={{ padding: '17px' }}>...</div>
```

**Spacing Scale (Tailwind):**
- `0` = 0px
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `6` = 24px
- `8` = 32px
- `12` = 48px
- `16` = 64px

**Common Patterns:**
- Card padding: `p-6` (24px)
- Section spacing: `space-y-8` (32px vertical)
- Button padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Grid gap: `gap-4` (16px)

---

## 5. Responsive Design (MOBILE-FIRST)

**ALWAYS design mobile-first, enhance for larger screens**

```tsx
// ✓ CORRECT: Mobile-first
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
</div>

// ✗ WRONG: Desktop-first
<div className="p-8 md:p-6 sm:p-4">...</div>
```

**Breakpoints:**
- **sm:** 640px (tablets)
- **md:** 768px (small laptops)
- **lg:** 1024px (desktops)
- **xl:** 1280px (large desktops)

**Touch Targets:**
- Minimum 44x44px (iOS) / 48x48px (Android)
- Use `min-h-11` or `min-h-12` for buttons/links

---

## 6. Accessibility (WCAG 2.1 AA)

**ALWAYS follow accessibility best practices**

```tsx
// ✓ CORRECT: Accessible
<button onClick={handleClick}>Save Invoice</button>
<img src="logo.png" alt="Akount Logo" />
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-hint" />

// ✗ WRONG: Inaccessible
<div onClick={handleClick}>Save Invoice</div>  // Not keyboard accessible
<img src="logo.png" />  // Missing alt text
<input type="email" />  // No label
```

**Accessibility Checklist:**
- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)
- [ ] Alt text on all images
- [ ] Labels on all form inputs
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] ARIA labels where needed (icon-only buttons)

**Color Contrast:**
- Text on white: Use `text-slate-900` (darkest) for body text
- White text: Only on `bg-orange-600+`, `bg-violet-600+`, `bg-slate-700+`
- Link text: `text-orange-600` (sufficient contrast)

---

## When Rules Don't Apply

**Component Library Development:**
- Creating new components in `components/ui/` can use custom patterns
- Follow Radix UI/shadcn conventions
- Document new components

**Third-Party Integration:**
- External libraries may have their own styling
- Wrap in our components when possible

**Prototyping:**
- Early prototypes can skip rules (mark with `// PROTOTYPE`)
- Must refactor before PR

---

## See Also

- **Design System Docs:** `docs/design-system/` (complete reference)
- **Tailwind Config:** `apps/web/tailwind.config.ts` (token definitions)
- **Component Library:** `apps/web/src/components/ui/` (available components)
- **Design System Agent:** Use for deep review (contrast, spacing, a11y)

---

**Questions?** Discuss with team before breaking rules.
```

---

### Phase 2: Create Design System Agent (1 hour)

**Goal:** Provide deep review capability for spacing, contrast, accessibility

#### File: `.claude/agents/review/design-system-reviewer.md`

```markdown
# Design System Reviewer Agent

**Purpose:** Deep review of design system compliance, accessibility, and visual consistency

**When to Use:**
- Before creating PR with UI changes
- When unsure if design follows standards
- To catch spacing/contrast issues
- For accessibility audit

**Not For:**
- Basic color/typography checks (rules handle this)
- Component library usage (rules handle this)

---

## Review Checklist

### 1. Color Usage

**Check:**
- [ ] All colors use design tokens (no hardcoded hex)
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Hover/focus states have sufficient contrast
- [ ] Disabled states are distinguishable

**Tools:**
```bash
# Find hardcoded colors
grep -r "bg-\[#\|text-\[#\|border-\[#" [file]

# Find inline styles
grep -r "style.*color:\|style.*background:" [file]
```

**Report Format:**
```markdown
## Color Issues
- Line 42: Hardcoded `#FF5733` instead of `bg-orange-500`
- Line 56: Text contrast 3.2:1 (needs 4.5:1) - use `text-slate-900` instead of `text-slate-600`
```

---

### 2. Typography

**Check:**
- [ ] Font families correct (Newsreader/Manrope/Mono)
- [ ] Font sizes use scale (no arbitrary values)
- [ ] Line heights appropriate (1.5 for body, 1.2 for headings)
- [ ] Letter spacing follows scale (Tailwind tracking-*)
- [ ] Hierarchy clear (headings distinct from body)

**Common Issues:**
- Arbitrary sizes: `text-[17px]` → Should use `text-lg`
- Wrong font: `font-sans` on headings → Should use `font-newsreader`
- Poor line height: `leading-tight` on long paragraphs → Use `leading-relaxed`

**Report Format:**
```markdown
## Typography Issues
- Line 23: Arbitrary `text-[18px]` should use `text-lg`
- Line 45: Heading missing `font-newsreader` class
```

---

### 3. Spacing & Layout

**Check:**
- [ ] Spacing uses 4px grid (no arbitrary values)
- [ ] Consistent padding/margins across similar components
- [ ] Visual hierarchy through spacing (more space between sections)
- [ ] Responsive spacing (adjust for mobile/desktop)
- [ ] Grid gaps consistent

**Visual Audit:**
```markdown
Component A: p-6 (24px padding)
Component B: p-8 (32px padding)
Component C: p-6 (24px padding)

Inconsistency: Should Component B also use p-6?
```

**Report Format:**
```markdown
## Spacing Issues
- Line 34: Arbitrary `p-[22px]` should use `p-6` (24px)
- Inconsistent card padding: Line 12 uses `p-6`, Line 45 uses `p-8`
```

---

### 4. Component Library Usage

**Check:**
- [ ] All interactive elements use component library
- [ ] No custom buttons/inputs/cards unless justified
- [ ] Component props used correctly
- [ ] Variants appropriate (primary/secondary/ghost/etc)

**Violations:**
```tsx
// Instead of <Button>, using custom button
<button className="px-4 py-2 bg-orange-500 rounded">Save</button>

// Should be:
<Button onClick={handleSave}>Save</Button>
```

**Report Format:**
```markdown
## Component Library Issues
- Line 67: Custom button implementation should use `<Button>` component
- Line 89: Custom input should use `<Input>` component
```

---

### 5. Accessibility (WCAG 2.1 AA)

**Check:**
- [ ] Semantic HTML (`<button>` not `<div onClick>`)
- [ ] Alt text on all images
- [ ] Labels on all form inputs
- [ ] Color contrast sufficient (4.5:1 text, 3:1 UI)
- [ ] Keyboard navigation works
- [ ] ARIA labels on icon-only buttons
- [ ] Focus indicators visible
- [ ] Touch targets 44x44px minimum

**Common Violations:**
```tsx
// ✗ Non-semantic button
<div onClick={handleClick}>Click me</div>

// ✗ Missing alt text
<img src="logo.png" />

// ✗ Input without label
<input type="email" />

// ✗ Icon button without label
<button><IconTrash /></button>

// ✗ Poor contrast
<p className="text-slate-400">Important text</p>  // Only 2.8:1
```

**Report Format:**
```markdown
## Accessibility Issues (CRITICAL)
- Line 34: `<div onClick>` should be `<button>` (keyboard inaccessible)
- Line 56: Image missing alt text
- Line 78: Input missing `<label>` with `htmlFor`
- Line 92: Icon button missing `aria-label`
- Line 104: Text contrast 2.8:1 (needs 4.5:1) - use `text-slate-900`
```

---

### 6. Responsive Design

**Check:**
- [ ] Mobile-first breakpoints (sm, md, lg, xl)
- [ ] Touch targets adequate on mobile (44x44px)
- [ ] Text readable on small screens
- [ ] Images scale appropriately
- [ ] Horizontal scroll doesn't occur

**Common Issues:**
```tsx
// Desktop-first (wrong direction)
<div className="p-8 md:p-6 sm:p-4">

// Should be mobile-first
<div className="p-4 md:p-6 lg:p-8">

// Small touch target
<button className="p-1">  // Only 8px padding = ~24px target

// Should be
<button className="p-2.5">  // 10px padding = 44px target
```

**Report Format:**
```markdown
## Responsive Issues
- Line 45: Desktop-first breakpoints should be mobile-first
- Line 67: Touch target too small (24px, needs 44px minimum)
```

---

## Review Process

1. **Scan for Critical Issues** (Accessibility, Color Contrast)
2. **Check Component Usage** (Using library vs custom)
3. **Verify Spacing Consistency** (4px grid, consistent patterns)
4. **Audit Typography** (Font families, sizes, hierarchy)
5. **Test Responsive** (Mobile-first, touch targets)

**Output:** Comprehensive report with line-level issues + recommendations

---

## Example Report

```markdown
# Design System Review Report

**File:** `apps/web/src/app/dashboard/page.tsx`
**Date:** 2026-01-31

## Summary
- 🔴 Critical: 2 accessibility issues
- 🟡 Warning: 3 component library issues
- 🟢 Info: 5 spacing inconsistencies

## Critical Issues (Must Fix)

### Accessibility
- **Line 34:** `<div onClick>` should be `<button>` (keyboard inaccessible)
  ```diff
  - <div onClick={handleDelete}>Delete</div>
  + <button onClick={handleDelete}>Delete</button>
  ```

- **Line 92:** Icon button missing aria-label
  ```diff
  - <button><IconTrash /></button>
  + <button aria-label="Delete invoice"><IconTrash /></button>
  ```

## Warnings (Should Fix)

### Component Library
- **Line 67:** Custom button should use Button component
  ```diff
  - <button className="px-4 py-2 bg-orange-500 rounded">Save</button>
  + <Button onClick={handleSave}>Save</Button>
  ```

## Info (Consider Fixing)

### Spacing
- **Line 45:** Inconsistent card padding (uses `p-8`, others use `p-6`)
- **Line 78:** Arbitrary spacing `p-[22px]` should use `p-6` (24px)

## Recommendations
1. Fix both critical accessibility issues before merging
2. Refactor custom button to use Button component
3. Standardize card padding to `p-6` across all cards
4. Use spacing scale consistently (4px grid)

## Score: 7/10
- Accessibility: 6/10 (2 critical issues)
- Component Usage: 7/10 (3 custom implementations)
- Spacing: 8/10 (mostly consistent)
- Typography: 9/10 (good usage)
- Responsive: 8/10 (mobile-first)
```

---

## See Also

- **Design System Rules:** `.claude/rules/design-system.md` (auto-enforcement)
- **Design System Docs:** `docs/design-system/` (complete reference)
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
```

---

### Phase 3: Fix Existing Violations (If Needed)

**Goal:** Clean up violations found in Phase 0 audit

**Approach:**
1. Review audit-report.md
2. Prioritize: Critical (accessibility) → High (color/components) → Medium (spacing)
3. Fix in batches by type
4. Test after each batch

**Estimation:** 1-4 hours depending on violations found

---

## Testing Strategy

### Unit Tests (Rules)
```bash
# Test 1: Edit file with hardcoded color
# Create test file with: className="bg-[#FF5733]"
# Expected: Claude warns to use design tokens

# Test 2: Edit file using component library
# Create test file with: <Button>Save</Button>
# Expected: No warnings, rules satisfied

# Test 3: Edit file with arbitrary spacing
# Create test file with: className="p-[17px]"
# Expected: Claude suggests using spacing scale
```

### Integration Tests (Agent)
```bash
# Test 4: Run agent on file with violations
# Expected: Comprehensive report with line numbers + fixes

# Test 5: Run agent on clean file
# Expected: Report with no issues, high score
```

---

## Rollout Plan

### Week 1: Implementation
**Day 1:**
- [ ] Phase 0: Audit current state (1 hour)
- [ ] Document findings

**Day 2:**
- [ ] Phase 1: Create `.claude/rules/design-system.md` (1 hour)
- [ ] Test rules with sample edits

**Day 3:**
- [ ] Phase 2: Create `.claude/agents/review/design-system-reviewer.md` (1 hour)
- [ ] Test agent with sample PR

**Day 4-5:**
- [ ] Phase 3: Fix critical violations (if found)
- [ ] Test enforcement

### Week 2: Team Adoption
- Share guide with team
- Run design system reviews on 2+ PRs
- Collect feedback
- Iterate on rules/agent

---

## Open Questions

- [ ] Should we create design system checklist for PRs?
- [ ] Should we integrate with Storybook (if we use it)?
- [ ] Should we add automated contrast checking (npm package)?
- [ ] Should we create Figma integration for designers?

---

## Dependencies

**Blocked By:** None (can start immediately)
**Blocks:** None (additive enhancement)

**Prerequisites:**
- Design system documentation in `docs/design-system/`
- Component library in `components/ui/`
- Tailwind configuration with color tokens

---

## Resources

### Documentation
- `docs/design-system/tailwind-colors.md` - Color palette
- `docs/design-system/fonts.md` - Typography system
- `docs/design-system/tokens.css` - CSS custom properties
- `apps/web/tailwind.config.ts` - Tailwind configuration

### Tools
- **WCAG Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Accessibility Insights:** Browser extension for a11y testing
- **React DevTools:** Inspect component usage

---

## Estimation

**Complexity:** MEDIUM (configuration + audit)

**Effort:** 3-4 hours
- Phase 0: Audit (1 hour)
- Phase 1: Rules file (1 hour)
- Phase 2: Agent file (1 hour)
- Phase 3: Fix violations (0-1 hour, depends on findings)

**Risk:** LOW (non-breaking, additive)

**Risk Factors:**
- Unknown violation count (mitigate: audit first)
- Team resistance to strict enforcement (mitigate: flexibility in agent vs rules)
- False positives in rules (mitigate: test thoroughly, iterate)

---

**Plan Status:** ✅ Ready for implementation
**Next Step:** Phase 0 audit to understand current state
