# Simplicity Review: Entity Management Hub

> **Auditor:** code-simplicity-reviewer
> **Date:** 2026-02-20
> **Scope:** 30-task plan vs what's actually needed for solopreneurs with 1-3 entities
> **Risk Level:** OVER-ENGINEERED

---

## Simplicity Assessment

| Metric | Value |
|--------|-------|
| Plan tasks | 30 |
| Essential tasks | 12 |
| Deferrable tasks | 18 |
| New files proposed | ~25 |
| New files needed | ~10 |
| New Prisma models proposed | 1 (EntityRelationship) |
| New Prisma models needed | 0 |
| New schema fields proposed | 3 (status, entitySubType, registrationDate) |
| New schema fields needed | 1 (status -- and only if pre-registration is kept) |
| New packages proposed | 1 (packages/data/jurisdictions/) |
| New packages needed | 0 |
| Estimated lines added (full plan) | ~3,500-4,500 |
| Estimated lines added (lean V1) | ~1,200-1,600 |

---

## The Core Question

**Who is the user?** A globally-operating solopreneur. They have 1-3 entities. Typically one personal entity and one or two business entities. They are not running a corporate holding structure with parent-subsidiary chains and ownership percentages.

**What problem does this plan solve?** Currently, entities are managed inline on the dashboard (a collapsible card grid) and created via a slide-out sheet from the navbar. The plan proposes moving entity management to a dedicated tab under Overview, adding a detail/edit page, and building an adaptive creation wizard with 3 paths, jurisdiction-specific entity types, a decision tree, and AI recommendations.

**What problem actually needs solving?** There is no entity detail page (the `system/entities` page is a "Coming Soon" stub). Users cannot edit entity details after creation. There is no way to archive an entity. The entity list on the dashboard has placeholder data (account counts show dashes). These are real gaps.

**What does NOT need solving right now?** Inter-entity ownership relationships. Decision tree wizards. AI entity type recommendations. Jurisdiction-specific entity sub-types. Pre-registration entities. Tax ID format validation per jurisdiction. Six JSON data files for jurisdiction configurations.

---

## Feature-by-Feature YAGNI Analysis

### 1. Jurisdiction Data Files (Task 1)

**Plan:** Create a new `packages/data/jurisdictions/` directory with 6 JSON files (US, CA, UK, EU, IN, AU), each containing entity types, tax ID regex, fiscal year defaults, advisory decision tree questions, and formation resource links. Plus a TypeScript index with `getJurisdictionConfig()`.

**Existing code:** `apps/web/src/lib/data/countries.ts` (195 countries, ~200 lines) already provides country-to-currency mapping. Entity types are already a Prisma enum (`PERSONAL`, `CORPORATION`, `LLC`, `PARTNERSHIP`, `SOLE_PROPRIETORSHIP`) defined in `packages/db/prisma/schema.prisma` line 1056 and mirrored in `apps/web/src/components/dashboard/EntityFormSheet.tsx` line 27.

**Verdict:** DEFER

**Why:** This entire package exists to power the guided wizard (Task 22) and recommendation engine (Task 23). Without those features, it serves no purpose. The existing entity types in the Prisma enum cover all common solopreneur structures worldwide. Adding jurisdiction-specific sub-types like "S_CORP" or "FEDERAL_CORP" creates a data maintenance burden with zero user value today. A solopreneur in Canada already knows they are a sole proprietor -- they do not need a decision tree to tell them that.

**Cost to add later:** LOW. JSON data files are purely additive. No migration, no schema change, no API impact. Can be created in a single session whenever the guided wizard is actually built.

---

### 2. EntityRelationship Prisma Model (Task 2 -- partial)

**Plan:** Create a new `EntityRelationship` model with `sourceEntityId`, `targetEntityId`, `relationshipType`, `ownershipPercent`, `externalName`, `externalDetails`, plus circular ownership detection and ownership percentage validation.

**Existing code:** Nothing. Zero references to "EntityRelationship" or "ownership" anywhere in the codebase outside plan/brainstorm docs.

