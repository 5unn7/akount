# Natural Language Search UI Integration

**Task:** DEV-249 (C4) - NL Search UI (search bar with AI mode toggle)
**Date:** 2026-02-28
**Status:** ✅ Complete
**Phase:** Document Intelligence Platform - Phase 2

---

## Implementation Summary

Integrated the NLSearchBar component into the transactions list page, providing users with AI-powered natural language search alongside traditional filters.

### Components Modified

1. **TransactionsList.tsx** (Server Component)
   - Added `entityId` prop to interface
   - Passed `entityId` to client component

2. **TransactionsListClient.tsx** (Client Component)
   - Imported `NLSearchBar` and `SearchFilters` types
   - Added `entityId` prop to interface
   - Added `nlSearchFilters` state management
   - Created `handleNLSearchFiltersChange` handler
   - Integrated NLSearchBar component above traditional filters
   - Conditional rendering: hides traditional filters when NL search is active

3. **transactions/page.tsx** (Server Page)
   - Passed `entityId` from cookies to TransactionsList component

4. **NLSearchBar.tsx**
   - Fixed Badge variant from `"secondary"` to `"ai"` (type compatibility)

---

## Features Implemented

### ✅ AI Mode Toggle
- **Default:** Keyword search (magnifying glass icon)
- **AI Mode:** Natural language search (sparkle icon)
- Toast notification when switching modes

### ✅ Natural Language Parsing
- Queries like "restaurant expenses over $100 in Q4"
- Backend API: `POST /api/ai/search/natural`
- Confidence threshold: 50% minimum
- Low confidence → fallback suggestion

### ✅ Filter Chips Display
- Visual representation of parsed filters
- Removable chips (click X)
- Clear all button when filters active
- AI variant badge styling (purple accent)

### ✅ Filter Integration
- NL filters take precedence over traditional filters
- URL params updated with parsed criteria
- Traditional filters hidden when NL search active
- Seamless switching between modes

### ✅ Error Handling
- Missing consent → "Enable AI Search in Settings"
- API failures → fallback to keyword mode
- 422 (Low confidence) → suggestion toast
- 503 (Service unavailable) → retry message

---

## API Integration

**Endpoint:** `POST /api/ai/search/natural`

**Request:**
```typescript
{
  query: string;          // "restaurant expenses over $100 in Q4"
  entityId: string;       // Tenant isolation
  scope: 'transactions';  // Search domain
}
```

**Response:**
```typescript
{
  parsed: SearchFilters;    // Structured filters
  filterChips: FilterChip[]; // UI display
  explanation: string;      // AI-generated summary
  confidence: number;       // 0-100
}
```

**Supported Filters:**
- `description` → Text search
- `categoryId` → Category filter
- `accountId` → Account filter
- `dateFrom` / `dateTo` → Date range
- `amountMin` / `amountMax` → Amount range
- `type` → income | expense | transfer

---

## User Experience Flow

1. **User opens transactions page**
   - NL Search Bar displayed at top (glass card)
   - Traditional filters below (default mode)

2. **User clicks "AI Mode" toggle**
   - Icon changes: Search → Sparkles
   - Placeholder updates to example query
   - Toast: "AI mode enabled - ask in plain English"

3. **User types natural query**
   - Example: "Uber rides last month"
   - Press Enter or click "Search" button

4. **AI parses query**
   - Backend calls Mistral API
   - Returns structured filters + chips
   - Success toast shows explanation

5. **Filter chips appear**
   - "Vendor: Uber", "Date: Last Month"
   - User can remove individual chips
   - URL params updated
   - Traditional filters hidden

6. **Transaction table filters**
   - Results match parsed criteria
   - Same UX as traditional filtering

---

## Edge Cases Handled

### No Entity Selected
- NL Search Bar hidden (requires `entityId`)
- Traditional filters still available

### AI Consent Not Granted
- API returns 403
- Toast: "Enable AI Search in Settings"
- User redirected to settings

### Low Confidence Parse
- API returns 422
- Toast: "Couldn't understand query. Try: 'expenses over $100 last month'"
- No filter chips shown

### Service Unavailable
- Mistral API error or circuit breaker open
- Toast: "AI service temporarily unavailable"
- Auto-fallback to keyword mode

---

## Dependencies

### Backend (Already Implemented)
- ✅ DEV-248 (C3): Natural search endpoint
- ✅ DEV-230 (A1): Mistral provider
- ✅ DEV-232 (A5): AIDecisionLog
- ✅ SEC-32 (E1): Consent management

### Frontend (This Task)
- ✅ NLSearchBar component
- ✅ SearchFilters types
- ✅ apiFetch browser client

---

## Testing Checklist

### Manual Tests

- [ ] **Toggle AI mode** → Icon changes, placeholder updates
- [ ] **Keyword search** → Traditional text filter works
- [ ] **AI search with high confidence** → Filter chips appear, table filters
- [ ] **AI search with low confidence** → Error toast, suggestion shown
- [ ] **Remove filter chip** → Filter removed, table updates
- [ ] **Clear all filters** → Chips removed, table resets
- [ ] **Switch from AI to keyword mode** → Chips cleared, traditional filters shown
- [ ] **No entityId** → NL Search Bar hidden gracefully
- [ ] **Missing AI consent** → 403 error handled with settings prompt

### Example Queries to Test

```
✅ Good confidence:
- "restaurant expenses over $100 in Q4"
- "All income transactions last month"
- "Uber rides in January"

❌ Low confidence (should fail gracefully):
- "Show me stuff"
- "What happened last year?"
- "Random gibberish xyz123"
```

---

## Future Enhancements (Not in Scope)

- Multi-domain search (invoices, bills, all)
- Search result highlights
- Query history / suggestions
- Voice input support
- Advanced filter combinations (AND/OR)

---

## Commits

1. `feat(transactions): Add entityId prop to TransactionsList`
2. `feat(transactions): Integrate NLSearchBar with AI mode toggle`
3. `fix(ui): Update NLSearchBar Badge variant to 'ai'`

---

## Related Files

- **Component:** `apps/web/src/components/shared/NLSearchBar.tsx`
- **Types:** `apps/web/src/components/shared/NLSearchBar.types.ts`
- **Example:** `apps/web/src/components/shared/NLSearchBar.example.tsx`
- **API Route:** `apps/api/src/domains/ai/routes/natural-search.routes.ts`
- **Service:** `apps/api/src/domains/ai/services/natural-search.service.ts`

---

**Completed:** 2026-02-28
**Time Spent:** ~2.5 hours
**Lines Added:** ~150 (integration code)
**Lines Modified:** ~50 (prop threading)
