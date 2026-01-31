# Compound Engineering - Implementation Action Plan

**Goal:** Transform Akount development to follow compound engineering principles where each unit of work makes subsequent work easier.

**Timeline:** 4 weeks to full implementation

---

## Week 1: Install Core Research & Workflow Agents

### Day 1-2: Research Agents (Foundation for Learning)

Install these agents from the compound-engineering plugin:

```bash
# These agents help you learn best practices for your tech stack
claude-code marketplace install best-practices-researcher
claude-code marketplace install framework-docs-researcher
claude-code marketplace install git-history-analyzer
claude-code marketplace install repo-research-analyst
```

**Test them:**
```bash
# Ask about Next.js patterns
claude-code "Use framework-docs-researcher to find Next.js 16 App Router data fetching patterns"

# Ask about your codebase
claude-code "Use repo-research-analyst to analyze our API route structure and conventions"
```

### Day 3-4: Workflow Agents (Systematic Development)

```bash
# These improve your daily workflow
claude-code marketplace install bug-reproduction-validator
claude-code marketplace install pr-comment-resolver
claude-code marketplace install pattern-recognition-specialist
```

**Test them:**
```bash
# Validate a bug report
claude-code "Use bug-reproduction-validator to reproduce the auth issue in #123"

# Find patterns in your code
claude-code "Use pattern-recognition-specialist to identify common patterns in our API routes"
```

### Day 5: Data Safety Agents (Critical for Financial App)

```bash
# Install data safety agents
claude-code marketplace install data-migration-expert
claude-code marketplace install deployment-verification-agent
```

**Test them:**
```bash
# Before a migration
claude-code "Use deployment-verification-agent to create a Go/No-Go checklist for the new Prisma migration"
```

### Weekend: Verify Week 1

- [ ] All 9 agents installed and tested
- [ ] Team familiar with when to use each agent
- [ ] Documented example usage for team

---

## Week 2: Create Custom Agents for Your Stack

### Day 1: Fastify API Reviewer

1. Create `.claude/agents/review/fastify-api-reviewer.md`
2. Copy template from `CUSTOM_AGENTS_TEMPLATES.md`
3. Customize for your API patterns
4. Test on existing API routes

```bash
# Test it
claude-code "Use fastify-api-reviewer to review apps/api/src/routes/entities.ts"
```

### Day 2: Clerk Auth Reviewer

1. Create `.claude/agents/review/clerk-auth-reviewer.md`
2. Copy template and customize
3. Test on auth middleware and protected routes

```bash
# Test it
claude-code "Use clerk-auth-reviewer to review our authentication implementation"
```

### Day 3: Turborepo Monorepo Reviewer

1. Create `.claude/agents/review/turborepo-monorepo-reviewer.md`
2. Copy template and customize
3. Test on package.json and imports

```bash
# Test it
claude-code "Use turborepo-monorepo-reviewer to review our monorepo structure"
```

### Day 4: Optional Reviewers

**Choose based on priority:**

Option A: Create `tailwind-css-reviewer.md` if design consistency is important
Option B: Create `react-server-components-reviewer.md` if you have RSC complexity
Option C: Enhance existing `nextjs-app-router-reviewer.md` instead

### Day 5: Update Review Workflow

1. Update `.claude/agents/review/README.md` with new agents
2. Update `.claude/commands/workflows/review.md` to include them
3. Test full review workflow

```bash
# Test complete review
/workflows:review
```

### Weekend: Verify Week 2

- [ ] 3-4 custom agents created
- [ ] All agents tested individually
- [ ] Integrated into `/workflows:review`
- [ ] Team trained on new agents

---

## Week 3: Add Utility Commands & Workflows

### Day 1-2: Install Utility Commands

```bash
# High-value utilities
claude-code marketplace install /changelog
claude-code marketplace install /deepen-plan
claude-code marketplace install /plan_review
claude-code marketplace install /resolve_pr_parallel
claude-code marketplace install /triage
```

### Day 3: Install Missing Workflow Command

```bash
# Complete the workflow cycle
claude-code marketplace install /workflows:compound
```

**Set up compound docs:**
```bash
# Create directory structure
mkdir -p docs/learnings/{architecture,api,frontend,database,security,performance,bugs}

# Create index
touch docs/learnings/README.md
```

### Day 4: Create First Compound Docs

Document your existing patterns:

1. **Multi-Tenant Data Isolation** - How you enforce tenant boundaries
2. **Clerk JWT Verification** - How you verify auth tokens in Fastify
3. **Prisma Client Setup** - Your singleton pattern for Prisma
4. **Next.js Auth Protection** - Server-side auth checks in layouts

### Day 5: Skills Installation

```bash
# Optional but valuable
claude-code marketplace install agent-native-architecture
claude-code marketplace install compound-docs
claude-code marketplace install file-todos
claude-code marketplace install git-worktree
```

### Weekend: Verify Week 3

- [ ] 5+ utility commands installed
- [ ] `/workflows:compound` working
- [ ] 4+ compound docs created
- [ ] Team contributing to docs

---

## Week 4: Optimization & Team Adoption

### Day 1: Design Agents (If Using Figma)

**Only if your team uses Figma actively:**

```bash
claude-code marketplace install design-implementation-reviewer
claude-code marketplace install design-iterator
claude-code marketplace install figma-design-sync
```

### Day 2: Create Team Guidelines

