# Categories Feature — Full Stack Implementation Plan

**Created:** 2026-02-10
**Status:** Draft

## Context

The Category Prisma model exists but has zero backend endpoints and zero frontend UI. The AI categorization service (`apps/api/src/domains/ai/services/categorization.service.ts`) has 137 keyword patterns mapping merchants to category names, but always returns `categoryId: null` because no categories exist in tenant databases. Onboarding doesn't seed defaults.

**Goal:** Full category management — default seeding, CRUD API, picker in transactions (bulk + filter), and a settings management page.

## Success Criteria
- [ ] New tenants get 16 default categories (12 expense, 3 income, 1 transfer)
- [ ] CRUD API at `/api/banking/categories` with tenant isolation + RBAC
- [ ] Category picker in bulk action bar (assign category to selected transactions)
- [ ] Category filter in transactions filter panel
- [ ] Category management page at `/settings/categories`
- [ ] AI categorization returns real `categoryId` values for matching categories

---

## Tasks

### Task 1: Default category data + seed service
**Files:**
- CREATE `apps/api/src/domains/banking/data/default-categories.ts`
- CREATE `apps/api/src/domains/banking/services/category-seed.service.ts`
**What:** Define 17 default categories with names, types, and colors matching the AI keyword patterns. Seeding service is idempotent (skips if categories already exist for tenant). Categories:
- EXPENSE (12): Meals & Entertainment, Transportation, Office Supplies, Software & Subscriptions, Utilities, Rent, Professional Services, Marketing & Advertising, Insurance, Bank Fees, Payroll, Taxes
- INCOME (3): Sales Revenue, Interest Income, Investment Income, Job Income
- TRANSFER (1): Transfer

Colors: semantic (green for income, red/orange for expense types, blue for transfer).
**Depends on:** none
**Success:** `seedDefaultCategories(tenantId)` creates 17 categories, calling it again is a no-op

### Task 2: Hook seeding into onboarding
**Files:**
- MODIFY `apps/api/src/domains/system/routes/onboarding.ts`
**What:** After tenant+entity creation in the onboarding flow, call `seedDefaultCategories(tenantId)`.
**Depends on:** Task 1
**Success:** New tenant sign-up flow creates 17 categories automatically

### Task 3: Category schema + service (CRUD)
**Files:**
- CREATE `apps/api/src/domains/banking/schemas/category.schema.ts`
- CREATE `apps/api/src/domains/banking/services/category.service.ts`
**What:** Zod schemas for list (optional `type` filter), create (`name`, `type`, `color?`, `parentCategoryId?`), update (partial), delete (id param). Service class with `listCategories`, `getCategory`, `createCategory`, `updateCategory`, `softDeleteCategory`. All tenant-isolated. Audit logging on mutations.
**Depends on:** none
**Risk:** high (tenant isolation, soft delete checks)
**Success:** Service CRUD works with tenant isolation enforced

### Task 4: Category routes + register
**Files:**
- CREATE `apps/api/src/domains/banking/routes/categories.ts`
- MODIFY `apps/api/src/domains/banking/routes.ts` (add register line)
**What:** 5 endpoints:
- `GET /` — list all (optional `?type=EXPENSE`)
- `GET /:id` — single category
- `POST /` — create (OWNER, ADMIN, ACCOUNTANT)
- `PATCH /:id` — update (OWNER, ADMIN, ACCOUNTANT)
- `DELETE /:id` — soft delete (OWNER, ADMIN only)

Register as `categoryRoutes` with prefix `/categories` in banking routes.
**Depends on:** Task 3
**Success:** All 5 endpoints respond correctly, RBAC enforced

### Task 5: Frontend API client + server actions
**Files:**
- CREATE `apps/web/src/lib/api/categories.ts`
- MODIFY `apps/web/src/app/(dashboard)/banking/transactions/actions.ts`
**What:** Types + API functions: `listCategories`, `createCategory`, `updateCategory`, `deleteCategory`. Server actions: `fetchCategories`, `bulkCategorizeAction` (already exists, just ensure it works).
**Depends on:** Task 4
**Success:** `listCategories()` returns categories from API

### Task 6: CategoryPicker component
**Files:**
- CREATE `apps/web/src/components/categories/CategoryPicker.tsx`
**What:** Reusable dropdown with categories grouped by type (INCOME/EXPENSE/TRANSFER sections). Shows color dot + name. Has "Uncategorized" option. Accepts `value`, `onChange`, `categories` props. Financial Clarity styled (glass-2 select, amber focus ring).
**Depends on:** Task 5
**Success:** Renders dropdown with grouped categories, fires onChange

