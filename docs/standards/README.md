# Implementation Standards

> **Last Updated:** 2026-02-05

These standards define **HOW** to implement features correctly.

## Reference Design System

For **WHAT** to build, see:
- `docs/design-system/` - UI/UX specifications

## Standards

| Standard | Purpose | Criticality |
|----------|---------|-------------|
| [multi-tenancy.md](./multi-tenancy.md) | Tenant isolation patterns | **Critical** |
| [financial-data.md](./financial-data.md) | Money handling, double-entry | **Critical** |
| [security.md](./security.md) | OWASP, input validation | **Critical** |
| [api-design.md](./api-design.md) | Fastify conventions | Recommended |

## Key Rules (Zero Tolerance)

### 1. TenantId in EVERY Query
```typescript
// CORRECT
const data = await prisma.entity.findMany({
  where: { tenantId: user.tenantId } // REQUIRED
})

// WRONG - Security violation
const data = await prisma.entity.findMany({
  where: { id: entityId } // Missing tenantId
})
```

### 2. Money = Integer Cents
```typescript
// CORRECT
amount: 1050 // $10.50

// WRONG - Precision errors
amount: 10.50
```

### 3. Soft Deletes Only
```typescript
// CORRECT
await prisma.invoice.update({
  where: { id },
  data: { deletedAt: new Date() }
})

// WRONG - Destroys audit trail
await prisma.invoice.delete({ where: { id } })
```

### 4. Audit All Financial Changes
```typescript
// Every financial write must have:
createdBy: user.id,
updatedBy: user.id,
sourceDocument: JSON.stringify(originalData)
```

## When to Read Which Standard

| Task | Read |
|------|------|
| Working with tenant data | [multi-tenancy.md](./multi-tenancy.md) |
| Handling money/journals | [financial-data.md](./financial-data.md) |
| Creating API endpoints | [api-design.md](./api-design.md) |
| Processing user input | [security.md](./security.md) |

## Related Documentation

| Topic | Location |
|-------|----------|
| Tech stack decisions | `docs/architecture/decisions.md` |
| Database schema | `docs/product/data-model/README.md` |
| UI specifications | `docs/design-system/` |
| Component patterns | `docs/design-system/01-components/` |
| Permission matrix | `docs/design-system/05-governance/permissions-matrix.md` |

## Enforcement

**Critical standards** are enforced by:
- Code review checklists
- Review agents (`financial-data-validator`, `security-sentinel`)
- Middleware validation

**Recommended standards** are guidelines for consistency.

---

**Questions?** Check `/CLAUDE.md` for project context or update standards with team approval.
