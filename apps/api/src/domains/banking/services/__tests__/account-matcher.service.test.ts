import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  matchAccountToBankConnection,
  findDuplicateAccounts,
  type ExternalAccountData,
} from '../account-matcher.service';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Mock normalizeInstitutionName from parser.service
vi.mock('../parser.service', () => ({
  normalizeInstitutionName: (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, ''),
}));

const ENTITY_ID = 'entity-123';

function mockAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc-1',
    entityId: ENTITY_ID,
    name: 'TD Checking 1234',
    type: 'BANK',
    currency: 'USD',
    currentBalance: 0,
    isActive: true,
    transactions: [],
    ...overrides,
  };
}

function mockBankConnection() {
  return {
    id: 'conn-1',
    tenantId: 'tenant-1',
    provider: 'PLAID',
    institutionId: 'ins-td',
    status: 'ACTIVE',
  };
}

describe('AccountMatcherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  describe('matchAccountToBankConnection', () => {
    describe('perfect matches (score 100)', () => {
      it('should match with currency + institution + type + mask', async () => {
        const account = mockAccount({
          name: 'TD Bank Checking 1234',
          currency: 'USD',
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const externalData: ExternalAccountData = {
          accountId: 'plaid-123',
          mask: '1234',
          institutionId: 'TD Bank',
          type: 'checking',
          currency: 'USD',
        };

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          externalData
        );

        expect(result.account?.id).toBe('acc-1');
        expect(result.confidence).toBe(100); // 30 + 20 + 15 + 35
        expect(result.reason).toContain('Currency match');
        expect(result.reason).toContain('Account name matches institution');
        expect(result.reason).toContain('Account type match');
        expect(result.reason).toContain('last 4: 1234');
      });
    });

    describe('high confidence matches (≥80)', () => {
      it('should match with currency + mask + institution (85)', async () => {
        const account = mockAccount({
          name: 'TD Account 5678',
          currency: 'CAD',
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const externalData: ExternalAccountData = {
          accountId: 'plaid-456',
          mask: '5678',
          institutionId: 'TD',
          type: 'savings', // Name doesn't contain "savings", so no type match
          currency: 'CAD',
        };

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          externalData
        );

        expect(result.confidence).toBe(85); // 30 + 20 + 35
      });
    });

    describe('medium confidence matches (50-79)', () => {
      it('should match with currency + institution + type (65)', async () => {
        const account = mockAccount({
          name: 'RBC Checking Account',
          currency: 'CAD',
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const externalData: ExternalAccountData = {
          accountId: 'plaid-789',
          mask: '9999', // Doesn't match
          institutionId: 'RBC',
          type: 'checking',
          currency: 'CAD',
        };

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          externalData
        );

        expect(result.confidence).toBe(65); // 30 + 20 + 15
      });

      it('should match with currency + mask (65)', async () => {
        const account = mockAccount({
          name: 'Business Account 4321',
          currency: 'USD',
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const externalData: ExternalAccountData = {
          accountId: 'plaid-999',
          mask: '4321',
          institutionId: 'Unknown Bank',
          type: 'checking',
          currency: 'USD',
        };

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          externalData
        );

        expect(result.confidence).toBe(65); // 30 + 35
      });
    });

    describe('low confidence matches (<50)', () => {
      it('should match currency only (30)', async () => {
        const account = mockAccount({
          name: 'My Account',
          currency: 'USD',
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const externalData: ExternalAccountData = {
          accountId: 'plaid-111',
          mask: '0000',
          institutionId: 'Other Bank',
          type: 'savings',
          currency: 'USD',
        };

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          externalData
        );

        expect(result.confidence).toBe(30); // Currency only
      });
    });

    describe('no match scenarios', () => {
      it('should return null when no accounts exist', async () => {
        mockPrisma.account.findMany.mockResolvedValueOnce([]);

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          {
            accountId: 'plaid-123',
            mask: '1234',
            institutionId: 'TD',
            type: 'checking',
            currency: 'USD',
          }
        );

        expect(result.account).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.reason).toBe('No existing accounts found for this entity');
      });

      it('should skip accounts with different currency', async () => {
        const account = mockAccount({
          name: 'TD Checking 1234',
          currency: 'CAD', // Different currency
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          {
            accountId: 'plaid-123',
            mask: '1234',
            institutionId: 'TD',
            type: 'checking',
            currency: 'USD', // USD, not CAD
          }
        );

        expect(result.account).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.reason).toBe('No matching account found');
      });
    });

    describe('multiple candidates scoring', () => {
      it('should choose account with highest score', async () => {
        const accounts = [
          mockAccount({
            id: 'acc-low',
            name: 'My Account',
            currency: 'USD',
          }), // Score: 30
          mockAccount({
            id: 'acc-high',
            name: 'TD Checking 1234',
            currency: 'USD',
          }), // Score: 100
          mockAccount({
            id: 'acc-medium',
            name: 'TD Savings',
            currency: 'USD',
          }), // Score: 50
        ];
        mockPrisma.account.findMany.mockResolvedValueOnce(accounts);

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          {
            accountId: 'plaid-123',
            mask: '1234',
            institutionId: 'TD',
            type: 'checking',
            currency: 'USD',
          }
        );

        expect(result.account?.id).toBe('acc-high');
        expect(result.confidence).toBe(100);
      });
    });

    describe('account type matching', () => {
      it('should match "checking" keyword', async () => {
        const account = mockAccount({
          name: 'Checking Account',
          currency: 'USD',
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          {
            accountId: 'plaid-123',
            mask: '0000',
            institutionId: 'Other',
            type: 'checking',
            currency: 'USD',
          }
        );

        expect(result.reason).toContain('Account type match');
      });

      it('should match "savings" keyword', async () => {
        const account = mockAccount({
          name: 'Savings Account',
          currency: 'USD',
        });
        mockPrisma.account.findMany.mockResolvedValueOnce([account]);

        const result = await matchAccountToBankConnection(
          ENTITY_ID,
          mockBankConnection() as never,
          {
            accountId: 'plaid-123',
            mask: '0000',
            institutionId: 'Other',
            type: 'savings',
            currency: 'USD',
          }
        );

        expect(result.reason).toContain('Account type match');
      });

      it('should match "credit" keywords (visa, mastercard, credit)', async () => {
        const accounts = [
          mockAccount({ name: 'Visa Card', currency: 'USD' }),
          mockAccount({ name: 'Mastercard', currency: 'USD' }),
          mockAccount({ name: 'Credit Card', currency: 'USD' }),
        ];

        for (const account of accounts) {
          mockPrisma.account.findMany.mockResolvedValueOnce([account]);

          const result = await matchAccountToBankConnection(
            ENTITY_ID,
            mockBankConnection() as never,
            {
              accountId: 'plaid-123',
              mask: '0000',
              institutionId: 'Other',
              type: 'credit',
              currency: 'USD',
            }
          );

          expect(result.reason).toContain('Account type match');
        }
      });
    });
  });

  describe('findDuplicateAccounts', () => {
    it('should find accounts with same currency', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', currency: 'USD', isActive: true }),
        mockAccount({ id: 'acc-2', currency: 'USD', isActive: true }),
      ];
      mockPrisma.account.findMany.mockResolvedValueOnce(accounts);

      const result = await findDuplicateAccounts(ENTITY_ID, { currency: 'USD' });

      expect(result).toHaveLength(2);
      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: {
          entityId: ENTITY_ID,
          currency: 'USD',
          isActive: true,
        },
      });
    });

    it('should filter by type when provided', async () => {
      const accounts = [
        mockAccount({ id: 'acc-1', currency: 'USD', type: 'BANK' }),
        mockAccount({ id: 'acc-2', currency: 'USD', type: 'CREDIT_CARD' }),
      ];
      mockPrisma.account.findMany.mockResolvedValueOnce(accounts);

      const result = await findDuplicateAccounts(ENTITY_ID, {
        currency: 'USD',
        type: 'BANK',
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('BANK');
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      const result = await findDuplicateAccounts(ENTITY_ID, { currency: 'EUR' });

      expect(result).toHaveLength(0);
    });

    it('should only return active accounts', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([]);

      await findDuplicateAccounts(ENTITY_ID, { currency: 'USD' });

      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true,
        }),
      });
    });
  });
});
