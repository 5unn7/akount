import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FlinksService,
  FlinksError,
  toCents,
  mapFlinksAccountType,
  scrubPII,
} from '../flinks.service';

// ─── Mock Prisma ─────────────────────────────────────────────────────

const mockTxClient = {
  entity: { findFirst: vi.fn() },
  bankConnection: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  account: { create: vi.fn() },
  bankFeedTransaction: { create: vi.fn() },
  transaction: { create: vi.fn() },
  gLAccount: { findFirst: vi.fn() },
  auditLog: { findFirst: vi.fn(), create: vi.fn() },
};

vi.mock('@akount/db', () => ({
  prisma: {
    bankConnection: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((fn: (tx: typeof mockTxClient) => Promise<unknown>) => fn(mockTxClient)),
  },
}));

vi.mock('../../../../lib/env', () => ({
  env: {
    NODE_ENV: 'development',
    FLINKS_INSTANCE: undefined,
    FLINKS_CUSTOMER_ID: undefined,
    FLINKS_SECRET: undefined,
    FLINKS_CONNECT_URL: undefined,
    FLINKS_API_URL: undefined,
  },
}));

vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('../account.service', () => ({
  getDefaultGLAccountForType: vi.fn().mockResolvedValue('gl-1100'),
}));

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'entity-1';
const LOGIN_ID = '550e8400-e29b-41d4-a716-446655440000';

const CTX = {
  tenantId: TENANT_ID,
  userId: 'user-1',
  role: 'OWNER',
};

