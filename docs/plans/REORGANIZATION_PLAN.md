# Akount Project Reorganization Plan

**Status:** Proposed - Awaiting Approval
**Date:** 2026-01-30
**Impact:** High (moves 20+ files, creates new discovery system)
**Estimated Time:** 2-3 hours for full implementation

---

## Executive Summary

**Problem:** Agents cannot effectively find documentation because:
- 35+ files clutter root directory with no hierarchy
- No discovery mechanism for `docs/` folder
- agent-os and .claude/agents are disconnected
- Missing CLAUDE.md (auto-loaded agent context)
- Duplicate files (agent-os commands in two locations)

**Solution:**
1. Create CLAUDE.md as central index for agents
2. Reorganize root directory (keep only 8-10 essential files)
3. Remove duplicate agent-os commands
4. Integrate documentation systems
5. Add discovery hints to all agents

**Expected Outcome:**
- Agents know where to find architecture docs, standards, and guidelines
- Reduced context pollution (fewer files to scan)
- Clear hierarchy: root → active tracking, docs → reference
- Single source of truth for all documentation

---

## Current State Analysis

### Root Directory (35 files)

**Configuration Files (10):** package.json, turbo.json, .env, etc. ✅ Keep
**Essential Tracking (6):** README, STATUS, ROADMAP, TASKS, CHANGELOG, SESSION-SUMMARY ✅ Keep
**Setup Guides (4):** BACKUP-*.md, DATABASE-SETUP.md, NEXT-STEPS.md 📦 Move to docs/setup/
**Agent Guides (3):** QUICK_START_AGENTS.md, CUSTOM_AGENTS_TEMPLATES.md, TRACKING-GUIDE.md 📦 Move to docs/guides/
**Session Reports (7):** WEEK_*.md, CODE_REVIEW_REPORT.md, COMPOUND_*.md, PERFORMANCE_REVIEW_*.md 📦 Move to docs/archive/sessions/
**Architecture Docs (2):** ARCHITECTURE-SUMMARY.md 📦 Move to docs/architecture/ (may duplicate)
**Security Docs (2):** SECURITY_FIXES_APPLIED.md, SYNC-AUDIT.md 📦 Move to docs/archive/

### Documentation Structure

```
Current:
/                         (35 files - CLUTTERED)
docs/                     (30 files - ORGANIZED but NO DISCOVERY)
.claude/agents/           (24 agents - NO CONTEXT about Akount)
agent-os/                 (28 files - NOT INTEGRATED)
```

```
Proposed:
/                         (10 files - CLEAN, focused on active work)
  ├── CLAUDE.md           (NEW - agent discovery index)
  ├── README.md
  ├── STATUS.md
  ├── ROADMAP.md
  ├── TASKS.md
  ├── CHANGELOG.md
  ├── SESSION-SUMMARY.md
  └── [Config files]

docs/                     (ORGANIZED + INDEXED in CLAUDE.md)
  ├── README.md           (already excellent)
  ├── setup/              (NEW - setup guides)
  ├── guides/             (NEW - how-to guides)
  ├── standards/          (NEW - Akount-specific standards)
  ├── archive/            (EXPANDED - sessions, obsolete docs)
  ├── architecture/       (keep - but referenced in CLAUDE.md)
  ├── product/            (keep - referenced in CLAUDE.md)
  ├── features/           (keep - referenced in CLAUDE.md)
  └── [existing folders]

.claude/
  ├── CLAUDE.md           (symlink to /CLAUDE.md)
  ├── agents/             (keep - add context_files to frontmatter)
  └── commands/
      ├── workflows/      (keep)
      └── agent-os/       (DELETE - use agent-os/commands/ instead)

agent-os/                 (keep - integrate via CLAUDE.md)
```

---

## Proposed Changes

### Change 1: Create CLAUDE.md (Central Agent Index)

**File:** `/CLAUDE.md`
**Purpose:** Auto-loaded by Claude at conversation start
**Content:** Index of all documentation, standards, and guidelines

