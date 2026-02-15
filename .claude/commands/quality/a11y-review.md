---
name: quality:a11y-review
description: WCAG 2.1 AA accessibility compliance
---

# Accessibility Review (WCAG 2.1 AA)

Review UI components for accessibility compliance.

**When to Use:** Before merging UI changes, after adding new components, during quality checks.

---

## Quick Scan

**Critical checks (2 minutes):**

- [ ] All images have alt text
- [ ] Forms have labels
- [ ] Buttons have accessible names
- [ ] Color contrast ratios meet minimum
- [ ] Keyboard navigation works

---

## WCAG 2.1 AA Requirements

### 1. Perceivable

**Images & Media:**

- [ ] All `<img>` have descriptive `alt` attributes
- [ ] Decorative images use `alt=""` (empty)
- [ ] Icons have `aria-label` or visible text

**Color & Contrast:**

- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Text contrast ratio ≥ 3:1 (large text 18pt+)
- [ ] UI components contrast ratio ≥ 3:1
- [ ] Color not sole means of conveying information

**Text:**

- [ ] Font size ≥ 16px for body text
- [ ] Text can be resized to 200% without loss of content
- [ ] Line height ≥ 1.5 for paragraphs

### 2. Operable

**Keyboard:**

- [ ] All interactive elements keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Skip to main content link

**Interactive Elements:**

```typescript
// ✅ CORRECT: Keyboard accessible button
<button onClick={handleClick} aria-label="Close modal">
  <XIcon />
</button>

// ❌ WRONG: Div as button (not keyboard accessible)
<div onClick={handleClick}>
  <XIcon />
</div>
```

**Focus Management:**

- [ ] Focus visible on all interactive elements
- [ ] Focus returns to trigger after modal close
- [ ] Focus moves to new content after navigation

### 3. Understandable

**Forms:**

```typescript
// ✅ CORRECT: Label associated with input
<label htmlFor="email">Email Address</label>
<input id="email" type="email" required aria-describedby="email-hint" />
<span id="email-hint">We'll never share your email.</span>

// ❌ WRONG: Placeholder as label
<input type="email" placeholder="Email" />
```

**Error Handling:**

- [ ] Error messages descriptive and helpful
- [ ] Errors announced to screen readers (`aria-live`)
- [ ] Required fields marked with `required` or `aria-required`

**Navigation:**

- [ ] Consistent navigation across pages
- [ ] Breadcrumbs for deep navigation
- [ ] Clear page titles (`<title>` element)

### 4. Robust

**Semantic HTML:**

```typescript
// ✅ CORRECT: Semantic elements
<nav><ul><li><a href="/dashboard">Dashboard</a></li></ul></nav>
<main><h1>Page Title</h1><p>Content</p></main>

// ❌ WRONG: Div soup
<div class="nav"><div><div class="link">Dashboard</div></div></div>
```

**ARIA:**

- [ ] ARIA roles used appropriately
- [ ] `aria-label` / `aria-labelledby` for non-obvious controls
- [ ] `aria-expanded` for collapsible content
- [ ] `aria-live` for dynamic content updates

---

## Component Patterns

### Buttons

```typescript
// Primary action
<button type="button" className="btn-primary">
  Save Changes
</button>

// Icon button
<button type="button" aria-label="Delete invoice">
  <TrashIcon aria-hidden="true" />
</button>

// Loading state
<button type="button" aria-busy="true" disabled>
  <Spinner aria-hidden="true" /> Saving...
</button>
```

### Forms

```typescript
<form onSubmit={handleSubmit}>
  <fieldset>
    <legend>Payment Information</legend>

    <label htmlFor="cardNumber">Card Number</label>
    <input
      id="cardNumber"
      type="text"
      required
      aria-required="true"
      aria-describedby="card-hint"
    />
    <span id="card-hint">16-digit number on front of card</span>
  </fieldset>

  <button type="submit">Submit Payment</button>
</form>
```

### Modals

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen} aria-labelledby="dialog-title">
  <DialogContent>
    <DialogTitle id="dialog-title">Delete Invoice</DialogTitle>
    <DialogDescription>
      This action cannot be undone. This will permanently delete the invoice.
    </DialogDescription>
    <button onClick={handleDelete}>Delete</button>
    <button onClick={() => setIsOpen(false)}>Cancel</button>
  </DialogContent>
</Dialog>
```

### Lists

```typescript
// Navigation list
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/invoices">Invoices</a></li>
  </ul>
</nav>

// Data list
<ul aria-label="Invoice list">
  {invoices.map(inv => (
    <li key={inv.id}>
      <a href={`/invoices/${inv.id}`}>{inv.number}</a>
    </li>
  ))}
</ul>
```

---

## Testing Tools

**Manual:**

- Tab through page (keyboard-only navigation)
- Use screen reader (NVDA on Windows, VoiceOver on Mac)
- Test with 200% zoom
- Check color contrast with browser DevTools

**Automated:**

```bash
# Run axe-core checks (if installed)
npm run test:a11y

# Or use browser extension: axe DevTools
```

---

## Common Issues

**Issue 1: Missing alt text**

```typescript
// ❌ WRONG
<img src="/logo.png" />

// ✅ CORRECT
<img src="/logo.png" alt="Akount logo" />
```

**Issue 2: Poor contrast**

```css
/* ❌ WRONG: Gray on white (2.5:1 ratio) */
color: #999;

/* ✅ CORRECT: Dark gray on white (4.6:1 ratio) */
color: #666;
```

**Issue 3: Unlabeled form inputs**

```typescript
// ❌ WRONG
<input type="text" placeholder="Name" />

// ✅ CORRECT
<label htmlFor="name">Name</label>
<input id="name" type="text" />
```

---

## Checklist Output

```markdown
# Accessibility Review - [Component Name]

## WCAG 2.1 AA Compliance

### Perceivable
- [x] Alt text on all images
- [x] Color contrast meets 4.5:1
- [x] Text resizable to 200%

### Operable
- [x] Keyboard accessible
- [x] Visible focus indicators
- [x] Logical tab order

### Understandable
- [x] Form labels associated
- [x] Error messages descriptive
- [x] Consistent navigation

### Robust
- [x] Semantic HTML used
- [x] ARIA used appropriately
- [x] Valid HTML

## Issues Found
[None / List of issues]

## Recommendations
[Improvements suggested]

---

**Status:** ✅ Compliant / ⚠️ Issues Found
```

---

_Lines: ~250 (slimmed from 436). Focused WCAG 2.1 AA compliance checks._
