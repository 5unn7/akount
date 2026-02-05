# Phase 7: Agent Instruction Updates

**Days:** 15-16
**Status:** ✅ COMPLETE (2026-02-05)
**Dependencies:** Phase 6 must be complete
**Can Parallel With:** None (final phase)

---

## Objectives

1. Update all agent context_files to use new docs/ structure
2. Enhance agent instructions with design-system validation rules
3. Create new agents (design-system-enforcer, rbac-validator)
4. Update agent registry

---

## Tasks

### 7.1 Update Existing Agent Context Files

All agents need context_files updated from `docs/design-system/v1/` to `docs/design-system/`.

- [ ] Update `financial-data-validator.md`:
  ```yaml
  context_files:
    - docs/design-system/01-components/financial-components.md
    - docs/design-system/05-governance/information-architecture.md
    - docs/standards/financial-data.md
  ```

- [ ] Update `architecture-strategist.md`:
  ```yaml
  context_files:
    - docs/design-system/05-governance/information-architecture.md
    - docs/design-system/02-patterns/navigation.md
    - docs/architecture/decisions.md
  ```

- [ ] Update `security-sentinel.md`:
  ```yaml
  context_files:
    - docs/design-system/05-governance/permissions-matrix.md
    - docs/design-system/06-compliance/soc2.md
    - docs/design-system/06-compliance/security.md
    - docs/standards/security.md
  ```

- [ ] Update `nextjs-app-router-reviewer.md`:
  ```yaml
  context_files:
    - docs/design-system/02-patterns/navigation.md
    - docs/design-system/05-governance/information-architecture.md
  ```

- [ ] Update `prisma-migration-reviewer.md`:
  ```yaml
  context_files:
    - docs/architecture/schema-design.md
    - docs/standards/financial-data.md
  ```

- [ ] Update `kieran-typescript-reviewer.md`:
  ```yaml
  context_files:
    - packages/types/src/financial/
    - packages/types/src/rbac/
  ```

- [ ] Update all other agents in `.claude/agents/review/`

**Verification:**
```bash
# Should return no results
grep -r "design-system/v1" .claude/agents/
```

---

### 7.2 Enhance Agent Instructions

#### 7.2.1 financial-data-validator.md Enhancements

- [ ] Add UI component validation rules:
  ```markdown
  ## UI Component Validation

  When reviewing frontend code that displays financial data:

  ### Required Components
  - [ ] Financial amounts MUST use `<MoneyAmount>` component
  - [ ] Money inputs MUST use `<MoneyInput>` component
  - [ ] Entity context MUST use `<EntityBadge>` component

  ### Forbidden Patterns
  - [ ] Raw number display for money (use MoneyAmount)
  - [ ] parseFloat for money calculations (use Cents type)
  - [ ] toFixed(2) for money display (use formatCents)

  ### Example Review

  ```tsx
  // BAD - Raw number display
  <span>${amount.toFixed(2)}</span>

  // GOOD - MoneyAmount component
  <MoneyAmount amount={amount} currency="CAD" />
  ```
  ```

#### 7.2.2 architecture-strategist.md Enhancements

- [ ] Add domain structure validation:
  ```markdown
  ## Domain Structure Validation

  Verify code follows 8-domain architecture:

  ### API Routes
  - [ ] Routes in `apps/api/src/domains/` (not routes/)
  - [ ] Domain folders: overview, banking, business, accounting, planning, ai, services, system
  - [ ] Each domain has routes.ts and services/

  ### Web Routes
  - [ ] Routes in `apps/web/src/app/(dashboard)/`
  - [ ] Route groups match domains
  - [ ] Layout uses Sidebar + TopCommandBar

  ### Cross-Domain Rules
  - [ ] No imports across domain boundaries (use shared services)
  - [ ] Entity/tenant context from layout, not fetched in pages
  ```

#### 7.2.3 security-sentinel.md Enhancements

- [ ] Add RBAC validation:
  ```markdown
  ## RBAC Validation

  Verify RBAC implementation matches design-system matrix:

  ### 6 Canonical Roles
  - OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER, INVESTOR, ADVISOR

  ### Route Protection
  - [ ] Admin routes check OWNER/ADMIN only
  - [ ] Accounting routes check OWNER/ADMIN/ACCOUNTANT
  - [ ] Audit log routes check OWNER/ADMIN/ACCOUNTANT
  - [ ] BOOKKEEPER cannot access accounting domain

  ### Audit Logging
  - [ ] All financial changes logged
  - [ ] Security events logged
  - [ ] RBAC denials logged

  ### Permission Matrix Reference
  See: `docs/design-system/05-governance/permissions-matrix.md`
  ```

---

### 7.3 Create New Agents

#### 7.3.1 design-system-enforcer.md

