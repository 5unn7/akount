# Forms & Input Patterns

> **Purpose:** Patterns for user input forms, validation, and multi-step workflows
>
> **Last Updated:** 2026-02-04

## Overview

Forms in Akount are **guided workflows**, not blank canvases. They:

- **Guide users** through required steps
- **Validate continuously** (real-time feedback)
- **Prevent errors** before they happen
- **Auto-save drafts** to prevent data loss
- **Show progress** in multi-step forms

---

## Basic Form Layout

### Single-Field Form

```
Label *
[Input field]
⚠ Error message (if applicable)
Helper text: "Explain what goes here"

[Cancel] [Save]
```

**Spacing:**

- Label to field: 8px
- Field to error: 6px
- Error to next field: 16px
- Button group: 16px below last field

### Multi-Field Form

```
Date *
[Picker field]
This transaction date

Amount *
[Numeric input]
Enter amount in transaction currency

Category
[Dropdown with search]
Select GL account or leave blank

Description
[Text area, auto-expand]
Internal note (optional)

[Cancel] [Save as Draft] [Confirm]
```

**Layout:**

- Single column (vertical stack)
- Consistent label width (left-align)
- Fields full-width
- Buttons at bottom, right-aligned

---

## Field Types & Patterns

### Text Input

```
Name *
[David Chen........................]
Required: 2-50 characters
```

- Label required
- Placeholder (optional, lighter text)
- Character counter (if limited)
- Real-time validation feedback

### Numeric Input (Amount)

```
Amount *
[............$1,234.56 CAD]
                    ↑ Right-aligned, monospace
Decimal always shown
```

- Monospace font (JetBrains Mono)
- Right-aligned (matches accounting conventions)
- Currency always shown
- Sign explicit (+ or –)

### Date Picker

```
Date *
[2025-12-15......↓]
        Date picker opens

Today: 2025-12-31
Range: Jan 1 – Dec 31, 2025 (fiscal period)
```

- Calendar picker (not text input)
- Show available date range
- Highlight today, selected
- Keyboard: Arrow keys + Enter

### Dropdown / Select

```
Category *
[Cloud Services............▼]

Search:
▼ Expenses
  ├─ 5100 Cloud Services ✓
  └─ 5200 Subscriptions

Focus: Highlight, arrow keys navigate
```

- Grouped options
- Search/filter for large lists
- Show current selection
- Keyboard navigation

### Textarea (Multi-line)

```
Description
[Text area with multiple lines...
 Auto-expands as user types...
 Max 500 chars........................]
↑ Growing height as needed
Counter: 127/500 characters
```

- Auto-expand (up to max rows)
- Character counter
- Line wrapping enabled
- Placeholder optional

### Toggle / Switch

```
Auto-categorize future similar   [ON/OFF toggle]
transactions from this vendor

Explanation: Automatically applies
this category to new transactions.
```

- Clear label
- Visual feedback (color change)
- Explanation below (if complex)

---

## Form Validation

### Real-Time Validation

```
Email *
[john@example.co................]
  ✓ Valid email format
(Green checkmark, no error shown)
```

**Validation timing:**

- On blur (field loses focus): Primary validation
- On change (user typing): Secondary validation
- Before submit: Comprehensive validation

### Error Messages

```
Amount *
[Input with red border........]
✕ Amount must be greater than $0

(Specific, actionable message)
```

**Good error messages:**

- Specific (not "Invalid")
- Actionable ("must be..." not just "error")
- Short (1 line if possible)
- Positioned below field

### Inline Validation Success

```
Vendor Tax ID
[CA-12-3456-789...]
✓ Valid Canadian tax ID
```

- Green checkmark
- Confirms what was validated
- Reassures user

### Required Field Indicator

```
Date *
[Input field]

(Red asterisk indicates required)
```

- Asterisk (*) in red next to label
- Legend at top of form: "* Required"
- Or use "Required" text label

---

## Multi-Step Forms

### Step Progress

```
Step 1: Details  ✓
Step 2: Confirm   ► (Current)
Step 3: Review

Progress: 2 of 3 complete
```

- Visual step indicators
- Current step highlighted
- Completed steps marked with ✓
- Progress bar optional

### Step 1 Content

```
Create Journal Entry

Date *          [Picker field]
Description *   [Text input]
Entity *        [Dropdown]
Period          Q4 2025 (Read-only)

              [Next] or [Skip]
```

**Navigation:**

- [Next] → Validate and continue
- [Skip] → Go to next (if optional section)
- [Cancel] → Exit form
- [Save Draft] → Save without completing

### Step 2: Review

```
Review Details

Date:        2025-12-31
Entity:      🇨🇦 Canadian Corp
Description: Tax provision adjustment

Lines to post:
  Cloud Services Exp  DR $1,200
  Chase Account       CR $1,200
Status: Balanced ✓

[Back] [Cancel] [Confirm & Post]
```

- Show summary of step 1
- Allow editing (back button)
- Show preview of action
- Final confirmation button

### Step 3: Confirmation

