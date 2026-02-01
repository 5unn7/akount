# Claude Code Configuration Guide

**Last Updated:** 2026-01-31
**Purpose:** Complete reference for all Claude Code configuration in the Akount project

---

## Configuration Files Overview

### 1. `.claude/settings.local.json` (THIS PROJECT)
**Purpose:** Project-specific Claude Code settings

**Contains:**
- Permissions (allow/ask/deny)
- Hooks (file protection, validation, auto-format)
- Project environment variables
- MCP server enablement

**Scope:** This project only
**Version Control:** ✅ YES (committed to git)

---

### 2. `.mcp.json` (MCP SERVERS)
**Purpose:** Model Context Protocol server configuration

**Contains:**
- Documentation servers (Context7, etc.)
- Server URLs and connection details
- Server descriptions

**Scope:** This project only
**Version Control:** ✅ YES (committed to git)

---

### 3. `~/.claude/settings.json` (USER-LEVEL)
**Purpose:** User-specific Claude Code preferences

**Contains:**
- Global preferences
- Desktop notifications
- Default editor settings
- User-specific keybindings

**Scope:** All projects for this user
**Version Control:** ❌ NO (user-specific)

---

### 4. `~/.claude/keybindings.json` (USER-LEVEL)
**Purpose:** Custom keyboard shortcuts

**Contains:**
- Keyboard shortcut mappings
- Chord bindings
- Custom submit keys

**Scope:** All projects for this user
**Version Control:** ❌ NO (user-specific)

---

## Permissions System

### Permission Categories

**ALLOW** - Automatically approved (no prompt)
- Safe, common operations
- Read-only commands
- Standard development tasks

**ASK** - Requires user permission (prompt shown)
- Potentially dangerous operations
- State-modifying commands
- Network operations

**DENY** - Always blocked (operation fails)
- Destructive operations
- Security vulnerabilities
- Protected file modifications

### Current Permission Structure

See `.claude/PERMISSIONS-REFERENCE.md` for complete documentation.

**Summary:**
- 53 allowed operations (git read, npm run, prisma read, system utils)
- 11 ask operations (git push, npm install, prisma migrate, network)
- 13 denied operations (git reset --hard, rm -rf, protected files)

---

## Hooks System

### What Are Hooks?

Hooks are scripts that run automatically before or after tool use.

