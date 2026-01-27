import React from 'react'

export interface NavigationItem {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    href: string
    isActive?: boolean
}

export interface Entity {
    id: string
    name: string
    type: 'personal' | 'business'
}

export interface Workspace {
    id: string
    name: string
}

export interface User {
    name: string
    email: string
    avatarUrl?: string
}

export interface AppShellProps {
    children: React.ReactNode
    navigationItems: NavigationItem[]
    user: User
    currentWorkspace: Workspace
    workspaces: Workspace[]
    entities: Entity[]
    selectedEntityId?: string
    onNavigate: (href: string) => void
    onWorkspaceChange: (workspaceId: string) => void
    onEntityFilterChange: (entityId?: string) => void
    onLogout: () => void
}
