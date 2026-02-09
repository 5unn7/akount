---
name: processes:work
description: Execute implementation plans systematically while maintaining quality
---

# Workflow: Work

Execute implementation plans systematically with quality checks built-in.

**When to Use:** After creating a plan with `/processes:plan`, execute it step-by-step.

---

## Four-Phase Workflow

**1. Quick Start** (2m) - Read plan, setup environment
**2. Execute** (varies) - Implement tasks systematically
**3. Quality Check** (5m) - Tests, self-review
**4. Document** (2m) - Update plan, commit progress

---

## Phase 1: Quick Start (2 minutes)

### Read the Plan Completely
```bash
# Read implementation plan
cat docs/plans/[plan-name].md
```

**Extract:**
- Task list (what to build)
- File locations (where to work)
- Success criteria (when done)
- Dependencies (what's needed first)

### Ask Clarifying Questions

**If unclear:**
- Requirements ambiguous → Use AskUserQuestion
- Multiple valid approaches → Ask for preferred direction
- Security/compliance implications → Confirm approach

**Don't guess** - clarity prevents rework.

### Setup Environment
```bash
# Check git status
git status

# Create feature branch (if needed)
git checkout -b feature/[feature-name]

# Verify tests pass
npm test
```

---

## Phase 2: Execute (Varies by Task)

### Task Loop

For each task in plan:

**1. Read relevant files**
```bash
# Read files mentioned in plan
Read [file-path]
```

**2. Implement changes**
- Follow existing patterns (check similar code)
- Use Edit for modifications, Write for new files
- Test incrementally (don't batch all changes)

**3. Verify locally**
```bash
# Run tests frequently
npm test

# Check types
npm run typecheck

# Run linter
npm run lint
```

**4. Commit working slices**
- Commit when feature slice works
- Don't wait to complete all tasks
- Each commit should be functional

### When to Commit

**Commit when:**
- ✅ Feature slice complete (e.g., API endpoint + tests pass)
- ✅ Database migration ready and tested
- ✅ Component fully functional
- ✅ Bug fix verified

**Don't commit when:**
- ❌ Tests failing
- ❌ Code doesn't compile
- ❌ Only half of a feature
- ❌ Console has errors

### Follow Existing Patterns

**Before writing new code:**
```bash
# Find similar implementations
Grep "similar-pattern" apps/ --output_mode=files_with_matches

# Read existing code
Read [similar-file]
```

**Match:**
- File structure (where files go)
- Naming conventions (camelCase, PascalCase)
- Import patterns (relative vs absolute)
- Error handling (try/catch, error types)

### Avoid Common Pitfalls

**Tenant Isolation:**
```typescript
// ❌ WRONG: Missing tenantId filter
const invoices = await prisma.invoice.findMany()

// ✅ CORRECT: Always filter by tenant
const invoices = await prisma.invoice.findMany({
  where: { entity: { tenantId: ctx.tenantId } }
})
```

**Money Precision:**
```typescript
// ❌ WRONG: Float for money
amount: 10.50

// ✅ CORRECT: Integer cents
amount: 1050 // $10.50
```

**Soft Delete:**
```typescript
// ❌ WRONG: Hard delete
await prisma.invoice.delete({ where: { id } })

// ✅ CORRECT: Soft delete
await prisma.invoice.update({
  where: { id },
  data: { deletedAt: new Date() }
})
```

---

## Phase 3: Quality Check (5 minutes)

### Run Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test [test-file]

# Check coverage
npm run test:coverage
```

**Fix failing tests before proceeding.**

### Self-Review Checklist

**Code Quality:**
- [ ] No commented-out code
- [ ] No console.log statements (unless intentional)
- [ ] No TODOs left in code
- [ ] Types are correct (no `any`)
- [ ] Error handling present

**Standards Compliance:**
- [ ] tenantId filter in all queries
- [ ] Money as integer cents
- [ ] Soft delete used (deletedAt)
- [ ] Zod validation for inputs
- [ ] Server/Client components used correctly

**Testing:**
- [ ] Tests pass
- [ ] New features have tests
- [ ] Edge cases covered

### Code Review (For Complex Changes)

**When to use agents:**
- Multi-file changes (3+ files)
- Financial logic (double-entry, multi-currency)
- Security-sensitive code (auth, permissions)
- Database schema changes

**Run review agents:**
```bash
# Financial validation
Task tool: financial-data-validator

# Architecture check
Task tool: architecture-strategist

# Security audit
Task tool: security-sentinel
```

---

## Phase 4: Document & Commit (2 minutes)

### Update Plan

Mark completed tasks in implementation plan:
```markdown
## Task List
- [x] Task 1 (completed)
- [x] Task 2 (completed)
- [ ] Task 3 (pending)
```

### Commit Changes

```bash
# Stage files
git add [files]

# Commit with clear message
git commit -m "feat: [description]

[Optional details about implementation]

Completed:
- Task 1
- Task 2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Verify
git log --oneline -1
```

### Update TASKS.md (If Applicable)

If plan completes a task from TASKS.md:
```bash
# Mark task as done
# Move to "Recently Completed" section
# Add date completed
```

---

## Progress Tracking

Use TodoWrite to track multi-step work:

```bash
TodoWrite: [
  { content: "Read plan", status: "completed", activeForm: "Reading plan" },
  { content: "Implement API endpoint", status: "in_progress", activeForm: "Implementing API endpoint" },
  { content: "Write tests", status: "pending", activeForm: "Writing tests" },
  { content: "Run quality checks", status: "pending", activeForm: "Running quality checks" }
]
```

**Update immediately** when tasks complete (don't batch).

---

## Workflow Output

```markdown
# 🚧 Work Session Progress

## Plan
[Plan name from docs/plans/]

## Completed Tasks
- [x] Task 1: [description]
- [x] Task 2: [description]

## Current Task
- [→] Task 3: [description] (60% done)

## Blockers
[None / List blockers encountered]

## Next Steps
- [ ] Task 4: [description]
- [ ] Task 5: [description]

## Quality Status
- [x] Tests passing
- [x] Types correct
- [x] Standards compliant

---

**Ready to continue or commit progress.**
```

---

_Lines: ~300 (slimmed from 500). Focuses on systematic execution with quality checks._
