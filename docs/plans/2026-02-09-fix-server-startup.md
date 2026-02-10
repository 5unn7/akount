# Fix Development Server Startup Issues

## Context

The development server fails to start due to two critical issues:

1. **Missing RBAC function exports** - `withPermission.ts` imports `requireRole()` and `requirePermission()` from `rbac.ts`, but these functions don't exist. Only `withRolePermission()` is exported, causing `TypeError: requireRole is not a function`.

2. **Schema validation mismatch** - `transactions.ts` uses Fastify's type-provider pattern (ZodTypeProvider) incompletely, mixing Zod schemas with JSON Schema. Fastify cannot parse this hybrid approach, causing "data/required must be array" error.

These issues prevent both the API and web servers from starting. The goal is to get the server running with minimal changes while maintaining consistency with existing codebase patterns.

## Recommended Approach

**Fix Strategy: Minimal Changes, Maximum Consistency**

1. **Stub missing RBAC functions** - Create `requirePermission()` and `requireRole()` that delegate to existing `withRolePermission()`. This unblocks the server immediately without implementing the full permission system (planned for Phase 3).

2. **Convert transactions.ts to validation middleware pattern** - Replace type-provider setup with `validateQuery()`, `validateBody()`, `validateParams()` middleware to match the pattern used in 100% of other route files.

**Rationale:**
- Only 2 files modified (rbac.ts, transactions.ts)
- No breaking changes to existing routes
- Maintains architectural consistency
- Defers complex permission system to Phase 3 (as planned)
- Gets server running in ~30 minutes

## Implementation Steps

### Step 1: Add Missing RBAC Functions

**File:** `apps/api/src/middleware/rbac.ts`

Add these two functions after the existing `withRolePermission()` function:

```typescript
/**
 * Check if user has required permission level for a domain resource.
 *
 * TODO: Phase 3 - Implement granular permission checking
 * Currently delegates to role-based permissions as a stub.
 *
 * @param domain - Domain name (e.g., 'banking', 'accounting')
 * @param resource - Resource name (e.g., 'accounts', 'transactions')
 * @param level - Permission level ('VIEW', 'ACT', 'APPROVE', 'ADMIN')
 */
export function requirePermission(
  domain: string,
  resource: string,
  level: string
) {
  // TODO: Phase 3 - Query PermissionMatrix and check against user's role
  // For now, use role-based permissions as fallback

  // Map permission levels to roles (conservative approach)
  const rolesByLevel: Record<string, TenantUserRole[]> = {
    VIEW: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER'],
    ACT: ['OWNER', 'ADMIN', 'ACCOUNTANT'],
    APPROVE: ['OWNER', 'ADMIN'],
    ADMIN: ['OWNER', 'ADMIN'],
  };

  const allowedRoles = rolesByLevel[level] || ['OWNER'];
  return withRolePermission(allowedRoles);
}

/**
 * Check if user has one of the allowed roles.
 *
 * @param allowedRoles - Array of roles that can access this route
 */
export function requireRole(allowedRoles: TenantUserRole[]) {
  return withRolePermission(allowedRoles);
}
```

**Why:** Provides the missing exports that `withPermission.ts` imports. Delegates to existing `withRolePermission()` for conservative security.

### Step 2: Convert transactions.ts to Validation Middleware Pattern

**File:** `apps/api/src/domains/banking/routes/transactions.ts`

**Changes:**
1. Remove `ZodTypeProvider` import and `withTypeProvider<ZodTypeProvider>()` wrapper
2. Remove inline `schema` definitions from route options
3. Add `preValidation` with validation middleware (`validateQuery`, `validateParams`, `validateBody`)
4. Move auth/tenant middleware to `addHook` at function level (matches existing pattern)
5. Add explicit type assertions for request.query, request.params, request.body

**Key pattern to follow (from banking/routes.ts):**

```typescript
export async function transactionRoutes(fastify: FastifyInstance) {
  // Apply middleware globally for all routes
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);

  // Example route
  fastify.get('/', {
    preHandler: withRolePermission(['OWNER', 'ADMIN', 'ACCOUNTANT']),
    preValidation: [validateQuery(ListTransactionsQuerySchema)],
  }, async (request, reply) => {
    const query = request.query as ListTransactionsQuery;
    // ... handler logic
  });
}
```

**Update all 5 routes:**
- GET / (list transactions) - Add `validateQuery(ListTransactionsQuerySchema)`
- GET /:id (get transaction) - Add `validateParams(TransactionIdParamSchema)`
- POST / (create) - Add `validateBody(CreateTransactionSchema)`
- PATCH /:id (update) - Add `validateParams` + `validateBody`
- DELETE /:id (delete) - Add `validateParams(TransactionIdParamSchema)`

**Keep existing schemas unchanged** - They're well-designed; only change how they're applied.

## Critical Files

| File | Action | Priority |
|------|--------|----------|
| `apps/api/src/middleware/rbac.ts` | Add 2 functions (~35 lines) | CRITICAL |
| `apps/api/src/domains/banking/routes/transactions.ts` | Convert to middleware pattern (~100 lines changed) | CRITICAL |
| `apps/api/src/middleware/withPermission.ts` | No changes (will work once rbac.ts fixed) | Reference |
| `apps/api/src/domains/banking/routes.ts` | No changes (pattern to follow) | Reference |

## Verification

### 1. Server Startup
```bash
npm run dev
```

**Expected:**
- Both API (port 3001) and web (port 3000) servers start successfully
- No TypeError about missing exports
- No schema validation errors

### 2. Test Suite
```bash
cd apps/api && npm test
```

**Expected:** All 55 tests pass (no regressions)

### 3. Manual Route Testing
```bash
# Should return 401 (auth required) but not crash
curl http://localhost:3001/api/banking/transactions

# Should return 401 but not crash
curl http://localhost:3001/api/banking/transactions/cm8abc123
```

**Expected:** 401 Unauthorized (proves routes work, just need auth)

## Trade-offs

**Why stub RBAC instead of full implementation?**
- Full permission system requires PermissionMatrix table, UI, extensive testing (4-8 hours)
- Phase 3 is planned implementation phase per roadmap
- Conservative role mapping maintains security

**Why convert transactions.ts instead of fixing type-provider?**
- Matches 100% of existing route patterns (7+ files use validation middleware)
- Only 1 file uses type-provider (inconsistency)
- Easier to maintain one pattern vs two
- Follows SRP guidelines (consistency matters)

## Next Steps After Implementation

1. Run full test suite to ensure no regressions
2. Manual smoke test of transaction endpoints
3. Update STATUS.md to note RBAC stub implementation
4. Create issue for Phase 3: Full Permission System
5. Commit with clear message about RBAC stub + consistency fix
