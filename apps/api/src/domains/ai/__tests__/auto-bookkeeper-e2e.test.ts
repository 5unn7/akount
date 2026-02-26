import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assertIntegerCents,
  assertMoneyFields,
} from '../../../test-utils/financial-assertions';

// ---------------------------------------------------------------------------
// Mocks — Prisma
// ---------------------------------------------------------------------------

const mockJECreate = vi.fn();
const mockJEFindFirst = vi.fn();
const mockJEUpdate = vi.fn();
const mockJECount = vi.fn();
const mockJEGroupBy = vi.fn();
const mockJEFindMany = vi.fn();

const mockTxnUpdate = vi.fn();
const mockTxnUpdateMany = vi.fn();
const mockTxnFindFirst = vi.fn();

const mockAccountFindMany = vi.fn();
const mockGLFindFirst = vi.fn();
const mockGLFindMany = vi.fn();

const mockCategoryFindMany = vi.fn();
const mockCategoryFindFirst = vi.fn();

const mockAIActionCreate = vi.fn();
const mockAIActionFindFirst = vi.fn();
const mockAIActionUpdate = vi.fn();
const mockAIActionCount = vi.fn();
const mockAIActionGroupBy = vi.fn();
const mockAIActionFindMany = vi.fn();
const mockAIActionUpdateMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    journalEntry: {
      create: (...args: unknown[]) => mockJECreate(...args),
      findFirst: (...args: unknown[]) => mockJEFindFirst(...args),
      update: (...args: unknown[]) => mockJEUpdate(...args),
      findMany: (...args: unknown[]) => mockJEFindMany(...args),
      count: (...args: unknown[]) => mockJECount(...args),
    },
    transaction: {
      update: (...args: unknown[]) => mockTxnUpdate(...args),
      updateMany: (...args: unknown[]) => mockTxnUpdateMany(...args),
      findFirst: (...args: unknown[]) => mockTxnFindFirst(...args),
    },
    account: {
      findMany: (...args: unknown[]) => mockAccountFindMany(...args),
    },
    gLAccount: {
      findFirst: (...args: unknown[]) => mockGLFindFirst(...args),
      findMany: (...args: unknown[]) => mockGLFindMany(...args),
    },
    category: {
      findMany: (...args: unknown[]) => mockCategoryFindMany(...args),
      findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args),
    },
    aIAction: {
      create: (...args: unknown[]) => mockAIActionCreate(...args),
      findFirst: (...args: unknown[]) => mockAIActionFindFirst(...args),
      update: (...args: unknown[]) => mockAIActionUpdate(...args),
      findMany: (...args: unknown[]) => mockAIActionFindMany(...args),
      count: (...args: unknown[]) => mockAIActionCount(...args),
      groupBy: (...args: unknown[]) => mockAIActionGroupBy(...args),
      updateMany: (...args: unknown[]) => mockAIActionUpdateMany(...args),
    },
  },
  Prisma: {},
}));

// ---------------------------------------------------------------------------
// Mocks — External Services
// ---------------------------------------------------------------------------

const mockApproveEntry = vi.fn();
vi.mock('../../accounting/services/journal-entry.service', () => ({
  JournalEntryService: function (this: Record<string, unknown>) {
    this.approveEntry = mockApproveEntry;
  },
}));

