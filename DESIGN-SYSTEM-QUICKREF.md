# Design System Quick Reference Card

**Print this or bookmark for quick access while coding**

---

## Server vs Client Decision

### Use Server Component When:
```
- No React hooks needed
- No browser APIs (window, localStorage)
- No event handlers
- Data fetching needed
- Sensitive operations (auth, database)
```
**Default:** Pages, layouts, data components

### Use Client Component When:
```
- useHooks: useState, useEffect, useContext, useReducer
- Browser APIs: window, localStorage, geolocation
- Event handlers: onClick, onChange, onSubmit
- Interactive features
- User input handling
```
**Mark with:** `'use client';` at top of file

---

## Key Patterns from Review

### Pattern 1: Server Component Navbar
```tsx
// NO 'use client' - renders on server
export function Navbar() {
    return (
        <nav>
            <ThemeToggle /> {/* Client child: OK */}
            <SignedIn>
                <UserButton />
            </SignedIn>
        </nav>
    );
}
```
**Why:** Layout doesn't need hooks, client components passed as children

---

### Pattern 2: Client Component with usePathname
```tsx
'use client'; // REQUIRED - needs usePathname hook

import { usePathname } from "next/navigation";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <nav>
            {routes.map(route => (
                <Button
                    variant={pathname === route.href ? "secondary" : "ghost"}
                >
                    {route.label}
                </Button>
            ))}
        </nav>
    );
}
```
**Why:** usePathname hook requires 'use client'

---

### Pattern 3: Hydration-Safe Theme Toggle
```tsx
'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
    const { setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // CRITICAL: Only render interactive UI after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Button disabled><Sun /></Button>;
    }

    return (
        <DropdownMenu>
            {/* Theme options */}
        </DropdownMenu>
    );
}
```
**Why:** SSR can't access localStorage → need mounted check

---

### Pattern 4: Root Layout with Providers
```tsx
// apps/web/src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { CursorProvider } from '@/components/providers/CursorProvider';

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <ClerkProvider> {/* Auth - outermost */}
                <body>
                    <ThemeProvider> {/* Theme - middle */}
                        <CursorProvider> {/* Features - innermost */}
                            {children}
                        </CursorProvider>
                    </ThemeProvider>
                </body>
            </ClerkProvider>
        </html>
    );
}
```
**Why:** Provider order matters - Auth must be outside, features inside

---

### Pattern 5: Type-Safe Button Component
```tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
    "base styles here",
    {
        variants: {
            variant: {
                default: "bg-primary...",
                secondary: "bg-secondary...",
            },
            size: {
                sm: "h-8 px-3",
                lg: "h-10 px-8",
            },
        },
    }
);

interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
```
**Why:** CVA for variants, forwardRef for composition

---

## CSS Variables Cheat Sheet

### Apply in Components
```tsx
<div className="bg-background text-foreground">
    <button className="bg-primary text-primary-foreground hover:bg-primary/90">
        Click me
    </button>
</div>
```

### Available Variables
```
Colors:
  --primary        Orange (brand)
  --secondary      Violet (accent)
  --accent         Violet (interactive)
  --destructive    Red (errors)
  --background     Page background
  --foreground     Text color
  --card           Card backgrounds
  --muted          Disabled/secondary

Styling:
  --border         Border color
  --input          Input backgrounds
  --ring           Focus ring color
  --radius         Border radius
```

### Dark Mode
Just add `dark:` prefix in Tailwind:
```tsx
<div className="bg-white dark:bg-slate-900">
    {/* Auto switches based on .dark class on <html> */}
</div>
```

---

## Common Commands

### Add a New Route
```tsx
// 1. Add to routes in Sidebar.tsx
{ label: "New", icon: IconName, href: "/new", color: "text-color" }

// 2. Create app/(dashboard)/new/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New - Akount',
};

export default async function NewPage() {
    const data = await fetchData();
    return <div>{data}</div>;
}
```

### Create Reusable Component
```tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary';
    size?: 'sm' | 'lg';
}

const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('base-classes', className)}
                {...props}
            />
        );
    }
);

MyComponent.displayName = 'MyComponent';
export { MyComponent };
```

---

## Red Flags (Don't Do These)

### RED FLAG 1: Over-Using 'use client'
```tsx
// ❌ WRONG
'use client';
export default function Page() {
    // Now entire page is client - no server benefits!
    const data = await fetchData();  // Can't even do this!
}

// ✅ CORRECT
export default async function Page() {
    const data = await fetchData();  // Server-side fetching
}
```

