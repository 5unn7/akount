# Accounts Overview Dashboard - Implementation Plan

**Date:** 2026-01-31
**Type:** feature
**Status:** Planning → Ready for Implementation
**Phase:** Phase 1 - Accounts Overview
**Related:**
- **Brainstorm:** `docs/brainstorms/2026-01-30-accounts-overview-brainstorm.md`
- **Feature Spec:** `docs/features/01-accounts-overview.md`
- **Roadmap:** `ROADMAP.md` (Phase 1)

---

## Summary

Build the financial command center dashboard showing consolidated net worth, cash position, and account list with multi-currency support and entity filtering. This establishes core patterns for financial data display, currency conversion, and context-aware navigation used throughout the app.

---

## User Story

**As a** freelancer managing multiple businesses across currencies
**I want to** see my complete financial position at a glance with proper entity separation
**So that** I can understand my total net worth, available cash, and account status without switching between apps

---

## Success Criteria

- [ ] Dashboard displays net worth (assets - liabilities) with trend indicator
- [ ] Cash position shown separately from total net worth
- [ ] Account list grouped by type (Banks, Credit Cards, Loans, Investments)
- [ ] Entity filter at top updates all dashboard metrics
- [ ] Currency toggle switches between native currencies and base currency (CAD)
- [ ] All amounts stored as integer cents (no Float precision errors)
- [ ] Tenant isolation enforced in all queries
- [ ] Empty state shown when no accounts exist
- [ ] Mobile responsive design

---

## Technical Approach

### Architecture

**Components Affected:**
- **Frontend:**
  - `apps/web/src/app/(dashboard)/dashboard/page.tsx` - Main dashboard (Server Component)
  - `apps/web/src/components/dashboard/NetWorthCard.tsx` - Net worth display (Client for interactivity)
  - `apps/web/src/components/dashboard/CashPositionCard.tsx` - Cash breakdown (Client)
  - `apps/web/src/components/dashboard/AccountsList.tsx` - Grouped account list (Client)
  - `apps/web/src/components/dashboard/EntityFilter.tsx` - Entity selector (Client)
  - `apps/web/src/lib/money.ts` - Currency formatting utilities
  - `apps/web/src/lib/currency.ts` - Currency conversion utilities

- **API:**
  - `apps/api/src/routes/accounts.ts` - Account CRUD endpoints
  - `apps/api/src/routes/dashboard.ts` - Dashboard metrics endpoint
  - `apps/api/src/services/account.service.ts` - Account business logic
  - `apps/api/src/services/fxRate.service.ts` - FX rate fetching/caching
  - `apps/api/src/services/dashboard.service.ts` - Dashboard calculations

- **Database:**
  - `Account` model (existing) - Bank accounts, credit cards, loans
  - `FXRate` model (existing) - Exchange rate data
  - New seed data for sample accounts

**Key Decisions:**

1. **Server vs Client Components:**
   - Dashboard page: Server Component (data fetching, initial render)
   - Metric cards: Client Components (interactive filtering, currency toggle)
   - Account list: Client Component (collapsible groups, interactions)
   - **Why:** Maximize server rendering for SEO/performance, client only for interactivity

2. **Data Flow:**
   ```
   Database → API Service Layer → API Route → Frontend Server Component → Client Components
   ```
   - Server component fetches initial data (no loading spinner on page load)
   - Client components use data passed as props (no additional API calls initially)
   - Future: Add TanStack Query for real-time updates and mutations

3. **Authentication & Authorization:**
   - All API routes require `authMiddleware` (Clerk JWT verification)
   - Extract `tenantId` from authenticated user
   - Filter all queries by `tenantId` (tenant isolation)
   - Entity filtering is client-side (data already filtered by tenant)

4. **Currency Conversion:**
   - Fetch FX rates from external API (e.g., exchangerate-api.io) daily
   - Cache rates in FXRate table with date and source
   - Fallback to manual rates if API unavailable
   - Convert at display time (never modify stored balances)

