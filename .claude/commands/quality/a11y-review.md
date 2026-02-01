---
name: quality:a11y-review
description: WCAG 2.1 AA accessibility compliance
model: claude-sonnet-3-7-20250219
aliases:
  - accessibility-check
  - a11y-check
  - wcag-check
keywords:
  - accessibility
  - a11y
  - wcag
  - screen-reader
  - keyboard
---

# Accessibility Review

Validates WCAG 2.1 AA compliance.

## Compliance Checklist

**Color Contrast:**
- Text: 4.5:1 minimum
- UI components: 3:1 minimum
- Test with contrast checker

**Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order
- Visible focus indicators
- Skip links present

**Screen Readers:**
- ARIA labels on interactive elements
- Alt text on images
- Semantic HTML (nav, main, aside)
- Form labels properly associated

**Structure:**
- Heading hierarchy (h1 → h2 → h3)
- Landmarks used
- Lists properly marked up

## Usage

```bash
/quality:a11y-review
```

Reviews UI components for accessibility issues.

## Review Process

### Step 1: Find UI Components

```bash
# Find all UI components
Glob "apps/web/**/*.tsx"

# Check recent changes
git diff main --name-only | grep '\.tsx$'
```

### Step 2: Color Contrast Check

**Check all text and interactive elements:**

```tsx
// ❌ BAD - Low contrast
<p className="text-gray-400">  // Light gray on white

// ✅ GOOD - Sufficient contrast
<p className="text-foreground">  // High contrast by default
```

**Test ratios:**
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Tools:**
- Use online contrast checker
- Check both light and dark modes

### Step 3: Keyboard Navigation

**Check interactive elements:**

```tsx
// ❌ BAD - No keyboard access
<div onClick={handleClick}>Click me</div>

// ✅ GOOD - Keyboard accessible
<button onClick={handleClick}>Click me</button>

// ✅ GOOD - Custom element with keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

**Tab order check:**
- Elements focusable in logical order
- No tab traps
- Skip link to main content

**Focus indicators:**
```tsx
// ✅ GOOD - Visible focus ring
<button className="focus:ring-2 focus:ring-primary">
```

### Step 4: Screen Reader Support

**ARIA labels:**

```tsx
// ❌ BAD - No label
<button onClick={handleDelete}>🗑️</button>

// ✅ GOOD - ARIA label
<button onClick={handleDelete} aria-label="Delete invoice">
  🗑️
</button>
```

**Alt text:**

```tsx
// ❌ BAD - Missing alt
<img src="/logo.png" />

// ✅ GOOD - Descriptive alt
<img src="/logo.png" alt="Akount logo" />

// ✅ GOOD - Decorative image
<img src="/decoration.png" alt="" role="presentation" />
```

**Semantic HTML:**

```tsx
// ❌ BAD - Generic divs
<div className="header">
  <div className="nav">...</div>
</div>

// ✅ GOOD - Semantic HTML
<header>
  <nav aria-label="Main navigation">...</nav>
</header>
```

**Form labels:**

```tsx
// ❌ BAD - No label
<input type="text" placeholder="Email" />

// ✅ GOOD - Proper label
<label htmlFor="email">Email</label>
<input type="text" id="email" />

// ✅ GOOD - ARIA label alternative
<input type="text" aria-label="Email address" />
```

### Step 5: Document Structure

**Heading hierarchy:**

```tsx
// ❌ BAD - Skipped levels
<h1>Page Title</h1>
<h3>Section Title</h3>  // Skipped h2

// ✅ GOOD - Logical hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
```

**Landmarks:**

```tsx
// ✅ GOOD - Proper landmarks
<header>
  <nav aria-label="Main navigation">...</nav>
</header>
<main>
  <article>...</article>
  <aside aria-label="Related information">...</aside>
</main>
<footer>...</footer>
```

**Lists:**

```tsx
// ❌ BAD - Fake list
<div>
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// ✅ GOOD - Semantic list
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

## Common Issues

### 1. Missing Alt Text

**Issue:**
```tsx
<img src="/invoice-icon.png" />
```

**Fix:**
```tsx
<img src="/invoice-icon.png" alt="Invoice icon" />
```

### 2. Poor Color Contrast

**Issue:**
```tsx
<p className="text-gray-300">Important information</p>
```

**Fix:**
```tsx
<p className="text-foreground">Important information</p>
```

### 3. No Keyboard Access

