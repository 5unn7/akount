# Entity Management Hub Brainstorm

**Date:** 2026-02-20
**Status:** Brainstormed

## Problem

Entity management is currently crammed into a navbar dropdown — creation is a basic form with no guidance, there's no way to manage entities after creation (edit, archive, view metrics), and the system doesn't support pre-registration entities, inter-entity relationships, or jurisdiction-aware entity types. Solopreneurs operating globally need a proper entity management experience that helps them make informed decisions about entity structure.

**Who:** Both new solopreneurs (need guidance) and established ones (need efficiency).

## Chosen Approach: Entity Hub (Under Overview Tab)

A dedicated "Entities" secondary tab under the Overview section that serves as the entity management hub. Features an adaptive creation wizard with accountant-framed decision logic, support for pre-registration/informal entities, inter-entity relationships, and jurisdiction-specific entity types for core markets.

### Key Features

#### 1. Entity Hub Page (Overview > Entities tab)

- **Entity overview cards** — Each entity shown as a card with:
  - Entity name, type, jurisdiction flag, currency
  - Status badge: Active, Pre-registration, Archived
  - Key metrics: account count, total balance, last activity date
  - Quick actions: Edit, Archive, View Details
- **"Add Entity" prominent CTA** — opens the adaptive creation wizard
- **Relationship visualization** — if entities are related, show connection indicators
- **Filter/sort** — by status, type, country, activity

#### 2. Adaptive Entity Creation Wizard

Three entry paths based on user situation:

**Path A: Already Registered (Fast Path)**
```
→ Entity name
→ Entity type (filtered by jurisdiction)
→ Country of incorporation
→ Tax ID (format-validated per jurisdiction)
→ Currency (auto-set from country)
→ Fiscal year (auto-suggested per jurisdiction)
→ [Optional] Relationship to existing entity
→ Review + Create
```

**Path B: Guided (Decision Tree — Accountant-Framed)**
```
Step 1: "What best describes your situation?"
  - Starting a new business
  - Formalizing a side project
  - Expanding to a new country
  - Adding a business partner

Step 2: Country selection
  → Filters available entity types

Step 3: Accountant-framed questions (varies by country)
  US example:
  - "Will you have co-owners or partners?" (→ Partnership/LLC)
  - "Do you plan to raise investment from VCs?" (→ C-Corp)
  - "Do you need liability protection from personal assets?" (→ LLC/Corp)
  - "Will you have employees?" (→ affects S-Corp election)
  - "Expected annual revenue range?" (→ affects entity complexity)

  Canada example:
  - "Federal or provincial incorporation?"
  - "Will you operate in multiple provinces?"
  - "Do you need GST/HST registration?"

Step 4: Recommendation with reasoning
  → "Based on your answers, we recommend: LLC"
  → Comparison table showing why (tax, liability, complexity)
  → "Ask AI Advisor" button for edge cases

Step 5: Entity details (pre-filled from answers)
Step 6: Review + Create
```

**Path C: Pre-Registration (Informal)**
```
→ Entity name (e.g., "My Freelance Work")
→ Intended type (or "Not sure yet")
→ Country of operation
→ Currency
→ Status: Pre-Registration
→ Guidance: "You can start tracking finances now. When you're ready to register..."
→ Links to formation resources per country
→ Review + Create
```

#### 3. Inter-Entity Relationships

New `EntityRelationship` model to track:
- **Ownership:** "My Personal" owns 100% of "My LLC"
- **Partnership:** "My LLC" owns 40% of "Joint Venture Corp"
- **Parent-Subsidiary:** "US HoldCo" is parent of "CA OpCo"
- **External partners:** Track partners not in Akount (name + ownership %)

**Key constraint:** A partner of an entity could be:
- Another entity the user manages (in-system)
- An external person/company (out-of-system, stored as metadata)

**Future enables:** Consolidated reporting, transfer pricing, ownership disclosures.

#### 4. Jurisdiction-Aware Entity Types

**Core markets (Phase 1):**

| Country | Entity Types |
|---------|-------------|
| **US** | Sole Proprietorship, LLC (Single/Multi-member), S-Corp, C-Corp, Partnership (General/Limited/LLP) |
| **Canada** | Sole Proprietorship, Partnership (General/Limited/LLP), Corporation (Federal/Provincial) |
| **UK** | Sole Trader, Partnership (Ordinary/Limited/LLP), Private Limited (Ltd), Public Limited (PLC) |
| **EU (Generic)** | Sole Trader, Partnership, Private Limited, Public Limited |
| **India** | Sole Proprietorship, Partnership, LLP, Private Limited, One Person Company (OPC), Public Limited |
| **Australia** | Sole Trader, Partnership, Company (Pty Ltd), Trust |

