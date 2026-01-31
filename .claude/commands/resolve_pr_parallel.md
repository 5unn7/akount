---
name: resolve_pr_parallel
description: Resolve all PR comments using parallel processing
argument-hint: "[optional PR number]"
---

# Resolve PR Parallel

Automatically resolve all PR review comments using parallel agent processing for maximum speed.

**Current Date:** 2026-01-30

---

## Purpose

Transform PR feedback resolution from sequential tedium to parallel efficiency:
- 🚀 **Sequential:** 5 comments × 10 min = 50 minutes
- ⚡ **Parallel:** 5 comments in ~12 minutes (4x faster)

---

## Usage

```bash
# Auto-detect current PR
/resolve_pr_parallel

# Specific PR number
/resolve_pr_parallel 123

# From PR URL
/resolve_pr_parallel https://github.com/org/repo/pull/123

# Dry run (show what would be done)
/resolve_pr_parallel --dry-run

# Specific comment threads
/resolve_pr_parallel --threads=456,789
```

---

## Workflow

### Phase 1: Analyze

Detect context and fetch PR data:

**Git Context:**
```bash
# Get current branch
git branch --show-current

# Find associated PR
gh pr status --json number,title,url

# If PR number provided, use that
gh pr view 123
```

**Fetch Comments:**
```bash
# Get all review threads
gh api repos/{owner}/{repo}/pulls/{pr}/reviews

# Get comment threads
gh api repos/{owner}/{repo}/pulls/{pr}/comments

# Filter unresolved only
jq '.[] | select(.state == "PENDING")'
```

**Extract:**
- File path and line number
- Comment text and context
- Reviewer username
- Thread ID
- Related code snippet

---

### Phase 2: Categorize & Prioritize

Group comments by type and urgency:

**Categories:**

1. **🔴 Critical (Fix First)**
   - Security vulnerabilities
   - Data loss risks
   - Breaking bugs
   - Blocking issues

2. **🟡 Important (Fix Soon)**
   - Code quality issues
   - Performance concerns
   - Type safety problems
   - Missing error handling

3. **🔵 Suggestions (Nice to Have)**
   - Naming improvements
   - Code organization
   - Documentation
   - Optional optimizations

**Prioritization:**
```typescript
const prioritized = comments.sort((a, b) => {
  // Critical first
  if (a.isCritical && !b.isCritical) return -1
  if (!a.isCritical && b.isCritical) return 1

  // Then by file (group related changes)
  if (a.file !== b.file) return a.file.localeCompare(b.file)

  // Then by line number
  return a.line - b.line
})
```

---

### Phase 3: Plan Resolution

Create resolution strategy for each comment:

**For Each Comment:**

1. **Understand Request**
   - Parse reviewer intent
   - Identify specific change needed
   - Determine scope (single line vs file vs multiple files)

2. **Find Related Code**
   - Locate exact file and line
   - Read surrounding context
   - Check for similar patterns

3. **Assess Impact**
   - Will fix break other code?
   - Are tests affected?
   - Does it require other changes?

4. **Plan Fix**
   - Specific code changes needed
   - Test updates required
   - Documentation updates

---

### Phase 4: Implement in Parallel

Launch resolver agent for each comment simultaneously:

**Parallel Execution:**
```typescript
// Spawn one agent per comment thread
const resolutions = await Promise.all(
  comments.map(comment =>
    Task(pr-comment-resolver, {
      comment: comment,
      file: comment.file,
      line: comment.line,
      thread_id: comment.id
    })
  )
)
```

**Each Agent:**
1. Reads the comment
2. Locates the code
3. Makes the change
4. Verifies correctness
5. Returns resolution summary

**Conflict Handling:**
- Agents work on different files: No conflict
- Agents work on same file: Queue sequentially
- Agents work on same line: Alert user

---

### Phase 5: Commit & Resolve

Process all changes:

**Commit Strategy:**

**Option A: Single Commit (default)**
```bash
git add .
git commit -m "Address PR feedback

Resolved 5 review comments:
- Fixed tenant isolation in GET /invoices
- Added Zod validation schemas
- Improved error handling
- Extracted getUserTenant helper
- Added missing type annotations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
"
```

**Option B: Per-File Commits**
```bash
# One commit per file changed
git add apps/api/src/routes/invoices.ts
git commit -m "fix: Add tenant isolation to invoice routes

Addresses feedback from @reviewer in #123
"
```