**Verdict:** DEFER

**Why:** This is the textbook YAGNI violation. The target user is a solopreneur with 1-3 entities. They are not modeling corporate ownership graphs. The plan acknowledges "graph visualization is future" (Task 17 description), which means even the plan itself treats the visual outcome as a future feature. The underlying model is pure speculative infrastructure.

Consider the math: if a user has 2 entities, they have at most 1 possible relationship. If they have 3, they have at most 3. A solopreneur who needs to track that "Entity A owns 100% of Entity B" can put that in a text note or entity description field. Building an entire model with circular ownership detection, ownership percentage validation (sum to 100%), and CRUD API for a list that will typically contain 0-1 items is over-engineering.

**Cost to add later:** MEDIUM. Requires a Prisma migration and new service/routes. But this is exactly the kind of thing that should wait until at least 3 users have asked for it.

---

### 3. EntityStatus enum and pre-registration flow (Tasks 2, 24)

**Plan:** Add `EntityStatus` enum (`ACTIVE`, `PRE_REGISTRATION`, `ARCHIVED`), a `status` field on Entity, a dedicated pre-registration creation path, and an upgrade endpoint to transition from `PRE_REGISTRATION` to `ACTIVE`.

**Existing code:** No status field on Entity at all. The Entity model in `packages/db/prisma/schema.prisma` lines 62-109 has no status concept.

**Verdict:** SIMPLIFY

**Split this into two separate concerns:**

1. **ARCHIVED status -- KEEP.** Being able to mark an entity as archived is genuinely useful. A solopreneur who shuts down one business and starts another needs to hide the old entity from the navbar switcher without deleting it (soft-delete principle). This requires adding a `status` field with values `ACTIVE` and `ARCHIVED`, plus an `archiveEntity()` method and filtering in the navbar.

2. **PRE_REGISTRATION status -- DEFER.** The plan says pre-registration entities are for users who "haven't officially registered yet." But the product already creates entities during onboarding -- every user who completes onboarding has a real entity. Building a separate creation path, a special status, an upgrade endpoint, and UI for "informal" entities that get excluded from formal reports is a lot of machinery for a scenario that does not exist in the current user flow.

**Cost to add later:** LOW. Adding a third enum value and an upgrade endpoint is trivial. The UI for pre-registration creation is the costly part, but it is self-contained.

---

### 4. entitySubType field (Task 2)

**Plan:** Add `entitySubType String?` to Entity for jurisdiction-specific sub-types like "S_CORP", "FEDERAL_CORP".

**Existing code:** Entity already has a `type` field with the `EntityType` enum covering all common structures.

**Verdict:** DEFER

**Why:** No user-facing feature currently consumes this field. The only consumer would be the guided wizard's recommendation engine, which is itself deferred. The existing `EntityType` enum (`CORPORATION`, `LLC`, `PARTNERSHIP`, `SOLE_PROPRIETORSHIP`, `PERSONAL`) covers the structures that matter for accounting treatment. The distinction between "S-Corp" and "C-Corp" is a tax classification, not an accounting structure. If it becomes needed, a simple nullable string field can be added in 5 minutes.

**Cost to add later:** LOW. Single nullable field, no migration risk.

---

### 5. Tax ID Validation Utility (Task 6)

**Plan:** Create `apps/api/src/lib/validators/tax-id.ts` with regex validation for US EIN, CA BN, UK UTR, IN PAN/GSTIN, AU ABN/ACN. Auto-format with dashes and spaces.

**Existing code:** The entity creation form (`EntityFormSheet.tsx` line 249) has a plain text input for Tax ID with no validation. The API (`routes.ts` line 165) validates only `z.string().max(50)`.

**Verdict:** SIMPLIFY

**Simpler alternative:** Add a basic `z.string().regex()` pattern per country inline in the Zod schema, or better yet, just validate on the frontend with a format hint. The plan proposes a standalone utility file with formatting logic, but the user can type their own dashes. A solopreneur knows their EIN format. Blocking submission on regex failure for tax IDs that may have unusual formats (trusts, fiscal representatives, etc.) creates more frustration than value.

