# Application Shell

## Overview

Akount uses a sidebar navigation pattern optimized for desktop financial management workflows. The sidebar provides persistent access to all 7 main sections, workspace management, entity filtering, and user controls. Individual sections use tabs for sub-navigation within their content areas.

## Navigation Structure

- **Accounts Overview** → Multi-currency dashboard (default/home view)
- **Bank Reconciliation** → Transaction matching and reconciliation
- **Transactions & Bookkeeping** → Double-entry accounting and GL
- **Invoicing & Bills** → AR/AP management
- **Cash Flow & Analytics** → Financial reporting
- **Budgeting & Goals** → Budget planning and goal tracking
- **AI Financial Advisor** → Insights and recommendations
- **Settings** → App configuration and integrations
- **Help/Support** → Documentation and support resources

## Sidebar Layout (Top to Bottom)

1. **Logo/Brand** - Akount branding at top
2. **Workspace Switcher** - Dropdown to switch between workspaces/boards
3. **Entity Filter** - Quick filter to view specific entities (All, Personal, Business entities)
4. [Divider]
5. **Main Navigation** - 7 primary sections with icons
6. [Divider]
7. **Settings** - App settings link
8. **Help/Support** - Help and support link
9. [Divider]
10. **User Menu** - Avatar, user name, workspace indicator, logout

## Components

### AppShell
Main shell component that wraps the entire application. Handles responsive sidebar, mobile menu, and layout structure.

**Props:**
- `children` - Main content to render
- `navigationItems` - Array of navigation items with icons and active states
- `user` - Current user object
- `currentWorkspace` - Current workspace object
- `workspaces` - Array of all workspaces
- `entities` - Array of entities for filtering
- `selectedEntityId` - Currently selected entity ID (optional)
- `onNavigate` - Navigation callback
- `onWorkspaceChange` - Workspace switcher callback
- `onEntityFilterChange` - Entity filter callback
- `onLogout` - Logout callback

### MainNav
Sidebar navigation component with workspace switcher, entity filter, and navigation items.

### UserMenu
User menu component at bottom of sidebar with avatar, name, workspace, and logout button.

## User Menu

Located at the bottom of the sidebar, contains:
- User avatar (initials if no image)
- User name
- Current workspace name
- Logout action

## Layout Pattern

- **Sidebar Width:** 260px on desktop
- **Content Area:** Full remaining width with padding
- **Sidebar Background:** Slate with backdrop blur for glassmorphic effect
- **Active State:** Orange accent for active navigation item
- **Hover State:** Violet tint for hover states

## Responsive Behavior

- **Desktop (1024px+):** Full sidebar visible, fixed width 260px
- **Tablet (768px-1023px):** Sidebar becomes hidden, hamburger menu in mobile header
- **Mobile (<768px):** Sidebar hidden, hamburger menu opens sidebar as full-screen overlay

## Design Notes

- Sidebar uses the product's design tokens (orange/violet/slate with Newsreader/Manrope)
- Navigation icons use lucide-react icon library
- Active section highlighted with orange accent and bold text
- Entity filter allows quick switching between "All Entities", "Personal", and individual business entities
- Workspace switcher enables multi-workspace support for SaaS model
- Tabs for sub-navigation are rendered by individual section designs, not the shell
- Shell is presentation layer only - navigation, filtering, and logout are passed as callbacks
- Includes a subtle spotlight effect on hover for visual interest

## Dependencies

The shell components require:
- React
- lucide-react (for icons)
- Tailwind CSS v4
- useSpotlight hook (included in package)

## Usage Example

```tsx
import { AppShell } from './shell/components'
import { Home, CreditCard, BookOpen, FileText, TrendingUp, Target, Bot } from 'lucide-react'

const navigationItems = [
  { id: 'accounts', label: 'Accounts Overview', icon: Home, href: '/', isActive: true },
  { id: 'reconciliation', label: 'Bank Reconciliation', icon: CreditCard, href: '/reconciliation' },
  { id: 'transactions', label: 'Transactions & Bookkeeping', icon: BookOpen, href: '/transactions' },
  { id: 'invoicing', label: 'Invoicing & Bills', icon: FileText, href: '/invoicing' },
  { id: 'analytics', label: 'Cash Flow & Analytics', icon: TrendingUp, href: '/analytics' },
  { id: 'planning', label: 'Budgeting & Goals', icon: Target, href: '/planning' },
  { id: 'ai', label: 'AI Financial Advisor', icon: Bot, href: '/ai' },
]

const user = { name: 'John Doe', email: 'john@example.com' }
const currentWorkspace = { id: '1', name: 'My Workspace' }
const entities = [
  { id: '1', name: 'Personal', type: 'personal' },
  { id: '2', name: 'My Company Inc.', type: 'business' },
]

<AppShell
  navigationItems={navigationItems}
  user={user}
  currentWorkspace={currentWorkspace}
  workspaces={[currentWorkspace]}
  entities={entities}
  onNavigate={(href) => router.push(href)}
  onWorkspaceChange={(id) => switchWorkspace(id)}
  onEntityFilterChange={(id) => setEntityFilter(id)}
  onLogout={() => logout()}
>
  {/* Your page content */}
</AppShell>
```
