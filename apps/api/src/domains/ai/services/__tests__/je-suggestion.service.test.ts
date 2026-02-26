import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  JESuggestionService,
  type JESuggestionInput,
  type JESuggestion,
} from '../je-suggestion.service';
import { assertIntegerCents, assertMoneyFields } from '../../../../test-utils/financial-assertions';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock CategorizationService
const mockCategorizeBatch = vi.fn();
vi.mock('../categorization.service', () => ({
  CategorizationService: class {
    categorizeBatch = mockCategorizeBatch;
  },
}));

// Mock generateEntryNumber
const mockGenerateEntryNumber = vi.fn();
vi.mock('../../../accounting/utils/entry-number', () => ({
  generateEntryNumber: (...args: unknown[]) => mockGenerateEntryNumber(...args),
}));

// Mock Prisma
const mockAccountFindMany = vi.fn();
const mockGLFindFirst = vi.fn();
const mockJournalEntryCreate = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    account: {
      findMany: (...args: unknown[]) => mockAccountFindMany(...args),
    },
    gLAccount: {
      findFirst: (...args: unknown[]) => mockGLFindFirst(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
  Prisma: {},
}));

// ---------------------------------------------------------------------------
// Test Constants
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'entity-xyz-456';
const USER_ID = 'user-test-001';
const BANK_GL = { id: 'gl-bank-001', code: '1100' };
const EXPENSE_GL = { id: 'gl-expense-001', code: '5800' };
const INCOME_GL = { id: 'gl-income-001', code: '4300' };

function makeTransaction(overrides: Partial<JESuggestionInput> = {}): JESuggestionInput {
  return {
    transactionId: 'txn-001',
    description: 'Coffee at Starbucks',
    amount: -550, // $5.50 expense (integer cents)
    currency: 'USD',
    date: new Date('2026-02-25'),
    sourceType: 'BANK_FEED',
    accountId: 'acct-001',
    ...overrides,
  };
}