If we do anything, add a frontend-only format hint ("Expected: XX-XXXXXXX") next to the Tax ID field based on the selected country. No backend validation beyond "string, max 50 chars" is needed for V1.

**Cost to add later:** LOW. Pure utility function, no schema impact.

---

### 6. Adaptive Creation Wizard with 3 Paths (Tasks 18-25)

**Plan:** Build an 8-file wizard system: `useEntityWizard.ts` state machine hook, `EntityCreationWizard.tsx` shell, `SituationStep.tsx`, `FastPathStep.tsx`, `GuidedQuestionsStep.tsx`, `RecommendationStep.tsx`, `PreRegistrationStep.tsx`, `ReviewStep.tsx`. Three distinct paths (fast, guided, pre-registration) with step navigation, decision tree rendering, entity type recommendations, and a review/confirm step.

**Existing code:** `EntityFormSheet.tsx` (338 lines) is a working entity creation form. It collects name, type, country, currency, fiscal year, tax ID, and address. It submits to the existing API. It resets on close. It shows errors. It works.

**Verdict:** DEFER the wizard. ENHANCE the existing form.

**Why:** The existing `EntityFormSheet.tsx` already does everything a solopreneur needs to create an entity. The form is well-structured (required fields first, optional business details below a divider), handles country-to-currency auto-setting, and covers all fields the API accepts. The 8-file wizard with a state machine, 3 branching paths, and a decision tree is solving a problem that does not exist: solopreneurs do not need a wizard to tell them what entity type they are.

**Consider the usage frequency:** A user creates an entity maybe 1-3 times in the lifetime of their account. Building an 8-component wizard for an action that happens 1-3 times is a poor investment.

**Simpler alternative:** Keep `EntityFormSheet.tsx` as-is. Add the `status` field (ACTIVE default). Optionally add a country-specific type filter to the entity type dropdown (filter entity types by country, which is 5 lines of code in the existing form, not a new wizard).

**Cost to add later:** MEDIUM. The wizard is a standalone UI concern. It can be built later without changing the API or schema. The `EntityFormSheet` trigger in the navbar (`Navbar.tsx` line 80) can be swapped to point at a wizard at any time.

---

### 7. Entity Hub Page under Overview (Tasks 9-12)

**Plan:** Add an "Entities" tab to the Overview layout, create a new server component page at `/overview/entities`, build an `EntityHubClient` with filter pills (All/Active/Pre-Registration/Archived) and a responsive grid, and create an `EntityCard` component.

**Existing code:**
- `apps/web/src/app/(dashboard)/overview/layout.tsx` (20 lines) -- tab bar with Dashboard, Cash Flow, Net Worth
- `apps/web/src/components/dashboard/EntitiesSection.tsx` (49 lines) -- collapsible section on dashboard
- `apps/web/src/components/dashboard/EntitiesList.tsx` (108 lines) -- entity card grid with type colors, country, currency, "Add Entity" card
- `apps/web/src/app/(dashboard)/system/entities/page.tsx` (36 lines) -- "Coming Soon" stub page

**Verdict:** SIMPLIFY

**Simpler alternative:** Instead of creating a new `/overview/entities` route AND keeping `system/entities`, upgrade the existing `system/entities` stub page to a real entities list. The `EntitiesList.tsx` component (108 lines) already renders entity cards with type-colored borders, country flags, currency badges, and an "Add Entity" card. Move that component (or adapt it) to `system/entities/page.tsx`. Add a one-line entry to the Overview tabs if desired, but the entities already have a sidebar entry under System.

The plan proposes filter pills (All/Active/Pre-Registration/Archived), but if we defer pre-registration, the only useful filter is Active vs Archived, which can be a simple toggle switch rather than 4 pills.

