---
name: processes:README
description: Workflow Commands
aliases:
  - workflows
  - help
  - guide
  - processes-help
keywords:
  - workflows
  - processes
  - help
  - guide
  - documentation
---

# Workflow Commands

Structured workflows for systematic feature development, from exploration to implementation to review.

## Available Workflows

### 1. /processes:brainstorm

**Purpose:** Collaboratively explore feature ideas before implementation planning.

**When to use:**
- Unclear requirements
- Multiple possible approaches
- Need to explore edge cases
- Want to validate assumptions

**Output:** Brainstorm document in `docs/brainstorms/`

**Next step:** → `/processes:plan`

---

### 2. /processes:plan

**Purpose:** Transform feature descriptions into well-structured implementation plans.

**When to use:**
- Have clear feature description or brainstorm
- Ready to plan implementation details
- Need to break down complex features
- Want to document technical approach

**Output:** Implementation plan in `docs/plans/`

**Next step:** → `/processes:work`

---

### 3. /processes:work

**Purpose:** Execute implementation plans systematically while maintaining quality.

**When to use:**
- Have complete implementation plan
- Ready to write code and tests
- Need structured guidance through development
- Want to ship features completely

**Output:** Implemented feature with tests, ready for review

**Next step:** → `/processes:review`

---

### 4. /processes:review

**Purpose:** Perform comprehensive code reviews using multi-agent analysis.

**When to use:**
- Code is implemented and tested
- Ready for PR review
- Want to catch issues before human review
- Need multi-perspective analysis

**Output:** Detailed review findings with severity levels

**Next step:** Address findings, merge PR

---

### 5. /processes:eod

**Purpose:** End-of-day workflow to save progress, update documentation, and prepare for next session.

**When to use:**
- End of work day (daily or whenever wrapping up)
- Before starting a multi-day break
- Want to ensure nothing falls through cracks
- Need to organize session artifacts

**Output:**
- Updated STATUS.md, TASKS.md, ROADMAP.md
- Organized documentation (brainstorms → docs/brainstorms/, plans → docs/plans/)
- Committed and pushed changes to git
- Prepared task list for next session

**What it does:**
1. Reviews git status and identifies changes
2. Deletes temporary files (`*_errors.txt`, build artifacts)
3. Moves session artifacts to appropriate folders
4. Updates core documentation with today's progress
5. Stages, commits, and pushes to git
6. Creates handoff document for next session

**Next step:** Start fresh next session with clear context

---

## Complete Workflow Lifecycle

```
💡 Idea
   ↓
📝 /processes:brainstorm   → docs/brainstorms/
   ↓
📋 /processes:plan         → docs/plans/
   ↓
⚙️  /processes:work         → Feature implementation
   ↓
✅ /processes:review        → Code review findings
   ↓
🚀 Merge & Deploy
   ↓
🌙 /processes:eod           → Close session properly
   ↓
✨ Next session ready to go
```

### Daily Workflow (Recommended)

```
🌅 Start of Day
   → /processes:begin                    (Load context from yesterday)
   ↓
⚙️  Development with /processes:* tools   (Brainstorm → Plan → Work → Review)
   ↓
🌙 End of Day
   → /processes:eod                       (Save work, update docs, organize files)
   ↓
✨ Ready for next session
```

## Quick Start Examples

### Example 1: New Feature (Full Cycle)

```bash
# 1. Explore the idea
/processes:brainstorm invoice templates

# 2. Create implementation plan
/processes:plan invoice-templates

# 3. Execute the plan
/processes:work docs/plans/2026-01-30-feature-invoice-templates-plan.md

# 4. Review before merging
/processes:review #123
```

### Example 2: Bug Fix (Skip Brainstorm)

```bash
# 1. Plan the fix
/processes:plan fix-invoice-total-calculation

# 2. Implement
/processes:work docs/plans/2026-01-30-bugfix-invoice-calculation-plan.md

# 3. Review
/processes:review current-branch
```

### Example 3: Quick Improvement (Minimal Planning)

```bash
# 1. Quick plan
/processes:plan improve-loading-states

# 2. Implement
/processes:work docs/plans/2026-01-30-enhancement-loading-states-plan.md

# 3. Review
/processes:review .
```

### Example 4: Full Day Cycle

