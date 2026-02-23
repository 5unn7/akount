import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { createAuditLog } from '../../../lib/audit';
import { FxRateService } from '../../banking/services/fx-rate.service';
import { reportCache } from './report-cache';
import { generateEntryNumber } from '../utils/entry-number';

/**
 * Document Posting Service
 *
 * Posts invoices, bills, and payments to the general ledger.
 * Each posting creates a balanced journal entry with source preservation.
 *
 * CRITICAL RULES:
 * - Serializable isolation prevents double-posting
 * - SUM(debits) === SUM(credits) always
 * - Source document snapshots are immutable
 * - Fiscal period locks are enforced
 *
 * Journal patterns:
 * - Invoice:  DR Accounts Receivable, CR Revenue, CR Tax Payable
 * - Bill:     DR Expense, CR Accounts Payable
 * - Payment (AR): DR Cash/Bank, CR Accounts Receivable
 * - Payment (AP): DR Accounts Payable, CR Cash/Bank
 */

// Well-known COA codes from coa-template.ts
const WELL_KNOWN_CODES = {
  BANK_ACCOUNT: '1100',
  ACCOUNTS_RECEIVABLE: '1200',
  ACCOUNTS_PAYABLE: '2000',
  CREDIT_CARD_PAYABLE: '2100',
  LOANS_PAYABLE: '2500',
  OPENING_BALANCE_EQUITY: '3300',
  SALES_TAX_PAYABLE: '2300',
  SERVICE_REVENUE: '4000',
  OTHER_EXPENSES: '5990',
} as const;