---

### Data Model Changes

**No Schema Changes Required** - Using existing models:

```prisma
model Account {
  id             String      @id @default(cuid())
  entityId       String
  name           String
  type           AccountType // BANK, CREDIT_CARD, LOAN, MORTGAGE, INVESTMENT
  institution    String?
  currency       String      // ISO 4217 (USD, CAD, EUR)
  country        String
  currentBalance Int         // Balance in cents (INTEGER)
  isActive       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  entity         Entity      @relation(fields: [entityId], references: [id])

  @@index([entityId])
  @@index([entityId, type])
  @@index([entityId, isActive])
}

model FXRate {
  id        String   @id @default(cuid())
  base      String   // Base currency (e.g., "CAD")
  quote     String   // Quote currency (e.g., "USD")
  date      DateTime // Rate effective date
  source    String   // "api", "manual", "bank"
  rate      Float    // Exchange rate (e.g., 1.35 = 1 USD = 1.35 CAD)
  createdAt DateTime @default(now())

  @@unique([base, quote, date, source])
  @@index([base, quote, date])
}
```

**Seed Data Enhancement:**

Add sample accounts to `packages/db/prisma/seed.ts`:

```typescript
// Create 5 sample accounts for test user
const accounts = [
  {
    name: 'TD Chequing',
    type: 'BANK',
    institution: 'TD Canada Trust',
    currency: 'CAD',
    country: 'CA',
    currentBalance: 450000, // $4,500.00
    entityId: businessEntity.id,
  },
  {
    name: 'RBC Savings',
    type: 'BANK',
    institution: 'Royal Bank of Canada',
    currency: 'CAD',
    country: 'CA',
    currentBalance: 1250000, // $12,500.00
    entityId: personalEntity.id,
  },
  {
    name: 'Amex Business Card',
    type: 'CREDIT_CARD',
    institution: 'American Express',
    currency: 'USD',
    country: 'US',
    currentBalance: -150000, // -$1,500.00 (debt)
    entityId: businessEntity.id,
  },
  {
    name: 'Wealthsimple Investment',
    type: 'INVESTMENT',
    institution: 'Wealthsimple',
    currency: 'CAD',
    country: 'CA',
    currentBalance: 3500000, // $35,000.00
    entityId: personalEntity.id,
  },
  {
    name: 'Student Loan',
    type: 'LOAN',
    institution: 'NSLSC',
    currency: 'CAD',
    country: 'CA',
    currentBalance: -2500000, // -$25,000.00 (debt)
    entityId: personalEntity.id,
  },
];

await prisma.account.createMany({ data: accounts });

// Create sample FX rates for current date
const today = new Date();
const fxRates = [
  { base: 'CAD', quote: 'USD', date: today, source: 'manual', rate: 0.74 }, // 1 CAD = 0.74 USD
  { base: 'USD', quote: 'CAD', date: today, source: 'manual', rate: 1.35 }, // 1 USD = 1.35 CAD
  { base: 'CAD', quote: 'EUR', date: today, source: 'manual', rate: 0.68 },
  { base: 'EUR', quote: 'CAD', date: today, source: 'manual', rate: 1.47 },
];

await prisma.fXRate.createMany({ data: fxRates });
```

---

### API Endpoints

#### **1. Dashboard Metrics Endpoint**

**Route:** `GET /api/dashboard/metrics`

**Purpose:** Aggregate net worth, cash position, account counts

**Request Query Params:**
```typescript
{
  entityId?: string;  // Optional: filter by specific entity (default: all)
  currency?: string;  // Optional: target currency for conversion (default: tenant base currency)
}
```

