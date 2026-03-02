# Prisma Schema Review: Entity Management Hub

> **Auditor:** prisma-migration-reviewer
> **Date:** 2026-02-20
> **Scope:** Entity model (lines 62-109), EntityType enum (line 1056), proposed EntityStatus enum, proposed EntityRelationship model, tenant isolation middleware, entity service and routes
> **Risk Level:** HIGH

---

## Migration Safety Assessment

| Check | Status | Notes |
|-------|--------|-------|
| Adding non-nullable field with default | SAFE | `status EntityStatus @default(ACTIVE)` -- Prisma generates `ALTER TABLE ... ADD COLUMN ... DEFAULT 'ACTIVE' NOT NULL`. PostgreSQL 11+ handles this without a full table rewrite since it stores the default in the catalog. Existing rows get the default on read, not written eagerly. Safe for production. |
| Adding nullable fields | SAFE | `entitySubType String?` and `registrationDate DateTime?` add nullable columns. PostgreSQL adds these as metadata-only operations -- no table lock beyond `ACCESS EXCLUSIVE` for the brief DDL. Zero data migration required. |
| New enum creation | SAFE | `EntityStatus` is a new enum (`CREATE TYPE`). No existing data references it. The subsequent `ADD COLUMN ... DEFAULT` uses the new type. Both are safe single-step DDL operations. |
| New table creation | SAFE | `EntityRelationship` is a brand new table with no existing data. `CREATE TABLE` is a safe operation. However, the table design has critical flaws (see findings below). |
| Data migration needed | NO | All new fields have defaults or are nullable. No backfill script required. Existing Entity rows will appear as `status = ACTIVE` automatically. |
| Backward compatible | YES (with caveats) | Adding fields and a table is backward compatible. However, new reverse relations on Entity (`relationshipsFrom`, `relationshipsTo`) and Tenant (`entityRelationships`) change the Prisma Client type signature. Any code doing `Object.keys(entity)` or spread-serializing an entity with `include: {}` will see new properties. Low risk but worth noting. |

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `packages/db/prisma/schema.prisma` | 1069 | Full Prisma schema -- Entity model (62-109), EntityType enum (1056-1062), all entity-scoped models, existing cascade rules, index strategy |
| `packages/db/index.ts` | 115 | Prisma client singleton, tenant isolation middleware (`TENANT_SCOPED_MODELS`, `RELATION_KEYS`), `hasTenantFilter()` function |
| `apps/api/src/domains/system/services/entity.service.ts` | 119 | Current EntityService -- listEntities, getEntity, createEntity, updateEntity |
| `apps/api/src/domains/system/routes.ts` | 432 | System routes -- entity CRUD endpoints, Zod schemas, RBAC guards |
| `apps/api/src/domains/system/routes/entity.ts` | 83 | Entity sub-routes -- business details PATCH endpoint |
| `apps/api/src/domains/system/services/__tests__/entity.service.test.ts` | 442 | Entity service unit tests |
| `apps/web/src/lib/api/entities.ts` | 49 | Frontend Entity type definition and API client functions |
| `docs/plans/2026-02-20-entity-management-hub.md` | 530 | Full implementation plan with proposed schema changes |

---

## Findings

### P0-1: `ownershipPercent Float?` violates the project's numeric precision invariant

**Severity:** P0 (CRITICAL -- contradicts core financial data philosophy)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:57` (proposed EntityRelationship model)

**Issue:** The plan specifies `ownershipPercent Float?` for tracking inter-entity ownership. This project has an explicit invariant (Key Invariant #2) that monetary and percentage values must avoid IEEE 754 floating-point to prevent precision errors. The codebase documents this as "Integer cents (NEVER Floats)" and extends the principle to all numeric precision-sensitive fields.

Consider the ownership validation logic the plan describes:

```typescript
// validateOwnershipTotal(entityId) -- sum of ownership % for an entity <= 100
// With Float:
const total = 33.33 + 33.33 + 33.34;
// total === 99.99999999999999 (NOT 100.0)
// OR worse:
const total = 0.1 + 0.2;
// total === 0.30000000000000004
```

The plan proposes `detectCircularOwnership` and `validateOwnershipTotal` functions that sum Float values. These will produce false positives and false negatives depending on how equality checks are written.

**Impact:** Ownership validation (`sum <= 100`) will intermittently reject valid splits or accept invalid ones. This is the exact bug class the project designed around by using integer cents.

**Suggested Fix:** Use integer basis points (10000 = 100.00%) or `Decimal(5,2)`:

```prisma
// Option A: Integer basis points (preferred -- matches project philosophy)
ownershipBasisPoints  Int?  // 10000 = 100%, 3333 = 33.33%, null for non-ownership

