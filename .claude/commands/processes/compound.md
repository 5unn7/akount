---
name: processes:compound
description: Document solved problems to build organizational knowledge
argument-hint: "[optional context or problem description]"
aliases:
  - compound
  - document
  - learn
  - knowledge
keywords:
  - documentation
  - learning
  - knowledge
  - compound
  - archive
---

# Workflow: Compound

Capture recently solved problems as structured documentation.

**Philosophy:** "Each unit of engineering work should make subsequent units easier."

---

## When to Use

Use immediately after:

- Fixing a tricky bug
- Solving a complex problem
- Discovering a non-obvious pattern
- Making an architectural decision

---

## Process

### Step 1: Gather Context

Look at:

- Recent git commits: `git log --oneline -5`
- Recent changes: `git diff HEAD~1`
- Error messages encountered
- Solution that worked

### Step 2: Create Documentation

**File location:** `docs/solutions/[category]/YYYY-MM-DD-short-description.md`

**Categories:** api, architecture, bugs, database, deployment, frontend, infrastructure, performance, security

### Step 3: Use This Template

```markdown
---
title: "[Problem Title]"
category: "[category]"
date: YYYY-MM-DD
severity: [low|medium|high]
module: "[Affected Module]"
---

# [Problem Title]

## Problem
What we observed and what broke.

## Root Cause
Why it happened.

## Solution
```typescript
// Working code
```

## Prevention

How to avoid this in the future.

```

### Step 4: Commit

```bash
git add docs/solutions/[category]/[filename].md
git commit -m "docs: Document [problem title]"
```

---

## Example Output

```
📚 Knowledge Compounded!

Created: docs/solutions/database/2026-02-02-edge-runtime-prisma.md

Problem: Prisma process.on() breaks Edge Runtime
Category: database
Severity: high

Solution: Wrap Node.js-only code in runtime check.

Next time: Reference this doc (2 min vs 30 min investigation)
```

---

## Best Practices

**Do:**

- Document immediately (context is fresh)
- Include code examples
- Add prevention steps
- Be specific

**Don't:**

- Wait days to document
- Be vague
- Skip root cause
- Document trivial issues

---

## Time Savings

- First occurrence: 30 min investigation
- With documentation: 2 min lookup
- **Savings per reuse: 28 minutes**
