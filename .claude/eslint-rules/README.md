# Akount Custom ESLint Rules

Custom ESLint rules for enforcing Akount design system standards.

---

## Rules

### `akount/no-hardcoded-colors`

**Prevents hardcoded color values in `className` attributes.**

Enforces use of semantic design tokens from `globals.css`.

**Examples:**

```tsx
// ❌ BAD - Hardcoded colors
<div className="text-[#34D399] bg-[rgba(255,255,255,0.06)]" />

// ✅ GOOD - Semantic tokens
<div className="text-ak-green glass" />
```

**Auto-fix:** The rule can auto-fix known color values to their semantic tokens.

---

## Integration

### Step 1: Add to Web App ESLint Config

**File:** `apps/web/eslint.config.mjs`

```js
import akountRules from '../../.claude/eslint-rules/index.js';

export default [
  // ... existing config
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      'akount': akountRules,
    },
    rules: {
      'akount/no-hardcoded-colors': 'error',
    },
  },
];
```

### Step 2: Test the Rule

```bash
# Lint web app
cd apps/web
npx eslint src/

# Auto-fix violations
npx eslint src/ --fix
```

---

## Token Mappings

### Hex Colors → Semantic Tokens

| Hardcoded | Token | Meaning |
|-----------|-------|---------|
| `text-[#34D399]` | `text-ak-green` | Income/success |
| `text-[#F87171]` | `text-ak-red` | Expense/error |
| `text-[#60A5FA]` | `text-ak-blue` | Transfer/info |
| `text-[#A78BFA]` | `text-ak-purple` | AI/purple |
| `text-[#2DD4BF]` | `text-ak-teal` | Teal accent |
| `text-[#F59E0B]` | `text-primary` | Primary amber |
| `text-[#71717A]` | `text-muted-foreground` | Muted text |

### RGBA Values → Utility Classes

| Hardcoded | Token | Meaning |
|-----------|-------|---------|
| `bg-[rgba(255,255,255,0.025)]` | `glass` | Glass tier 1 |
| `bg-[rgba(255,255,255,0.04)]` | `glass-2` | Glass tier 2 |
| `bg-[rgba(255,255,255,0.06)]` | `glass-3` | Glass tier 3 |
| `border-[rgba(255,255,255,0.06)]` | `border-ak-border` | Default border |
| `border-[rgba(255,255,255,0.09)]` | `border-ak-border-2` | Medium border |

**Full reference:** `.claude/rules/design-aesthetic.md`

---

## CI Integration

Add to GitHub Actions workflow:

```yaml
- name: Lint Web App
  run: |
    cd apps/web
    npx eslint src/
```

This will **fail the build** if hardcoded colors are detected.

---

## Future Rules

Potential custom rules to add:

- `akount/no-console-log` — Enforce structured logging (pino)
- `akount/no-any-type` — Ban `: any`, enforce `unknown` or specific types
- `akount/require-tenant-id` — Ensure Prisma queries filter by tenantId
- `akount/require-loading-error-states` — Ensure page.tsx has sibling loading.tsx/error.tsx

---

_Last updated: 2026-02-21_