// Option B: Prisma Decimal (acceptable but less consistent with codebase)
ownershipPercent  Decimal?  @db.Decimal(5, 2)  // 0.00 to 100.00
```

Option A is strongly preferred because:
- It matches the integer-based pattern used everywhere else in the codebase
- Validation becomes `SUM(ownershipBasisPoints) <= 10000` -- exact integer math
- No special Prisma `Decimal` handling needed (Decimal comes back as `Prisma.Decimal` objects, not native numbers, requiring `.toNumber()` calls)
- Serialization to JSON is trivial (it is just an integer)

If Option A is chosen, the service would look like:

```typescript
async validateOwnershipTotal(entityId: string): Promise<boolean> {
  const result = await prisma.entityRelationship.aggregate({
    where: { targetEntityId: entityId },
    _sum: { ownershipBasisPoints: true },
  });
  return (result._sum.ownershipBasisPoints ?? 0) <= 10000;
}
```

---

### P0-2: `@@unique([sourceEntityId, targetEntityId, relationshipType])` with nullable `targetEntityId` is broken

**Severity:** P0 (CRITICAL -- unique constraint does not work as intended)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:70` (proposed unique constraint)

**Issue:** In PostgreSQL, `NULL != NULL`. A unique constraint that includes a nullable column treats every NULL as distinct. This means the proposed constraint will NOT prevent duplicate "external" relationships (where `targetEntityId` is NULL).

Concrete scenario:

```sql
-- Both inserts succeed despite being logically duplicate:
INSERT INTO "EntityRelationship" ("sourceEntityId", "targetEntityId", "relationshipType")
VALUES ('entity-A', NULL, 'PARTNERSHIP');

INSERT INTO "EntityRelationship" ("sourceEntityId", "targetEntityId", "relationshipType")
VALUES ('entity-A', NULL, 'PARTNERSHIP');
-- PostgreSQL: NULL != NULL, so no unique violation raised
```

This means a user could create unlimited "external PARTNERSHIP" relationships for the same entity, and the database would not prevent it.

**Impact:** Data integrity violation. The uniqueness guarantee the plan relies on for `detectCircularOwnership` and `validateOwnershipTotal` does not hold for external relationships.

**Suggested Fix:** Use a partial unique index (PostgreSQL-specific) to handle both cases:

```prisma
// For internal relationships (targetEntityId IS NOT NULL):
@@unique([sourceEntityId, targetEntityId, relationshipType])

// For external relationships (targetEntityId IS NULL),
// Prisma does not natively support partial indexes.
// Add raw SQL in the migration file:
```

In the migration SQL, after Prisma generates the table:

```sql
-- Partial unique index for external relationships
CREATE UNIQUE INDEX "EntityRelationship_source_type_external_key"
  ON "EntityRelationship" ("sourceEntityId", "relationshipType")
  WHERE "targetEntityId" IS NULL;
```

Alternatively, redesign to avoid the NULL problem entirely by splitting internal and external relationships into separate models, or by using a sentinel value for `targetEntityId` (not recommended -- sentinel values are an anti-pattern).

The cleanest approach within a single model:

```prisma
model EntityRelationship {
  // ... fields ...

  // This covers internal relationships only
  @@unique([sourceEntityId, targetEntityId, relationshipType])
  // External uniqueness handled by partial index in migration SQL
}
```

And document in the migration that the partial index must be manually maintained if Prisma ever re-generates the migration from scratch.

---

