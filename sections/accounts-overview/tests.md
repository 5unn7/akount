# Accounts Overview - Test Specifications

Framework-agnostic test specifications for the Accounts Overview section. Implement these tests in your chosen testing framework (Jest, Vitest, Playwright, Cypress, etc.).

---

## User Flow Tests

### Flow 1: Daily Check-In (Success Path)

**Given:** User has accounts connected with recent activity

**When:** User opens the application

**Then:**
1. User lands on Accounts Overview page (/)
2. Net worth card displays with:
   - Total net worth amount (e.g., "$164,519 CAD")
   - Percentage change indicator (e.g., "+12.5% this month" in green)
   - Change amount (e.g., "+$18,420" in smaller text)
   - Sparkline trend chart visible
3. Cash position card displays with:
   - Cash total (e.g., "$530,332 CAD")
   - Account count (e.g., "5 accounts")
   - Debt total (e.g., "$434,911 CAD")
   - Account count for debt (e.g., "5 accounts")
   - Visual separation between cash and debt
4. Insights section displays 2-3 insight cards
5. Each insight card shows:
   - Title (e.g., "Cash increased $4,280 this month")
   - Description text
   - Severity badge color (positive=green, warning=amber, info=blue, negative=red)
   - Click target for navigation

**When:** User clicks first insight card

**Then:**
- User navigates to the linked view (e.g., "/analytics?filter=cash-flow&period=this-month")
- Selected entity filter persists across navigation
- Can use back button to return

### Flow 2: Multi-Currency Toggle (Success Path)

**Given:** User has accounts in multiple currencies (CAD, USD, INR)

**When:** User views accounts (default state)

**Then:**
1. Each account displays in its native currency:
   - "RBC Chequing" shows "$12,450 CAD"
   - "Chase Checking" shows "$18,750 USD"
   - "ICICI Savings" shows "₹425,000 INR"
2. Net worth and cash/debt cards display in base currency (CAD)
3. Currency toggle button shows "Native Currencies"

**When:** User clicks currency toggle button

**Then:**
1. Toggle changes to "View all in CAD"
2. All account amounts convert to CAD using FxRates
3. Each account shows:
   - Primary amount in CAD (larger text)
   - Original amount in smaller text below (e.g., "from $18,750 USD")
4. Net worth and cash/debt remain in CAD (no change)

**When:** User clicks toggle again

**Then:**
- Reverts to native currencies
- Button text returns to "Native Currencies"

### Flow 3: Entity Filtering (Success Path)

**Given:** User has accounts across Personal and 2 business entities

**When:** User opens entity dropdown

**Then:**
- Dropdown shows:
  - "All Entities" (current selection)
  - "Personal"
  - "Marakana Corp"
  - "Tech Ventures LLC"

**When:** User selects "Marakana Corp"

**Then:**
1. Dropdown closes and displays "Marakana Corp"
2. Accounts list filters to show only Marakana Corp accounts
3. Net worth card recalculates for Marakana Corp only
4. Cash and debt cards recalculate for Marakana Corp only
5. Insights filter to show only Marakana-related insights
6. URL updates with query parameter (e.g., "/?entity=ent-002")

**When:** User navigates to another section

**Then:**
- Entity filter persists (still "Marakana Corp")
- Other sections show Marakana-filtered data

**When:** User returns to Accounts Overview and selects "All Entities"

**Then:**
- All accounts visible again
- Summary cards show consolidated totals
- URL parameter removed

### Flow 4: Account Drill-Down (Success Path)

**Given:** User viewing accounts list

**When:** User sees "RBC Chequing" account row

**Then:**
- Row displays:
  - Account name "RBC Chequing"
  - Institution "Royal Bank of Canada"
  - Balance "$12,450 CAD"
  - Country flag (Canada)
  - Entity badge "Personal"
  - "3 unmatched" badge in amber color

**When:** User clicks on the account row

**Then:**
- User navigates to transactions or reconciliation view
- URL includes account filter (e.g., "/transactions?account=acc-001" or "/reconciliation?account=acc-001")
- Account context preserved

---

## Empty State Tests

### Empty State 1: No Accounts Connected

**Given:** New user with no bank accounts connected

**When:** User lands on Accounts Overview

**Then:**
1. Net worth and cash position cards show $0 or are hidden
2. Empty state illustration displays
3. Heading reads "Welcome to Akount" or similar friendly text
4. Description explains value proposition
5. Primary button displays "Connect Bank Account"
6. Secondary link shows "Learn more"

