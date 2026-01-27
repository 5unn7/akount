# Akount - {{SECTION_NAME}} Implementation Prompt

You are building the **{{SECTION_NAME}}** section of Akount, a multi-country financial management application.

---

## Before You Start: Clarifying Questions

Please ask the user:

1. **Integration Status** - Is the foundation milestone complete? (Shell, routing, auth, design system?)
2. **Data Source** - Should you use mock data from `sample-data.json` or build database integration?
3. **Scope** - Should you implement all features or start with core functionality?
4. **Dependencies** - Are there any specific libraries or patterns you should follow?

---

## Section Overview

**Goal:** {{GOAL_DESCRIPTION}}

**Prerequisites:** Foundation milestone ({{NN-1}} or earlier milestones if applicable)

**Files Reference:**
- `sections/{{SECTION_ID}}/README.md` - Full specification
- `sections/{{SECTION_ID}}/types.ts` - TypeScript interfaces
- `sections/{{SECTION_ID}}/sample-data.json` - Sample data structure
- `sections/{{SECTION_ID}}/components/` - Reference React components
- `sections/{{SECTION_ID}}/tests.md` - Test specifications

---

## Implementation Instructions

${Read the content from `instructions/incremental/{{NN}}-{{SECTION_ID}}.md` and paste here}

---

## Test-Driven Development

Before writing implementation code, review the test specifications in `sections/{{SECTION_ID}}/tests.md`. Write tests first, then implement to pass them.

Key test categories:
- User flow tests (success and failure paths)
- Empty state rendering
- Component interactions
- Edge cases
- Responsive layouts
- Accessibility

---

## Design Tokens

Use Akount design tokens from `design-system/`:
- **Colors:** orange (primary), violet (secondary), slate (neutral)
- **Fonts:** Newsreader (headings), Manrope (body), JetBrains Mono (mono)
- **Responsive:** Mobile-first with sm:, md:, lg:, xl: breakpoints
- **Dark Mode:** All components need dark: variants

---

## Data Types

Reference `sections/{{SECTION_ID}}/types.ts` for all TypeScript interfaces.

Sample data structure in `sections/{{SECTION_ID}}/sample-data.json` shows the expected shape of API responses.

---

## Reference Components

Fully functional React components are provided in `sections/{{SECTION_ID}}/components/`. These components:
- Accept all data via props (no direct data imports)
- Use Tailwind CSS v4 with Akount tokens
- Support responsive layouts
- Include dark mode variants
- Are fully typed with TypeScript

You can use these as-is or adapt them to your tech stack.

---

## Success Criteria

Your implementation is complete when:

✅ All items in the "Done Checklist" are satisfied
✅ All tests in `tests.md` pass
✅ All expected user flows work end-to-end
✅ Empty states render correctly
✅ Component is responsive (mobile, tablet, desktop)
✅ Dark mode works correctly
✅ Integrates with application shell and navigation

---

## Integration with Other Sections

**Navigation Links:**
- Link to other sections using the router (e.g., clicking account → `/transactions?account=id`)
- Preserve context with query parameters
- Use the shell's entity filter state

**Shared State:**
- Current workspace
- Selected entity filter
- User preferences

**Data Dependencies:**
- Entities (from foundation)
- Accounts (from Accounts Overview)
- Transactions (from Bank Reconciliation / Transactions)
- [Section-specific dependencies]

---

## Tips

1. Start with the main container component
2. Build child components bottom-up
3. Use sample data for initial development
4. Test each user flow as you implement it
5. Handle empty states from the start
6. Make components responsive as you build them
7. Add dark mode variants alongside light mode

Good luck building {{SECTION_NAME}}!