function makeCategorySuggestion(overrides: Record<string, unknown> = {}) {
  return {
    categoryId: 'cat-meals',
    categoryName: 'Meals & Entertainment',
    confidence: 92,
    confidenceTier: 'high' as const,
    matchReason: 'keyword:starbucks',
    resolvedGLAccountId: EXPENSE_GL.id,
    resolvedGLAccountCode: EXPENSE_GL.code,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JESuggestionService', () => {
  let service: JESuggestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JESuggestionService(TENANT_ID, ENTITY_ID, USER_ID);

    // Default: bank account has linked GL
    mockAccountFindMany.mockResolvedValue([
      { id: 'acct-001', glAccountId: BANK_GL.id, glAccount: BANK_GL },
    ]);
  });

  // -------------------------------------------------------------------------
  // suggestBatch — Guards
  // -------------------------------------------------------------------------

  describe('suggestBatch — guards', () => {
    it('should skip TRANSFER sourceType transactions', async () => {
      const txns = [makeTransaction({ sourceType: 'TRANSFER', transactionId: 'txn-transfer' })];

      const result = await service.suggestBatch(txns);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].transactionId).toBe('txn-transfer');
      expect(result.skipped[0].reason).toContain('Transfer');
      expect(result.summary.total).toBe(1);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.suggested).toBe(0);
      // Should NOT call categorization for skipped transactions
      expect(mockCategorizeBatch).not.toHaveBeenCalled();
    });

    it('should skip zero-amount transactions', async () => {
      const txns = [makeTransaction({ amount: 0, transactionId: 'txn-zero' })];

      const result = await service.suggestBatch(txns);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].transactionId).toBe('txn-zero');
      expect(result.skipped[0].reason).toContain('Zero-amount');
      expect(mockCategorizeBatch).not.toHaveBeenCalled();
    });

    it('should return early when all transactions are skipped', async () => {
      const txns = [
        makeTransaction({ sourceType: 'TRANSFER', transactionId: 'txn-t1' }),
        makeTransaction({ amount: 0, transactionId: 'txn-t2' }),
      ];

      const result = await service.suggestBatch(txns);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(mockCategorizeBatch).not.toHaveBeenCalled();
      expect(mockAccountFindMany).not.toHaveBeenCalled();
    });

    it('should skip transactions without linked bank GL account', async () => {
      // Bank account has no glAccount
      mockAccountFindMany.mockResolvedValue([
        { id: 'acct-orphan', glAccountId: null, glAccount: null },
      ]);
      // No well-known bank GL either
      mockGLFindFirst.mockResolvedValue(null);

      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const txns = [makeTransaction({ accountId: 'acct-orphan' })];
      const result = await service.suggestBatch(txns);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toContain('no linked GL');
    });

    it('should skip transactions when category GL resolution fails', async () => {
      mockCategorizeBatch.mockResolvedValue([
        makeCategorySuggestion({
          resolvedGLAccountId: null,
          resolvedGLAccountCode: null,
        }),
      ]);

      const txns = [makeTransaction()];
      const result = await service.suggestBatch(txns);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toContain('Could not resolve GL');
    });
  });

  // -------------------------------------------------------------------------
  // suggestBatch — Expense JE
  // -------------------------------------------------------------------------

  describe('suggestBatch — expense JE', () => {
    it('should create balanced expense JE (DR expense, CR bank)', async () => {
      const txn = makeTransaction({ amount: -1050 }); // $10.50 expense
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const result = await service.suggestBatch([txn]);

      expect(result.suggestions).toHaveLength(1);
      const je = result.suggestions[0];

      // Should have exactly 2 lines
      expect(je.lines).toHaveLength(2);

      // Line 1: DR expense GL
      const debitLine = je.lines[0];
      expect(debitLine.glAccountId).toBe(EXPENSE_GL.id);
      expect(debitLine.glAccountCode).toBe(EXPENSE_GL.code);
      expect(debitLine.debitAmount).toBe(1050);
      expect(debitLine.creditAmount).toBe(0);

      // Line 2: CR bank GL
      const creditLine = je.lines[1];
      expect(creditLine.glAccountId).toBe(BANK_GL.id);
      expect(creditLine.glAccountCode).toBe(BANK_GL.code);
      expect(creditLine.debitAmount).toBe(0);
      expect(creditLine.creditAmount).toBe(1050);

      // Double-entry balance
      const totalDebits = je.lines.reduce((sum, l) => sum + l.debitAmount, 0);
      const totalCredits = je.lines.reduce((sum, l) => sum + l.creditAmount, 0);
      expect(totalDebits).toBe(totalCredits);
    });

    it('should use integer cents for all amounts', async () => {
      const txn = makeTransaction({ amount: -999 }); // $9.99
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const result = await service.suggestBatch([txn]);
      const je = result.suggestions[0];

      for (const line of je.lines) {
        assertIntegerCents(line.debitAmount, 'debitAmount');
        assertIntegerCents(line.creditAmount, 'creditAmount');
        assertMoneyFields(line, ['debitAmount', 'creditAmount']);
      }
    });
  });

  // -------------------------------------------------------------------------
  // suggestBatch — Income JE
  // -------------------------------------------------------------------------

  describe('suggestBatch — income JE', () => {
    it('should create balanced income JE (DR bank, CR income)', async () => {
      const txn = makeTransaction({
        amount: 5000, // $50.00 income
        description: 'Client payment received',
        transactionId: 'txn-income-001',
      });
      mockCategorizeBatch.mockResolvedValue([
        makeCategorySuggestion({
          categoryName: 'Consulting Income',
          resolvedGLAccountId: INCOME_GL.id,
          resolvedGLAccountCode: INCOME_GL.code,
        }),
      ]);

      const result = await service.suggestBatch([txn]);

      expect(result.suggestions).toHaveLength(1);
      const je = result.suggestions[0];

      // Line 1: DR bank GL
      expect(je.lines[0].glAccountId).toBe(BANK_GL.id);
      expect(je.lines[0].debitAmount).toBe(5000);
      expect(je.lines[0].creditAmount).toBe(0);

      // Line 2: CR income GL
      expect(je.lines[1].glAccountId).toBe(INCOME_GL.id);
      expect(je.lines[1].debitAmount).toBe(0);
      expect(je.lines[1].creditAmount).toBe(5000);

      // Double-entry balance
      const totalDebits = je.lines.reduce((sum, l) => sum + l.debitAmount, 0);
      const totalCredits = je.lines.reduce((sum, l) => sum + l.creditAmount, 0);
      expect(totalDebits).toBe(totalCredits);
    });
  });

  // -------------------------------------------------------------------------
  // suggestBatch — Metadata & Confidence
  // -------------------------------------------------------------------------

  describe('suggestBatch — metadata', () => {
    it('should set sourceType to AI_SUGGESTION', async () => {
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const result = await service.suggestBatch([makeTransaction()]);
      const je = result.suggestions[0];

      expect(je.sourceType).toBe('AI_SUGGESTION');
      expect(je.sourceId).toBe('txn-001');
      expect(je.status).toBe('DRAFT');
      expect(je.entryNumber).toBeNull(); // Not assigned until creation
    });

    it('should propagate confidence from categorization', async () => {
      mockCategorizeBatch.mockResolvedValue([
        makeCategorySuggestion({ confidence: 78, confidenceTier: 'medium' }),
      ]);

      const result = await service.suggestBatch([makeTransaction()]);

      expect(result.suggestions[0].confidence).toBe(78);
      assertIntegerCents(result.suggestions[0].confidence, 'confidence');
    });

    it('should build descriptive memo', async () => {
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const result = await service.suggestBatch([makeTransaction()]);

      expect(result.suggestions[0].memo).toContain('AI-drafted');
      expect(result.suggestions[0].memo).toContain('Coffee at Starbucks');
      expect(result.suggestions[0].memo).toContain('Meals & Entertainment');
    });

    it('should compute summary statistics correctly', async () => {
      const txns = [
        makeTransaction({ transactionId: 'txn-1', amount: -100 }),
        makeTransaction({ transactionId: 'txn-2', amount: -200 }),
        makeTransaction({ transactionId: 'txn-3', sourceType: 'TRANSFER' }), // skipped
        makeTransaction({ transactionId: 'txn-4', amount: -300 }),
      ];

      mockCategorizeBatch.mockResolvedValue([
        makeCategorySuggestion({ confidence: 95, confidenceTier: 'high' }),
        makeCategorySuggestion({ confidence: 72, confidenceTier: 'medium' }),
        makeCategorySuggestion({ confidence: 45, confidenceTier: 'low' }),
      ]);

      const result = await service.suggestBatch(txns);

      expect(result.summary.total).toBe(4);
      expect(result.summary.suggested).toBe(3);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.highConfidence).toBe(1);
      expect(result.summary.mediumConfidence).toBe(1);
      expect(result.summary.lowConfidence).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // suggestBatch — Bank GL Resolution
  // -------------------------------------------------------------------------

  describe('suggestBatch — bank GL resolution', () => {
    it('should use linked GL account from bank account', async () => {
      mockAccountFindMany.mockResolvedValue([
        { id: 'acct-001', glAccountId: 'gl-checking', glAccount: { id: 'gl-checking', code: '1101' } },
      ]);
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const result = await service.suggestBatch([makeTransaction()]);

      const bankLine = result.suggestions[0].lines.find(
        (l) => l.glAccountCode === '1101'
      );
      expect(bankLine).toBeTruthy();
    });

    it('should fall back to well-known bank GL code 1100', async () => {
      // Account has no linked GL
      mockAccountFindMany.mockResolvedValue([
        { id: 'acct-001', glAccountId: null, glAccount: null },
      ]);
      // Well-known bank GL exists
      mockGLFindFirst.mockResolvedValue({ id: 'gl-default-bank', code: '1100' });
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const result = await service.suggestBatch([makeTransaction()]);

      expect(result.suggestions).toHaveLength(1);
      const bankLine = result.suggestions[0].lines.find(
        (l) => l.glAccountCode === '1100'
      );
      expect(bankLine).toBeTruthy();
    });

    it('should resolve bank GLs for multiple unique account IDs', async () => {
      mockAccountFindMany.mockResolvedValue([
        { id: 'acct-001', glAccountId: 'gl-1', glAccount: { id: 'gl-1', code: '1100' } },
        { id: 'acct-002', glAccountId: 'gl-2', glAccount: { id: 'gl-2', code: '1101' } },
      ]);
      mockCategorizeBatch.mockResolvedValue([
        makeCategorySuggestion(),
        makeCategorySuggestion(),
      ]);

      const txns = [
        makeTransaction({ transactionId: 'txn-1', accountId: 'acct-001' }),
        makeTransaction({ transactionId: 'txn-2', accountId: 'acct-002' }),
      ];

      const result = await service.suggestBatch(txns);

      expect(result.suggestions).toHaveLength(2);
      // First suggestion uses acct-001's GL
      expect(result.suggestions[0].lines.some((l) => l.glAccountCode === '1100')).toBe(true);
      // Second suggestion uses acct-002's GL
      expect(result.suggestions[1].lines.some((l) => l.glAccountCode === '1101')).toBe(true);
    });

    it('should query accounts with tenant isolation', async () => {
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      await service.suggestBatch([makeTransaction()]);

      expect(mockAccountFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: { tenantId: TENANT_ID },
            deletedAt: null,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // suggestBatch — Batch Processing
  // -------------------------------------------------------------------------

  describe('suggestBatch — batch processing', () => {
    it('should handle mixed eligible and skipped transactions', async () => {
      const txns = [
        makeTransaction({ transactionId: 'txn-eligible', amount: -1000 }),
        makeTransaction({ transactionId: 'txn-transfer', sourceType: 'TRANSFER' }),
        makeTransaction({ transactionId: 'txn-zero', amount: 0 }),
      ];

      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const result = await service.suggestBatch(txns);

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].transactionId).toBe('txn-eligible');
      expect(result.skipped).toHaveLength(2);
      expect(result.summary.total).toBe(3);
    });

    it('should handle empty input', async () => {
      const result = await service.suggestBatch([]);

      expect(result.suggestions).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });

    it('should pass correct data to categorizeBatch', async () => {
      mockCategorizeBatch.mockResolvedValue([makeCategorySuggestion()]);

      const txn = makeTransaction({ description: 'Uber ride', amount: -2500 });
      await service.suggestBatch([txn]);

      expect(mockCategorizeBatch).toHaveBeenCalledWith([
        { description: 'Uber ride', amount: -2500 },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // createDraftJEs
  // -------------------------------------------------------------------------

  describe('createDraftJEs', () => {
    const mockSuggestion: JESuggestion = {
      transactionId: 'txn-001',
      entryNumber: null,
      date: new Date('2026-02-25'),
      memo: 'AI-drafted: Coffee at Starbucks — Meals & Entertainment',
      sourceType: 'AI_SUGGESTION',
      sourceId: 'txn-001',
      status: 'DRAFT',
      lines: [
        {
          glAccountId: EXPENSE_GL.id,
          glAccountCode: EXPENSE_GL.code,
          debitAmount: 550,
          creditAmount: 0,
          memo: 'Meals & Entertainment: Coffee at Starbucks',
        },
        {
          glAccountId: BANK_GL.id,
          glAccountCode: BANK_GL.code,
          debitAmount: 0,
          creditAmount: 550,
          memo: 'Bank payment: Coffee at Starbucks',
        },
      ],
      categorization: makeCategorySuggestion() as JESuggestion['categorization'],
      confidence: 92,
    };

    it('should create JE with proper source preservation', async () => {
      mockGenerateEntryNumber.mockResolvedValue('JE-042');
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          journalEntry: { create: mockJournalEntryCreate.mockResolvedValue({ id: 'je-new-001' }) },
          transaction: { update: mockTransactionUpdate.mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const results = await service.createDraftJEs([mockSuggestion]);

      expect(results).toHaveLength(1);
      expect(results[0].transactionId).toBe('txn-001');
      expect(results[0].journalEntryId).toBe('je-new-001');

      // Verify JE creation args
      const createArgs = mockJournalEntryCreate.mock.calls[0][0];
      expect(createArgs.data.entityId).toBe(ENTITY_ID);
      expect(createArgs.data.entryNumber).toBe('JE-042');
      expect(createArgs.data.sourceType).toBe('AI_SUGGESTION');
      expect(createArgs.data.sourceId).toBe('txn-001');
      expect(createArgs.data.status).toBe('DRAFT');
      expect(createArgs.data.createdBy).toBe(USER_ID);

      // Source document preserved
      expect(createArgs.data.sourceDocument).toBeDefined();
      expect(createArgs.data.sourceDocument.transactionId).toBe('txn-001');
      expect(createArgs.data.sourceDocument.confidence).toBe(92);

      // Journal lines created
      expect(createArgs.data.journalLines.create).toHaveLength(2);
      const [debitLine, creditLine] = createArgs.data.journalLines.create;
      expect(debitLine.debitAmount).toBe(550);
      expect(debitLine.creditAmount).toBe(0);
      expect(creditLine.debitAmount).toBe(0);
      expect(creditLine.creditAmount).toBe(550);
    });

    it('should link transaction to created JE', async () => {
      mockGenerateEntryNumber.mockResolvedValue('JE-043');
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          journalEntry: { create: mockJournalEntryCreate.mockResolvedValue({ id: 'je-linked' }) },
          transaction: { update: mockTransactionUpdate.mockResolvedValue({}) },
        };
        return fn(tx);
      });

      await service.createDraftJEs([mockSuggestion]);

      expect(mockTransactionUpdate).toHaveBeenCalledWith({
        where: { id: 'txn-001' },
        data: { journalEntryId: 'je-linked' },
      });
    });

    it('should use generateEntryNumber within transaction', async () => {
      mockGenerateEntryNumber.mockResolvedValue('JE-044');
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          journalEntry: { create: mockJournalEntryCreate.mockResolvedValue({ id: 'je-x' }) },
          transaction: { update: mockTransactionUpdate.mockResolvedValue({}) },
        };
        return fn(tx);
      });

      await service.createDraftJEs([mockSuggestion]);

      // generateEntryNumber should be called with the transaction client and entityId
      expect(mockGenerateEntryNumber).toHaveBeenCalledWith(
        expect.anything(), // tx
        ENTITY_ID
      );
    });

    it('should continue batch when individual JE creation fails', async () => {
      const suggestions = [
        { ...mockSuggestion, transactionId: 'txn-fail' },
        { ...mockSuggestion, transactionId: 'txn-ok', sourceId: 'txn-ok' },
      ];

      let callCount = 0;
      mockTransaction.mockImplementation(async (fn) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('DB constraint violation');
        }
        const tx = {
          journalEntry: { create: mockJournalEntryCreate.mockResolvedValue({ id: 'je-ok' }) },
          transaction: { update: mockTransactionUpdate.mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const results = await service.createDraftJEs(suggestions);

      // Should have 1 success, 1 skipped (error logged, not thrown)
      expect(results).toHaveLength(1);
      expect(results[0].transactionId).toBe('txn-ok');
    });

    it('should reject unbalanced JE suggestions', async () => {
      const unbalanced: JESuggestion = {
        ...mockSuggestion,
        lines: [
          { glAccountId: 'gl-1', glAccountCode: '5800', debitAmount: 1000, creditAmount: 0, memo: 'Debit' },
          { glAccountId: 'gl-2', glAccountCode: '1100', debitAmount: 0, creditAmount: 500, memo: 'Credit' },
          // Debits (1000) !== Credits (500)
        ],
      };

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          journalEntry: { create: mockJournalEntryCreate },
          transaction: { update: mockTransactionUpdate },
        };
        return fn(tx);
      });

      const results = await service.createDraftJEs([unbalanced]);

      // Should fail with balance error (caught, logged, not in results)
      expect(results).toHaveLength(0);
      // JE should not have been created
      expect(mockJournalEntryCreate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Integer cents invariant
  // -------------------------------------------------------------------------

  describe('integer cents invariant', () => {
    it('should produce integer cent amounts for all JE lines', async () => {
      const txns = [
        makeTransaction({ amount: -1, transactionId: 'txn-penny' }),     // 1 cent
        makeTransaction({ amount: -99999, transactionId: 'txn-big' }),    // $999.99
        makeTransaction({ amount: 12345, transactionId: 'txn-income' }), // $123.45 income
      ];

      mockCategorizeBatch.mockResolvedValue([
        makeCategorySuggestion(),
        makeCategorySuggestion(),
        makeCategorySuggestion({
          resolvedGLAccountId: INCOME_GL.id,
          resolvedGLAccountCode: INCOME_GL.code,
        }),
      ]);

      const result = await service.suggestBatch(txns);

      for (const suggestion of result.suggestions) {
        for (const line of suggestion.lines) {
          assertIntegerCents(line.debitAmount, 'debitAmount');
          assertIntegerCents(line.creditAmount, 'creditAmount');
        }
        assertIntegerCents(suggestion.confidence, 'confidence');
      }
    });
  });
});