**When:** User clicks "Connect Bank Account"

**Then:**
- onConnectBank callback fires
- User navigates to bank connection flow (e.g., "/settings/connections?action=add")

### Empty State 2: No Insights Available

**Given:** User with accounts but no AI insights generated yet

**When:** User views Accounts Overview

**Then:**
1. Insights section header still displays
2. Small message shows "No insights yet. We'll show insights as we learn about your finances."
3. No insight cards render
4. Rest of page functions normally

### Empty State 3: No Call-to-Actions

**Given:** User with all tasks completed (no pending actions)

**When:** User views Accounts Overview

**Then:**
- Call-to-actions section does not render
- Other sections display normally

---

## Component Interaction Tests

### Test: NetWorthCard Displays Change Correctly

**Positive change:**
- Input: `netWorth = { total: 164519, currency: "CAD", change: 12.5, changeAmount: 18420, period: "month" }`
- Display: "$164,519 CAD"
- Change indicator: "+12.5% this month" in green with up arrow
- Change amount: "+$18,420" in green

**Negative change:**
- Input: `netWorth = { total: 150000, currency: "CAD", change: -5.2, changeAmount: -8200, period: "month" }`
- Display: "$150,000 CAD"
- Change indicator: "-5.2% this month" in red with down arrow
- Change amount: "-$8,200" in red

**No change:**
- Input: `change: 0, changeAmount: 0`
- Change indicator: "0% this month" in gray with no arrow

### Test: CashPositionCard Visual Separation

**Given:** Cash and debt amounts

**When:** Component renders

**Then:**
1. Cash and debt visually separated (e.g., left and right columns or top and bottom)
2. Cash uses positive/green styling
3. Debt uses warning/red styling
4. Account counts display for both
5. Totals in base currency

### Test: InsightCard Severity Colors

**Severity:** positive
- Badge color: green
- Border/accent: green

**Severity:** warning
- Badge color: amber/yellow
- Border/accent: amber

**Severity:** info
- Badge color: blue
- Border/accent: blue

**Severity:** negative
- Badge color: red
- Border/accent: red

### Test: AccountsList Grouping

**Given:** Accounts of mixed types

**When:** AccountsList renders

**Then:**
1. Accounts grouped by type:
   - "Bank Accounts" section
   - "Credit Cards" section
   - "Loans" section
   - "Assets" section
2. Each group has expand/collapse functionality
3. Groups default to expanded
4. Clicking group header toggles collapse state
5. Collapsed groups show count (e.g., "Bank Accounts (5)")

### Test: AccountRow Badges

**Bank account with unmatched transactions:**
- Shows account name, institution, balance
- Shows country flag badge
- Shows entity name badge
- Shows "3 unmatched" badge in amber

**Credit card:**
- Shows available credit below balance
- Example: "Balance: -$2,340" with "Available: $7,659 of $10,000 limit"

**Loan:**
- Shows interest rate and monthly payment
- Example: "4.79% APR • $2,145/mo"

---

## Edge Cases

### Edge Case 1: Currency Conversion - Missing FxRate

**Given:** Account in EUR but no EUR→CAD exchange rate in fxRates array

**When:** User toggles to "View all in CAD"

**Then:**
- Account displays in original currency (EUR)
- Shows warning icon or message "Exchange rate not available"
- Other accounts convert normally

### Edge Case 2: Very Large and Very Small Numbers

**Large numbers:**
- Input: `1234567890.50`
- Display: "$1,234,567,891 CAD" (rounded, with commas)

**Small numbers:**
- Input: `0.01`
- Display: "$0.01 CAD" (preserves cents)

**Negative numbers:**
- Input: `-5000`
- Display: "-$5,000 CAD" (negative sign visible)

### Edge Case 3: Long Account Names

**Given:** Account name exceeds container width

**When:** AccountRow renders

**Then:**
- Name truncates with ellipsis
- Full name appears in tooltip on hover
- Institution name also truncates if needed

### Edge Case 4: Multiple Entities with Same Name

**Given:** Two entities both named "Personal" (edge case, but possible)

**When:** Entity filter dropdown renders

**Then:**
- Distinguish by ID or other attribute
- Example: "Personal (ent-001)", "Personal (ent-002)"

### Edge Case 5: Zero Balance Accounts

