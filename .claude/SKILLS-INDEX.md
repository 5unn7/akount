# Claude Code Skills Index

This document provides an index of all available skills in the Akount project.

## Skill Organization

**Location:** `.claude/commands/`

Skills are organized into:
1. **Utility Skills** (root level) - General-purpose tools
2. **Workflow Skills** (processes/ subdirectory) - Structured development workflows

---

## Utility Skills

**Location:** `.claude/commands/` (root level)

### changelog
**Command:** `/changelog [days] or [start-date]..[end-date]`
**Description:** Create engaging changelogs from recent merges
**Use case:** Generate human-readable changelogs from git history for team updates

### deepen-plan
**Command:** `/deepen-plan [plan file path]`
**Description:** Enhance plans with parallel research agents and best practices
**Use case:** Transform basic implementation plans into production-ready blueprints with research backing

### plan_review
**Command:** `/plan_review [plan file path]`
**Description:** Have multiple specialized agents review a plan in parallel
**Use case:** Catch planning issues early by getting multi-agent feedback before implementation

### resolve_pr_parallel
**Command:** `/resolve_pr_parallel [optional PR number]`
**Description:** Resolve all PR comments using parallel processing
**Use case:** Resolve PR review comments 4x faster using parallel agent processing

---

## Workflow Skills (Processes)

**Location:** `.claude/commands/processes/`

These skills follow a structured development lifecycle:

```
Idea → /processes:brainstorm → /processes:plan → /processes:work → /processes:review → Merge
```

### processes:begin
**Command:** `/processes:begin [optional focus area]`
**Description:** Session startup dashboard - Get up to speed quickly
**Use case:** Start a development session with context about current state, tasks, and progress

### processes:brainstorm
**Command:** `/processes:brainstorm [feature idea or problem to explore]`
**Description:** Collaboratively explore feature ideas and requirements before implementation planning
**Use case:** Explore unclear requirements, validate assumptions, understand edge cases
**Output:** `docs/brainstorms/YYYY-MM-DD-feature-name-brainstorm.md`

### processes:plan
**Command:** `/processes:plan [feature description, bug report, or improvement idea]`
**Description:** Transform feature descriptions into well-structured implementation plans
**Use case:** Break down features into actionable steps with technical approach documented
**Output:** `docs/plans/YYYY-MM-DD-feature-name-plan.md`

### processes:work
**Command:** `/processes:work [plan file path or feature name]`
**Description:** Execute implementation plans systematically while maintaining quality
**Use case:** Implement features with structured guidance, tests, and quality checks
**Output:** Implemented feature ready for review

### processes:review
**Command:** `/processes:review [PR number, GitHub URL, file path, or current branch]`
**Description:** Perform comprehensive code reviews using multi-agent analysis
**Use case:** Review code changes with specialized agents (security, performance, architecture, etc.)
**Output:** `docs/archive/sessions/` (after completion)

### processes:compound
**Command:** `/processes:compound [optional context or problem description]`
**Description:** Document solved problems to build organizational knowledge
**Use case:** Transform session learnings into reusable knowledge for team
**Output:** `docs/archive/sessions/COMPOUND_ENGINEERING_*.md`

### processes:README
**Command:** `/processes:README`
**Description:** Workflow Commands documentation
**Use case:** View complete workflow documentation

---

## Keybindings Skill

### keybindings-help
**Command:** `/keybindings-help`
**Description:** Customize keyboard shortcuts and keybindings
**Use case:** Rebind keys, add chord bindings, or modify `~/.claude/keybindings.json`

---

## Usage Patterns

### When to Use Utility Skills

**Use `/changelog`** when:
- Preparing release notes
- Updating team on recent changes
- Documenting milestones

**Use `/deepen-plan`** when:
- Basic plan needs more research
- Want production-ready implementation details
- Need best practices and examples

**Use `/plan_review`** when:
- Plan is ready but want validation before starting
- Want multi-agent feedback (security, performance, architecture)
- Prefer catching issues in planning phase

**Use `/resolve_pr_parallel`** when:
- PR has multiple review comments
- Want fast resolution (4x faster than sequential)
- Comments are independent (can be resolved in parallel)

### When to Use Workflow Skills

**Use `/processes:begin`** when:
- Starting a new development session
- Need context on current state
- Want to see what to work on next

**Use `/processes:brainstorm`** when:
- Feature requirements are unclear
- Multiple possible approaches
- Need to explore edge cases
- Want to validate assumptions

**Use `/processes:plan`** when:
- Requirements are clear (from brainstorm or user story)
- Ready to plan implementation details
- Need to break down complex features
- Want documented technical approach

**Use `/processes:work`** when:
- Have complete implementation plan
- Ready to write code and tests
- Want structured guidance through development
- Need to ship features completely

**Use `/processes:review`** when:
- Code is ready for review
- Want comprehensive multi-agent analysis
- Need security, performance, architecture feedback
- Preparing for merge/deploy

**Use `/processes:compound`** when:
- Solved interesting problem worth documenting
- Want to capture session learnings
- Building organizational knowledge base
- Future teams might face similar challenges

---

## Skill Development

### Creating New Skills

See `.claude/commands/processes/README.md` for skill creation guide.

**Skill structure:**
```markdown
---
name: skill-name
description: Brief description
argument-hint: "[optional argument description]"
---

# Skill Name

Purpose and usage documentation...
```

**Location rules:**
- Utility skills → `.claude/commands/` (root)
- Workflow skills → `.claude/commands/processes/`
- Special-purpose skills → `.claude/commands/[category]/`

---

## Related Documentation

- `.claude/commands/processes/README.md` - Workflow skills documentation
- `.claude/agents/review/README.md` - Review agents used by skills
- `CLAUDE.md` - Project context (references skills)

---

## Last Updated

**Date:** 2026-01-31
**Reason:** Initial skills index creation after configuration audit
**Total Skills:** 11 (4 utility + 7 workflow)
