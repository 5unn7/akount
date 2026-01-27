# Akount - Full Implementation Prompt

You are building **Akount**, a multi-country financial command center for solo entrepreneurs. This prompt contains complete product specifications, design system, data model, and implementation instructions for building the entire application in one session.

---

## Before You Start: Clarifying Questions

Please ask the user these questions before beginning implementation:

### 1. Authentication & User Model
- How should users authenticate? (Auth0, Supabase Auth, Firebase Auth, Clerk, custom JWT?)
- Will you implement the full multi-workspace model with entities, or start simpler with single-user mode?
- Should you include sign up/login pages or assume auth is handled externally?

### 2. Tech Stack
- What framework and routing? (Next.js App Router, Remix, Vite + React Router, something else?)
- State management? (Tanstack Query + Zustand, Redux, Jotai, or framework-specific like Remix loaders?)
- Backend architecture? (tRPC, REST API, GraphQL? Serverless or traditional server?)
- Database? (PostgreSQL with Prisma, Supabase, PlanetScale, Firebase, MongoDB?)

### 3. Scope & Phasing
- Should you implement all 8 milestones (foundation + 7 sections) or start with a subset?
- Which sections are highest priority? (Default: Foundation + Accounts Overview + Bank Reconciliation + Transactions)
- Should you use mock data initially or build database integration from the start?

### 4. Banking Integrations
- Will you integrate real bank connections (Plaid, Finicity, Yodlee) or use mock data?
- If real integrations, which provider and do you have API credentials?

### 5. AI Features
- For AI insights and categorization suggestions, should you use OpenAI, Anthropic Claude, or mock data?
- If using AI, do you have API keys?

---

## Product Overview

${productOverviewContent}

---

## Implementation Instructions

Follow these instructions to build Akount incrementally across 8 milestones:

---

${foundationInstructionsContent}

---

${accountsOverviewInstructionsContent}

---

${bankReconciliationInstructionsContent}

---

${transactionsBookkeepingInstructionsContent}

---

${invoicingBillsInstructionsContent}

---

${analyticsInstructionsContent}

---

${planningInstructionsContent}

---

${aiFinancialAdvisorInstructionsContent}

---

## Test-Driven Development

Each section includes a `tests.md` file with comprehensive test specifications. Write tests first, then implement to pass those tests. This ensures:
- All requirements are met
- Edge cases are handled
- Empty states work correctly
- User flows complete successfully

Test files are located at:
- `sections/accounts-overview/tests.md`
- `sections/bank-reconciliation/tests.md`
- `sections/transactions-bookkeeping/tests.md`
- `sections/invoicing-bills/tests.md`
- `sections/analytics/tests.md`
- `sections/planning/tests.md`
- `sections/ai-financial-advisor/tests.md`

---

## Design System Reference

All design tokens, color palettes, and typography are defined in:
- `design-system/tokens.css` - CSS custom properties
- `design-system/tailwind-colors.md` - Tailwind usage examples
- `design-system/fonts.md` - Google Fonts imports

**Key tokens:**
- Primary: orange
- Secondary: violet
- Neutral: slate
- Heading font: Newsreader
- Body font: Manrope
- Mono font: JetBrains Mono

---

## Data Model Reference

Complete data model types are in `data-model/types.ts`. Key entities:
- Core: Entity, GLAccount, JournalEntry, Currency, FxRate
- Banking: Account, BankFeedTransaction, Transaction, TransactionMatch, Transfer, Category
- AR/AP: Client, Vendor, Invoice, Bill, Payment
- Planning: Budget, Goal
- AI: Insight, Rule

Relationships are documented in `data-model/README.md`.

---

## Shell Components

The application shell (sidebar navigation, workspace/entity controls) is provided in `shell/components/`:
- `AppShell.tsx` - Main wrapper
- `MainNav.tsx` - Sidebar navigation
- `UserMenu.tsx` - User menu
- `useSpotlight.ts` - Spotlight effect hook

Wire up the callbacks based on your routing and state management choices.

---

## Section Reference Components

Each section has reference React components in `sections/[section-id]/components/`. These are fully functional, props-based components that:
- Accept all data via props (no direct imports of data)
- Use Akount design tokens
- Support responsive layouts and dark mode
- Include proper TypeScript types

You can use these as-is or as reference for your implementation.

---

## Success Criteria

Your implementation is complete when:

✅ All 8 milestones' done checklists are satisfied
✅ All tests in `tests.md` files pass
✅ App works on desktop, tablet, and mobile
✅ Dark mode functions correctly
✅ Multi-currency and entity filtering work
✅ All user flows can be completed end-to-end
✅ Empty states render appropriately
✅ Navigation between sections preserves context

---

## Tips for Success

1. **Start with Foundation** - Get auth, routing, design system, and shell working first
2. **Use Mock Data Initially** - Start with sample data from `sections/*/sample-data.json`
3. **Build Incrementally** - Complete one milestone fully before moving to the next
4. **Test as You Go** - Write tests first, implement to pass them
5. **Reuse Patterns** - Once you solve multi-currency or entity filtering once, reuse the pattern
6. **Props-Based Components** - Keep components pure with data passed via props
7. **Reference the Designs** - Use provided components as examples of expected UX
8. **Don't Skip Empty States** - They're critical for good UX

Good luck building Akount!