**Option C: Per-Comment Commits**
```bash
# One commit per comment (most granular)
git commit -m "fix: Add Zod validation schema

Resolves comment #456 by @reviewer
"
```

**Resolve Threads:**
```bash
# For each resolved comment
gh api repos/{owner}/{repo}/pulls/comments/{comment_id}/replies \
  -f body="✅ Resolved in commit abc123

Changes made:
- [Description of fix]

Let me know if this addresses your concern!"
```

**Push Changes:**
```bash
git push origin HEAD
```

---

### Phase 6: Verify

Ensure all comments addressed:

**Check Resolution:**
```bash
# Fetch updated comment status
gh api repos/{owner}/{repo}/pulls/{pr}/comments

# Count unresolved
unresolved=$(jq '[.[] | select(.state == "PENDING")] | length')

if [ $unresolved -gt 0 ]; then
  echo "⚠️ $unresolved comments still unresolved"
  # Show which ones
else
  echo "✅ All comments resolved!"
fi
```

**Run Tests:**
```bash
npm test
```

**Verify Build:**
```bash
npm run build
```

---

## Example Session

```
🔄 Resolving PR Comments for #123

📥 Fetching PR data...
   Branch: feature/multi-currency
   PR: #123 "Add multi-currency invoice support"
   Author: @alice
   Reviewers: @bob, @charlie

📝 Found 5 unresolved comments:

   🔴 Critical (1):
   1. @bob: Missing tenant isolation in invoice query
      Location: apps/api/src/routes/invoices.ts:45

   🟡 Important (3):
   2. @charlie: Add Zod validation schema
      Location: apps/api/src/routes/invoices.ts:33
   3. @bob: Extract getUserTenant to helper
      Location: apps/api/src/routes/invoices.ts:42
   4. @charlie: Type assertion should be type guard
      Location: apps/api/src/routes/invoices.ts:48

   🔵 Suggestions (1):
   5. @bob: Consider adding pagination
      Location: apps/api/src/routes/invoices.ts:60

🚀 Launching 5 resolver agents in parallel...

   ✓ Agent 1: Fixed tenant isolation (2.1s)
   ✓ Agent 2: Added Zod schemas (2.8s)
   ✓ Agent 3: Extracted helper function (2.3s)
   ✓ Agent 4: Replaced assertion with guard (1.5s)
   ✓ Agent 5: Added pagination support (3.2s)

📊 Resolution Summary:

   Files Changed: 2
   - apps/api/src/routes/invoices.ts
   - apps/api/src/lib/tenant.ts (new)

   Lines Changed: +89, -12

   All Comments: 5 resolved
   - Critical: 1/1 ✓
   - Important: 3/3 ✓
   - Suggestions: 1/1 ✓

💾 Committing changes...
   ✓ Created commit: abc1234

🔔 Resolving comment threads...
   ✓ Resolved comment #456 by @bob
   ✓ Resolved comment #457 by @charlie
   ✓ Resolved comment #458 by @bob
   ✓ Resolved comment #459 by @charlie
   ✓ Resolved comment #460 by @bob

🚀 Pushing to origin...
   ✓ Pushed to feature/multi-currency

✅ All Comments Resolved! (Total time: 12.3 minutes)

🧪 Running tests...
   ✓ All tests passing

📬 Notifying reviewers...
   ✓ Comment added to PR

---

Next: Wait for re-review from @bob and @charlie
```

---

## Resolution Report

After completion, generate summary:

```markdown
# PR #123 Comment Resolution Report

**Date:** 2026-01-30
**PR:** Add multi-currency invoice support
**Comments Resolved:** 5/5 (100%)
**Resolution Time:** 12.3 minutes
**Commits:** 1

---

## Resolutions

### 1. Missing Tenant Isolation (Critical)

**Comment by:** @bob
**Location:** apps/api/src/routes/invoices.ts:45
**Priority:** 🔴 Critical

**Feedback:**
> This query doesn't filter by tenantId, allowing cross-tenant data access.

**Resolution:**
```typescript
// Before
const invoices = await prisma.invoice.findMany({
  where: { status: 'paid' }
})