The `EntityCard` component proposed in Task 12 is largely a re-implementation of the card already in `EntitiesList.tsx` (lines 49-98) with the same data: name, type badge, country, currency, actions. Rather than building a new component, enhance the existing one with edit/archive actions and actual account counts (replacing the placeholder dashes on line 88).

**Cost to add later:** LOW. Adding a tab to `layout.tsx` is one line. Creating a dedicated page route is a single file.

---

### 8. Entity Detail Page (Tasks 14-17)

**Plan:** Create `/overview/entities/[id]` with a detail page containing 3 tabs (Overview, Settings, Relationships), an edit form for entity settings, and a relationships panel with CRUD.

**Existing code:** `EntityService.getEntity()` in `entity.service.ts` line 36 already returns entity with `_count` for accounts, glAccounts, clients, vendors. But there is no frontend page consuming this data.

**Verdict:** SIMPLIFY

**What is actually needed:** A single entity detail/edit page. Not 3 tabs, not a relationships panel. The user needs to:
1. See their entity details (name, type, country, currency, fiscal year, tax ID, address)
2. Edit those details
3. See counts of related records (accounts, clients, vendors)
4. Archive the entity

This is one page, one form. The "Overview tab" with metrics cards is redundant -- the dashboard already shows metrics. The "Relationships tab" powers the deferred EntityRelationship feature. The "Settings tab" is the only part with real utility, so just make the detail page BE the settings/edit page.

**Simpler alternative:** Create `system/entities/[id]/page.tsx` with a simple edit form. Reuse the field layout from `EntityFormSheet.tsx` (it already has all the form fields). Add an "Archive" button. Show `_count` stats at the top. One file, one component, no tabs.

**Cost to add later:** LOW. Adding tabs to an existing page is trivial when new tab content exists.

---

### 9. EntityRelationship Service and Routes (Tasks 5, 7 partial, 17)

**Plan:** Create `entity-relationship.service.ts` (new file) with CRUD, circular ownership detection, ownership percentage validation. Create 4 new API routes for relationship management. Create `EntityRelationshipsPanel.tsx` with create/delete UI and internal/external partner toggle.

**Existing code:** Nothing. Zero references to entity relationships in the entire codebase.

**Verdict:** DEFER

**Why:** Covered in the EntityRelationship model analysis above. This is 3 files (service, routes, UI component) plus tests supporting a model that has zero demand from the target user. The entire circular ownership detection algorithm is solving a problem that requires a minimum of 3 entities in a loop -- a scenario that will not occur for solopreneurs.

**Cost to add later:** MEDIUM. Self-contained feature that touches no existing code.

---

### 10. AI Advisor Integration (Tasks 29-30)

**Plan:** Create a new `POST /api/ai/entity-recommendation` endpoint with rate limiting, wire it to the wizard's recommendation step, show AI responses in a purple card with Newsreader italic.

**Existing code:** `apps/api/src/domains/ai/` has chat and categorization endpoints. No entity recommendation logic.

**Verdict:** DEFER

**Why:** This depends entirely on the guided wizard (Task 22) and recommendation step (Task 23), both of which are deferred. The AI advisor for entity type selection is the most speculative feature in the plan. A solopreneur choosing between LLC and sole proprietorship should consult an actual accountant, not an AI chatbot. The liability implications of an AI recommending entity types are significant. The plan even acknowledges the need for a "fallback if AI unavailable" -- meaning the feature is optional by design.

**Cost to add later:** LOW. A single API endpoint and one UI integration point.

---

### 11. Dashboard Cleanup (Task 26)

**Plan:** Remove `EntitiesSection` from the main dashboard page once the Entities tab exists.

**Existing code:** `EntitiesSection` is rendered in `overview/page.tsx` line 206 as part of the dashboard layout.

**Verdict:** KEEP (but only after the entities page is live)

**Why:** This is a valid cleanup task. The dashboard currently shows entities in a collapsible section. Once a proper entities page exists (even a simple one), the dashboard should link to it rather than inline the list. But this should happen AFTER the entities page is built, not as a separate sprint.

**Cost to add later:** LOW. Remove one import and one JSX line.

