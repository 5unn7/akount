# Onboarding Wizard Brainstorm

**Date:** 2026-02-01
**Status:** Brainstormed & Decisions Captured
**Related:** Phase 0 Foundation Complete, Ready for Phase 1 Enhancement
**Priority:** Pre-Phase 1 (Better UX than jumping to dashboard)

---

## Problem Statement

New users face friction when starting Akount:
- Dashboard has no data (empty state confusion)
- Core setup unclear (entity? bank? accounts?)
- Complex multi-entity scenarios unsupported
- No guidance on Chart of Accounts structure

**Solution:** Build guided onboarding wizard that sets up core accounting structure in 5-10 minutes while supporting diverse user scenarios (solopreneurs, accountants, multi-country entities).

---

## User Needs

### Primary User Types
1. **Solo Entrepreneurs/Freelancers** (60%)
   - Need: Quick setup, minimal complexity
   - Pain: Don't want to customize COA, just want default
   - Goal: Start tracking income/expenses immediately

2. **Accountants/Bookkeepers** (25%)
   - Need: Batch setup for multiple clients
   - Pain: Repetitive manual entity creation
   - Goal: Efficient client onboarding workflow

3. **Business Owners** (10%)
   - Need: Multi-entity, multi-currency, complex COA
   - Pain: Need customization and importing existing data
   - Goal: Migrate from QuickBooks/Xero

4. **Casual Users** (5%)
   - Need: Explore, lightweight, optional
   - Pain: Don't want mandatory setup
   - Goal: Understand the product before committing

---

## Proposed Approach: Progressive Setup Wizard

### Architecture: Branching Flows Based on Account Type

```
Start
  ↓
1. Welcome & Account Type [REQUIRED]
  ├─ Personal (Freelancer/Solo)
  │   ├─ Fast path (3-4 steps)
  │   └─ Personal-focused defaults
  ├─ Business (Company/Entity)
  │   ├─ Full path (6-7 steps)
  │   └─ Business-focused setup
  └─ Accountant (Multi-client setup)
      ├─ Batch creation path
      └─ Client-focused workflow

2. Entity Type & Region [REQUIRED]
  ├─ Entity Type (Sole Prop, Corp, Partnership, etc.)
  ├─ Country/Jurisdiction
  └─ Auto-generate COA based on selection

3. Entity Details [REQUIRED]
  ├─ Business/Personal name
  ├─ Address (tax validation)
  ├─ Primary currency
  └─ Fiscal year start

4. Bank Account [REQUIRED but can skip]
  ├─ Connect via Flinks
  ├─ Account type selection
  └─ Import initial transactions? [optional]

5. Chart of Accounts [HYBRID] (Personal: optional, Business: recommended)
  ├─ Review auto-generated COA
  ├─ Basic customization allowed (add/remove accounts)
  ├─ Full customization available but not required
  └─ Import from QuickBooks/other platforms [if available]

6. Opening Balances [OPTIONAL]
  ├─ Enter account starting balances
  ├─ Import from previous system
  └─ Can enter later

7. Multi-Entity Setup [OPTIONAL for Business/Accountant]
  ├─ Add additional entities?
  ├─ Different currencies per entity?
  └─ Invite team members to workspace?

8. Completion
  ├─ Summary of setup
  ├─ Skip to Dashboard
  └─ Configure more in Settings
```

---

## Key Features & Decisions

### 1. Account Type Branching ✅ DECIDED
- **Personal Flow**: Minimal screens, no business-specific setup
- **Business Flow**: Full multi-entity support
- **Accountant Flow**: Batch operations, bulk entity creation
- Users can upgrade (personal → add business accounts later)

### 2. Auto-Generated Chart of Accounts ✅ DECIDED
- Auto-generate based on:
  - Entity type (sole proprietor, incorporated, partnership)
  - Country/jurisdiction (different tax structures)
  - Industry (optional categorization)
- User can customize but not required (hybrid approach)
- Advanced users: full customization available

### 3. Import from External Platforms ✅ DECIDED
- **Phase 1 Support:** QuickBooks (most common)
- **Future Support:** Xero, Wave, Stripe
- Import capabilities:
  - Chart of Accounts (account structure)
  - Opening balances
  - Historical transactions (optional)

### 4. Multi-Currency Post-Setup ✅ DECIDED
- Set primary currency during setup
- Support adding secondary currencies:
  - For multi-entity support (entity A = CAD, entity B = USD)
  - For multicurrency accounts (business account in EUR, etc.)
  - Exchange rates managed in settings

