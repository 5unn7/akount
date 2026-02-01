# Agent Model Tiering Guide

**Last Updated:** 2026-02-01
**Strategy:** Conservative cost optimization while maintaining quality

---

## Overview

This guide documents the model tier assignments for all agents in the Akount project. Agents are assigned to tiers based on task complexity, risk level, and quality requirements.

**Core Principle:** Only downgrade agents where quality is guaranteed to remain high. When in doubt, stay on Sonnet 4.5.

---

## Tier Definitions

### Tier 1 - Haiku (~85% cheaper than Tier 3)
**Model:** `claude-haiku-4-20250101`

**Use for:**
- Simple pattern matching
- Read-only exploration (git log, file structure)
- Basic YAGNI checks
- Pattern detection without complex reasoning

**Characteristics:**
- No financial calculations
- No security decisions
- No complex architectural reasoning
- Fast, simple, low-risk tasks

**Quality Assurance:**
- Test output quality after assignment
- Rollback to Sonnet 4.5 if quality drops
- Monitor for 1 week before expanding

---

### Tier 2 - Sonnet 3.7 (~50% cheaper than Tier 3)
**Model:** `claude-sonnet-3-7-20250219`

**Use for:**
- Standard validation tasks
- Moderate complexity analysis
- Quality checks (brand, design, tests, a11y)
- Framework-specific reviews

**Characteristics:**
- Requires reasoning but not critical
- Non-financial, non-security tasks
- Moderate complexity
- Good balance of cost and quality

**Status:** FUTURE (not implemented in Phase 2)
- After 1 week of Tier 1 success
- Expand to 5-7 additional agents
- Expected additional savings: 20-25%

---

### Tier 3 - Sonnet 4.5 (Baseline cost)
**Model:** `claude-sonnet-4-5-20250929` or `inherit`

**Use for:**
- Financial data validation
- Security audits
- Architecture decisions
- Database schema changes
- Performance optimization
- All critical reviews

**Characteristics:**
- Highest reasoning capability
- Critical financial/security tasks
- Complex architectural analysis
- No tolerance for errors

**Mandate:** Keep all critical agents here indefinitely.

---

## Current Tier Assignments (Phase 2)

### Tier 1 - Haiku (4 agents)

#### Research Agents (2)
1. **git-history-analyzer**
   - Task: Reading git log, blame, shortlog
   - Complexity: Low (just parsing git output)
   - Risk: None (read-only)
   - Rationale: Simple text analysis, no complex reasoning

2. **repo-research-analyst**
   - Task: Exploring file structure, finding patterns
   - Complexity: Low (file/directory traversal)
   - Risk: None (read-only)
   - Rationale: Basic pattern search, no financial/security implications

#### Review Agents (2)
3. **code-simplicity-reviewer**
   - Task: YAGNI checks, identifying over-engineering
   - Complexity: Low (pattern matching)
   - Risk: Low (suggestions only, final decision by humans)
   - Rationale: Simple "this is unnecessary" detection

4. **pattern-recognition-specialist**
   - Task: Detecting patterns and anti-patterns
   - Complexity: Low (pattern matching)
   - Risk: Low (consistency checks)
   - Rationale: Basic pattern detection, no financial/security risk

---

### Tier 3 - Sonnet 4.5 (17 agents)

**All other agents remain on Sonnet 4.5 for maximum quality:**

#### Critical Financial Agents (2)
- **financial-data-validator** - Double-entry bookkeeping, money precision
- **prisma-migration-reviewer** - Schema changes, data integrity

#### Critical Security Agents (2)
- **security-sentinel** - OWASP vulnerabilities, attack vectors
- **clerk-auth-reviewer** - Authentication/authorization logic

#### Architecture & Design Agents (3)
- **architecture-strategist** - System design decisions
- **turborepo-monorepo-reviewer** - Monorepo structure validation
- **nextjs-app-router-reviewer** - App Router patterns

#### Framework & Performance Agents (3)
- **fastify-api-reviewer** - API design patterns
- **performance-oracle** - Performance bottlenecks, N+1 queries
- **kieran-typescript-reviewer** - Strict TypeScript enforcement

#### Data & Deployment Agents (2)
- **data-migration-expert** - Data transformation safety
- **deployment-verification-agent** - Go/No-Go checklists

#### Research Agents (2)
- **framework-docs-researcher** - External documentation research
- **best-practices-researcher** - Industry standards validation

#### Supporting Agents (3)
- **pr-comment-resolver** - PR feedback implementation
- **bug-reproduction-validator** - Issue validation
- **repo-research-analyst** - Thorough codebase research

---

## Expected Savings

