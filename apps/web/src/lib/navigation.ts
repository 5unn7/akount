import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CheckSquare,
  ArrowRightLeft,
  Upload,
  Users,
  Building2,
  FileText,
  Receipt,
  CreditCard,
  BookOpen,
  ListTree,
  Package,
  Percent,
  Calendar,
  BarChart3,
  PiggyBank,
  Target,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  History,
  UserCog,
  FileStack,
  FolderOpen,
  Building,
  Plug,
  Workflow,
  UserPlus,
  ScrollText,
  Shield,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@akount/types';

/**
 * Navigation item definition.
 */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Roles that can see this item. Empty = all roles. */
  roles?: Role[];
}

/**
 * Navigation domain (group of items).
 */
export interface NavDomain {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Roles that can see this domain. Empty = all roles. */
  roles?: Role[];
}

/**
 * 8-Domain Navigation Structure
 * Based on: docs/design-system/05-governance/information-architecture.md
 */
export const navigationDomains: NavDomain[] = [
  // ========================================
  // DOMAIN 1: OVERVIEW
  // ========================================
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/overview',
      },
      {
        label: 'Net Worth',
        icon: TrendingUp,
        href: '/overview/net-worth',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'],
      },
      {
        label: 'Cash Flow',
        icon: ArrowLeftRight,
        href: '/overview/cash-flow',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'],
      },
    ],
  },

  // ========================================
  // DOMAIN 2: BANKING
  // ========================================
  {
    id: 'banking',
    label: 'Banking',
    icon: Wallet,
    roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'BOOKKEEPER'],
    items: [
      {
        label: 'Accounts',
        icon: Wallet,
        href: '/banking/accounts',
      },
      {
        label: 'Transactions',
        icon: ArrowLeftRight,
        href: '/banking/transactions',
      },
      {
        label: 'Reconciliation',
        icon: CheckSquare,
        href: '/banking/reconciliation',
      },
      {
        label: 'Imports',
        icon: Upload,
        href: '/banking/imports',
      },
      {
        label: 'Transfers',
        icon: ArrowRightLeft,
        href: '/banking/transfers',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'],
      },
    ],
  },

  // ========================================
  // DOMAIN 3: BUSINESS (AR/AP)
  // ========================================
  {
    id: 'business',
    label: 'Business',
    icon: Building2,
    roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'BOOKKEEPER'],
    items: [
      {
        label: 'Clients',
        icon: Users,
        href: '/business/clients',
      },
      {
        label: 'Vendors',
        icon: Building2,
        href: '/business/vendors',
      },
      {
        label: 'Invoices',
        icon: FileText,
        href: '/business/invoices',
      },
      {
        label: 'Bills',
        icon: Receipt,
        href: '/business/bills',
      },
      {
        label: 'Payments',
        icon: CreditCard,
        href: '/business/payments',
      },
    ],
  },

  // ========================================
  // DOMAIN 4: ACCOUNTING
  // ========================================
  {
    id: 'accounting',
    label: 'Accounting',
    icon: BookOpen,
    roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'],
    items: [
      {
        label: 'Overview',
        icon: LayoutDashboard,
        href: '/accounting',
      },
      {
        label: 'Chart of Accounts',
        icon: ListTree,
        href: '/accounting/chart-of-accounts',
      },
      {
        label: 'Journal Entries',
        icon: BookOpen,
        href: '/accounting/journal-entries',
      },
      {
        label: 'Reports',
        icon: BarChart3,
        href: '/accounting/reports',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'],
      },
      {
        label: 'Balance Sheet',
        icon: ScrollText,
        href: '/accounting/reports/balance-sheet',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'],
      },
      {
        label: 'Profit & Loss',
        icon: TrendingUp,
        href: '/accounting/reports/profit-loss',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'],
      },
      {
        label: 'Trial Balance',
        icon: ListTree,
        href: '/accounting/reports/trial-balance',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'],
      },
      {
        label: 'Assets',
        icon: Package,
        href: '/accounting/assets',
      },
      {
        label: 'Tax Rates',
        icon: Percent,
        href: '/accounting/tax-rates',
      },
      {
        label: 'Fiscal Periods',
        icon: Calendar,
        href: '/accounting/fiscal-periods',
      },
    ],
  },

  // ========================================
  // DOMAIN 5: PLANNING & ANALYTICS
  // ========================================
  {
    id: 'planning',
    label: 'Planning',
    icon: BarChart3,
    roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'INVESTOR', 'ADVISOR'],
    items: [
      {
        label: 'Budgets',
        icon: PiggyBank,
        href: '/planning/budgets',
        roles: ['OWNER', 'ADMIN'],
      },
      {
        label: 'Goals',
        icon: Target,
        href: '/planning/goals',
        roles: ['OWNER', 'ADMIN'],
      },
      {
        label: 'Forecasts',
        icon: TrendingUp,
        href: '/planning/forecasts',
      },
    ],
  },

  // ========================================
  // DOMAIN 6: INSIGHTS
  // ========================================
  {
    id: 'insights',
    label: 'Insights',
    icon: Sparkles,
    roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'],
    items: [
      {
        label: 'Insights',
        icon: Sparkles,
        href: '/insights',
      },
      {
        label: 'Policy Alerts',
        icon: AlertTriangle,
        href: '/insights/policy-alerts',
      },
      {
        label: 'History',
        icon: History,
        href: '/insights/history',
      },
    ],
  },

  // ========================================
  // DOMAIN 7: SERVICES
  // ========================================
  {
    id: 'services',
    label: 'Services',
    icon: UserCog,
    roles: ['OWNER', 'ADMIN'],
    items: [
      {
        label: 'Accountant',
        icon: UserCog,
        href: '/services/accountant',
      },
      {
        label: 'Bookkeeping',
        icon: FileStack,
        href: '/services/bookkeeping',
      },
      {
        label: 'Documents',
        icon: FolderOpen,
        href: '/services/documents',
      },
    ],
  },

  // ========================================
  // DOMAIN 8: SYSTEM
  // ========================================
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'],
    items: [
      {
        label: 'Entities',
        icon: Building,
        href: '/system/entities',
        roles: ['OWNER', 'ADMIN'],
      },
      {
        label: 'Integrations',
        icon: Plug,
        href: '/system/integrations',
        roles: ['OWNER', 'ADMIN'],
      },
      {
        label: 'Rules',
        icon: Workflow,
        href: '/system/rules',
        roles: ['OWNER', 'ADMIN'],
      },
      {
        label: 'Users',
        icon: UserPlus,
        href: '/system/users',
        roles: ['OWNER', 'ADMIN'],
      },
      {
        label: 'Audit Log',
        icon: ScrollText,
        href: '/system/audit-log',
      },
      {
        label: 'Security',
        icon: Shield,
        href: '/system/security',
      },
      {
        label: 'Settings',
        icon: Settings,
        href: '/system/settings',
        roles: ['OWNER', 'ADMIN'],
      },
    ],
  },
];

