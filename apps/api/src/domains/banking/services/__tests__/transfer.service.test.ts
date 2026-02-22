import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferService } from '../transfer.service';
import { AccountingError } from '../../../accounting/errors';

// Mock audit - all mocks must be inline
vi.mock('../../../../lib/audit', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock Prisma - avoid top-level variable references
vi.mock('@akount/db', () => {
  return {
    prisma: {
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        // Create mock tx object
        const tx = {
          account: {
            findFirst: vi.fn(),
            update: vi.fn(),
          },
          journalEntry: {
            create: vi.fn(),
            update: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            updateMany: vi.fn(),
          },
          entity: {
            findFirst: vi.fn(),
          },
        };
        return callback(tx);
      }),
      entity: {
        findFirst: vi.fn(),
      },
      journalEntry: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    Prisma: {
      TransactionIsolationLevel: {
        Serializable: 'Serializable',
      },
    },
  };
});

import { prisma } from '@akount/db';
import { createAuditLog } from '../../../../lib/audit';

const TENANT_ID = 'tenant-123';
const USER_ID = 'user-456';
const ENTITY_ID = 'entity-789';

function mockAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'account-1',
    name: 'Checking Account',
    type: 'BANK',
    currency: 'CAD',
    currentBalance: 100000,
    glAccountId: 'gl-1010',
    entityId: ENTITY_ID,
    isActive: true,
    entity: {
      id: ENTITY_ID,
      functionalCurrency: 'CAD',
    },
    ...overrides,
  };
}

