# Quick Start Guide - Week 1 Agents

**Status:** ✅ All 9 agents installed and ready to use!

---

## 🚀 Try Them Now

### 1. Research Your Codebase (2 minutes)

```bash
Use repo-research-analyst to understand how API routes are structured in apps/api
```

**What it will do:**
- Analyze your API directory structure
- Find common patterns in route files
- Document conventions (Zod validation, auth middleware, etc.)
- Show you examples from your own code

---

### 2. Find Best Practices (3 minutes)

```bash
Use best-practices-researcher to find Next.js 16 App Router server component patterns
```

**What it will do:**
- Search official Next.js documentation
- Find community best practices for 2026
- Show you examples of async server components
- Explain when to use 'use client'

---

### 3. Check Framework Docs (2 minutes)

```bash
Use framework-docs-researcher to research Fastify authentication middleware options
```

**What it will do:**
- Fetch Fastify documentation
- Show authentication plugin options
- Explain how to integrate with your setup
- Provide code examples

---

### 4. Find Patterns & Duplication (5 minutes)

```bash
Use pattern-recognition-specialist to analyze apps/api/src/routes for patterns
```

**What it will do:**
- Identify design patterns you're using
- Find duplicated code across routes
- Check naming convention consistency
- Suggest refactoring opportunities

---

### 5. Validate a Bug Report (10 minutes)

Pick any recent issue or create a test scenario:

```bash
Use bug-reproduction-validator to check if the authentication flow has any issues
```

**What it will do:**
- Test the authentication systematically
- Check for edge cases
- Classify if it's a real bug or expected behavior
- Provide detailed findings

---

### 6. Review a Migration (5 minutes)

Look at your most recent Prisma migration:

```bash
Use data-migration-expert to review the last migration in packages/db/prisma/migrations
```

**What it will do:**
- Check if migration is safe
- Verify data handling
- Identify potential issues
- Suggest improvements

---

## 📋 Common Use Cases

### "I need to learn how to do X"

**Option 1: Check your codebase first**
```bash
Use repo-research-analyst to find examples of [feature] in the codebase
```

**Option 2: Find external best practices**
```bash
Use best-practices-researcher to find [technology] best practices for [task]
```

**Option 3: Get official docs**
```bash
Use framework-docs-researcher to research [framework] [feature]
```

---

### "Is this a bug or expected behavior?"

```bash
Use bug-reproduction-validator to verify issue #[number]
```

or

```bash
Use bug-reproduction-validator to check if [behavior] is correct
```

---

### "How do I address this PR feedback?"

```bash
Use pr-comment-resolver to implement feedback from @reviewer on PR #[number]
```

or paste the specific comment and ask:

```bash
Use pr-comment-resolver to address this comment: "[comment text]"
```

---

### "Is there duplicated code I should refactor?"

```bash
Use pattern-recognition-specialist to find code duplication in [directory]
```

---

### "Is this migration safe?"

```bash
Use data-migration-expert to review this migration: [paste migration file path]
```

then

```bash
Use deployment-verification-agent to create a deployment checklist for this migration
```

---

### "How did this feature evolve?"

```bash
Use git-history-analyzer to trace the history of [file or feature]
```

---

## 🎯 Your First Task

**Right now, try this:**

1. **Understand your API structure** (5 minutes)
   ```bash
   Use repo-research-analyst to analyze apps/api/src/routes and document our API patterns
   ```

2. **Find any duplicated code** (5 minutes)
   ```bash
   Use pattern-recognition-specialist to find code duplication in apps/api/src/routes
   ```

3. **Research Next.js patterns** (5 minutes)
   ```bash
   Use best-practices-researcher to find Next.js 16 Server Actions best practices
   ```

**Total time:** 15 minutes to see the value!

---

## 💡 Tips for Success

### Do:
- ✅ Be specific in your requests
- ✅ Use agents for research before coding
- ✅ Combine agents (research → analyze → validate)
- ✅ Let agents finish before asking follow-ups

### Don't:
- ❌ Ask vague questions ("analyze everything")
- ❌ Skip research agents (they save time!)
- ❌ Ignore agent findings (they catch issues)
- ❌ Use workflow agents for research tasks

---

## 🔄 Integration with Existing Workflows

### Before (old workflow):
```
Idea → Start coding → Get stuck → Google → StackOverflow → Trial and error
```

### After (new workflow):
```
Idea → Research agents → Understand patterns → Code correctly first time
```

---

### Before (old PR workflow):
```
PR → Review comments → Fix individually → Push → Wait
```

### After (new PR workflow):
```
PR → Review comments → pr-comment-resolver → All fixed systematically → Push
```

---

### Before (old bug workflow):
```
Bug report → Assume it's real → Start debugging → Realize it's user error → Frustration
```

### After (new bug workflow):
```
Bug report → bug-reproduction-validator → Classified correctly → Fix or clarify docs
```

---

## 📚 Reference

**Full documentation:**
- `WEEK_1_INSTALLATION_COMPLETE.md` - Installation summary
- `COMPOUND_ENGINEERING_ACTION_PLAN.md` - 4-week plan
- `.claude/agents/research/README.md` - Research agents
- `.claude/agents/workflow/README.md` - Workflow agents
- `.claude/agents/review/README.md` - Review agents

**Agent locations:**
- Research: `.claude/agents/research/`
- Workflow: `.claude/agents/workflow/`
- Review: `.claude/agents/review/`

**Next steps:**
- Week 2: Create custom agents (fastify-api-reviewer, clerk-auth-reviewer)
- Week 3: Install utility commands (/changelog, /deepen-plan, etc.)
- Week 4: Team training and optimization

---

## 🎉 You're Ready!

All 9 Week 1 agents are installed and ready to use.

**Start with one agent today and see the difference!**

Recommended first agent: **repo-research-analyst** - understand your own codebase better.

```bash
Use repo-research-analyst to analyze apps/api/src and document our backend architecture
```

Happy compounding! 🚀
