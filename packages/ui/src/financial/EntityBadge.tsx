import type { Currency } from '@akount/types';
import { CURRENCY_INFO } from '@akount/types';
import { cn } from '../utils';

/**
 * Entity types supported in Akount.
 */
export type EntityType =
  | 'personal'
  | 'corporation'
  | 'sole_proprietorship'
  | 'partnership'
  | 'llc'
  | 'trust';

const TYPE_LABELS: Record<EntityType, string> = {
  personal: 'Personal',
  corporation: 'Corp',
  sole_proprietorship: 'Sole Prop',
  partnership: 'Partnership',
  llc: 'LLC',
  trust: 'Trust',
};

export interface EntityBadgeProps {
  /**
   * Entity name to display.
   */
  name: string;
  /**
   * Two-letter country code (ISO 3166-1 alpha-2).
   */
  countryCode: string;
  /**
   * Currency for the entity (determines flag).
   */
  currency: Currency;
  /**
   * Entity type (optional, displays type label).
   */
  type?: EntityType;
  /**
   * Badge size variant.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Display an entity with its flag, name, and optional type.
 *
 * @example
 * ```tsx
 * <EntityBadge
 *   name="Acme Inc"
 *   countryCode="CA"
 *   currency="CAD"
 *   type="corporation"
 * />
 * // Shows: [Canadian flag] Acme Inc (Corp)
 * ```
 */
export function EntityBadge({
  name,
  countryCode,
  currency,
  type,
  size = 'md',
  className,
}: EntityBadgeProps) {
  const { flag } = CURRENCY_INFO[currency];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const flagSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-muted',
        sizeClasses[size],
        className
      )}
      data-testid="entity-badge"
    >
      <span className={flagSizes[size]} role="img" aria-label={countryCode}>
        {flag}
      </span>
      <span className="font-medium">{name}</span>
      {type && (
        <span className="text-muted-foreground">({TYPE_LABELS[type]})</span>
      )}
    </div>
  );
}