### P0-3: Missing `tenantId` in the unique constraint enables cross-tenant entity linking

**Severity:** P0 (CRITICAL -- security vulnerability)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:70` (proposed unique constraint)

**Issue:** The proposed `@@unique([sourceEntityId, targetEntityId, relationshipType])` does not include `tenantId`. While the plan states that the service layer will validate both entities belong to the same tenant, the database itself provides no enforcement.

If the service-level check has a bug, a race condition, or a future code path skips validation, the database will happily create a cross-tenant relationship. The existing `TENANT_SCOPED_MODELS` middleware in `packages/db/index.ts` only warns on `findMany`/`findFirst`/`count`/`aggregate` -- it does not intercept `create` or `update` operations.

Additionally, `EntityRelationship` is not in the `TENANT_SCOPED_MODELS` array (line 23 of `packages/db/index.ts`) and not in `RELATION_KEYS` (line 54), so even the read-path warnings will not fire.

**Impact:** Cross-tenant data leakage. Entity A in Tenant 1 could be linked to Entity B in Tenant 2 if service validation is bypassed.

**Suggested Fix:**

1. Add `tenantId` to the unique constraint:

```prisma
@@unique([tenantId, sourceEntityId, targetEntityId, relationshipType])
```

2. Add `EntityRelationship` to `TENANT_SCOPED_MODELS` in `packages/db/index.ts`:

```typescript
const TENANT_SCOPED_MODELS = [
    'Entity',
    'EntityRelationship',  // <-- ADD THIS
    'GLAccount',
    // ... rest
] as const;
```

3. Add `'entityRelationship'` to the `RELATION_KEYS` array for deep tenant filter detection:

```typescript
const RELATION_KEYS = ['entity', 'account', 'invoice', 'bill', 'client', 'vendor', 'entityRelationship'];
```

---

### P1-1: Missing `onDelete` specification on EntityRelationship relations

**Severity:** P1 (HIGH -- silent data corruption)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:64-65` (proposed relations)

**Issue:** The proposed EntityRelationship model defines:

```prisma
sourceEntity    Entity   @relation("EntityRelationshipsFrom", fields: [sourceEntityId], references: [id])
targetEntity    Entity?  @relation("EntityRelationshipsTo", fields: [targetEntityId], references: [id])
```

Neither relation specifies `onDelete`. Prisma's default behavior for required relations (`sourceEntity`) is `onDelete: Cascade` at the database level (for PostgreSQL). For optional relations (`targetEntity`), the default is `onDelete: SetNull`.

This means:
- Deleting a source entity cascades and deletes all its outbound relationships (acceptable but should be explicit)
- Deleting a target entity silently sets `targetEntityId = NULL`, converting an internal relationship into an "external" one with `externalName = NULL` and `externalDetails = NULL` -- a corrupted record with no name and no details

**Impact:** Deleting an entity that is the target of a relationship silently corrupts the relationship into an unnamed external partner. The user sees a relationship with no name, no details, and no way to understand what it pointed to.

**Suggested Fix:**

```prisma
sourceEntity    Entity   @relation("EntityRelationshipsFrom", fields: [sourceEntityId], references: [id], onDelete: Cascade)
targetEntity    Entity?  @relation("EntityRelationshipsTo", fields: [targetEntityId], references: [id], onDelete: Restrict)
```

Using `onDelete: Restrict` on `targetEntity` prevents deleting an entity that is referenced as a relationship target. The user must explicitly remove the relationship first, then delete the entity. This is the safest pattern and matches the financial data philosophy of preventing silent data loss.