**Issue:**
```tsx
<div onClick={handleClick}>Action</div>
```

**Fix:**
```tsx
<button onClick={handleClick}>Action</button>
```

### 4. Missing ARIA Labels

**Issue:**
```tsx
<button onClick={handleClose}>×</button>
```

**Fix:**
```tsx
<button onClick={handleClose} aria-label="Close dialog">×</button>
```

### 5. No Focus Indicators

**Issue:**
```tsx
<button className="outline-none">  // Removes focus ring
```

**Fix:**
```tsx
<button className="focus:ring-2 focus:ring-primary">
```

### 6. Heading Hierarchy Violated

**Issue:**
```tsx
<h1>Page</h1>
<h4>Section</h4>  // Skipped h2, h3
```

**Fix:**
```tsx
<h1>Page</h1>
<h2>Section</h2>
```

### 7. Form Without Labels

**Issue:**
```tsx
<input type="text" placeholder="Name" />
```

**Fix:**
```tsx
<label htmlFor="name">Name</label>
<input type="text" id="name" />
```

## WCAG 2.1 AA Requirements

### Level A (Must Have)

- [ ] Non-text content has alt text
- [ ] Videos have captions
- [ ] Information not conveyed by color alone
- [ ] Keyboard accessible
- [ ] No keyboard traps
- [ ] Page has title
- [ ] Logical tab order
- [ ] Link purpose clear
- [ ] Multiple ways to find content
- [ ] Headings and labels descriptive
- [ ] Keyboard focus visible

### Level AA (Should Have)

- [ ] Text contrast 4.5:1 minimum
- [ ] Text resizable to 200%
- [ ] Images of text avoided
- [ ] Reflow at 320px width
- [ ] Text spacing adjustable
- [ ] Content on hover/focus dismissible
- [ ] UI component contrast 3:1

## Output Format

### Summary
- **Components Checked:** X components
- **Issues Found:** Y issues
- **WCAG Level:** [A / AA / AAA]
- **Severity:** [Low / Medium / High / Critical]

### Issues by Category

**Color Contrast (Y issues):**
```
❌ apps/web/components/Badge.tsx:12
Element: <span className="text-gray-300">
Contrast: 2.8:1 (needs 4.5:1)
Fix: Use text-muted-foreground instead
Severity: High
```

**Keyboard Navigation (Y issues):**
```
❌ apps/web/components/Card.tsx:45
Element: <div onClick={...}>
Issue: Not keyboard accessible
Fix: Use <button> or add keyboard handlers
Severity: Critical
```

**Screen Reader (Y issues):**
```
❌ apps/web/components/Icon.tsx:8
Element: <button>🗑️</button>
Issue: No accessible name
Fix: Add aria-label="Delete"
Severity: High
```

**Structure (Y issues):**
```
❌ apps/web/app/dashboard/page.tsx:20
Issue: Heading hierarchy violated (h1 → h4)
Fix: Use h2 instead of h4
Severity: Medium
```

### Quick Fixes Available

For simple issues, provide quick fixes:

```bash
# Fix missing alt text
sed -i 's/<img src="icon.png" \/>/<img src="icon.png" alt="Icon" \/>/g' file.tsx

# Add focus ring
sed -i 's/outline-none/focus:ring-2 focus:ring-primary/g' file.tsx
```

### Compliance Score

```
WCAG 2.1 AA Compliance: XX%

By Category:
- Perceivable: XX%
- Operable: XX%
- Understandable: XX%
- Robust: XX%

Status: [Compliant / Nearly Compliant / Needs Work]
```

### Approval

- ✅ **COMPLIANT** - Meets WCAG 2.1 AA
- ⚠️ **MINOR ISSUES** - Mostly compliant, minor fixes needed
- ❌ **NON-COMPLIANT** - Critical issues found

## Testing Tools

**Automated:**
- axe DevTools (browser extension)
- Lighthouse (Chrome DevTools)
- WAVE (browser extension)

**Manual:**
- Keyboard navigation test
- Screen reader test (NVDA, JAWS, VoiceOver)
- Color contrast analyzer

**Testing Checklist:**
- [ ] Run automated tools
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Check color contrast
- [ ] Verify heading hierarchy
- [ ] Test zoom to 200%

## Related Resources

- WCAG 2.1 Guidelines (external)
- shadcn/ui accessibility (external)
- MDN Accessibility (external)
- WebAIM contrast checker (external)
