# Design System - Patterns & Best Practices Reference

**Quick Reference for Component Development**

---

## 1. Server vs Client Component Decision Matrix

### Use Server Components When:
- No React hooks needed (useState, useEffect, useContext, useReducer)
- No browser APIs needed (window, localStorage, geolocation)
- No event handlers (onClick, onChange, onSubmit)
- Data fetching is needed (async/await)
- Sensitive operations (auth checks, database queries)

### Use Client Components When:
- React hooks needed (useState, useEffect, useContext)
- Browser APIs needed (window, localStorage, navigator)
- Event handlers (onClick, onChange, onSubmit)
- User interactivity required

---

## 2. Pattern: Navbar (Server Component)

**What You're Building:**
A top navigation bar with theme toggle, auth status, and user menu.

### ✅ CORRECT PATTERN (From Project)

```tsx
// apps/web/src/components/layout/Navbar.tsx
// NO 'use client' - This is a Server Component by default

import { MobileSidebar } from "./Sidebar";
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
    return (
        <div className="flex items-center p-4 border-b h-16 glass">
            <MobileSidebar /> {/* Client component - no problem */}
            <div className="flex w-full justify-end items-center gap-4">
                <ThemeToggle /> {/* Client component - isolated */}
                <SignedIn>
                    {/* Clerk handles client rendering internally */}
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <Button variant="outline" size="sm">
                            Sign In
                        </Button>
                    </SignInButton>
                </SignedOut>
            </div>
        </div>
    );
}
```

**Why This Works:**
1. Navbar itself is a Server Component (no 'use client')
2. Client-only concerns (ThemeToggle, MobileSidebar) passed as children
3. Navbar renders on server, hydrates seamlessly on client
4. Children handle their own client logic
5. No hydration mismatches

**Key Insight:** Keep layout components as Server Components. Pass interactive children. This pattern enables:
- Server-side rendering with no compromises
- Efficient hydration
- Proper separation of concerns
- Zero re-render overhead on theme changes

### ❌ INCORRECT PATTERN

```tsx
// apps/web/src/components/layout/Navbar.tsx
'use client';  // WRONG - unnecessary

import { useState } from 'react';

export function Navbar() {
    const [themeOpen, setThemeOpen] = useState(false);  // Not needed here!

    return (
        <div>
            <button onClick={() => setThemeOpen(!themeOpen)}>
                Open Theme
            </button>
            {themeOpen && <ThemeDropdown />}
        </div>
    );
}
```

**Problems:**
1. Entire Navbar marked as client (unnecessary)
2. Theme state in Navbar (should be in ThemeToggle)
3. Navbar re-renders on every theme change
4. Hydration could have issues if localStorage-dependent
5. Layout causes re-renders on client interactions

**Why It's Wrong:** Over-using 'use client' causes the entire component subtree to be client-rendered. Navbar should be server-rendered for best performance.

---

## 3. Pattern: Sidebar (Client Component)

**What You're Building:**
A navigation sidebar with active route highlighting and icons.

### ✅ CORRECT PATTERN (From Project)

```tsx
// apps/web/src/components/layout/Sidebar.tsx
'use client';  // JUSTIFIED - needs usePathname hook

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();  // REQUIRES 'use client'

    const routes = [
        {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
        },
        // ... more routes
    ];

    return (
        <div className={cn("pb-12 h-full glass", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-bold font-heading">
                        Akount
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={pathname === route.href ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
```

**Why This Works:**
1. 'use client' is JUSTIFIED (needs usePathname hook)
2. Active state based on pathname comparison
3. Button variant switches based on active route
4. Efficient - only re-renders on pathname change
5. Link component for proper Next.js navigation

**Key Insight:** This is the correct pattern for navigation sidebars. usePathname requires 'use client', but that's the only client-side operation needed.

### ❌ INCORRECT PATTERN 1: Over-Fetching

```tsx
// ❌ WRONG - Server Components can't use usePathname

export function Sidebar() {  // No 'use client'
    const pathname = usePathname();  // ERROR: usePathname not available in Server Components!

    return (
        <div>
            {routes.map(route => (
                <Button variant={pathname === route.href ? "secondary" : "ghost"}>
                    {route.label}
                </Button>
            ))}
        </div>
    );
}
```

