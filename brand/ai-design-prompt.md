# AI Design Agent Prompt — Akount Frontend

> **Purpose:** Comprehensive context for AI design agents to create production-ready frontend screens
> **Usage:** Provide this Page Context + specific Screen Context for each design task

---

## Page Context (Universal — Include With Every Prompt)

### What is Akount?

**Akount** is an AI-powered financial command center for globally-operating solopreneurs. It combines:
- Multi-currency accounting (CAD, USD, EUR, etc.)
- Bank reconciliation and transaction tracking
- Invoicing and accounts receivable
- Bill management and accounts payable
- AI-driven categorization and insights
- General ledger and financial reporting

**Target User:** Solo business owners who operate internationally, need clean books for tax time, but don't want accounting complexity.

**Value Proposition:** "One glance, zero anxiety" — see your financial health instantly, get AI help when needed, stay audit-ready without hiring an accountant.

---

### Design Language: Financial Clarity

**Core Aesthetic:**
- **Dark-first**: Near-black backgrounds with subtle purple undertones
- **Glass morphism**: Translucent cards with blur effects
- **Minimalist**: Progressive disclosure, no clutter
- **Glowy accents**: Subtle radial glows, cursor-tracking effects
- **Zen**: Calm, confident, no anxiety

**Inspirations:**
- Linear (clean, fast, focused)
- Arc Browser (glass, smooth, delightful)
- Stripe Dashboard (trust, clarity, data-dense but readable)
- Mercury (modern banking, confident numbers)

---

### Color System

**Surface Hierarchy (5 levels):**
| Token | Hex | Use |
|-------|-----|-----|
| bg-0 | `#09090F` | Page background (deepest) |
| bg-1 | `#0F0F17` | Sidebar, panels |
| bg-2 | `#15151F` | Cards, elevated containers |
| bg-3 | `#1A1A26` | Hover states, tooltips |
| bg-4 | `#22222E` | Active states, highest elevation |

**Glass Morphism (3 tiers):**
- Glass 1: `rgba(255,255,255, 0.025)` — Default cards
- Glass 2: `rgba(255,255,255, 0.04)` — Hover states
- Glass 3: `rgba(255,255,255, 0.06)` — Active/focused

**Borders:**
- Default: `rgba(255,255,255, 0.06)`
- Medium: `rgba(255,255,255, 0.09)`
- Strong: `rgba(255,255,255, 0.13)`

**Primary Color:** Amber Orange
- Primary: `#F59E0B`
- Primary hover: `#FBBF24`
- Primary dim: `rgba(245,158,11, 0.14)` — Subtle backgrounds
- Primary glow: `rgba(245,158,11, 0.08)` — Shadow effects

**Semantic Colors (400-level for dark contrast):**
- Income/green: `#34D399` (Emerald 400)
- Expense/red: `#F87171` (Red 400)
- Transfer/blue: `#60A5FA` (Blue 400)
- AI/purple: `#A78BFA` (Purple 400)
- Teal accent: `#2DD4BF` (Teal 400)

**Text Colors:**
- Primary text: `#F9FAFB` (Gray 50)
- Secondary text: `#D1D5DB` (Gray 300)
- Muted text: `#9CA3AF` (Gray 400)
- Disabled: `#6B7280` (Gray 500)

---

### Typography

**Fonts:**
- **Headings:** Newsreader (serif, elegant, normal weight)
- **AI summaries/insights:** Newsreader *italic* (signals "interpreted, not raw data")
- **Body text:** Manrope (sans-serif, clean, readable)
- **All numbers/amounts:** JetBrains Mono (monospace, tabular, precise)
- **Labels/badges:** Manrope uppercase, 0.05em letter-spacing, 10-11px

**Type Scale:**
```
Display: 48px / 56px line-height (page titles)
H1: 32px / 40px (section titles)
H2: 24px / 32px (card headers)
H3: 18px / 28px (subsections)
Body: 15px / 24px (default)
Small: 13px / 20px (secondary info)
Tiny: 11px / 16px (labels, badges)
```

---

### Component Patterns

