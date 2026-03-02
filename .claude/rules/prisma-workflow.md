# Prisma Workflow (Agent-Friendly)

---
paths:
  - "packages/db/prisma/schema.prisma"
  - "packages/db/prisma/migrations/**"
---

## The Problem

Prisma CLI is designed for **human interaction**. Agents cannot respond to interactive prompts, leading to a 3-step struggle:

1. Agent edits `schema.prisma` ✅
2. Agent tries `prisma migrate dev` → stuck on "What name?" prompt ❌
3. Agent falls back to `db push` → creates invisible drift ❌

**Result:** 15 minutes of troubleshooting every schema change.

---

## The Agent-Friendly Solution

### Step 1: Edit Schema (Agent DOES This)

```typescript
// Agent can safely edit schema.prisma
model AIConsent {
  id        String   @id @default(cuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  // ...
}
```

### Step 2: Ask User to Run Migration (Agent CANNOT Do This)

**Agent MUST output:**

```markdown
✅ Schema updated: Added AIConsent model

⚠️ **MIGRATION REQUIRED** (Cannot run automatically - needs human)

Please run:
```bash
cd packages/db
npx prisma migrate dev --name add_ai_consent_model
```

This will:
1. Prompt you for migration name (or use the one above)
2. Generate SQL in `prisma/migrations/`
3. Apply to your database
4. Update `_prisma_migrations` table

After migration completes, I'll continue with the next steps.
```

### Step 3: Verify Migration Applied (Agent Checks)

After user confirms, agent verifies:

```bash
# Check migration exists
ls packages/db/prisma/migrations/ | tail -n1
# Should show: 20260227160951_add_ai_consent_model/

# Verify migration.sql looks correct
cat packages/db/prisma/migrations/*/migration.sql | grep "CREATE TABLE"
```

---

## What Agents MUST NOT Do

### ❌ NEVER Use `db push` for Permanent Changes

```bash
# ❌ WRONG - Creates invisible drift
npx prisma db push
```

**Why it's bad:**
- No migration file created → drift between code and DB
- Shadow DB failures on next `migrate dev`
- Requires manual "baseline migration" to reconcile

**Exception:** Only use `db push` for local prototyping, then reset and create proper migration.

### ❌ NEVER Manually Write Migration SQL

```bash
# ❌ WRONG - Breaks checksums
echo "ALTER TABLE..." > migration.sql
```

**Why it's bad:**
- Prisma checksums migrations after applying
- Manual edits → "migration modified after applied" errors
- Requires `prisma migrate resolve` dance to fix

### ❌ NEVER Run `migrate deploy` in Development

```bash
# ❌ WRONG - This is for production CI/CD only
npx prisma migrate deploy
```

**Why it's bad:**
- Skips diff detection
- No shadow DB validation
- Can't detect drift

---

## Migration Naming Conventions

When providing suggested migration names to users:

```bash
# ✅ GOOD - Descriptive, lowercase, underscores
add_ai_consent_model
add_deleted_at_to_invoices
create_journal_entry_indexes

# ❌ BAD - Vague, unclear what changed
update_schema
fix_model
new_migration
```

**Pattern:** `<action>_<model>_<what_changed>`

---

## Common Pitfalls (From debugging-log.md)

### Pitfall 1: Migration Ordering

**Problem:** Adding index in separate migration before column exists

```sql
-- Migration 1 (timestamp: 20260220_120000)
CREATE INDEX "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");

-- Migration 2 (timestamp: 20260220_115959) ← RUNS FIRST!
ALTER TABLE "Invoice" ADD COLUMN "deletedAt" TIMESTAMP(3);
```

**Solution:** Always add columns and indexes in **same migration**, or ensure timestamps are ordered correctly.

### Pitfall 2: Schema Drift from `db push`

**Problem:** Many `db push` calls during development, then `migrate dev` wants to reset DB

**Solution:**
1. Create a "baseline drift" migration capturing all `db push` changes
2. Run `prisma migrate resolve --applied <migration-name>`
3. Future changes use `migrate dev` only

### Pitfall 3: Baseline Migration Gotchas

**Common mistakes when manually writing baseline migrations:**

- Duplicate indexes (migration creates index that already exists)
- Column nullability mismatch (`TEXT` vs `TEXT NOT NULL`)
- FK action mismatch (`ON DELETE SET NULL` vs `ON DELETE RESTRICT`)
- Checksum errors (editing after applying)

**Solution:** Cross-reference EVERY column/FK against `schema.prisma` exactly.

---

## Agent Checklist (Before Asking User to Migrate)

- [ ] Schema change is complete (not partial)
- [ ] Migration name is descriptive (action_model_change)
- [ ] If adding index, column exists in same migration
- [ ] No breaking changes without user awareness (e.g., required field on existing table)
- [ ] Suggested migration name follows convention

---

## When to Involve User

**Always ask user to run migration when:**
- Adding/removing models
- Adding/removing fields
- Changing field types (esp. required → optional or vice versa)
- Adding/removing indexes
- Changing relations (FK constraints)

**Can skip user for:**
- Updating comments in schema (no DB change)
- Changing Prisma config (generator, datasource)

---

## Example: Full Workflow

### Agent Output (Correct Pattern)

```markdown
I've updated the Prisma schema to add the AIConsent model for SEC-32.

**Changes:**
- New model: `AIConsent`
- Relations: `User.aiConsent` (1:1), `Tenant.aiConsents` (1:many)
- Indexes: `userId`, `tenantId`, composite `userId_tenantId`

⚠️ **MIGRATION REQUIRED**

Please run:
```bash
cd packages/db
npx prisma migrate dev --name add_ai_consent_model
```

After the migration completes, let me know and I'll:
1. Generate Prisma types (`prisma generate`)
2. Create the AIConsentService
3. Add API routes
4. Update tests

Waiting for migration confirmation...
```

### User Action

```bash
cd packages/db
npx prisma migrate dev --name add_ai_consent_model
# [Prisma generates migration and applies it]
# ✅ Migration applied successfully
```

### Agent Continues

```markdown
✅ Migration confirmed! Detected: `20260227160951_add_ai_consent_model/`

Continuing with service and route creation...
```

---

## Error Recovery

### If User Sees "Shadow DB" Error

**Cause:** Migration ordering or drift

**Agent should:**
1. Read the error message
2. Check migration timestamps
3. Suggest: "Run `npx prisma migrate dev` again - it will detect and fix ordering"

### If User Sees "Drift Detected"

**Cause:** `db push` was used previously

**Agent should:**
1. Suggest creating baseline migration
2. Provide exact SQL to reconcile
3. Walk through `prisma migrate resolve --applied`

### If User Sees "Checksum Mismatch"

**Cause:** Migration file edited after applying

**Agent should:**
1. Delete old `_prisma_migrations` record for that migration
2. Re-run `prisma migrate resolve --applied <name>`

---

## Summary: Agent Responsibilities

| Step | Agent Can Do? | Action |
|------|---------------|--------|
| Edit schema.prisma | ✅ YES | Make changes |
| Run `migrate dev` | ❌ NO | Ask user with clear instructions |
| Suggest migration name | ✅ YES | Follow conventions |
| Verify migration applied | ✅ YES | Check migration folder exists |
| Run `prisma generate` | ✅ YES | Generate TypeScript types |
| Create service/routes | ✅ YES | After migration confirmed |

**Golden Rule:** If it requires interactive input, **ask the user**.

---

_Created: 2026-02-27. Prevents 15-minute Prisma troubleshooting loops._