```bash
# Morning: Load context
/processes:begin

# Work: Use these as needed
/processes:brainstorm new-feature
/processes:plan new-feature
/processes:work docs/plans/2026-02-01-feature-new-feature-plan.md
/processes:review current-branch

# Evening: Close out
/processes:eod
```

## Workflow Decision Tree

```
Do you have clear requirements?
├─ No → /processes:brainstorm
│       └─ Do you have a concrete approach now?
│           ├─ Yes → /processes:plan
│           └─ No → Iterate on brainstorm
│
└─ Yes → /processes:plan
         └─ Is the plan complete?
             ├─ Yes → /processes:work
             │       └─ Is implementation done?
             │           ├─ Yes → /processes:review
             │           └─ No → Continue work
             │
             └─ No → Refine plan
```

## Best Practices

### Brainstorming
- ✓ Ask questions one at a time
- ✓ Explore 2-3 concrete approaches
- ✓ Consider multi-tenant implications
- ✓ Apply YAGNI principle
- ✗ Don't write code yet
- ✗ Don't skip edge cases

### Planning
- ✓ Be specific and actionable
- ✓ Include security from the start
- ✓ Consider performance at scale
- ✓ Plan for testing and rollout
- ✗ Don't skip security sections
- ✗ Don't forget tenant isolation

### Working
- ✓ Read entire plan first
- ✓ Test continuously
- ✓ Commit incrementally
- ✓ Follow existing patterns
- ✗ Don't add unplanned features
- ✗ Don't leave tests for the end

### Reviewing
- ✓ Run all relevant agents
- ✓ Categorize by severity
- ✓ Provide specific examples
- ✓ Block on critical issues
- ✗ Don't skip agent reviews
- ✗ Don't ignore security concerns

## Integration with Agents

Workflows automatically invoke specialized agents:

**During Planning:**
- Explore agent (codebase research)
- Best practices research (if needed)

**During Work:**
- Pattern matching from existing code
- Incremental validation

**During Review:**
- kieran-typescript-reviewer
- architecture-strategist
- code-simplicity-reviewer
- performance-oracle
- security-sentinel
- prisma-migration-reviewer (if applicable)
- financial-data-validator (if applicable)
- nextjs-app-router-reviewer (if applicable)

## Customization

### Adapting for Your Project

These workflows are designed for Akount's stack:
- Next.js 16+ (App Router)
- TypeScript
- Prisma + PostgreSQL
- Clerk Authentication
- Multi-tenant architecture

**To adapt for different stacks:**
1. Update tech stack references in commands
2. Adjust agent selections for review
3. Modify templates to match your conventions
4. Update security/performance criteria

### Adding Custom Workflows

Create new workflow commands in `.claude/commands/workflows/`:

```markdown
---
name: workflows:custom-workflow
description: Your custom workflow description
argument-hint: "[input description]"
---

# Workflow: Custom Workflow

[Your workflow steps here]
```

## Troubleshooting

### Workflow Stuck

**Issue:** Workflow isn't progressing

**Solutions:**
- Check if waiting for AskUserQuestion response
- Verify prerequisites are met
- Check git status is clean
- Ensure GitHub CLI authenticated

### Agent Not Running

**Issue:** Review agent not invoked

**Solutions:**
- Check agent file exists in `.claude/agents/`
- Verify agent name spelling
- Check file changes match agent conditions
- Try explicit agent invocation

### Plan Too Complex

**Issue:** Implementation plan overwhelming

**Solutions:**
- Run `/processes:plan` with MINIMAL detail level
- Break into multiple smaller plans
- Focus on MVP scope first
- Use brainstorm to simplify approach

## Tips for Success

1. **Don't Skip Steps:** Each workflow builds on the previous
2. **Document Decisions:** Capture rationale in brainstorm/plan
3. **Test Continuously:** Don't wait until the end
4. **Review Early:** Catch issues before they compound
5. **Iterate:** Plans are living documents, update as needed

## Getting Help

**Need workflow guidance?**
- Review the individual command documentation
- Check examples in this README
- Ask Claude to explain a specific workflow
- Refer to agent documentation in `.claude/agents/review/`

**Found an issue?**
- Document the problem
- Propose a solution
- Update the workflow command
- Share improvements with the team

---

**Remember:** These workflows are tools to help you move faster with confidence. Use them as guides, not rigid rules. Adapt as needed for your specific context.
