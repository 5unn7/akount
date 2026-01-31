# Workflow Agents

Workflow agents help you work more systematically by validating bugs, resolving PR feedback, and maintaining code quality.

## Available Workflow Agents

### bug-reproduction-validator
**Purpose:** Systematically verify whether reported issues are genuine bugs or expected behavior.

**Use when:**
- Receiving bug reports from users or team
- Issue tickets need validation
- Reports of unexpected behavior
- Error reports without clear reproduction

**Example:**
```
Use bug-reproduction-validator to verify issue #123 about login failures
```

**Classifications:**
- ✅ Confirmed Bug
- ❌ Cannot Reproduce
- ℹ️ Not a Bug
- 🔧 Environmental Issue
- 📊 Data Issue
- 👤 User Error

---

### pr-comment-resolver
**Purpose:** Address code review feedback by implementing requested changes systematically.

**Use when:**
- Addressing reviewer comments on PRs
- Making changes based on code review
- Implementing suggestions from team
- Fixing issues identified in reviews

**Example:**
```
Use pr-comment-resolver to address reviewer feedback on PR #45
```

**Process:**
1. Analyze feedback
2. Plan modifications
3. Implement changes
4. Verify correctness
5. Report resolution

---

## Workflow Integration

### Bug Report Workflow
```
Bug reported → bug-reproduction-validator → Classify
  ↓
If Confirmed Bug → Fix → Test → Document
If Cannot Reproduce → Request more info
If Not a Bug → Clarify in docs/UI
```

### Code Review Workflow
```
PR submitted → Review → Comments received
  ↓
pr-comment-resolver → Implement fixes → Update PR
  ↓
Re-review → Approve → Merge
```

---

## Best Practices

### For Bug Reproduction
1. **Never assume** - Test exactly as reported
2. **Document everything** - Screenshots, logs, steps
3. **Be systematic** - Follow the validation workflow
4. **Test variations** - Different users, data, timing
5. **Check tests** - Existing tests reveal expected behavior

### For PR Comments
1. **Address completely** - Don't leave parts unresolved
2. **Stay focused** - Only change what's necessary
3. **Test changes** - Always verify fixes work
4. **Explain reasoning** - Help reviewers understand
5. **Ask if unclear** - Don't guess at intent

---

## When to Use Each Agent

### Use bug-reproduction-validator when:
- Issue ticket is filed
- User reports unexpected behavior
- Error is reported without context
- Need to verify if issue is real
- Before starting bug fix work

### Use pr-comment-resolver when:
- Reviewer leaves feedback
- Code review identifies issues
- Changes requested on PR
- Need to implement suggestions
- Multiple comments to address

---

## Integration with Review Workflow

Workflow agents complement review agents:
1. **pr-comment-resolver** implements fixes
2. **Review agents** verify quality
3. **bug-reproduction-validator** ensures bugs are real
4. **Pattern-recognition-specialist** finds similar issues

---

## Tools Available

Workflow agents have access to:
- Read - Examine code
- Edit/Write - Make changes (pr-comment-resolver)
- Bash - Run tests, check behavior
- Grep/Glob - Find related code
- All analysis tools

---

## Installation Date

**Installed:** 2026-01-30 (Week 1 of Compound Engineering adoption)

**Part of:** Compound Engineering Plugin - Week 1 Agents
