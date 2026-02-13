# Development Processes

**Last Updated:** 2026-01-27
**Purpose:** Document development workflows, testing strategy, code review standards, and CI/CD pipeline.

---

## Code Organization

### Monorepo Structure (Turborepo)

```
akount/
├── apps/
│   ├── web/           # Next.js frontend
│   ├── api/           # Fastify backend
│   └── docs/          # Documentation site (optional)
├── packages/
│   ├── db/            # Prisma schema, migrations
│   ├── types/         # Shared TypeScript types
│   ├── ui/            # Shared UI components (Shadcn)
│   ├── lib/           # Shared utilities
│   └── config/        # Shared config (ESLint, TS, etc.)
├── docs/              # Architecture and product docs
├── STATUS.md          # Implementation progress
├── ROADMAP.md         # Development plan
└── TASKS.md           # Current work
```

### Layered Architecture

```
Controllers/Routes → Services → Repositories → Models
                              ↓
                         Domain Logic
                         (pure functions)
```

**Principles:**

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Injection**: Services are injected, not imported
- **Pure Domain Logic**: Business rules as pure functions
- **Thin Controllers**: Controllers orchestrate, don't contain logic

---

## Testing Strategy

### Coverage Targets

- **Unit tests**: 80%+ on domain logic, utilities
- **Integration tests**: All critical API endpoints
- **E2E tests**: 10-15 critical user journeys

### Test Pyramid

```
         /\
        /  \     E2E Tests (few, slow)
       /    \    - Full user flows
      /------\   - Playwright
     /        \
    /          \ Integration Tests (moderate)
   /            \ - API + Database
  /--------------\ - External services
 /                \
/------------------\ Unit Tests (many, fast)
                     - Pure functions
                     - Business logic
```

### Tools

- **Unit/Integration**: Vitest
- **E2E**: Playwright
- **Database**: Test containers or transaction rollback
- **Factories**: Faker for test data
- **Coverage**: NYC/Istanbul

### Testing Best Practices

- **Write tests first** (TDD where possible)
- **Test behavior, not implementation**
- **One assertion per test** (generally)
- **Descriptive test names** (`it('should reject negative amounts')`)
- **Arrange-Act-Assert** pattern

---

## Code Review & Standards

### Pull Request Workflow

1. **Feature branch** from `main`
2. **Write tests first** (TDD where possible)
3. **Implement feature**
4. **Self-review code**
5. **Create PR** with description, screenshots
6. **1-2 reviewers approve**
7. **All tests pass** (CI)
8. **Merge to `main`**
9. **Auto-deploy to staging**

### Review Checklist

Before approving, verify:

- [ ] Logic correct and efficient
- [ ] Tests cover new code
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Errors handled gracefully
- [ ] Types are correct
- [ ] Documentation updated
- [ ] No commented-out code
- [ ] No console.logs (use proper logging)

### Commit Message Format

```
type(scope): brief description

- Detailed change 1
- Detailed change 2

Closes #123
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Build, dependencies, etc.

**Examples:**

```
feat(auth): add passkey authentication

- Integrate Clerk WebAuthn
- Add sign-in/sign-up pages
- Configure middleware

Closes #42
```

```
fix(api): handle null entity in transaction endpoint

- Add null check before accessing entity.id
- Return 400 if entity not found
- Add test case for missing entity

Fixes #78
```

---

## CI/CD Pipeline (GitHub Actions)

### On Pull Request

1. **Install dependencies** (`npm ci`)
2. **Lint** (ESLint, Prettier)
3. **Type check** (TypeScript)
4. **Run unit tests** (Vitest)
5. **Run integration tests**
6. **Build frontend and backend**
7. **Security scan** (npm audit, Snyk)

**Fail if:**

- Linting errors
- Type errors
- Test failures
- Security vulnerabilities (high/critical)
- Build failures

### On Merge to Main

1. **All PR checks** (must pass)
2. **Run E2E tests** (Playwright)
3. **Deploy to staging**
4. **Run smoke tests**
5. **Manual approval for production** (required)
6. **Deploy to production**
7. **Run post-deploy health checks**

### Deployment Strategy

**Staging:**

- Auto-deploy on merge to `main`
- Latest code always available
- Used for QA and testing

**Production:**

- Manual approval required
- Deploy during low-traffic hours
- Run health checks before and after
- Monitor for 15 minutes post-deploy

**Rollback:**

- One-click rollback to previous version
- Automatically triggered if health checks fail
- Database migrations require manual intervention

**Database Migrations:**

- Run automatically on deploy
- Backup before migration
- Test in staging first
- Reversible migrations preferred

---

## Code Quality

### Linting & Formatting

**ESLint:**

- Extends recommended configs
- TypeScript-specific rules
- React/Next.js rules
- Custom rules for project patterns

**Prettier:**

- Consistent code formatting
- Runs on save (IDE)
- Enforced in CI

**Configuration:**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Type Safety

**TypeScript Configuration:**

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

**Best Practices:**

- Avoid `any` (use `unknown` if needed)
- Define interfaces for data structures
- Use Zod for runtime validation
- Share types via `packages/types`

---

## Documentation

### Code Documentation

**When to document:**

- Complex algorithms
- Non-obvious business logic
- Public APIs
- Workarounds for known issues

**When NOT to document:**

- Self-explanatory code
- Obvious logic
- Standard patterns

**Examples:**

```typescript
// ❌ Bad: States the obvious
// Get user by ID
const user = await getUserById(id)

// ✅ Good: Explains why/context
// We must fetch fresh user data here because Clerk session
// may be stale after email verification
const user = await getUserById(id)
```

### API Documentation

- Use OpenAPI/Swagger for REST APIs
- Document request/response schemas
- Include example requests
- List possible error codes

### Architecture Decisions

- Document in `docs/architecture/`
- Use ADR (Architecture Decision Record) format
- Include context, decision, and consequences

---

## Performance

### Optimization Guidelines

**Frontend:**

- Lazy load routes
- Optimize images (Next.js Image)
- Minimize bundle size
- Use React.memo sparingly
- Paginate large lists

**Backend:**

- Index frequently queried fields
- Use connection pooling
- Cache expensive queries
- Paginate responses
- Optimize N+1 queries

**Database:**

- Add indexes on foreign keys
- Use EXPLAIN ANALYZE for slow queries
- Avoid SELECT *
- Use database-level aggregations

---

## References

- [decisions.md](./decisions.md) - Tech stack choices
- [operations.md](./operations.md) - Operational procedures
- [schema-design.md](./schema-design.md) - Database design
- [ROADMAP.md](/ROADMAP.md) - Development phases