### Phase 2 (Current)
- **Agents downgraded:** 4 of 21 (19%)
- **Expected savings:** 10-15% overall
- **Quality risk:** Very low (conservative approach)

### Phase 3 (Future - After 1 Week)
- **Additional agents to Tier 2:** 5-7 agents
- **Expected additional savings:** 20-25%
- **Total savings potential:** 30-40%
- **Requires:** Successful Phase 2 validation

---

## Rollback Plan

### If Quality Drops for ANY Tier 1 Agent:

1. **Immediate Action:**
   ```yaml
   # Revert agent file
   model: claude-sonnet-4-5-20250929  # Restore quality
   ```

2. **Document:**
   - What quality issue occurred
   - Which agent was affected
   - Example of poor output

3. **Update This Guide:**
   - Move agent back to Tier 3
   - Add note about why downgrade failed
   - Adjust expected savings

### Rollback Checklist
- [ ] Agent restored to Sonnet 4.5
- [ ] Issue documented
- [ ] TIERING-GUIDE.md updated
- [ ] Team notified

---

## Evaluation Criteria

### Week 1 Evaluation (After Phase 2)

**For each Tier 1 agent, check:**
- [ ] Output quality comparable to Sonnet 4.5?
- [ ] No critical mistakes or oversights?
- [ ] Execution speed acceptable?
- [ ] User satisfaction maintained?

**If ALL checks pass:**
→ Proceed to Phase 3 (expand to Tier 2)

**If ANY checks fail:**
→ Rollback affected agent(s)
→ Re-evaluate strategy

---

## Phase 3 Expansion Candidates (Future)

**Potential Tier 2 (Sonnet 3.7) agents:**

1. **pr-comment-resolver** - Moderate complexity, non-critical
2. **bug-reproduction-validator** - Standard testing, no financial risk
3. **turborepo-monorepo-reviewer** - Config validation, moderate complexity
4. **fastify-api-reviewer** - API patterns, non-financial
5. **framework-docs-researcher** - Documentation fetching
6. **best-practices-researcher** - Industry standards lookup

**Criteria for Phase 3:**
- No financial calculations
- No security-critical decisions
- Moderate reasoning required
- Errors are recoverable

**Do NOT move to Tier 2:**
- financial-data-validator (always Tier 3)
- security-sentinel (always Tier 3)
- prisma-migration-reviewer (always Tier 3)
- architecture-strategist (always Tier 3)
- performance-oracle (always Tier 3)

---

## Decision Tree for New Agents

```
Is this agent financial or security-critical?
  └─ YES → Tier 3 (Sonnet 4.5)
  └─ NO ↓

Does it make architectural decisions?
  └─ YES → Tier 3 (Sonnet 4.5)
  └─ NO ↓

Does it require complex reasoning?
  └─ YES → Tier 2 (Sonnet 3.7)
  └─ NO ↓

Is it mostly pattern matching or read-only?
  └─ YES → Tier 1 (Haiku)
  └─ NO → Tier 2 (Sonnet 3.7)
```

---

## Monitoring Plan

### Week 1 (Phase 2)
- Run reviews with all 4 Tier 1 agents
- Compare output quality to previous reviews
- Document any issues
- Make rollback decisions

### Week 2 (Phase 3 - If Successful)
- Expand to 5-7 Tier 2 agents
- Continue monitoring Tier 1 agents
- Track cost savings
- Validate quality maintained

### Ongoing
- Monthly review of tier assignments
- Adjust based on actual usage patterns
- Consider promoting/demoting agents as needed

---

## Cost Calculation

**Baseline (All Sonnet 4.5):**
- 21 agents × 100% cost = 2100 cost units

**Phase 2 (4 Haiku):**
- 4 agents × 15% cost = 60 cost units
- 17 agents × 100% cost = 1700 cost units
- **Total:** 1760 cost units
- **Savings:** 16% (340 units)

**Phase 3 (4 Haiku + 6 Sonnet 3.7):**
- 4 agents × 15% cost = 60 cost units
- 6 agents × 50% cost = 300 cost units
- 11 agents × 100% cost = 1100 cost units
- **Total:** 1460 cost units
- **Savings:** 30% (640 units)

---

## Notes & Learnings

### 2026-02-01: Initial Implementation
- Downgraded 4 agents to Haiku (conservative approach)
- Chose lowest-risk agents: git-history-analyzer, repo-research-analyst, code-simplicity-reviewer, pattern-recognition-specialist
- Expected 10-15% savings with minimal quality risk
- Evaluation period: 1 week

### Future Notes
(Add learnings from each phase here)

---

**End of Tiering Guide**

**Remember:** Quality > Cost. When in doubt, use Sonnet 4.5. Only optimize when quality is guaranteed.