**Template:**
```markdown
# Akount Project - Agent Context

> This file is automatically loaded by Claude Code at the start of every conversation.
> Keep it concise. Link to detailed docs rather than including content here.

## 🏗️ Architecture & Technical Decisions

**Core Architecture:**
- `docs/architecture/decisions.md` - Tech stack choices (why Next.js 16, Fastify, PostgreSQL)
- `docs/architecture/ARCHITECTURE-HOOKS.md` - System architecture review framework
- `docs/architecture/schema-design.md` - Database design patterns & conventions

**Key Principles:**
1. **Multi-tenant:** ALL queries MUST filter by `tenantId` (zero exceptions)
2. **Server-first:** Maximize Server Components, minimize client JS
3. **Integer cents:** All monetary values are `Int` (cents), NEVER `Float`
4. **Monorepo:** `apps/*` and `packages/*` with Turborepo

## 📊 Product Context

**What We're Building:**
- `docs/product/overview.md` - Product vision, target users, value proposition
- `docs/product/data-model/README.md` - All 40+ Prisma models explained

**Feature Specifications:**
- `docs/features/01-accounts-overview.md` (Phase 1)
- `docs/features/02-bank-reconciliation.md` (Phase 2)
- `docs/features/03-transactions-bookkeeping.md` (Phase 3)
- `docs/features/04-invoicing-bills.md` (Phase 4)
- `docs/features/05-analytics.md` (Phase 5)
- `docs/features/06-planning.md` (Phase 6)
- `docs/features/07-ai-financial-advisor.md` (Phase 7)

## 📍 Current State

**What's Implemented:**
- `STATUS.md` - Current progress (updated weekly)
- `ROADMAP.md` - Phase-by-phase development plan
- `TASKS.md` - This week's priorities (updated daily)
- `CHANGELOG.md` - Milestone tracking

**Recent Work:**
- Bank statement import (PDF parsing, account matching, duplicate detection)
- Authentication (Clerk with passkeys)
- Database (PostgreSQL + Prisma with 40+ models)

## 📐 Standards & Conventions

**Agent OS Standards (Generic Patterns):**
- `agent-os/standards/monorepo/` - Workspace organization, package naming
- `agent-os/standards/frontend/` - Component patterns, import paths
- `agent-os/standards/database/` - Schema conventions
- Use `/inject-standards` command to load relevant standards

**Akount-Specific Standards:**
- `docs/standards/multi-tenancy.md` - Tenant isolation patterns
- `docs/standards/financial-data.md` - Double-entry bookkeeping rules
- `docs/standards/api-design.md` - Fastify API conventions

**Design System:**
- `docs/design-system/` - Colors, typography, component tokens

## 🤖 Available Agents

**Review Agents (15):**
- `.claude/agents/review/README.md` - Full agent directory
- Key agents: financial-data-validator, architecture-strategist, security-sentinel

**Research Agents (4):**
- best-practices-researcher, framework-docs-researcher, git-history-analyzer

**Workflows:**
- `.claude/commands/workflows/README.md` - brainstorm → plan → work → review

## 🚨 Critical Constraints

**Security:**
- NEVER log sensitive data (tokens, passwords, PII)
- ALWAYS validate tenant isolation in queries
- ALWAYS sanitize user input

**Financial Data:**
- NEVER use `Float` for money (use `Int` cents)
- ALWAYS maintain double-entry integrity (debits = credits)
- ALWAYS preserve audit trails (who, when, what, why)

**Database:**
- NEVER delete data (soft delete with `deletedAt`)
- ALWAYS use transactions for multi-table updates
- ALWAYS include `tenantId` in WHERE clauses

## 📚 Additional Resources

**Setup Guides:**
- `docs/setup/` - Installation, environment setup, deployment

**Development Guides:**
- `docs/guides/` - Agent usage, tracking, workflows

**Session Archives:**
- `docs/archive/sessions/` - Historical session reports
```

**Why This Helps:**
- Agents automatically know about all key documentation
- Progressive disclosure: Link to docs, don't include full content
- Clear priorities: Critical constraints at top
- Discovery hints: Where to find what

---

### Change 2: Clean Up Root Directory

**Files to Move:**

#### To `docs/setup/` (4 files):
- `BACKUP-QUICKSTART.md` → `docs/setup/backup-quickstart.md`
- `BACKUP-SECURITY.md` → `docs/setup/backup-security.md`
- `BACKUP-WINDOWS.md` → `docs/setup/backup-windows.md`
- `DATABASE-SETUP.md` → `docs/setup/database-setup.md`
- `NEXT-STEPS.md` → `docs/setup/next-steps.md`

#### To `docs/guides/` (3 files):
- `QUICK_START_AGENTS.md` → `docs/guides/quick-start-agents.md`
- `CUSTOM_AGENTS_TEMPLATES.md` → `docs/guides/custom-agents-templates.md`
- `TRACKING-GUIDE.md` → `docs/guides/tracking-guide.md`

#### To `docs/archive/sessions/` (10 files):
- `WEEK_1_INSTALLATION_COMPLETE.md`
- `WEEK_2_COMPLETE.md`
- `WEEK_3_COMPLETE.md`
- `SESSION-SUMMARY.md` (DECISION: Keep in root OR archive? It's current)
- `CODE_REVIEW_REPORT.md`
- `COMPOUND_ENGINEERING_ACTION_PLAN.md`
- `COMPOUND_ENGINEERING_ANALYSIS.md`
- `COMPOUND_ENGINEERING_COMPLETE.md`
- `PERFORMANCE_REVIEW_BANK_IMPORT.md`
- `SECURITY_FIXES_APPLIED.md`
- `SYNC-AUDIT.md`

#### To `docs/architecture/` (check for duplicates):
- `ARCHITECTURE-SUMMARY.md` (may duplicate `docs/architecture/decisions.md`)

**Files to Keep in Root (10):**
```
/
├── CLAUDE.md                  (NEW)
├── README.md                  (project overview)
├── STATUS.md                  (weekly progress)
├── ROADMAP.md                 (phase plan)
├── TASKS.md                   (daily work)
├── CHANGELOG.md               (milestones)
├── SESSION-SUMMARY.md         (current session - DECIDE: keep or archive)
├── .env.example               (setup guide)
└── [Config files: package.json, turbo.json, etc.]
```

**Before/After:**
- **Before:** 35 files (25 markdown docs)
- **After:** 10-11 files (6-7 markdown docs)
- **Reduction:** 71% fewer files to scan

---

### Change 3: Remove Duplicate agent-os Commands

**Problem:**
```
Duplicate files (exact copies):
.claude/commands/agent-os/discover-standards.md
agent-os/commands/agent-os/discover-standards.md

Same for: index-standards, inject-standards, plan-product, shape-spec
```

**Solution:**
```bash
# Delete duplicates
rm -rf .claude/commands/agent-os/

# Update references
# In .claude/settings.local.json (if references exist)
# In skill registry (if applicable)
```

**Skills Will Use:**
- `agent-os/commands/agent-os/discover-standards.md` (original)
- Claude Code auto-discovers skills in `agent-os/commands/`

**Why This Helps:**
- Single source of truth
- No sync burden
- agent-os updates propagate automatically

---

### Change 4: Integrate Documentation Systems

**Create Akount-Specific Standards:**

```
docs/standards/
├── README.md               (index of Akount standards)
├── multi-tenancy.md        (tenant isolation patterns)
├── financial-data.md       (double-entry rules, money handling)
├── api-design.md           (Fastify conventions)
└── security.md             (OWASP Top 10 for Akount)
```

**Update agent-os Integration:**

Create `agent-os/standards/akount/` (symlink to `../../docs/standards/`):
```bash
cd agent-os/standards/
ln -s ../../docs/standards akount
```

**Update `agent-os/standards/index.yml`:**
```yaml
# Add Akount-specific standards
akount:
  description: "Akount-specific patterns and conventions"
  categories:
    - multi-tenancy
    - financial-data
    - api-design
    - security
  path: "akount/"
```

**Why This Helps:**
- `/inject-standards` command knows about Akount patterns
- Standards discoverable via agent-os tools
- Clear separation: generic (agent-os) vs domain (Akount)

---

### Change 5: Update Agent Configurations

**Add Context to Agent Frontmatter:**

**Example: architecture-strategist.md**
```yaml
---
name: architecture-strategist
description: "System architecture review with Akount context"
model: inherit
context_files:
  - docs/architecture/decisions.md
  - docs/architecture/ARCHITECTURE-HOOKS.md
  - docs/product/data-model/README.md
  - STATUS.md
related_agents:
  - kieran-typescript-reviewer
  - security-sentinel
  - prisma-migration-reviewer
invoke_patterns:
  - "review architecture"
  - "check system design"
  - "validate multi-tenant"
---
```

**Apply to All 24 Agents:**
- Add `context_files` pointing to relevant docs
- Add `related_agents` for orchestration hints
- Add `invoke_patterns` for better discovery

**Why This Helps:**
- Agents automatically load relevant context
- Clear relationships between agents
- Better discovery (agents suggest each other)

---

### Change 6: Fix Naming Inconsistencies

**Option A: Rename for Clarity (Recommended)**
```
.claude/agents/workflow/    →  .claude/agents/automation/
.claude/commands/workflows/ →  .claude/commands/processes/
```

**Option B: Document Distinction**
Keep names, but clarify in READMEs:
- `workflow/` = Agents that ASSIST with workflows (validators)
- `workflows/` = Structured PROCESSES (brainstorm, plan, work, review)

**Decision:** To be made based on your preference

---

## Implementation Plan

### Phase 1: Discovery Setup (30 min)
1. Create `CLAUDE.md` with comprehensive index
2. Symlink `.claude/CLAUDE.md` → `/CLAUDE.md`
3. Test: Start new conversation, verify CLAUDE.md loads

### Phase 2: Cleanup (45 min)
1. Create new directories:
   - `docs/setup/`
   - `docs/guides/`
   - `docs/standards/`
   - `docs/archive/sessions/`

2. Move files according to plan above
3. Update internal links (grep for moved file names)
4. Update `docs/README.md` to reflect new structure

### Phase 3: Deduplication (15 min)
1. Delete `.claude/commands/agent-os/`
2. Verify skills still work (test `/discover-standards`)
3. Update any references in settings

### Phase 4: Integration (45 min)
1. Create `docs/standards/` content:
   - multi-tenancy.md
   - financial-data.md
   - api-design.md
   - security.md

2. Update `agent-os/standards/index.yml`
3. Create symlink: `agent-os/standards/akount/`
4. Test: `/inject-standards` finds Akount standards

### Phase 5: Agent Updates (30 min)
1. Update all 24 agents with:
   - `context_files`
   - `related_agents`
   - `invoke_patterns`

2. Priority order:
   - architecture-strategist (critical)
   - financial-data-validator (critical)
   - security-sentinel (critical)
   - kieran-typescript-reviewer
   - [others]

### Phase 6: Validation (15 min)
1. Start fresh conversation
2. Verify CLAUDE.md loads
3. Test agent invocations
4. Check `/inject-standards`
5. Verify all moved files accessible

**Total Time:** ~3 hours

---

## Risk Assessment

### Low Risk Changes ✅
- Creating CLAUDE.md (new file, no conflicts)
- Moving setup/guide docs (rarely referenced in code)
- Moving session archives (historical, no active use)

### Medium Risk Changes ⚠️
- Deleting `.claude/commands/agent-os/` (verify skills still work)
- Moving ARCHITECTURE-SUMMARY.md (may have internal refs)
- Updating agent frontmatter (test each agent after)

### High Risk Changes 🚨
- None (this is primarily organizational)

### Rollback Plan
```bash
# All changes are file moves, easily reversible:
git checkout HEAD -- .                    # Revert all
git checkout HEAD -- .claude/             # Revert agent changes only
git checkout HEAD -- docs/                # Revert doc moves only
```

---

## Expected Benefits

### For Agents
1. **Automatic Context Loading**
   - CLAUDE.md loads at conversation start
   - Agents know where all docs are
   - No more blind grep/glob searches

2. **Targeted Discovery**
   - Clear index of architecture, product, features
   - Standards integrated (agent-os + Akount)
   - Related agents suggested automatically

3. **Reduced Noise**
   - Root directory: 35 → 10 files (71% reduction)
   - Clear hierarchy: active work vs reference
   - Session archives separated from permanent docs

### For Developers
1. **Clarity**
   - Root = current work only
   - docs/ = organized reference
   - Clear "where does X go?" rules

2. **Maintainability**
   - Single source of truth (no duplicates)
   - agent-os and Akount integrated
   - Standards discoverable via `/inject-standards`

3. **Onboarding**
   - New team members: Read CLAUDE.md + README
   - New agents: Auto-load CLAUDE.md context
   - Clear structure, easy navigation

---

## Open Questions

1. **SESSION-SUMMARY.md:**
   - Keep in root (it's current) OR
   - Move to docs/archive/sessions/ (consistency)
   - **Decision needed**

2. **Naming: workflow vs workflows:**
   - Rename both for clarity OR
   - Keep names, improve documentation
   - **Preference?**

3. **agent-os standards:**
   - Symlink approach OR
   - Copy files into docs/standards/
   - **Technical preference?**

4. **Scope of agent updates:**
   - Update all 24 agents immediately OR
   - Start with 5 critical agents, expand later
   - **Time preference?**

---

## Approval Checklist

Before proceeding, confirm:

- [ ] Understand CLAUDE.md purpose and content
- [ ] Agree with root directory cleanup (25 → 6 files)
- [ ] Comfortable with file moves (reversible via git)
- [ ] Approve duplicate removal (.claude/commands/agent-os/)
- [ ] Agree with docs/standards/ creation
- [ ] Comfortable with agent frontmatter updates
- [ ] Decide: SESSION-SUMMARY.md location
- [ ] Decide: Rename workflow/workflows or keep
- [ ] Decide: Symlink vs copy for agent-os integration
- [ ] Ready to commit ~3 hours for full implementation

---

## Next Steps

**Option 1: Full Implementation**
- Approve this plan
- Execute all 6 phases (~3 hours)
- Commit changes with detailed message
- Test thoroughly

**Option 2: Phased Rollout**
- Phase 1 only: Create CLAUDE.md (30 min)
- Test and evaluate
- Proceed with Phase 2-6 after validation

**Option 3: Pilot Test**
- Implement in a branch
- Test with sample tasks
- Evaluate effectiveness
- Merge if successful

**Option 4: Custom Approach**
- Pick specific changes from this plan
- Skip others
- Tailor to your preferences

---

**Questions or concerns? Let's discuss before implementing.**
