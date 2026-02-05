'use client';

import { useState, useRef, useEffect } from 'react';
import type { Currency, Role } from '@akount/types';
import { CURRENCY_INFO } from '@akount/types';
import { cn } from '../../utils';

/**
 * Entity for the entity switcher.
 */
interface Entity {
  id: string;
  name: string;
  type: string;
  countryCode: string;
  currency: Currency;
}

export interface TopCommandBarProps {
  /**
   * Available entities to switch between.
   */
  entities: Entity[];
  /**
   * Currently selected entity ID.
   */
  selectedEntityId?: string;
  /**
   * Callback when entity selection changes.
   */
  onEntityChange?: (entityId: string) => void;
  /**
   * Current user information.
   */
  user: {
    role: Role;
    name?: string;
    avatarUrl?: string;
  };
  /**
   * Current fiscal period (e.g., "2026", "Q1 2026").
   */
  currentPeriod?: string;
  /**
   * Callback when period selector is clicked.
   */
  onPeriodClick?: () => void;
  /**
   * Callback when search is triggered.
   */
  onSearch?: (query: string) => void;
  /**
   * Callback when AI panel toggle is clicked.
   */
  onAIToggle?: () => void;
  /**
   * Callback when user menu is clicked.
   */
  onUserMenuClick?: () => void;
  /**
   * Additional CSS classes.
   */
  className?: string;
}

// Icon constants to avoid inline Unicode issues
const ICONS = {
  building: '\u{1F3E2}',
  calendar: '\u{1F4C5}',
  search: '\u{1F50D}',
  brain: '\u{1F9E0}',
  user: '\u{1F464}',
  chevronDown: '\u25BC',
};

/**
 * Top command bar with entity switcher, period selector, search, and user menu.
 *
 * @example
 * ```tsx
 * <TopCommandBar
 *   entities={entities}
 *   selectedEntityId={currentEntityId}
 *   onEntityChange={setCurrentEntityId}
 *   user={{ role: 'OWNER', name: 'John Doe' }}
 *   currentPeriod="2026"
 * />
 * ```
 */
export function TopCommandBar({
  entities,
  selectedEntityId,
  onEntityChange,
  user,
  currentPeriod = new Date().getFullYear().toString(),
  onPeriodClick,
  onSearch,
  onAIToggle,
  onUserMenuClick,
  className,
}: TopCommandBarProps) {
  const [isEntitySwitcherOpen, setEntitySwitcherOpen] = useState(false);
  const entitySwitcherRef = useRef<HTMLDivElement>(null);

  const selectedEntity =
    entities.find((e) => e.id === selectedEntityId) || entities[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        entitySwitcherRef.current &&
        !entitySwitcherRef.current.contains(event.target as Node)
      ) {
        setEntitySwitcherOpen(false);
      }
    }

    if (isEntitySwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEntitySwitcherOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setEntitySwitcherOpen(false);
      }
    }

    if (isEntitySwitcherOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isEntitySwitcherOpen]);

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 h-14 border-b bg-background',
        className
      )}
      data-testid="top-command-bar"
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <span className="font-heading text-xl font-bold">Akount</span>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Entity Switcher */}
          {entities.length > 0 && (
            <div className="relative" ref={entitySwitcherRef}>
              <button
                onClick={() => setEntitySwitcherOpen(!isEntitySwitcherOpen)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-muted"
                aria-expanded={isEntitySwitcherOpen}
                aria-haspopup="listbox"
                aria-label="Select entity"
              >
                <span role="img" aria-hidden="true">
                  {selectedEntity
                    ? CURRENCY_INFO[selectedEntity.currency].flag
                    : ICONS.building}
                </span>
                <span className="max-w-32 truncate font-medium">
                  {selectedEntity?.name || 'Select Entity'}
                </span>
                <span
                  className={cn(
                    'text-muted-foreground transition-transform',
                    isEntitySwitcherOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                >
                  {ICONS.chevronDown}
                </span>
              </button>

              {isEntitySwitcherOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-64 rounded-md border bg-background shadow-lg"
                  role="listbox"
                  aria-label="Entity list"
                >
                  {entities.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => {
                        onEntityChange?.(entity.id);
                        setEntitySwitcherOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-muted',
                        entity.id === selectedEntityId && 'bg-muted'
                      )}
                      role="option"
                      aria-selected={entity.id === selectedEntityId}
                    >
                      <span role="img" aria-hidden="true">
                        {CURRENCY_INFO[entity.currency].flag}
                      </span>
                      <span className="truncate">{entity.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Period Selector */}
          <button
            onClick={onPeriodClick}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-muted"
            aria-label={`Fiscal period: ${currentPeriod}`}
          >
            <span role="img" aria-hidden="true">
              {ICONS.calendar}
            </span>
            <span>{currentPeriod}</span>
          </button>

          {/* Search */}
          {onSearch && (
            <button
              onClick={() => onSearch('')}
              className="rounded-md px-3 py-1.5 hover:bg-muted"
              aria-label="Search"
            >
              <span role="img" aria-hidden="true">
                {ICONS.search}
              </span>
              <span className="sr-only">Search</span>
            </button>
          )}

          {/* AI Panel Toggle */}
          {onAIToggle && (
            <button
              onClick={onAIToggle}
              className="rounded-md px-3 py-1.5 text-ai hover:bg-muted"
              aria-label="Toggle AI panel"
            >
              <span role="img" aria-hidden="true">
                {ICONS.brain}
              </span>
              <span className="sr-only">AI Advisor</span>
            </button>
          )}

          {/* User Menu */}
          <button
            onClick={onUserMenuClick}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
            aria-label={`User menu${user.name ? `: ${user.name}` : ''}`}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span role="img" aria-hidden="true">
                {ICONS.user}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
