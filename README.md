# Akount - Product Plan Export Package

**Version:** 1.0
**Generated:** January 2026
**Product:** Multi-country financial command center for solo entrepreneurs

---

## What's Included

This export package contains everything needed to implement Akount in your chosen tech stack:

### 📋 Product Specifications
- `product-overview.md` - Product description, sections, data model summary, implementation sequence
- `product/sections/*/spec.md` - Detailed specifications for each of the 7 sections
- `product/shell/spec.md` - Application shell specification

### 🎨 Design System
- `design-system/tokens.css` - CSS custom properties for colors and typography
- `design-system/tailwind-colors.md` - Tailwind CSS v4 usage examples
- `design-system/fonts.md` - Google Fonts import code and usage

### 💾 Data Model
- `data-model/types.ts` - Complete TypeScript type definitions
- `data-model/README.md` - Entity descriptions and relationships

### 🏗️ Application Shell
- `shell/components/` - Sidebar navigation, workspace/entity controls, user menu
- `shell/README.md` - Shell specification and usage examples

### 🧩 Section Components
- `sections/[section-id]/types.ts` - Section-specific TypeScript types
- `sections/[section-id]/sample-data.json` - Sample data for development and testing
- `sections/[section-id]/components/` - Reference React components
- `sections/[section-id]/README.md` - Section specification and design notes
- `sections/[section-id]/tests.md` - Test specifications (TDD approach)

### 📖 Implementation Instructions
- `instructions/incremental/01-foundation.md` - Foundation setup (auth, routing, design system, shell)
- `instructions/incremental/02-08-*.md` - Step-by-step instructions for each of the 7 sections
- `instructions/one-shot-instructions.md` - All milestones combined for full implementation

### 🚀 Ready-to-Use Prompts
- `prompts/one-shot-prompt.md` - Complete prompt for full implementation in one session
- `prompts/section-prompt.md` - Template for section-by-section implementation

---

## How to Use This Package

### Approach 1: Incremental Implementation (Recommended)

Build Akount milestone by milestone, fully completing one before moving to the next:

1. **Foundation** - Follow `instructions/incremental/01-foundation.md`
   - Set up tech stack, auth, routing, design system, shell
   - Create database schema for core entities
   - Get application skeleton working

2. **Accounts Overview** - Follow `instructions/incremental/02-accounts-overview.md`
   - Build the financial dashboard
   - Implement multi-currency display and entity filtering
   - Test all user flows before proceeding

3. **Continue with remaining sections** (03-08)
   - Each milestone builds on the previous ones
   - Reference provided components and sample data
   - Write tests first (TDD approach)

**Benefits:**
- Reduces complexity
- Easier to test and validate
- Can deploy incrementally
- Better for team collaboration

### Approach 2: One-Shot Full Build

Build the entire application in one session using an AI coding agent:

1. Copy the content from `prompts/one-shot-prompt.md`
2. Answer the clarifying questions about tech stack and scope
3. Let the agent build all 8 milestones following the combined instructions
4. Review and test the complete implementation

**Benefits:**
- Fastest path to complete app
- Good for prototypes or MVPs
- Consistent architecture across all sections

### Approach 3: Section-by-Section with AI

Focus on one section at a time with AI assistance:

1. Complete foundation milestone first
2. For each section, use `prompts/section-prompt.md` as a template
3. Replace placeholders with section-specific information
4. Implement and test before moving to next section

**Benefits:**
- Focused scope per session
- Easier to review AI output
- Good for learning the codebase

---

## Test-Driven Development (TDD)

Each section includes comprehensive test specifications in `tests.md`. This approach ensures:

✅ **Complete Coverage** - All requirements, user flows, and edge cases specified
✅ **Framework Agnostic** - Tests written as specifications, not tied to Jest/Vitest/etc.
✅ **User-Focused** - Tests describe actual user interactions and expected outcomes
✅ **Edge Cases** - Empty states, error handling, boundary conditions included

**How to use test specifications:**
1. Read `sections/[section-id]/tests.md` before implementing
2. Write actual test code in your chosen framework based on these specs
3. Implement features to make tests pass
4. Tests act as acceptance criteria - when they pass, the section is complete

---

## Design System Notes

### Tailwind CSS v4
- **No `tailwind.config.js`** - Tailwind v4 doesn't use config files
- **Use built-in utilities** - Avoid custom CSS
- **Use built-in colors** - orange, violet, slate palettes

### Typography
- **Newsreader** - Serif font for headings and emphasis
- **Manrope** - Sans-serif for body text and UI
- **JetBrains Mono** - Monospace for numbers, codes, technical data

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar collapses on mobile with hamburger menu

