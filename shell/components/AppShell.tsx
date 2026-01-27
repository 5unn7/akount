import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'
import type { AppShellProps } from './types'
import { useSpotlight } from './useSpotlight'

export function AppShell({
  children,
  navigationItems,
  user,
  currentWorkspace,
  workspaces,
  entities,
  selectedEntityId,
  onNavigate,
  onWorkspaceChange,
  onEntityFilterChange,
  onLogout,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { elementRef, spotlightStyle } = useSpotlight()

  return (
    <div
      ref={elementRef}
      className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 relative overflow-hidden"
    >
      {/* Dynamic Spotlight Effect */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={spotlightStyle}
      />
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 flex items-center px-4 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <span className="ml-3 text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
          Akount
        </span>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-[260px]
          bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/50
          flex flex-col transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between h-14 px-3 border-b border-slate-200 dark:border-slate-800/50">
          <span className="text-lg font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Akount
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        {/* Logo (Desktop) */}
        <div className="hidden lg:flex items-center h-14 px-3 border-b border-slate-200 dark:border-slate-800/50">
          <span className="text-xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Akount
          </span>
        </div>

        {/* Navigation */}
        <MainNav
          navigationItems={navigationItems}
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          entities={entities}
          selectedEntityId={selectedEntityId}
          onNavigate={(href) => {
            onNavigate(href)
            setIsMobileMenuOpen(false)
          }}
          onWorkspaceChange={onWorkspaceChange}
          onEntityFilterChange={onEntityFilterChange}
        />

        {/* User Menu */}
        <UserMenu user={user} workspace={currentWorkspace} onLogout={onLogout} />
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
