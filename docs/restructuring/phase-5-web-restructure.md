# Phase 5: Web Domain Restructure

**Days:** 9-14
**Status:** ✅ COMPLETE (2026-02-04)
**Dependencies:** Phase 1 must be complete, Phase 2 recommended
**Can Parallel With:** Phase 4 (API), Phase 6 (Docs)

---

## Objectives

1. Reorganize Next.js routes to match 8-domain structure
2. Implement dashboard layout with Sidebar + TopCommandBar
3. Create route groups for each domain
4. Integrate packages/ui/ components

---

## Tasks

### 5.1 Create Route Group Structure

**Reference:** `docs/design-system/05-governance/information-architecture.md`

- [ ] Create route group directories:
  ```bash
  cd apps/web/src/app

  # Auth routes (existing)
  mkdir -p "(auth)/{sign-in,sign-up}"

  # Dashboard routes (8 domains)
  mkdir -p "(dashboard)/overview/{net-worth,cash-flow}"
  mkdir -p "(dashboard)/banking/{accounts,transactions,reconciliation,transfers}"
  mkdir -p "(dashboard)/business/{clients,vendors,invoices,bills,payments}"
  mkdir -p "(dashboard)/accounting/{journal-entries,chart-of-accounts,assets,tax-rates,fiscal-periods}"
  mkdir -p "(dashboard)/planning/{reports,budgets,goals,forecasts}"
  mkdir -p "(dashboard)/ai-advisor/{policy-alerts,history}"
  mkdir -p "(dashboard)/services/{accountant,bookkeeping,documents}"
  mkdir -p "(dashboard)/system/{entities,integrations,rules,users,audit-log,security,settings}"

  # Onboarding
  mkdir -p onboarding
  ```

- [ ] Resulting structure:
  ```
  apps/web/src/app/
  ├── (auth)/
  │   ├── sign-in/[[...sign-in]]/page.tsx
  │   └── sign-up/[[...sign-up]]/page.tsx
  │
  ├── (dashboard)/
  │   ├── layout.tsx                    <- Main dashboard layout
  │   │
  │   ├── overview/                     <- DOMAIN 1
  │   │   ├── page.tsx                  <- /overview (dashboard)
  │   │   ├── net-worth/page.tsx
  │   │   └── cash-flow/page.tsx
  │   │
  │   ├── banking/               <- DOMAIN 2
  │   │   ├── accounts/
  │   │   │   ├── page.tsx              <- /banking/accounts
  │   │   │   └── [id]/page.tsx         <- /banking/accounts/:id
  │   │   ├── transactions/
  │   │   │   ├── page.tsx
  │   │   │   └── [id]/page.tsx
  │   │   ├── reconciliation/page.tsx
  │   │   └── transfers/page.tsx
  │   │
  │   ├── business/                     <- DOMAIN 3
  │   │   ├── clients/
  │   │   │   ├── page.tsx
  │   │   │   └── [id]/page.tsx
  │   │   ├── vendors/
  │   │   ├── invoices/
  │   │   │   ├── page.tsx
  │   │   │   ├── [id]/page.tsx
  │   │   │   └── new/page.tsx
  │   │   ├── bills/
  │   │   └── payments/
  │   │
  │   ├── accounting/                   <- DOMAIN 4
  │   │   ├── journal-entries/
  │   │   │   ├── page.tsx
  │   │   │   ├── [id]/page.tsx
  │   │   │   └── new/page.tsx
  │   │   ├── chart-of-accounts/page.tsx
  │   │   ├── assets/page.tsx
  │   │   ├── tax-rates/page.tsx
  │   │   └── fiscal-periods/page.tsx
  │   │
  │   ├── planning/                     <- DOMAIN 5
  │   │   ├── reports/page.tsx
  │   │   ├── budgets/page.tsx
  │   │   ├── goals/page.tsx
  │   │   └── forecasts/page.tsx
  │   │
  │   ├── ai-advisor/                   <- DOMAIN 6
  │   │   ├── page.tsx
  │   │   ├── policy-alerts/page.tsx
  │   │   └── history/page.tsx
  │   │
  │   ├── services/                     <- DOMAIN 7
  │   │   ├── accountant/page.tsx
  │   │   ├── bookkeeping/page.tsx
  │   │   └── documents/page.tsx
  │   │
  │   └── system/                       <- DOMAIN 8
  │       ├── entities/
  │       │   ├── page.tsx
  │       │   └── [id]/page.tsx
  │       ├── integrations/page.tsx
  │       ├── rules/page.tsx
  │       ├── users/page.tsx
  │       ├── audit-log/page.tsx
  │       ├── security/page.tsx
  │       └── settings/page.tsx
  │
  ├── onboarding/page.tsx
  ├── forbidden/page.tsx
  └── page.tsx                          <- Landing page
  ```

