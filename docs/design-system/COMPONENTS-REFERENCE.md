# Akount Components Reference

Quick reference for all available UI components with dark mode support.

---

## Buttons

**Location:** `apps/web/src/components/ui/button.tsx`

### Variants

```tsx
import { Button } from '@/components/ui/button';

// Primary (Orange) - Main actions
<Button variant="default">Primary Action</Button>

// Secondary - Less emphasis
<Button variant="secondary">Secondary Action</Button>

// Outline - Neutral actions
<Button variant="outline">Outline Button</Button>

// Ghost - Minimal style
<Button variant="ghost">Ghost Button</Button>

// Destructive (Red) - Delete, remove
<Button variant="destructive">Delete</Button>

// Link style
<Button variant="link">Link Button</Button>
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🎨</Button>
```

### Dark Mode

Automatically adjusts colors in dark mode. No extra classes needed.

---

## Cards

**Location:** `apps/web/src/components/ui/card.tsx`

### Basic Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dark Mode

- Light: White background with Slate-200 border
- Dark: Slate-800 background with Slate-700 border

---

## Inputs

**Location:** `apps/web/src/components/ui/input.tsx`

### Text Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
  />
</div>
```

### Input Types

```tsx
<Input type="text" placeholder="Text input" />
<Input type="email" placeholder="email@example.com" />
<Input type="password" placeholder="Password" />
<Input type="number" placeholder="123" />
<Input type="date" />
```

### Dark Mode

- Light: Slate-200 border, white background
- Dark: Slate-800 border, dark background
- Focus: Orange-500 ring in both modes

---

## Badges

**Location:** `apps/web/src/components/ui/badge.tsx`

### Status Badges

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Use Cases

```tsx
// Invoice status
<Badge variant="default">Paid</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Overdue</Badge>

// Entity types
<Badge>Personal</Badge>
<Badge variant="outline">Corporation</Badge>
```

---

## Dropdown Menu

**Location:** `apps/web/src/components/ui/dropdown-menu.tsx`

### Basic Dropdown

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Example: Theme Toggle

```tsx
import { useTheme } from 'next-themes';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">⚙️</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setTheme('light')}>
      Light Mode
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setTheme('dark')}>
      Dark Mode
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Avatar

**Location:** `apps/web/src/components/ui/avatar.tsx`

### User Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Sizes

```tsx
<Avatar className="h-8 w-8">...</Avatar>
<Avatar className="h-12 w-12">...</Avatar>
<Avatar className="h-16 w-16">...</Avatar>
```

---

## Separator

**Location:** `apps/web/src/components/ui/separator.tsx`

### Horizontal Separator

```tsx
import { Separator } from '@/components/ui/separator';

<div>
  <p>Content above</p>
  <Separator className="my-4" />
  <p>Content below</p>
</div>
```

### Vertical Separator

```tsx
<div className="flex items-center gap-4">
  <span>Item 1</span>
  <Separator orientation="vertical" className="h-6" />
  <span>Item 2</span>
</div>
```

---

## Sheet (Sidebar)

**Location:** `apps/web/src/components/ui/sheet.tsx`

### Slide-out Panel

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Panel</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Panel Title</SheetTitle>
      <SheetDescription>Panel description</SheetDescription>
    </SheetHeader>
    <div>Panel content here</div>
  </SheetContent>
</Sheet>
```

### Sides

```tsx
<SheetContent side="left">Left panel</SheetContent>
<SheetContent side="right">Right panel</SheetContent>
<SheetContent side="top">Top panel</SheetContent>
<SheetContent side="bottom">Bottom panel</SheetContent>
```

---

## Scroll Area

**Location:** `apps/web/src/components/ui/scroll-area.tsx`

### Scrollable Container

```tsx
import { ScrollArea } from '@/components/ui/scroll-area';

<ScrollArea className="h-[400px] w-full rounded-md border p-4">
  <div>
    {/* Long content that needs scrolling */}
    <p>Content line 1</p>
    <p>Content line 2</p>
    {/* ... more content ... */}
  </div>
</ScrollArea>
```

---

## Hover Card

**Location:** `apps/web/src/components/ui/hover-card.tsx`

### Tooltip on Hover

```tsx
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">Hover me</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <p>Additional information appears here</p>
  </HoverCardContent>