export class DocumentPostingService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  /**
   * Post an invoice to the general ledger.
   *
   * Creates journal entry:
   *   DR Accounts Receivable (invoice.total)
   *   CR Revenue per line (line.amount - line.taxAmount)
   *   CR Sales Tax Payable (sum of line.taxAmount)
   *
   * Prerequisites:
   * - Invoice must be SENT (not DRAFT)
   * - Invoice must not already be posted (no existing JE with sourceId)
   */
  async postInvoice(invoiceId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Load invoice with lines and entity
      const invoice = await tx.invoice.findFirst({
        where: {
          id: invoiceId,
          entity: { tenantId: this.tenantId },
          deletedAt: null,
        },
        include: {
          invoiceLines: { where: { deletedAt: null } },
          client: { select: { id: true, name: true } },
          entity: { select: { id: true, name: true, functionalCurrency: true } },
        },
      });

      if (!invoice) {
        throw new AccountingError('Invoice not found', 'GL_ACCOUNT_NOT_FOUND', 404);
      }

      if (invoice.status === 'DRAFT') {
        throw new AccountingError(
          'Cannot post DRAFT invoice — send it first',
          'IMMUTABLE_POSTED_ENTRY',
          400
        );
      }

      // 2. Check not already posted
      const existingJE = await tx.journalEntry.findFirst({
        where: {
          sourceType: 'INVOICE',
          sourceId: invoiceId,
          deletedAt: null,
          status: { not: 'VOIDED' },
        },
        select: { id: true },
      });

      if (existingJE) {
        throw new AccountingError(
          'Invoice is already posted to the general ledger',
          'ALREADY_POSTED',
          409,
          { journalEntryId: existingJE.id }
        );
      }

      const entityId = invoice.entityId;

      // 3. Fiscal period check
      await this.checkFiscalPeriod(tx, entityId, invoice.issueDate);

      // 4. Resolve GL accounts
      const arAccount = await this.resolveGLAccountByCode(
        tx, entityId, WELL_KNOWN_CODES.ACCOUNTS_RECEIVABLE
      );
      const taxAccount = await this.resolveGLAccountByCode(
        tx, entityId, WELL_KNOWN_CODES.SALES_TAX_PAYABLE
      );
      const defaultRevenueAccount = await this.resolveGLAccountByCode(
        tx, entityId, WELL_KNOWN_CODES.SERVICE_REVENUE
      );

      // 5. Build journal lines (with multi-currency support)
      const lines: Array<{
        glAccountId: string;
        debitAmount: number;
        creditAmount: number;
        memo: string | null;
        currency: string;
        exchangeRate?: number;
        baseCurrencyDebit?: number;
        baseCurrencyCredit?: number;
      }> = [];

      // Determine if FX conversion is needed
      const needsFxConversion = invoice.currency !== invoice.entity.functionalCurrency;
      let fxRate = 1.0;

      if (needsFxConversion) {
        const fxService = new FxRateService();
        fxRate = await fxService.getRate(
          invoice.currency,
          invoice.entity.functionalCurrency,
          invoice.issueDate
        );
      }

      // DR Accounts Receivable for the total
      lines.push({
        glAccountId: arAccount.id,
        debitAmount: invoice.total,
        creditAmount: 0,
        memo: `AR: Invoice ${invoice.invoiceNumber} — ${invoice.client.name}`,
        currency: invoice.currency,
        ...(needsFxConversion && {
          exchangeRate: fxRate,
          baseCurrencyDebit: Math.round(invoice.total * fxRate),
          baseCurrencyCredit: 0,
        }),
      });

      // CR Revenue per line (line.amount is pre-tax: qty * unitPrice)
      for (const line of invoice.invoiceLines) {
        const netAmount = line.amount;
        if (netAmount > 0) {
          lines.push({
            glAccountId: line.glAccountId ?? defaultRevenueAccount.id,
            debitAmount: 0,
            creditAmount: netAmount,
            memo: line.description,
            currency: invoice.currency,
            ...(needsFxConversion && {
              exchangeRate: fxRate,
              baseCurrencyDebit: 0,
              baseCurrencyCredit: Math.round(netAmount * fxRate),
            }),
          });
        }
      }

      // CR Sales Tax Payable (aggregate)
      const totalTax = invoice.invoiceLines.reduce((sum, l) => sum + l.taxAmount, 0);
      if (totalTax > 0) {
        lines.push({
          glAccountId: taxAccount.id,
          debitAmount: 0,
          creditAmount: totalTax,
          memo: `Tax: Invoice ${invoice.invoiceNumber}`,
          currency: invoice.currency,
          ...(needsFxConversion && {
            exchangeRate: fxRate,
            baseCurrencyDebit: 0,
            baseCurrencyCredit: Math.round(totalTax * fxRate),
          }),
        });
      }

      // 6. Verify balance (defense-in-depth)
      const totalDebits = lines.reduce((s, l) => s + l.debitAmount, 0);
      const totalCredits = lines.reduce((s, l) => s + l.creditAmount, 0);
      if (totalDebits !== totalCredits) {
        throw new AccountingError(
          `Invoice journal entry not balanced: debits ${totalDebits} ≠ credits ${totalCredits}`,
          'UNBALANCED_ENTRY',
          400
        );
      }

      // 7. Generate entry number
      const entryNumber = await generateEntryNumber(tx, entityId);

      // 8. Source document snapshot
      const sourceDocument = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.client.name,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        lineCount: invoice.invoiceLines.length,
        capturedAt: new Date().toISOString(),
      };

      // 9. Create journal entry (POSTED immediately)
      const journalEntry = await tx.journalEntry.create({
        data: {
          entityId,
          entryNumber,
          date: invoice.issueDate,
          memo: `Invoice ${invoice.invoiceNumber} — ${invoice.client.name}`,
          sourceType: 'INVOICE',
          sourceId: invoice.id,
          sourceDocument: sourceDocument as unknown as Prisma.InputJsonValue,
          status: 'POSTED',
          createdBy: this.userId,
          journalLines: { create: lines },
        },
        select: {
          id: true,
          entryNumber: true,
          journalLines: {
            select: {
              id: true,
              glAccountId: true,
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
      });

      // 10. Audit log (transaction-safe — ARCH-6)
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId,
        model: 'JournalEntry',
        recordId: journalEntry.id,
        action: 'CREATE',
        after: {
          entryNumber: journalEntry.entryNumber,
          sourceType: 'INVOICE',
          sourceId: invoice.id,
          status: 'POSTED',
          amount: invoice.total,
        },
      }, tx);

      // 11. Invalidate report cache (defensive - non-critical, swallow errors)
      try {
        reportCache.invalidate(this.tenantId, /^report:/);
      } catch {
        // Intentionally swallowed — cache miss is harmless
      }

      return {
        journalEntryId: journalEntry.id,
        entryNumber: journalEntry.entryNumber,
        invoiceId: invoice.id,
        amount: invoice.total,
        lines: journalEntry.journalLines,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  /**
   * Post a bill to the general ledger.
   *
   * Creates journal entry:
   *   DR Expense per line (line.amount - line.taxAmount)
   *   DR Recoverable Tax (sum of line.taxAmount, if applicable)
   *   CR Accounts Payable (bill.total)
   *
   * Prerequisites:
   * - Bill must be PENDING or later (not DRAFT)
   * - Bill must not already be posted
   */
  async postBill(billId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Load bill with lines and entity
      const bill = await tx.bill.findFirst({
        where: {
          id: billId,
          entity: { tenantId: this.tenantId },
          deletedAt: null,
        },
        include: {
          billLines: { where: { deletedAt: null } },
          vendor: { select: { id: true, name: true } },
          entity: { select: { id: true, name: true, functionalCurrency: true } },
        },
      });

      if (!bill) {
        throw new AccountingError('Bill not found', 'GL_ACCOUNT_NOT_FOUND', 404);
      }

      if (bill.status === 'DRAFT') {
        throw new AccountingError(
          'Cannot post DRAFT bill — approve it first',
          'IMMUTABLE_POSTED_ENTRY',
          400
        );
      }

      // 2. Check not already posted
      const existingJE = await tx.journalEntry.findFirst({
        where: {
          sourceType: 'BILL',
          sourceId: billId,
          deletedAt: null,
          status: { not: 'VOIDED' },
        },
        select: { id: true },
      });

      if (existingJE) {
        throw new AccountingError(
          'Bill is already posted to the general ledger',
          'ALREADY_POSTED',
          409,
          { journalEntryId: existingJE.id }
        );
      }

      const entityId = bill.entityId;

      // 3. Fiscal period check
      await this.checkFiscalPeriod(tx, entityId, bill.issueDate);

      // 4. Resolve GL accounts
      const apAccount = await this.resolveGLAccountByCode(
        tx, entityId, WELL_KNOWN_CODES.ACCOUNTS_PAYABLE
      );
      const taxAccount = await this.resolveGLAccountByCode(
        tx, entityId, WELL_KNOWN_CODES.SALES_TAX_PAYABLE
      );
      const defaultExpenseAccount = await this.resolveGLAccountByCode(
        tx, entityId, WELL_KNOWN_CODES.OTHER_EXPENSES
      );

      // 5. Build journal lines (with multi-currency support)
      const lines: Array<{
        glAccountId: string;
        debitAmount: number;
        creditAmount: number;
        memo: string | null;
        currency: string;
        exchangeRate?: number;
        baseCurrencyDebit?: number;
        baseCurrencyCredit?: number;
      }> = [];

      // Determine if FX conversion is needed
      const needsFxConversion = bill.currency !== bill.entity.functionalCurrency;
      let fxRate = 1.0;

      if (needsFxConversion) {
        const fxService = new FxRateService();
        fxRate = await fxService.getRate(
          bill.currency,
          bill.entity.functionalCurrency,
          bill.issueDate
        );
      }

      // DR Expense per line (line.amount is pre-tax: qty * unitPrice)
      for (const line of bill.billLines) {
        const netAmount = line.amount;
        if (netAmount > 0) {
          lines.push({
            glAccountId: line.glAccountId ?? defaultExpenseAccount.id,
            debitAmount: netAmount,
            creditAmount: 0,
            memo: line.description,
            currency: bill.currency,
            ...(needsFxConversion && {
              exchangeRate: fxRate,
              baseCurrencyDebit: Math.round(netAmount * fxRate),
              baseCurrencyCredit: 0,
            }),
          });
        }
      }

      // DR Recoverable Tax (aggregate)
      const totalTax = bill.billLines.reduce((sum, l) => sum + l.taxAmount, 0);
      if (totalTax > 0) {
        lines.push({
          glAccountId: taxAccount.id,
          debitAmount: totalTax,
          creditAmount: 0,
          memo: `Tax: Bill ${bill.billNumber}`,
          currency: bill.currency,
          ...(needsFxConversion && {
            exchangeRate: fxRate,
            baseCurrencyDebit: Math.round(totalTax * fxRate),
            baseCurrencyCredit: 0,
          }),
        });
      }

      // CR Accounts Payable for the total
      lines.push({
        glAccountId: apAccount.id,
        debitAmount: 0,
        creditAmount: bill.total,
        memo: `AP: Bill ${bill.billNumber} — ${bill.vendor.name}`,
        currency: bill.currency,
        ...(needsFxConversion && {
          exchangeRate: fxRate,
          baseCurrencyDebit: 0,
          baseCurrencyCredit: Math.round(bill.total * fxRate),
        }),
      });

      // 6. Verify balance
      const totalDebits = lines.reduce((s, l) => s + l.debitAmount, 0);
      const totalCredits = lines.reduce((s, l) => s + l.creditAmount, 0);
      if (totalDebits !== totalCredits) {
        throw new AccountingError(
          `Bill journal entry not balanced: debits ${totalDebits} ≠ credits ${totalCredits}`,
          'UNBALANCED_ENTRY',
          400
        );
      }

      // 7. Generate entry number
      const entryNumber = await generateEntryNumber(tx, entityId);

      // 8. Source document snapshot
      const sourceDocument = {
        id: bill.id,
        billNumber: bill.billNumber,
        vendorId: bill.vendorId,
        vendorName: bill.vendor.name,
        issueDate: bill.issueDate,
        dueDate: bill.dueDate,
        currency: bill.currency,
        subtotal: bill.subtotal,
        taxAmount: bill.taxAmount,
        total: bill.total,
        lineCount: bill.billLines.length,
        capturedAt: new Date().toISOString(),
      };

      // 9. Create journal entry (POSTED immediately)
      const journalEntry = await tx.journalEntry.create({
        data: {
          entityId,
          entryNumber,
          date: bill.issueDate,
          memo: `Bill ${bill.billNumber} — ${bill.vendor.name}`,
          sourceType: 'BILL',
          sourceId: bill.id,
          sourceDocument: sourceDocument as unknown as Prisma.InputJsonValue,
          status: 'POSTED',
          createdBy: this.userId,
          journalLines: { create: lines },
        },
        select: {
          id: true,
          entryNumber: true,
          journalLines: {
            select: {
              id: true,
              glAccountId: true,
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
      });

      // 10. Audit log (transaction-safe — ARCH-6)
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId,
        model: 'JournalEntry',
        recordId: journalEntry.id,
        action: 'CREATE',
        after: {
          entryNumber: journalEntry.entryNumber,
          sourceType: 'BILL',
          sourceId: bill.id,
          status: 'POSTED',
          amount: bill.total,
        },
      }, tx);

      // 11. Invalidate report cache (defensive - non-critical, swallow errors)
      try {
        reportCache.invalidate(this.tenantId, /^report:/);
      } catch {
        // Intentionally swallowed — cache miss is harmless
      }

      return {
        journalEntryId: journalEntry.id,
        entryNumber: journalEntry.entryNumber,
        billId: bill.id,
        amount: bill.total,
        lines: journalEntry.journalLines,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  /**
   * Post a payment allocation to the general ledger.
   *
   * For AR payment (customer pays invoice):
   *   DR Cash/Bank (bankGLAccountId)
   *   CR Accounts Receivable
   *
   * For AP payment (we pay vendor bill):
   *   DR Accounts Payable
   *   CR Cash/Bank (bankGLAccountId)
   *
   * @param allocationId - PaymentAllocation ID
   * @param bankGLAccountId - GL account for the cash/bank side
   */
  async postPaymentAllocation(allocationId: string, bankGLAccountId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Load allocation with payment and linked document
      const allocation = await tx.paymentAllocation.findUnique({
        where: { id: allocationId },
        include: {
          payment: {
            include: {
              entity: { select: { id: true, tenantId: true, functionalCurrency: true } },
              client: { select: { id: true, name: true } },
              vendor: { select: { id: true, name: true } },
            },
          },
          invoice: { select: { id: true, invoiceNumber: true } },
          bill: { select: { id: true, billNumber: true } },
        },
      });

      if (!allocation) {
        throw new AccountingError('Payment allocation not found', 'GL_ACCOUNT_NOT_FOUND', 404);
      }

      // Tenant isolation
      if (allocation.payment.entity.tenantId !== this.tenantId) {
        throw new AccountingError('Payment allocation not found', 'GL_ACCOUNT_NOT_FOUND', 404);
      }

      // 2. Check not already posted
      const existingJE = await tx.journalEntry.findFirst({
        where: {
          sourceType: 'PAYMENT',
          sourceId: allocationId,
          deletedAt: null,
          status: { not: 'VOIDED' },
        },
        select: { id: true },
      });

      if (existingJE) {
        throw new AccountingError(
          'Payment allocation is already posted',
          'ALREADY_POSTED',
          409,
          { journalEntryId: existingJE.id }
        );
      }

      const entityId = allocation.payment.entityId;

      // 3. Fiscal period check
      await this.checkFiscalPeriod(tx, entityId, allocation.payment.date);

      // 4. Validate bank GL account
      const bankGL = await tx.gLAccount.findFirst({
        where: {
          id: bankGLAccountId,
          entityId,
          entity: { tenantId: this.tenantId },
          isActive: true,
        },
        select: { id: true },
      });

      if (!bankGL) {
        throw new AccountingError(
          'Bank GL account not found or inactive',
          'GL_ACCOUNT_NOT_FOUND',
          404
        );
      }

      // 5. Determine AR vs AP payment
      const isARPayment = !!allocation.invoiceId;
      const isAPPayment = !!allocation.billId;

      if (!isARPayment && !isAPPayment) {
        throw new AccountingError(
          'Allocation must be linked to an invoice or bill',
          'UNBALANCED_ENTRY',
          400
        );
      }

      // 6. Resolve counterparty GL account
      const counterCode = isARPayment
        ? WELL_KNOWN_CODES.ACCOUNTS_RECEIVABLE
        : WELL_KNOWN_CODES.ACCOUNTS_PAYABLE;
      const counterAccount = await this.resolveGLAccountByCode(tx, entityId, counterCode);

      // 7. Build journal lines (with multi-currency support)
      const docRef = isARPayment
        ? `Invoice ${allocation.invoice!.invoiceNumber}`
        : `Bill ${allocation.bill!.billNumber}`;
      const counterpartyName = isARPayment
        ? allocation.payment.client?.name ?? 'Customer'
        : allocation.payment.vendor?.name ?? 'Vendor';

      // Determine if FX conversion is needed
      const needsFxConversion = allocation.payment.currency !== allocation.payment.entity.functionalCurrency;
      let fxRate = 1.0;

      if (needsFxConversion) {
        const fxService = new FxRateService();
        fxRate = await fxService.getRate(
          allocation.payment.currency,
          allocation.payment.entity.functionalCurrency,
          allocation.payment.date
        );
      }

      const lines = isARPayment
        ? [
            // AR Payment: DR Bank, CR AR
            {
              glAccountId: bankGLAccountId,
              debitAmount: allocation.amount,
              creditAmount: 0,
              memo: `Payment received: ${docRef} — ${counterpartyName}`,
              currency: allocation.payment.currency,
              ...(needsFxConversion && {
                exchangeRate: fxRate,
                baseCurrencyDebit: Math.round(allocation.amount * fxRate),
                baseCurrencyCredit: 0,
              }),
            },
            {
              glAccountId: counterAccount.id,
              debitAmount: 0,
              creditAmount: allocation.amount,
              memo: `AR reduction: ${docRef}`,
              currency: allocation.payment.currency,
              ...(needsFxConversion && {
                exchangeRate: fxRate,
                baseCurrencyDebit: 0,
                baseCurrencyCredit: Math.round(allocation.amount * fxRate),
              }),
            },
          ]
        : [
            // AP Payment: DR AP, CR Bank
            {
              glAccountId: counterAccount.id,
              debitAmount: allocation.amount,
              creditAmount: 0,
              memo: `AP reduction: ${docRef}`,
              currency: allocation.payment.currency,
              ...(needsFxConversion && {
                exchangeRate: fxRate,
                baseCurrencyDebit: Math.round(allocation.amount * fxRate),
                baseCurrencyCredit: 0,
              }),
            },
            {
              glAccountId: bankGLAccountId,
              debitAmount: 0,
              creditAmount: allocation.amount,
              memo: `Payment sent: ${docRef} — ${counterpartyName}`,
              currency: allocation.payment.currency,
              ...(needsFxConversion && {
                exchangeRate: fxRate,
                baseCurrencyDebit: 0,
                baseCurrencyCredit: Math.round(allocation.amount * fxRate),
              }),
            },
          ];

      // 8. Generate entry number
      const entryNumber = await generateEntryNumber(tx, entityId);

      // 9. Source document snapshot
      const sourceDocument = {
        allocationId: allocation.id,
        paymentId: allocation.paymentId,
        invoiceId: allocation.invoiceId,
        billId: allocation.billId,
        amount: allocation.amount,
        paymentDate: allocation.payment.date,
        paymentMethod: allocation.payment.paymentMethod,
        reference: allocation.payment.reference,
        capturedAt: new Date().toISOString(),
      };

      // 10. Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          entityId,
          entryNumber,
          date: allocation.payment.date,
          memo: `Payment: ${docRef} — ${counterpartyName}`,
          sourceType: 'PAYMENT',
          sourceId: allocationId,
          sourceDocument: sourceDocument as unknown as Prisma.InputJsonValue,
          status: 'POSTED',
          createdBy: this.userId,
          journalLines: { create: lines },
        },
        select: {
          id: true,
          entryNumber: true,
          journalLines: {
            select: {
              id: true,
              glAccountId: true,
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
      });

      // 11. Audit log (transaction-safe — ARCH-6)
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId,
        model: 'JournalEntry',
        recordId: journalEntry.id,
        action: 'CREATE',
        after: {
          entryNumber: journalEntry.entryNumber,
          sourceType: 'PAYMENT',
          sourceId: allocationId,
          status: 'POSTED',
          amount: allocation.amount,
          type: isARPayment ? 'AR' : 'AP',
        },
      }, tx);

      // 12. Invalidate report cache (defensive - non-critical, swallow errors)
      try {
        reportCache.invalidate(this.tenantId, /^report:/);
      } catch {
        // Intentionally swallowed — cache miss is harmless
      }

      return {
        journalEntryId: journalEntry.id,
        entryNumber: journalEntry.entryNumber,
        allocationId: allocation.id,
        amount: allocation.amount,
        type: isARPayment ? 'AR' as const : 'AP' as const,
        lines: journalEntry.journalLines,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  /**
   * Post an opening balance journal entry for a newly created account.
   *
   * Creates journal entry:
   *   For debit-normal accounts (BANK, INVESTMENT):
   *     DR Account GL (openingBalance)
   *     CR Opening Balance Equity (openingBalance)
   *   For credit-normal accounts (CREDIT_CARD, LOAN, MORTGAGE):
   *     DR Opening Balance Equity (openingBalance)
   *     CR Account GL (openingBalance)
   *
   * Prerequisites:
   *   - Account must already exist
   *   - GL account must be assigned (glAccountId)
   *   - Opening Balance Equity (3300) must exist in entity COA
   *   - Called within an existing prisma.$transaction (receives tx client)
   */
  async postOpeningBalance(
    tx: Prisma.TransactionClient,
    params: {
      accountId: string;
      entityId: string;
      glAccountId: string;
      openingBalance: number; // Integer cents (always positive)
      openingBalanceDate: Date;
      accountName: string;
      accountType: string;
    }
  ) {
    const {
      accountId, entityId, glAccountId,
      openingBalance, openingBalanceDate,
      accountName, accountType,
    } = params;

    // Skip if opening balance is zero
    if (openingBalance === 0) {
      return null;
    }

    // 1. Check idempotency — prevent duplicate opening balance JE
    const existingJE = await tx.journalEntry.findFirst({
      where: {
        sourceType: 'OPENING_BALANCE',
        sourceId: accountId,
        deletedAt: null,
        status: { not: 'VOIDED' },
      },
      select: { id: true },
    });

    if (existingJE) {
      throw new AccountingError(
        'Opening balance already posted for this account',
        'ALREADY_POSTED',
        409,
        { journalEntryId: existingJE.id }
      );
    }

    // 2. Fiscal period check
    await this.checkFiscalPeriod(tx, entityId, openingBalanceDate);

    // 3. Resolve Opening Balance Equity GL account (code 3300)
    const obeAccount = await this.resolveGLAccountByCode(
      tx, entityId, WELL_KNOWN_CODES.OPENING_BALANCE_EQUITY
    );

    // 4. Determine debit/credit direction based on account type
    // Credit-normal accounts: CREDIT_CARD, LOAN, MORTGAGE
    const isCreditNormal = ['CREDIT_CARD', 'LOAN', 'MORTGAGE'].includes(accountType);
    const absAmount = Math.abs(openingBalance);

    const lines = isCreditNormal
      ? [
          // Credit-normal: DR Opening Balance Equity, CR Account GL
          {
            glAccountId: obeAccount.id,
            debitAmount: absAmount,
            creditAmount: 0,
            memo: `Opening balance: ${accountName}`,
          },
          {
            glAccountId: glAccountId,
            debitAmount: 0,
            creditAmount: absAmount,
            memo: `Opening balance: ${accountName}`,
          },
        ]
      : [
          // Debit-normal: DR Account GL, CR Opening Balance Equity
          {
            glAccountId: glAccountId,
            debitAmount: absAmount,
            creditAmount: 0,
            memo: `Opening balance: ${accountName}`,
          },
          {
            glAccountId: obeAccount.id,
            debitAmount: 0,
            creditAmount: absAmount,
            memo: `Opening balance: ${accountName}`,
          },
        ];

    // 5. Validate balance before creating
    const totalDebits = lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredits = lines.reduce((sum, l) => sum + l.creditAmount, 0);
    if (totalDebits !== totalCredits) {
      throw new AccountingError(
        'Opening balance journal entry is unbalanced',
        'UNBALANCED_ENTRY',
        500,
        { totalDebits, totalCredits }
      );
    }

    // 6. Generate entry number
    const entryNumber = await generateEntryNumber(tx, entityId);

    // 7. Source document snapshot
    const sourceDocument = {
      accountId,
      accountName,
      accountType,
      openingBalance,
      openingBalanceDate: openingBalanceDate.toISOString(),
      capturedAt: new Date().toISOString(),
    };

    // 8. Create journal entry
    const journalEntry = await tx.journalEntry.create({
      data: {
        entityId,
        entryNumber,
        date: openingBalanceDate,
        memo: `Opening balance: ${accountName}`,
        sourceType: 'OPENING_BALANCE',
        sourceId: accountId,
        sourceDocument: sourceDocument as unknown as Prisma.InputJsonValue,
        status: 'POSTED',
        createdBy: this.userId,
        journalLines: { create: lines },
      },
      select: {
        id: true,
        entryNumber: true,
        journalLines: {
          select: {
            id: true,
            glAccountId: true,
            debitAmount: true,
            creditAmount: true,
          },
        },
      },
    });

    // 9. Audit log
    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId,
      model: 'JournalEntry',
      recordId: journalEntry.id,
      action: 'CREATE',
      after: {
        entryNumber: journalEntry.entryNumber,
        sourceType: 'OPENING_BALANCE',
        sourceId: accountId,
        status: 'POSTED',
        amount: absAmount,
        accountName,
        accountType,
      },
    }, tx);

    // 10. Invalidate report cache
    try {
      reportCache.invalidate(this.tenantId, /^report:/);
    } catch {
      // Intentionally swallowed — cache miss is harmless
    }

    return {
      journalEntryId: journalEntry.id,
      entryNumber: journalEntry.entryNumber,
      amount: absAmount,
      lines: journalEntry.journalLines,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Find a GL account by well-known code within an entity.
   * Throws if not found (COA must be seeded first).
   */
  private async resolveGLAccountByCode(
    tx: Prisma.TransactionClient,
    entityId: string,
    code: string
  ) {
    const account = await tx.gLAccount.findFirst({
      where: {
        entityId,
        code,
        isActive: true,
      },
      select: { id: true, code: true, name: true },
    });

    if (!account) {
      throw new AccountingError(
        `Required GL account ${code} not found — seed the Chart of Accounts first`,
        'GL_ACCOUNT_NOT_FOUND',
        400,
        { code, entityId }
      );
    }

    return account;
  }

  private async checkFiscalPeriod(
    tx: Prisma.TransactionClient,
    entityId: string,
    date: Date
  ) {
    const period = await tx.fiscalPeriod.findFirst({
      where: {
        fiscalCalendar: { entityId },
        startDate: { lte: date },
        endDate: { gte: date },
        status: { in: ['LOCKED', 'CLOSED'] },
      },
      select: { id: true, name: true, status: true },
    });

    if (period) {
      throw new AccountingError(
        `Cannot post to ${period.status.toLowerCase()} fiscal period: ${period.name}`,
        'FISCAL_PERIOD_CLOSED',
        400,
        { periodId: period.id, periodName: period.name, periodStatus: period.status }
      );
    }
  }

}
