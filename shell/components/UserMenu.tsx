import { LogOut, ChevronUp } from 'lucide-react'
import type { User, Workspace } from './types'

interface UserMenuProps {
  user: User
  workspace: Workspace
  onLogout: () => void
}

export function UserMenu({ user, workspace, onLogout }: UserMenuProps) {
  // Generate initials from user name
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 p-3 font-[family-name:var(--font-body)]">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group">
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-medium">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {user.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {workspace.name}
          </div>
        </div>
        <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        <span>Logout</span>
      </button>
    </div>
  )
}
