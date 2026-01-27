# Milestone 1: Foundation

**Prerequisites:** None (this is the first milestone)

---

## What's Provided vs. What You Build

**Provided in this export package:**
- Complete product specification and requirements
- Design system tokens (colors, typography, spacing)
- Data model types and entity descriptions
- Application shell components (sidebar navigation, workspace/entity controls)
- Screen design reference components with sample data
- Test specifications for each section

**What you'll build:**
- Your own tech stack (React + routing library + state management + backend/database)
- Authentication system
- Data fetching and mutations
- Database schema based on provided types
- Business logic and validations
- API layer
- Real bank connection integrations (Plaid, Finicity, etc.)
- Deployment infrastructure

---

## Preamble

This milestone establishes the foundation for the entire Akount application. You'll set up your tech stack, configure the design system, implement the data model types, establish routing for all 7 sections, and integrate the application shell. All subsequent milestones build on this foundation.

**Key decisions to make:**
1. **Authentication:** How will users sign up and log in? (Auth0, Supabase Auth, Firebase Auth, custom JWT?)
2. **User Model:** Will you implement the full multi-workspace model with entities, or start simpler?
3. **Tech Stack:** What framework and libraries? (Next.js, Remix, Vite + React Router? Tanstack Query? Zustand/Redux?)
4. **Backend:** API architecture? (tRPC, REST, GraphQL? Serverless or traditional server?)
5. **Database:** Which database? (PostgreSQL, MySQL, Supabase, Firebase?)

---

## Goal

Create a working application skeleton with:
- Design tokens configured in your styling system
- Type definitions for all core data models
- Routing structure for all 7 sections
- Application shell with navigation (sidebar, workspace/entity filters)
- Placeholder pages for each section
- Authentication flow

---

## Design System Setup

### 1. Install Google Fonts

Add to your HTML `<head>` or app entry point:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### 2. Configure Tailwind CSS v4

Install Tailwind CSS v4 and configure your `@theme` directive with Akount's design tokens.

**Reference:** `design-system/tokens.css` and `design-system/tailwind-colors.md`

**Key tokens:**
- Primary color: orange
- Secondary color: violet
- Neutral color: slate
- Font families: Newsreader (headings), Manrope (body), JetBrains Mono (mono)

### 3. Set Up Dark Mode

Ensure your app supports light and dark modes. All designs use `dark:` variants.

---

## Data Model Types

### 1. Copy Core Types

Start with the types in `data-model/types.ts`. You don't need to implement all entities immediately - start with the essentials:

**Phase 1 (MVP):**
- User, Workspace, Entity
- Account, Currency, FxRate
- Transaction, Category
- BankFeedTransaction, TransactionMatch

**Phase 2:**
- GLAccount, JournalEntry, JournalLine
- Client, Vendor, Invoice, Bill, Payment
- Budget, Goal

**Phase 3:**
- Insight, Rule, Attachment
- Project, Tag, Notification

### 2. Database Schema

Create database migrations for your chosen database based on the types. Key relationships:
- Workspace has many Entities and Users
- Entity has many Accounts, Transactions, Invoices, Budgets
- Account belongs to Entity and Currency
- Transaction belongs to Account and Category

---

## Routing Structure

Set up routes for all 7 main sections plus auth and settings:

```
/                          → Accounts Overview (home, requires auth)
/reconciliation            → Bank Reconciliation
/transactions              → Transactions & Bookkeeping
/invoicing                 → Invoicing & Bills
/analytics                 → Cash Flow & Analytics
/planning                  → Budgeting & Goals
/ai                        → AI Financial Advisor
/settings                  → Settings
/login                     → Login page
/signup                    → Sign up page
```

Create placeholder components for each route initially. You'll implement them in subsequent milestones.

---

## Application Shell Integration

### 1. Copy Shell Components

