# Review File Structure Migration

**Date:** 2026-02-17
**Issue:** Review agents were overwriting the same file, causing collisions and making it hard for EOD/Audit agents to quickly scan findings.

---

## Changes Made

### 1. New Directory Structure

**Before:**
```
.reviews/
├── SYNTHESIS.md          # All agents wrote here (collision!)
├── financial.md
├── architecture.md
└── ...
```

**After:**
```
docs/reviews/
├── README.md                        # Archive index
├── {feature-name}/                  # One directory per review
│   ├── SUMMARY.md                   # Quick scan overview (NEW!)
│   ├── DETAILED.md                  # Full findings
│   ├── agents/                      # Individual agent reports
│   │   ├── financial.md
│   │   ├── architecture.md
│   │   ├── security.md
│   │   ├── performance.md
│   │   ├── fastify.md
│   │   └── nextjs.md
│   └── changed-files.txt
└── .template/                       # Template for future reviews
    ├── SUMMARY.md
    └── README.md

.reviews/                            # Temporary workspace (gitignored)
├── .gitignore                       # Ignore all except README
├── README.md                        # Explains purpose
└── (agents write here during review, files not committed)
```

### 2. SUMMARY.md — Quick Scan for EOD/Audit

**Purpose:** Allow EOD and Audit agents to get high-level overview in <10 seconds without reading full synthesis.

**Contents:**
- Executive summary table (verdict, counts, effort)
- At-a-glance metrics (P0/P1/P2 counts)
- Top 5 findings (must fix)
- High-confidence issues (3+ agents agree)
- Architecture strengths
- Fix timeline (before merge, before production, Phase N)
- Links to detailed findings and agent reports

**Size:** ~150 lines (vs ~230 lines for full synthesis)

### 3. File Location Updates

Updated documentation:
- [CLAUDE.md](../../CLAUDE.md) — Added code reviews to File Locations table
- [.claude/rules/workflows.md](../../.claude/rules/workflows.md) — Noted `/processes:review` outputs to `docs/reviews/{feature}/`

### 4. `.reviews/` Workspace

- **Purpose:** Temporary workspace for agents during review (prevents merge conflicts)
- **Gitignored:** Files are not committed
- **Workflow:**
  1. Agents write here during `/processes:review`
  2. Synthesis process creates final structure in `docs/reviews/{feature}/`
  3. `.reviews/` is cleared before next review

---

## Benefits

1. **No more collisions:** Each review gets its own directory
2. **Quick scanning:** EOD/Audit agents read SUMMARY.md (~150 lines) instead of full synthesis (~230 lines + 6 agent reports)
3. **Better organization:** Clear separation between workspace (`.reviews/`) and archive (`docs/reviews/`)
4. **Historical record:** All reviews preserved in `docs/reviews/` with consistent structure
5. **Template for future:** `.template/` provides starting point for next review

---

## Migration Checklist

- [x] Create `docs/reviews/` structure
- [x] Create `phase5-reports/` example with SUMMARY.md
- [x] Copy agent reports to `agents/` subdirectory
- [x] Update CLAUDE.md file locations table
- [x] Update workflows.md with new output location
- [x] Create `.reviews/.gitignore` and README
- [x] Create `.template/` for future reviews
- [x] Update `docs/reviews/README.md` with current reviews

---

## Example: Phase 5 Reports Review

See [phase5-reports/](./phase5-reports/) for the first review using this structure:
- **SUMMARY.md** — 150 lines, quick scan (5 P0s, 13 P1s, 26 P2s)
- **DETAILED.md** — 230 lines, full synthesis with code examples
- **agents/** — 6 agent reports (~25KB each, ~153KB total)

---

*This migration ensures EOD/Audit agents can quickly assess review findings without reading full details.*