**Hook Types:**
- **PreToolUse** - Runs before a tool executes (can block operation)
- **PostToolUse** - Runs after a tool completes (can't block, but can modify)

### Active Hooks

#### 1. File Protection Hook

**File:** `.claude/hooks/protect-files.sh`
**Type:** PreToolUse
**Triggers:** Edit, Write
**Purpose:** Prevent editing sensitive files

**Protected files:**
- `.env` and `.env.*`
- `secrets/`
- `credentials.json`
- `schema.prisma`
- `.mcp.json`
- `settings.local.json`
- Lock files (package-lock.json, etc.)
- Private keys (.pem, .key, id_rsa)

**Testing:**
```bash
echo '{"tool_input": {"file_path": ".env"}}' | bash .claude/hooks/protect-files.sh
# Expected: Exit code 2, error message
```

---

#### 2. Pre-Commit Validation Hook

**File:** `.claude/hooks/pre-commit-validation.sh`
**Type:** PreToolUse
**Triggers:** Bash(git commit *)
**Purpose:** Validate code quality before commits
**Timeout:** 60 seconds

**Checks:**
1. **TypeScript Compilation** - Ensures no type errors (BLOCKING)
2. **Prisma Schema Validation** - Ensures schema is valid (BLOCKING)
3. **Multi-Tenancy Check** - Warns about missing tenantId (WARNING ONLY)

**Testing:**
```bash
bash .claude/hooks/pre-commit-validation.sh
# Expected: Runs all validations, exits 0 if pass, 1 if fail
```

---

#### 3. Auto-Format Hook

**File:** `.claude/hooks/auto-format.sh`
**Type:** PostToolUse
**Triggers:** Edit, Write
**Purpose:** Automatically format files after editing

**Formats:**
- TypeScript/JavaScript → Prettier
- Prisma schema → Prisma format
- JSON → Prettier
- CSS/SCSS → Prettier
- Markdown → Prettier
- HTML → Prettier

**Testing:**
```bash
echo '{"tool_input": {"file_path": "test.ts"}}' | bash .claude/hooks/auto-format.sh
# Expected: Formats file, exits 0 (always succeeds)
```

---

## MCP Servers

### Active Servers

#### Context7 (Primary Documentation Server)

**URL:** `https://mcp.context7.com/mcp`
**Coverage:** 100+ frameworks

**Supported frameworks:**
- Next.js (App Router, Server/Client components)
- React (hooks, patterns)
- Prisma (ORM, schema, migrations)
- TypeScript (types, patterns)
- Fastify (API patterns)
- Clerk (authentication)
- And 94+ more...

**Usage:**
Claude automatically queries Context7 when asking about framework-specific questions.

**See `.claude/MCP-SERVERS.md` for complete documentation.**

---

## Skills System

### What Are Skills?

Skills are reusable commands that invoke specialized workflows.

**Invocation:** `/skill-name [arguments]`

### Available Skills

**Utility Skills (4):**
- `/changelog` - Generate changelogs from git history
- `/deepen-plan` - Enhance plans with research
- `/plan_review` - Multi-agent plan review
- `/resolve_pr_parallel` - Fast PR comment resolution

**Workflow Skills (7):**
- `/processes:begin` - Session startup dashboard
- `/processes:brainstorm` - Feature exploration
- `/processes:plan` - Implementation planning
- `/processes:work` - Systematic development
- `/processes:review` - Code review
- `/processes:compound` - Document learnings
- `/processes:README` - Workflow documentation

**See `.claude/SKILLS-INDEX.md` for complete documentation.**

---

## Review Agents

### What Are Review Agents?

Specialized agents that analyze code from specific perspectives.

**Location:** `.claude/agents/review/`
**Count:** 15 agents

**Usage:** Use the Task tool with `subagent_type` parameter

**Example:**
```
Use the Task tool with subagent_type="financial-data-validator" to review accounting code
```

### Key Agents

**Financial & Data Integrity:**
- `financial-data-validator` - Double-entry bookkeeping, money precision
- `prisma-migration-reviewer` - Schema safety, migration validation
- `data-migration-expert` - Data migration safety

**Security & Performance:**
- `security-sentinel` - OWASP Top 10, input validation
- `performance-oracle` - N+1 queries, algorithmic complexity

**Architecture & Code Quality:**
- `architecture-strategist` - System design, multi-tenant validation
- `kieran-typescript-reviewer` - Strict TypeScript, modern patterns
- `code-simplicity-reviewer` - YAGNI, minimize complexity

**Framework-Specific:**
- `nextjs-app-router-reviewer` - Server/Client components, App Router
- `fastify-api-reviewer` - Fastify patterns
- `clerk-auth-reviewer` - Authentication security

**See `.claude/agents/review/README.md` for complete documentation.**

---

## Troubleshooting

### Hook Not Firing

**Symptoms:** Can edit protected files, no pre-commit validation

**Solutions:**
1. Check hook file exists: `ls .claude/hooks/`
2. Check hook is executable: `chmod +x .claude/hooks/*.sh`
3. Verify hook registration in `settings.local.json`
4. Test hook independently: `bash .claude/hooks/[hook].sh`
5. Check for bash availability: `which bash` or `where bash`
6. Check hook syntax: Look for errors in hook output

---

### Permission Denied for Safe Operation

**Symptoms:** Can't run `npm test`, `git status`, etc.

**Solutions:**
1. Check if command is in `allow` list
2. Check if command is in `deny` list (takes precedence)
3. Use more specific pattern (e.g., `Bash(npm test)` vs `Bash(npm *)`)
4. Temporarily add to `ask` list to test
5. Verify JSON syntax in settings.local.json

---

### MCP Server Not Responding

**Symptoms:** "MCP server unavailable", queries timeout

**Solutions:**
1. Check internet connectivity
2. Verify URL in `.mcp.json`: `curl https://mcp.context7.com/mcp`
3. Check `enableAllProjectMcpServers: true` in settings.local.json
4. Try removing and re-adding server
5. Check Claude Code logs for detailed errors

---

### Pre-Commit Validation Fails

**Symptoms:** Can't commit even though code looks correct

**Solutions:**
1. Run validation manually: `bash .claude/hooks/pre-commit-validation.sh`
2. Check TypeScript errors: `npx tsc --noEmit`
3. Check Prisma schema: `npx prisma validate`
4. Review multi-tenancy warnings (non-blocking)
5. If false positive, temporarily disable hook

---

### Auto-Format Not Working

**Symptoms:** Files remain unformatted after editing

**Solutions:**
1. Check if file type is supported (see hook file)
2. Verify Prettier is installed: `npx prettier --version`
3. Test hook manually: `echo '{"tool_input": {"file_path": "test.ts"}}' | bash .claude/hooks/auto-format.sh`
4. Check for Prettier config conflicts
5. Verify hook is registered in PostToolUse

---

### Skills Not Showing Up

**Symptoms:** `/skill-name` not recognized

**Solutions:**
1. Check skill file exists in `.claude/commands/`
2. Verify frontmatter has `name:` field
3. Restart Claude Code to reload skills
4. Check skill name matches invocation (e.g., `processes:plan` not `workflows:plan`)
5. Use `/help` to see available skills

---

## Best Practices

### Permission Management

1. **Start restrictive, loosen as needed**
   - Begin with minimal permissions
   - Add to `ask` list first to test
   - Move to `allow` only if safe and common

2. **Use specific patterns**
   - `Bash(git status *)` instead of `Bash(git *)`
   - Prevents accidental dangerous operations

3. **Document rationale**
   - Update PERMISSIONS-REFERENCE.md when changing
   - Explain why permission was added/changed

### Hook Development

1. **Test independently first**
   - Run hook script directly before registering
   - Verify exit codes and error messages

2. **Always return appropriate exit codes**
   - 0 = success, operation allowed
   - 1 = validation failed, block operation
   - 2 = security violation, block operation

3. **Provide clear error messages**
   - Explain why operation was blocked
   - Suggest remediation steps

4. **Keep hooks fast**
   - Target <500ms per operation
   - Use timeouts for long-running checks

### MCP Server Usage

1. **Prefer Context7 for general queries**
   - Already covers 100+ frameworks
   - No need to add more servers unless gap identified

2. **Add specialized servers only when needed**
   - Domain-specific documentation (accounting, tax)
   - Private documentation (internal wikis)
   - Performance issues with Context7

### Skill Creation

1. **Follow naming conventions**
   - Utility skills: `skill-name` (kebab-case)
   - Workflow skills: `category:skill-name`

2. **Include clear documentation**
   - Purpose and use cases
   - Usage examples
   - Expected outputs

3. **Test with sample data**
   - Verify skill works end-to-end
   - Check error handling

---

## Maintenance Tasks

### Weekly

- [ ] Review permission patterns (any false positives?)
- [ ] Check hook performance (any slowdowns?)
- [ ] Verify MCP server availability

### Monthly

- [ ] Update PERMISSIONS-REFERENCE.md if permissions changed
- [ ] Review hook logs for common errors
- [ ] Test all hooks independently
- [ ] Update skill documentation if workflows changed

### When Issues Occur

- [ ] Document issue in troubleshooting section
- [ ] Add solution if found
- [ ] Consider if hook/permission needs adjustment

---

## Related Documentation

- `.claude/PERMISSIONS-REFERENCE.md` - Complete permission documentation
- `.claude/MCP-SERVERS.md` - MCP server configuration guide
- `.claude/SKILLS-INDEX.md` - All available skills
- `.claude/agents/review/README.md` - Review agent documentation
- `.claude/commands/processes/README.md` - Workflow documentation
- `CLAUDE.md` - Project context (main entry point)

---

## Configuration Maintenance

### Single Source of Truth

See `.claude/SINGLE_SOURCE_OF_TRUTH.md` for authoritative sources.

**Key principle:** Update REGISTRY.json FIRST, then individual files.

### Validation

Run validation before committing:
```bash
bash .claude/hooks/validate-config.sh
```

This checks:
- REGISTRY.json is valid JSON
- All agents/skills in registry have corresponding files
- Identifies orphaned files not in registry
- Reports errors (blocking) and warnings (informational)

**When to run:**
- Before git commits
- After updating REGISTRY.json
- After adding/removing agents or skills
- Weekly maintenance check

**Expected output:**
```
✅ Configuration valid - No errors or warnings
```

**If validation fails:**
1. Check error messages for missing files
2. Verify REGISTRY.json syntax with `jq empty .claude/agents/REGISTRY.json`
3. Ensure file paths in registry match actual file locations
4. Remove deprecated agents/skills from registry or create missing files

---

## Version History

**2026-02-01 - Configuration Optimization**
- Added SINGLE_SOURCE_OF_TRUTH.md documentation
- Created validate-config.sh hook for automated validation
- Added authority hierarchy for metadata management
- Updated REGISTRY.json with authoritative source comment
- Added _source field to agent frontmatter

**2026-01-31 - Initial Configuration**
- Added file protection hook
- Refactored permission structure (allow/ask/deny)
- Added pre-commit validation hook
- Added auto-format hook
- Documented MCP servers (Context7)
- Fixed command naming (workflows → processes)
- Slimmed CLAUDE.md from 413 to 393 lines
- Created comprehensive documentation

**Next Steps:**
- Monitor hook performance
- Collect user feedback on permission strictness
- Consider additional MCP servers if gaps identified
- Expand skill library based on team needs