Create `docs/compound-engineering-guide.md`:

```markdown
# Akount Compound Engineering Guide

## When to Use Each Agent

### Before Starting Work
- `/workflows:brainstorm` - Unclear requirements
- `/workflows:plan` - Planning implementation

### During Development
- Research agents - Learning patterns
- `/deepen-plan` - Enhancing plans

### Before Committing
- Individual reviewers - Spot check
- `/workflows:review` - Full review

### After Merging
- `/workflows:compound` - Document learnings
- `/changelog` - Create changelog

### Bug Fixes
- `bug-reproduction-validator` - Reproduce first
- Then fix and document pattern

### PR Review
- `/resolve_pr_parallel` - Address comments
- `/plan_review` - Review implementation plan
```

### Day 3: Workflow Integration

Update `TASKS.md` or create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Pre-Merge Checklist

- [ ] `/workflows:review` passed
- [ ] All review agents satisfied
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Compound doc created (if new pattern)

## Review Agents Used

- [ ] fastify-api-reviewer (if API changes)
- [ ] clerk-auth-reviewer (if auth changes)
- [ ] nextjs-app-router-reviewer (if frontend changes)
- [ ] prisma-migration-reviewer (if schema changes)
- [ ] financial-data-validator (if financial logic)
- [ ] turborepo-monorepo-reviewer (if package changes)
- [ ] security-sentinel (always)
- [ ] performance-oracle (always)
```

### Day 4: Team Training

1. **Morning:** Demo compound engineering workflow
2. **Afternoon:** Team implements a small feature using workflow
3. **EOD:** Retrospective on what worked

### Day 5: Process Documentation

1. Update `README.md` with compound engineering process
2. Create `docs/development-workflow.md`
3. Add agent usage examples
4. Document common patterns

### Weekend: Verify Week 4

- [ ] Team using workflows daily
- [ ] Pull requests include review checklist
- [ ] Compound docs growing organically
- [ ] Development velocity increasing

---

## Success Metrics

### Week 1 Success
- 9 agents installed
- Team understands purpose of each
- Successfully used agents 5+ times

### Week 2 Success
- 3+ custom agents created
- `/workflows:review` includes all agents
- Review caught 3+ issues

### Week 3 Success
- 5+ utility commands in use
- 4+ compound docs created
- Team referencing docs

### Week 4 Success
- Team using workflows without prompting
- PR review time decreased
- Code quality issues decreased
- Knowledge documented, not lost

---

## Long-Term Benefits (3-6 Months)

After full adoption, you should see:

1. **Faster Development**
   - New features easier (built on documented patterns)
   - Less debugging (patterns prevent common bugs)
   - Faster onboarding (compound docs teach new devs)

2. **Higher Quality**
   - Consistent patterns across codebase
   - Security issues caught in review
   - Performance problems identified early

3. **Better Knowledge Sharing**
   - Solutions documented, not forgotten
   - Team learns from each other's work
   - Institutional knowledge grows

4. **Reduced Technical Debt**
   - Code quality maintained from start
   - Refactoring less necessary
   - Architecture stays clean

---

## Troubleshooting

### "Agent not found"
Make sure you're using the correct marketplace name. Check:
```bash
claude-code marketplace search [agent-name]
```

### "Agent taking too long"
Some agents are thorough. For quick checks:
```bash
# Use specific agent instead of full review
claude-code "Use fastify-api-reviewer with quick mode"
```

### "Too many agents in review"
Customize `.claude/commands/workflows/review.md` to only include relevant agents for each PR type.

### "Team not adopting"
1. Start small - one workflow at a time
2. Show value - catch real bugs in review
3. Make it easy - add to PR template
4. Lead by example - use it consistently

---

## Quick Reference

### Daily Workflow

```bash
# 1. Start with planning
/workflows:brainstorm  # If unclear
/workflows:plan        # Create plan

# 2. Execute work
/workflows:work        # Systematic execution

# 3. Review before commit
/workflows:review      # Full review

# 4. Document learnings
/workflows:compound    # Capture knowledge
```

### When Things Go Wrong

```bash
# Bug report received
bug-reproduction-validator  # Reproduce first

# PR feedback received
/resolve_pr_parallel        # Address all comments

# Migration needed
deployment-verification-agent  # Create checklist
data-migration-expert          # Validate migration
```

### Learning & Research

```bash
# Need to learn a pattern
framework-docs-researcher   # Find official docs
best-practices-researcher   # Find community patterns

# Understand existing code
repo-research-analyst       # Analyze structure
git-history-analyzer        # See evolution
pattern-recognition-specialist  # Find patterns
```

---

## Next Steps

1. **This Week:** Install Week 1 agents (2 hours)
2. **Next Week:** Create custom agents (1 day)
3. **Week 3:** Install utilities and document (3 days)
4. **Week 4:** Team training and adoption (5 days)

**Total Time Investment:** ~10 days over 4 weeks
**Expected ROI:** 2-3x productivity increase within 3 months

---

## Resources

- **Analysis:** `COMPOUND_ENGINEERING_ANALYSIS.md`
- **Templates:** `CUSTOM_AGENTS_TEMPLATES.md`
- **Plugin Repo:** https://github.com/5unn7/compound-engineering-plugin
- **Your Agents:** `.claude/agents/review/`
- **Your Commands:** `.claude/commands/workflows/`
- **Compound Docs:** `docs/learnings/`