describe('FlinksService', () => {
  let service: FlinksService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: (tx: typeof mockTxClient) => Promise<unknown>) => fn(mockTxClient) as never
    );
    service = new FlinksService(TENANT_ID);
  });

  describe('processConnection', () => {
    it('should verify entity belongs to tenant before creating', async () => {
      vi.mocked(mockTxClient.entity.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        service.processConnection(LOGIN_ID, ENTITY_ID, CTX)
      ).rejects.toThrow('Entity not found or access denied');

      expect(mockTxClient.entity.findFirst).toHaveBeenCalledWith({
        where: { id: ENTITY_ID, tenantId: TENANT_ID },
        select: { id: true, name: true, currency: true },
      });
    });

    it('should return existing connection for duplicate loginId (idempotency)', async () => {
      const entity = { id: ENTITY_ID, name: 'Corp', currency: 'CAD' };
      vi.mocked(mockTxClient.entity.findFirst).mockResolvedValueOnce(entity as never);

      const existingConnection = {
        id: 'conn-existing',
        entityId: ENTITY_ID,
        providerItemId: LOGIN_ID,
        accounts: [{ id: 'acc-1', name: 'Chequing', currentBalance: 500000, currency: 'CAD' }],
        feedTxns: [{ id: 'ft-1' }, { id: 'ft-2' }],
      };
      vi.mocked(mockTxClient.bankConnection.findFirst).mockResolvedValueOnce(existingConnection as never);

      const result = await service.processConnection(LOGIN_ID, ENTITY_ID, CTX);

      expect(result.isExisting).toBe(true);
      expect(result.accountCount).toBe(1);
      expect(result.transactionCount).toBe(2);
    });

    it('should create connection with demo data in dev mode', async () => {
      const entity = { id: ENTITY_ID, name: 'Corp', currency: 'CAD' };
      vi.mocked(mockTxClient.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(mockTxClient.bankConnection.findFirst).mockResolvedValueOnce(null as never);

      const createdConnection = { id: 'conn-new', entityId: ENTITY_ID, provider: 'FLINKS', status: 'ACTIVE' };
      vi.mocked(mockTxClient.bankConnection.create).mockResolvedValueOnce(createdConnection as never);

      // Each demo account creates one account
      vi.mocked(mockTxClient.account.create)
        .mockResolvedValueOnce({ id: 'acc-1', name: 'Personal Chequing', currentBalance: 543210, currency: 'CAD' } as never)
        .mockResolvedValueOnce({ id: 'acc-2', name: 'High Interest Savings', currentBalance: 1250000, currency: 'CAD' } as never)
        .mockResolvedValueOnce({ id: 'acc-3', name: 'Visa Infinite', currentBalance: -184732, currency: 'CAD' } as never);

      // Feed transactions and posted transactions
      vi.mocked(mockTxClient.bankFeedTransaction.create).mockResolvedValue({} as never);
      vi.mocked(mockTxClient.transaction.create).mockResolvedValue({} as never);

      // Audit log mock
      vi.mocked(mockTxClient.auditLog.findFirst).mockResolvedValue(null as never);
      vi.mocked(mockTxClient.auditLog.create).mockResolvedValue({} as never);

      const result = await service.processConnection(LOGIN_ID, ENTITY_ID, CTX);

      expect(result.isExisting).toBe(false);
      expect(result.accountCount).toBe(3); // 3 demo accounts
      expect(result.transactionCount).toBeGreaterThan(0);

      // Verify accounts created with integer cents
      const accountCalls = vi.mocked(mockTxClient.account.create).mock.calls;
      expect(accountCalls.length).toBe(3);

      // Verify first account (Chequing: $5,432.10 = 543210 cents)
      expect(accountCalls[0][0].data.currentBalance).toBe(543210);
      expect(accountCalls[0][0].data.bankConnectionId).toBe('conn-new');
      expect(accountCalls[0][0].data.type).toBe('BANK');

      // Verify third account (Credit Card: -$1,847.32 = -184732 cents)
      expect(accountCalls[2][0].data.currentBalance).toBe(-184732);
      expect(accountCalls[2][0].data.type).toBe('CREDIT_CARD');
    });

    it('should create BankFeedTransactions with integer cents amounts', async () => {
      const entity = { id: ENTITY_ID, name: 'Corp', currency: 'CAD' };
      vi.mocked(mockTxClient.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(mockTxClient.bankConnection.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(mockTxClient.bankConnection.create).mockResolvedValueOnce({ id: 'conn-1' } as never);
      vi.mocked(mockTxClient.account.create).mockResolvedValue({ id: 'acc-1', name: 'Test', currentBalance: 0, currency: 'CAD' } as never);
      vi.mocked(mockTxClient.bankFeedTransaction.create).mockResolvedValue({} as never);
      vi.mocked(mockTxClient.transaction.create).mockResolvedValue({} as never);
      vi.mocked(mockTxClient.auditLog.findFirst).mockResolvedValue(null as never);
      vi.mocked(mockTxClient.auditLog.create).mockResolvedValue({} as never);

      await service.processConnection(LOGIN_ID, ENTITY_ID, CTX);

      // Check feed transaction amounts are integer cents
      const feedCalls = vi.mocked(mockTxClient.bankFeedTransaction.create).mock.calls;
      expect(feedCalls.length).toBeGreaterThan(0);

      for (const call of feedCalls) {
        const amount = call[0].data.amount;
        expect(Number.isInteger(amount)).toBe(true);
      }
    });

    it('should auto-post Transaction records from feed transactions', async () => {
      const entity = { id: ENTITY_ID, name: 'Corp', currency: 'CAD' };
      vi.mocked(mockTxClient.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(mockTxClient.bankConnection.findFirst).mockResolvedValueOnce(null as never);
      vi.mocked(mockTxClient.bankConnection.create).mockResolvedValueOnce({ id: 'conn-1' } as never);
      vi.mocked(mockTxClient.account.create).mockResolvedValue({ id: 'acc-1', name: 'Test', currentBalance: 0, currency: 'CAD' } as never);
      vi.mocked(mockTxClient.bankFeedTransaction.create).mockResolvedValue({} as never);
      vi.mocked(mockTxClient.transaction.create).mockResolvedValue({} as never);
      vi.mocked(mockTxClient.auditLog.findFirst).mockResolvedValue(null as never);
      vi.mocked(mockTxClient.auditLog.create).mockResolvedValue({} as never);

      await service.processConnection(LOGIN_ID, ENTITY_ID, CTX);

      const txnCalls = vi.mocked(mockTxClient.transaction.create).mock.calls;
      expect(txnCalls.length).toBeGreaterThan(0);

      // All auto-posted transactions should have sourceType BANK_FEED
      for (const call of txnCalls) {
        expect(call[0].data.sourceType).toBe('BANK_FEED');
        expect(Number.isInteger(call[0].data.amount)).toBe(true);
      }
    });
  });

  describe('listConnections', () => {
    it('should filter by entity and tenant', async () => {
      vi.mocked(prisma.bankConnection.findMany).mockResolvedValueOnce([] as never);

      await service.listConnections(ENTITY_ID);

      expect(prisma.bankConnection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            entityId: ENTITY_ID,
            entity: { tenantId: TENANT_ID },
            deletedAt: null,
          },
        })
      );
    });
  });

  describe('disconnectConnection', () => {
    it('should return null for non-existent connection', async () => {
      vi.mocked(prisma.bankConnection.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.disconnectConnection('conn-nonexistent');

      expect(result).toBeNull();
    });

    it('should set status DISCONNECTED and deletedAt', async () => {
      vi.mocked(prisma.bankConnection.findFirst).mockResolvedValueOnce({
        id: 'conn-1',
        entityId: ENTITY_ID,
      } as never);
      vi.mocked(prisma.bankConnection.update).mockResolvedValueOnce({
        id: 'conn-1',
        status: 'DISCONNECTED',
        deletedAt: new Date(),
      } as never);

      const result = await service.disconnectConnection('conn-1');

      expect(result).toBeTruthy();
      const updateCall = vi.mocked(prisma.bankConnection.update).mock.calls[0][0];
      expect(updateCall.data.status).toBe('DISCONNECTED');
      expect(updateCall.data.deletedAt).toBeTruthy();
    });
  });

  describe('refreshConnection', () => {
    it('should return null for non-existent connection', async () => {
      vi.mocked(prisma.bankConnection.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.refreshConnection('conn-nonexistent', CTX);

      expect(result).toBeNull();
    });

    it('should throw rate limit error if refreshed within an hour', async () => {
      vi.mocked(prisma.bankConnection.findFirst).mockResolvedValueOnce({
        id: 'conn-1',
        lastSyncAt: new Date(), // just now
        status: 'ACTIVE',
        providerItemId: LOGIN_ID,
        accounts: [],
      } as never);

      await expect(
        service.refreshConnection('conn-1', CTX)
      ).rejects.toThrow('Connection was refreshed less than an hour ago');
    });
  });
});

// ─── Pure Function Tests ─────────────────────────────────────────────

describe('toCents', () => {
  it('should convert whole dollars', () => {
    expect(toCents(100)).toBe(10000);
    expect(toCents(0)).toBe(0);
    expect(toCents(-50)).toBe(-5000);
  });

  it('should convert fractional amounts', () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.01)).toBe(1);
    expect(toCents(-5000.00)).toBe(-500000);
  });

  it('should handle floating-point precision edge cases', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in IEEE 754
    expect(toCents(0.1 + 0.2)).toBe(30);
    // 1.005 * 100 = 100.49999... in IEEE 754, rounds down to 100
    expect(toCents(1.005)).toBe(100);
  });
});