---

### 5.2 Create Dashboard Layout

- [ ] Create `apps/web/src/app/(dashboard)/layout.tsx`:
  ```typescript
  import { auth } from '@clerk/nextjs/server';
  import { redirect } from 'next/navigation';
  import { prisma } from '@akount/db';
  import { Sidebar, TopCommandBar } from '@akount/ui/patterns/navigation';
  import type { Role } from '@akount/types/rbac';

  export default async function DashboardLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      redirect('/sign-in');
    }

    // Get user's tenant and role
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        user: { clerkUserId: userId },
      },
      include: {
        tenant: true,
        user: true,
      },
    });

    if (!tenantUser) {
      redirect('/onboarding');
    }

    // Get entities for entity switcher
    const entities = await prisma.entity.findMany({
      where: {
        tenantId: tenantUser.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        countryCode: true,
        currency: true,
      },
      orderBy: { name: 'asc' },
    });

    return (
      <div className="min-h-screen bg-background">
        {/* Top Command Bar */}
        <TopCommandBar
          entities={entities}
          selectedEntityId={entities[0]?.id}
          user={{
            role: tenantUser.role as Role,
            name: tenantUser.user.name || tenantUser.user.email,
          }}
        />

        {/* Sidebar Navigation */}
        <Sidebar
          user={{ role: tenantUser.role as Role }}
        />

        {/* Main Content Area */}
        <main className="pl-60 pt-14">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }
  ```

---

### 5.3 Create Domain Pages

#### 5.3.1 Overview Domain

- [ ] Create `apps/web/src/app/(dashboard)/overview/page.tsx`:
  ```typescript
  import { auth } from '@clerk/nextjs/server';
  import { prisma } from '@akount/db';
  import { MoneyAmount, KPIIndicator } from '@akount/ui/financial';
  import type { Cents } from '@akount/types';

  export default async function DashboardPage() {
    const { userId } = await auth();

    // Fetch dashboard metrics
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { user: { clerkUserId: userId! } },
    });

    const metrics = await getDashboardMetrics(tenantUser!.tenantId);

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Total Cash"
            amount={metrics.totalCash}
            currency="CAD"
            trend={metrics.cashTrend}
          />
          <KPICard
            label="Accounts Receivable"
            amount={metrics.accountsReceivable}
            currency="CAD"
          />
          <KPICard
            label="Accounts Payable"
            amount={metrics.accountsPayable}
            currency="CAD"
          />
          <KPICard
            label="Net Worth"
            amount={metrics.netWorth}
            currency="CAD"
          />
        </div>

        {/* Recent Transactions */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">
            Recent Transactions
          </h2>
          {/* Transaction list */}
        </section>

        {/* AI Insights */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">
            AI Insights
          </h2>
          {/* Insight cards */}
        </section>
      </div>
    );
  }

  function KPICard({
    label,
    amount,
    currency,
    trend,
  }: {
    label: string;
    amount: Cents;
    currency: string;
    trend?: number;
  }) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-bold">
          <MoneyAmount amount={amount} currency={currency as any} />
        </p>
        {trend !== undefined && (
          <p className={trend >= 0 ? 'text-finance-income' : 'text-finance-expense'}>
            {trend >= 0 ? '+' : ''}{trend}%
          </p>
        )}
      </div>
    );
  }

  async function getDashboardMetrics(tenantId: string) {
    // Fetch metrics from API or directly from database
    // This is a placeholder
    return {
      totalCash: 1000000 as Cents,
      accountsReceivable: 500000 as Cents,
      accountsPayable: 250000 as Cents,
      netWorth: 2000000 as Cents,
      cashTrend: 5.2,
    };
  }
  ```

#### 5.3.2 Money Movement Domain

