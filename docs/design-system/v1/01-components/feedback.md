# Feedback & Notification Components

> **Purpose:** Components for providing user feedback, notifications, and system status
>
> **Last Updated:** 2026-02-04

## Overview

Feedback components communicate the result of user actions and important system events. They must:

- **Be timely** - Appear immediately after action
- **Be specific** - Explain what happened and why
- **Be respectful** - Not disrupt the user's workflow
- **Be dismissible** - User can hide them
- **Be accessible** - Announce to screen readers

---

## Toast Notifications

Brief, temporary messages that appear and auto-dismiss:

### Success Toast

```
┌──────────────────────────────┐
│ ✓ Entry posted successfully  │
│   Reference: JE-001524       │
│                              │
│                         ✕    │
└──────────────────────────────┘
```

**Properties:**
- Icon: Green checkmark (✓)
- Duration: 4 seconds (auto-dismiss)
- Position: Bottom-right corner
- Dismissible: X button

**Content:**
- Title (short, action-oriented)
- Optional detail line
- Optional action link

### Error Toast

```
┌──────────────────────────────┐
│ ✕ Failed to post entry       │
│   Debit total ($1,200) ≠     │
│   Credit total ($1,100)      │
│                         ✕    │
└──────────────────────────────┘
```

- Icon: Red X (✕)
- Color: Red background
- Duration: 8 seconds (longer so user can read)
- Dismissible: X button

**Content:**
- Clear error title
- Specific explanation (not "Error")
- Optional [Fix] action link
- Optional [Dismiss] button

### Warning Toast

```
┌──────────────────────────────┐
│ ⚠ Bank sync interrupted      │
│   Retrying in 30 seconds     │
│                         ✕    │
└──────────────────────────────┘
```

- Icon: Warning triangle (⚠)
- Color: Amber/orange
- Duration: 6 seconds
- Dismissible

### Info Toast

```
┌──────────────────────────────┐
│ ℹ 3 duplicate transactions   │
│   detected                   │
│   [Review] [Ignore All]      │
│                         ✕    │
└──────────────────────────────┘
```

- Icon: Information (ℹ)
- Color: Slate/blue
- Duration: 6 seconds
- Can include action buttons

---

## Inline Alerts

Persistent alerts within content area:

### Info Alert

```
┌────────────────────────────────┐
│ ℹ Entity filter applied.       │
│ Showing Canadian Corp only.    │
│                            [✕] │
└────────────────────────────────┘
```

- Background: Light blue
- Border-left: Blue accent
- Icon: Information (ℹ)
- Dismissible: X button
- No auto-dismiss

### Success Alert

```
┌────────────────────────────────┐
│ ✓ All transactions reconciled  │
│ Statement matches book         │
│                            [✕] │
└────────────────────────────────┘
```

- Background: Light green
- Border-left: Green accent
- Icon: Checkmark (✓)
- May auto-dismiss (optional)

### Warning Alert

```
┌────────────────────────────────┐
│ ⚠ Period is locked for review  │
│ Posting may require approval   │
│ [Request Exception] [Dismiss]  │
└────────────────────────────────┘
```

- Background: Light amber/orange
- Border-left: Orange accent
- Icon: Warning (⚠)
- Action button optional
- User must dismiss

### Error Alert

```
┌────────────────────────────────┐
│ ✕ Failed to save changes       │
│ Please check your connection   │
│ and try again.                 │
│ [Retry] [Save as Draft]        │
│                            [✕] │
└────────────────────────────────┘
```

- Background: Light red
- Border-left: Red accent
- Icon: X mark (✕)
- Action buttons to resolve
- User must dismiss or take action

---

## Validation Messages

Feedback for form field validation:

### Field Error (Inline)

```
Amount
[Input field with red border]
✕ Must be greater than $0
```

- Position: Below field
- Color: Red text
- Icon: X or warning icon
- Size: 12px (small, non-intrusive)
- Content: Specific guidance

### Required Field Indicator

```
Date *
[Input field]
```

- Asterisk (*) in red next to label
- Color: Red (--ak-danger)
- Tooltip on hover: "This field is required"

### Helper Text

```
Amount in CAD
[Input field]
Enter the original amount from receipt.
If multi-currency, system will convert automatically.
```

- Position: Below field
- Color: Muted text
- Size: 12px
- Content: Guidance on how to fill field

---

## Progress Indicators

Show status of long operations:

### Linear Progress Bar

```
Importing transactions...
████████░░░░░░░░░░░░ (42%)
```

