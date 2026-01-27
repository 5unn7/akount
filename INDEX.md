# Akount Export Package - File Index

Quick reference guide to all files in this export package.

---

## 📖 Start Here

| File | Purpose |
|------|---------|
| `README.md` | How to use this package, approaches, tips |
| `product-overview.md` | Product description, sections, data model, implementation sequence |
| `EXPORT-SUMMARY.md` | What's included, what's complete, what's missing, next steps |

---

## 🎨 Design System

| File | Purpose |
|------|---------|
| `design-system/tokens.css` | CSS custom properties for colors and typography |
| `design-system/tailwind-colors.md` | Tailwind CSS v4 usage examples |
| `design-system/fonts.md` | Google Fonts import code and usage |

---

## 💾 Data Model

| File | Purpose |
|------|---------|
| `data-model/types.ts` | TypeScript definitions for all 50+ entities |
| `data-model/README.md` | Entity descriptions and relationships |
| `data-model/sample-data.json` | Placeholder (section-specific data in sections/) |

---

## 🏗️ Application Shell

| File | Purpose |
|------|---------|
| `shell/README.md` | Shell specification and usage examples |
| `shell/components/AppShell.tsx` | Main wrapper with sidebar and responsive behavior |
| `shell/components/MainNav.tsx` | Sidebar navigation with workspace/entity controls |
| `shell/components/UserMenu.tsx` | User menu at bottom of sidebar |
| `shell/components/useSpotlight.ts` | Spotlight hover effect hook |
| `shell/components/types.ts` | TypeScript interfaces for shell |
| `shell/components/index.ts` | Barrel export file |

---

## 🧩 Sections (All 7)

### Accounts Overview
| File | Purpose |
|------|---------|
| `sections/accounts-overview/README.md` | Spec, features, components, design notes |
| `sections/accounts-overview/types.ts` | TypeScript interfaces |
| `sections/accounts-overview/sample-data.json` | Example data structure |
| `sections/accounts-overview/tests.md` | Comprehensive test specifications |

### Bank Reconciliation
| File | Purpose |
|------|---------|
| `sections/bank-reconciliation/README.md` | Spec and features |
| `sections/bank-reconciliation/types.ts` | TypeScript interfaces |
| `sections/bank-reconciliation/sample-data.json` | Example data structure |

### Transactions & Bookkeeping
| File | Purpose |
|------|---------|
| `sections/transactions-bookkeeping/README.md` | Spec and features |
| `sections/transactions-bookkeeping/types.ts` | TypeScript interfaces |
| `sections/transactions-bookkeeping/sample-data.json` | Example data structure |

### Invoicing & Bills
| File | Purpose |
|------|---------|
| `sections/invoicing-bills/README.md` | Spec and features |
| `sections/invoicing-bills/types.ts` | TypeScript interfaces |
| `sections/invoicing-bills/sample-data.json` | Example data structure |

### Analytics
| File | Purpose |
|------|---------|
| `sections/analytics/README.md` | Spec and features |
| `sections/analytics/types.ts` | TypeScript interfaces |
| `sections/analytics/sample-data.json` | Example data structure |

### Planning
| File | Purpose |
|------|---------|
| `sections/planning/README.md` | Spec and features |
| `sections/planning/types.ts` | TypeScript interfaces |
| `sections/planning/sample-data.json` | Example data structure |

### AI Financial Advisor
| File | Purpose |
|------|---------|
| `sections/ai-financial-advisor/README.md` | Spec and features |
| `sections/ai-financial-advisor/types.ts` | TypeScript interfaces |
| `sections/ai-financial-advisor/sample-data.json` | Example data structure |

### Section Notes
| File | Purpose |
|------|---------|
| `sections/COMPONENTS-NOTE.md` | Explains why components aren't included and alternatives |

---

## 📖 Implementation Instructions

### Incremental (Milestone-by-Milestone)
| File | Purpose |
|------|---------|
| `instructions/incremental/01-foundation.md` | Auth, routing, design system, shell setup |
| `instructions/incremental/02-accounts-overview.md` | Financial dashboard implementation |
| `instructions/incremental/03-bank-reconciliation.md` | Transaction matching and reconciliation |
| `instructions/incremental/04-transactions-bookkeeping.md` | Transaction list, categorization, GL |
| `instructions/incremental/05-invoicing-bills.md` | AR/AP management |
| `instructions/incremental/06-analytics.md` | Financial reporting dashboards |
| `instructions/incremental/07-planning.md` | Budgets and goals |
| `instructions/incremental/08-ai-financial-advisor.md` | AI insights and recommendations |

---

## 🚀 Ready-to-Use Prompts

| File | Purpose |
|------|---------|
| `prompts/one-shot-prompt.md` | Complete prompt for full implementation in one session |
| `prompts/section-prompt.md` | Template for section-by-section implementation |

---

## 📊 File Statistics

- **Total Files:** 49
- **Documentation (MD):** 27 files
- **Code (TS/TSX):** 10 files
- **Data (JSON):** 8 files
- **Styles (CSS):** 1 file
- **Completion:** ~90% (missing 6 test files for remaining sections)

---

## 🎯 Quick Start Paths

### Path 1: AI Agent One-Shot Build
1. Read `prompts/one-shot-prompt.md`
2. Provide tech stack answers
3. Let AI generate all 8 milestones

### Path 2: Human Developer Incremental
1. Read `README.md`
2. Start with `instructions/incremental/01-foundation.md`
3. Complete each milestone before moving to next

### Path 3: Section-by-Section with AI
1. Complete foundation first
2. Use `prompts/section-prompt.md` template
3. Implement one section at a time

---

## 🔍 Finding What You Need

**Looking for...** | **Go to...**
--- | ---
Product overview | `product-overview.md`
Design tokens | `design-system/tokens.css`
Color usage | `design-system/tailwind-colors.md`
Font setup | `design-system/fonts.md`
Data types | `data-model/types.ts`
Shell components | `shell/components/`
Section spec | `sections/[section-id]/README.md`
Section types | `sections/[section-id]/types.ts`
Sample data | `sections/[section-id]/sample-data.json`
Test examples | `sections/accounts-overview/tests.md`
Step-by-step guide | `instructions/incremental/`
AI prompts | `prompts/`
Usage instructions | `README.md`
What's included/missing | `EXPORT-SUMMARY.md`

---

## 📝 Notes

- Section component files (.tsx) not included - see `sections/COMPONENTS-NOTE.md` for alternatives
- Test specifications only included for accounts-overview - pattern established for others
- All shell components fully implemented and transformed
- All types and sample data included for every section
- Instructions complete for all 8 milestones

---

**Ready to build? Start with `README.md` or `prompts/one-shot-prompt.md`!**