### 5. Accountant Batch Setup ✅ DECIDED
- Option to create multiple entities in sequence
- Template creation for repeated setups
- Bulk client setup workflow
- Copy settings from previous client (templates)

### 6. Step Flexibility ✅ DECIDED
- **Required Steps:** Account type, Entity details, Primary bank
- **Optional Steps:** COA customization, Opening balances, Team setup
- Users can skip optional and finish later from Settings
- Progress indicator shows what's done/incomplete

---

## Constraints & Requirements

### Multi-Tenant Isolation
- All setup data must be tenant-isolated
- OnboardingStatus tracked per tenant
- Cannot see other tenant's setup progress

### Multi-Entity Support
- Support multiple entities per tenant from day one
- Each entity can have different:
  - Currency
  - Chart of Accounts (with shared defaults)
  - Bank accounts
  - Fiscal year

### Financial Data Integrity
- COA must follow accounting standards per jurisdiction
- Opening balances must be valid
- Multi-currency conversions accurate (no float arithmetic)
- Audit trail: who created entity, when, what COA

### Performance
- Wizard steps should load <1s
- COA generation <500ms
- Bank connection via Flinks (handled by Flinks)
- Database transactions ensure consistency

### User Experience
- Mobile responsive
- Progress indicator visible
- Can go back/forward in wizard
- Auto-save after each step
- Clear error messages and validation

---

## Edge Cases & Scenarios

### Scenario 1: Solo Freelancer
- Account Type: Personal
- Sees: Name, currency, fiscal year, bank
- Skips: COA customization, team invite
- Ends up with: Basic personal accounting ready to use

### Scenario 2: Small Business Owner (Multi-Currency)
- Account Type: Business
- Entity 1: Canadian corporation (CAD)
- Entity 2: US subsidiary (USD)
- Different COAs for each (generated based on country)
- Shared team access

### Scenario 3: Accountant Setting Up Clients
- Account Type: Accountant
- Batch create: 5 clients at once
- Template: Save standard client setup
- Import: Load previous client's COA as template
- Fast path: 2-3 minutes per client after first

### Scenario 4: QuickBooks Migration
- Account Type: Business
- Step: "Import from QuickBooks?"
- Upload: QB backup or export
- Parse: Extract COA, opening balances, transactions
- Review: Confirm mappings before import
- Result: Data preserved, ready to continue in Akount

### Scenario 5: Personal → Business Upgrade
- Started as Personal
- Later: "Want to add business accounting?"
- Creates new entity with business flow
- Can link entities for consolidated reporting

---

## Alternatives Considered

### Alternative 1: Minimal Onboarding (Skip Wizard)
- Jump directly to dashboard with empty state
- Optional setup hints
- **Why Not:** Too much friction, users abandon due to unclear next steps, poor data quality from rushed setup

### Alternative 2: Mandatory Complete Setup
- Force all 7 steps, no skipping
- Strict validation, can't proceed without all data
- **Why Not:** Loses casual users frustrated by length; doesn't match requirement to skip optional steps

### Alternative 3: Separate Flows per User Type
- Completely different UIs for personal vs. accountant
- No branching, entirely separate paths
- **Why Not:** Over-engineering; branching is simpler and more maintainable

---

## Open Questions (For Planning Phase)

- [ ] Should wizard data be saved to database immediately (auto-save) or after completion?
- [ ] How do we handle wizard abandonment? Email reminder? Restart from beginning?
- [ ] Should analytics track which steps users skip most often?
- [ ] Do we need a "help" contextual system during wizard?
- [ ] Should accountants be able to create templates from successful setups?
- [ ] How do we validate address/jurisdiction during setup?
- [ ] Should wizard offer tax zone guidance for entity types?

---

## Next Steps

- [ ] Create detailed implementation plan (`/processes:plan`)
- [ ] Define exact COA structure per region/entity type
- [ ] Design wireframes for wizard UI
- [ ] Plan QuickBooks import integration
- [ ] Implement and test with real users
- [ ] Collect feedback and iterate

---

## Implementation Phases

### Phase Pre-1: Onboarding Wizard
**Goal:** Users can complete account setup in 5-10 minutes with proper structure

**Deliverables:**
1. Wizard UI and flow
2. Auto-COA generation by region
3. Flinks bank connection
4. Basic import capability (QuickBooks)
5. Opening balances entry

### Future: Accountant Tools
- Batch client creation
- Template management
- Team collaboration setup

### Future: Advanced Imports
- Xero import
- Wave import
- Generic CSV import

---

**Status:** Ready for detailed planning phase
**Next Action:** `/processes:plan onboarding-wizard`