- Shows completion percentage
- Smooth animation
- Optional percentage text
- Indeterminate mode (if unknown duration)

### Circular Progress

```
     ↻
  Syncing...
  12 of 30 complete
```

- Rotating spinner or circular progress
- Optional count (n of total)
- Center text optional
- Use for smaller spaces

### Step Progress

```
Step 1: Upload  ✓
Step 2: Verify   ► (current)
Step 3: Import
Step 4: Confirm

"Verifying 150 transactions..."
█████░░░░░░░░░░ (41%)
```

- Visual steps
- Current step highlighted
- Optional status bar
- Step description

---

## Confirmation Dialogs

Request user confirmation for important actions:

### Delete Confirmation

```
┌──────────────────────────────────┐
│ Delete Entry?                    │
├──────────────────────────────────┤
│ This will:                       │
│ • Remove entry from GL           │
│ • Require reversal to undo       │
│ • Create audit trail entry       │
│                                  │
│ This action cannot be undone.    │
├──────────────────────────────────┤
│ [Cancel]            [Delete]     │
└──────────────────────────────────┘
```

**Properties:**
- Modal overlay
- Clear consequence list
- Destructive button (red) on right
- Default focus: Cancel (safe default)
- Requires explicit confirmation

### Confirmation with Details

```
┌──────────────────────────────────┐
│ Post Entry to GL?                │
├──────────────────────────────────┤
│ Entity:  🇨🇦 Canadian Corp      │
│ Date:    2025-12-31              │
│ Amount:  $1,200.00 DR            │
│          $1,200.00 CR            │
│                                  │
│ Once posted, cannot be modified. │
├──────────────────────────────────┤
│ [Cancel]            [Post]       │
└──────────────────────────────────┘
```

- Show what's being confirmed
- Monospace for amounts
- Clear consequence
- Prominent action button

---

## Tooltip

Contextual help on hover:

### Standard Tooltip

```
FX Rate [?]
  ↓
Exchange rate used for
conversion on transaction date
(1 CAD = 0.758 USD)
```

**Properties:**
- Trigger: Hover or focus
- Display: 100ms delay
- Dismiss: Leave, click, or Escape
- Position: Smart (above/below/side)
- Content: 2-3 lines max

### Disabled Field Tooltip

```
[Locked Input] [?]
  ↓
Cannot edit. Period is locked.
[Request Exception] [Learn more]
```

- Explains why disabled
- Provides action if applicable
- Uses question mark icon (?)

---

## Popovers

Richer, interactive floating content:

### Menu Popover

```
More Options [▼]
  ↓
[Edit]
[Duplicate]
[Reconcile]
[Delete]
```

- Position: Below trigger button
- Close: Click outside or selection
- Keyboard: Arrow keys + Enter

### Details Popover

```
Entity [?]
  ↓
┌─────────────────┐
│ Canadian Corp   │
│ Tax ID:12-3456  │
│ Currency: CAD   │
│ [View Details]  │
└─────────────────┘
```

- Richer content than tooltip
- May include images/links
- Clickable areas within

---

## Snackbar

Persistent, non-intrusive notification at bottom:

```
════════════════════════════════════
  Changes saved automatically
                            [Undo]
════════════════════════════════════
```

**Properties:**
- Bottom of screen
- Span full width or partial
- Optional action button
- Gray background (neutral)
- No sound/vibration

---

## Banners

Page-level notifications:

### Important Banner

```
┌────────────────────────────────────┐
│ ⚠ Action Required                 │
│                                   │
│ 3 invoices need approval before  │
│ payment processing.              │
│                        [Review]   │
└────────────────────────────────────┘
```

- Top of page
- Icon + title + message
- Optional action button
- Dismissible (optional)

### Sticky Header Banner

```
⚠ You have 2 days left to file!
           [View Timeline]     [Dismiss]
```

- Sticky (stays visible while scrolling)
- Color-coded by severity
- Compact format
- Dismissible

---

## Skeleton Loading

Placeholder while content loads:

```
┌──────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒   │
│ ▒▒▒▒▒▒                  │
│                         │
│ ▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒      │
│ ▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒      │
└──────────────────────────┘
```

- Pulsing animation
- Same shape as final content
- Feels faster than spinner
- Load priority: Header → Data → Details

---

## Empty State

When no data to display:

```
┌────────────────────────┐
│          📄            │
│ No transactions yet    │
│                        │
│ Your transactions will │
│ appear here once you   │
│ connect a bank.        │
│                        │
│ [Connect Bank]         │
└────────────────────────┘
```

