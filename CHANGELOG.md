# Akount - Project Changelog

**Purpose:** Track significant changes to project structure, plans, specs, and implementations.

**When to update:** When making changes that affect planning docs, roadmap, or product specs.

---

## 2026-01-27 - Project Tracking System Established

### Added
- **STATUS.md** - Single source of truth for implementation progress
- **ROADMAP.md** - 8-phase development plan with time estimates
- **TASKS.md** - Weekly task breakdown with daily goals
- **TRACKING-GUIDE.md** - Guide for maintaining project tracking
- **CHANGELOG.md** - This file
- **README.md** - Project overview and quick start

### Changed
- **planning/akount_foundation_checklist.md**
  - Updated header to clarify this tracks SCHEMA DESIGN, not implementation
  - Updated summary table to show "Schema Designed" vs "Implementation Complete"
  - Updated progress summary to reflect accurate state (~5% implementation)
  - Added references to STATUS.md for implementation tracking
  - Changed "Notes & Next Steps" to point to new tracking files

### Fixed
- **Inaccurate progress tracking** - Previous checklists showed 29% complete, reality was ~5%
- **Confusion between design and implementation** - Clarified that checkmarks mean "schema defined" not "feature working"
- **No single source of truth** - Now STATUS.md is the authoritative implementation status

### Documentation
- Established discipline: Update STATUS.md, ROADMAP.md, and TASKS.md as implementation progresses
- Created clear separation: planning/ folder = specs/reference, root files = live tracking

---

## 2026-01-27 - Initial Commit

### Added (All Files)
- Turborepo monorepo structure (apps/web, apps/api, packages/*)
- Next.js 16 frontend with basic layout and dashboard
- Fastify backend with hello-world endpoint
- Prisma schema with 40+ models (611 lines)
- Shadcn/ui components (11 components)
- Design system (Tailwind CSS v4, Google Fonts)
- Comprehensive planning documentation
  - Product overview and feature specs
  - Data model documentation
  - Section specifications (Accounts, Reconciliation, Transactions, etc.)
  - Design system tokens
  - Implementation instructions
  - Engineering roadmap (aspirational)
  - Foundation checklist (aspirational)

### Status
- Infrastructure: Complete
- Database Schema: Defined (not migrated)
- Frontend: Basic shell only
- Backend: Hello-world only
- Authentication: Not configured
- Features: None implemented
- **Overall: ~5% complete**

---

## Template for Future Updates

### [Date] - [Title of Change]

#### Added
- New files, features, or capabilities

#### Changed
- Modified files, updated specs, changed plans

#### Fixed
- Bug fixes, corrected inaccuracies

#### Removed
- Deleted files or deprecated features

#### Deprecated
- Features marked for future removal

#### Security
- Security-related changes

#### Documentation
- Documentation updates

---

## Versioning Guidelines

### When to Create an Entry

**DO create changelog entry for:**
- ✅ Completing a phase or major milestone
- ✅ Adding/removing features from roadmap
- ✅ Changing database schema significantly
- ✅ Updating product specs based on implementation learning
- ✅ Architecture decisions that affect multiple components
- ✅ Breaking changes to APIs or data structures

**DON'T create changelog entry for:**
- ❌ Daily task updates in TASKS.md
- ❌ Minor bug fixes
- ❌ Typo corrections
- ❌ Refactoring that doesn't change behavior
- ❌ Code comments or internal docs

### Format

**Good Entry:**
```markdown
## 2026-02-15 - Authentication Complete

### Added
- Clerk passkey authentication with WebAuthn
- Sign-in and sign-up pages
- Protected routes middleware
- User session management

### Changed
- Updated STATUS.md: Authentication section now 100%
- Updated ROADMAP.md: Phase 0 now 60% complete

### Fixed
- Incorrect progress reporting in foundation checklist
```

**Bad Entry:**
```markdown
## 2026-02-15 - Stuff

### Changed
- Updated some files
- Fixed bugs
```

---

## Planning Documentation Changes

**Track when planning/ folder docs are updated based on implementation discoveries.**

### Example:
```markdown
## 2026-03-01 - Accounts Overview Spec Updated

### Changed
- **planning/sections/accounts-overview/README.md**
  - Removed "FX toggle" feature (deferred to Phase 2)
  - Added "Quick add account" feature (discovered during implementation)
  - Updated API endpoints based on actual implementation

### Reason
- Initial spec assumed FX toggle in Phase 1, but implementation showed
  this requires FX rate service which is Phase 2 dependency
- Users requested faster account creation during testing
```

---

## Roadmap Changes

**Track significant changes to ROADMAP.md timeline or priorities.**

### Example:
```markdown
## 2026-04-01 - Roadmap Adjustment

### Changed
- **ROADMAP.md Phase 2** timeline extended from 2-3 weeks to 3-4 weeks
  - Bank reconciliation more complex than estimated
  - Auto-matching algorithm required additional iteration
  - CSV import needed more format support than planned

### Impact
- MVP delivery pushed from May 15 to May 30
- Cost estimate increased from $50-100/mo to $75-125/mo
  (due to longer development period on paid services)
```

---

## Database Schema Changes

**Track when schema changes affect existing data or require migrations.**

### Example:
```markdown
## 2026-05-01 - Schema Migration: Added Notification Preferences

### Added
- NotificationPreference model
- User.notificationPreferences relation

### Changed
- Migration: 20260501_add_notification_preferences
- Seed script updated with default preferences

### Impact
- Existing users get default preferences on next login
- No data loss, backward compatible
```

---

**Last Updated:** 2026-01-27
**Next Expected Entry:** When Phase 0 (Foundation) is complete
