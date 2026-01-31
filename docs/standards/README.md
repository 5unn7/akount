# Akount Coding Standards

**Purpose:** Domain-specific standards for Akount accounting platform
**Last Updated:** 2026-01-30

---

## Overview

These standards document Akount-specific patterns and requirements. They complement the generic coding standards in `agent-os/standards/` with domain knowledge about accounting, multi-tenancy, and financial data handling.

---

## Available Standards

### [multi-tenancy.md](./multi-tenancy.md)
**Critical:** ALL code must follow tenant isolation patterns
- Query patterns (ALWAYS filter by tenantId)
- Middleware enforcement
- Security requirements
- Common pitfalls and violations

### [financial-data.md](./financial-data.md)
**Critical:** ALL financial data must follow these rules
- Double-entry bookkeeping integrity
- Money handling (integer cents, NEVER float)
- Audit trail requirements
- Soft delete policy
- Source document preservation

### [api-design.md](./api-design.md)
**Recommended:** Fastify API conventions
- Route structure and naming
- Error handling patterns
- Request validation with Zod
- Response formatting
- Authentication middleware

### [security.md](./security.md)
**Critical:** Security requirements and OWASP compliance
- Input validation and sanitization
- Authentication and authorization
- Sensitive data handling
- SQL injection prevention
- XSS prevention
- CSRF protection

---

## How to Use

### For Developers
1. Read relevant standards before implementing features
2. Reference during code reviews
3. Update when patterns evolve

### For AI Agents
```bash
# CLAUDE.md automatically references these standards
# Agents should read relevant standards based on task:

# Working with tenant data?
→ Read docs/standards/multi-tenancy.md

# Handling money or journal entries?
→ Read docs/standards/financial-data.md

# Creating API endpoints?
→ Read docs/standards/api-design.md

# Any user input or external data?
→ Read docs/standards/security.md
```

### Integration with Agent OS
These standards work alongside `agent-os/standards/`:
- **Agent OS Standards** - Generic patterns (imports, components, monorepo)
- **Akount Standards** - Domain patterns (tenancy, accounting, security)

Use `/inject-standards` to load relevant generic standards.

---

## Enforcement

**Critical Standards (Zero Tolerance):**
- Multi-tenancy isolation
- Money precision (integer cents)
- Audit trail preservation
- Soft delete policy

**Recommended Standards (Should Follow):**
- API design patterns
- Error handling conventions
- Code organization

---

## Related Documentation

- `docs/architecture/decisions.md` - Tech stack and architecture choices
- `docs/architecture/ARCHITECTURE-HOOKS.md` - Future-proof architecture patterns
- `docs/product/data-model/README.md` - Database schema explanations
- `agent-os/standards/` - Generic coding standards

---

**Questions or proposed changes?** Discuss with team and update standards accordingly.