**Components:**
- Icon (large, soft color)
- Heading (14px, medium)
- Description (12px, muted)
- Action button (optional)
- Illustration (optional)

---

## Accessibility

All feedback components must:

- ✓ **Be announced:** Screen reader announces changes
- ✓ **Be readable:** Clear, specific language
- ✓ **Be dismissible:** User can hide them
- ✓ **Have contrast:** Meet WCAG AA (4.5:1)
- ✓ **Have focus:** Keyboard users can interact
- ✓ **Have context:** Explain what happened, not just "Error"
- ✓ **Be non-intrusive:** Don't block content

### ARIA Live Regions

Use `aria-live="polite"` for alerts:

```html
<div aria-live="polite" aria-atomic="true">
  ✓ Entry posted successfully
</div>
```

- Announces to screen readers
- Polite (doesn't interrupt current speech)
- Atomic (reads whole message)

---

## Dark Mode

Feedback components in dark mode:

- Success: Green text on dark background
- Error: Red text on dark background
- Warning: Orange text on dark background
- Info: Blue text on dark background
- Backgrounds: Elevated surfaces with subtle contrast

---

## Performance

Feedback components should:

- Load instantly (no network calls)
- Auto-dismiss after appropriate duration
- Not block main thread
- Stack nicely (multiple notifications)
- Animate smoothly (GPU-accelerated)

---

## Component Hierarchy

```
Feedback Components
├── Toasts (temporary, top-right)
├── Inline Alerts (persistent, in-flow)
├── Inline Errors (field-level)
├── Modals (require confirmation)
├── Tooltips (contextual help)
├── Popovers (richer tooltips)
├── Snackbars (bottom, persistent)
├── Banners (page-level)
├── Loading States (skeletons, spinners)
└── Empty States (no data)
```

---

## Common Patterns

### Success Pattern

1. User action (submit, save, delete)
2. Loading state (optional)
3. Success toast (4 sec)
4. Update UI (remove old, show new)
5. Optional undo link in toast

### Error Pattern

1. User action fails
2. Error toast (8 sec)
3. Inline error on field (if applicable)
4. User can retry
5. Toast dismissible

### Confirmation Pattern

1. User triggers destructive action
2. Confirmation modal appears
3. User confirms or cancels
4. If confirmed: Execute + toast
5. Audit trail recorded

---

## Planned Enhancements (From Roadmap)

### Change Awareness & Notifications (MEDIUM Priority, 6-9 months)

**Future enhancement:** Intelligent notifications for accounting events with user preferences.

**What's planned:**
- Accounting-awareness notifications (not marketing emails)
- Smart alerts for important events:
  - "Your accountant posted adjustments" (with preview)
  - "This period is now ready for review"
  - "Rules affected 18 transactions"
- Notification preferences (email, in-app, digest modes)
- Digest modes (daily/weekly summaries instead of real-time)
- Do-not-disturb periods
- In-app notification history and replay

**Why it matters:**
Builds confidence and reduces anxiety. Users want to know when important things happen in their financial data.

**Expected impact:** Users stay informed without being overwhelmed. "I know what happened to my data."

---

### Partial Information Handling (MEDIUM Priority, 6-12 months)

**Future enhancement:** Graceful handling of incomplete data without validation errors.

**What's planned:**
- Explicit "incomplete data" state (not treated as error)
- Deferred resolution flags ("come back to this later")
- AI-assisted enrichment without auto-commit
- Smart prompts for ambiguous data:
  - "We found 3 tax IDs, which is this vendor?"
  - "Missing vendor country — which one?"
- Progress indicators (show what's complete vs incomplete)
- Partial save capability (save progress without completion)
- Flag for follow-up (show which fields need attention)

**Real-world patterns:**
- Missing vendor tax ID
- Unknown client country
- Bank feeds with vague descriptions ("PAYMENT TO ACCOUNT")
- Incomplete expense details

**Why it matters:**
Prevents premature assumptions and keeps data quality high from the start. Currently all fields required; users get blocked by incomplete information.

**Expected impact:** Users can save work-in-progress without frustration. "I can fill this in later when I have more info."

---

## See Also

- [`data-display.md`](./data-display.md) - Cards, modals, empty states
- [`primitives.md`](./primitives.md) - Button components for actions
- [`../00-foundations/colors.md`](../00-foundations/colors.md) - Alert color semantics
- [`../02-patterns/forms-input.md`](../02-patterns/forms-input.md) - Form error patterns