// After
const tenantId = await getUserTenant(request.userId)
const invoices = await prisma.invoice.findMany({
  where: {
    status: 'paid',
    tenantId  // Added tenant isolation
  }
})
```

**Status:** ✅ Resolved
**Commit:** abc1234
**Reply:** "Fixed - added tenant filtering to query"

---

### 2. Add Zod Validation Schema (Important)

**Comment by:** @charlie
**Location:** apps/api/src/routes/invoices.ts:33
**Priority:** 🟡 Important

**Feedback:**
> Route needs Zod schema for request validation

**Resolution:**
Added comprehensive Zod schemas:
```typescript
const InvoiceQuerySchema = z.object({
  status: z.enum(['draft', 'sent', 'paid']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
})

const InvoiceResponseSchema = z.object({
  invoices: z.array(InvoiceSchema),
  total: z.number()
})
```

**Status:** ✅ Resolved
**Commit:** abc1234
**Reply:** "Added Zod validation for query and response"

---

[... other resolutions ...]

---

## Changes Made

**Files Modified:**
- apps/api/src/routes/invoices.ts (+67, -12)

**Files Created:**
- apps/api/src/lib/tenant.ts (+22)

**Tests Updated:**
- apps/api/src/routes/invoices.test.ts (+15)

---

## Test Results

✅ All tests passing (142 passed)
✅ No linting errors
✅ Build successful

---

## Next Steps

1. ✅ All feedback addressed
2. ⏳ Waiting for re-review
3. ⏳ Ready to merge after approval

---

_Generated by /resolve_pr_parallel on 2026-01-30_
```

---

## Repeat if Needed

If new comments added after first resolution:

```bash
# Re-run to catch new comments
/resolve_pr_parallel

# Output:
📝 Found 2 new unresolved comments:
   1. @bob: LGTM, just one small thing...
   2. @charlie: Could you also...

🚀 Launching 2 resolver agents...
[...]
```

**Iteration:** Repeat until `unresolved == 0`

---

## Best Practices

### Do:
- ✅ Run after receiving feedback
- ✅ Prioritize critical issues
- ✅ Test after resolution
- ✅ Reply to each comment
- ✅ Request re-review

### Don't:
- ❌ Skip running tests
- ❌ Ignore reviewer context
- ❌ Make unrelated changes
- ❌ Forget to push
- ❌ Mark resolved without fixing

---

## Advanced Usage

### Selective Resolution

```bash
# Resolve only critical comments
/resolve_pr_parallel --priority=critical

# Resolve specific files
/resolve_pr_parallel --files=invoices.ts,auth.ts

# Resolve by reviewer
/resolve_pr_parallel --reviewer=@bob
```

### Integration with Review Workflow

```bash
# After making changes
git add .
git commit -m "feat: Add feature"
git push

# Create PR
gh pr create

# Wait for review...
# Receive feedback

# Resolve all feedback in parallel
/resolve_pr_parallel

# Re-run review agents
/workflows:review

# Request re-review
gh pr review --approve  # Or: gh pr comment "Ready for re-review"
```

---

## Conflict Resolution

When multiple agents modify the same file:

**Strategy 1: Sequential (default)**
- Queue agents working on same file
- Apply changes one after another
- Reduces conflicts but slower

**Strategy 2: Merge**
- Let agents work in parallel
- Merge changes automatically
- Faster but may have conflicts

**Manual Resolution:**
If conflicts occur:
```bash
# Agent will report conflict
⚠️ Conflict detected in invoices.ts

Please resolve manually:
1. Review changes in invoices.ts
2. Resolve conflicts
3. Continue with: /resolve_pr_parallel --resume
```

---

## Time Savings

**Sequential (Traditional):**
- 5 comments × 10 min each = 50 minutes
- Context switching overhead = +10 min
- Total: ~60 minutes

**Parallel (This Tool):**
- 5 comments resolved simultaneously = 12 minutes
- No context switching
- **Savings: 48 minutes (80% faster)**

**ROI:**
- More time for features
- Faster PR turnaround
- Happier reviewers

---

## Akount-Specific Patterns

Common PR feedback types:

### Tenant Isolation
- Always add tenantId filtering
- Standard pattern: `where: { tenantId }`

### Zod Validation
- All routes need schemas
- Use ZodTypeProvider

### Type Safety
- No `any` types
- Explicit return types

### Financial Precision
- Use Decimal, not Float
- Include currency field

---

**Resolve your PR feedback:**
```bash
/resolve_pr_parallel
```

⚡ 80% faster PR resolution!