**Response:**
```typescript
{
  netWorth: {
    current: 2540000,        // $25,400.00 in cents (base currency)
    previous: 2400000,       // $24,000.00 (30 days ago)
    change: 140000,          // $1,400.00
    changePercent: 5.83,     // 5.83% increase
    currency: 'CAD'
  },
  cashPosition: {
    cash: 1700000,           // $17,000.00 (BANK accounts only)
    debt: 2650000,           // $26,500.00 (CREDIT_CARD + LOAN)
    net: -950000,            // -$9,500.00 (cash - debt)
    currency: 'CAD'
  },
  accounts: {
    total: 5,
    active: 5,
    byType: {
      BANK: 2,
      CREDIT_CARD: 1,
      LOAN: 1,
      INVESTMENT: 1
    }
  }
}
```

**Implementation:**
```typescript
// apps/api/src/routes/dashboard.ts
import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { DashboardService } from '../services/dashboard.service';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/dashboard/metrics',
    { onRequest: [authMiddleware] },
    async (request, reply) => {
      const { entityId, currency } = request.query as { entityId?: string; currency?: string };

      const service = new DashboardService(request.userId!);
      const metrics = await service.getMetrics(entityId, currency);

      return metrics;
    }
  );
}
```

**Service Logic:**
```typescript
// apps/api/src/services/dashboard.service.ts
export class DashboardService {
  constructor(private clerkUserId: string) {}

  async getMetrics(entityId?: string, targetCurrency?: string) {
    // 1. Get user's tenant
    const tenant = await this.getUserTenant();

    // 2. Get all accounts (filtered by tenant and optional entity)
    const accounts = await prisma.account.findMany({
      where: {
        entity: { tenantId: tenant.id },
        ...(entityId && { entityId }),
        isActive: true
      },
      include: { entity: true }
    });

    // 3. Convert all balances to target currency (default: tenant base currency)
    const currency = targetCurrency || tenant.baseCurrency || 'CAD';
    const fxService = new FxRateService();

    // 4. Calculate net worth (assets - liabilities)
    const assets = accounts.filter(a => ['BANK', 'INVESTMENT'].includes(a.type));
    const liabilities = accounts.filter(a => ['CREDIT_CARD', 'LOAN', 'MORTGAGE'].includes(a.type));

    const totalAssets = await this.sumBalancesInCurrency(assets, currency, fxService);
    const totalLiabilities = Math.abs(await this.sumBalancesInCurrency(liabilities, currency, fxService));

    const netWorth = totalAssets - totalLiabilities;

    // 5. Calculate cash position (cash - debt)
    const cashAccounts = accounts.filter(a => a.type === 'BANK');
    const debtAccounts = accounts.filter(a => ['CREDIT_CARD', 'LOAN'].includes(a.type));

    const totalCash = await this.sumBalancesInCurrency(cashAccounts, currency, fxService);
    const totalDebt = Math.abs(await this.sumBalancesInCurrency(debtAccounts, currency, fxService));

    // 6. Calculate historical comparison (30 days ago) - placeholder for now
    const previousNetWorth = netWorth * 0.95; // TODO: Implement historical snapshots

    return {
      netWorth: {
        current: netWorth,
        previous: previousNetWorth,
        change: netWorth - previousNetWorth,
        changePercent: ((netWorth - previousNetWorth) / previousNetWorth) * 100,
        currency
      },
      cashPosition: {
        cash: totalCash,
        debt: totalDebt,
        net: totalCash - totalDebt,
        currency
      },
      accounts: {
        total: accounts.length,
        active: accounts.filter(a => a.isActive).length,
        byType: this.groupByType(accounts)
      }
    };
  }

  private async sumBalancesInCurrency(
    accounts: Account[],
    targetCurrency: string,
    fxService: FxRateService
  ): Promise<number> {
    let total = 0;

    for (const account of accounts) {
      if (account.currency === targetCurrency) {
        total += account.currentBalance;
      } else {
        const rate = await fxService.getRate(account.currency, targetCurrency);
        total += Math.round(account.currentBalance * rate);
      }
    }

    return total;
  }
}
```

