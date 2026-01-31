# Compound Engineering Plugin - Tech Stack Analysis

**Date:** 2026-01-30
**Project:** Akount (Financial Accounting Platform)
**Tech Stack:** Next.js 16, TypeScript, Fastify, Prisma, PostgreSQL, Clerk, Turborepo

---

## ✅ Already Installed & Applicable

### Workflow Commands (5/5) ✅
- ✅ `/workflows:brainstorm` - Explore requirements before planning
- ✅ `/workflows:plan` - Create implementation plans
- ✅ `/workflows:work` - Execute work systematically
- ✅ `/workflows:review` - Multi-agent code review
- ⚠️ `/workflows:compound` - **MISSING** - Document learnings

### Review Agents (8/14 applicable)
**Currently Installed:**
- ✅ `architecture-strategist` - Architectural choices and patterns
- ✅ `code-simplicity-reviewer` - Final quality pass for minimalism
- ✅ `kieran-typescript-reviewer` - Strict TypeScript conventions
- ✅ `performance-oracle` - Performance analysis
- ✅ `security-sentinel` - Security audits
- ✅ `prisma-migration-reviewer` - Database migrations (CUSTOM - specific to your needs)
- ✅ `financial-data-validator` - Financial data integrity (CUSTOM - specific to your needs)
- ✅ `nextjs-app-router-reviewer` - Next.js App Router patterns (CUSTOM - specific to your needs)

### Agent-OS Commands (5/5) ✅
- ✅ `/agent-os:discover-standards` - Find coding standards
- ✅ `/agent-os:index-standards` - Index standards
- ✅ `/agent-os:inject-standards` - Apply standards
- ✅ `/agent-os:plan-product` - Product planning
- ✅ `/agent-os:shape-spec` - Shape specifications

---

## ❌ Not Applicable (Wrong Tech Stack)

### Rails-Specific Agents (3)
- ❌ `dhh-rails-reviewer` - Ruby/Rails (you use TypeScript/Next.js)
- ❌ `kieran-rails-reviewer` - Ruby/Rails conventions
- ❌ `andrew-kane-gem-writer` - Ruby gems
- ❌ `dhh-rails-style` - Rails style guide

### Python-Specific Agents (1)
- ❌ `kieran-python-reviewer` - Python conventions (you use TypeScript)

### Other Framework-Specific (1)
- ❌ `julik-frontend-races-reviewer` - Stimulus.js race conditions (you use React)

### Wrong Tools (2)
- ❌ `xcode-test` - iOS simulator testing (not applicable)
- ❌ `lint` - Ruby/ERB linting (you need TypeScript/ESLint)

---

## 🟡 Potentially Useful (Needs Adaptation)

### Design Agents (3)
- 🟡 `design-implementation-reviewer` - Verify UI matches Figma
  - **Status:** Could be useful if you have Figma designs
  - **Action:** Install if design team uses Figma

- 🟡 `design-iterator` - Incremental UI enhancements
  - **Status:** Generic enough to use with Tailwind/Shadcn
  - **Recommendation:** Install

- 🟡 `figma-design-sync` - Sync with Figma designs
  - **Status:** Depends on design workflow
  - **Action:** Install if using Figma actively

### Research Agents (4/4) ✅ Highly Recommended
- 🟢 `best-practices-researcher` - External best practices
  - **Use Case:** Research Next.js, Fastify, Prisma patterns

- 🟢 `framework-docs-researcher` - Framework documentation
  - **Use Case:** Query Next.js, React, Prisma docs

- 🟢 `git-history-analyzer` - Code evolution analysis
  - **Use Case:** Understand codebase changes over time

- 🟢 `repo-research-analyst` - Repository structure
  - **Use Case:** Analyze monorepo structure, conventions

### Workflow Agents (3/5)
- 🟢 `bug-reproduction-validator` - Systematically reproduce bugs
  - **Status:** HIGHLY RECOMMENDED

- 🟢 `pr-comment-resolver` - Address PR feedback
  - **Status:** HIGHLY RECOMMENDED

