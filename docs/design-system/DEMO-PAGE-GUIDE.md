# Design System Demo Page

**URL:** `/demo` (accessible from sidebar: "Design Demo")

## Overview

The demo page is a comprehensive showcase of all UI components with full dark/light mode support. It serves as:

1. **Visual Reference** - See all components in action
2. **Testing Ground** - Verify theme switching works correctly
3. **Developer Guide** - Copy-paste ready examples
4. **Design QA** - Ensure consistency across modes

---

## What's Included

### 1. Typography Section ✨
- **Headings (Newsreader)** - H1 through H4 examples
- **Body Text (Manrope)** - Regular and small text samples
- **Monospace (JetBrains Mono)** - Financial data formatting examples

### 2. Buttons Section 🔘
- **All Variants:**
  - Default (Primary Orange)
  - Secondary (Violet)
  - Outline
  - Ghost
  - Destructive (Red)
  - Link
- **All Sizes:** Small, Default, Large, Icon

### 3. Badges Section 🏷️
- **Standard Variants:** Default, Secondary, Destructive, Outline
- **Invoice Status Examples:** Paid (green), Pending, Overdue, Draft

### 4. Form Elements Section 📝
- Text Input
- Email Input
- Number Input
- Date Input
- Labels for accessibility

### 5. Card Variations 📇
- **Simple Card** - Basic card with title/description
- **Card with Action** - Includes footer button
- **Card with Avatar** - User profile layout

### 6. Color Palette Section 🎨
- **Brand Colors:**
  - Primary (Orange-500)
  - Secondary (Violet-500)
  - Accent (Violet)
  - Destructive (Red)
- **Semantic Tokens:**
  - Background
  - Card
  - Muted
  - Popover
- **Status Colors:**
  - Success (Green)
  - Warning (Amber)
  - Error (Red)
  - Info (Blue)

### 7. Financial Data Example 💰
Realistic account balance display showing:
- Account names and numbers
- Monospace formatting for amounts
- Status badges (Active, Pending, Overdue)
- Positive/negative amount colors
- Border styling for list items

### 8. Responsive Grid 📐
- **Mobile:** 1 column
- **Tablet:** 2 columns (sm breakpoint)
- **Desktop:** 4 columns (lg breakpoint)
- Visual demonstration with colored boxes

### 9. Theme Toggle Highlight 🌓
- Instructions for switching themes
- Benefits checklist (Semantic Tokens, Brand Consistency, etc.)

---

## How to Use the Demo Page

### For Testing Themes

1. Navigate to `/demo` in the app
2. Click the sun/moon icon in the navbar
3. Switch between Light, Dark, and System modes
4. Observe how all components adapt seamlessly

### For Developers

1. Browse the demo page to find the component you need
2. Open `apps/web/src/app/(dashboard)/demo/page.tsx`
3. Find the component example
4. Copy the code snippet
5. Paste into your page and customize

### For Designers

1. Use the demo page to verify designs match implementation
2. Check color contrast in both modes
3. Verify spacing and typography scales
4. Test responsive behavior by resizing browser

---

## Code Examples from Demo

### Financial Data Display Pattern

```tsx
<div className="flex items-center justify-between p-3 border border-border rounded-lg">
  <div>
    <p className="font-medium text-foreground">
      Cash - Business Account
    </p>
    <p className="text-sm text-muted-foreground">
      Account #1001
    </p>
  </div>
  <div className="text-right">
    <p className="font-mono text-lg text-foreground">
      $45,234.50
    </p>
    <Badge className="bg-green-500 text-white">
      Active
    </Badge>
  </div>
</div>
```

### Card with Action Pattern

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">Content here</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline" className="w-full">
      Action Button
    </Button>
  </CardFooter>
</Card>
```

### Form Fields Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="field-id">Field Label</Label>
  <Input
    id="field-id"
    type="text"
    placeholder="Enter value..."
  />
</div>
```

### Responsive Grid Pattern

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>
```

---

## Testing Checklist

Use the demo page to verify:

- [ ] **Theme Toggle Works**
  - Click sun/moon icon
  - Switch between all three modes (Light/Dark/System)
  - No flash or delay

- [ ] **Colors Correct**
  - Light mode: Clean and bright
  - Dark mode: Dark but readable
  - Brand colors (Orange/Violet) vibrant in both

- [ ] **Text Readable**
  - All text has proper contrast
  - Muted text still legible
  - Financial amounts clearly visible

- [ ] **Components Styled**
  - Buttons have proper hover states
  - Cards have visible borders
  - Inputs have focus rings
  - Badges display correctly

- [ ] **Responsive Works**
  - View on mobile (1 column)
  - View on tablet (2 columns)
  - View on desktop (4 columns)
  - Sidebar collapses on mobile

- [ ] **Typography Correct**
  - Headings use Newsreader
  - Body text uses Manrope
  - Financial data uses JetBrains Mono

---

## Maintenance

### Adding New Components

When you add new components to the design system:

1. Add a showcase section to `demo/page.tsx`
2. Include all variants and states
3. Test in both light and dark modes
4. Add usage notes if needed

### Updating Existing Components

When you modify existing components:

1. Update the demo page to reflect changes
2. Verify the demo still builds successfully
3. Test theme switching still works
4. Update this guide if needed

---

## Files

**Demo Page:**
- `apps/web/src/app/(dashboard)/demo/page.tsx` (main demo page)

**Documentation:**
- `docs/design-system/DEMO-PAGE-GUIDE.md` (this file)
- `docs/design-system/COMPONENTS-REFERENCE.md` (component API reference)
- `docs/design-system/theme-system.md` (theming guide)

**Related:**
- `apps/web/src/components/ui/*` (component source files)
- `apps/web/src/app/globals.css` (theme tokens)
- `apps/web/tailwind.config.ts` (Tailwind configuration)

---

## Quick Access

**From the App:**
1. Sign in to Akount
2. Click "Design Demo" in the sidebar (purple palette icon)
3. Or navigate to `/demo` directly

**From Code:**
```bash
# View demo page source
code apps/web/src/app/(dashboard)/demo/page.tsx
```

---

## Troubleshooting

**Demo page not showing?**
- Make sure you're signed in
- Check you're in the dashboard layout group
- Verify the route exists: `apps/web/src/app/(dashboard)/demo/page.tsx`

**Theme toggle not working?**
- Check browser console for errors
- Verify ThemeProvider is in layout.tsx
- Clear browser cache and reload

**Colors look wrong?**
- Verify globals.css has updated tokens
- Check Tailwind config includes theme colors
- Rebuild the app: `npm run build`

---

**The demo page is your go-to reference for the design system!** 🎨
