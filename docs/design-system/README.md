# Akount Design System v1

## Quick Navigation

**I need to...**

- **Use design tokens** → [`00-foundations/tokens/`](00-foundations/tokens/)
- **Build a component** → [`01-components/`](01-components/)
- **Implement a screen** → [`03-screens/`](03-screens/)
- **Understand navigation** → [`02-patterns/navigation.md`](02-patterns/navigation.md)
- **Check permissions** → [`05-governance/permissions-matrix.md`](05-governance/permissions-matrix.md)
- **Review compliance** → [`06-compliance/`](06-compliance/)

## Directory Structure

```
00-foundations/   Design primitives (colors, typography, tokens)
01-components/    Reusable UI components
02-patterns/      Composite UI patterns (navigation, tables, AI)
03-screens/       Feature-specific implementations
04-workflows/     User journeys and flows
05-governance/    Information architecture and permissions
06-compliance/    SOC 2, security, regulatory requirements
07-reference/     Technical debt and missing features
```

## Design Tokens

Single source of truth: [`00-foundations/tokens/akount.tokens.json`](00-foundations/tokens/akount.tokens.json)

CSS Variables: [`00-foundations/tokens/css-variables.css`](00-foundations/tokens/css-variables.css)

## Migration Notes

**Restructured:** 2026-02-04
**Previous structure:** All files at root level
**Changes:**

- Consolidated design tokens (3 files → 1 CSS file)
- Merged navigation specs (3 files → 1)
- Merged dashboard specs (3 files → 1)
- Split Design-philosophy.md into focused foundation files

## How to Use This System

**For Designers:**

1. Start with [`00-foundations/`](00-foundations/) to understand primitives
2. Reference [`02-patterns/`](02-patterns/) for reusable patterns
3. Check [`03-screens/`](03-screens/) for specific screen implementations

**For Engineers:**

1. Import tokens from [`00-foundations/tokens/css-variables.css`](00-foundations/tokens/css-variables.css)
2. Follow patterns in [`02-patterns/`](02-patterns/) for consistency
3. Reference [`03-screens/`](03-screens/) for feature specifications

**For Compliance:**

1. Review [`06-compliance/`](06-compliance/) for all regulatory docs
2. Check [`05-governance/permissions-matrix.md`](05-governance/permissions-matrix.md) for access control

## Contributing

When adding new content:

- **New token?** → Update `00-foundations/tokens/akount.tokens.json` AND `css-variables.css`
- **New component?** → Add to `01-components/` with usage examples
- **New screen?** → Add to `03-screens/` with wireframes
- **New workflow?** → Add to `04-workflows/` with flow diagrams
