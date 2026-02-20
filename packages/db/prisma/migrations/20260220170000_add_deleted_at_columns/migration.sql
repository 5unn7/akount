-- Add deletedAt columns to financial models for soft delete support
-- Invariant #4: Financial records use soft delete (deletedAt field, never hard delete)

-- JournalEntry and JournalLine
ALTER TABLE "JournalEntry" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "JournalLine" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Invoicing domain
ALTER TABLE "Client" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "InvoiceLine" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Vendors domain
ALTER TABLE "Vendor" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Bill" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "BillLine" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Payments
ALTER TABLE "Payment" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "CreditNote" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Banking domain
ALTER TABLE "Account" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "BankFeedTransaction" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Transaction" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Categories
ALTER TABLE "Category" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add indexes for soft delete queries (WHERE deletedAt IS NULL)
CREATE INDEX "JournalEntry_entityId_deletedAt_idx" ON "JournalEntry"("entityId", "deletedAt");
CREATE INDEX "JournalLine_journalEntryId_deletedAt_idx" ON "JournalLine"("journalEntryId", "deletedAt");
CREATE INDEX "Client_entityId_deletedAt_idx" ON "Client"("entityId", "deletedAt");
CREATE INDEX "Invoice_entityId_deletedAt_idx" ON "Invoice"("entityId", "deletedAt");
CREATE INDEX "InvoiceLine_invoiceId_deletedAt_idx" ON "InvoiceLine"("invoiceId", "deletedAt");
CREATE INDEX "Vendor_entityId_deletedAt_idx" ON "Vendor"("entityId", "deletedAt");
CREATE INDEX "Bill_entityId_deletedAt_idx" ON "Bill"("entityId", "deletedAt");
CREATE INDEX "BillLine_billId_deletedAt_idx" ON "BillLine"("billId", "deletedAt");
CREATE INDEX "Payment_entityId_deletedAt_idx" ON "Payment"("entityId", "deletedAt");
CREATE INDEX "CreditNote_entityId_deletedAt_idx" ON "CreditNote"("entityId", "deletedAt");
CREATE INDEX "Account_entityId_deletedAt_idx" ON "Account"("entityId", "deletedAt");
CREATE INDEX "BankFeedTransaction_accountId_deletedAt_idx" ON "BankFeedTransaction"("accountId", "deletedAt");
CREATE INDEX "Transaction_accountId_deletedAt_idx" ON "Transaction"("accountId", "deletedAt");
