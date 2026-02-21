import {
  prisma,
  Prisma,
  type AccountType,
  type BankConnectionStatus,
  type BankFeedStatus,
} from '@akount/db';
import { env } from '../../../lib/env';
import { logger } from '../../../lib/logger';
import { createAuditLog } from '../../../lib/audit';
import { getDefaultGLAccountForType } from './account.service';

// ─── Flinks API Types ────────────────────────────────────────────────
// Based on Flinks Connect + GetAccountsDetail API responses

interface FlinksAccountDetail {
  Id: string;
  TransitNumber: string;
  InstitutionNumber: string;
  OverdraftLimit: number;
  Title: string;
  AccountNumber: string;
  Category: string; // e.g. "Operations", "Credits"
  Type: string;     // e.g. "Chequing", "Savings", "CreditCard", "Loan"
  Currency: string; // ISO code
  Balance: {
    Current: number;
    Available: number;
    Limit: number;
  };
  Holder: {
    Name: string;
    Email?: string;
  };
  Transactions?: FlinksTransaction[];
}

interface FlinksTransaction {
  Id: string;
  Date: string;
  Description: string;
  Debit?: number;
  Credit?: number;
  Balance: number;
  Code?: string;
}

interface FlinksGetAccountsResponse {
  Accounts: FlinksAccountDetail[];
  Login: {
    Id: string;
    Institution: string;
  };
  HttpStatusCode: number;
}

// ─── Type Mapping ────────────────────────────────────────────────────

const FLINKS_TYPE_MAP: Record<string, AccountType> = {
  chequing: 'BANK',
  savings: 'BANK',
  checking: 'BANK',
  creditcard: 'CREDIT_CARD',
  'credit card': 'CREDIT_CARD',
  credit: 'CREDIT_CARD',
  loan: 'LOAN',
  mortgage: 'MORTGAGE',
  investment: 'INVESTMENT',
  rrsp: 'INVESTMENT',
  tfsa: 'INVESTMENT',
  resp: 'INVESTMENT',
};

// ─── Utilities ───────────────────────────────────────────────────────

/**
 * Convert float dollar amount to integer cents.
 * Uses Math.round to handle floating-point precision (e.g., 0.1 + 0.2).
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Map Flinks account type string to Akount AccountType.
 */
export function mapFlinksAccountType(flinksType: string): AccountType {
  const normalized = flinksType.toLowerCase().trim();
  return FLINKS_TYPE_MAP[normalized] ?? 'OTHER';
}

/**
 * Strip PII from raw Flinks data before storing.
 * Keeps last 4 digits of account numbers, removes holder info.
 */
export function scrubPII(rawData: Record<string, unknown>): Record<string, unknown> {
  const scrubbed = { ...rawData };

  // Mask account numbers (keep last 4)
  if (typeof scrubbed.AccountNumber === 'string') {
    const acct = scrubbed.AccountNumber;
    scrubbed.AccountNumber = acct.length > 4 ? `****${acct.slice(-4)}` : '****';
  }

  // Remove transit/routing numbers
  delete scrubbed.TransitNumber;
  delete scrubbed.InstitutionNumber;

  // Remove holder PII
  if (scrubbed.Holder && typeof scrubbed.Holder === 'object') {
    scrubbed.Holder = { Name: '[REDACTED]' };
  }

  return scrubbed;
}

// ─── Demo Mode Data ──────────────────────────────────────────────────