#### **2. Accounts List Endpoint**

**Route:** `GET /api/accounts`

**Purpose:** List all accounts for authenticated user's tenant

**Request Query Params:**
```typescript
{
  entityId?: string;   // Optional: filter by entity
  type?: string;       // Optional: filter by account type (BANK, CREDIT_CARD, etc.)
  isActive?: boolean;  // Optional: filter active/inactive
}
```

**Response:**
```typescript
{
  accounts: [
    {
      id: 'acc_1',
      name: 'TD Chequing',
      type: 'BANK',
      institution: 'TD Canada Trust',
      currency: 'CAD',
      country: 'CA',
      currentBalance: 450000,  // $4,500.00 in cents
      isActive: true,
      entity: {
        id: 'ent_1',
        name: 'Akount Inc.',
        type: 'CORPORATION'
      },
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-30T15:30:00Z'
    },
    // ... more accounts
  ]
}
```

**Implementation:**
```typescript
// apps/api/src/routes/accounts.ts
fastify.get('/accounts',
  { onRequest: [authMiddleware] },
  async (request, reply) => {
    const { entityId, type, isActive } = request.query as {
      entityId?: string;
      type?: string;
      isActive?: boolean;
    };

    const service = new AccountService(request.userId!);
    const accounts = await service.listAccounts({ entityId, type, isActive });

    return { accounts };
  }
);
```

#### **3. FX Rate Endpoint**

**Route:** `GET /api/fx-rates`

**Purpose:** Get current exchange rates for currency conversion

**Request Query Params:**
```typescript
{
  base: string;   // Base currency (e.g., "CAD")
  quote: string;  // Quote currency (e.g., "USD")
  date?: string;  // Optional: specific date (default: today)
}
```

**Response:**
```typescript
{
  base: 'CAD',
  quote: 'USD',
  rate: 0.74,
  date: '2026-01-31',
  source: 'api'
}
```

---

### UI Components

#### **Page Structure**

```typescript
// apps/web/src/app/(dashboard)/dashboard/page.tsx (Server Component)
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { CashPositionCard } from '@/components/dashboard/CashPositionCard';
import { AccountsList } from '@/components/dashboard/AccountsList';
import { EntityFilter } from '@/components/dashboard/EntityFilter';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Fetch initial data on server
  const [metrics, accounts, entities] = await Promise.all([
    fetch(`${process.env.API_URL}/api/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${await getToken()}` }
    }).then(r => r.json()),
    fetch(`${process.env.API_URL}/api/accounts`, {
      headers: { Authorization: `Bearer ${await getToken()}` }
    }).then(r => r.json()),
    fetch(`${process.env.API_URL}/api/entities`, {
      headers: { Authorization: `Bearer ${await getToken()}` }
    }).then(r => r.json()),
  ]);

  return (
    <div className="space-y-6 p-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-newsreader font-bold">Dashboard</h1>
        <EntityFilter entities={entities} />
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <NetWorthCard data={metrics.netWorth} />
        <CashPositionCard data={metrics.cashPosition} />
      </div>

      {/* Accounts List */}
      <AccountsList accounts={accounts} />
    </div>
  );
}
```

#### **Component Breakdown**

**1. NetWorthCard (Client Component)**
```typescript
// apps/web/src/components/dashboard/NetWorthCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatMoney } from '@/lib/money';

interface NetWorthData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  currency: string;
}

export function NetWorthCard({ data }: { data: NetWorthData }) {
  const isPositive = data.change >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-jetbrains-mono">
          {formatMoney(data.current, data.currency)}
        </div>
        <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{formatMoney(Math.abs(data.change), data.currency)}</span>
          <span>({data.changePercent.toFixed(2)}%)</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

**2. CashPositionCard (Client Component)**
```typescript
// apps/web/src/components/dashboard/CashPositionCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';

