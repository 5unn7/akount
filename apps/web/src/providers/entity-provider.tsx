'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Entity } from '@/lib/api/entities';

interface EntityContextValue {
  entities: Entity[];
  selectedEntityId: string | null; // null = "All Entities"
  selectedEntity: Entity | null; // null when "All"
  isAllEntities: boolean;
  currency: string;
  setEntity: (entityId: string | null) => void;
  setCurrency: (code: string) => void;
  isPending: boolean; // true during server refresh after entity change
}

const EntityContext = createContext<EntityContextValue | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

interface EntityProviderProps {
  children: ReactNode;
  entities: Entity[];
  initialEntityId: string | null; // from cookie, read server-side
  initialCurrency: string; // from cookie, read server-side
}

export function EntityProvider({
  children,
  entities,
  initialEntityId,
  initialCurrency,
}: EntityProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [entityId, setEntityId] = useState<string | null>(initialEntityId);
  const [currency, setCurrencyState] = useState(initialCurrency);

  const selectedEntity = entityId
    ? entities.find((e) => e.id === entityId) ?? null
    : null;

  const setEntity = useCallback(
    (id: string | null) => {
      setEntityId(id);
      setCookie('ak-entity-id', id ?? '');

      // When selecting a specific entity, auto-switch to its base currency
      if (id) {
        const entity = entities.find((e) => e.id === id);
        if (entity) {
          setCurrencyState(entity.currency);
          setCookie('ak-currency', entity.currency);
        }
      }

      startTransition(() => {
        router.refresh();
      });
    },
    [entities, router]
  );

  const setCurrency = useCallback(
    (code: string) => {
      setCurrencyState(code);
      setCookie('ak-currency', code);
      startTransition(() => {
        router.refresh();
      });
    },
    [router]
  );

  return (
    <EntityContext.Provider
      value={{
        entities,
        selectedEntityId: entityId,
        selectedEntity,
        isAllEntities: entityId === null,
        currency,
        setEntity,
        setCurrency,
        isPending,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity(): EntityContextValue {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntity must be used within an EntityProvider');
  }
  return context;
}