If `Restrict` is too strict for UX (e.g., archiving an entity shouldn't be blocked by relationships), then use `Cascade` to delete the relationship record entirely -- which is still better than corrupting it into an anonymous external partner.

---

### P1-2: Missing `onDelete` on Tenant relation in EntityRelationship

**Severity:** P1 (HIGH -- referential integrity gap)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:63` (proposed Tenant relation)

**Issue:** The proposed:

```prisma
tenant   Tenant   @relation(fields: [tenantId], references: [id])
```

Has no `onDelete` specification. Prisma's default for required relations to PostgreSQL is `Cascade`. If a Tenant is deleted, all EntityRelationship records for that tenant would be cascade-deleted. While tenant deletion is an extreme event, it should be explicit.

The existing codebase has only one explicit cascade to Tenant: `OnboardingProgress` at line 839. All other tenant-scoped models do not specify `onDelete` and rely on the implicit default.

**Impact:** Low immediate risk (tenants are rarely deleted), but inconsistency with the desired explicit-cascade policy.

**Suggested Fix:** Add `onDelete: Cascade` explicitly to match the OnboardingProgress pattern, or `onDelete: Restrict` if tenant deletion should be blocked when relationships exist:

```prisma
tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
```

---

### P1-3: Missing `@@index([tenantId, status])` on Entity model for new status-filtered queries

**Severity:** P1 (HIGH -- performance regression on production)
**Location:** `packages/db/prisma/schema.prisma:107-108` (existing Entity indexes)

**Issue:** The plan adds a `status` field to Entity and proposes filtering entities by status (Task 4: `listEntities()` with optional `status` filter, Task 11: filter pills for All / Active / Pre-Registration / Archived). The existing Entity indexes are:

```prisma
@@index([tenantId])
@@index([tenantId, type])
```

There is no composite index covering `(tenantId, status)`. When the new `listEntities()` method filters by both `tenantId` and `status`:

```typescript
prisma.entity.findMany({
  where: { tenantId: ctx.tenantId, status: 'ACTIVE' },
})
```

PostgreSQL will use the `tenantId` index to narrow rows, then do a sequential filter on `status`. For tenants with many entities (unlikely now, but the index should exist for correctness), this is suboptimal.

**Impact:** Not critical at current scale (most tenants have 1-3 entities), but schema design should anticipate growth. Every other model with a status field has a composite index with its scoping field (e.g., `@@index([entityId, status])` on Invoice, Bill, JournalEntry).

**Suggested Fix:** Add to the Entity model:

```prisma
@@index([tenantId, status])  // Composite for status-filtered entity queries
```

---

### P1-4: `externalDetails Json?` has no size constraint or schema validation

**Severity:** P1 (HIGH -- stored XSS and resource exhaustion)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:59` (proposed field)

**Issue:** The proposed `externalDetails Json?` field has no schema, no maximum size, and no validation. A user could:

1. Store a 100MB JSON blob in a single EntityRelationship record
2. Store HTML/JavaScript in JSON string fields that gets rendered in the frontend
3. Store deeply nested JSON that causes stack overflows during serialization

The existing codebase uses `Json` fields in several places (onboardingData, conditions, action, rawData), but those are either system-generated (not user-input) or have application-level validation.

**Impact:** Resource exhaustion (large payloads), stored XSS if frontend renders JSON values as HTML, and potential denial-of-service through deeply nested structures.

**Suggested Fix:** This is primarily a service-layer concern, not a schema concern. The Prisma schema cannot enforce JSON structure. The fix belongs in the Zod validation schema for the create/update endpoints:

```typescript
const ExternalDetailsSchema = z.object({
  registrationNumber: z.string().max(100).optional(),
  jurisdiction: z.string().max(100).optional(),
  website: z.string().url().max(500).optional(),
  notes: z.string().max(2000).optional(),
}).strict();  // .strict() rejects unknown keys
```

Document in the plan that `externalDetails` must have a Zod schema and that the total JSON payload must be validated to be under a reasonable size (e.g., 10KB).

---

### P1-5: `relationshipType String` should be an enum, not a freeform string

**Severity:** P1 (HIGH -- data integrity)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:56` (proposed field)

**Issue:** The plan specifies `relationshipType String` with documented values "OWNERSHIP, PARTNERSHIP, PARENT_SUBSIDIARY". Using a String instead of a Prisma enum means:

1. The database cannot validate the value -- any string is accepted
2. Typos like "OWERSHIP" or "partnership" (lowercase) are silently stored
3. Querying requires case-sensitive matching with no DB-level guarantee
4. The unique constraint includes this field -- typos create duplicate relationships that appear different

The project's existing pattern uses enums for all fixed-set status/type fields (EntityType, InvoiceStatus, BillStatus, AccountType, etc.).

**Impact:** Inconsistent relationship types in the database. The unique constraint `[sourceEntityId, targetEntityId, relationshipType]` treats "OWNERSHIP" and "ownership" as different values.

**Suggested Fix:** Create a proper enum:

```prisma
enum EntityRelationshipType {
  OWNERSHIP
  PARTNERSHIP
  PARENT_SUBSIDIARY
}

model EntityRelationship {
  // ...
  relationshipType  EntityRelationshipType
  // ...
}
```

This is safe for future extension: `ALTER TYPE "EntityRelationshipType" ADD VALUE 'JOINT_VENTURE'` is a non-breaking, non-transactional operation in PostgreSQL.

---

### P2-1: Entity model has no soft delete (`deletedAt`) field

**Severity:** P2 (MEDIUM -- inconsistency, not immediately dangerous)
**Location:** `packages/db/prisma/schema.prisma:62-109` (existing Entity model)

**Issue:** The Entity model does not have a `deletedAt` field, and the plan proposes adding `status: EntityStatus @default(ACTIVE)` with an `ARCHIVED` value as the mechanism for entity retirement. This is not technically a soft delete -- it is a status change.

However, this creates an inconsistency: the plan's `archiveEntity()` function sets `status = ARCHIVED`, but there is no `deletedAt` timestamp. Other models in the system (Invoice, Bill, Payment, JournalEntry, Account, Transaction) all use `deletedAt` for soft delete and have the `@@index([entityId, deletedAt])` pattern.

If a future requirement adds actual entity deletion (e.g., a user wants to permanently remove a test entity), there is no soft delete mechanism. The `ARCHIVED` status serves a different purpose (entity is retired but preserved for historical data).

**Impact:** Low immediate risk. The `ARCHIVED` status is functionally adequate for V1. But the absence of `deletedAt` on Entity means the data export service (`data-export.service.ts`) and audit queries cannot include/exclude "deleted" entities using the same pattern as other models.

**Suggested Fix:** Consider adding `deletedAt DateTime?` to Entity alongside the status field, so that `ARCHIVED` means "retired but visible in history" and `deletedAt` means "soft-deleted, excluded from normal queries." This is not blocking for V1 but should be on the schema roadmap.

---

### P2-2: `EntityType` enum cannot be extended without a migration

**Severity:** P2 (MEDIUM -- operational concern for future)
**Location:** `packages/db/prisma/schema.prisma:1056-1062` (existing EntityType enum)

**Issue:** The current `EntityType` enum has 5 values:

```prisma
enum EntityType {
  PERSONAL
  CORPORATION
  LLC
  PARTNERSHIP
  SOLE_PROPRIETORSHIP
}
```

The plan correctly proposes using `entitySubType String?` for jurisdiction-specific sub-types (e.g., "S_CORP", "FEDERAL_CORP"), which avoids enum churn. However, there are entity structures in other jurisdictions that do not map to any of the 5 base types:

- UK: LLP (Limited Liability Partnership) -- is this PARTNERSHIP or LLC?
- India: HUF (Hindu Undivided Family) -- no mapping
- Australia: Trust -- no mapping
- EU: SE (Societas Europaea) -- no mapping

The plan acknowledges this by using `entitySubType` as the jurisdiction-specific detail. But the base `EntityType` must still be one of the 5 values, which forces awkward mappings for non-Western entity structures.

**Impact:** No immediate data loss risk. The combination of `EntityType` + `entitySubType` is flexible enough for V1. But adding new base types later requires a Prisma migration with `ALTER TYPE ... ADD VALUE`, which has a PostgreSQL-specific constraint: it cannot run inside a transaction. Prisma handles this by splitting the migration, but it should be documented.

**Suggested Fix:** Document in the migration file that future `EntityType` additions will require:

```sql
-- PostgreSQL: ALTER TYPE ... ADD VALUE cannot be in a transaction
-- Prisma auto-handles this by splitting the migration, but verify
ALTER TYPE "EntityType" ADD VALUE 'TRUST';
ALTER TYPE "EntityType" ADD VALUE 'LLP';
```

No schema change needed now. The current `entitySubType String?` design is the correct approach.

---

### P2-3: Reverse relations on Entity model increase Prisma Client type surface

**Severity:** P2 (MEDIUM -- TypeScript compatibility)
**Location:** `docs/plans/2026-02-20-entity-management-hub.md:73` (proposed reverse relations)

**Issue:** Adding reverse relations to Entity:

```prisma
model Entity {
  // ... existing fields ...
  relationshipsFrom  EntityRelationship[]  @relation("EntityRelationshipsFrom")
  relationshipsTo    EntityRelationship[]  @relation("EntityRelationshipsTo")
}
```

Changes the generated Prisma Client type for `Entity`. Any code that uses `Prisma.EntityGetPayload<{}>` or explicit type assertions against the Entity shape will see new optional array properties.

This is generally safe because Prisma's `select` and `include` are opt-in -- you only get `relationshipsFrom` if you explicitly `include` it. However, the frontend type in `apps/web/src/lib/api/entities.ts` (line 8) defines its own `Entity` interface that is manually maintained:

```typescript
export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    currency: string;
    country?: string;
}
```

This interface will not break (it does not reference relationships), but it will drift further from the Prisma-generated type.

**Impact:** TypeScript compilation will not break. But the manual `Entity` interface in the frontend diverges from the actual Prisma model. When new fields (status, entitySubType) are added, this interface must be updated manually.

**Suggested Fix:** Update the frontend `Entity` interface in the same sprint as the schema change:

```typescript
export type EntityStatus = 'ACTIVE' | 'PRE_REGISTRATION' | 'ARCHIVED';

