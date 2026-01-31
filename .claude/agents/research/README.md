# Research Agents

Research agents help you learn best practices, understand frameworks, and analyze your codebase to make informed decisions.

## Available Research Agents

### best-practices-researcher
**Purpose:** Research external best practices and industry standards for technologies and frameworks.

**Use when:**
- Learning best practices for a technology (Next.js, Fastify, Prisma)
- Finding industry standards and conventions
- Researching implementation patterns from the community
- Validating your approach against established practices

**Example:**
```
Use best-practices-researcher to find Next.js 16 App Router data fetching patterns
```

---

### framework-docs-researcher
**Purpose:** Gather comprehensive documentation for specific frameworks, libraries, and dependencies.

**Use when:**
- Understanding how a specific framework/library works
- Finding API documentation for a dependency
- Learning version-specific features and changes
- Checking for deprecations or breaking changes

**Example:**
```
Use framework-docs-researcher to research Fastify authentication plugins
```

---

### git-history-analyzer
**Purpose:** Analyze git repository history to understand code evolution and trace origins.

**Use when:**
- Understanding how a file or feature evolved
- Finding out who wrote specific code and why
- Identifying when a bug was introduced
- Mapping contributor expertise areas

**Example:**
```
Use git-history-analyzer to understand how the authentication system evolved
```

---

### repo-research-analyst
**Purpose:** Conduct thorough repository research to understand project structure and conventions.

**Use when:**
- Understanding codebase structure and organization
- Learning project conventions and patterns
- Finding how similar features are implemented
- Identifying coding standards

**Example:**
```
Use repo-research-analyst to understand how API routes are structured
```

---

## Research Workflow

### Phase 1: Internal Knowledge
Start by checking existing documentation, skills, and patterns in the codebase.

### Phase 2: External Research
Use research agents to find official docs, community best practices, and examples.

### Phase 3: Synthesis
Combine internal and external knowledge to make informed decisions.

---

## When to Use Research Agents

### Before Starting a Feature
- Use **repo-research-analyst** to understand existing patterns
- Use **best-practices-researcher** to learn recommended approaches
- Use **framework-docs-researcher** for specific API details

### When Stuck
- Use **git-history-analyzer** to see how similar problems were solved
- Use **framework-docs-researcher** to find documentation
- Use **best-practices-researcher** to explore alternative approaches

### During Code Review
- Use **repo-research-analyst** to verify consistency with codebase
- Use **best-practices-researcher** to validate against industry standards

---

## Tips for Effective Research

1. **Start Broad, Then Narrow**
   - Begin with repo-research-analyst for context
   - Then use framework-docs-researcher for specifics

2. **Verify Multiple Sources**
   - Cross-reference findings across agents
   - Prioritize official docs over blog posts

3. **Check Version Compatibility**
   - Always verify version matches your project
   - Note breaking changes and migration paths

4. **Document Findings**
   - Create compound docs for future reference
   - Share learnings with the team

---

## Integration with Workflows

Research agents work seamlessly with:
- **/workflows:brainstorm** - Research during ideation
- **/workflows:plan** - Research before planning
- **/deepen-plan** - Enhance plans with research
- **/workflows:compound** - Document research findings

---

## Available Tools

All research agents have access to:
- WebSearch - Find current information
- WebFetch - Read documentation
- Grep/Glob - Search codebase
- Read - Examine files
- Bash - Execute commands
- mcp__context7 - Query framework docs

Research agents **cannot**:
- Edit or write code
- Create tasks
- Make changes to files

---

## Installation Date

**Installed:** 2026-01-30 (Week 1 of Compound Engineering adoption)

**Part of:** Compound Engineering Plugin - Week 1 Agents