vi.mock('../services/ai.service', () => ({
  aiService: {
    chat: vi.fn().mockResolvedValue({ content: 'Office Supplies' }),
    isProviderAvailable: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

let entryNumberCounter = 0;
vi.mock('../../accounting/utils/entry-number', () => ({
  generateEntryNumber: vi.fn().mockImplementation(() => {
    entryNumberCounter++;
    return `JE-${String(entryNumberCounter).padStart(3, '0')}`;
  }),
}));

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-e2e-test-123';
const TENANT_ID_OTHER = 'tenant-other-456';
const ENTITY_ID = 'cltest00000000000e2eentity';
const USER_ID = 'user-e2e-bookkeeper';
const APPROVER_ID = 'user-e2e-approver';
const BANK_ACCOUNT_ID = 'cltest0000000000e2eaccount';

// GL Account IDs (keyed by COA code)
const GL_BANK = { id: 'cltest00000000000e2egl1100', code: '1100' }; // Bank Account
const GL_OFFICE = { id: 'cltest00000000000e2egl5400', code: '5400' }; // Office Supplies
const GL_REVENUE = { id: 'cltest00000000000e2egl4000', code: '4000' }; // Service Revenue
const GL_FALLBACK_EXP = { id: 'cltest00000000000e2egl5990', code: '5990' }; // Other Expenses
const GL_FALLBACK_INC = { id: 'cltest00000000000e2egl4300', code: '4300' }; // Other Income

// Category IDs
const OFFICE_CAT_ID = 'cltest000000000e2ecatoffc';
const REVENUE_CAT_ID = 'cltest000000000e2ecatrevn';

const JE_ID_1 = 'cltest0000000000e2eje0001';
const JE_ID_2 = 'cltest0000000000e2eje0002';
const ACTION_ID_1 = 'cltest000000000e2eaction1';
const ACTION_ID_2 = 'cltest000000000e2eaction2';
const TXN_ID_EXPENSE = 'cltest0000000000e2etxn001';
const TXN_ID_INCOME = 'cltest0000000000e2etxn002';
const TXN_ID_TRANSFER = 'cltest0000000000e2etxn003';

// Transaction seeds — descriptions match KEYWORD_PATTERNS exactly
const EXPENSE_TRANSACTION = {
  transactionId: TXN_ID_EXPENSE,
  description: 'STAPLES OFFICE SUPPLIES', // Matches keyword "staples" → "Office Supplies" (expense)
  amount: -4250, // -$42.50 (expense)
  currency: 'CAD',
  date: new Date('2026-02-20'),
  sourceType: 'BANK_FEED',
  accountId: BANK_ACCOUNT_ID,
};

const INCOME_TRANSACTION = {
  transactionId: TXN_ID_INCOME,
  description: 'STRIPE PAYMENT DEPOSIT', // Matches keyword "stripe" → "Sales Revenue" (income)
  amount: 150000, // $1,500.00 (income)
  currency: 'CAD',
  date: new Date('2026-02-21'),
  sourceType: 'BANK_FEED',
  accountId: BANK_ACCOUNT_ID,
};

const TRANSFER_TRANSACTION = {
  transactionId: TXN_ID_TRANSFER,
  description: 'INTERAC E-TRANSFER',
  amount: -10000,
  currency: 'CAD',
  date: new Date('2026-02-22'),
  sourceType: 'TRANSFER',
  accountId: BANK_ACCOUNT_ID,
};

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { JESuggestionService } from '../services/je-suggestion.service';
import { AIActionService } from '../services/ai-action.service';
import { ActionExecutorService } from '../services/action-executor.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set up standard mock responses for the happy path.
 *
 * categorizeBatch needs:
 *   - category.findMany → { id, name, defaultGLAccountId } matching KEYWORD_PATTERNS names
 *   - gLAccount.findMany → { id, code } for COA codes from CATEGORY_TO_COA_CODE
 *
 * resolveBankGLAccounts needs:
 *   - account.findMany → { id, glAccountId, glAccount: { id, code } }
 */
function setupHappyPathMocks() {
  // Bank account linked to GL code '1100'
  mockAccountFindMany.mockResolvedValue([
    {
      id: BANK_ACCOUNT_ID,
      glAccountId: GL_BANK.id,
      glAccount: GL_BANK,
    },
  ]);

  // Categories matching KEYWORD_PATTERNS category names
  // categorizeBatch: select: { id, name, defaultGLAccountId }
  mockCategoryFindMany.mockResolvedValue([
    { id: OFFICE_CAT_ID, name: 'Office Supplies', defaultGLAccountId: null },
    { id: REVENUE_CAT_ID, name: 'Sales Revenue', defaultGLAccountId: null },
  ]);

  // GL accounts keyed by COA code (used by resolveGLFromMaps)
  // Office Supplies → '5400', Sales Revenue → '4000', fallbacks → '5990', '4300'
  mockGLFindMany.mockResolvedValue([
    GL_BANK,
    GL_OFFICE,
    GL_REVENUE,
    GL_FALLBACK_EXP,
    GL_FALLBACK_INC,
  ]);

  // $transaction mock: execute the callback with a tx client
  mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
    const txClient = {
      journalEntry: {
        create: mockJECreate,
        findFirst: mockJEFindFirst,
        findMany: mockJEFindMany,
      },
      transaction: {
        update: mockTxnUpdate,
      },
    };
    return cb(txClient);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auto-Bookkeeper E2E Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entryNumberCounter = 0;
  });

  // -------------------------------------------------------------------------
  // Test 1: Full pipeline — categorize → draft JEs → approve → posted
  // -------------------------------------------------------------------------
  describe('full pipeline: categorize → draft → approve → posted', () => {
    it('should process expense and income transactions end-to-end', async () => {
      setupHappyPathMocks();

      // Step 1: Suggest batch — categorize and build JE suggestions
      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const batchResult = await jeService.suggestBatch([
        EXPENSE_TRANSACTION,
        INCOME_TRANSACTION,
        TRANSFER_TRANSACTION, // Should be skipped
      ]);

      // Verify: 2 suggestions generated, 1 skipped (transfer)
      expect(batchResult.suggestions).toHaveLength(2);
      expect(batchResult.skipped).toHaveLength(1);
      expect(batchResult.skipped[0].transactionId).toBe(TXN_ID_TRANSFER);
      expect(batchResult.skipped[0].reason).toContain('Transfer');

      // Verify summary counts
      expect(batchResult.summary.total).toBe(3);
      expect(batchResult.summary.suggested).toBe(2);
      expect(batchResult.summary.skipped).toBe(1);

      // Verify expense suggestion — balanced JE with integer cents
      const expenseSugg = batchResult.suggestions.find(
        (s) => s.transactionId === TXN_ID_EXPENSE
      )!;
      expect(expenseSugg).toBeTruthy();
      expect(expenseSugg.status).toBe('DRAFT');
      expect(expenseSugg.sourceType).toBe('AI_SUGGESTION');
      expect(expenseSugg.lines).toHaveLength(2);

      // Financial invariant: integer cents
      for (const line of expenseSugg.lines) {
        assertIntegerCents(line.debitAmount, 'debitAmount');
        assertIntegerCents(line.creditAmount, 'creditAmount');
      }

      // Financial invariant: balanced (debits = credits)
      const expenseDebits = expenseSugg.lines.reduce((s, l) => s + l.debitAmount, 0);
      const expenseCredits = expenseSugg.lines.reduce((s, l) => s + l.creditAmount, 0);
      expect(expenseDebits).toBe(expenseCredits);
      expect(expenseDebits).toBe(4250); // |−$42.50| = 4250 cents

      // Expense: DR Expense GL (5400), CR Bank GL (1100)
      expect(expenseSugg.lines[0].glAccountCode).toBe('5400');
      expect(expenseSugg.lines[0].debitAmount).toBe(4250);
      expect(expenseSugg.lines[0].creditAmount).toBe(0);
      expect(expenseSugg.lines[1].glAccountCode).toBe('1100');
      expect(expenseSugg.lines[1].debitAmount).toBe(0);
      expect(expenseSugg.lines[1].creditAmount).toBe(4250);

      // Verify income suggestion — balanced JE
      const incomeSugg = batchResult.suggestions.find(
        (s) => s.transactionId === TXN_ID_INCOME
      )!;
      expect(incomeSugg).toBeTruthy();
      expect(incomeSugg.lines).toHaveLength(2);

      const incomeDebits = incomeSugg.lines.reduce((s, l) => s + l.debitAmount, 0);
      const incomeCredits = incomeSugg.lines.reduce((s, l) => s + l.creditAmount, 0);
      expect(incomeDebits).toBe(incomeCredits);
      expect(incomeDebits).toBe(150000); // $1,500.00

      // Income: DR Bank GL (1100), CR Revenue GL (4000)
      expect(incomeSugg.lines[0].glAccountCode).toBe('1100');
      expect(incomeSugg.lines[0].debitAmount).toBe(150000);
      expect(incomeSugg.lines[1].glAccountCode).toBe('4000');
      expect(incomeSugg.lines[1].creditAmount).toBe(150000);

      // Step 2: Create draft JEs — links txn + creates AIAction
      let jeCreateCount = 0;
      mockJECreate.mockImplementation(() => {
        jeCreateCount++;
        return { id: jeCreateCount === 1 ? JE_ID_1 : JE_ID_2 };
      });
      mockTxnUpdate.mockResolvedValue({});
      mockAIActionCreate.mockResolvedValue({ id: ACTION_ID_1 });

      const draftResults = await jeService.createDraftJEs(batchResult.suggestions);
      expect(draftResults).toHaveLength(2);

      // Verify JE creation includes source preservation
      expect(mockJECreate).toHaveBeenCalledTimes(2);
      const firstJECall = mockJECreate.mock.calls[0][0];
      expect(firstJECall.data.sourceType).toBe('AI_SUGGESTION');
      expect(firstJECall.data.sourceId).toBeTruthy();
      expect(firstJECall.data.sourceDocument).toBeTruthy();
      expect(firstJECall.data.status).toBe('DRAFT');

      // Verify transactions linked to JEs
      expect(mockTxnUpdate).toHaveBeenCalledTimes(2);

      // Verify AIActions created for Action Feed
      expect(mockAIActionCreate).toHaveBeenCalledTimes(2);
      const actionCreateCall = mockAIActionCreate.mock.calls[0][0];
      expect(actionCreateCall.data.type).toBe('JE_DRAFT');
      expect(actionCreateCall.data.payload.journalEntryId).toBeTruthy();

      // Step 3: Approve AIAction → executes JE approval
      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      mockJEFindFirst.mockResolvedValue({
        id: JE_ID_1,
        status: 'DRAFT',
        entityId: ENTITY_ID,
      });
      mockApproveEntry.mockResolvedValue({ id: JE_ID_1, status: 'POSTED' });

      const execResult = await executor.execute({
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: expenseSugg.lines,
        },
      });

      expect(execResult.success).toBe(true);
      expect(execResult.type).toBe('JE_DRAFT');
      expect(mockApproveEntry).toHaveBeenCalledWith(JE_ID_1);
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Financial invariant assertions
  // -------------------------------------------------------------------------
  describe('financial invariants', () => {
    it('should always produce integer cents in JE lines', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([EXPENSE_TRANSACTION, INCOME_TRANSACTION]);

      for (const suggestion of result.suggestions) {
        for (const line of suggestion.lines) {
          assertIntegerCents(line.debitAmount, 'debitAmount');
          assertIntegerCents(line.creditAmount, 'creditAmount');
          assertMoneyFields(
            line as unknown as Record<string, unknown>,
            ['debitAmount', 'creditAmount']
          );
        }
      }
    });

    it('should always produce balanced journal entries (debits = credits)', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([EXPENSE_TRANSACTION, INCOME_TRANSACTION]);

      for (const suggestion of result.suggestions) {
        const totalDebits = suggestion.lines.reduce((s, l) => s + l.debitAmount, 0);
        const totalCredits = suggestion.lines.reduce((s, l) => s + l.creditAmount, 0);
        expect(totalDebits).toBe(totalCredits);
        expect(totalDebits).toBeGreaterThan(0);
      }
    });

    it('should preserve source metadata in JE creation', async () => {
      setupHappyPathMocks();
      mockJECreate.mockResolvedValue({ id: JE_ID_1 });
      mockTxnUpdate.mockResolvedValue({});
      mockAIActionCreate.mockResolvedValue({ id: ACTION_ID_1 });

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([EXPENSE_TRANSACTION]);
      await jeService.createDraftJEs(result.suggestions);

      const createCall = mockJECreate.mock.calls[0][0];
      expect(createCall.data.sourceType).toBe('AI_SUGGESTION');
      expect(createCall.data.sourceId).toBe(TXN_ID_EXPENSE);
      expect(createCall.data.sourceDocument).toBeTruthy();
      expect(typeof createCall.data.sourceDocument).toBe('object');
      expect(createCall.data.sourceDocument.transactionId).toBe(TXN_ID_EXPENSE);
      expect(createCall.data.sourceDocument.confidence).toBeDefined();
    });

    it('should use absolute amount for JE lines (no negative amounts)', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([EXPENSE_TRANSACTION]);

      expect(result.suggestions).toHaveLength(1);
      const suggestion = result.suggestions[0];
      for (const line of suggestion.lines) {
        expect(line.debitAmount).toBeGreaterThanOrEqual(0);
        expect(line.creditAmount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: Categorization → GL resolution
  // -------------------------------------------------------------------------
  describe('categorization and GL resolution', () => {
    it('should match keyword-based categorization with GL account', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([EXPENSE_TRANSACTION]);

      expect(result.suggestions).toHaveLength(1);
      const suggestion = result.suggestions[0];
      // "STAPLES OFFICE SUPPLIES" → keyword "staples" → "Office Supplies"
      expect(suggestion.categorization.categoryName).toBe('Office Supplies');
      expect(suggestion.categorization.resolvedGLAccountId).toBe(GL_OFFICE.id);
      expect(suggestion.categorization.resolvedGLAccountCode).toBe('5400');
    });

    it('should skip zero-amount transactions', async () => {
      setupHappyPathMocks();

      const zeroTxn = {
        ...EXPENSE_TRANSACTION,
        transactionId: 'cltest0000000000e2etxn004',
        amount: 0,
      };

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([zeroTxn]);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toContain('Zero-amount');
    });

    it('should skip transfer transactions', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([TRANSFER_TRANSACTION]);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toContain('Transfer');
    });

    it('should skip transactions when bank account has no GL mapping', async () => {
      // Bank account WITHOUT a linked GL
      mockAccountFindMany.mockResolvedValue([
        { id: BANK_ACCOUNT_ID, glAccountId: null, glAccount: null },
      ]);
      // No fallback GL found
      mockGLFindFirst.mockResolvedValue(null);
      // Categories + GL accounts still present
      mockCategoryFindMany.mockResolvedValue([
        { id: OFFICE_CAT_ID, name: 'Office Supplies', defaultGLAccountId: null },
      ]);
      mockGLFindMany.mockResolvedValue([GL_OFFICE, GL_FALLBACK_EXP]);

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([EXPENSE_TRANSACTION]);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toContain('no linked GL');
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: AIAction lifecycle — create, approve, reject
  // -------------------------------------------------------------------------
  describe('AIAction lifecycle', () => {
    it('should create AIActions when draft JEs are created', async () => {
      setupHappyPathMocks();
      mockJECreate.mockResolvedValue({ id: JE_ID_1 });
      mockTxnUpdate.mockResolvedValue({});
      mockAIActionCreate.mockResolvedValue({ id: ACTION_ID_1 });

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const suggestions = await jeService.suggestBatch([EXPENSE_TRANSACTION]);
      await jeService.createDraftJEs(suggestions.suggestions);

      expect(mockAIActionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityId: ENTITY_ID,
            type: 'JE_DRAFT',
            payload: expect.objectContaining({
              journalEntryId: JE_ID_1,
              transactionId: TXN_ID_EXPENSE,
            }),
          }),
        })
      );
    });

    it('should execute JE approval when AIAction is approved', async () => {
      mockJEFindFirst.mockResolvedValue({
        id: JE_ID_1,
        status: 'DRAFT',
        entityId: ENTITY_ID,
      });
      mockApproveEntry.mockResolvedValue({ id: JE_ID_1, status: 'POSTED' });

      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      const result = await executor.execute({
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: [
            { glAccountId: GL_OFFICE.id, debitAmount: 4250, creditAmount: 0 },
            { glAccountId: GL_BANK.id, debitAmount: 0, creditAmount: 4250 },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(mockApproveEntry).toHaveBeenCalledWith(JE_ID_1);
    });

    it('should soft-delete draft JE when AIAction is rejected', async () => {
      mockJEFindFirst.mockResolvedValue({ id: JE_ID_1 });
      mockJEUpdate.mockResolvedValue({ id: JE_ID_1, deletedAt: new Date() });
      mockTxnUpdateMany.mockResolvedValue({ count: 1 });

      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      await executor.handleRejection({
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: [],
        },
      });

      // Verify soft delete (not hard delete)
      expect(mockJEUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: JE_ID_1 },
          data: { deletedAt: expect.any(Date) },
        })
      );

      // Verify transaction unlinked
      expect(mockTxnUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TXN_ID_EXPENSE, journalEntryId: JE_ID_1 },
          data: { journalEntryId: null },
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 5: Batch operations
  // -------------------------------------------------------------------------
  describe('batch operations', () => {
    it('should handle mixed batch — some succeed, some skip', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const result = await jeService.suggestBatch([
        EXPENSE_TRANSACTION,
        INCOME_TRANSACTION,
        TRANSFER_TRANSACTION, // Skipped — transfer
        { ...EXPENSE_TRANSACTION, transactionId: 'txn-zero', amount: 0 }, // Skipped — zero
      ]);

      expect(result.summary.total).toBe(4);
      expect(result.summary.suggested).toBe(2);
      expect(result.summary.skipped).toBe(2);
    });

    it('should batch approve through AIActionService', async () => {
      const action1 = {
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: [
            { glAccountId: GL_OFFICE.id, debitAmount: 4250, creditAmount: 0 },
            { glAccountId: GL_BANK.id, debitAmount: 0, creditAmount: 4250 },
          ],
        },
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      };

      const action2 = {
        id: ACTION_ID_2,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_2,
          transactionId: TXN_ID_INCOME,
          lines: [
            { glAccountId: GL_BANK.id, debitAmount: 150000, creditAmount: 0 },
            { glAccountId: GL_REVENUE.id, debitAmount: 0, creditAmount: 150000 },
          ],
        },
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      };

      let findFirstCallCount = 0;
      mockAIActionFindFirst.mockImplementation(() => {
        findFirstCallCount++;
        return findFirstCallCount <= 2
          ? [action1, action2][findFirstCallCount - 1]
          : null;
      });
      mockAIActionUpdate.mockResolvedValue({});

      // Executor mocks for JE approval after batch approve
      mockJEFindFirst.mockResolvedValue({
        id: JE_ID_1,
        status: 'DRAFT',
        entityId: ENTITY_ID,
      });
      mockApproveEntry.mockResolvedValue({ id: JE_ID_1, status: 'POSTED' });

      const actionService = new AIActionService(TENANT_ID, ENTITY_ID);
      const result = await actionService.batchApprove(
        [ACTION_ID_1, ACTION_ID_2],
        APPROVER_ID
      );

      expect(result.succeeded).toHaveLength(2);
      expect(result.failed).toHaveLength(0);

      // Verify status updates
      expect(mockAIActionUpdate).toHaveBeenCalledTimes(2);
      const updateCall = mockAIActionUpdate.mock.calls[0][0];
      expect(updateCall.data.status).toBe('APPROVED');
      expect(updateCall.data.reviewedBy).toBe(APPROVER_ID);
      expect(updateCall.data.reviewedAt).toBeInstanceOf(Date);
    });

    it('should handle partial failure in batch approve', async () => {
      mockAIActionFindFirst
        .mockResolvedValueOnce({
          id: ACTION_ID_1,
          type: 'JE_DRAFT',
          payload: {
            journalEntryId: JE_ID_1,
            transactionId: TXN_ID_EXPENSE,
            lines: [],
          },
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 86400000),
        })
        .mockResolvedValueOnce(null); // Not found or not pending

      mockAIActionUpdate.mockResolvedValue({});
      mockJEFindFirst.mockResolvedValue({
        id: JE_ID_1,
        status: 'DRAFT',
        entityId: ENTITY_ID,
      });
      mockApproveEntry.mockResolvedValue({ id: JE_ID_1, status: 'POSTED' });

      const actionService = new AIActionService(TENANT_ID, ENTITY_ID);
      const result = await actionService.batchApprove(
        [ACTION_ID_1, ACTION_ID_2],
        APPROVER_ID
      );

      expect(result.succeeded).toHaveLength(1);
      expect(result.succeeded[0]).toBe(ACTION_ID_1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].id).toBe(ACTION_ID_2);
      expect(result.failed[0].reason).toContain('Not found or not pending');
    });
  });

  // -------------------------------------------------------------------------
  // Test 6: Tenant isolation
  // -------------------------------------------------------------------------
  describe('tenant isolation', () => {
    it('should scope bank GL resolution to tenant', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      await jeService.suggestBatch([EXPENSE_TRANSACTION]);

      expect(mockAccountFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });

    it('should scope category lookup to tenant', async () => {
      setupHappyPathMocks();

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      await jeService.suggestBatch([EXPENSE_TRANSACTION]);

      expect(mockCategoryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
          }),
        })
      );
    });

    it('should scope JE lookup in executor to tenant', async () => {
      mockJEFindFirst.mockResolvedValue(null);

      const executor = new ActionExecutorService(TENANT_ID_OTHER, ENTITY_ID, APPROVER_ID);
      const result = await executor.execute({
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockJEFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: { tenantId: TENANT_ID_OTHER },
          }),
        })
      );
    });

    it('should scope AIAction stats to tenant via entity', async () => {
      mockAIActionCount.mockResolvedValue(0);
      mockAIActionGroupBy.mockResolvedValue([]);

      const actionService = new AIActionService(TENANT_ID, ENTITY_ID);
      await actionService.getStats();

      for (const call of mockAIActionCount.mock.calls) {
        expect(call[0].where.entity).toEqual({ tenantId: TENANT_ID });
      }
    });
  });

  // -------------------------------------------------------------------------
  // Test 7: Separation of duties
  // -------------------------------------------------------------------------
  describe('separation of duties', () => {
    it('should use different userId for JE approval than JE creation', async () => {
      mockJEFindFirst.mockResolvedValue({
        id: JE_ID_1,
        status: 'DRAFT',
        entityId: ENTITY_ID,
      });
      mockApproveEntry.mockResolvedValue({ id: JE_ID_1, status: 'POSTED' });

      // JE created by USER_ID, approved by APPROVER_ID
      expect(APPROVER_ID).not.toBe(USER_ID);

      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      await executor.execute({
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: [],
        },
      });

      expect(mockApproveEntry).toHaveBeenCalledWith(JE_ID_1);
    });
  });

  // -------------------------------------------------------------------------
  // Test 8: Idempotency
  // -------------------------------------------------------------------------
  describe('idempotency', () => {
    it('should be idempotent for already-posted JEs', async () => {
      mockJEFindFirst.mockResolvedValue({
        id: JE_ID_1,
        status: 'POSTED',
        entityId: ENTITY_ID,
      });

      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      const result = await executor.execute({
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: [],
        },
      });

      expect(result.success).toBe(true);
      expect(result.detail).toContain('idempotent');
      expect(mockApproveEntry).not.toHaveBeenCalled();
    });

    it('should be idempotent for already-categorized transactions', async () => {
      mockTxnFindFirst.mockResolvedValue({
        id: TXN_ID_EXPENSE,
        categoryId: OFFICE_CAT_ID,
      });

      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      const result = await executor.execute({
        id: ACTION_ID_1,
        type: 'CATEGORIZATION',
        payload: {
          transactionId: TXN_ID_EXPENSE,
          categoryId: OFFICE_CAT_ID,
          categoryName: 'Office Supplies',
          confidence: 90,
        },
      });

      expect(result.success).toBe(true);
      expect(result.detail).toContain('idempotent');
      expect(mockTxnUpdate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Test 9: Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('should fail execution for voided JE', async () => {
      mockJEFindFirst.mockResolvedValue({
        id: JE_ID_1,
        status: 'VOIDED',
        entityId: ENTITY_ID,
      });

      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      const result = await executor.execute({
        id: ACTION_ID_1,
        type: 'JE_DRAFT',
        payload: {
          journalEntryId: JE_ID_1,
          transactionId: TXN_ID_EXPENSE,
          lines: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('voided');
    });

    it('should continue batch when one draft JE creation fails', async () => {
      setupHappyPathMocks();

      // First JE creation succeeds, second fails
      mockJECreate
        .mockResolvedValueOnce({ id: JE_ID_1 })
        .mockRejectedValueOnce(new Error('DB constraint violation'));
      mockTxnUpdate.mockResolvedValue({});
      mockAIActionCreate.mockResolvedValue({ id: ACTION_ID_1 });

      const jeService = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);
      const suggestions = await jeService.suggestBatch([
        EXPENSE_TRANSACTION,
        INCOME_TRANSACTION,
      ]);
      const results = await jeService.createDraftJEs(suggestions.suggestions);

      // One succeeded (first), one failed but didn't throw
      expect(results).toHaveLength(1);
      expect(results[0].journalEntryId).toBe(JE_ID_1);
    });

    it('should handle unknown action types gracefully', async () => {
      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);
      const result = await executor.execute({
        id: ACTION_ID_1,
        type: 'UNKNOWN_TYPE',
        payload: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action type');
    });

    it('should execute RULE_SUGGESTION and acknowledge ALERT', async () => {
      const executor = new ActionExecutorService(TENANT_ID, ENTITY_ID, APPROVER_ID);

      // RULE_SUGGESTION now attempts real execution via RuleSuggestionService
      const ruleResult = await executor.execute({
        id: ACTION_ID_1,
        type: 'RULE_SUGGESTION',
        payload: { ruleSuggestionId: 'suggestion-1' },
      });

      // ALERT remains acknowledgment-only
      const alertResult = await executor.execute({
        id: ACTION_ID_2,
        type: 'ALERT',
        payload: { message: 'Unusual spending pattern detected' },
      });

      expect(ruleResult.type).toBe('RULE_SUGGESTION');
      expect(alertResult.success).toBe(true);
      expect(alertResult.detail).toContain('Acknowledged');
      // Neither should touch JE or Transaction tables
      expect(mockJEFindFirst).not.toHaveBeenCalled();
      expect(mockTxnFindFirst).not.toHaveBeenCalled();
    });
  });
});