describe('TransferService', () => {
  let service: TransferService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TransferService(TENANT_ID, USER_ID);
    vi.mocked(createAuditLog).mockResolvedValue(undefined);
  });

  describe('createTransfer', () => {
    it('should create same-currency transfer with paired journal entries', async () => {
      const fromAcc = mockAccount({
        id: 'from-acc',
        name: 'Checking',
        glAccountId: 'gl-1010',
      });
      const toAcc = mockAccount({
        id: 'to-acc',
        name: 'Savings',
        glAccountId: 'gl-1020',
      });

      // Mock the transaction callback
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(fromAcc)
              .mockResolvedValueOnce(toAcc),
            update: vi.fn().mockResolvedValue({}),
          },
          journalEntry: {
            create: vi.fn()
              .mockResolvedValueOnce({ id: 'je-1', entityId: ENTITY_ID })
              .mockResolvedValueOnce({ id: 'je-2' }),
            update: vi.fn().mockResolvedValue({ id: 'je-1' }),
          },
        };
        return callback(tx);
      });

      const result = await service.createTransfer({
        fromAccountId: 'from-acc',
        toAccountId: 'to-acc',
        amount: 50000,
        currency: 'CAD',
      });

      expect(result).toMatchObject({
        entry1Id: 'je-1',
        entry2Id: 'je-2',
        amount: 50000,
        currency: 'CAD',
      });
    });

    it('should reject transfer when from account not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(null) // fromAccount not found
              .mockResolvedValueOnce(mockAccount()),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'invalid',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        })
      ).rejects.toThrow('From account not found');
    });

    it('should reject transfer when to account not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(mockAccount())
              .mockResolvedValueOnce(null), // toAccount not found
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'from-acc',
          toAccountId: 'invalid',
          amount: 50000,
          currency: 'CAD',
        })
      ).rejects.toThrow('To account not found');
    });

    it('should reject transfer when from account has no glAccountId', async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(mockAccount({ glAccountId: null }))
              .mockResolvedValueOnce(mockAccount({ id: 'to-acc' })),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        })
      ).rejects.toThrow('not linked to a GL account');
    });

    it('should reject cross-entity transfer', async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(mockAccount({ entityId: 'entity-1' }))
              .mockResolvedValueOnce(mockAccount({ entityId: 'entity-2' })),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        })
      ).rejects.toThrow('different entities');
    });

    it('should reject insufficient balance for regular accounts', async () => {
      const fromAcc = mockAccount({
        currentBalance: 10000, // $100.00
        type: 'BANK',
      });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(fromAcc)
              .mockResolvedValueOnce(mockAccount({ id: 'to-acc' })),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000, // $500.00 > $100.00
          currency: 'CAD',
        })
      ).rejects.toThrow('Insufficient balance');
    });

    it('should allow negative balance for credit cards', async () => {
      const creditCard = mockAccount({
        type: 'CREDIT_CARD',
        currentBalance: 10000,
      });
      const toAcc = mockAccount({ id: 'to-acc' });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(creditCard)
              .mockResolvedValueOnce(toAcc),
            update: vi.fn().mockResolvedValue({}),
          },
          journalEntry: {
            create: vi.fn()
              .mockResolvedValueOnce({ id: 'je-1', entityId: ENTITY_ID })
              .mockResolvedValueOnce({ id: 'je-2' }),
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        })
      ).resolves.toBeDefined();
    });

    it('should reject multi-currency transfer without exchange rate', async () => {
      const usdAccount = mockAccount({
        currency: 'USD',
        glAccountId: 'gl-usd',
      });
      const cadAccount = mockAccount({
        id: 'to-acc',
        currency: 'CAD',
        glAccountId: 'gl-cad',
      });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(usdAccount)
              .mockResolvedValueOnce(cadAccount),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'USD',
        })
      ).rejects.toThrow('requires exchange rate');
    });

    it('should reject currency mismatch', async () => {
      const fromAcc = mockAccount({ currency: 'CAD' });
      const toAcc = mockAccount({ id: 'to-acc', currency: 'CAD' });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          account: {
            findFirst: vi.fn()
              .mockResolvedValueOnce(fromAcc)
              .mockResolvedValueOnce(toAcc),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createTransfer({
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'USD', // Mismatch
        })
      ).rejects.toThrow('must match from account currency');
    });
  });

  describe('listTransfers', () => {
    it('should list transfers for entity with tenant filter', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce({ id: ENTITY_ID });
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
        {
          id: 'je-1',
          date: new Date('2024-01-15'),
          memo: 'Test transfer',
          sourceDocument: {},
          linkedEntryId: 'je-2',
          createdAt: new Date(),
          journalLines: [
            { debitAmount: 50000, creditAmount: 0, currency: 'CAD', glAccount: {} },
          ],
        } as any,
      ]);

      const result = await service.listTransfers({
        entityId: ENTITY_ID,
        limit: 50,
      });

      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0].amount).toBe(50000);
    });

    it('should reject access to other tenant entity', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null);

      await expect(
        service.listTransfers({ entityId: 'other-entity', limit: 50 })
      ).rejects.toThrow('Entity not found');
    });
  });

  describe('getTransfer', () => {
    it('should get single transfer with linked entry', async () => {
      vi.mocked(prisma.journalEntry.findFirst).mockResolvedValueOnce({
        id: 'je-1',
        entityId: ENTITY_ID,
        entryNumber: 'JE-001',
        date: new Date(),
        memo: 'Transfer',
        sourceDocument: {},
        linkedEntryId: 'je-2',
        status: 'POSTED',
        createdAt: new Date(),
        journalLines: [],
        linkedEntry: { id: 'je-2', entryNumber: 'JE-002' },
      } as any);

      const result = await service.getTransfer('je-1');

      expect(result.id).toBe('je-1');
      expect(result.linkedEntry).toBeDefined();
    });

    it('should return 404 when transfer not found', async () => {
      vi.mocked(prisma.journalEntry.findFirst).mockResolvedValueOnce(null);

      await expect(service.getTransfer('invalid')).rejects.toThrow(
        'Transfer not found'
      );
    });
  });

  describe('voidTransfer', () => {
    it('should void transfer and reverse account balances', async () => {
      const mockAccountUpdate = vi.fn().mockResolvedValue({});
      const mockUpdateMany = vi.fn().mockResolvedValue({ count: 2 });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          journalEntry: {
            findFirst: vi.fn().mockResolvedValueOnce({
              id: 'je-1',
              linkedEntryId: 'je-2',
              status: 'POSTED',
              entityId: ENTITY_ID,
              sourceDocument: {
                fromAccountId: 'from-acc',
                fromAccountName: 'Checking',
                toAccountId: 'to-acc',
                toAccountName: 'Savings',
                amount: 50000,
                currency: 'CAD',
              },
              journalLines: [
                { glAccountId: 'gl-1020', debitAmount: 50000, creditAmount: 0 },
                { glAccountId: 'gl-1010', debitAmount: 0, creditAmount: 50000 },
              ],
            }),
            updateMany: mockUpdateMany,
          },
          account: {
            update: mockAccountUpdate,
          },
        };
        return callback(tx);
      });

      const result = await service.voidTransfer('je-1');

      expect(result.voided).toBe(2);

      // Verify entries were voided
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ['je-1', 'je-2'] } },
        data: { status: 'VOIDED', updatedBy: USER_ID },
      });

      // Verify balance reversal: from account gets money back (increment)
      expect(mockAccountUpdate).toHaveBeenCalledWith({
        where: { id: 'from-acc' },
        data: { currentBalance: { increment: 50000 } },
      });

      // Verify balance reversal: to account loses money (decrement)
      expect(mockAccountUpdate).toHaveBeenCalledWith({
        where: { id: 'to-acc' },
        data: { currentBalance: { decrement: 50000 } },
      });

      // Verify audit log was called with balance info
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          details: expect.objectContaining({
            status: 'VOIDED',
            balanceReversed: true,
            fromAccountId: 'from-acc',
            toAccountId: 'to-acc',
            amount: 50000,
          }),
        }),
        expect.anything()
      );
    });

    it('should void multi-currency transfer with correct exchange rate', async () => {
      const mockAccountUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          journalEntry: {
            findFirst: vi.fn().mockResolvedValueOnce({
              id: 'je-1',
              linkedEntryId: 'je-2',
              status: 'POSTED',
              entityId: ENTITY_ID,
              sourceDocument: {
                fromAccountId: 'usd-acc',
                toAccountId: 'cad-acc',
                amount: 10000, // $100 USD
                currency: 'USD',
                exchangeRate: 1.35, // USD → CAD
              },
              journalLines: [],
            }),
            updateMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          account: {
            update: mockAccountUpdate,
          },
        };
        return callback(tx);
      });

      await service.voidTransfer('je-1');

      // From account: gets back original USD amount
      expect(mockAccountUpdate).toHaveBeenCalledWith({
        where: { id: 'usd-acc' },
        data: { currentBalance: { increment: 10000 } },
      });

      // To account: loses converted CAD amount (10000 * 1.35 = 13500)
      expect(mockAccountUpdate).toHaveBeenCalledWith({
        where: { id: 'cad-acc' },
        data: { currentBalance: { decrement: 13500 } },
      });
    });

    it('should reject void on already-voided transfer', async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          journalEntry: {
            findFirst: vi.fn().mockResolvedValueOnce({
              id: 'je-1',
              status: 'VOIDED',
              entityId: ENTITY_ID,
            }),
          },
        };
        return callback(tx);
      });

      await expect(service.voidTransfer('je-1')).rejects.toThrow(
        'Transfer is already voided'
      );
    });

    it('should return 404 when transfer not found for void', async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          journalEntry: {
            findFirst: vi.fn().mockResolvedValueOnce(null),
          },
        };
        return callback(tx);
      });

      await expect(service.voidTransfer('invalid')).rejects.toThrow(
        'Transfer not found'
      );
    });

    it('should reject void when sourceDocument is missing', async () => {
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        const tx = {
          journalEntry: {
            findFirst: vi.fn().mockResolvedValueOnce({
              id: 'je-1',
              linkedEntryId: 'je-2',
              status: 'POSTED',
              entityId: ENTITY_ID,
              sourceDocument: null,
              journalLines: [],
            }),
          },
        };
        return callback(tx);
      });

      await expect(service.voidTransfer('je-1')).rejects.toThrow(
        'source document is missing'
      );
    });
  });
});