- [ ] Create `apps/web/src/app/(dashboard)/banking/accounts/page.tsx`:
  ```typescript
  import { auth } from '@clerk/nextjs/server';
  import { prisma } from '@akount/db';
  import { MoneyAmount, EntityBadge } from '@akount/ui/financial';
  import Link from 'next/link';

  export default async function AccountsPage() {
    const { userId } = await auth();

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { user: { clerkUserId: userId! } },
    });

    const accounts = await prisma.account.findMany({
      where: {
        tenantId: tenantUser!.tenantId,
        deletedAt: null,
      },
      include: {
        entity: true,
      },
      orderBy: { name: 'asc' },
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold">Accounts</h1>
          <Link
            href="/banking/accounts/new"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Add Account
          </Link>
        </div>

        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Account</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Entity</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-muted/25">
                  <td className="px-4 py-3">
                    <Link
                      href={`/banking/accounts/${account.id}`}
                      className="font-medium hover:underline"
                    >
                      {account.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <EntityBadge
                      name={account.entity.name}
                      countryCode={account.entity.countryCode}
                      currency={account.entity.currency as any}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {account.accountType}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MoneyAmount
                      amount={account.balance as any}
                      currency={account.entity.currency as any}
                      colorize
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  ```

#### 5.3.3 System Domain

- [ ] Create `apps/web/src/app/(dashboard)/system/audit-log/page.tsx`:
  ```typescript
  import { auth } from '@clerk/nextjs/server';
  import { prisma } from '@akount/db';
  import { canAccess } from '@akount/types/rbac';
  import { redirect } from 'next/navigation';

  export default async function AuditLogPage() {
    const { userId } = await auth();

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { user: { clerkUserId: userId! } },
    });

    // Double-check RBAC (middleware should catch this, but defense in depth)
    if (!canAccess('system:audit-log', tenantUser!.role as any, 'VIEW')) {
      redirect('/forbidden');
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: tenantUser!.tenantId,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return (
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold">Audit Log</h1>

        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Resource</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.user?.name || log.user?.email || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.resourceType}
                    {log.resourceId && ` #${log.resourceId.slice(0, 8)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  ```

---

### 5.4 Migration Steps

- [ ] **Step 1:** Create route group directories (done above)

- [ ] **Step 2:** Move existing pages to new locations:
  | Current Location | New Location |
  |------------------|--------------|
  | `app/dashboard/page.tsx` | `app/(dashboard)/overview/page.tsx` |
  | `app/accounts/page.tsx` | `app/(dashboard)/banking/accounts/page.tsx` |
  | `app/entities/page.tsx` | `app/(dashboard)/system/entities/page.tsx` |

- [ ] **Step 3:** Create dashboard layout with Sidebar + TopCommandBar

- [ ] **Step 4:** Update all internal links to use new paths

- [ ] **Step 5:** Add redirects for old paths (optional):
  ```typescript
  // next.config.js
  module.exports = {
    async redirects() {
      return [
        { source: '/dashboard', destination: '/overview', permanent: true },
        { source: '/accounts', destination: '/banking/accounts', permanent: true },
      ];
    },
  };
  ```

- [ ] **Step 6:** Test all routes

---

### 5.5 Create Placeholder Pages

For routes that don't have content yet, create placeholder pages:

- [ ] Create `apps/web/src/app/(dashboard)/[...slug]/page.tsx` (catch-all for unimplemented):
  ```typescript
  export default function PlaceholderPage({
    params,
  }: {
    params: { slug: string[] };
  }) {
    const path = params.slug.join('/');

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="font-heading text-2xl font-bold text-muted-foreground">
          Coming Soon
        </h1>
        <p className="mt-2 text-muted-foreground">
          The /{path} page is under development.
        </p>
      </div>
    );
  }
  ```

---

## Verification Checklist

Before marking Phase 5 complete:

- [ ] All 8 domain route groups created
- [ ] Dashboard layout implemented with Sidebar + TopCommandBar
- [ ] Layout fetches user role and entities correctly
- [ ] Overview page displays with KPI cards
- [ ] Accounts page displays account list
- [ ] Audit log page has RBAC protection
- [ ] Navigation works between all domains
- [ ] Old routes redirected or removed

**Test commands:**
```bash
pnpm --filter @akount/web dev
# Navigate to each domain in browser
# Test entity switcher
# Test as different roles
```

---

## Handoff

When complete:
- Full 8-domain navigation working
- Update status in `docs/restructuring/README.md` to ✅ COMPLETE