</HoverCard>
```

---

## Layout Components

### Navbar

**Location:** `apps/web/src/components/layout/Navbar.tsx`

Already includes:
- Mobile sidebar toggle
- Theme toggle (sun/moon icon)
- User profile button (Clerk)
- Sign in button (for logged out users)

```tsx
import { Navbar } from '@/components/layout/Navbar';

<Navbar />
```

### Sidebar

**Location:** `apps/web/src/components/layout/Sidebar.tsx`

Side navigation with mobile responsive drawer.

---

## Theme Toggle

**Location:** `apps/web/src/components/ui/theme-toggle.tsx`

### Usage

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

<ThemeToggle />
```

Features:
- Sun icon for light mode
- Moon icon for dark mode
- Dropdown with Light/Dark/System options
- Persists user preference

---

## Typography Utilities

### Headings

```tsx
<h1 className="font-heading text-4xl font-bold text-foreground">
  Main Heading
</h1>

<h2 className="font-heading text-3xl font-semibold text-foreground">
  Section Heading
</h2>

<h3 className="font-heading text-2xl font-semibold text-foreground">
  Subsection
</h3>
```

### Body Text

```tsx
<p className="font-sans text-base text-foreground">
  Regular body text
</p>

<p className="font-sans text-sm text-muted-foreground">
  Secondary text
</p>
```

### Monospace (Financial Data)

```tsx
<span className="font-mono text-sm text-foreground">
  $12,345.67 CAD
</span>

<code className="font-mono text-xs bg-muted px-2 py-1 rounded">
  Account #1001
</code>
```

---

## Color Utilities

### Background Colors

```tsx
<div className="bg-background">Page background</div>
<div className="bg-card">Card background</div>
<div className="bg-muted">Subtle background</div>
<div className="bg-primary">Orange background</div>
<div className="bg-secondary">Violet background</div>
```

### Text Colors

```tsx
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Secondary text</p>
<p className="text-primary">Orange text</p>
<p className="text-secondary">Violet text</p>
<p className="text-destructive">Error text</p>
```

### Border Colors

```tsx
<div className="border border-border">Standard border</div>
<div className="border border-input">Input border</div>
<div className="border border-primary">Orange border</div>
```

---

## Status Indicators

### Success/Warning/Error

```tsx
// Success (Green)
<Badge className="bg-green-500 text-white">Success</Badge>
<p className="text-green-600 dark:text-green-400">Success message</p>

// Warning (Amber)
<Badge className="bg-amber-500 text-white">Warning</Badge>
<p className="text-amber-600 dark:text-amber-400">Warning message</p>

// Error (Red)
<Badge variant="destructive">Error</Badge>
<p className="text-destructive">Error message</p>

// Info (Blue)
<Badge className="bg-blue-500 text-white">Info</Badge>
<p className="text-blue-600 dark:text-blue-400">Info message</p>
```

---

## Responsive Patterns

### Mobile-First Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Column 1</Card>
  <Card>Column 2</Card>
  <Card>Column 3</Card>
</div>
```

### Responsive Text

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>

<p className="text-sm sm:text-base md:text-lg">
  Responsive body text
</p>
```

### Responsive Spacing

```tsx
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>

<div className="space-y-2 md:space-y-4 lg:space-y-6">
  Responsive spacing
</div>
```

---

## Common Patterns

### Form Layout

```tsx
<Card>
  <CardHeader>
    <CardTitle>Form Title</CardTitle>
    <CardDescription>Form description</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

### Data Table Row

```tsx
<div className="flex items-center justify-between p-4 border-b border-border">
  <div>
    <p className="font-medium text-foreground">Invoice #1234</p>
    <p className="text-sm text-muted-foreground">Client Name</p>
  </div>
  <div className="text-right">
    <p className="font-mono text-foreground">$1,234.56</p>
    <Badge variant="default">Paid</Badge>
  </div>
</div>
```

### Empty State

```tsx
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12">
    <p className="text-muted-foreground mb-4">No data to display</p>
    <Button>Add New Item</Button>
  </CardContent>
</Card>
```

---

## Adding New Components

To add more shadcn/ui components:

```bash
npx shadcn-ui@latest add [component-name]
```

Examples:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
```

All shadcn components will automatically use Akount's theme tokens.

---

**All components are dark mode ready. Just use them!** 🎨