- 🟢 `spec-flow-analyzer` - Find spec gaps in workflows
  - **Status:** Useful for financial workflows

- ❌ `every-style-editor` - Content style guide (N/A unless you have one)
- ❌ `ankane-readme-writer` - Ruby gem READMEs (N/A)

### Pattern Recognition (1)
- 🟢 `pattern-recognition-specialist` - Code patterns & anti-patterns
  - **Status:** HIGHLY RECOMMENDED for codebase consistency

---

## 🚨 MISSING - Critical for Your Stack

### 1. Fastify-Specific Reviewer Agent ⚠️
**Status:** **DOES NOT EXIST** - You should create this

```md
# Fastify API Reviewer
- Validate route schemas with Zod
- Check authentication middleware usage
- Verify error handling patterns
- Review API endpoint structure
- Check for N+1 query issues in Prisma calls
```

**Priority:** HIGH - You have a Fastify API but no reviewer for it

---

### 2. React Server Components Reviewer ⚠️
**Status:** You have `nextjs-app-router-reviewer` but could enhance

```md
# React Server Components Reviewer
- Verify 'use client' directive placement
- Check for unnecessary client components
- Validate async server component patterns
- Review data fetching in server components
- Check for prop serialization issues
```

**Priority:** MEDIUM - Partially covered by nextjs-app-router-reviewer

---

### 3. Clerk Auth Reviewer ⚠️
**Status:** **DOES NOT EXIST** - Specific to your auth provider

```md
# Clerk Auth Reviewer
- Verify auth middleware in API routes
- Check userId access patterns
- Review protected route implementations
- Validate JWT verification in Fastify
- Check for auth edge cases
```

**Priority:** HIGH - Critical for security

---

### 4. Tailwind CSS Reviewer ⚠️
**Status:** Generic frontend reviewer exists but not Tailwind-specific

```md
# Tailwind CSS Reviewer
- Check for design system consistency
- Verify responsive breakpoints
- Review color palette usage (Orange, Violet, Slate)
- Check for utility class organization
- Validate dark mode implementation
```

**Priority:** MEDIUM - For design consistency

---

### 5. Monorepo / Turborepo Reviewer ⚠️
**Status:** **DOES NOT EXIST**

```md
# Turborepo Monorepo Reviewer
- Verify package dependencies are correct
- Check for circular dependencies
- Review workspace imports
- Validate turbo.json pipeline config
- Check for proper package exports
```

**Priority:** MEDIUM - Important for monorepo health

---

### 6. Data Migration Expert ⚠️
**Status:** You have `data-integrity-guardian` but missing specific agent

From plugin:
- `data-migration-expert` - Validates ID mappings, detects swapped values
- `deployment-verification-agent` - Go/No-Go checklists for risky changes

**Priority:** HIGH - Critical for financial data safety

---

### 7. Agent-Native Architecture ⚠️
**Status:** Skill exists in plugin, not installed

```md
# Agent-Native Architecture
- Build features with Claude Code in mind
- Design APIs that agents can easily understand
- Create self-documenting code
- Structure for AI-assisted development
```

**Priority:** MEDIUM - Improves compound effect

---

## 📋 Utility Commands Status

### Already Have Alternatives
- ✅ Git worktree management (via workflows)
- ✅ Task tracking (built into Claude Code)

### Missing But Useful
- ⚠️ `/changelog` - Create engaging changelogs
- ⚠️ `/deepen-plan` - Enhance plans with research
- ⚠️ `/plan_review` - Multi-agent plan review
- ⚠️ `/triage` - Issue triage and prioritization
- ⚠️ `/test-browser` - Browser testing on PR changes
- ⚠️ `/feature-video` - Record feature walkthroughs
- ⚠️ `/resolve_parallel` - Resolve TODOs in parallel
- ⚠️ `/resolve_pr_parallel` - Resolve PR comments in parallel

---

## 🎯 Recommended Installation Priority