- [ ] Create `.claude/agents/review/design-system-enforcer.md`:
  ```markdown
  ---
  name: design-system-enforcer
  description: "Validates ALL UI code against Akount Design System specifications"
  model: inherit
  context_files:
    - docs/design-system/README.md
    - docs/design-system/00-foundations/colors.md
    - docs/design-system/00-foundations/typography.md
    - docs/design-system/01-components/financial-components.md
    - docs/design-system/02-patterns/navigation.md
  ---

  You are a **Design System Compliance Expert** for Akount.

  ## Your Role

  Review UI code to ensure it follows the Akount Design System specifications.
  Flag any deviations from the design system with specific references.

  ## Validation Checklist

  ### Colors
  - [ ] No hardcoded colors (no `text-green-500`, use semantic tokens)
  - [ ] Income uses `text-finance-income` (not green-xxx)
  - [ ] Expense uses `text-finance-expense` (not red-xxx)
  - [ ] AI elements use `text-ai` or `bg-ai` (violet accent)
  - [ ] All colors reference CSS variables from design tokens

  ### Typography
  - [ ] Headings use `font-heading` (Newsreader)
  - [ ] Body text uses `font-body` (Manrope)
  - [ ] Money/numbers use `font-mono` (JetBrains Mono)
  - [ ] Type scale follows design-system/00-foundations/typography.md

  ### Components
  - [ ] Financial amounts use `<MoneyAmount>` component
  - [ ] Money inputs use `<MoneyInput>` component
  - [ ] Entity context uses `<EntityBadge>` component
  - [ ] Navigation uses `<Sidebar>` and `<TopCommandBar>`
  - [ ] Tables follow design-system/02-patterns/tables-data.md

  ### Layout
  - [ ] 8-domain navigation structure
  - [ ] TopCommandBar with entity/period/currency controls
  - [ ] Sidebar with role-based filtering
  - [ ] Content area with proper padding (p-6)

  ### Tokens
  - [ ] Uses CSS variables from @akount/design-tokens
  - [ ] No inline styles for colors/spacing/radius
  - [ ] Tailwind classes use akountPreset extensions

  ## Review Output Format

  ```
  ## Design System Compliance Review

  ### Violations Found

  1. **[file:line]** - Description
     - Found: `text-green-500`
     - Expected: `text-finance-income`
     - Reference: docs/design-system/00-foundations/colors.md

  ### Compliance Rating

  - PASS: All checks passed
  - NEEDS WORK: Minor issues (1-3 violations)
  - FAIL: Major issues (4+ violations or critical patterns missing)

  ### Recommendations

  - ...
  ```

  ## Critical Patterns

  Financial display MUST use:
  ```tsx
  <MoneyAmount amount={cents(1050)} currency="CAD" colorize />
  ```

  NOT:
  ```tsx
  <span className="text-green-500">${(amount / 100).toFixed(2)}</span>
  ```
  ```

#### 7.3.2 rbac-validator.md