### Dark Mode
- All components include `dark:` variants
- Toggle handled at app level
- Slate palette optimized for both modes

---

## Architecture Guidelines

### Component Philosophy
- **Props-based** - All data passed via props, no direct imports
- **Presentation layer** - Components don't fetch data or handle business logic
- **Composable** - Small, reusable components combined into larger views
- **Type-safe** - Full TypeScript coverage

### State Management
- **Server state** - Use react-query, SWR, or similar for API data
- **Global UI state** - Context, Zustand, Redux for entity filter, workspace, user
- **Local state** - useState for forms, toggles, temporary UI state

### Data Fetching
- Fetch at route/page level
- Pass data down to components
- Handle loading and error states
- Consider optimistic updates for mutations

### Navigation & Context
- Preserve context with query parameters
- Example: `/transactions?account=acc-001&entity=ent-002`
- Entity filter persists across navigation
- Back button works as expected

---

## Implementation Tips

### Start Simple
- Begin with mock data from `sample-data.json` files
- Hardcode single workspace/entity initially
- Add complexity incrementally

### Reuse Patterns
- Once you solve multi-currency display, reuse the pattern
- Entity filtering logic can be shared across sections
- Create shared utility functions for common operations

### Empty States Matter
- Every list view needs an empty state
- Make them helpful and actionable
- Include illustrations or friendly copy

### Mobile Responsiveness
- Test on mobile from the start
- Sidebar becomes hamburger menu <lg
- Tables become cards on mobile
- Touch targets at least 44x44px

### Performance Considerations
- Paginate long lists (transactions, invoices)
- Virtualize very long tables if needed
- Optimize images and fonts
- Lazy load sections if bundle size grows

---

## Tech Stack Suggestions

This package is tech-stack agnostic, but here are proven combinations:

### Option A: Next.js + Supabase
- **Frontend:** Next.js 14+ (App Router)
- **Backend:** Supabase (Auth + Database + Storage)
- **State:** Tanstack Query + Zustand
- **Styling:** Tailwind CSS v4

### Option B: Remix + PostgreSQL
- **Frontend:** Remix
- **Backend:** Remix loaders/actions + PostgreSQL
- **ORM:** Prisma
- **Styling:** Tailwind CSS v4

### Option C: Vite + tRPC
- **Frontend:** Vite + React Router
- **Backend:** tRPC + Express
- **Database:** PostgreSQL + Drizzle ORM
- **State:** Tanstack Query

### Option D: Full-Stack Framework
- **RedwoodJS:** Full-stack React with GraphQL
- **Blitz.js:** Full-stack React with RPC layer

---

## Banking Integrations

For real bank connections, consider:
- **Plaid** (North America) - Most popular, great developer experience
- **Finicity** (North America) - Mastercard owned, enterprise-ready
- **Yodlee** (Global) - Supports many countries
- **TrueLayer** (Europe) - Open banking focused
- **Basiq** (Australia) - AU/NZ specialist

Start with mock data and add real integrations later.

---

## AI Integration

For AI features (insights, categorization suggestions):
- **OpenAI GPT-4** - Good for natural language insights
- **Anthropic Claude** - Excellent for financial analysis
- **Local Models** - For privacy-sensitive deployments

Initially, use rule-based logic and add AI progressively.

---

## Common Questions

**Q: Do I need to implement all 7 sections?**
A: No. Start with Foundation + Accounts Overview + Bank Reconciliation + Transactions. Add others based on user needs.

**Q: Can I modify the design?**
A: Yes! The provided components are reference implementations. Adapt to your brand and users.

**Q: What about multi-user collaboration?**
A: The data model supports it (Workspace, UserRole), but implement single-user first, then add collaboration.

**Q: How do I handle the double-entry accounting?**
A: Start simple with categories. Add GL accounts and journal entries only if users need them. See Transactions & Bookkeeping section.

**Q: Should I build a mobile app?**
A: Start with responsive web. Consider React Native or Capacitor later if needed.

---

## Getting Help

This export package is designed to be self-contained, but you may need:

- **Tailwind CSS v4 docs:** https://tailwindcss.com/docs
- **React docs:** https://react.dev
- **TypeScript docs:** https://www.typescriptlang.org/docs
- **Lucide icons:** https://lucide.dev (used in reference components)

---

## License & Usage

This export package is for implementing Akount. All code, designs, and specifications are provided as-is for your use in building the product.

---

**Ready to build? Start with `instructions/incremental/01-foundation.md` or `prompts/one-shot-prompt.md`!**
#   a k o u n t  
 