export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    status: EntityStatus;
    entitySubType?: string;
    currency: string;
    country: string;  // Make required (it IS required in schema)
    registrationDate?: string;
}
```

---

## Index Analysis

### Existing Entity Indexes

```prisma
@@index([tenantId])              // Covers: list entities by tenant
@@index([tenantId, type])        // Covers: filter entities by type within tenant
```

### Required New Indexes

| Index | Justification |
|-------|--------------|
| `@@index([tenantId, status])` on Entity | **MISSING.** New status filter queries from Task 4 (`listEntities` with status filter) need this. Without it, status filtering scans all tenant entities. |
| `@@index([tenantId])` on EntityRelationship | Proposed in plan. Correct. |
| `@@index([sourceEntityId])` on EntityRelationship | Proposed in plan. Correct. Covers "find all relationships FROM this entity." |
| `@@index([targetEntityId])` on EntityRelationship | Proposed in plan. Correct. Covers "find all relationships TO this entity." |

### Optional Indexes (Consider for V2)

| Index | Justification |
|-------|--------------|
| `@@index([tenantId, sourceEntityId])` on EntityRelationship | If queries frequently filter by tenant + source. The existing `@@index([tenantId])` covers the tenant filter, and `@@index([sourceEntityId])` covers the source filter. A composite would only help if both are always used together AND the table is large. Not needed for V1. |
| `@@index([targetEntityId, relationshipType])` on EntityRelationship | For ownership total validation queries that filter by target + type. Not needed until relationship count per entity is significant. |

### Indexes NOT Needed

| Index | Reason |
|-------|--------|
| `@@index([tenantId, type, status])` on Entity | Three-column composite. Unlikely query pattern. `tenantId + status` and `tenantId + type` are sufficient. |
| Full-text index on `externalName` | Not a search field. Exact match or LIKE queries are fine at expected scale. |

---

## Enum Strategy Assessment

The plan proposes keeping the `EntityType` enum (5 values) and adding `entitySubType String?` for jurisdiction-specific sub-types. This is evaluated below.

### Option A: Current Plan (EntityType enum + entitySubType String?)

**Pros:**
- No enum churn when adding jurisdiction-specific types
- Base EntityType is stable and unlikely to change
- `entitySubType` can hold any jurisdiction-specific label without migration
- The select UI can show `entitySubType` as a display label while storing the base `EntityType` for queries and reports

**Cons:**
- Two fields to maintain (`type` + `entitySubType`)
- Queries filtering by sub-type use string matching (no DB-level validation)
- `entitySubType` values are not validated by the schema -- "S_Corp" and "S_CORP" are different

**Verdict:** ACCEPTABLE. This is the correct trade-off for a multi-jurisdiction product. The alternative (adding every sub-type as an enum value) would require migrations each time a new country is supported.

### Option B: Single Enum with All Types

```prisma
enum EntityType {
  PERSONAL
  US_CORPORATION
  US_LLC
  US_S_CORP
  CA_CORPORATION
  CA_SOLE_PROPRIETORSHIP
  UK_LTD
  // ... 30+ values
}
```

**Verdict:** REJECTED. This creates migration churn, is not scalable, and couples database schema to jurisdiction data.

### Option C: EntityType as String (no enum)

```prisma
model Entity {
  type  String  // "CORPORATION", "LLC", etc.
}
```

**Verdict:** REJECTED. Loses type safety on the base classification. The base `EntityType` enum is small, stable, and benefits from DB-level validation.

### Recommendation

Keep Option A (the plan's approach). Add application-level validation for `entitySubType` via Zod:

```typescript
const VALID_SUBTYPES: Record<string, string[]> = {
  US: ['S_CORP', 'C_CORP', 'BENEFIT_CORP'],
  CA: ['FEDERAL_CORP', 'PROVINCIAL_CORP'],
  UK: ['LTD', 'PLC', 'LLP', 'CIC'],
};

