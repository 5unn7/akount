# Refactoring Protocol

---
paths:
  - "**"
---

> **Auto-loaded globally** — best practices for multi-file refactoring work

## When This Applies

This protocol applies to any work that requires changing **3+ files** with similar patterns:
- Consolidating utilities (formatCurrency, formatDate, etc.)
- Extracting shared components (StatusBadge, EmptyState, etc.)
- Renaming functions/variables across files
- Updating imports across multiple files

---

## Step-by-Step Protocol

### Phase 1: Discovery (10-15 min)

1. **Find all instances** — Use Grep to locate pattern
   ```bash
   Grep "function formatCurrency" apps/web/src --output_mode=files_with_matches
   ```

2. **Analyze variations** — Read 2-3 files to understand differences
   - Are signatures identical?
   - Any edge cases or special handling?
   - Any dependencies on local state?

3. **Create canonical version** — Write ONE shared utility/component
   - Include all variations as parameters/props
   - Add JSDoc with examples
   - Test in isolation if possible

### Phase 2: Prove Pattern (5-10 min)

4. **Pick ONE representative file** — Choose typical example

5. **Read the ENTIRE file** (not just grep snippet)
   ```typescript
   Read apps/web/src/components/business/InvoiceTable.tsx
   ```

6. **Make the change using Edit tool** (NOT bash sed/awk)
   - Copy exact strings from Read output for old_string
   - Verify string match before editing

7. **Verify compilation**
   ```bash
   cd apps/web && npx tsc --noEmit
   ```

8. **If errors:** Fix them before proceeding to other files
9. **If success:** Document exact pattern used

### Phase 3: Scale (Choose ONE approach)

**Approach A: Manual (for 3-5 files)**
- Use Edit tool for each remaining file
- Read → Edit → Verify for each
- Safe but slower

**Approach B: Delegate to Agent (for 6+ files)**
- Prove pattern in 1-2 files manually (Phase 2)
- Document exact changes made
- Use Task agent with detailed instructions:
  ```
  Task: Replace inline formatDate with import from @/lib/utils/date

  Pattern proven in InvoiceTable.tsx:
  1. Add import: import { formatDate } from '@/lib/utils/date'
  2. Remove inline function (lines 30-38)
  3. Keep all existing usage (no signature changes)

  Apply to remaining 12 files: [list files]
  ```

**Approach C: Bash Script (AVOID on Windows)**
- Only use for trivial find/replace (no regex, no multi-line)
- Test on ONE file first
- Prefer Edit tool if any complexity

---

## Anti-Patterns (What NOT to Do)

### ❌ Don't: Batch Edit Before Proving

```bash
# ❌ BAD - Update 15 files without testing
for file in *.tsx; do
  sed -i 's/old/new/' "$file"  # Might break 15 files
done
```

```typescript
// ✅ GOOD - Prove on ONE file first
Read InvoiceTable.tsx
Edit InvoiceTable.tsx  // Verify this works
npx tsc --noEmit       // Confirm no errors
// THEN replicate to others
```

### ❌ Don't: Use Bash Text Tools on Windows

```bash
# ❌ BAD - Windows shell escaping issues
awk '/pattern/ { !skip }' file.tsx   # Fails on Windows
sed -i 's/\(group\)/\1/g' file.tsx   # Escaping nightmare
```

```typescript
// ✅ GOOD - Use Edit tool (cross-platform)
Read file.tsx
Edit file.tsx with old_string="exact match" new_string="replacement"
```

### ❌ Don't: Edit Without Reading

```bash
# ❌ BAD - Assume structure from grep
Grep "formatDate" component.tsx  // Shows line 42
Edit component.tsx old_string="function formatDate() {" ...  # FAILS - actual signature different
```

```typescript
// ✅ GOOD - Read first, copy exact string
Read component.tsx
// See actual code: function formatDate(dateStr: string): string {
Edit component.tsx old_string="function formatDate(dateStr: string): string {"
```

---

## Tool Choice Matrix

| Task | Files | Recommended Tool | Why |
|------|-------|------------------|-----|
| Simple find/replace | 1-2 | **Edit** | Precise, verifiable |
| Pattern refactoring | 3-5 | **Edit** (manual) | Prove pattern first |
| Bulk refactoring | 6-20 | **Task agent** | After pattern proven |
| Mass rename | 20+ | **Task agent** | Too tedious manually |
| Text manipulation | Any | **Never bash** on Windows | Escaping issues |

---

## Verification Checklist

After completing refactoring work, verify:

- [ ] **TypeScript compiles** — `cd apps/web && npx tsc --noEmit`
- [ ] **No inline duplicates remain** — `Grep "function formatX" apps/ | grep -v utils/`
- [ ] **Imports added to all files** — `Grep "import.*formatX" apps/`
- [ ] **Consistent behavior** — All files use same utility with same locale/formatting
- [ ] **Documentation updated** — Canonical location added to frontend-conventions.md

---

## Example: formatCurrency Consolidation (Good)

### Discovery
```bash
Grep "function formatCurrency" apps/web/src  # Found 5 instances
Read currency.ts  # Canonical version exists
```

### Prove Pattern (ONE file)
```typescript
Read AgingBar.tsx  // Get exact import block and function
Edit AgingBar.tsx  // Add import, remove inline function
cd apps/web && npx tsc --noEmit  // ✅ Compiles
```

### Scale (4 remaining files)
```typescript
// Replicate exact pattern to:
Edit UpcomingPayments.tsx  // Same changes
Edit reports.ts            // Same changes
// etc.
```

### Verify
```bash
Grep "function formatCurrency" apps/web/src | grep -v utils/  # 0 results ✅
npx tsc --noEmit  # No errors ✅
```

---

## When Things Go Wrong

**If edits fail repeatedly (3+ failed Edit attempts):**
1. Stop trying to force it
2. Read the ENTIRE file (not just snippet)
3. Verify you're using exact strings (no extra spaces, tabs, etc.)
4. Consider delegating to Task agent instead

**If bash commands fail on Windows:**
1. Don't retry with different escaping
2. Switch to Edit tool immediately
3. Update this protocol with the lesson learned

**If unsure about scaling:**
1. Prove pattern in 1-2 files manually
2. Show user what you've done
3. Ask: "Should I continue manually or delegate to agent?"

---

_Lines: ~140. Protocol for safe multi-file refactoring. Created: 2026-02-22_