**Problems:**
1. usePathname requires 'use client'
2. Code won't compile
3. Active state highlighting won't work

### ❌ INCORRECT PATTERN 2: Client-Side Data Fetching

```tsx
// ❌ WRONG - Fetching routes on every client-side navigation

'use client';
import { useEffect, useState } from 'react';

export function Sidebar() {
    const [routes, setRoutes] = useState([]);

    useEffect(() => {
        fetch('/api/routes')  // Unnecessary client-side fetch!
            .then(r => r.json())
            .then(setRoutes);
    }, []);

    return (
        <div>
            {routes.map(route => (...))}
        </div>
    );
}
```

**Problems:**
1. Routes array is static - doesn't need to be fetched
2. Extra API call on every mount
3. Loading state before routes appear
4. No SSR benefits

**Correct:** Routes array is hardcoded in component (it's static data)

---

## 4. Pattern: Theme Toggle (Client Component with Hydration Safety)

**What You're Building:**
A theme switcher with system preference detection and localStorage persistence.

### ✅ CORRECT PATTERN (From Project)

```tsx
// apps/web/src/components/ui/theme-toggle.tsx
'use client';  // JUSTIFIED - uses useTheme hook + onClick handlers

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // CRITICAL: Only render interactive UI after hydration
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // SSR fallback - doesn't access localStorage or theme state
        return (
            <Button variant="ghost" size="icon" disabled>
                <Sun className="h-5 w-5" />
            </Button>
        );
    }

    // Now safe to use theme state and interactive UI
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                    <span className="mr-2 h-4 w-4">💻</span>
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

**Why This Works:**
1. Mounted state prevents hydration mismatch
2. SSR renders disabled button (safe fallback)
3. Client renders full dropdown after hydration
4. No localStorage access during SSR
5. Theme state matches between server and client
6. Smooth theme switching without page reload

**The Hydration Problem It Solves:**
- Server renders based on default/system theme
- localStorage isn't available during SSR
- Client mounts and reads localStorage
- If client renders different HTML than server → hydration error
- Solution: Render neutral fallback on server, full UI on client

### ❌ INCORRECT PATTERN 1: Direct localStorage Access

```tsx
// ❌ WRONG - Hydration mismatch!

'use client';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    // Problem: useTheme reads localStorage immediately
    // Server renders one thing, client renders another
    // Result: Hydration mismatch error in console

    return (
        <DropdownMenu>
            {/* Theme buttons */}
        </DropdownMenu>
    );
}
```

**Problems:**
1. useTheme accesses localStorage on mount
2. SSR can't access localStorage (renders with default theme)
3. Client reads localStorage (renders with actual theme)
4. HTML mismatch → React console error
5. Browser console fills with hydration warnings

### ❌ INCORRECT PATTERN 2: No Mounted State

```tsx
// ❌ WRONG - Hydration mismatch without mounted check

'use client';

export function ThemeToggle() {
    const isDark = typeof window !== 'undefined'
        ? localStorage.getItem('theme') === 'dark'
        : false;

    return (
        <button className={isDark ? 'dark' : 'light'}>
            Toggle
        </button>
    );
}
```

**Problems:**
1. Even with typeof window check, HTML could differ
2. No guarantee SSR renders same thing as client
3. Still at risk for hydration mismatch
4. Brittle code

**Better:** Use mounted state to explicitly separate SSR and client rendering

### Pattern Summary for localStorage-Dependent Components

```tsx
// TEMPLATE: Safe localStorage access pattern
'use client';