**Cards:**
```css
background: var(--glass);
border: 1px solid rgba(255,255,255,0.06);
border-radius: 14px;
backdrop-filter: blur(16px);
transition: border-color 0.2s, transform 0.2s;

/* Hover */
border-color: rgba(255,255,255,0.09);
transform: translateY(-1px);
box-shadow: 0 0 16px rgba(245,158,11, 0.08);
```

**Buttons (8px radius):**
- **Ghost:** Transparent + border
- **Dim:** Primary-dim background + subtle primary border
- **Solid:** Full primary background (#F59E0B)

**Badges/Pills:**
```css
border-radius: 12px;
font-size: 9px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 4px 10px;
background: [semantic-color]-dim;
border: 1px solid [semantic-color];
```

**Stat Cards Pattern:**
```
┌─────────────────────┐
│ LABEL (muted, tiny) │
│ $1,234.56 (mono, L) │
│ ↑ 12% (green, tiny) │
└─────────────────────┘
```

**Interactive Glow:**
- Cards use cursor-tracking radial glow (via `GlowCard` component)
- `radial-gradient` at `--glow-x`/`--glow-y` CSS vars
- Fades in on hover, invisible otherwise
- Use for feature cards, stat cards, settings panels
- Pass `glowColor="rgba(R,G,B,0.04)"` for custom hues

---

### Layout Structure

**App Shell:**
```
┌─────────────────────────────────────┐
│ [Sidebar]  [Main Content Area]      │
│            ┌──────────────────────┐ │
│            │ Header               │ │
│            │ (breadcrumb, actions)│ │
│            ├──────────────────────┤ │
│            │                      │ │
│            │ Content              │ │
│            │                      │ │
│            │                      │ │
│            └──────────────────────┘ │
└─────────────────────────────────────┘
```

**Sidebar (Collapsible, 240px):**
- Logo + entity switcher at top
- Navigation sections with icons
- AI Advisor entry point at bottom
- Glassmorphic background (bg-1)

**Main Content (Fluid):**
- Max-width: 1600px
- Padding: 32px
- Background: bg-0

**Responsive:**
- Desktop: Sidebar + content
- Tablet: Collapsible sidebar
- Mobile: Bottom nav + hamburger

---

### Navigation Sections

**8 Domains:**
1. **Overview** — Dashboard, financial snapshot
2. **Money** — Accounts, transactions, reconciliation
3. **Income** — Invoices, clients, receivables
4. **Expenses** — Bills, vendors, payables
5. **Accounting** — Chart of accounts, journal entries, reports
6. **Planning** — Budgets, forecasts, goals
7. **AI Advisor** — Insights, categorization rules, chat
8. **Settings** — Integrations, team, preferences

---

### Technical Constraints

**Framework:** Next.js 16 App Router + React Server Components

**Component Library:**
- shadcn/ui (headless primitives)
- shadcn-glass-ui@2.11.2 (glass variants)

**Available Glass Components:**
- ButtonGlass, InputGlass, GlassCard, BadgeGlass
- TabsGlass, ModalGlass, SwitchGlass, TooltipGlass, SeparatorGlass

**Styling:**
- Tailwind v4 (CSS config, NO tailwind.config.ts)
- Design tokens: `packages/design-tokens/`
- Use semantic tokens (`--primary`, `--background`, etc.)

**State Management:**
- Zustand for client state
- React Query for server state

**Icons:**
- Lucide React (consistent, simple, sharp)

---

### Data Display Rules

**Money Formatting:**
- Always use monospace font (JetBrains Mono)
- Include currency symbol ($ for CAD/USD, € for EUR)
- Two decimal places: `$1,234.56`
- Negative in red with minus: `-$500.00`
- Large numbers: `$1.2M` (abbreviated) or `$1,234,567.89` (full)

**Dates:**
- Relative when recent: "2 hours ago", "Yesterday", "Last week"
- Absolute when old: "Jan 15, 2026" or "2026-01-15" (ISO for tables)
- Time only when same day: "2:30 PM"

**Status Badges:**
- Draft: gray dim
- Pending: yellow/amber dim
- Paid/Complete: green dim
- Overdue/Failed: red dim
- Cancelled: gray dim + strikethrough

**Tables:**
- Sticky header
- Zebra striping (subtle, 2.5% white overlay)
- Row hover: bg-2
- Monospace for number columns
- Right-align numbers, left-align text

---

### Interaction Patterns

**Hover States:**
- Cards: Border brightens, 1px lift, subtle glow
- Buttons: Background lightens, slight scale
- Links: Underline on hover
- Table rows: Background to bg-2

**Loading States:**
- Skeleton screens (shimmer animation)
- Spinners for inline actions
- Progress bars for multi-step processes
- "Optimistic UI" for instant feedback

**Empty States:**
- Icon (48px, muted)
- Heading: "No [items] yet"
- Description: 1-2 sentences explaining why empty
- CTA button: "Create your first [item]"

**Error States:**
- Red badge with error icon
- Clear error message (not technical jargon)
- Suggested action or retry button

---

### Progressive Disclosure

**Dashboard Philosophy:**
- Show 3-5 key metrics at top (big numbers, clear labels)
- Collapse detail views into expandable cards
- "See all" links to dedicated pages
- Trends as small sparklines or mini-charts

**Detail Pages:**
- Summary card at top (key info)
- Tabs for related data (transactions, attachments, history)
- Action buttons in header (edit, delete, export)

**Forms:**
- One column layout (easier to scan)
- Group related fields
- Inline validation (as user types)
- Submit button always visible (sticky bottom)

---

### Accessibility

- WCAG 2.1 AA minimum
- Color contrast: 4.5:1 for body text, 3:1 for large text
- Keyboard navigation (focus visible)
- ARIA labels for icon-only buttons
- Screen reader friendly (semantic HTML)

---

### Anti-Patterns (DO NOT)

- ❌ Heavy drop shadows — use subtle borders + glow instead
- ❌ Solid white backgrounds in dark mode — use glass tiers
- ❌ Flat gray borders — use rgba(255,255,255,0.06)
- ❌ 500-level semantic colors on dark — too muted, use 400-level
- ❌ Dense text walls — progressive disclosure, expand on click
- ❌ Competing accent colors — orange is primary, everything else supports
- ❌ Multiple fonts for body text — Manrope only, except numbers (mono)

---

## How to Use This Prompt

### For Each Screen Design:

1. **Include this entire Page Context above**
2. **Add the specific Screen Context below** (see examples)
3. **Specify the flow** (entry points, exit points, next screens)

### Example Screen Context Template:

```markdown
## Screen Context: [Screen Name]

**Purpose:** [What this screen does in 1 sentence]

**User Goal:** [What the user wants to accomplish]

**Entry Points:**
- From [Screen A] via [action/link]
- From [Screen B] via [action/link]

**Key Data Displayed:**
- [Data point 1]
- [Data point 2]
- [Data point 3]

**Primary Actions:**
- [Action 1] → [Result/Next screen]
- [Action 2] → [Result/Next screen]

**Secondary Actions:**
- [Action 3]
- [Action 4]

**States to Handle:**
- Empty state: [What shows when no data]
- Loading state: [What shows while fetching]
- Error state: [What shows on failure]

**Special Considerations:**
- [Any unique requirements]
- [Edge cases to handle]

**Related Screens:**
- [Screen X] — [Relationship]
- [Screen Y] — [Relationship]
```

---

## Example Screen Contexts

### Screen: Dashboard (Overview)

**Purpose:** Give instant financial health snapshot at a glance

**User Goal:** Understand current financial status without digging

**Entry Points:**
- App login (default landing page)
- Sidebar "Overview" link
- Logo click from any page

**Key Data Displayed:**
- Total cash (across all accounts, in base currency)
- Outstanding receivables (money owed to you)
- Outstanding payables (money you owe)
- Net income this month (revenue - expenses)
- Pending reconciliation items count

**Primary Actions:**
- View all accounts → Money/Accounts list
- View invoices → Income/Invoices list
- View bills → Expenses/Bills list

**Secondary Actions:**
- Create invoice
- Create bill
- Reconcile transactions
- Ask AI Advisor

**Layout:**
```
┌───────────────────────────────────────────┐
│ Header: "Welcome back, [User]"            │
├───────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │Cash │ │A/R  │ │A/P  │ │Net  │  (KPIs)  │
│ └─────┘ └─────┘ └─────┘ └─────┘          │
├───────────────────────────────────────────┤
│ Recent Transactions (5 most recent)       │
│ [table with date, desc, amount, status]   │
├───────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐        │
│ │ Pending      │ │ AI Insights  │        │
│ │ Invoices (3) │ │ - Uncategorized txns │
│ └──────────────┘ └──────────────┘        │
└───────────────────────────────────────────┘
```

**Empty State:**
- "No transactions yet"
- Illustration (48px icon)
- "Connect a bank account or create your first invoice to get started"
- CTAs: "Connect Bank" + "Create Invoice"

**Special Considerations:**
- Multi-currency: Show base currency (entity setting) + flag icons for foreign amounts
- Real-time updates: Poll every 30s for new transactions
- AI badge: Pulse animation if new insights available

---

### Screen: Transaction List (Money)

**Purpose:** Browse, filter, search, and categorize bank transactions

**User Goal:** Find specific transactions, ensure all are categorized, spot duplicates

**Entry Points:**
- Sidebar "Money" → "Transactions"
- Dashboard "Recent Transactions" → "See all"
- Account detail page → "View transactions"

**Key Data Displayed:**
- Transaction date
- Description (from bank)
- Amount (with +/- sign)
- Category (with edit icon)
- Status (categorized, pending, duplicate)
- Account name

**Primary Actions:**
- Categorize transaction → Opens category picker
- Mark as duplicate → Flags for hiding
- Match to invoice/bill → Opens reconciliation modal
- Export to CSV → Downloads filtered list

**Secondary Actions:**
- Filter by date range
- Filter by category
- Filter by account
- Search by description
- Sort by date/amount

**Layout:**
```
┌───────────────────────────────────────────┐
│ Header: "Transactions"                    │
│ [Search] [Date filter] [Category filter]  │
├───────────────────────────────────────────┤
│ Table:                                    │
│ Date       | Desc       | Amount | Cat    │
│ Feb 10     | Grocery    | -$50   | Food   │
│ Feb 09     | Client Inc | +$500  | Revenue│
│ ...                                       │
├───────────────────────────────────────────┤
│ Pagination: 1 2 3 ... 10 (50 per page)    │
└───────────────────────────────────────────┘
```

**Empty State:**
- "No transactions found"
- Description: "Connect a bank account to import transactions automatically"
- CTA: "Connect Bank Account"

**Loading State:**
- Skeleton rows (shimmer animation)
- Shows 10 skeleton rows while fetching

**Special Considerations:**
- Bulk select: Checkbox column for multi-categorize
- Inline edit: Click category to change without modal
- AI suggestion badge: Show AI-suggested category with confidence %
- Infinite scroll or pagination (preference setting)

---

### Screen: Invoice Detail (Income)

**Purpose:** View all information about a specific invoice and take actions

**User Goal:** Review invoice details, send to client, track payment status

**Entry Points:**
- Income/Invoices list → Click invoice row
- Dashboard "Pending Invoices" → Click invoice card
- Direct link from email/notification

**Key Data Displayed:**
- Invoice number, date, due date
- Client name, email, billing address
- Line items (description, quantity, rate, amount)
- Subtotal, tax, total
- Amount paid, amount due
- Status (draft, sent, paid, overdue)
- Payment history

**Primary Actions:**
- Send invoice → Opens email composer
- Record payment → Opens payment modal
- Edit invoice → Goes to edit form
- Download PDF → Generates PDF

**Secondary Actions:**
- Duplicate invoice
- Convert to credit note
- View audit log
- Delete (soft delete)

**Layout:**
```
┌───────────────────────────────────────────┐
│ Header: Invoice #INV-001                  │
│ [Send] [Record Payment] [Edit] [•••]      │
├───────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐   │
│ │ Status Badge: SENT (or PAID/OVERDUE)│   │
│ │                                     │   │
│ │ Client: ABC Inc                     │   │
│ │ Date: Jan 15, 2026                  │   │
│ │ Due: Feb 15, 2026                   │   │
│ └─────────────────────────────────────┘   │
├───────────────────────────────────────────┤
│ Line Items Table:                         │
│ Description       | Qty | Rate  | Amount  │
│ Consulting        | 10  | $100  | $1,000  │
│ ...                                       │
├───────────────────────────────────────────┤
│                   Subtotal:     $1,000.00 │
│                   Tax (13%):      $130.00 │
│                   Total:        $1,130.00 │
│                   Paid:           $500.00 │
│                   Due:            $630.00 │
├───────────────────────────────────────────┤
│ Payment History:                          │
│ - Jan 20: $500 via Bank Transfer          │
└───────────────────────────────────────────┘
```

**Special Considerations:**
- Multi-currency: Show original currency + base currency
- Partial payments: List all payment allocations
- Overdue indicator: Red badge + days overdue
- PDF preview: Inline preview of generated PDF

---

## Flow Examples

### Flow: Bank Reconciliation

```
1. Dashboard → "5 unreconciled transactions" badge
   ↓
2. Click badge → Reconciliation page (filtered: unreconciled only)
   ↓
3. Transaction row → Click "Match" button
   ↓
4. Modal opens: "Match Transaction"
   - Shows transaction details
   - Lists potential matches (invoices/bills with similar amounts)
   - AI suggestions at top with confidence scores
   ↓
5a. Click suggested match → Confirms match, creates journal entry
    → Modal closes, transaction marked "Reconciled"
    → Removes from unreconciled list

5b. Click "No match" → Marks as "Needs review"
    → AI learns for future suggestions

5c. Click "Create invoice/bill" → Opens quick-create form
    → After save, auto-matches to transaction
```

### Flow: Create Invoice → Get Paid

```
1. Income/Invoices → "Create Invoice" button
   ↓
2. Invoice form opens (empty state)
   - Client picker (with "Create new client" option)
   - Date/due date
   - Line items builder
   - Tax settings
   ↓
3. Save as draft → Saves, shows invoice detail
   ↓
4. Click "Send" → Email composer modal
   - To: Client email (pre-filled)
   - Subject: "Invoice #INV-001 from [Company]"
   - Body: Template with link to invoice
   ↓
5. Send email → Status changes to "Sent"
   → Client receives email with payment link
   ↓
6. Client pays online → Webhook received
   → Status changes to "Paid"
   → Journal entry auto-created (DR: Bank, CR: Revenue)
   → Notification sent to user
   ↓
7. User sees notification → Clicks to view invoice
   → Shows "Paid" badge, payment details, GL link
```

---

## Design Deliverables

For each screen, provide:

1. **Wireframe:** Low-fi structure (boxes and labels)
2. **High-fidelity mockup:** Full design with colors, typography, spacing
3. **Component breakdown:** List of shadcn/ui + custom components used
4. **Responsive views:** Desktop (1440px), tablet (768px), mobile (375px)
5. **State variations:** Empty, loading, error, success
6. **Interaction notes:** Hover effects, animations, transitions
7. **Spacing/sizing:** Exact px values for margins, padding, gaps
8. **Accessibility notes:** ARIA labels, keyboard shortcuts, focus states

---

## Technical Implementation Notes

**Server Components (Default):**
- Data fetching happens server-side
- No `'use client'` directive unless needed
- Use `async` functions to fetch data

**Client Components (When Needed):**
- Add `'use client'` at top of file
- Use for forms, modals, interactive elements
- Use React hooks (useState, useEffect, etc.)

**Data Fetching Pattern:**
```typescript
// page.tsx (Server Component)
export default async function InvoicesPage() {
  const invoices = await getInvoices(); // Server-side fetch
  return <InvoiceList invoices={invoices} />;
}

// invoice-list.tsx (Client Component)
'use client';
export function InvoiceList({ invoices }) {
  const [filter, setFilter] = useState('all');
  // Interactive filtering, sorting, etc.
}
```

**Form Pattern:**
- Use React Hook Form + Zod validation
- Inline validation (show errors as user types)
- Submit button disabled until valid
- Optimistic UI updates (show success immediately, sync in background)

---

## Questions to Ask User Before Designing

1. **What's the primary user goal on this screen?**
2. **What data is most critical to show first?**
3. **What actions should be easiest to access?**
4. **Are there any specific business rules or constraints?**
5. **How does this screen fit in the overall user journey?**

---

**End of Page Context**

---

Now add your specific **Screen Context** and **Flow** to complete the design brief.