const DEMO_ACCOUNTS: FlinksAccountDetail[] = [
  {
    Id: 'demo-chequing-001',
    TransitNumber: '12345',
    InstitutionNumber: '001',
    OverdraftLimit: 0,
    Title: 'Personal Chequing',
    AccountNumber: '1234567890',
    Category: 'Operations',
    Type: 'Chequing',
    Currency: 'CAD',
    Balance: { Current: 5432.10, Available: 5432.10, Limit: 0 },
    Holder: { Name: 'Demo User' },
    Transactions: [
      { Id: 'demo-txn-001', Date: new Date().toISOString(), Description: 'PAYROLL DEPOSIT', Credit: 3500.00, Balance: 5432.10 },
      { Id: 'demo-txn-002', Date: new Date(Date.now() - 86400000).toISOString(), Description: 'AMAZON.CA', Debit: 45.99, Balance: 1932.10 },
      { Id: 'demo-txn-003', Date: new Date(Date.now() - 172800000).toISOString(), Description: 'STARBUCKS #1234', Debit: 6.50, Balance: 1978.09 },
    ],
  },
  {
    Id: 'demo-savings-001',
    TransitNumber: '12345',
    InstitutionNumber: '001',
    OverdraftLimit: 0,
    Title: 'High Interest Savings',
    AccountNumber: '9876543210',
    Category: 'Operations',
    Type: 'Savings',
    Currency: 'CAD',
    Balance: { Current: 12500.00, Available: 12500.00, Limit: 0 },
    Holder: { Name: 'Demo User' },
    Transactions: [
      { Id: 'demo-txn-010', Date: new Date().toISOString(), Description: 'TRANSFER FROM CHEQUING', Credit: 500.00, Balance: 12500.00 },
      { Id: 'demo-txn-011', Date: new Date(Date.now() - 2592000000).toISOString(), Description: 'INTEREST PAYMENT', Credit: 12.50, Balance: 12000.00 },
    ],
  },
  {
    Id: 'demo-cc-001',
    TransitNumber: '',
    InstitutionNumber: '001',
    OverdraftLimit: 0,
    Title: 'Visa Infinite',
    AccountNumber: '4532000011112222',
    Category: 'Credits',
    Type: 'CreditCard',
    Currency: 'CAD',
    Balance: { Current: -1847.32, Available: 8152.68, Limit: 10000 },
    Holder: { Name: 'Demo User' },
    Transactions: [
      { Id: 'demo-txn-020', Date: new Date().toISOString(), Description: 'UBER EATS', Debit: 32.50, Balance: -1847.32 },
      { Id: 'demo-txn-021', Date: new Date(Date.now() - 86400000).toISOString(), Description: 'NETFLIX.COM', Debit: 22.99, Balance: -1814.82 },
    ],
  },
];

