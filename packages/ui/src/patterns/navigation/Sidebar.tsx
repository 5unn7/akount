'use client';

import type { Role, PermissionKey } from '@akount/types';
import { canAccess } from '@akount/types';
import { cn } from '../../utils';

/**
 * Navigation item definition.
 */
interface NavItem {
  label: string;
  href: string;
  icon: string;
  /**
   * Permission key for RBAC filtering.
   * If not provided, item is visible to all roles.
   */
  permissionKey?: PermissionKey;
}

/**
 * Navigation section containing related items.
 */
interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Default navigation structure from design-system.
 * See: docs/design-system/02-patterns/navigation.md
 */
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/overview',
        icon: '\u{1F4CA}',
        permissionKey: 'overview:dashboard',
      },
      {
        label: 'Net Worth',
        href: '/overview/net-worth',
        icon: '\u{1F4B0}',
        permissionKey: 'overview:net-worth',
      },
      {
        label: 'Cash Flow',
        href: '/overview/cash-flow',
        icon: '\u{1F4C8}',
        permissionKey: 'overview:cash-overview',
      },
    ],
  },
  {
    title: 'Banking',
    items: [
      {
        label: 'Accounts',
        href: '/banking/accounts',
        icon: '\u{1F3E6}',
        permissionKey: 'banking:accounts',
      },
      {
        label: 'Transactions',
        href: '/banking/transactions',
        icon: '\u{1F4B3}',
        permissionKey: 'banking:transactions',
      },
      {
        label: 'Reconciliation',
        href: '/banking/reconciliation',
        icon: '\u2713',
        permissionKey: 'banking:reconciliation',
      },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        label: 'Clients',
        href: '/business/clients',
        icon: '\u{1F465}',
        permissionKey: 'business:clients',
      },
      {
        label: 'Vendors',
        href: '/business/vendors',
        icon: '\u{1F3EA}',
        permissionKey: 'business:vendors',
      },
      {
        label: 'Invoices',
        href: '/business/invoices',
        icon: '\u{1F4C4}',
        permissionKey: 'business:invoices',
      },
      {
        label: 'Bills',
        href: '/business/bills',
        icon: '\u{1F4CB}',
        permissionKey: 'business:bills',
      },
    ],
  },
  {
    title: 'Accounting',
    items: [
      {
        label: 'Journal Entries',
        href: '/accounting/journal-entries',
        icon: '\u{1F4D2}',
        permissionKey: 'accounting:journal-entries',
      },
      {
        label: 'Chart of Accounts',
        href: '/accounting/chart-of-accounts',
        icon: '\u{1F4D1}',
        permissionKey: 'accounting:chart-of-accounts',
      },
    ],
  },
  {
    title: 'Planning',
    items: [
      {
        label: 'Reports',
        href: '/planning/reports',
        icon: '\u{1F4CA}',
        permissionKey: 'planning:reports',
      },
      {
        label: 'Budgets',
        href: '/planning/budgets',
        icon: '\u{1F3AF}',
        permissionKey: 'planning:budgets',
      },
    ],
  },
  {
    title: 'Insights',
    items: [
      {
        label: 'Insights',
        href: '/insights',
        icon: '\u{1F9E0}',
        permissionKey: 'ai:insight-feed',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Entities',
        href: '/system/entities',
        icon: '\u{1F3E2}',
        permissionKey: 'system:entities',
      },
      {
        label: 'Users',
        href: '/system/users',
        icon: '\u{1F464}',
        permissionKey: 'system:users',
      },
      {
        label: 'Audit Log',
        href: '/system/audit-log',
        icon: '\u{1F4DC}',
        permissionKey: 'system:audit-log',
      },
    ],
  },
];

export interface SidebarProps {
  /**
   * Current user for RBAC filtering.
   */
  user: {
    role: Role;
  };
  /**
   * Current path for active state highlighting.
   */
  currentPath?: string;
  /**
   * Custom navigation sections (overrides default).
   */
  sections?: NavSection[];
  /**
   * Additional CSS classes.
   */
  className?: string;
  /**
   * Callback when a link is clicked.
   */
  onNavigate?: (href: string) => void;
}

/**
 * Main navigation sidebar with RBAC-based filtering.
 *
 * Items are automatically hidden based on user role permissions.
 * Sections with no visible items are also hidden.
 *
 * @example
 * ```tsx
 * <Sidebar
 *   user={{ role: 'BOOKKEEPER' }}
 *   currentPath="/banking/transactions"
 * />
 * ```
 */
export function Sidebar({
  user,
  currentPath,
  sections = NAV_SECTIONS,
  className,
  onNavigate,
}: SidebarProps) {
  /**
   * Filter items based on user role permissions.
   */
  const filterItems = (items: NavItem[]): NavItem[] =>
    items.filter((item) => {
      if (!item.permissionKey) return true;
      return canAccess(item.permissionKey, user.role, 'VIEW');
    });

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 border-r bg-background',
        'overflow-y-auto',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
      data-testid="sidebar"
    >
      <nav className="space-y-6 p-4">
        {sections.map((section) => {
          const visibleItems = filterItems(section.items);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1" role="list">
                {visibleItems.map((item) => {
                  const isActive = currentPath === item.href;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={(e) => {
                          if (onNavigate) {
                            e.preventDefault();
                            onNavigate(item.href);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-2 text-sm',
                          'transition-colors hover:bg-muted',
                          isActive && 'bg-muted font-medium'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span role="img" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// Export types for external use
export type { NavItem, NavSection };