const entitySubTypeValidator = z.string()
  .max(50)
  .transform(val => val.toUpperCase())  // Normalize casing
  .optional();
```

---

## Recommendations

### Must Do Before Sprint 1

1. **Replace `ownershipPercent Float?` with `ownershipBasisPoints Int?`** (P0-1). This is non-negotiable given the project's numeric precision philosophy.

2. **Fix the unique constraint** (P0-2). Either use a partial unique index in raw SQL or redesign to avoid nullable columns in unique constraints.

3. **Add `tenantId` to the unique constraint** (P0-3). Database-level tenant isolation is a defense-in-depth requirement.

4. **Add `onDelete: Restrict` to `targetEntity` relation** (P1-1). Silent data corruption from `SetNull` is unacceptable.

5. **Create `EntityRelationshipType` enum** instead of using `String` (P1-5). Matches project conventions and prevents typo-based data corruption.

6. **Add `@@index([tenantId, status])` to Entity** (P1-3). Required for the new status-filtered queries.

7. **Add `EntityRelationship` to `TENANT_SCOPED_MODELS`** in `packages/db/index.ts` (P0-3). Otherwise the tenant isolation middleware will not warn on unscoped queries.

### Should Do During Sprint 1

8. **Define a Zod schema for `externalDetails`** (P1-4). Do not allow arbitrary JSON input from users.

9. **Update the frontend `Entity` interface** to include `status`, `entitySubType`, and make `country` required (P2-3).

10. **Add explicit `onDelete` to all EntityRelationship relations** (P1-1, P1-2). Do not rely on Prisma defaults.

### Recommended Final EntityRelationship Schema

```prisma
enum EntityRelationshipType {
  OWNERSHIP
  PARTNERSHIP
  PARENT_SUBSIDIARY
}