### Task 7: Wire category picker into bulk actions
**Files:**
- MODIFY `apps/web/src/components/transactions/BulkActionBar.tsx`
- MODIFY `apps/web/src/components/transactions/TransactionsListClient.tsx`
**What:** Add "Categorize" button to BulkActionBar that opens CategoryPicker inline. On selection, call `bulkCategorizeAction(ids, categoryId)`. Update local transaction state optimistically. Keep existing "Uncategorize" as separate quick action.
**Depends on:** Task 6
**Success:** Select transactions → click Categorize → pick category → transactions update

### Task 8: Category filter in transactions
**Files:**
- MODIFY `apps/web/src/components/transactions/TransactionsFilters.tsx`
- MODIFY `apps/web/src/components/transactions/TransactionsList.tsx` (server component — fetch categories)
- MODIFY `apps/web/src/components/transactions/TransactionsListClient.tsx` (pass categories prop)
- MODIFY `apps/web/src/app/(dashboard)/banking/transactions/page.tsx` (add categoryId to searchParams)
**What:** Add category dropdown as 4th filter (before Apply button). Filter state flows through URL params → server component → API call. Backend already supports `categoryId` query param.
**Depends on:** Task 6
**Success:** Select category filter → transactions list updates to show only that category

### Task 9: Category management page
**Files:**
- CREATE `apps/web/src/app/(dashboard)/settings/categories/page.tsx`
- CREATE `apps/web/src/components/categories/CategoryManagement.tsx`
**What:** Server component fetches categories, passes to client component. Client component shows categories in 3 sections (Income/Expense/Transfer). Each row: color dot, name, transaction count badge, edit/delete buttons. Add Category button opens inline form (name, type select, color picker with ~12 preset colors). Edit inline. Delete with confirmation (soft delete). Financial Clarity styling.
**Depends on:** Task 5
**Success:** Full CRUD from the management page works

### Task 10: Add nav link + TypeScript check + commit
**Files:**
- MODIFY sidebar/nav component (add "Categories" under Settings or Banking)
**What:** Add navigation link to category management page. Run full TypeScript check. Commit.
**Depends on:** Task 9
**Success:** TypeScript clean, navigation works, all features functional

---

## Reference Files
- `packages/db/prisma/schema.prisma` — Category model (line 545), CategoryType enum (line 957)
- `apps/api/src/domains/ai/services/categorization.service.ts` — Keyword patterns (line 23-137), batch categorize (line 262)
- `apps/api/src/domains/banking/routes/import.ts` — Import calls categorize (line 317)
- `apps/api/src/domains/banking/services/account.service.ts` — Service class pattern to follow
- `apps/api/src/domains/banking/routes/transactions.ts` — Route pattern to follow
- `apps/api/src/domains/banking/routes.ts` — Where to register new routes
- `apps/web/src/components/transactions/TransactionsTable.tsx` — Current category badge display
- `apps/web/src/components/transactions/BulkActionBar.tsx` — Where to add category picker
- `apps/web/src/components/transactions/TransactionsFilters.tsx` — Where to add category filter
- `apps/api/src/domains/system/routes/onboarding.ts` — Where to hook seeding

## Edge Cases
- **Duplicate names:** Prevent same name+type combo per tenant (unique constraint in service)
- **Delete with transactions:** Soft delete only; warn user about transaction count
- **Parent-child:** Keep flat for now (parentCategoryId supported but not surfaced in UI yet)
- **Empty tenant:** Seed on first load if no categories exist (fallback for pre-existing tenants)

## Verification
1. Create new tenant → verify 16 categories appear
2. `GET /api/banking/categories` returns grouped list
3. Create custom category → appears in picker
4. Bulk select transactions → categorize → verify update
5. Filter by category → only matching transactions shown
6. Management page: create, edit, delete all work
7. TypeScript compiles clean (`npx tsc --noEmit` for both apps/api and apps/web)

## Progress
- [ ] Task 1: Default category data + seed service
- [ ] Task 2: Hook seeding into onboarding
- [ ] Task 3: Category schema + service (CRUD)
- [ ] Task 4: Category routes + register
- [ ] Task 5: Frontend API client + server actions
- [ ] Task 6: CategoryPicker component
- [ ] Task 7: Wire category picker into bulk actions
- [ ] Task 8: Category filter in transactions
- [ ] Task 9: Category management page
- [ ] Task 10: Nav link + TypeScript check + commit