export function ComponentUsingLocalStorage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);  // Only after hydration
    }, []);

    if (!mounted) {
        // Render SSR-safe fallback (no localStorage access)
        return <FallbackUI />;
    }

    // Now safe to access localStorage
    const value = localStorage.getItem('key');
    return <FullUI value={value} />;
}
```

---

## 5. Pattern: Button Component (Reusable with CVA)

**What You're Building:**
A flexible button component with multiple variants and sizes.

### ✅ CORRECT PATTERN (From Project)

```tsx
// apps/web/src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Define variants using CVA (Class Variance Authority)
const buttonVariants = cva(
  // Base styles applied to all buttons
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Props interface combining HTML attributes with CVA variants
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Component with forwardRef for ref passing
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Usage Examples:**

```tsx
// Basic button
<Button>Click me</Button>

// Variant selection
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>

// Size selection
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// Combining variants and sizes
<Button variant="secondary" size="lg">Save</Button>

// With asChild for composition
<Button asChild>
    <a href="/profile">Go to Profile</a>
</Button>

// With ref forwarding
const buttonRef = useRef();
<Button ref={buttonRef} onClick={() => buttonRef.current?.focus()} />
```

**Key Features:**
1. **CVA (Class Variance Authority):** Type-safe variant management
2. **forwardRef:** Allows parent components to access underlying button element
3. **Slot (Radix UI):** asChild pattern for composition
4. **Compound classes:** cn() merges base + variant + custom classes
5. **Accessibility:** Focus states, disabled states, semantic HTML

### ❌ INCORRECT PATTERN 1: Manual Class Management

```tsx
// ❌ WRONG - Hard to maintain and error-prone

export function Button({ variant, size, className, ...props }) {
    let classes = "inline-flex items-center justify-center gap-2";

    if (variant === 'default') {
        classes += " bg-primary text-white";
    } else if (variant === 'outline') {
        classes += " border bg-white text-black";
    }
    // ... more if statements for each variant

    if (size === 'sm') {
        classes += " h-8 px-3";
    } else if (size === 'lg') {
        classes += " h-10 px-8";
    }
    // ... more if statements for each size

    return <button className={classes + ' ' + className} {...props} />;
}
```

**Problems:**
1. Error-prone class concatenation
2. No type safety - typos not caught
3. Hard to maintain as variants grow
4. Classes easy to forget or duplicate
5. No variants export for reuse

### ❌ INCORRECT PATTERN 2: No forwardRef

```tsx
// ❌ WRONG - Can't access button ref from parent

export function Button({ onClick, ...props }) {
    return <button onClick={onClick} {...props} />;
}

// Parent component
const buttonRef = useRef();
<Button ref={buttonRef} />  // ERROR: ref won't work!
```

**Problems:**
1. Parent can't access underlying button element
2. Can't call methods like focus()
3. Not composable with other components needing refs

---

## 6. Pattern: Layout Composition with Providers

**What You're Building:**
A root layout with multiple context providers stacked properly.

### ✅ CORRECT PATTERN (From Project)

```tsx
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Newsreader, Manrope, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { CursorProvider } from '@/components/providers/CursorProvider';
import './globals.css';

// Load fonts with optimization
const newsreader = Newsreader({
    subsets: ['latin'],
    variable: '--font-heading',
    display: 'swap',  // Show fallback while loading
});

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Akount',
    description: 'Financial Command Center',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            {/* Layer 1: Authentication (outermost) */}
            <ClerkProvider>
                <body className={`${newsreader.variable} ${manrope.variable} ${jetbrainsMono.variable} font-sans`}>
                    {/* Layer 2: Theme context */}
                    <ThemeProvider>
                        {/* Layer 3: Custom features (innermost) */}
                        <CursorProvider>
                            {children}
                        </CursorProvider>
                    </ThemeProvider>
                </body>
            </ClerkProvider>
        </html>
    );
}
```

**Why This Provider Order:**
1. **ClerkProvider (Outermost):** Auth must be available to all children
2. **ThemeProvider (Middle):** Theme context used by UI components
3. **CursorProvider (Innermost):** Enhancement feature, uses theme context
4. **children (Center):** Page content at core

**Why suppressHydrationWarning:**
- Next.js themes add classes dynamically (dark, etc.)
- Server renders without theme class, client adds it
- This causes hydration warning without suppressHydrationWarning
- Safe to suppress because we control theme changes

### ❌ INCORRECT PATTERN 1: Wrong Provider Order

```tsx
// ❌ WRONG - Provider order matters!

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                {/* WRONG: ThemeProvider outside ClerkProvider */}
                <ThemeProvider>
                    <ClerkProvider>
                        <CursorProvider>
                            {children}
                        </CursorProvider>
                    </ClerkProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
```

**Problems:**
1. Theme context applied before auth is available
2. Components can't reliably get both theme and auth context
3. Potential race conditions on mount
4. Order matters for context dependency injection

### ❌ INCORRECT PATTERN 2: Missing suppressHydrationWarning

```tsx
// ❌ WRONG - No suppressHydrationWarning

export default function RootLayout({ children }) {
    return (
        <html lang="en">  {/* Missing suppressHydrationWarning */}
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </html>
    );
}
```

**Problems:**
1. Browser console fills with hydration warnings
2. HTML<-> tag gets different class on server vs client
3. Looks like a bug even though it's not

---

## 7. Pattern: CSS Variables & Theming

**What You're Building:**
A complete design token system with light and dark modes.

### ✅ CORRECT PATTERN (From Project)

```css
/* apps/web/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light Mode - Semantic colors */
    --background: 210 40% 98%;        /* Page background */
    --foreground: 222 47% 11%;        /* Text color */
    --primary: 25 95% 53%;            /* Akount orange */
    --secondary: 258 90% 66%;         /* Violet accent */
    --accent: 262 83% 58%;            /* Interactive elements */
    --destructive: 0 84% 60%;         /* Error/delete actions */
    --border: 214 32% 91%;            /* Borders */
    --card: 0 0% 100%;                /* Card backgrounds */
    --muted: 210 40% 96%;             /* Disabled/secondary text */
    --radius: 0.5rem;                 /* Border radius */
  }

  .dark {
    /* Dark Mode - Same semantics, different values */
    --background: 222 47% 11%;        /* Dark background */
    --foreground: 210 40% 98%;        /* Light text */
    --primary: 25 95% 53%;            /* Orange stays same */
    --secondary: 262 83% 58%;         /* Violet stays same */
    --accent: 262 83% 58%;            /* Violet interactive */
    --destructive: 0 63% 31%;         /* Darker red for dark mode */
    --border: 215 28% 17%;            /* Dark borders */
    --card: 217 33% 17%;              /* Dark cards */
    --muted: 215 28% 17%;             /* Dark disabled */
  }
}

@layer base {
  * {
    @apply border-border;  /* Use CSS variable for all borders */
  }
  body {
    @apply bg-background text-foreground;  /* Use variables for page */
  }
}

@layer utilities {
  .glass {
    background: rgba(255, 255, 255, 0.85);
    -webkit-backdrop-filter: blur(6px);    /* Safari support */
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transform: translateZ(0);               /* GPU acceleration */
  }

  .dark .glass {
    background: rgba(30, 41, 59, 0.85);    /* Dark glass */
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
```

**HSL Format Benefits:**
- `hsl(210 40% 98%)` - Hue, Saturation, Lightness
- Easy to create color variations: `hsl(var(--primary) / 0.5)` for opacity
- Matches Tailwind color space
- Easy to darken/lighten for hover states

**Usage in Components:**

```tsx
// Using CSS variables in Tailwind
<div className="bg-background text-foreground">
    {/* Uses --background and --foreground variables */}
</div>

<button className="bg-primary text-primary-foreground hover:bg-primary/90">
    {/* Uses --primary, --primary-foreground, and opacity modifier */}
</button>

// Custom opacity with variables
<div className="border border-foreground/20">
    {/* Border is foreground color at 20% opacity */}
</div>
```

**Dark Mode Class:**
- `class="dark"` on html element enables dark mode
- CSS selectors like `.dark .glass` apply dark mode styles
- ThemeProvider handles adding/removing class

### ❌ INCORRECT PATTERN 1: Hardcoded Colors

```css
/* ❌ WRONG - No CSS variables */

body {
  background-color: #f8fafc;  /* Hardcoded light color */
  color: #1e293b;             /* Hardcoded dark text */
}

.button {
  background-color: #ff8c42;  /* Hardcoded orange */
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #1e293b;  /* Hardcoded dark bg */
    color: #f8fafc;             /* Hardcoded light text */
  }
}
```

**Problems:**
1. Can't switch theme without page reload
2. Colors duplicated in media query
3. No single source of truth
4. Hard to update brand colors site-wide
5. Users with prefers-color-scheme get stuck in default mode

### ❌ INCORRECT PATTERN 2: No Semantic Naming

```css
/* ❌ WRONG - Color names instead of semantic tokens */

:root {
  --orange-500: #ff8c42;
  --violet-600: #6d28d9;
  --red-600: #dc2626;
}

.button {
  background-color: var(--orange-500);  /* What does orange mean here? */
}

.error-text {
  color: var(--red-600);  /* Is this right for dark mode? */
}
```

**Problems:**
1. No semantic meaning (is orange primary? secondary?)
2. Hard to maintain when brand changes
3. Dark mode values unclear
4. Unclear which colors to use where

**Better:** Use semantic names (--primary, --destructive, --accent)

---

## 8. Pattern: Adding New Features

### Add a New Sidebar Route

```tsx
// Step 1: Add to routes array in Sidebar.tsx
const routes = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard", color: "text-sky-500" },
    { label: "Transactions", icon: CreditCard, href: "/transactions", color: "text-violet-500" },
    { label: "New Feature", icon: IconName, href: "/new-feature", color: "text-green-500" },  // NEW
];
```

### Create the Page

```tsx
// Step 2: Create app/(dashboard)/new-feature/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Feature - Akount',
    description: 'Feature description',
};

// Server Component - fetch data here
export default async function NewFeaturePage() {
    const data = await fetchData();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold font-heading">New Feature</h1>
            <InteractiveComponent data={data} />
        </div>
    );
}
```

### Add Interactivity if Needed

```tsx
// Step 3: Create Client Component for interactivity
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function InteractiveComponent({ data }) {
    const [selected, setSelected] = useState(null);

    return (
        <div className="mt-6">
            {data.map(item => (
                <Button
                    key={item.id}
                    variant={selected === item.id ? "secondary" : "ghost"}
                    onClick={() => setSelected(item.id)}
                >
                    {item.name}
                </Button>
            ))}
        </div>
    );
}
```

---

## Quick Reference: Common Mistakes

### Mistake 1: 'use client' on Pages
```tsx
// ❌ WRONG
'use client';
export default function Page() {
    const data = await fetchData();  // ERROR: Can't use await in client
}

// ✅ CORRECT
export default async function Page() {
    const data = await fetchData();  // Server-side fetching
}
```

### Mistake 2: Hydration Mismatch
```tsx
// ❌ WRONG
export function Component() {
    const isDark = localStorage.getItem('isDark');  // SSR can't access
    return <div className={isDark ? 'dark' : 'light'}>...</div>;
}

// ✅ CORRECT
export function Component() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div>...</div>;
    const isDark = localStorage.getItem('isDark');
    return <div className={isDark ? 'dark' : 'light'}>...</div>;
}
```

### Mistake 3: Missing forwardRef on Components
```tsx
// ❌ WRONG
export function Input(props) {
    return <input {...props} />;
}

// ✅ CORRECT
export const Input = forwardRef((props, ref) => {
    return <input ref={ref} {...props} />;
});
```

### Mistake 4: Prop Drilling Instead of Context
```tsx
// ❌ WRONG - Passing theme through many components
<Navbar theme={theme} />
function Navbar({ theme }) {
    return <Button theme={theme} />;  // Prop drilling
}

// ✅ CORRECT - Use context provider
<ThemeProvider>
    <Navbar />  // Navbar can use useTheme() hook
</ThemeProvider>
```

---

## Design System Tokens

### Colors
- **Primary:** Orange (#ff8c42) - Brand color, buttons, links
- **Secondary:** Violet (#8b5cf6) - Accents, highlights
- **Destructive:** Red (#dc2626) - Errors, deletions
- **Muted:** Slate (#64748b) - Disabled, secondary text

### Typography
- **Heading Font:** Newsreader (serif)
- **Body Font:** Manrope (sans-serif)
- **Mono Font:** JetBrains Mono (monospace)

### Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

### Border Radius
- Default: 0.5rem (8px)
- sm: 0.375rem (6px)
- lg: 0.75rem (12px)

---

**Last Updated:** 2026-02-01
**Status:** Reference Guide for Design System
