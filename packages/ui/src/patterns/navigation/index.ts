/**
 * Navigation pattern components for Akount.
 *
 * These components provide the main navigation structure
 * with RBAC-based filtering and entity context.
 *
 * @example
 * ```tsx
 * import { Sidebar, TopCommandBar } from '@akount/ui/patterns/navigation';
 *
 * function Layout({ children }) {
 *   return (
 *     <>
 *       <TopCommandBar
 *         entities={entities}
 *         selectedEntityId={entityId}
 *         user={{ role: 'OWNER' }}
 *       />
 *       <Sidebar user={{ role: 'OWNER' }} currentPath={pathname} />
 *       <main className="ml-60 mt-14 p-6">{children}</main>
 *     </>
 *   );
 * }
 * ```
 */

export * from './Sidebar';
export * from './TopCommandBar';

// Future navigation components:
// export * from './EntitySwitcher';
// export * from './PeriodSelector';
// export * from './Breadcrumbs';
// export * from './QuickSearch';
