import { cookies } from 'next/headers';

export interface EntitySelection {
  entityId: string | null; // null = "All Entities"
  currency: string;
}

/**
 * Read entity selection from cookies (server-side only).
 * Used by dashboard layout and page server components.
 *
 * Cookie `ak-entity-id`: selected entity ID, or empty string for "All"
 * Cookie `ak-currency`: display currency code (e.g. "CAD", "USD")
 */
export async function getEntitySelection(
  fallbackCurrency: string = 'CAD'
): Promise<EntitySelection> {
  const cookieStore = await cookies();
  const rawEntityId = cookieStore.get('ak-entity-id')?.value ?? '';
  const currency = cookieStore.get('ak-currency')?.value || fallbackCurrency;

  return {
    entityId: rawEntityId === '' ? null : rawEntityId,
    currency,
  };
}

/**
 * Validate a cookie entityId against the user's actual entities list.
 * Returns the entityId if valid, or null if stale/tampered/missing.
 *
 * Defense-in-depth: even if cookie is tampered, backend enforces tenantId.
 * This prevents UI showing data for a non-existent entity.
 */
export function validateEntityId(
  rawEntityId: string | null,
  entities: { id: string }[]
): string | null {
  if (!rawEntityId) return null;
  return entities.some((e) => e.id === rawEntityId) ? rawEntityId : null;
}