The shell components are in `shell/components/`:
- `AppShell.tsx` - Main wrapper with sidebar and responsive behavior
- `MainNav.tsx` - Sidebar navigation with workspace/entity controls
- `UserMenu.tsx` - User menu at bottom of sidebar
- `useSpotlight.ts` - Spotlight hover effect hook

### 2. Set Up Navigation Items

Create your navigation configuration:

```typescript
import { Home, CreditCard, BookOpen, FileText, TrendingUp, Target, Bot } from 'lucide-react'

const navigationItems = [
  { id: 'accounts', label: 'Accounts Overview', icon: Home, href: '/', isActive: true },
  { id: 'reconciliation', label: 'Bank Reconciliation', icon: CreditCard, href: '/reconciliation' },
  { id: 'transactions', label: 'Transactions & Bookkeeping', icon: BookOpen, href: '/transactions' },
  { id: 'invoicing', label: 'Invoicing & Bills', icon: FileText, href: '/invoicing' },
  { id: 'analytics', label: 'Cash Flow & Analytics', icon: TrendingUp, href: '/analytics' },
  { id: 'planning', label: 'Budgeting & Goals', icon: Target, href: '/planning' },
  { id: 'ai', label: 'AI Financial Advisor', icon: Bot, href: '/ai' },
]
```

### 3. Wire Up Callbacks

The AppShell needs these callbacks:
- `onNavigate` - Handle route changes
- `onWorkspaceChange` - Switch between workspaces
- `onEntityFilterChange` - Filter data by entity
- `onLogout` - Sign out user

Implement these based on your routing and state management choices.

### 4. Auth Protection

Wrap authenticated routes with your auth provider. Redirect unauthenticated users to `/login`.

---

## User Onboarding Flow

Decide how new users experience the app:

**Option A: Full Onboarding**
1. Sign up → Create workspace → Add entities → Connect first bank → Dashboard

**Option B: Quick Start**
1. Sign up → Skip to dashboard with sample data → Connect bank when ready

**Option C: Demo Mode**
1. "Try Demo" button → Explore with sample data → Sign up to save

---

## State Management

Decide on your state management approach:

**Global State:**
- Current user
- Current workspace
- Selected entity filter
- Auth status

**Server State:**
- Accounts, transactions, invoices (use react-query, SWR, or similar)

**Local State:**
- Form inputs
- UI toggles (sidebar, modals)

---

## Files to Create

1. **Design System**
   - CSS/theme configuration with Akount tokens
   - Tailwind config (if needed)
   - Font imports

2. **Types**
   - Core data model types (from `data-model/types.ts`)
   - API request/response types
   - Component prop types

3. **Shell**
   - Layout wrapper with AppShell
   - Navigation items configuration
   - Auth-protected route wrapper

4. **Routes**
   - Home page (/) - placeholder for Accounts Overview
   - Section placeholders for 6 other main sections
   - Auth pages (/login, /signup)
   - Settings page

5. **Auth**
   - Sign up flow
   - Login flow
   - Logout handler
   - Auth context/provider

6. **API Layer**
   - Client setup (fetch, axios, tRPC, etc.)
   - Error handling
   - Loading states

---

## Done Checklist

- [ ] Tailwind CSS v4 configured with Akount design tokens
- [ ] Google Fonts (Newsreader, Manrope, JetBrains Mono) loaded
- [ ] Dark mode support working
- [ ] Core data types defined
- [ ] Database schema created (at least User, Workspace, Entity, Account)
- [ ] Routing configured for all 7 sections
- [ ] AppShell integrated with navigation
- [ ] Auth flow implemented (sign up, login, logout)
- [ ] Auth-protected routes working
- [ ] Placeholder pages render for each section
- [ ] Entity filter state management working
- [ ] Can navigate between sections using sidebar
- [ ] Mobile responsive sidebar (hamburger menu)
- [ ] User menu displays current user and workspace

**Next Milestone:** Accounts Overview (implement the financial dashboard)
