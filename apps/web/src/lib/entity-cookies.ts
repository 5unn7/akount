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