---

### 12. Update EntityFormSheet to Use Wizard (Task 27)

**Plan:** Replace the EntityFormSheet internals with the new wizard or redirect to `/overview/entities?action=create`.

**Existing code:** `EntityFormSheet.tsx` (338 lines) is used in two places: `EntitiesList.tsx` line 38 and line 104 (empty state and "Add" card), and `Navbar.tsx` line 80 (entity selector dropdown).

**Verdict:** DEFER (since the wizard is deferred)

**Why:** Without the wizard, there is nothing to replace the form with. The existing form works. When the wizard is eventually built, swapping the trigger is a one-line change.

**Cost to add later:** LOW. Change one import.

---

### 13. Navbar Status Badges (Task 28)

**Plan:** Show amber dot for pre-registration entities, hide archived entities from the navbar switcher.

**Existing code:** `Navbar.tsx` entity selector (lines 33-87) displays all entities with a green dot. No status filtering.

**Verdict:** SIMPLIFY

**What is actually needed:** Filter out archived entities from the navbar. That is one line: `entities.filter(e => e.status !== 'ARCHIVED')`. The amber dot for pre-registration entities is deferred along with the pre-registration feature.

**Cost to add later:** LOW. One CSS class change.

---

### 14. Entity Service Expansion (Task 4)

**Plan:** Expand `EntityService` with `listEntities()` (add status, _count), `getEntityDetail()`, `updateEntity()` (expand fields), `archiveEntity()`, `upgradeEntity()`.

**Existing code:** `entity.service.ts` (119 lines) has `listEntities()`, `getEntity()` (with _count), `createEntity()`, `updateEntity()` (name and fiscalYearStart only).

**Verdict:** SIMPLIFY

**What is actually needed:**
1. Expand `updateEntity()` to accept more fields (taxId, address, city, state, postalCode). The existing method on line 95 only accepts `name` and `fiscalYearStart`. This is a real gap since `EntityFormSheet` sends these fields on creation but there is no way to update them.
2. Add `archiveEntity()` -- set `status = 'ARCHIVED'` with validation that no active accounts exist.
3. Expand `listEntities()` to include `country` and `_count` (the existing implementation on line 14 selects country but the route response on `routes.ts` line 92 strips it out).

**What is NOT needed:**
- `upgradeEntity()` -- deferred with pre-registration
- `entitySubType` in any response
- `registrationDate` in any response

**Cost to add later:** LOW for individual methods. They are independent additions.

---

### 15. Entity Routes Expansion (Task 7)

**Plan:** Add/modify 10 endpoints including PATCH entity, archive, upgrade, and 4 relationship endpoints.

**Existing code:** `routes.ts` has GET list, GET detail, POST create. `routes/entity.ts` has PATCH business-details (an onboarding-specific route).

**Verdict:** SIMPLIFY

**What is actually needed:**
1. `PATCH /api/system/entities/:id` -- general update (expand the existing `updateEntity` service method)
2. `POST /api/system/entities/:id/archive` -- archive entity
3. Expand `GET /api/system/entities` response to include `country`, `_count`, `status`

That is 2 new routes and 1 modification, not 7 new routes plus 3 modifications.

**Cost to add later:** LOW. Routes are independent.

---

### 16. Backend Tests (Task 8)

**Plan:** Expand entity service tests, create relationship service tests, create tax ID validator tests.

**Existing code:** `apps/api/src/domains/system/routes/__tests__/entity.test.ts` exists (referenced in earlier grep).

**Verdict:** SIMPLIFY

**What is actually needed:** Tests for archive validation, expanded update, and status filtering. Skip relationship tests (no relationship feature) and tax ID validator tests (no validator).

**Cost to add later:** LOW. Tests follow their features.

---

## Recommended Lean V1

### Sprint 1: Schema + Backend (3-4 tasks)