- [ ] Create `.claude/agents/review/rbac-validator.md`:
  ```markdown
  ---
  name: rbac-validator
  description: "Validates RBAC implementation against design-system permissions matrix"
  model: inherit
  context_files:
    - docs/design-system/05-governance/permissions-matrix.md
    - docs/design-system/05-governance/information-architecture.md
    - packages/types/src/rbac/
  ---

  You are an **RBAC Compliance Expert** for Akount.

  ## Your Role

  Verify that role-based access control is correctly implemented according to
  the design-system permissions matrix.

  ## Canonical Roles

  | Role | Description |
  |------|-------------|
  | OWNER | Full access, can transfer ownership |
  | ADMIN | Full access except ownership transfer |
  | ACCOUNTANT | Accounting access, can approve entries |
  | BOOKKEEPER | Day-to-day transactions only |
  | INVESTOR | View-only reports |
  | ADVISOR | View-only with notes |

  ## Permission Levels

  | Level | Meaning |
  |-------|---------|
  | HIDDEN | Cannot see (not in UI, API returns 403) |
  | VIEW | Read-only access |
  | ACT | Can create/update |
  | APPROVE | Can approve/lock |
  | ADMIN | Can configure |

  ## Validation Checklist

  ### Frontend Routes

  - [ ] proxy.ts/middleware.ts checks roles for protected routes
  - [ ] Admin routes (/system/users, /system/security) check OWNER/ADMIN
  - [ ] Accounting routes check OWNER/ADMIN/ACCOUNTANT
  - [ ] BOOKKEEPER cannot access /accounting/*
  - [ ] INVESTOR cannot access /banking/*

  ### Backend Routes

  - [ ] `withPermission()` middleware on all protected routes
  - [ ] Permission keys match design-system matrix
  - [ ] 403 returned for unauthorized access (not 404)

  ### UI Components

  - [ ] Sidebar filters nav items by role
  - [ ] Hidden routes not rendered (not just visually hidden)
  - [ ] Action buttons hidden for insufficient permissions

  ### Audit

  - [ ] RBAC denials logged to audit log
  - [ ] Logs include: userId, role, attempted resource, timestamp

  ## Per-Domain Validation

  ### Overview Domain
  | Resource | OWNER | ADMIN | ACCOUNTANT | BOOKKEEPER | INVESTOR | ADVISOR |
  |----------|-------|-------|------------|------------|----------|---------|
  | dashboard | VIEW | VIEW | VIEW | VIEW | VIEW | VIEW |
  | net-worth | VIEW | VIEW | VIEW | HIDDEN | VIEW | VIEW |

  ### Banking Domain
  | Resource | OWNER | ADMIN | ACCOUNTANT | BOOKKEEPER | INVESTOR | ADVISOR |
  |----------|-------|-------|------------|------------|----------|---------|
  | transactions | ACT | ACT | VIEW | ACT | HIDDEN | VIEW |
  | reconciliation | APPROVE | APPROVE | APPROVE | VIEW | HIDDEN | VIEW |

  ### Accounting Domain
  | Resource | OWNER | ADMIN | ACCOUNTANT | BOOKKEEPER | INVESTOR | ADVISOR |
  |----------|-------|-------|------------|------------|----------|---------|
  | journal-entries | APPROVE | APPROVE | APPROVE | HIDDEN | HIDDEN | VIEW |
  | chart-of-accounts | ADMIN | ADMIN | ACT | HIDDEN | HIDDEN | VIEW |

  ### System Domain
  | Resource | OWNER | ADMIN | ACCOUNTANT | BOOKKEEPER | INVESTOR | ADVISOR |
  |----------|-------|-------|------------|------------|----------|---------|
  | users | ADMIN | ADMIN | HIDDEN | HIDDEN | HIDDEN | HIDDEN |
  | audit-log | VIEW | VIEW | VIEW | HIDDEN | HIDDEN | HIDDEN |
  | security | ADMIN | ADMIN | HIDDEN | HIDDEN | HIDDEN | HIDDEN |

  ## Review Output Format

  ```
  ## RBAC Compliance Review

  ### Issues Found

  1. **[file:line]** - Route `/accounting/journal-entries` accessible to BOOKKEEPER
     - Expected: HIDDEN for BOOKKEEPER
     - Found: No role check, all authenticated users can access
     - Fix: Add `withPermission('accounting', 'journal-entries', 'VIEW')`

  ### Compliance Status

  - COMPLIANT: All permissions match matrix
  - NON-COMPLIANT: One or more mismatches

  ### Recommendations

  - ...
  ```
  ```

---

### 7.4 Update Agent Registry

- [ ] Update `.claude/agents/REGISTRY.json`:
  ```json
  {
    "agents": {
      "financial-data-validator": {
        "path": ".claude/agents/review/financial-data-validator.md",
        "category": "review",
        "tier": "sonnet"
      },
      "architecture-strategist": {
        "path": ".claude/agents/review/architecture-strategist.md",
        "category": "review",
        "tier": "sonnet"
      },
      "security-sentinel": {
        "path": ".claude/agents/review/security-sentinel.md",
        "category": "review",
        "tier": "sonnet"
      },
      "design-system-enforcer": {
        "path": ".claude/agents/review/design-system-enforcer.md",
        "category": "review",
        "tier": "sonnet"
      },
      "rbac-validator": {
        "path": ".claude/agents/review/rbac-validator.md",
        "category": "review",
        "tier": "sonnet"
      }
    }
  }
  ```

- [ ] Update `.claude/agents/review/README.md` to include new agents

---

### 7.5 Validate Agent Configuration

- [ ] Run validation script:
  ```bash
  bash .claude/hooks/validate-config.sh
  ```

- [ ] Test each agent manually:
  ```bash
  # Test design-system-enforcer
  # Create a file with intentional violations and verify detection

  # Test rbac-validator
  # Create a route without permission check and verify detection
  ```

---

## Verification Checklist

Before marking Phase 7 complete:

- [ ] All agents updated to use `docs/design-system/` paths
- [ ] No references to `docs/design-system/v1/` in agents
- [ ] financial-data-validator has UI component validation rules
- [ ] architecture-strategist has domain structure validation
- [ ] security-sentinel has RBAC validation rules
- [ ] design-system-enforcer.md created and registered
- [ ] rbac-validator.md created and registered
- [ ] REGISTRY.json updated with new agents
- [ ] review/README.md updated
- [ ] validate-config.sh passes

**Test:**
```bash
# Check for old paths
grep -r "design-system/v1" .claude/

# Run validation
bash .claude/hooks/validate-config.sh
```

---

## Completion

When Phase 7 is complete:

1. Update `docs/restructuring/README.md` - all phases ✅ COMPLETE
2. The restructure is DONE
3. All future work follows new structure

## Post-Restructure Maintenance

After restructure:
- New features reference `docs/design-system/03-screens/`
- New components follow `docs/design-system/01-components/`
- Code reviews use updated agents
- RBAC changes update permissions matrix first
