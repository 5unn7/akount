# Natural Language Bookkeeping Bar

**Component:** `NLBookkeepingBar`
**Location:** `apps/web/src/app/(dashboard)/overview/nl-bookkeeping-bar.tsx`
**Task:** DEV-247 (C2) - Document Intelligence Phase 2

---

## Purpose

Natural language input component that allows users to create transactions by typing plain English descriptions like "Paid $50 at Starbucks yesterday."

Parses natural language via AI (Mistral) and displays extracted transaction data for user review before creation.

---

## Features

### 1. Natural Language Parsing

**Endpoint:** `POST /api/ai/bookkeeping/natural`

Accepts free-form text like:
- "Paid $47 for Uber to airport"
- "Bought lunch at Starbucks yesterday, $15.50"
- "Received payment from ACME Corp, $2500"

Returns structured transaction data:
```typescript
{
  parsed: {
    vendor: string
    amount: number  // Integer cents
    category?: string
    glAccountId?: string
    date: string  // ISO 8601
    description?: string
  },
  confidence: number  // 0-100
  explanation: string  // AI reasoning
  requiresReview: boolean
}
```

### 2. Three-State UI

**Idle state:**
- Text input with sparkle icon (purple AI indicator)
- Placeholder: "What did you spend on?"
- Helper text with examples
- Send button (disabled if input empty)

**Processing state:**
- Spinner animation
- Shows truncated input text
- Input disabled during processing

**Preview state:**
- Success checkmark (green)
- Confidence percentage badge
- 2x2 grid showing extracted data:
  - Vendor
  - Amount (formatted with `formatCurrency`)
  - Category
  - Date (localized)
- AI explanation in italic Newsreader font
- Edit and Create Transaction buttons

### 3. Design System Compliance

**Colors (Semantic Tokens):**
- AI icon: `text-ak-purple` (purple for AI features)
- Success: `text-ak-green` for checkmark
- Card: `variant="glass"` (glass morphism)
- Borders: `border-ak-border`
- Data grid: `glass-2` (elevated glass)

**Typography:**
- AI explanation: `font-heading italic` (Newsreader italic for AI summaries)
- Amount: `font-mono` (JetBrains Mono for numbers)
- Labels: `text-xs text-muted-foreground uppercase tracking-wide`
- Helper text: `text-micro text-muted-foreground`

**Icons:**
- `Sparkles` — AI/magic indicator
- `Send` — Submit action
- `Check` — Success/approve
- `Edit` — Edit action

---

## Error Handling

### Low Confidence (<50%)

```
toast.error('Couldn't understand. Try: "Paid $50 at Starbucks yesterday"')
```

Shows when AI confidence is below threshold. User must rephrase.

### Missing AI Consent

```
toast.error('Enable AI features in Settings first')
```

Triggers if user hasn't granted AI consent (403 from backend).

### Mistral API Errors

```
toast.error('AI service temporarily unavailable. Try again shortly.')
```

Circuit breaker or Mistral downtime (503 from backend).

### Generic Errors

```
toast.error('Failed to parse. Try: "Paid $50 at Starbucks"')
```

Fallback for any other errors.

---

## Current Limitations

### 1. No Transaction Creation Yet

`handleApprove()` shows error toast:
```
toast.error('Please select an account from the transactions page')
```

**Why:** Transaction creation requires `accountId`, which isn't in the parsed response. Need to either:
- Add account selector to the component
- Get default account from entity context
- Route to transactions page with pre-filled form

**TODO (DEV-248):**
Implement account selection dropdown or use entity default account.

### 2. No Edit Mode

`handleEdit()` shows info toast:
```
toast.info('Edit mode coming soon. Please create transaction manually.')
```

**Why:** Editing parsed data requires a form overlay or modal.

**TODO (Future):**
Open CreateTransactionForm pre-filled with parsed data.

---

## Integration

### Current Usage

Integrated on dashboard overview page (`apps/web/src/app/(dashboard)/overview/page.tsx`):

