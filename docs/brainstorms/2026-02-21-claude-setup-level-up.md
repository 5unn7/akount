# Claude Code Setup Level-Up Plan

**Date:** 2026-02-21
**Objective:** Transform "should follow" into "must follow" via automation, surfacing, and enforcement

---

## Current State Assessment

**Grade: A- (Top 5%)**

**Strengths:**
- ✅ Hierarchical context architecture (root + directory-specific + modular rules)
- ✅ MEMORY.md with topic files (navigable, maintainable)
- ✅ 9 Key Invariants (precisely the right constraints for financial SaaS)
- ✅ Atomic task IDs via file-based locking (race condition prevention)
- ✅ Multi-agent coordination ("Active Now" table, task enrichments)
- ✅ Pre-flight mantra (cultural norm-setting)

**Growth Opportunities:**
- ⚠️ Cost visibility (no token tracking, no model routing automation)
- ⚠️ Enforcement gaps (rules exist but aren't always mandatory)
- ⚠️ Learning loop (insights captured but don't always feed back)
- ⚠️ Task enrichment is manual (files, verification, acceptance criteria)
- ⚠️ Investigation protocol is "please follow" not enforced

---

## Upgrade Roadmap

### 1. Cost Optimization Integration

**Problem:** No visibility into token usage, no automatic model routing, no budget warnings.

**Solution:** Session cost tracking + auto-routing signals

**Deliverables:**

- [ ] **Session Token Tracker** (`.claude/session-cost.json`)
  - Track tokens per tool call (Read, Grep, Task, etc.)
  - Track cumulative session cost
  - Identify expensive operations (full file reads, large Grep results)

- [ ] **Auto-Model Router**
  - Detect "Haiku-friendly" operations (file searches, simple edits, git ops)
  - Auto-suggest `/fast` when applicable
  - Warn when Opus used for trivial operations

- [ ] **Cost Dashboard in `/processes:begin`**
  ```
  💰 Session Cost (Last 3 Sessions)
  ├─ 2026-02-21 AM: 1.2M tokens ($4.80 est.)
  ├─ 2026-02-20 PM: 890K tokens ($3.56 est.)
  └─ 2026-02-20 AM: 450K tokens ($1.80 est.) ⚡ Efficient!

  💡 Tips:
  - Use /fast for searches (saves ~60% cost)
  - Use offset/limit for large files (saves ~40% tokens)
  ```

- [ ] **Budget Warnings**
  - Alert when session exceeds 500K tokens
  - Alert when single tool call exceeds 100K tokens
  - Monthly cost projections based on current usage

**Implementation:**

1. Create `.claude/scripts/track-session-cost.js` (logs tool calls to session-cost.json)
2. Add cost section to `/processes:begin` (reads session-cost.json)
3. Add budget check hook (warns on high-cost operations)
4. Update workflows.md with auto-routing signals

**Estimated Impact:** 20-30% cost reduction via awareness + routing

---

### 2. Auto-Enrichment for Tasks

**Problem:** Task enrichments (files, verification, acceptance criteria) are manual. High hallucination risk without them.

**Solution:** Auto-generate enrichments from git history + semantic analysis

**Deliverables:**

- [ ] **File Auto-Detection**
  - When task created in domain X (e.g., "banking"), check `git log --name-only` for recent banking/ files
  - Extract most-changed files for that domain in last 30 days
  - Auto-populate `files` array in task enrichment

- [ ] **Verification Command Generation**
  - Based on task type (bug fix, feature, refactor), suggest verification:
    - Bug fix: `npm test -- <related-test>`
    - Feature: `Grep "new-function-name" apps/`
    - Refactor: `git diff HEAD~1 -- <files>`
  - Auto-populate `verification` field

- [ ] **Acceptance Criteria Extraction**
  - Parse task description for "should", "must", "needs to"
  - Extract as bullet points for `acceptanceCriteria`
  - Example: "Add rate limiting" → "[ ] Rate limits enforced on POST/PUT/DELETE"

- [ ] **Hallucination Risk Score**
  - Score tasks 0-100 based on:
    - Has `files`? (-30 risk)
    - Has `verification`? (-20 risk)
    - Has `acceptanceCriteria`? (-20 risk)
    - Domain matches recent work? (-15 risk)
    - Effort <1h? (-15 risk, simpler = safer)
  - Flag tasks >60 risk as "⚠️ High hallucination risk - investigate before coding"

**Implementation:**

1. Create `.claude/scripts/enrich-task.js` (auto-enrichment logic)
2. Integrate into task creation flow (reserve-task-ids.js → enrich-task.js → approval)
3. Update TASKS.md template to show risk score
4. Add hallucination risk column to task index

**Estimated Impact:** 40% fewer off-track implementations

---

### 3. Investigation Protocol Enforcement

**Problem:** product-thinking.md protocol is "please follow" — not mandatory.

**Solution:** Hook-based enforcement + MEMORY search validation

**Deliverables:**

- [ ] **Pre-Code Hook** (`.claude/hooks/pre-code-check.sh`)
  - Triggers when agent about to edit code (detects Write/Edit tool use)
  - Checks if MEMORY topic files were searched this session
  - Checks if related patterns were Grep'd
  - **Blocks commit** if investigation steps skipped

- [ ] **Investigation Checklist in TodoWrite**
  - When agent creates implementation todos, auto-prepend investigation steps:
    ```
    [ ] Search MEMORY for prior learnings
    [ ] Grep for existing patterns
    [ ] Read affected files
    [ ] Identify dependents
    [ ] Check domain adjacency map
    [ ] Apply review lens
    ```
  - Mark each complete before proceeding to code

- [ ] **Session Investigation Report**
  - At `/processes:end-session`, generate report:
    ```
    🔍 Investigation Quality
    ├─ MEMORY searched: ✅ (3 topic files)
    ├─ Patterns verified: ✅ (5 Grep calls)
    ├─ Files read before edit: ✅ (8/8 files)
    ├─ Domain impact checked: ⚠️ (Banking touched, Accounting not checked)
    └─ Review lens applied: ✅

    Grade: A- (Domain adjacency check missed)
    ```

**Implementation:**

1. Create `.claude/hooks/pre-code-check.sh` (validates investigation steps)
2. Update TodoWrite templates to include investigation checklist
3. Add investigation tracking to session-context.sh
4. Generate investigation report in `/processes:end-session`

**Estimated Impact:** 50% fewer "why did I change that?" post-mortems

---

### 4. Design Token Validation Tooling

**Problem:** Token mapping exists in docs, but no runtime enforcement. Hardcoded colors slip through.

**Solution:** Pre-commit hooks + ESLint plugin + coverage reports

**Deliverables:**

- [ ] **Pre-Commit Hook** (`.claude/hooks/design-token-check.sh`)
  - Grep for hardcoded color patterns: `text-\[#`, `bg-\[#`, `bg-\[rgba`
  - **Block commit** if found
  - Suggest correct token (e.g., `text-[#34D399]` → "Use text-ak-green")

- [ ] **ESLint Plugin** (`packages/eslint-config/rules/no-hardcoded-colors.js`)
  - Lint rule: ban className strings matching `/(text|bg|border)-\[#/`
  - Auto-fix: suggest token replacement from globals.css
  - Integrate into CI pipeline

- [ ] **Token Coverage Report** (`.claude/scripts/design-token-coverage.js`)
  - Scan all .tsx files in apps/web/
  - Count hardcoded colors vs token usage
  - Generate report:
    ```
    🎨 Design Token Coverage
    ├─ Total color usages: 1,234
    ├─ Using tokens: 1,198 (97.1%) ✅
    ├─ Hardcoded: 36 (2.9%) ⚠️
    └─ Goal: 100%

    Top offenders:
    - apps/web/src/components/legacy/old-card.tsx (12 hardcoded)
    - apps/web/src/app/(dashboard)/insights/page.tsx (8 hardcoded)
    ```

- [ ] **Token Auto-Fixer** (`.claude/scripts/fix-hardcoded-colors.js`)
  - Parse hardcoded colors
  - Match to closest token in globals.css (color distance algorithm)
  - Auto-replace with token
  - Generate PR for review

**Implementation:**

1. Create design-token-check.sh hook (grep + block)
2. Build ESLint rule (regex + auto-fix)
3. Write coverage reporter (AST parser)
4. Build auto-fixer (color matching + replacement)
5. Add to CI pipeline (fail PR if coverage drops)

**Estimated Impact:** 100% token compliance within 2 weeks

---

### 5. Session Learning Auto-Routing

**Problem:** `/processes:end-session` captures learnings, but they don't auto-route to MEMORY topic files.

**Solution:** Semantic routing + one-click append

**Deliverables:**

- [ ] **Learning Classifier** (`.claude/scripts/classify-learning.js`)
  - Parse "Patterns Discovered" and "Bugs Fixed" sections
  - Classify into topic files:
    - API-related → `api-patterns.md`
    - Bug fix → `debugging-log.md`
    - Gotcha/quirk → `codebase-quirks.md`
    - Figma → `figma-mcp-tips.md`
    - Workflow → `workflow-optimizations.md`
  - Suggest routing with confidence score

- [ ] **One-Click Append UI** (in `/processes:end-session` output)
  ```
  📚 Learnings Captured (3)

  1. "EntityFormSheet uses trigger pattern, not open/close props"
     → Suggested: codebase-quirks.md (95% confidence)
     → [Append] [Edit] [Skip]

  2. "Prisma migration ordering: indexes after columns"
     → Suggested: api-patterns.md (88% confidence)
     → [Append] [Edit] [Skip]

  3. "Zod limit validation causes 400 if frontend exceeds schema max()"
     → Suggested: debugging-log.md (92% confidence)
     → [Append] [Edit] [Skip]
  ```

- [ ] **MEMORY Freshness Score**
  - Track when each topic file was last updated
  - Alert if >7 days since last update (stale memory risk)
  - Suggest re-review of recent sessions for missed learnings

- [ ] **Learning Deduplication**
  - Before appending, check if similar learning already exists
  - Use fuzzy string matching (Levenshtein distance)
  - Suggest merge instead of duplicate

**Implementation:**

1. Create classify-learning.js (keyword extraction + topic matching)
2. Update `/processes:end-session` to call classifier
3. Add AskUserQuestion for routing approval (Append/Edit/Skip)
4. Create memory-freshness-check.js (alerts on stale files)
5. Build deduplication checker (fuzzy matching)

**Estimated Impact:** 80% of learnings automatically routed vs 20% today

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Session cost tracker + dashboard
- [ ] Auto-enrichment for tasks (files + verification)
- [ ] Design token pre-commit hook

**Goal:** Immediate cost savings + token compliance

### Phase 2: Enforcement (Week 2)
- [ ] Investigation protocol hook
- [ ] ESLint token validation
- [ ] Hallucination risk scoring

**Goal:** Prevent bad patterns from entering codebase

### Phase 3: Intelligence (Week 3)
- [ ] Learning classifier + auto-routing
- [ ] Token coverage reporter
- [ ] MEMORY freshness tracking

**Goal:** Self-improving system

### Phase 4: Polish (Week 4)
- [ ] Token auto-fixer
- [ ] Investigation quality reports
- [ ] Budget projections + optimization tips

**Goal:** Production-grade developer experience

---

## Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Cost per session | Unknown | <$3 avg | session-cost.json tracking |
| Hardcoded colors | ~36 (2.9%) | 0 (100% tokens) | Token coverage report |
| Task hallucination rate | ~20% | <5% | Track "off-track" implementations |
| Investigation steps completed | ~60% | >90% | Pre-code-check.sh logs |
| Learnings auto-routed | ~20% | >80% | End-session routing acceptance rate |
| MEMORY staleness | Unknown | <7 days | Freshness checker alerts |

---

## Quick Wins (Ship Today)

1. **Design Token Hook** (30 min) — grep + block, instant compliance
2. **Cost Tracker** (1 hour) — log tool calls to JSON, add to /processes:begin
3. **Hallucination Risk Scoring** (1 hour) — score tasks on files/verification/criteria

**Rationale:** These three deliver immediate value with minimal implementation effort.

---

## Long-Term Vision (6 Months)

- **Self-Learning System:** Every session automatically updates MEMORY, no manual routing
- **Cost Optimization Autopilot:** System auto-routes to Haiku for 70% of operations
- **Zero-Hallucination Tasks:** All tasks have files, verification, acceptance criteria auto-generated
- **Proactive Quality Gates:** Hooks catch 95% of anti-patterns before commit
- **Investigation Quality Dashboard:** Real-time scoring of agent behavior, auto-suggest corrections

**The Test:** Can a new agent pick up a task cold and execute it safely with 90%+ confidence?

**Answer after Level-Up:** YES, with atomic guarantees.

---

_~270 lines. This is the playbook._