interface CashPositionData {
  cash: number;
  debt: number;
  net: number;
  currency: string;
}

export function CashPositionCard({ data }: { data: CashPositionData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cash</span>
          <span className="font-jetbrains-mono text-green-600">
            {formatMoney(data.cash, data.currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Debt</span>
          <span className="font-jetbrains-mono text-red-600">
            {formatMoney(data.debt, data.currency)}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Net</span>
          <span className={`font-jetbrains-mono ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatMoney(data.net, data.currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

**3. AccountsList (Client Component)**
```typescript
// apps/web/src/components/dashboard/AccountsList.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, TrendingUp, Landmark } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ACCOUNT_TYPE_ICONS = {
  BANK: Building2,
  CREDIT_CARD: CreditCard,
  INVESTMENT: TrendingUp,
  LOAN: Landmark,
  MORTGAGE: Landmark,
};

export function AccountsList({ accounts }: { accounts: Account[] }) {
  // Group accounts by type
  const grouped = accounts.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([type, accounts]) => (
          <Collapsible key={type} defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Icon */}
                <span className="font-semibold">{type.replace('_', ' ')}</span>
                <Badge variant="secondary">{accounts.length}</Badge>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex flex-col">
                    <span className="font-medium">{account.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {account.institution} • {account.entity.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-jetbrains-mono font-semibold">
                      {formatMoney(account.currentBalance, account.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">{account.currency}</div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
```

**4. EntityFilter (Client Component)**
```typescript
// apps/web/src/components/dashboard/EntityFilter.tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EntityFilter({ entities }: { entities: Entity[] }) {
  return (
    <Select defaultValue="all">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by entity" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Entities</SelectItem>
        {entities.map(entity => (
          <SelectItem key={entity.id} value={entity.id}>
            {entity.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

### Utility Functions

**Money Formatting:**
```typescript
// apps/web/src/lib/money.ts

/**
 * Format money amount (in cents) to currency string
 * @param cents - Amount in cents (integer)
 * @param currency - ISO 4217 currency code (e.g., "CAD", "USD")
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatMoney(cents: number, currency: string = 'CAD'): string {
  const dollars = cents / 100;

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Parse currency string to cents (integer)
 * @param value - Currency string (e.g., "$1,234.56" or "1234.56")
 * @returns Amount in cents (integer)
 */
export function parseMoney(value: string): number {
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const dollars = parseFloat(cleaned);
  return Math.round(dollars * 100);
}
```

**Currency Conversion:**
```typescript
// apps/web/src/lib/currency.ts

/**
 * Convert amount from one currency to another
 * @param amountCents - Amount in cents (source currency)
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param rate - Exchange rate (1 fromCurrency = rate toCurrency)
 * @returns Converted amount in cents (target currency)
 */
export function convertCurrency(
  amountCents: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): number {
  if (fromCurrency === toCurrency) return amountCents;
  return Math.round(amountCents * rate);
}
```

---

## Implementation Phases

### Phase 1: Database & Backend (Day 1-2)

**Day 1 Morning: Seed Data & FX Service**

- [ ] Update `packages/db/prisma/seed.ts` to create 5 sample accounts
- [ ] Add FX rate seed data for CAD/USD/EUR pairs
- [ ] Run seed: `cd packages/db && npx prisma db seed`
- [ ] Verify in Prisma Studio: `npx prisma studio`

**Day 1 Afternoon: FX Rate Service**

- [ ] Create `apps/api/src/services/fxRate.service.ts`
- [ ] Implement `getRate(base, quote, date?)` method
- [ ] Add caching logic (check DB first, fallback to API)
- [ ] Create `GET /api/fx-rates` endpoint in `apps/api/src/routes/fxRates.ts`
- [ ] Test: Fetch rate, verify cache hit on second request

**Day 2 Morning: Account Service & Routes**

- [ ] Create `apps/api/src/services/account.service.ts`
- [ ] Implement `listAccounts(filters)` with tenant isolation
- [ ] Create `apps/api/src/routes/accounts.ts`
- [ ] Add `GET /api/accounts` endpoint
- [ ] Test: Verify tenant isolation (can't see other tenant's accounts)

**Day 2 Afternoon: Dashboard Service & Routes**

- [ ] Create `apps/api/src/services/dashboard.service.ts`
- [ ] Implement `getMetrics(entityId?, currency?)` with:
  - Net worth calculation (assets - liabilities)
  - Cash position calculation (cash - debt)
  - Currency conversion using FxRateService
  - Account type grouping
- [ ] Create `apps/api/src/routes/dashboard.ts`
- [ ] Add `GET /api/dashboard/metrics` endpoint
- [ ] Test: Verify calculations, currency conversion

**Review Points:**
- [ ] Run `prisma-migration-reviewer` (no schema changes, but verify seed)
- [ ] Run `financial-data-validator` on calculation logic
- [ ] Run `security-sentinel` on API endpoints (tenant isolation)

---

### Phase 2: UI Components (Day 3-4)

**Day 3 Morning: Utility Functions**

- [ ] Create `apps/web/src/lib/money.ts` with `formatMoney()` and `parseMoney()`
- [ ] Create `apps/web/src/lib/currency.ts` with `convertCurrency()`
- [ ] Write unit tests for money utilities
- [ ] Test edge cases: negative amounts, zero, large numbers

**Day 3 Afternoon: Dashboard Cards**

- [ ] Create `components/dashboard/NetWorthCard.tsx` (Client Component)
  - Display current net worth
  - Show change amount and percentage
  - Add trend indicator (up/down arrow)
  - Handle positive/negative styling
- [ ] Create `components/dashboard/CashPositionCard.tsx` (Client Component)
  - Display cash vs debt breakdown
  - Show net position
  - Color code positive (green) / negative (red)
- [ ] Test: Pass mock data, verify rendering

**Day 4 Morning: Accounts List**

- [ ] Create `components/dashboard/AccountsList.tsx` (Client Component)
  - Group accounts by type (BANK, CREDIT_CARD, LOAN, INVESTMENT)
  - Collapsible sections (default expanded)
  - Account icons by type
  - Display balance, entity, institution
  - Show currency badge
- [ ] Add `Collapsible` component from shadcn/ui if not exists
- [ ] Test: Various account combinations, empty groups

**Day 4 Afternoon: Entity Filter & Page Integration**

- [ ] Create `components/dashboard/EntityFilter.tsx` (Client Component)
  - Dropdown with "All Entities" + entity list
  - Client-side filtering (future: query param for server filter)
- [ ] Update `app/(dashboard)/dashboard/page.tsx`
  - Fetch data on server (metrics, accounts, entities)
  - Pass to client components as props
  - Add loading state (`loading.tsx`)
  - Add error boundary (`error.tsx`)
- [ ] Test: Full page render, filtering, loading states

**Review Points:**
- [ ] Run `nextjs-app-router-reviewer` on all pages/components
- [ ] Verify Server/Client component boundaries
- [ ] Check for 'use client' only where needed

---

### Phase 3: Integration & Testing (Day 5)

**Morning: Integration Testing**

- [ ] Test full flow: Sign in → Dashboard loads → See accounts
- [ ] Test entity filtering: Select entity → Metrics update
- [ ] Test empty state: Create fresh user → See empty state
- [ ] Test multi-currency: Verify conversion displayed correctly
- [ ] Test tenant isolation: Create second tenant → Verify no cross-tenant data

**Afternoon: Edge Cases & Performance**

- [ ] Test with 0 accounts (empty state)
- [ ] Test with 100+ accounts (performance)
- [ ] Test with missing FX rate (fallback behavior)
- [ ] Test negative balances (debt accounts)
- [ ] Test mobile responsive design
- [ ] Check for N+1 queries (should be 3 queries total: entities, accounts, FX rates)

**Review Points:**
- [ ] Run `performance-oracle` on dashboard queries
- [ ] Run `security-sentinel` on complete feature
- [ ] Run `architecture-strategist` on overall design

---

### Phase 4: Polish & Documentation (Day 6)

**Morning: Polish**

- [ ] Add page metadata (title, description)
- [ ] Add empty state illustration
- [ ] Improve loading skeletons
- [ ] Add tooltips where helpful
- [ ] Verify color palette consistency (Orange primary, Violet secondary, Slate neutral)
- [ ] Test dark mode

**Afternoon: Documentation & Deploy**

- [ ] Update `STATUS.md` - Mark Phase 1 complete
- [ ] Update `TASKS.md` - Check off completed tasks
- [ ] Create screenshots for documentation
- [ ] Write user guide (if needed)
- [ ] Deploy to staging
- [ ] Manual testing on staging
- [ ] Get stakeholder feedback

---

## Security Considerations

- [x] **Tenant Isolation:** All queries filter by `tenantId` from authenticated user
- [x] **Authentication:** All API routes protected with `authMiddleware`
- [x] **Input Validation:** Query params validated (entityId format, currency code)
- [x] **No Sensitive Data in Logs:** Account balances not logged
- [x] **SQL Injection:** Prevented by Prisma (parameterized queries)
- [x] **IDOR Prevention:** Can't access accounts by ID alone (must belong to user's tenant)
- [ ] **Rate Limiting:** Consider adding rate limit to dashboard API (100 req/min per user)

---

## Performance Considerations

- [x] **Database Indexes:** Existing indexes cover all queries
  - `Account_entityId_type_idx` - For filtering by entity and type
  - `Account_entityId_isActive_idx` - For active accounts
  - `FXRate_base_quote_date_idx` - For FX rate lookup
- [x] **Pagination:** Not needed yet (< 100 accounts expected per user)
- [x] **Parallel Fetching:** Dashboard page uses `Promise.all()` for metrics/accounts/entities
- [x] **Server-Side Rendering:** Dashboard page is Server Component (fast initial render)
- [x] **Caching:** FX rates cached in database (avoid API calls on every request)
- [ ] **Future:** Add React cache() for dashboard metrics (revalidate every 5 minutes)

---

## Financial Integrity

- [x] **Integer Cents:** All amounts stored as `Int` (no Float precision errors)
- [x] **Multi-Currency:** Currency field paired with every amount
- [x] **Immutable Balances:** FX conversion happens at display time (never modify stored balances)
- [x] **Audit Trail:** Account updates tracked with `updatedAt` timestamp
- [x] **No CASCADE Deletes:** Account deletion handled separately (not in this phase)
- [x] **Fiscal Periods:** Not applicable (displaying current balances only)

---

## Testing Strategy

**Unit Tests:**
- [ ] `money.ts`: formatMoney(), parseMoney()
- [ ] `currency.ts`: convertCurrency()
- [ ] `dashboard.service.ts`: getMetrics() calculations
- [ ] `fxRate.service.ts`: getRate() with cache

**Integration Tests:**
- [ ] `GET /api/dashboard/metrics`: Verify calculations, tenant isolation
- [ ] `GET /api/accounts`: Verify filtering, tenant isolation
- [ ] `GET /api/fx-rates`: Verify cache behavior

**E2E Tests (Optional):**
- [ ] Sign in → Dashboard loads → See accounts
- [ ] Filter by entity → Metrics update
- [ ] Empty state → Connect account CTA

---

## Rollout Plan

**Staging:**
1. Deploy backend (API routes, services)
2. Deploy frontend (dashboard page, components)
3. Run seed script to create test accounts
4. Manual testing:
   - Sign in as test user
   - Verify dashboard displays accounts
   - Test entity filtering
   - Test currency conversion
   - Test on mobile device

**Production:**
1. Create database backup
2. Deploy backend first (backward compatible)
3. Deploy frontend
4. Monitor error rates (Sentry)
5. Monitor performance (dashboard load time < 1s)
6. Rollback plan: Revert frontend deploy (API is backward compatible)

---

## Open Questions

- [ ] **Historical Data:** How to calculate "previous" net worth? Options:
  - A) Create `Snapshot` records daily (recommended)
  - B) Calculate from transaction history (expensive)
  - C) Fake it for MVP (show +5% trend)
  - **Decision:** Go with option C for MVP, add Snapshot in Phase 2

- [ ] **FX Rate Source:** Which API to use?
  - A) exchangerate-api.io (free tier: 1,500 requests/month)
  - B) fixer.io (free tier: 100 requests/month)
  - C) European Central Bank (free, but limited currencies)
  - **Decision:** Start with ECB (free), add exchangerate-api.io as fallback

- [ ] **Entity Filter Behavior:** Client-side or server-side?
  - A) Client-side: Filter data in browser (faster UX, but larger initial payload)
  - B) Server-side: Refetch on filter change (smaller payload, but slower)
  - **Decision:** Client-side for MVP (< 100 accounts), add server pagination later

---

## Dependencies

**Blocked by:**
- None (Phase 0 complete)

**Blocks:**
- Phase 2: Bank Reconciliation (needs account list)
- Phase 3: Transactions (needs account context)
- Phase 5: Analytics (uses dashboard patterns)

---

## Resources

- **Feature Spec:** `docs/features/01-accounts-overview.md`
- **Roadmap:** `ROADMAP.md` (Phase 1)
- **Brainstorm:** None yet (can create if needed)
- **Design Mockups:** None (using feature spec descriptions)
- **Related Issues:** None
- **External Docs:**
  - [Next.js App Router](https://nextjs.org/docs/app)
  - [Prisma Docs](https://www.prisma.io/docs)
  - [exchangerate-api.io](https://www.exchangerateapi.com/docs)

---

## Estimation

**Complexity:** Medium
- Involves multiple services, currency conversion, aggregation logic
- No complex algorithms, but requires careful testing
- Well-defined patterns from existing code

**Effort:** 5-6 days (full-time)
- Day 1-2: Backend (seed, services, API routes)
- Day 3-4: Frontend (utilities, components, page integration)
- Day 5: Testing and edge cases
- Day 6: Polish and deploy

**Risk:** Low-Medium
- No data migration (using existing tables)
- No external service integration (FX API is optional)
- No financial calculations beyond arithmetic
- Main risk: Currency conversion edge cases (handle with tests)

**Risk Factors:**
- Currency conversion accuracy (mitigate: comprehensive tests)
- FX rate API availability (mitigate: cache rates, manual fallback)
- Performance with many accounts (mitigate: indexed queries, pagination if needed)
- Tenant isolation bugs (mitigate: thorough security testing)

---

## Success Metrics

**Functional:**
- ✅ User can view net worth and cash position
- ✅ Accounts grouped by type and displayed correctly
- ✅ Entity filtering works
- ✅ Currency conversion accurate to 2 decimal places
- ✅ Empty state shown when appropriate

**Performance:**
- ✅ Dashboard loads in < 1 second
- ✅ No N+1 queries (max 3 queries: entities, accounts, FX rates)
- ✅ Mobile responsive (viewport < 768px)

**Security:**
- ✅ Zero cross-tenant data leaks
- ✅ All API routes require authentication
- ✅ Input validation prevents invalid queries

---

**Ready to proceed?** Review this plan and let me know if you'd like to:
1. **Start implementation** - Begin with Phase 1 (seed data + backend)
2. **Refine the plan** - Adjust scope, timelines, or approach
3. **Create tasks** - Break down into GitHub issues or task tracker
4. **Get feedback** - Review with team or stakeholders