```
✓ Entry Posted Successfully

Reference: JE-001524
Posted by: Sarah Chen
Date: 2025-12-31 14:23 EST

[View Entry] [Create Reversal] [New Entry]
```

- Success state
- Summary information
- Next action options

---

## Form Auto-Save

### Draft Saving

```
Your changes are being saved...

⊙ Saving
   ↓ (complete after 3 sec)
✓ Last saved: 2:45 PM

(Subtle notification, no modal)
```

**Auto-save behavior:**

- Trigger: After 1 second of inactivity
- Show: "Saving..." → "Last saved X min ago"
- Persist: Save to database
- Draft status: Show "Draft" badge in UI

### Unsaved Changes Warning

```
You have unsaved changes.
Are you sure you want to leave?

[Cancel] [Leave Without Saving]
```

- Show before page navigation
- Allow user choice
- Save as draft option (if available)

---

## Complex Form Example: Journal Entry

```
┌───────────────────────────────────┐
│ Create Journal Entry              │
├───────────────────────────────────┤
│ Step 1: Entry Details             │
│                                   │
│ Date *                            │
│ [2025-12-31 ▼]                   │
│ Must be within open fiscal period │
│                                   │
│ Entity *                          │
│ [Canadian Corp ▼]                │
│                                   │
│ Reference                         │
│ [JE-001524.....................]  │
│ Auto-generated if left blank      │
│                                   │
│ Description *                     │
│ [Tax provision adjustment      ] │
│                                   │
│ ──────────────────────────────────│
│ Add Lines                         │
│                                   │
│ Account      Debit    Credit      │
│ [Select ▼]   [0.00]   [0.00]    │
│ [Select ▼]   [0.00]   [0.00]    │
│                                   │
│ Totals:      $1,200   $1,200     │
│              (Balanced ✓)         │
│                                   │
│ [+ Add Line]                      │
│                                   │
│ ──────────────────────────────────│
│           [Cancel] [Next]         │
│ Last saved: 2:31 PM              │
└───────────────────────────────────┘
```

**Features:**

- Step indicator (not shown in example)
- Required fields marked (*)
- Real-time validation (balance check)
- Auto-save indicator
- Helpful hints below fields
- Clear navigation buttons

---

## Inline Editing

### In-Row Edit Mode

```
Amount  [–$1,200.56 CAD]  ✓ ✕
          ↑ Click to edit
```

- Click field to edit
- Show checkmark (save) and X (cancel)
- Validation happens on save
- Return to view mode after save

### Expandable Edit Panel

```
Transaction row
  ↓ (click to expand)

┌─────────────────────┐
│ Edit Transaction    │
│                     │
│ Category            │
│ [Cloud Services ▼]  │
│                     │
│ Description         │
│ [AWS bill........]  │
│                     │
│ [Save] [Cancel]     │
└─────────────────────┘
  ↓ (click save)

Transaction row (updated)
```

- Non-disruptive (doesn't navigate)
- Clear save/cancel buttons
- Validation before save

---

## Accessibility

All forms must:

- ✓ **Proper labels:** Each input has associated `<label>`
- ✓ **Required indicator:** Show clearly (*)
- ✓ **Error messages:** Associated with field via `aria-describedby`
- ✓ **Focus management:** Clear focus ring (2px, brand color)
- ✓ **Keyboard navigation:** Tab through fields in logical order
- ✓ **Screen readers:** Announce labels, errors, required status
- ✓ **Color + text:** Error icons + text (not color alone)

### Example HTML

```html
<label for="amount">Amount *</label>
<input
  id="amount"
  type="number"
  required
  aria-required="true"
  aria-describedby="amount-error"
/>
<span id="amount-error" class="error" aria-live="polite">
  ✕ Must be greater than $0
</span>
```

---

## Mobile Form Patterns

### Responsive Layout

**Desktop (1280px+):**

- Two-column layout
- Side-by-side fields when appropriate
- Full keyboard support

**Tablet (768px-1279px):**

- Single column
- Full-width inputs
- Touch targets ≥44px

**Mobile (<768px):**

- Card-based layout
- Single column only
- Larger touch targets (48px)
- Simplified steps (fewer per screen)

### Mobile-Optimized Input

```
Amount
[Text input with $ prefix]

 Decimal places: 2
 Keyboard: Numeric (on mobile)
 Auto-focus: First field
```

- Appropriate keyboard (numeric for amounts)
- Large touch targets
- Clear labels (not just placeholders)
- Minimal scrolling

---

## Performance

Forms should:

- Load instantly (no async validation)
- Validate in real-time (debounce 300ms)
- Auto-save every 1 second of inactivity
- Support offline (local storage backup)
- Persist to database when online

---

## See Also

- [`primitives.md`](../01-components/primitives.md) - Input components (buttons, fields)
- [`data-display.md`](../01-components/data-display.md) - Alerts, error messages
- [`feedback.md`](../01-components/feedback.md) - Form feedback components
- [`financial-workflows.md`](./financial-workflows.md) - Complex workflow examples (journal entry, reconciliation)