### Tier 1: Install Immediately (Critical Gaps)
1. ✅ **Research Agents (4)** - Essential for learning best practices
   - `best-practices-researcher`
   - `framework-docs-researcher`
   - `git-history-analyzer`
   - `repo-research-analyst`

2. ✅ **Workflow Agents (3)** - Improve development flow
   - `bug-reproduction-validator`
   - `pr-comment-resolver`
   - `pattern-recognition-specialist`

3. ⚠️ **Missing Core Agents - CREATE THESE:**
   - `fastify-api-reviewer` (NEW)
   - `clerk-auth-reviewer` (NEW)

4. ⚠️ **Data Safety (2)** - Install from plugin
   - `data-migration-expert`
   - `deployment-verification-agent`

### Tier 2: Install Soon (High Value)
5. ⚠️ **Utility Commands (4)**
   - `/changelog`
   - `/deepen-plan`
   - `/plan_review`
   - `/resolve_pr_parallel`

6. ⚠️ **New Reviewer Agent - CREATE THIS:**
   - `turborepo-monorepo-reviewer` (NEW)

### Tier 3: Consider Later (Nice to Have)
7. 🟡 **Design Agents (if using Figma)**
   - `design-implementation-reviewer`
   - `design-iterator`
   - `figma-design-sync`

8. 🟡 **Additional Reviewers - CREATE THESE:**
   - `tailwind-css-reviewer` (NEW)
   - `react-server-components-reviewer` (Enhancement)

9. ⚠️ **Skills**
   - `agent-native-architecture`
   - `compound-docs`

### Tier 4: Optional (Future)
10. 🟡 **Content Tools (if needed)**
    - `/feature-video`
    - `/triage`
    - `/test-browser`

11. 🟡 **MCP Servers**
    - `context7` (already available in your setup)

---

## 📊 Summary Statistics

| Category | Total Available | Applicable | Already Installed | Not Applicable | Missing |
|----------|----------------|------------|-------------------|----------------|---------|
| **Workflow Commands** | 5 | 5 | 4 | 0 | 1 |
| **Review Agents** | 14 | 8 | 8 | 6 | 6 (new) |
| **Research Agents** | 4 | 4 | 0 | 0 | 4 |
| **Design Agents** | 3 | 3 | 0 | 0 | 3 |
| **Workflow Agents** | 5 | 3 | 0 | 2 | 3 |
| **Data Safety Agents** | 2 | 2 | 1 | 0 | 1 |
| **Utility Commands** | 15 | 10 | 0 | 5 | 10 |
| **Skills** | 14 | 6 | 0 | 8 | 6 |

### Current Coverage: 13 / 62 applicable items (21%)
### High Priority Missing: 14 items
### Should Create Custom: 6 new agents specific to your stack

---

## 🔧 Action Plan

### Week 1: Install Core Research & Workflow Agents
```bash
# Install from compound-engineering plugin
claude-code add best-practices-researcher
claude-code add framework-docs-researcher
claude-code add git-history-analyzer
claude-code add repo-research-analyst
claude-code add bug-reproduction-validator
claude-code add pr-comment-resolver
claude-code add pattern-recognition-specialist
claude-code add data-migration-expert
claude-code add deployment-verification-agent
```

### Week 2: Create Custom Agents for Your Stack
1. Create `fastify-api-reviewer.md`
2. Create `clerk-auth-reviewer.md`
3. Create `turborepo-monorepo-reviewer.md`
4. Enhance `nextjs-app-router-reviewer.md` with RSC focus
5. Create `tailwind-css-reviewer.md`

### Week 3: Add Utility Commands
```bash
claude-code add /changelog
claude-code add /deepen-plan
claude-code add /plan_review
claude-code add /resolve_pr_parallel
```

### Week 4: Evaluate & Install Optional Tools
- Test design agents if Figma workflow exists
- Install agent-native-architecture skill
- Set up compound-docs for capturing learnings

---

## 💡 Custom Agent Templates

See next section for templates to create the 6 missing agents specific to your stack.

