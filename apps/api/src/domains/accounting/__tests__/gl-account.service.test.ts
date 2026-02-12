import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GLAccountService } from '../services/gl-account.service';
import { AccountingError } from '../errors';
import { TENANT_ID, OTHER_TENANT_ID, USER_ID, ENTITY_ID, OTHER_ENTITY_ID, mockGLAccount, mockEntity } from './helpers';

// Mock Prisma
vi.mock('@akount/db', () => ({
  prisma: {
    entity: { findFirst: vi.fn() },
    gLAccount: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, opts: { code: string }) {
        super(message);
        this.code = opts.code;
      }
    },
  },
}));

vi.mock('../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

import { prisma, Prisma } from '@akount/db';

const mockEntityFind = prisma.entity.findFirst as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.gLAccount.findMany as ReturnType<typeof vi.fn>;
const mockFindFirst = prisma.gLAccount.findFirst as ReturnType<typeof vi.fn>;
const mockCreate = prisma.gLAccount.create as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.gLAccount.update as ReturnType<typeof vi.fn>;

describe('GLAccountService', () => {
  let service: GLAccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GLAccountService(TENANT_ID, USER_ID);
    // Default: entity belongs to tenant
    mockEntityFind.mockResolvedValue(mockEntity());
  });

  // ============================================================================
  // listAccounts
  // ============================================================================

  describe('listAccounts', () => {
    it('should list accounts for entity with tenant filter', async () => {
      const accounts = [mockGLAccount()];
      mockFindMany.mockResolvedValue(accounts);

      const result = await service.listAccounts({ entityId: ENTITY_ID });

      expect(result).toEqual(accounts);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityId: ENTITY_ID,
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });

    it('should filter by type', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.listAccounts({ entityId: ENTITY_ID, type: 'ASSET' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'ASSET' }),
        })
      );
    });

    it('should filter by isActive', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.listAccounts({ entityId: ENTITY_ID, isActive: true });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should support search by name or code', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.listAccounts({ entityId: ENTITY_ID, search: 'Cash' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Cash', mode: 'insensitive' } }),
              expect.objectContaining({ code: { contains: 'Cash' } }),
            ]),
          }),
        })
      );
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockEntityFind.mockResolvedValue(null);

      await expect(service.listAccounts({ entityId: OTHER_ENTITY_ID }))
        .rejects.toThrow(AccountingError);
    });
  });

  // ============================================================================
  // getAccount
  // ============================================================================

  describe('getAccount', () => {
    it('should return account with tenant filter', async () => {
      const account = mockGLAccount();
      mockFindFirst.mockResolvedValue(account);

      const result = await service.getAccount('gl-acct-1');

      expect(result).toEqual(account);
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'gl-acct-1',
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });

    it('should throw GL_ACCOUNT_NOT_FOUND when not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(service.getAccount('nonexistent'))
        .rejects.toThrow(AccountingError);

      try {
        await service.getAccount('nonexistent');
      } catch (error) {
        expect(error).toBeInstanceOf(AccountingError);
        expect((error as AccountingError).code).toBe('GL_ACCOUNT_NOT_FOUND');
        expect((error as AccountingError).statusCode).toBe(404);
      }
    });
  });

  // ============================================================================
  // createAccount
  // ============================================================================

  describe('createAccount', () => {
    const createData = {
      entityId: ENTITY_ID,
      code: '1100',
      name: 'Bank Account',
      type: 'ASSET' as const,
      normalBalance: 'DEBIT' as const,
    };

    it('should create account with tenant validation', async () => {
      const created = mockGLAccount({ code: '1100', name: 'Bank Account' });
      mockCreate.mockResolvedValue(created);

      const result = await service.createAccount(createData);

      expect(result).toEqual(created);
      expect(mockEntityFind).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityId: ENTITY_ID,
            code: '1100',
            name: 'Bank Account',
          }),
        })
      );
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockEntityFind.mockResolvedValue(null);

      await expect(service.createAccount(createData))
        .rejects.toThrow(AccountingError);

      try {
        mockEntityFind.mockResolvedValue(null);
        await service.createAccount(createData);
      } catch (error) {
        expect((error as AccountingError).code).toBe('ENTITY_NOT_FOUND');
      }
    });

    it('should validate parent account belongs to same entity', async () => {
      mockFindFirst.mockResolvedValue(null); // Parent not found in same entity

      await expect(
        service.createAccount({ ...createData, parentAccountId: 'parent-from-other-entity' })
      ).rejects.toThrow(AccountingError);

      try {
        mockFindFirst.mockResolvedValue(null);
        await service.createAccount({ ...createData, parentAccountId: 'parent-from-other-entity' });
      } catch (error) {
        expect((error as AccountingError).code).toBe('CROSS_ENTITY_REFERENCE');
        expect((error as AccountingError).statusCode).toBe(403);
      }
    });

    it('should allow parent account from same entity', async () => {
      const parent = mockGLAccount({ id: 'parent-1' });
      mockFindFirst.mockResolvedValue(parent); // Parent found in same entity
      mockCreate.mockResolvedValue(mockGLAccount({ parentAccountId: 'parent-1' }));

      const result = await service.createAccount({ ...createData, parentAccountId: 'parent-1' });

      expect(result).toBeDefined();
    });

    it('should throw DUPLICATE_ACCOUNT_CODE on P2002', async () => {
      const p2002Error = new (Prisma as any).PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002' }
      );
      mockCreate.mockRejectedValue(p2002Error);

      await expect(service.createAccount(createData))
        .rejects.toThrow(AccountingError);

      try {
        mockCreate.mockRejectedValue(p2002Error);
        await service.createAccount(createData);
      } catch (error) {
        expect((error as AccountingError).code).toBe('DUPLICATE_ACCOUNT_CODE');
        expect((error as AccountingError).statusCode).toBe(409);
      }
    });
  });

  // ============================================================================
  // updateAccount
  // ============================================================================

  describe('updateAccount', () => {
    it('should update account with tenant filter', async () => {
      const existing = mockGLAccount();
      mockFindFirst.mockResolvedValue(existing);
      const updated = mockGLAccount({ name: 'Updated Cash' });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateAccount('gl-acct-1', { name: 'Updated Cash' });

      expect(result.name).toBe('Updated Cash');
    });

    it('should throw GL_ACCOUNT_NOT_FOUND when not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(service.updateAccount('nonexistent', { name: 'X' }))
        .rejects.toThrow(AccountingError);
    });

    it('should validate parent from same entity on update', async () => {
      const existing = mockGLAccount();
      // First call returns existing account, second returns null for parent lookup
      mockFindFirst
        .mockResolvedValueOnce(existing) // getAccount
        .mockResolvedValueOnce(null);     // parent validation

      await expect(
        service.updateAccount('gl-acct-1', { parentAccountId: 'parent-other-entity' })
      ).rejects.toThrow(AccountingError);
    });
  });

  // ============================================================================
  // deactivateAccount
  // ============================================================================

  describe('deactivateAccount', () => {
    it('should deactivate account with no draft journal lines', async () => {
      const existing = mockGLAccount({ _count: { journalLines: 0 } });
      mockFindFirst.mockResolvedValue(existing);
      mockUpdate.mockResolvedValue(mockGLAccount({ isActive: false }));

      const result = await service.deactivateAccount('gl-acct-1');

      expect(result.isActive).toBe(false);
    });

    it('should throw GL_ACCOUNT_NOT_FOUND when not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(service.deactivateAccount('nonexistent'))
        .rejects.toThrow(AccountingError);
    });

    it('should block deactivation when DRAFT journal lines exist', async () => {
      const existing = mockGLAccount({ _count: { journalLines: 3 } });
      mockFindFirst.mockResolvedValue(existing);

      await expect(service.deactivateAccount('gl-acct-1'))
        .rejects.toThrow(AccountingError);

      try {
        mockFindFirst.mockResolvedValue(existing);
        await service.deactivateAccount('gl-acct-1');
      } catch (error) {
        expect((error as AccountingError).code).toBe('GL_ACCOUNT_INACTIVE');
        expect((error as AccountingError).statusCode).toBe(400);
      }
    });
  });

  // ============================================================================
  // getAccountTree
  // ============================================================================

  describe('getAccountTree', () => {
    it('should return hierarchical tree', async () => {
      const accounts = [
        mockGLAccount({ id: 'root-1', code: '1000', parentAccountId: null }),
        mockGLAccount({ id: 'child-1', code: '1010', parentAccountId: 'root-1' }),
      ];
      mockFindMany.mockResolvedValue(accounts);

      const tree = await service.getAccountTree(ENTITY_ID);

      expect(tree).toHaveLength(1); // 1 root
      expect(tree[0].children).toHaveLength(1); // 1 child
      expect(tree[0].children[0].code).toBe('1010');
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockEntityFind.mockResolvedValue(null);

      await expect(service.getAccountTree(OTHER_ENTITY_ID))
        .rejects.toThrow(AccountingError);
    });
  });

  // ============================================================================
  // getAccountBalances
  // ============================================================================

  describe('getAccountBalances', () => {
    it('should calculate balances from posted journal lines', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'gl-1',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          journalLines: [
            { debitAmount: 1000, creditAmount: 0 },
            { debitAmount: 500, creditAmount: 0 },
            { debitAmount: 0, creditAmount: 200 },
          ],
        },
      ]);

      const balances = await service.getAccountBalances(ENTITY_ID);

      expect(balances).toHaveLength(1);
      expect(balances[0].totalDebits).toBe(1500);
      expect(balances[0].totalCredits).toBe(200);
      // DEBIT normal balance: debits - credits = 1300
      expect(balances[0].balance).toBe(1300);
    });

    it('should calculate CREDIT normal balance correctly', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'gl-2',
          code: '4000',
          name: 'Revenue',
          type: 'INCOME',
          normalBalance: 'CREDIT',
          journalLines: [
            { debitAmount: 0, creditAmount: 5000 },
            { debitAmount: 100, creditAmount: 0 },
          ],
        },
      ]);

      const balances = await service.getAccountBalances(ENTITY_ID);

      // CREDIT normal balance: credits - debits = 4900
      expect(balances[0].balance).toBe(4900);
    });

    it('should reject if entity does not belong to tenant', async () => {
      mockEntityFind.mockResolvedValue(null);

      await expect(service.getAccountBalances(OTHER_ENTITY_ID))
        .rejects.toThrow(AccountingError);
    });
  });
});
