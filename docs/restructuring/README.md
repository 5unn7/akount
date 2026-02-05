# Akount Restructuring

**Date:** 2026-02-04
**Status:** ✅ COMPLETE (2026-02-05)

---

## Overview

This folder contains detailed execution plans for restructuring Akount with `docs/` as the canonical source of truth.

## Source of Truth Hierarchy

```
docs/                              <- THE source of truth
├── restructuring/                 <- Phase execution plans (YOU ARE HERE)
├── design-system/                 <- UI/UX vision
├── standards/                     <- Implementation rules
├── architecture/                  <- Technical decisions
└── product/                       <- Product vision
```

## Phase Files

| File | Phase | Days | Status | Parallel Group |
|------|-------|------|--------|----------------|
| [phase-0-audit.md](./phase-0-audit.md) | Pre-Restructure Audit | 1-2 | ✅ COMPLETE | A (Sequential) |
| [phase-1-foundation.md](./phase-1-foundation.md) | Foundation Setup | 3-4 | ✅ COMPLETE | A (Sequential) |
| [phase-2-ui-components.md](./phase-2-ui-components.md) | packages/ui/ Bootstrap | 5-10 | ✅ COMPLETE | B (Parallel) |
| [phase-3-security.md](./phase-3-security.md) | Security Foundation | 5-8 | ✅ COMPLETE | B (Parallel) |
| [phase-4-api-restructure.md](./phase-4-api-restructure.md) | API Domain Restructure | 9-14 | ✅ COMPLETE | C (Parallel) |
| [phase-5-web-restructure.md](./phase-5-web-restructure.md) | Web Domain Restructure | 9-14 | ✅ COMPLETE | C (Parallel) |
| [phase-6-docs-cleanup.md](./phase-6-docs-cleanup.md) | Documentation Cleanup | 9-12 | ✅ COMPLETE | C (Parallel) |
| [phase-7-agents-update.md](./phase-7-agents-update.md) | Agent Instruction Updates | 15-16 | ✅ COMPLETE | D (Final) |

## Parallel Execution Groups

```
Week 1:     [Phase 0] → [Phase 1]
Week 2:     [Phase 2] ←→ [Phase 3]
Week 3-4:   [Phase 4] ←→ [Phase 5] ←→ [Phase 6]
Week 5:     [Phase 7]
```

**Estimated Timeline:**
- With parallel execution: **16 days (~128 hours)**
- Sequential: **28 days (~220 hours)**

## How to Use

1. **Start with Phase 0** (required before all others)
2. **Complete Phase 1** (depends on Phase 0)
3. **Run Phases 2-3 in parallel** (independent of each other)
4. **Run Phases 4-6 in parallel** (after Phase 1, can overlap with end of 2-3)
5. **Complete Phase 7** (after Phase 6 is done)

## Status Legend

- ⬜ TODO - Not started
- 🔄 IN PROGRESS - Currently being worked on
- ✅ COMPLETE - Finished and verified
- ⏸️ BLOCKED - Waiting on dependency

## Governance

Each phase file contains:
- Clear objectives
- Step-by-step tasks with checkboxes
- Files to create/modify/delete
- Verification steps
- Dependencies on other phases

**Rule:** Update the status in this README when starting/completing phases.