// ─── Service ─────────────────────────────────────────────────────────

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class FlinksService {
  constructor(private readonly tenantId: string) {}

  /**
   * Check if Flinks is configured for live API calls.
   * Returns false in dev/test without env vars (demo mode).
   */
  private isLiveMode(): boolean {
    return !!(
      env.FLINKS_INSTANCE &&
      env.FLINKS_CUSTOMER_ID &&
      env.FLINKS_SECRET &&
      env.FLINKS_API_URL
    );
  }

  /**
   * Get the Flinks Connect iframe URL for the frontend.
   * NEVER includes secret or customer ID in the URL.
   */
  getConnectUrl(): string {
    if (env.FLINKS_CONNECT_URL) {
      return env.FLINKS_CONNECT_URL;
    }
    // Demo mode fallback
    return 'https://toolbox-iframe.private.fin.ag/v2/';
  }

  /**
   * Process a new bank connection from Flinks Connect.
   *
   * Validate-first: calls GetAccountsDetail BEFORE creating BankConnection.
   * Idempotent: if loginId already exists for this entity, returns existing.
   *
   * @param loginId - The loginId returned from Flinks Connect iframe
   * @param entityId - The entity to attach the connection to
   * @param ctx - Tenant context for auth + audit
   * @returns Created/existing BankConnection with accounts and transaction counts
   */
  async processConnection(
    loginId: string,
    entityId: string,
    ctx: TenantContext,
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify entity belongs to tenant
      const entity = await tx.entity.findFirst({
        where: { id: entityId, tenantId: this.tenantId },
        select: { id: true, name: true, functionalCurrency: true },
      });
      if (!entity) {
        throw new FlinksError('Entity not found or access denied', 'ENTITY_NOT_FOUND', 404);
      }

      // 2. Idempotency check — existing connection with same loginId
      const existing = await tx.bankConnection.findFirst({
        where: {
          entityId,
          providerItemId: loginId,
          deletedAt: null,
        },
        include: {
          accounts: { where: { deletedAt: null }, select: { id: true, name: true, currentBalance: true, currency: true } },
          feedTxns: { where: { deletedAt: null }, select: { id: true } },
        },
      });
      if (existing) {
        return {
          connection: existing,
          accountCount: existing.accounts.length,
          transactionCount: existing.feedTxns.length,
          isExisting: true,
        };
      }

      // 3. Fetch account data from Flinks (or demo)
      const flinksData = await this.fetchAccountsDetail(loginId);

      // 4. Create BankConnection
      const connection = await tx.bankConnection.create({
        data: {
          entityId,
          provider: 'FLINKS',
          providerItemId: loginId,
          institutionId: flinksData.Login.Institution,
          institutionName: flinksData.Login.Institution,
          status: 'ACTIVE',
          lastSyncAt: new Date(),
        },
      });

      // 5. Create accounts + feed transactions
      let totalTransactions = 0;
      const createdAccounts: Array<{ id: string; name: string; currentBalance: number; currency: string }> = [];

      for (const flinksAccount of flinksData.Accounts) {
        const accountType = mapFlinksAccountType(flinksAccount.Type);
        const balanceCents = toCents(flinksAccount.Balance.Current);

        // Resolve GL account for this type
        const glAccountId = await getDefaultGLAccountForType(tx, entityId, accountType);

        // Currency mismatch warning
        if (entity.functionalCurrency && flinksAccount.Currency !== entity.functionalCurrency) {
          logger.warn(
            { entityId, entityCurrency: entity.functionalCurrency, accountCurrency: flinksAccount.Currency, accountName: flinksAccount.Title },
            'Flinks account currency differs from entity functional currency — skipping auto-JE posting'
          );
        }

        const account = await tx.account.create({
          data: {
            entityId,
            bankConnectionId: connection.id,
            name: flinksAccount.Title,
            type: accountType,
            institution: flinksData.Login.Institution,
            currency: flinksAccount.Currency,
            country: 'CA', // Flinks is Canada-only
            currentBalance: balanceCents,
            glAccountId,
          },
        });

        createdAccounts.push({
          id: account.id,
          name: account.name,
          currentBalance: account.currentBalance,
          currency: account.currency,
        });

        // Create BankFeedTransactions from Flinks transactions
        const flinksTransactions = flinksAccount.Transactions ?? [];
        for (const flinksTxn of flinksTransactions) {
          // Flinks uses Debit/Credit fields, normalize to signed amount
          // Debits are expenses (negative), Credits are income (positive)
          const amountCents = flinksTxn.Credit
            ? toCents(flinksTxn.Credit)
            : flinksTxn.Debit
              ? -toCents(flinksTxn.Debit)
              : 0;

          await tx.bankFeedTransaction.create({
            data: {
              bankConnectionId: connection.id,
              accountId: account.id,
              bankTransactionId: flinksTxn.Id,
              date: new Date(flinksTxn.Date),
              description: flinksTxn.Description,
              amount: amountCents,
              currency: flinksAccount.Currency,
              balance: flinksTxn.Balance != null ? toCents(flinksTxn.Balance) : null,
              rawData: scrubPII(flinksTxn as unknown as Record<string, unknown>) as Prisma.InputJsonValue,
              status: 'PENDING',
              statusHistory: [{ status: 'PENDING', timestamp: new Date().toISOString() }],
            },
          });
          totalTransactions++;
        }

        // Auto-post transactions (create Transaction records)
        await this.autoPostTransactions(tx, account.id, flinksAccount, flinksData.Login.Institution);
      }

      // 6. Audit logging
      await createAuditLog({
        tenantId: this.tenantId,
        userId: ctx.userId,
        entityId,
        model: 'BankConnection',
        recordId: connection.id,
        action: 'CREATE',
        after: {
          provider: 'FLINKS',
          institution: flinksData.Login.Institution,
          accountCount: createdAccounts.length,
          transactionCount: totalTransactions,
        },
      }, tx);

      return {
        connection: {
          ...connection,
          accounts: createdAccounts,
        },
        accountCount: createdAccounts.length,
        transactionCount: totalTransactions,
        isExisting: false,
      };
    });
  }

  /**
   * List connections for entity with tenant isolation.
   */
  async listConnections(entityId: string) {
    return prisma.bankConnection.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      include: {
        accounts: {
          where: { deletedAt: null },
          select: { id: true, name: true, currentBalance: true, currency: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Soft-delete a connection.
   */
  async disconnectConnection(connectionId: string) {
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
    });

    if (!connection) {
      return null;
    }

    return prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        status: 'DISCONNECTED',
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Refresh data for an existing connection.
   */
  async refreshConnection(connectionId: string, ctx: TenantContext) {
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: { accounts: { where: { deletedAt: null } } },
    });

    if (!connection) {
      return null;
    }

    // Rate limit: max 1 refresh per hour
    if (connection.lastSyncAt) {
      const hourAgo = new Date(Date.now() - 3600000);
      if (connection.lastSyncAt > hourAgo) {
        throw new FlinksError(
          'Connection was refreshed less than an hour ago',
          'RATE_LIMIT_EXCEEDED',
          429,
        );
      }
    }

    // Re-fetch from Flinks and update
    if (!connection.providerItemId) {
      throw new FlinksError('Connection has no provider item ID', 'INVALID_CONNECTION', 400);
    }

    const flinksData = await this.fetchAccountsDetail(connection.providerItemId);

    // Update lastSyncAt
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date(), errorMessage: null },
    });

    return {
      connection,
      accountCount: flinksData.Accounts.length,
      newTransactions: 0, // TODO: count new transactions from delta sync
    };
  }

  // ─── Private Methods ───────────────────────────────────────────────

  /**
   * Fetch account details from Flinks API or demo data.
   */
  private async fetchAccountsDetail(loginId: string): Promise<FlinksGetAccountsResponse> {
    if (!this.isLiveMode()) {
      // Demo mode: return mock data
      logger.info({ loginId }, 'Flinks demo mode — returning mock account data');
      return {
        Accounts: DEMO_ACCOUNTS,
        Login: { Id: loginId, Institution: 'Demo Bank' },
        HttpStatusCode: 200,
      };
    }

    // Live mode: call Flinks API
    const url = `${env.FLINKS_API_URL}/v3/Attributes/GetAccountsDetail`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        LoginId: loginId,
        MostRecentCached: true,
        WithTransactions: true,
        DaysOfTransactions: '90',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error({ loginId, status: response.status, body: errorText }, 'Flinks API error');
      throw new FlinksError(
        `Flinks API returned ${response.status}`,
        'FLINKS_API_ERROR',
        502,
      );
    }

    const data = (await response.json()) as FlinksGetAccountsResponse;

    if (!data.Accounts || data.Accounts.length === 0) {
      throw new FlinksError(
        'Flinks returned no accounts for this connection',
        'NO_ACCOUNTS',
        422,
      );
    }

    return data;
  }

  /**
   * Auto-post Flinks transactions as Transaction records.
   * Creates Transaction records with sourceType BANK_FEED.
   */
  private async autoPostTransactions(
    tx: Prisma.TransactionClient,
    accountId: string,
    flinksAccount: FlinksAccountDetail,
    institution: string,
  ) {
    const transactions = flinksAccount.Transactions ?? [];

    for (const flinksTxn of transactions) {
      const amountCents = flinksTxn.Credit
        ? toCents(flinksTxn.Credit)
        : flinksTxn.Debit
          ? -toCents(flinksTxn.Debit)
          : 0;

      await tx.transaction.create({
        data: {
          accountId,
          date: new Date(flinksTxn.Date),
          description: flinksTxn.Description,
          amount: amountCents,
          currency: flinksAccount.Currency,
          sourceType: 'BANK_FEED',
          sourceId: flinksTxn.Id,
        },
      });
    }
  }
}

// ─── Error Class ─────────────────────────────────────────────────────

export class FlinksError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FlinksError';
  }
}