/**
 * Extract domain tabs for DomainTabs component.
 * Derives tabs from navigationDomains — single source of truth.
 * Filters out sub-pages (e.g., /accounting/reports/balance-sheet)
 * so only top-level domain pages appear as tabs.
 */
export function getDomainTabs(
  domainId: string
): { label: string; href: string }[] {
  const domain = navigationDomains.find((d) => d.id === domainId);
  if (!domain) return [];

  // Domain prefix, e.g. "/banking", "/accounting"
  const prefix = `/${domainId}`;

  return domain.items.filter((item) => {
    // Keep the domain root (e.g. /accounting)
    if (item.href === prefix) return true;
    // Keep direct children (e.g. /accounting/reports) but not
    // deeper sub-pages (e.g. /accounting/reports/balance-sheet)
    const afterPrefix = item.href.slice(prefix.length + 1); // strip "/domain/"
    return !afterPrefix.includes('/');
  }).map((item) => ({
    label: item.label,
    href: item.href,
  }));
}

/**
 * Filter navigation domains based on user role.
 */
export function getNavigationForRole(role: Role): NavDomain[] {
  return navigationDomains
    .filter((domain) => {
      // If no roles specified, show to all
      if (!domain.roles || domain.roles.length === 0) return true;
      return domain.roles.includes(role);
    })
    .map((domain) => ({
      ...domain,
      items: domain.items.filter((item) => {
        // If no roles specified, show to all
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.includes(role);
      }),
    }))
    .filter((domain) => domain.items.length > 0);
}

/**
 * Legacy flat navigation for backwards compatibility.
 * @deprecated Use navigationDomains instead.
 */
export const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/overview',
  },
  {
    label: 'Accounts',
    icon: Wallet,
    href: '/banking/accounts',
  },
  {
    label: 'Transactions',
    icon: ArrowLeftRight,
    href: '/banking/transactions',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/system/settings',
  },
];