enum EntityStatus {
  ACTIVE
  PRE_REGISTRATION
  ARCHIVED
}

model Entity {
  // ... existing fields ...
  status             EntityStatus       @default(ACTIVE)
  entitySubType      String?
  registrationDate   DateTime?
  relationshipsFrom  EntityRelationship[] @relation("EntityRelationshipsFrom")
  relationshipsTo    EntityRelationship[] @relation("EntityRelationshipsTo")

  @@index([tenantId])
  @@index([tenantId, type])
  @@index([tenantId, status])  // NEW: status-filtered queries
}

model EntityRelationship {
  id                    String                    @id @default(cuid())
  tenantId              String
  sourceEntityId        String
  targetEntityId        String?
  relationshipType      EntityRelationshipType
  ownershipBasisPoints  Int?                      // 10000 = 100%, null for non-ownership
  externalName          String?
  externalDetails       Json?
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt

  tenant        Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  sourceEntity  Entity  @relation("EntityRelationshipsFrom", fields: [sourceEntityId], references: [id], onDelete: Cascade)
  targetEntity  Entity? @relation("EntityRelationshipsTo", fields: [targetEntityId], references: [id], onDelete: Restrict)

  @@unique([tenantId, sourceEntityId, targetEntityId, relationshipType])
  @@index([tenantId])
  @@index([sourceEntityId])
  @@index([targetEntityId])
}
```

Plus the manual partial unique index in the migration SQL:

```sql
-- Prevent duplicate external relationships (where targetEntityId IS NULL)
CREATE UNIQUE INDEX "EntityRelationship_tenant_source_type_external_key"
  ON "EntityRelationship" ("tenantId", "sourceEntityId", "relationshipType")
  WHERE "targetEntityId" IS NULL;
