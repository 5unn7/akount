# Akount Documentation

> **Last Updated:** 2026-02-05
> **Source of Truth:** This `docs/` folder

## Documentation Structure

| Folder | Purpose | When to Use |
|--------|---------|-------------|
| `design-system/` | UI/UX specifications | Building features, reviewing UI |
| `standards/` | Implementation rules | Writing code, code reviews |
| `architecture/` | Technical decisions | Understanding system design |
| `guides/` | How-to guides | Onboarding, setup |
| `product/` | Product overview | Understanding the product |
| `restructuring/` | Phase execution plans | Executing restructure |
| `archive/` | Historical docs | Reference only |

## Quick Links

### For Developers

- **[Setup Guide](./guides/setup.md)** - Get started with development
- **[API Standards](./standards/api-design.md)** - Fastify route patterns
- **[Financial Data Rules](./standards/financial-data.md)** - Money handling
- **[Multi-tenancy](./standards/multi-tenancy.md)** - Tenant isolation
- **[Security](./standards/security.md)** - OWASP, input validation

### For UI/UX

- **[Design Philosophy](./design-system/00-foundations/philosophy.md)** - Design principles
- **[Components](./design-system/01-components/)** - Component specifications
- **[Patterns](./design-system/02-patterns/)** - UI patterns
- **[Screens](./design-system/03-screens/)** - Feature specifications

### For Reviewers

- **[Information Architecture](./design-system/05-governance/information-architecture.md)** - Domain structure
- **[Permissions Matrix](./design-system/05-governance/permissions-matrix.md)** - RBAC roles
- **[SOC 2 Controls](./design-system/06-compliance/soc2.md)** - Compliance

## Folder Details

```
docs/
├── design-system/              # UI/UX specifications
│   ├── 00-foundations/         # Colors, typography, tokens
│   ├── 01-components/          # Component specs
│   ├── 02-patterns/            # Navigation, forms, tables
│   ├── 03-screens/             # Feature specifications
│   ├── 04-workflows/           # User flows
│   ├── 05-governance/          # IA, permissions
│   ├── 06-compliance/          # Security, SOC 2
│   └── 07-reference/           # Reference docs
│
├── standards/                  # Implementation rules
│   ├── api-design.md           # API patterns, validation
│   ├── financial-data.md       # Money, double-entry
│   ├── multi-tenancy.md        # Tenant isolation
│   └── security.md             # OWASP, input validation
│
├── architecture/               # Technical decisions
│   ├── decisions.md            # Tech stack choices
│   └── schema-design.md        # Database patterns
│
├── guides/                     # How-to guides
│   ├── setup.md                # Development setup
│   ├── passkey-auth.md         # WebAuthn guide
│   └── TRACKING-GUIDE.md       # STATUS/TASKS guide
│
├── product/                    # Product overview
│   ├── overview.md             # Product vision
│   └── data-model/README.md    # Schema documentation
│
├── restructuring/              # Phase execution (current)
│   ├── README.md               # Phase status
│   └── phase-*.md              # Phase details
│
├── brainstorms/                # Feature exploration
├── plans/                      # Implementation plans
├── solutions/                  # Solved problems
│
└── archive/                    # Historical
    ├── pre-restructure/        # Superseded docs
    └── sessions/               # Session reports
```

## Critical Standards

### Money Handling

```typescript
// CORRECT: Integer cents
amount: 1050 // $10.50

// WRONG: Never use float
amount: 10.50
```

### Multi-Tenancy

```typescript
// ALWAYS include tenantId
const data = await prisma.entity.findMany({
  where: { tenantId: user.tenantId } // REQUIRED
})
```

### RBAC Roles

- OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER, INVESTOR, ADVISOR
- See permissions matrix for access levels

## Questions?

| Question | Document |
|----------|----------|
| Implementation status? | `/STATUS.md` |
| What to work on? | `/TASKS.md` |
| Tech decisions? | `architecture/decisions.md` |
| Feature specs? | `design-system/03-screens/` |
| Coding standards? | `standards/` |
| Project context? | `/CLAUDE.md` |

## Governance

- Design system changes require review
- Standards changes require team approval
- Architecture changes require ADR

---

**Maintainer:** Engineering Team
**Last Restructured:** 2026-02-05