**Task A: Add `status` field to Entity model**
- File: `packages/db/prisma/schema.prisma`
- Add `EntityStatus` enum with `ACTIVE` and `ARCHIVED` (not `PRE_REGISTRATION` -- defer)
- Add `status EntityStatus @default(ACTIVE)` to Entity model
- Run migration. Safe: adds column with default value.
- ~10 lines changed

**Task B: Expand EntityService**
- File: `apps/api/src/domains/system/services/entity.service.ts` (currently 119 lines)
- Expand `updateEntity()` to accept `taxId`, `address`, `city`, `state`, `postalCode` (currently only `name` and `fiscalYearStart`)
- Add `archiveEntity(id)` -- set status to ARCHIVED, validate no active accounts
- Expand `listEntities()` select to include `status` and `_count` (accounts, clients, vendors)
- Expand `getEntity()` to also select `status`, `address`, `city`, `state`, `postalCode`, `taxId`
- ~40 lines added to existing file

**Task C: Expand Entity API routes**
- File: `apps/api/src/domains/system/routes.ts`
- Add `PATCH /api/system/entities/:id` (general update, calls expanded `updateEntity`)
- Add `POST /api/system/entities/:id/archive` (calls `archiveEntity`)
- Expand `GET /api/system/entities` response to include `country`, `status`, `_count`
- Add Zod schema for PATCH body
- ~60 lines added to existing file

**Task D: Backend tests**
- File: `apps/api/src/domains/system/routes/__tests__/entity.test.ts` (expand)
- Test archive validation (reject if active accounts)
- Test expanded update (taxId, address fields)
- Test status filtering in list
- Test tenant isolation on archive
- ~80 lines added

### Sprint 2: Frontend Entity Page (3-4 tasks)

**Task E: Build real entity list page at `system/entities`**
- File: `apps/web/src/app/(dashboard)/system/entities/page.tsx` (replace 36-line stub)
- Server component: fetch entities via expanded API (with status, _count, country)
- Render an `EntityListClient` component
- loading.tsx and error.tsx already exist at this path
- ~30 lines

**Task F: Entity list client component**
- File: `apps/web/src/app/(dashboard)/system/entities/entity-list-client.tsx` (new)
- Adapt existing `EntitiesList.tsx` (108 lines) pattern: entity cards with type colors, country, currency
- Add: actual `_count` values instead of placeholder dashes
- Add: status badge (Active = green, Archived = muted)
- Add: toggle to show/hide archived entities
- Add: "Edit" and "Archive" action buttons per card
- Add: "Add Entity" button triggering existing `EntityFormSheet`
- ~150 lines

**Task G: Entity detail/edit page**
- File: `apps/web/src/app/(dashboard)/system/entities/[id]/page.tsx` (new)
- File: `apps/web/src/app/(dashboard)/system/entities/[id]/loading.tsx` (new)
- File: `apps/web/src/app/(dashboard)/system/entities/[id]/error.tsx` (new)
- Server component fetching entity detail
- ~30 lines for page, ~20 each for loading/error

**Task H: Entity detail client component**
- File: `apps/web/src/app/(dashboard)/system/entities/[id]/entity-detail-client.tsx` (new)
- Show entity info header (name, type badge, status badge, country flag, currency)
- Edit form reusing field layout from `EntityFormSheet.tsx` (same fields: name, fiscal year, tax ID, address block)
- "Archive" button with confirmation dialog
- Stats row showing _count values (X accounts, X clients, X vendors)
- Back link to entity list
- ~180 lines

### Sprint 3: Integration + Cleanup (2-3 tasks)

**Task I: Expand frontend API client**
- File: `apps/web/src/lib/api/entities.ts` (currently 48 lines)
- Expand `Entity` interface: add `status`, `country` (required), `_count`
- Add `getEntityDetail(id)` function
- Add `updateEntity(id, data)` function
- Add `archiveEntity(id)` function
- ~40 lines added

**Task J: Filter archived entities from Navbar**
- File: `apps/web/src/components/layout/Navbar.tsx`
- Filter: `entities.filter(e => e.status !== 'ARCHIVED')` in EntitySelector
- 1 line changed