### RED FLAG 2: Hydration Mismatch
```tsx
// ❌ WRONG
export function Component() {
    const isDark = localStorage.getItem('isDark');  // SSR → client mismatch!
}

// ✅ CORRECT
'use client';
export function Component() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <Fallback />;
    const isDark = localStorage.getItem('isDark');  // Now safe
}
```

### RED FLAG 3: Missing forwardRef
```tsx
// ❌ WRONG - Can't pass ref to component
export function Input(props) {
    return <input {...props} />;
}

const ref = useRef();
<Input ref={ref} />  // Won't work!

// ✅ CORRECT
export const Input = forwardRef((props, ref) => {
    return <input ref={ref} {...props} />;
});
```

### RED FLAG 4: Hardcoded Colors
```tsx
// ❌ WRONG - Can't theme dynamically
<div style={{ color: '#ff8c42' }}>
    {/* Hard to change, no dark mode */}
</div>

// ✅ CORRECT - Use CSS variables
<div className="text-primary">
    {/* Automatic dark mode, easy to theme */}
</div>
```

---

## Performance Checklist

Before deploying a component:

- [ ] Server Component if no hooks/events needed
- [ ] Client Component 'use client' only where necessary
- [ ] No unnecessary re-renders (proper boundaries)
- [ ] CSS variables for dynamic colors (not inline styles)
- [ ] Images using Next.js Image component
- [ ] Fonts optimized (display: swap)
- [ ] Proper cleanup in useEffect
- [ ] No console errors or warnings
- [ ] No hydration mismatch warnings
- [ ] TypeScript strict mode passing

---

## File Locations

```
App Router Structure:
  app/
    layout.tsx              ← Root layout (providers here)
    page.tsx                ← Home page
    (dashboard)/            ← Route group (shared layout)
      layout.tsx            ← Dashboard layout (sidebar+navbar)
      page.tsx              ← /dashboard
      [route]/
        page.tsx            ← /[route]

Components:
  components/
    layout/
      Navbar.tsx            ← Top navigation
      Sidebar.tsx           ← Side navigation
    ui/
      button.tsx            ← Reusable button
      *.tsx                 ← Other UI components
    providers/
      ThemeProvider.tsx     ← Theme context
      CursorProvider.tsx    ← Custom features

Styles:
  app/
    globals.css             ← Global styles, CSS variables
    layout.tsx              ← Font imports
```

---

## Documentation Files Created

1. **DESIGN-SYSTEM-REVIEW.md** (23KB)
   - Comprehensive technical analysis
   - File-by-file examination
   - Deployment checklist

2. **DESIGN-SYSTEM-SUMMARY.md** (13KB)
   - Executive summary
   - Quick reference
   - FAQ section

3. **DESIGN-SYSTEM-PATTERNS.md** (30KB)
   - 8 detailed patterns
   - Correct vs incorrect examples
   - Templates and reference

4. **DESIGN-SYSTEM-INDEX.md** (12KB)
   - Navigation guide
   - How to use review
   - Verification checklist

5. **DESIGN-SYSTEM-FINDINGS.txt** (16KB)
   - Findings summary
   - Metrics and statistics
   - Deployment readiness

6. **DESIGN-SYSTEM-QUICKREF.md** (this file)
   - Quick reference card
   - Key patterns
   - Red flags
   - Common commands

---

## Key Takeaway

**Server-First by Default**

1. Pages are Server Components (default)
2. Extract interactive parts to Client Components
3. Pass data from server to client via props
4. Only use 'use client' when you actually need hooks/events

This approach gives you:
- Better performance (less JavaScript)
- Easier data fetching (server-side)
- Proper separation of concerns
- Cleaner, more maintainable code

---

## Quick Links

**Need More Info?**
- Patterns: See DESIGN-SYSTEM-PATTERNS.md
- Details: See DESIGN-SYSTEM-REVIEW.md
- Summary: See DESIGN-SYSTEM-SUMMARY.md
- Navigation: See DESIGN-SYSTEM-INDEX.md
- Stats: See DESIGN-SYSTEM-FINDINGS.txt

**Next.js Docs:** https://nextjs.org/docs/app
**Clerk Docs:** https://clerk.com/docs

---

**Status:** APPROVED FOR PRODUCTION
**Last Updated:** 2026-02-01
**Confidence:** HIGH

This design system is production-ready. Follow these patterns for all new components.