```

### Migration SQL Expectations

The generated migration should contain approximately:

```sql
-- 1. Create new enum types
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'PRE_REGISTRATION', 'ARCHIVED');
CREATE TYPE "EntityRelationshipType" AS ENUM ('OWNERSHIP', 'PARTNERSHIP', 'PARENT_SUBSIDIARY');

-- 2. Add new columns to Entity (safe: default + nullable)
ALTER TABLE "Entity" ADD COLUMN "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Entity" ADD COLUMN "entitySubType" TEXT;
ALTER TABLE "Entity" ADD COLUMN "registrationDate" TIMESTAMP(3);

-- 3. Create new table
CREATE TABLE "EntityRelationship" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT,
    "relationshipType" "EntityRelationshipType" NOT NULL,
    "ownershipBasisPoints" INTEGER,
    "externalName" TEXT,
    "externalDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EntityRelationship_pkey" PRIMARY KEY ("id")
);

-- 4. Add indexes
CREATE INDEX "Entity_tenantId_status_idx" ON "Entity"("tenantId", "status");
CREATE INDEX "EntityRelationship_tenantId_idx" ON "EntityRelationship"("tenantId");
CREATE INDEX "EntityRelationship_sourceEntityId_idx" ON "EntityRelationship"("sourceEntityId");
CREATE INDEX "EntityRelationship_targetEntityId_idx" ON "EntityRelationship"("targetEntityId");
CREATE UNIQUE INDEX "EntityRelationship_tenantId_sourceEntityId_targetEntityId_relationshipType_key"
  ON "EntityRelationship"("tenantId", "sourceEntityId", "targetEntityId", "relationshipType");

-- 5. Manual: Partial unique index for external relationships
CREATE UNIQUE INDEX "EntityRelationship_tenant_source_type_external_key"
  ON "EntityRelationship" ("tenantId", "sourceEntityId", "relationshipType")
  WHERE "targetEntityId" IS NULL;

-- 6. Add foreign keys
ALTER TABLE "EntityRelationship"
  ADD CONSTRAINT "EntityRelationship_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EntityRelationship"
  ADD CONSTRAINT "EntityRelationship_sourceEntityId_fkey"
  FOREIGN KEY ("sourceEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EntityRelationship"
  ADD CONSTRAINT "EntityRelationship_targetEntityId_fkey"
  FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

**Review the generated migration against this template.** Verify:
- `DEFAULT 'ACTIVE'` is present on the status column (prevents table lock/rewrite)
- Foreign keys have explicit `ON DELETE` clauses
- The partial unique index is included (Prisma will not generate it -- must be added manually)

---

## Approval Status

- **Status:** CHANGES REQUIRED
- **Reason:** Three P0 findings (Float for ownership, broken unique constraint with NULL, missing tenantId in unique constraint) must be resolved before any migration is generated. Two P1 findings (missing onDelete specifications, missing index) should be resolved in the same migration to avoid a second migration pass. The recommended final schema above addresses all findings.