**Task K: Optionally add Entities tab to Overview**
- File: `apps/web/src/app/(dashboard)/overview/layout.tsx`
- Add `{ label: 'Entities', href: '/system/entities' }` to tabs array
- 1 line changed
- OR: skip this entirely -- entities already have a sidebar entry under System

**Task L (optional): Remove entity section from dashboard**
- File: `apps/web/src/app/(dashboard)/overview/page.tsx`
- Remove `EntitiesSection` component and replace with a "Manage Entities" link card
- Only do this after Sprint 2 is verified working

---

## What to Defer to V2 (with triggers)

| Feature | Trigger to Build | Cost to Add Later |
|---------|-----------------|-------------------|
| Jurisdiction data files (6 JSON files) | User research shows entity type confusion | LOW |
| EntityRelationship model + service | 3+ users request ownership tracking | MEDIUM |
| Pre-registration entity status | Onboarding redesign requires it | LOW |
| entitySubType field | Jurisdiction data files are built | LOW |
| Adaptive creation wizard (8 files) | Entity creation UX tested and found lacking | MEDIUM |
| Guided decision tree | Jurisdiction data files built + wizard built | LOW (additive) |
| AI entity recommendation endpoint | Wizard recommendation step built + AI infra ready | LOW |
| Tax ID format validation | Users report entering wrong formats frequently | LOW |
| Relationship panel UI | EntityRelationship model built | LOW |
| Pre-registration upgrade flow | Pre-registration status added | LOW |

---

## Comparison Table

| Metric | Full Plan | Lean V1 |
|--------|-----------|---------|
| Tasks | 30 | 12 |
| Sprints | 7 | 3 |
| New files | ~25 | ~10 |
| New Prisma models | 1 | 0 |
| Schema fields added | 3 | 1 |
| New API endpoints | 10 | 2 |
| New packages | 1 (packages/data/) | 0 |
| Estimated LOC added | ~3,500-4,500 | ~1,200-1,600 |
| Estimated effort | 4-6 days | 1.5-2 days |
| Features shipped | Entity hub, detail, edit, archive, wizard (3 paths), relationships, tax ID validation, AI advisor | Entity list, detail, edit, archive |
| User problems solved | All of the above + speculative features | Edit entities after creation, archive entities, see entity metrics, proper entity management page |
| Maintenance surface | High (8 wizard files, relationship service, jurisdiction data, AI endpoint) | Low (enhances existing files, few new files) |

---

## Recommendations

### 1. Build Lean V1 (12 tasks, 3 sprints)

The four real gaps in entity management today are:
1. No way to edit entity details after creation
2. No way to archive an entity
3. The entity list on the dashboard shows placeholder dashes instead of real counts
4. The `system/entities` page is a "Coming Soon" stub

Lean V1 closes all four gaps. Everything else in the plan is speculative.

### 2. Do NOT Create the `packages/data/jurisdictions/` Package

This is a new package in the monorepo for data that powers features that do not exist yet. Every new package is a maintenance burden (build config, TypeScript config, Turborepo graph entry). The jurisdiction data can live in a single file in `apps/web/src/lib/data/` when needed, similar to how `countries.ts` works today.

### 3. Do NOT Create the EntityRelationship Model

This is the highest-risk item in the plan. It adds a Prisma model, a migration, a service, API routes, and a UI panel -- all for a feature that requires a minimum of 2 entities to be useful and has zero user demand signal. Adding a Prisma model is the one change that is genuinely costly to undo. Defer this until there is evidence that users need it.

### 4. Enhance EntityFormSheet Rather Than Replace It

The existing `EntityFormSheet.tsx` (338 lines) is a functional, tested, production entity creation form. It handles all required fields, optional fields, country-to-currency auto-setting, form reset, error display, and loading states. Replacing it with an 8-component wizard for a user action that occurs 1-3 times per account lifetime is poor ROI. If the form needs improvement, add a country-filtered entity type dropdown (5 lines) instead of building a wizard.

### 5. Keep Entities Under System, Not Overview

