# Permissions Reference

This document explains the permission structure in `.claude/settings.local.json`.

## Permission Categories

### ALLOW - Automatically Approved

These operations are safe and commonly used, so they run without asking for permission.

#### Git Operations - Read Only
- `git status`, `git log`, `git diff`, `git branch`, `git show` - View repository state without modifications

#### Git Operations - Safe Write
- `git add`, `git commit` - Stage and commit changes (local only, no remote push)
- `git checkout -b` - Create new branches only (switching branches requires permission)
- `git rm` - Remove files from git tracking

#### NPM - Standard Operations
- `npm run`, `npm test`, `npm outdated`, `npm --version` - Run scripts and check status
- No install/uninstall without permission (those require ask)

#### Prisma - Read Operations
- `prisma studio`, `prisma validate`, `prisma format`, `prisma generate` - View and validate schema
- No migrations or database push without permission

#### System Utilities - Safe
- File operations: `ls`, `dir`, `tree`, `du`, `find`, `grep`, `wc`
- Safe commands that only read files or display information

#### Process Management - Read Only
- `tasklist`, `netstat` - View running processes and network connections
- No killing processes without permission

---

### ASK - Requires User Permission

These operations can modify important state, so Claude will ask before running them.

#### Git Operations - Potentially Dangerous
- `git push` - Push to remote repository (can affect team)
- `git merge`, `git checkout`, `git rebase`, `git stash` - Modify repository state

#### Package Management
- `npm install`, `npm uninstall` - Modify dependencies
- Can affect project functionality if wrong packages installed

#### Prisma - Write Operations
- `prisma migrate`, `prisma db push`, `prisma db pull` - Modify database schema
- Can cause data loss if not careful

#### Network Operations
- `curl`, `wget` - Download files or make network requests
- Could download malicious content

#### Process Management - Write
- `taskkill`, `pkill` - Kill processes
- Could crash important services

---

### DENY - Always Blocked

These operations are dangerous and could cause irreversible damage.

#### Destructive Git Operations
- `git reset --hard` - Permanently discard local changes
- `git clean -f` - Delete untracked files permanently
- `git push --force` - Overwrite remote history (dangerous for team)
- `git branch -D` - Force delete branches

#### Destructive File Operations
- `rm -rf`, `del /s` - Recursively delete files
- Can't recover deleted files

#### Protected File Operations
- Reading/Writing `.env` files, secrets, credentials
- These contain sensitive data and should be edited manually
- File protection hook provides additional layer of security

---

## Hooks

### File Protection Hook

**Location:** `.claude/hooks/protect-files.sh`

**Purpose:** Prevents Claude from editing sensitive files even if permissions would allow it.

**Protected Patterns:**
- `.env` and `.env.*` - Environment variables with secrets
- `secrets/` - Any secrets directory
- `credentials.json` - API credentials
- `schema.prisma` - Database schema (use Prisma CLI instead)
- `.mcp.json` - MCP server configuration
- `settings.local.json` - Claude settings
- `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` - Lock files
- `.git/` - Git internal files
- Private keys (`.pem`, `.key`, `id_rsa`)

**How it works:**
1. Runs before any Edit or Write operation
2. Checks if file path matches protected patterns
3. Blocks operation if match found (exit code 2)
4. Shows clear error message explaining why

**Testing:**
```bash
# Test blocking .env
echo '{"tool_input": {"file_path": ".env"}}' | bash .claude/hooks/protect-files.sh

# Test allowing normal file
echo '{"tool_input": {"file_path": "src/test.ts"}}' | bash .claude/hooks/protect-files.sh
```

---

## Rationale

### Why Three Categories?

**ALLOW:** Common operations that are safe and need to run frequently. Asking for permission each time would be annoying and slow down development.

**ASK:** Operations that can modify important state but are sometimes necessary. User can review and approve on case-by-case basis.

**DENY:** Operations that are almost never safe and could cause irreversible damage. Better to block and force manual execution if truly needed.

### Why File Protection Hook in Addition to Permissions?

**Defense in Depth:** Multiple layers of security are better than one.

- **Permissions** control what commands can run
- **Hooks** control what files can be modified

If permissions are accidentally too broad, hooks catch dangerous operations. If hooks fail, permissions provide backup protection.

### Why Specific Patterns Instead of Wildcards?

**Old approach:** `Bash(git *)`
- Allows ALL git commands, including dangerous ones

**New approach:** `Bash(git status *)`, `Bash(git add *)`
- Only allows specific safe commands
- Dangerous commands must be explicitly in ask/deny lists

This follows the **principle of least privilege** - only grant permissions that are actually needed.

---

## Maintenance

### Adding New Permissions

1. **Identify the command** you need to run
2. **Assess the risk:**
   - Safe and common? → Add to `allow`
   - Sometimes needed but risky? → Add to `ask`
   - Dangerous? → Add to `deny`
3. **Use specific patterns** instead of wildcards when possible
4. **Document the rationale** in this file

### Updating the File Protection Hook

Edit `.claude/hooks/protect-files.sh` and add patterns to the `PROTECTED_PATTERNS` array:

```bash
PROTECTED_PATTERNS=(
  ".env"
  "your-new-pattern"
)
```

### Testing Changes

After modifying permissions or hooks:

1. **Validate JSON syntax:**
   ```bash
   npx prettier --check .claude/settings.local.json
   ```

2. **Test hooks independently:**
   ```bash
   echo '{"tool_input": {"file_path": "test.txt"}}' | bash .claude/hooks/protect-files.sh
   ```

3. **Test in Claude Code session:**
   - Try blocked operation (should fail with clear message)
   - Try allowed operation (should succeed)
   - Try ask operation (should prompt for permission)

---

## Troubleshooting

### Hook Not Firing

**Symptoms:** Can edit protected files when you shouldn't be able to

**Solutions:**
1. Check hook file permissions: `ls -la .claude/hooks/`
2. Make executable: `chmod +x .claude/hooks/protect-files.sh`
3. Verify hook registration in settings.local.json
4. Check for bash availability: `which bash`
5. Test hook independently to see error messages

### Permission Denied for Safe Operation

**Symptoms:** Can't run a command that should be safe

**Solutions:**
1. Check if command is in `allow` list with correct pattern
2. Check if command is in `deny` list (takes precedence)
3. Try more specific pattern (e.g., `Bash(npm test)` instead of `Bash(npm *)`)
4. Temporarily add to `ask` list to test, then move to `allow` if safe

### jq Not Found

**Symptoms:** Hook fails with "jq: command not found"

**Solutions:**
1. Install jq: `npm install -g jq` or use system package manager
2. Verify installation: `which jq` or `where jq`
3. If using Git Bash on Windows, jq is usually included

---

## Related Documentation

- `.claude/hooks/protect-files.sh` - File protection hook implementation
- `.claude/CONFIGURATION-GUIDE.md` - Complete configuration documentation (coming soon)
- `.claude/INSTALLATION-SUMMARY.md` - Installation and setup notes
