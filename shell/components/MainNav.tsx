import { ChevronDown, Settings, HelpCircle, LayoutGrid, Building2 } from 'lucide-react'
import type { NavigationItem, Workspace, Entity } from './types'

interface MainNavProps {
  navigationItems: NavigationItem[]
  workspaces?: Workspace[]
  currentWorkspace?: Workspace
  entities?: Entity[]
  selectedEntityId?: string
  onNavigate: (href: string) => void
  onWorkspaceChange: (workspaceId: string) => void
  onEntityFilterChange: (entityId?: string) => void
}

export function MainNav({
  navigationItems = [],
  currentWorkspace,
  entities = [],
  selectedEntityId,
  onNavigate,
}: MainNavProps) {
  const selectedEntity = selectedEntityId
    ? entities?.find(e => e.id === selectedEntityId)
    : undefined

  return (
    <nav className="flex-1 flex flex-col px-2.5 py-3 overflow-y-auto font-[family-name:var(--font-body)] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-600">
      {/* Workspace Switcher */}
      <div className="mb-2.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2.5 mb-1.5 block uppercase tracking-wider">
          Workspace
        </label>
        <button
          onClick={() => {
            // In real app, this would open a dropdown
            console.log('Open workspace switcher')
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 transition-all group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <LayoutGrid className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
            <span className="truncate text-xs font-medium">{currentWorkspace?.name}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
        </button>
      </div>

      {/* Entity Filter */}
      <div className="mb-2.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2.5 mb-1.5 block uppercase tracking-wider">
          View
        </label>
        <button
          onClick={() => {
            // In real app, this would open a dropdown
            console.log('Open entity filter')
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 transition-all group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
            <span className="truncate text-xs font-medium">
              {selectedEntity ? selectedEntity.name : 'All Entities'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-2.5" />

      {/* Main Navigation Items */}
      <div className="space-y-0.5 mb-2.5">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.href)}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all group
                ${item.isActive
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-violet-50/80 dark:hover:bg-violet-950/30 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-sm'
                }
              `}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${item.isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="truncate text-xs">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-2.5" />

      {/* Secondary Navigation */}
      <div className="space-y-0.5">
        <button
          onClick={() => onNavigate('/settings')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <Settings className="w-4 h-4 flex-shrink-0 group-hover:rotate-90 transition-transform duration-300" />
          <span className="truncate text-xs">Settings</span>
        </button>
        <button
          onClick={() => onNavigate('/help')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate text-xs">Help & Support</span>
        </button>
      </div>
    </nav>
  )
}
