# Planning System Upgrade - Consolidated Overview

> **Created:** 2026-02-16
> **Purpose:** Executive summary of all gathered improvements for the planning system
> **Status:** Ready for review and prioritization

---

## Executive Summary

This consolidation brings together improvements from three sources to address the 57 findings from Phase 5 review:

1. **Core Upgrades** (7 hours, 5 sprints) - Template enhancements, pre-flight checklists, agent integration
2. **Additions** (20 items) - Session patterns, industry frameworks, domain checklists
3. **Article Insights** (15 hours, 8 patterns) - Risk-tier policy, auto-remediation, harness-gap loop

**Total Effort if All Integrated:** ~30 hours
**Expected Impact:**
- P0 findings: 7 → 0-1 (86% reduction)
- Total findings: 57 → 10-12 (65-80% reduction)

---

## Three Planning Documents

### 1. Main Upgrade Plan (7 hours)
📄 File: `2026-02-16-planning-system-upgrade.md` (1420 lines)

**Sprint 1: Planning Template Upgrade (2h)**
- Enhanced template v2 with mandatory sections
- Security Considerations checklist
- Performance Considerations checklist
- Cross-Domain Impact Analysis section
- Edge Cases requirement per task
- Infrastructure Requirements section

**Sprint 2: Pre-Flight Checklists (2h)**
- `.claude/rules/raw-sql-checklist.md` with `tenantScopedQuery` wrapper
- `.claude/rules/cache-design-checklist.md` with `BoundedCache` pattern
- `.claude/rules/multi-entity-checklist.md` for consolidation features

**Sprint 3: MEMORY Updates (1h)**
- Update `debugging-log.md` with 57 findings
- Create `planning-patterns.md` for reusable solutions

**Sprint 4: Agent Integration (1.5h)**
- Update agent prompts to reference new checklists
- Add cross-agent pattern detection

**Sprint 5: Validation & Rollout (0.5h)**
- Test on Phase 6 planning
- Document in workflows.md

### 2. Additions from Multiple Sources (20 items)
📄 File: `2026-02-16-planning-system-upgrade-ADDITIONS.md`

**Section 1: Onboarding Review Patterns (4 items)**
1. Cross-agent pattern detection (issues flagged by 2+ agents = high confidence)
2. Alternatives sections in review output
3. Architectural questions before implementation
4. Cross-domain smoke tests

**Section 2: Repeated Session Issues (6 items)**
1. Turbopack import pattern: `import type { X }` not `import { type X }`
2. Zod `.refine()` + `.partial()` incompatibility
3. apiClient obscures HTTP errors (need explicit error handling)
4. Duplicate seeding sources (consolidate to single source of truth)
5. Soft delete filter missing (add to Prisma query patterns)
6. Tenant isolation depth varies (document 1-hop, 2-hop, 3-hop patterns)

**Section 3: Industry Frameworks (3 items)**
1. Architecture Decision Records (ADRs) for major decisions
2. STRIDE threat modeling for security features
3. Pre-mortem analysis before major features

**Section 4: Domain-Specific Checklists (3 items)**
1. Next.js App Router checklist (loading.tsx, error.tsx, Server/Client boundaries)
2. Database migration checklist (3-phase pattern, soft delete preservation, backfill strategy)
3. Integration testing checklist (cross-domain flows, tenant isolation verification)

**Section 5: Process Improvements (3 items)**
1. Pre-planning exploration (Explore agent before writing plan)
2. Drift detection (compare plan vs implementation after completion)
3. Commit strategy guidelines (atomic commits, clear boundaries)

**Section 6: Tool Enhancements (1 item)**
1. Parallel agent execution for faster reviews

### 3. Article Insights from Ryan Carson (15 hours, 8 patterns)
📄 File: `2026-02-16-planning-system-upgrade-ARTICLE-INSIGHTS.md`

**Pattern 1: Machine-Readable Risk Contract (3h)**
- Create `.claude/risk-policy.json` with file-path risk tiers
- Define review policy per tier (critical = 3+ agents, max 0 P0s)
- Auto-select agents based on changed files

**Pattern 2: Preflight Gate (1h)**
- Run lightweight checks before expensive agents
- Block on policy violations (no agent execution if preflight fails)

**Pattern 3: Current-HEAD SHA Discipline (1h)**
- Track review validity by commit SHA
- Re-run reviews if commits occur after review

**Pattern 4: Auto-Remediation Loop (3h)**
- Create `/processes:auto-fix` skill
- Deterministic P1 fixes (missing loading.tsx, tenantId filter, etc.)
- Human approval before applying

**Pattern 5: Browser Evidence (2h)**
- E2E test manifests for critical UI flows
- Screenshot diffs for visual regressions

**Pattern 6: Harness-Gap Loop (2h)**
- Production regression → test case → coverage tracked
- `.claude/incidents/` directory for incident reports
- Link incidents to test additions