**Implementation:** JSON data files, not DB enums. Each country file contains:
- Available entity types with descriptions
- Tax ID format + validation regex
- Default fiscal year (US: Jan, UK: Apr, India: Apr, etc.)
- Formation resources / links
- Advisory decision tree questions

#### 5. Tax ID Validation (Format Only — Phase 1)

| Country | Tax ID Name | Format |
|---------|------------|--------|
| US | EIN | XX-XXXXXXX |
| Canada | Business Number (BN) | XXXXXXXXX RT XXXX |
| UK | UTR / Company Number | XXXXXXXXXX / XXXXXXXX |
| India | PAN / GSTIN | XXXXX0000X / XX... |
| Australia | ABN / ACN | XX XXX XXX XXX / XXX XXX XXX |

Phase 2: Registry lookup APIs (Companies House, SEC EDGAR, etc.)

#### 6. Entity Detail Page

Clicking an entity card opens a detail view:
- **Header:** Entity name, type, status badge, jurisdiction flag
- **Overview section:** Key metrics (account count, total balance, last activity)
- **Settings:** Edit name, fiscal year, tax details, address
- **Relationships tab:** View/manage related entities + ownership %
- **Upgrade CTA:** For pre-registration entities → "Ready to formalize?"
- **Archive action:** Soft-archive with confirmation

#### 7. Hybrid AI Advisory

- **Static decision tree** for the main wizard flow (reliable, no latency)
- **"Ask AI Advisor" button** at recommendation step for edge cases
- AI Advisor can consider:
  - Multi-jurisdiction implications
  - Tax treaty benefits
  - Transfer pricing considerations
  - Entity restructuring suggestions

### Constraints

- **Tenant isolation:** All entity queries scoped to tenant
- **Pre-registration entities** can track basic finances but should show "informal" warnings on formal reports
- **Entity types are data-driven** (JSON files), not Prisma enums — allows adding countries without migrations
- **Ownership percentages** must not exceed 100% per entity
- **Fiscal year changes** on existing entities need careful handling (mid-year changes affect reports)
- **EntityType enum migration:** Current 5-value enum needs to become more flexible for jurisdiction-specific types

### Edge Cases

- **Entity with no tax ID** — allowed for pre-registration, warned for active
- **Entity in unsupported country** — allow with "Generic" entity types, flag for manual review
- **Circular ownership** — A owns B, B owns A → detect and prevent
- **Entity type mismatch** — user picks LLC but jurisdiction doesn't support it → filter types by country
- **Currency change after creation** — dangerous (affects all historical transactions). Warn heavily or disallow.
- **Archiving entity with active transactions** — require settling/transferring first
- **Partner entity deleted** — relationship becomes orphaned → handle gracefully
- **Multiple entities, same tax ID** — different entities in different jurisdictions can share a tax ID format but not value

## Domain Impact

- **Primary:** Overview (new tab), System (entity API/model changes)
- **Adjacent:** Accounting (future consolidated reports), Onboarding (wizard replaces current form), Banking (entity filter works as-is)

## Review Concerns (from Phase 2.5)

- **prisma-migration-reviewer:** New EntityRelationship model, EntityStatus field, potential enum migration
- **security-sentinel:** Inter-entity relationships must be tenant-scoped; external partner data is PII
- **financial-data-validator:** Ownership % validation, pre-registration entities on formal reports
- **architecture-strategist:** JSON data files vs DB for entity types — needs decision
- **nextjs-app-router-reviewer:** New tab under Overview layout, entity detail page routing

## Alternatives Considered

- **Entity Drawer** — Too cramped for advisory wizard + relationships. Doesn't scale to 5+ entities.
- **Entities as First-Class Domain** — Over-engineers for 1-3 entities. User wanted "under Overview."

## Open Questions

- [ ] Should pre-registration entities have restricted features? (e.g., no invoice generation, no GL posting)
- [ ] How to handle EntityType enum migration — keep enum + add `entitySubType` string, or move fully to string-based types?
- [ ] Should entity creation from onboarding use the same wizard, or keep it simplified?
- [ ] What's the data model for external partners (people/companies not in Akount)?
- [ ] Should entity archival cascade to related data visibility?

## Next Steps

- [ ] Create implementation plan: `/processes:plan entity-management-hub`
- [ ] Research accountant decision tree logic for US, CA, UK entity type selection
- [ ] Design entity card component + entity detail page wireframes
- [ ] Plan Prisma schema migration for EntityRelationship + EntityStatus