**Given:** Bank account with $0.00 balance

**When:** Account displays

**Then:**
- Shows "$0.00 CAD" (not hidden)
- Still clickable for transaction history
- No special styling (not treated as error)

---

## Accessibility Tests

### Test: Keyboard Navigation

**When:** User navigates with keyboard only

**Then:**
1. Tab order is logical (top to bottom, left to right)
2. All interactive elements focusable (buttons, links, dropdowns)
3. Focus indicators visible (outline or ring)
4. Enter or Space activates buttons
5. Escape closes dropdowns and modals

### Test: Screen Reader Announcements

**Net worth card:**
- Announces: "Net worth: $164,519 Canadian dollars, up 12.5% this month, increased by $18,420"

**Insight card:**
- Announces: "Insight: Cash increased $4,280 this month. Positive. Click to view details."

**Account row:**
- Announces: "RBC Chequing, Royal Bank of Canada, Balance $12,450 Canadian dollars, Canada, Personal, 3 unmatched transactions"

### Test: Color Contrast

**All text:**
- Meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Dark mode also meets contrast requirements

**Focus indicators:**
- Visible against all backgrounds
- At least 3:1 contrast

---

## Responsive Layout Tests

### Mobile (<640px)

**Then:**
1. Net worth and cash position cards stack vertically (1 column)
2. Insights grid becomes single column
3. Account groups stack vertically
4. Entity and currency controls remain accessible in header
5. Touch targets at least 44x44px
6. Text remains readable (no horizontal scroll)

### Tablet (640px - 1024px)

**Then:**
1. Cards in 2 columns (net worth + cash position side by side)
2. Insights in 2 columns
3. Account list full width
4. Controls in header (not sidebar)

### Desktop (>1024px)

**Then:**
1. Full sidebar visible
2. Cards in 2 columns
3. Insights in 3 columns
4. Maximum content width constrained (e.g., 1400px)
5. Comfortable whitespace

---

## Performance Tests

### Test: Large Account List

**Given:** User has 50+ accounts

**When:** Accounts Overview loads

**Then:**
1. Page loads within 2 seconds
2. List renders without jank
3. Consider virtualization or pagination if >100 accounts
4. Scroll performance smooth

### Test: Rapid Filter Changes

**When:** User rapidly changes entity filter (clicks 5 times in 2 seconds)

**Then:**
1. UI remains responsive
2. Final state matches last selection
3. No race conditions or flickering
4. Debounce filter changes if needed

---

## Integration Tests

### Test: Deep Link with Query Parameters

**Given:** URL is "/?entity=ent-002&currency=CAD"

**When:** Page loads

**Then:**
1. Entity filter set to "Marakana Corp" (ent-002)
2. Currency toggle set to "View all in CAD"
3. Data filters and conversions apply correctly
4. URL reflects current state

### Test: Navigation Context Preservation

**When:** User filters by entity "Marakana Corp" and navigates to Analytics

**Then:**
1. Analytics section also filters by "Marakana Corp"
2. Entity selection persists in global state or URL
3. Returning to Accounts Overview maintains filter

---

## Sample Test Data

Use this data for consistent testing:

**Entities:**
```json
[
  { "id": "ent-001", "name": "Personal", "type": "personal", "country": "CA" },
  { "id": "ent-002", "name": "Marakana Corp", "type": "business", "country": "CA" },
  { "id": "ent-003", "name": "Tech Ventures LLC", "type": "business", "country": "US" }
]
```

**Accounts:**
- 5 bank accounts (2 personal CAD, 1 business CAD, 1 business USD, 1 personal INR)
- 3 credit cards (1 personal CAD, 1 business CAD, 1 personal USD)
- 3 loans (1 mortgage CAD, 1 business LOC CAD, 1 vehicle loan CAD)
- 1 investment account (personal CAD)

**FxRates:**
- CAD→USD: 0.74
- USD→CAD: 1.35
- CAD→INR: 61.50
- INR→CAD: 0.016

Full sample data in `sample-data.json`.

---

## Coverage Goals

- **User Flows:** 100% of specified flows covered
- **Components:** All major components tested
- **Empty States:** All empty states verified
- **Edge Cases:** Critical edge cases handled
- **Accessibility:** Basic a11y requirements met
- **Responsive:** Mobile, tablet, desktop tested

---

When all tests pass, the Accounts Overview section is complete and ready for production.