The plan moves entity management from `system/entities` (which already has a stub page, loading.tsx, and error.tsx) to `overview/entities` (which does not exist). This means creating 3 new page files when 3 already exist at the correct path. Entities are a system-level concept (settings, configuration), not a dashboard-level concept (metrics, analysis). The sidebar already has a System > Entities entry. Use the existing route.

### 6. Ship V1, Then Measure

After Lean V1 ships, track:
- How often do users create entities? (If <2 per account, the wizard is wasted effort)
- How often do users edit entities? (If rarely, the detail page can stay simple)
- Do users ask about entity type guidance? (If not, the decision tree is unnecessary)
- Do users mention entity relationships? (If not, the model is unnecessary)

Let usage data drive V2 scope rather than building from imagination.

---

## Files Inventory: Existing vs Proposed vs Recommended

| File | Status | Plan Action | Recommended Action |
|------|--------|-------------|-------------------|
| `apps/web/src/components/dashboard/EntityFormSheet.tsx` (338 lines) | Working | Replace with wizard | KEEP as-is |
| `apps/web/src/components/dashboard/EntitiesSection.tsx` (49 lines) | Working | Remove from dashboard | KEEP for now, remove after V1 |
| `apps/web/src/components/dashboard/EntitiesList.tsx` (108 lines) | Working | Replace with EntityCard | REUSE pattern in new list page |
| `apps/web/src/app/(dashboard)/system/entities/page.tsx` (36 lines) | Stub | Ignore (build at /overview/entities) | UPGRADE this stub to real page |
| `apps/web/src/app/(dashboard)/system/entities/loading.tsx` | Exists | Ignore | KEEP (already exists) |
| `apps/web/src/app/(dashboard)/system/entities/error.tsx` | Exists | Ignore | KEEP (already exists) |
| `apps/web/src/app/(dashboard)/overview/layout.tsx` (20 lines) | Working | Add Entities tab | Optionally add tab linking to /system/entities |
| `apps/api/src/domains/system/services/entity.service.ts` (119 lines) | Working | Expand | EXPAND with update, archive, _count |
| `apps/api/src/domains/system/routes.ts` (432 lines) | Working | Add 10 endpoints | ADD 2 endpoints (PATCH, archive) |
| `apps/web/src/lib/api/entities.ts` (48 lines) | Working | Expand | EXPAND with detail, update, archive |
| `apps/web/src/components/layout/Navbar.tsx` | Working | Add status badges | ADD archived filter (1 line) |
| `packages/db/prisma/schema.prisma` Entity model | Working | Add 3 fields + 1 model | ADD 1 field (status) |
| `packages/data/jurisdictions/*.json` (7 files) | Does not exist | Create new package | DEFER |
| `apps/web/src/components/entities/wizard/*.tsx` (8 files) | Does not exist | Create | DEFER |
| `apps/web/src/components/entities/EntityHubClient.tsx` | Does not exist | Create | DEFER (use system/entities path) |
| `apps/web/src/components/entities/EntityCard.tsx` | Does not exist | Create | DEFER (adapt EntitiesList.tsx pattern) |
| `apps/web/src/components/entities/EntityDetailClient.tsx` | Does not exist | Create | BUILD as entity-detail-client.tsx under system/entities/[id]/ |
| `apps/web/src/components/entities/EntityEditForm.tsx` | Does not exist | Create | MERGE into detail client (one component, not two) |
| `apps/web/src/components/entities/EntityRelationshipsPanel.tsx` | Does not exist | Create | DEFER |
| `apps/api/src/domains/system/services/entity-relationship.service.ts` | Does not exist | Create | DEFER |
| `apps/api/src/lib/validators/tax-id.ts` | Does not exist | Create | DEFER |
| `apps/api/src/domains/ai/routes/entity-advisor.ts` | Does not exist | Create | DEFER |

**Summary:** Of the ~25 new files proposed, ~6 are needed. Of the ~5 existing files proposed for replacement, all should be enhanced or reused instead.