describe('mapFlinksAccountType', () => {
  it('should map common Flinks types to Akount AccountType', () => {
    expect(mapFlinksAccountType('Chequing')).toBe('BANK');
    expect(mapFlinksAccountType('Savings')).toBe('BANK');
    expect(mapFlinksAccountType('CreditCard')).toBe('CREDIT_CARD');
    expect(mapFlinksAccountType('Loan')).toBe('LOAN');
    expect(mapFlinksAccountType('Mortgage')).toBe('MORTGAGE');
    expect(mapFlinksAccountType('RRSP')).toBe('INVESTMENT');
    expect(mapFlinksAccountType('TFSA')).toBe('INVESTMENT');
  });

  it('should be case-insensitive', () => {
    expect(mapFlinksAccountType('CHEQUING')).toBe('BANK');
    expect(mapFlinksAccountType('creditcard')).toBe('CREDIT_CARD');
  });

  it('should return OTHER for unknown types', () => {
    expect(mapFlinksAccountType('SomethingNew')).toBe('OTHER');
    expect(mapFlinksAccountType('')).toBe('OTHER');
  });
});

describe('scrubPII', () => {
  it('should mask account numbers (keep last 4)', () => {
    const raw = { AccountNumber: '1234567890', Title: 'Checking' };
    const result = scrubPII(raw);

    expect(result.AccountNumber).toBe('****7890');
    expect(result.Title).toBe('Checking'); // non-PII preserved
  });

  it('should handle short account numbers', () => {
    const raw = { AccountNumber: '1234' };
    const result = scrubPII(raw);
    expect(result.AccountNumber).toBe('****');
  });

  it('should remove transit and institution numbers', () => {
    const raw = {
      TransitNumber: '12345',
      InstitutionNumber: '001',
      Title: 'Account',
    };
    const result = scrubPII(raw);

    expect(result.TransitNumber).toBeUndefined();
    expect(result.InstitutionNumber).toBeUndefined();
    expect(result.Title).toBe('Account');
  });

  it('should redact holder information', () => {
    const raw = {
      Holder: { Name: 'John Doe', Email: 'john@example.com' },
    };
    const result = scrubPII(raw);

    expect(result.Holder).toEqual({ Name: '[REDACTED]' });
  });

  it('should not modify non-PII fields', () => {
    const raw = {
      Id: 'txn-123',
      Amount: 1500,
      Description: 'PAYROLL',
    };
    const result = scrubPII(raw);

    expect(result.Id).toBe('txn-123');
    expect(result.Amount).toBe(1500);
    expect(result.Description).toBe('PAYROLL');
  });
});