**Pattern 7: Deterministic Ordering (1h)**
- Strict phase sequence in `/processes:review`
- Preflight → Agents → Policy Gate → Remediation

**Pattern 8: Bot-Only Thread Resolution (2h)**
- Auto-resolve findings after verification
- GitHub integration for PR comments

---

## Recommended Priorities

Based on effort/impact ratio, here's a suggested phased rollout:

### Phase 1: Quick Wins (5 hours)
**Sprint 1 + Sprint 2 from Main Plan**
- Enhanced planning template (2h)
- Pre-flight checklists (2h)
- Repeated issues documentation (1h)

**Expected Impact:** 40% reduction in findings (57 → ~35)

### Phase 2: Process Integration (8 hours)
**Article Patterns 1, 3, 7 + Domain Checklists**
- Risk-tier policy (3h)
- SHA discipline (1h)
- Deterministic ordering (1h)
- Domain checklists (3h)

**Expected Impact:** Additional 30% reduction (35 → ~25)

### Phase 3: Advanced Automation (12 hours)
**Article Patterns 4, 5, 6 + Agent Enhancements**
- Auto-remediation loop (3h)
- Browser evidence (2h)
- Harness-gap loop (2h)
- Cross-agent detection (2h)
- Industry frameworks (3h)

**Expected Impact:** Additional 15% reduction (25 → ~10-12)

### Phase 4: Long-term Infrastructure (5 hours)
**Remaining items**
- Bot-only resolution (2h)
- Drift detection (1h)
- Parallel agents (1h)
- Validation & documentation (1h)

**Expected Impact:** Sustained low finding rate (10-12 maintained)

---

## Decision Matrix

To help prioritize, here's an impact/effort breakdown:

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| Enhanced planning template | 2h | High (addresses 35% of findings) | **P0** |
| Pre-flight checklists | 2h | High (addresses 25% of findings) | **P0** |
| Risk-tier policy | 3h | High (prevents wrong agent selection) | **P0** |
| Repeated issues docs | 1h | High (prevents recurring bugs) | **P1** |
| Domain checklists | 3h | Medium-High (catches edge cases) | **P1** |
| SHA discipline | 1h | Medium (prevents stale reviews) | **P1** |
| Auto-remediation loop | 3h | Medium (saves review time) | **P1** |
| Cross-agent detection | 2h | Medium (increases confidence) | **P2** |
| Industry frameworks | 3h | Medium (improves planning) | **P2** |
| Browser evidence | 2h | Medium (validates UI) | **P2** |
| Harness-gap loop | 2h | Medium (learns from prod) | **P2** |
| Deterministic ordering | 1h | Low-Medium (improves reliability) | **P2** |
| Drift detection | 1h | Low-Medium (quality check) | **P3** |
| Bot-only resolution | 2h | Low (nice-to-have) | **P3** |
| Parallel agents | 1h | Low (speed improvement) | **P3** |

---

## Implementation Strategy

### Option A: Full Integration (30 hours)
Implement all items across 4 phases. Best for long-term investment in planning quality.

**Pros:**
- Maximum finding reduction (65-80%)
- Addresses all root causes
- Sets up automated processes

**Cons:**
- Significant time investment
- May delay Phase 5/6 work

### Option B: Phased Rollout (Start with Phase 1: 5 hours)
Implement Quick Wins first, validate in Phase 6, then decide on Phase 2.

**Pros:**
- Fast initial improvement (40% reduction)
- Lower risk (test before full commitment)
- Can continue Phase 5/6 in parallel

**Cons:**
- Misses some high-impact items (risk-tier policy)
- May need multiple iterations

### Option C: Cherry-Pick Critical Items (8 hours)
Select only P0 items from decision matrix.

**Pros:**
- Fastest path to major improvement
- Focuses on highest-impact changes

**Cons:**
- Leaves some root causes unaddressed
- May still see 20-25 findings in next phase

---

## Next Steps

1. **Review Decision Matrix** - Which priority level makes sense? (P0 only, P0+P1, or full)
2. **Choose Implementation Strategy** - Option A, B, or C?
3. **Schedule Work** - Before Phase 5, before Phase 6, or separate sprint?
4. **Validate Approach** - Test on Phase 6 planning cycle

---

## Files Reference

All planning documents are in `docs/plans/`:

- `2026-02-16-planning-system-upgrade.md` - Main plan (1420 lines)
- `2026-02-16-planning-system-upgrade-ADDITIONS.md` - Additional improvements (20 items)
- `2026-02-16-planning-system-upgrade-ARTICLE-INSIGHTS.md` - Article patterns (8 patterns)
- `2026-02-16-planning-system-upgrade-CONSOLIDATED.md` - This document

Root cause analysis in:
- `docs/process-improvements-2026-02-16.md` - Full analysis of 57 findings

---

**Ready for user review and prioritization.**