```tsx
import { NLBookkeepingBar } from "./nl-bookkeeping-bar";

// In page component:
{entityId && <NLBookkeepingBar entityId={entityId} />}
```

Placement: After onboarding hero, before command center grid (prominent position).

### Props

```typescript
interface NLBookkeepingBarProps {
  entityId: string;  // Required: Entity to create transaction for
  onTransactionCreated?: (transactionId: string) => void;  // Optional callback
}
```

### Alternative Placements

**Floating Action Button:**
```tsx
<div className="fixed bottom-6 right-6 z-50 max-w-md">
  <NLBookkeepingBar entityId={entityId} />
</div>
```

**Sheet/Dialog Trigger:**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Quick Add Transaction</Button>
  </SheetTrigger>
  <SheetContent>
    <NLBookkeepingBar entityId={entityId} />
  </SheetContent>
</Sheet>
```

---

## Testing Checklist

### Manual Testing

- [ ] Type "Paid $50 at Starbucks" → See parsed data (vendor: Starbucks, amount: 5000 cents, category detected)
- [ ] Type invalid input (e.g., "asdfgh") → See low confidence error
- [ ] Submit without AI consent → See consent error
- [ ] Press Enter to submit (keyboard shortcut)
- [ ] Click Edit → See "coming soon" toast
- [ ] Click Create Transaction → See "select account" error (until DEV-248 implemented)
- [ ] Mobile view → Component is full-width, touch-friendly

### Edge Cases

- [ ] Very long input text → Truncates in processing state
- [ ] Rapid submit clicks → Disabled during processing
- [ ] Multiple entities → Uses correct entityId prop
- [ ] No entity selected → Component not rendered (conditional `{entityId && ...}`)

---

## Dependencies

### Backend API

**Endpoint:** `POST /api/ai/bookkeeping/natural`
**File:** `apps/api/src/domains/ai/routes/natural-bookkeeping.routes.ts`
**Service:** `NaturalBookkeepingService`
**Schema:** `ParseNaturalLanguageSchema`

**Middleware:**
- `authMiddleware` — Requires authentication
- `tenantMiddleware` — Requires tenant membership
- `requireConsent('autoCategorize')` — Requires AI consent
- Rate limit: 20 requests/minute

### Frontend Utilities

**Imports:**
- `formatCurrency` from `@/lib/utils/currency` — Formats integer cents
- `apiFetch` from `@/lib/api/client-browser` — Browser-side API client (CSRF-protected)
- `toast` from `sonner` — Toast notifications

---

## Success Criteria (DEV-247)

- [x] Component created with glass card styling
- [x] Three-state UI (idle, processing, preview)
- [x] Parses natural language via `/api/ai/bookkeeping/natural`
- [x] Displays extracted data (vendor, amount, category, date)
- [x] Shows AI explanation in italic Newsreader font
- [x] Error handling for low confidence, missing consent, API errors
- [x] Mobile-optimized (full-width, responsive)
- [x] No hardcoded colors (uses semantic tokens)
- [x] Integrated on dashboard overview page
- [x] TypeScript compiles without errors
- [ ] Transaction creation (blocked on DEV-248: account selection)

---

## Future Enhancements (DEV-248+)

### Account Selection

Add dropdown or default account from entity context:
```tsx
<Select
  value={selectedAccountId}
  onValueChange={setSelectedAccountId}
>
  <SelectTrigger>Select Account</SelectTrigger>
  <SelectContent>
    {accounts.map(acc => (
      <SelectItem key={acc.id} value={acc.id}>
        {acc.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Edit Mode

Open CreateTransactionForm pre-filled:
```tsx
function handleEdit() {
  setFormOpen(true);
  setFormDefaults({
    vendor: parsed.vendor,
    amount: parsed.amount,
    category: parsed.category,
    date: parsed.date,
  });
}
```

### Attachments

Add receipt upload alongside text input for multi-modal parsing (text + image).

### History

Show recent parsed transactions for quick re-creation or learning patterns.

---

**Created:** 2026-02-27
**Status:** ✅ Core UI complete, blocked on account selection for transaction creation
