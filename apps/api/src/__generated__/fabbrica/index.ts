import type { Tenant } from "@prisma/client";
import type { TenantUser } from "@prisma/client";
import type { User } from "@prisma/client";
import type { AIConsent } from "@prisma/client";
import type { Entity } from "@prisma/client";
import type { GLAccount } from "@prisma/client";
import type { JournalEntry } from "@prisma/client";
import type { JournalLine } from "@prisma/client";
import type { TaxRate } from "@prisma/client";
import type { FiscalCalendar } from "@prisma/client";
import type { FiscalPeriod } from "@prisma/client";
import type { Client } from "@prisma/client";
import type { Invoice } from "@prisma/client";
import type { InvoiceLine } from "@prisma/client";
import type { Vendor } from "@prisma/client";
import type { Bill } from "@prisma/client";
import type { BillLine } from "@prisma/client";
import type { Payment } from "@prisma/client";
import type { PaymentAllocation } from "@prisma/client";
import type { CreditNote } from "@prisma/client";
import type { Account } from "@prisma/client";
import type { BankConnection } from "@prisma/client";
import type { BankFeedTransaction } from "@prisma/client";
import type { Transaction } from "@prisma/client";
import type { TransactionSplit } from "@prisma/client";
import type { TransactionMatch } from "@prisma/client";
import type { Category } from "@prisma/client";
import type { Budget } from "@prisma/client";
import type { Goal } from "@prisma/client";
import type { Forecast } from "@prisma/client";
import type { Insight } from "@prisma/client";
import type { Rule } from "@prisma/client";
import type { Project } from "@prisma/client";
import type { Snapshot } from "@prisma/client";
import type { FXRate } from "@prisma/client";
import type { AuditLog } from "@prisma/client";
import type { DomainEvent } from "@prisma/client";
import type { ImportBatch } from "@prisma/client";
import type { AccountingPolicy } from "@prisma/client";
import type { ConsolidationElimination } from "@prisma/client";
import type { OnboardingProgress } from "@prisma/client";
import type { OnboardingWizardState } from "@prisma/client";
import type { RuleSuggestion } from "@prisma/client";
import type { FixedAsset } from "@prisma/client";
import type { DepreciationEntry } from "@prisma/client";
import type { AIAction } from "@prisma/client";
import type { AIDecisionLog } from "@prisma/client";
import type { TenantRegion } from "@prisma/client";
import type { TenantStatus } from "@prisma/client";
import type { TenantPlan } from "@prisma/client";
import type { OnboardingStatus } from "@prisma/client";
import type { TenantUserRole } from "@prisma/client";
import type { EntityType } from "@prisma/client";
import type { EntityStatus } from "@prisma/client";
import type { GLAccountType } from "@prisma/client";
import type { NormalBalance } from "@prisma/client";
import type { JournalEntrySourceType } from "@prisma/client";
import type { JournalEntryStatus } from "@prisma/client";
import type { FiscalPeriodStatus } from "@prisma/client";
import type { InvoiceStatus } from "@prisma/client";
import type { BillStatus } from "@prisma/client";
import type { PaymentMethod } from "@prisma/client";
import type { CreditNoteStatus } from "@prisma/client";
import type { AccountType } from "@prisma/client";
import type { BankConnectionProvider } from "@prisma/client";
import type { BankConnectionStatus } from "@prisma/client";
import type { BankFeedStatus } from "@prisma/client";
import type { TransactionSourceType } from "@prisma/client";
import type { TransactionMatchStatus } from "@prisma/client";
import type { CategoryType } from "@prisma/client";
import type { BudgetPeriod } from "@prisma/client";
import type { GoalType } from "@prisma/client";
import type { GoalStatus } from "@prisma/client";
import type { ForecastType } from "@prisma/client";
import type { ForecastScenario } from "@prisma/client";
import type { RuleSource } from "@prisma/client";
import type { AuditAction } from "@prisma/client";
import type { ImportBatchSourceType } from "@prisma/client";
import type { ImportBatchStatus } from "@prisma/client";
import type { RuleSuggestionStatus } from "@prisma/client";
import type { AssetCategory } from "@prisma/client";
import type { DepreciationMethod } from "@prisma/client";
import type { AssetStatus } from "@prisma/client";
import type { AIActionType } from "@prisma/client";
import type { AIActionStatus } from "@prisma/client";
import type { AIActionPriority } from "@prisma/client";
import type { AIDecisionType } from "@prisma/client";
import type { AIRoutingResult } from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";
import { createInitializer, createScreener, getScalarFieldValueGenerator, normalizeResolver, normalizeList, getSequenceCounter, createCallbackChain, destructure } from "@quramy/prisma-fabbrica/lib/internal";
import type { ModelWithFields, Resolver, } from "@quramy/prisma-fabbrica/lib/internal";
export { resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";

type BuildDataOptions<TTransients extends Record<string, unknown>> = {
    readonly seq: number;
} & TTransients;

type TraitName = string | symbol;

type CallbackDefineOptions<TCreated, TCreateInput, TTransients extends Record<string, unknown>> = {
    onAfterBuild?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onBeforeCreate?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onAfterCreate?: (created: TCreated, transientFields: TTransients) => void | PromiseLike<void>;
};

const initializer = createInitializer();

const { getClient } = initializer;

export const { initialize } = initializer;

const modelFieldDefinitions: ModelWithFields[] = [{
        name: "Tenant",
        fields: [{
                name: "accountingPolicies",
                type: "AccountingPolicy",
                relationName: "AccountingPolicyToTenant"
            }, {
                name: "auditLogs",
                type: "AuditLog",
                relationName: "AuditLogToTenant"
            }, {
                name: "events",
                type: "DomainEvent",
                relationName: "DomainEventToTenant"
            }, {
                name: "entities",
                type: "Entity",
                relationName: "EntityToTenant"
            }, {
                name: "importBatches",
                type: "ImportBatch",
                relationName: "ImportBatchToTenant"
            }, {
                name: "memberships",
                type: "TenantUser",
                relationName: "TenantToTenantUser"
            }, {
                name: "categories",
                type: "Category",
                relationName: "CategoryToTenant"
            }, {
                name: "onboardingProgress",
                type: "OnboardingProgress",
                relationName: "OnboardingProgressToTenant"
            }, {
                name: "aiDecisionLogs",
                type: "AIDecisionLog",
                relationName: "AIDecisionLogToTenant"
            }, {
                name: "aiConsents",
                type: "AIConsent",
                relationName: "AIConsentToTenant"
            }]
    }, {
        name: "TenantUser",
        fields: [{
                name: "tenant",
                type: "Tenant",
                relationName: "TenantToTenantUser"
            }, {
                name: "user",
                type: "User",
                relationName: "TenantUserToUser"
            }]
    }, {
        name: "User",
        fields: [{
                name: "auditLogs",
                type: "AuditLog",
                relationName: "AuditLogToUser"
            }, {
                name: "memberships",
                type: "TenantUser",
                relationName: "TenantUserToUser"
            }, {
                name: "aiConsent",
                type: "AIConsent",
                relationName: "AIConsentToUser"
            }]
    }, {
        name: "AIConsent",
        fields: [{
                name: "user",
                type: "User",
                relationName: "AIConsentToUser"
            }, {
                name: "tenant",
                type: "Tenant",
                relationName: "AIConsentToTenant"
            }]
    }, {
        name: "Entity",
        fields: [{
                name: "accounts",
                type: "Account",
                relationName: "AccountToEntity"
            }, {
                name: "accountingPolicies",
                type: "AccountingPolicy",
                relationName: "AccountingPolicyToEntity"
            }, {
                name: "auditLogs",
                type: "AuditLog",
                relationName: "AuditLogToEntity"
            }, {
                name: "bankConnections",
                type: "BankConnection",
                relationName: "BankConnectionToEntity"
            }, {
                name: "bills",
                type: "Bill",
                relationName: "BillToEntity"
            }, {
                name: "budgets",
                type: "Budget",
                relationName: "BudgetToEntity"
            }, {
                name: "clients",
                type: "Client",
                relationName: "ClientToEntity"
            }, {
                name: "creditNotes",
                type: "CreditNote",
                relationName: "CreditNoteToEntity"
            }, {
                name: "events",
                type: "DomainEvent",
                relationName: "DomainEventToEntity"
            }, {
                name: "tenant",
                type: "Tenant",
                relationName: "EntityToTenant"
            }, {
                name: "fiscalCalendars",
                type: "FiscalCalendar",
                relationName: "EntityToFiscalCalendar"
            }, {
                name: "glAccounts",
                type: "GLAccount",
                relationName: "EntityToGLAccount"
            }, {
                name: "forecasts",
                type: "Forecast",
                relationName: "EntityToForecast"
            }, {
                name: "goals",
                type: "Goal",
                relationName: "EntityToGoal"
            }, {
                name: "importBatches",
                type: "ImportBatch",
                relationName: "EntityToImportBatch"
            }, {
                name: "insights",
                type: "Insight",
                relationName: "EntityToInsight"
            }, {
                name: "invoices",
                type: "Invoice",
                relationName: "EntityToInvoice"
            }, {
                name: "journalEntries",
                type: "JournalEntry",
                relationName: "EntityToJournalEntry"
            }, {
                name: "payments",
                type: "Payment",
                relationName: "EntityToPayment"
            }, {
                name: "projects",
                type: "Project",
                relationName: "EntityToProject"
            }, {
                name: "rules",
                type: "Rule",
                relationName: "EntityToRule"
            }, {
                name: "fixedAssets",
                type: "FixedAsset",
                relationName: "EntityToFixedAsset"
            }, {
                name: "taxRates",
                type: "TaxRate",
                relationName: "EntityToTaxRate"
            }, {
                name: "vendors",
                type: "Vendor",
                relationName: "EntityToVendor"
            }, {
                name: "aiActions",
                type: "AIAction",
                relationName: "AIActionToEntity"
            }, {
                name: "aiDecisionLogs",
                type: "AIDecisionLog",
                relationName: "AIDecisionLogToEntity"
            }]
    }, {
        name: "GLAccount",
        fields: [{
                name: "bankAccounts",
                type: "Account",
                relationName: "AccountToGLAccount"
            }, {
                name: "billLines",
                type: "BillLine",
                relationName: "BillLineToGLAccount"
            }, {
                name: "entity",
                type: "Entity",
                relationName: "EntityToGLAccount"
            }, {
                name: "parentAccount",
                type: "GLAccount",
                relationName: "AccountHierarchy"
            }, {
                name: "childAccounts",
                type: "GLAccount",
                relationName: "AccountHierarchy"
            }, {
                name: "invoiceLines",
                type: "InvoiceLine",
                relationName: "GLAccountToInvoiceLine"
            }, {
                name: "journalLines",
                type: "JournalLine",
                relationName: "GLAccountToJournalLine"
            }, {
                name: "transactionSplits",
                type: "TransactionSplit",
                relationName: "GLAccountToTransactionSplit"
            }, {
                name: "categoriesAsDefault",
                type: "Category",
                relationName: "CategoryDefaultGL"
            }, {
                name: "budgetsAsGLAccount",
                type: "Budget",
                relationName: "BudgetGLAccount"
            }, {
                name: "goalsAsGLAccount",
                type: "Goal",
                relationName: "GoalGLAccount"
            }, {
                name: "fixedAssetsAsAsset",
                type: "FixedAsset",
                relationName: "AssetGLAccount"
            }, {
                name: "fixedAssetsAsDepreciationExpense",
                type: "FixedAsset",
                relationName: "DepreciationExpenseGLAccount"
            }, {
                name: "fixedAssetsAsAccumulatedDepr",
                type: "FixedAsset",
                relationName: "AccumulatedDepreciationGLAccount"
            }]
    }, {
        name: "JournalEntry",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToJournalEntry"
            }, {
                name: "linkedEntry",
                type: "JournalEntry",
                relationName: "TransferPair"
            }, {
                name: "linkedFrom",
                type: "JournalEntry",
                relationName: "TransferPair"
            }, {
                name: "journalLines",
                type: "JournalLine",
                relationName: "JournalEntryToJournalLine"
            }, {
                name: "transactions",
                type: "Transaction",
                relationName: "JournalEntryToTransaction"
            }, {
                name: "depreciationEntries",
                type: "DepreciationEntry",
                relationName: "DepreciationEntryToJournalEntry"
            }]
    }, {
        name: "JournalLine",
        fields: [{
                name: "glAccount",
                type: "GLAccount",
                relationName: "GLAccountToJournalLine"
            }, {
                name: "journalEntry",
                type: "JournalEntry",
                relationName: "JournalEntryToJournalLine"
            }]
    }, {
        name: "TaxRate",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToTaxRate"
            }, {
                name: "invoiceLines",
                type: "InvoiceLine",
                relationName: "InvoiceLineTaxRate"
            }, {
                name: "billLines",
                type: "BillLine",
                relationName: "BillLineTaxRate"
            }]
    }, {
        name: "FiscalCalendar",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToFiscalCalendar"
            }, {
                name: "periods",
                type: "FiscalPeriod",
                relationName: "FiscalCalendarToFiscalPeriod"
            }]
    }, {
        name: "FiscalPeriod",
        fields: [{
                name: "fiscalCalendar",
                type: "FiscalCalendar",
                relationName: "FiscalCalendarToFiscalPeriod"
            }]
    }, {
        name: "Client",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "ClientToEntity"
            }, {
                name: "invoices",
                type: "Invoice",
                relationName: "ClientToInvoice"
            }, {
                name: "payments",
                type: "Payment",
                relationName: "ClientToPayment"
            }]
    }, {
        name: "Invoice",
        fields: [{
                name: "client",
                type: "Client",
                relationName: "ClientToInvoice"
            }, {
                name: "entity",
                type: "Entity",
                relationName: "EntityToInvoice"
            }, {
                name: "invoiceLines",
                type: "InvoiceLine",
                relationName: "InvoiceToInvoiceLine"
            }, {
                name: "paymentAllocations",
                type: "PaymentAllocation",
                relationName: "InvoiceToPaymentAllocation"
            }, {
                name: "creditNotes",
                type: "CreditNote",
                relationName: "CreditNoteToInvoice"
            }]
    }, {
        name: "InvoiceLine",
        fields: [{
                name: "category",
                type: "Category",
                relationName: "CategoryToInvoiceLine"
            }, {
                name: "glAccount",
                type: "GLAccount",
                relationName: "GLAccountToInvoiceLine"
            }, {
                name: "invoice",
                type: "Invoice",
                relationName: "InvoiceToInvoiceLine"
            }, {
                name: "taxRate",
                type: "TaxRate",
                relationName: "InvoiceLineTaxRate"
            }]
    }, {
        name: "Vendor",
        fields: [{
                name: "bills",
                type: "Bill",
                relationName: "BillToVendor"
            }, {
                name: "payments",
                type: "Payment",
                relationName: "PaymentToVendor"
            }, {
                name: "entity",
                type: "Entity",
                relationName: "EntityToVendor"
            }]
    }, {
        name: "Bill",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "BillToEntity"
            }, {
                name: "vendor",
                type: "Vendor",
                relationName: "BillToVendor"
            }, {
                name: "billLines",
                type: "BillLine",
                relationName: "BillToBillLine"
            }, {
                name: "paymentAllocations",
                type: "PaymentAllocation",
                relationName: "BillToPaymentAllocation"
            }, {
                name: "creditNotes",
                type: "CreditNote",
                relationName: "BillToCreditNote"
            }]
    }, {
        name: "BillLine",
        fields: [{
                name: "bill",
                type: "Bill",
                relationName: "BillToBillLine"
            }, {
                name: "category",
                type: "Category",
                relationName: "BillLineToCategory"
            }, {
                name: "glAccount",
                type: "GLAccount",
                relationName: "BillLineToGLAccount"
            }, {
                name: "taxRate",
                type: "TaxRate",
                relationName: "BillLineTaxRate"
            }]
    }, {
        name: "Payment",
        fields: [{
                name: "client",
                type: "Client",
                relationName: "ClientToPayment"
            }, {
                name: "entity",
                type: "Entity",
                relationName: "EntityToPayment"
            }, {
                name: "vendor",
                type: "Vendor",
                relationName: "PaymentToVendor"
            }, {
                name: "allocations",
                type: "PaymentAllocation",
                relationName: "PaymentToPaymentAllocation"
            }]
    }, {
        name: "PaymentAllocation",
        fields: [{
                name: "payment",
                type: "Payment",
                relationName: "PaymentToPaymentAllocation"
            }, {
                name: "invoice",
                type: "Invoice",
                relationName: "InvoiceToPaymentAllocation"
            }, {
                name: "bill",
                type: "Bill",
                relationName: "BillToPaymentAllocation"
            }]
    }, {
        name: "CreditNote",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "CreditNoteToEntity"
            }, {
                name: "linkedInvoice",
                type: "Invoice",
                relationName: "CreditNoteToInvoice"
            }, {
                name: "linkedBill",
                type: "Bill",
                relationName: "BillToCreditNote"
            }]
    }, {
        name: "Account",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "AccountToEntity"
            }, {
                name: "bankConnection",
                type: "BankConnection",
                relationName: "AccountToBankConnection"
            }, {
                name: "feedTxns",
                type: "BankFeedTransaction",
                relationName: "AccountToBankFeedTransaction"
            }, {
                name: "glAccount",
                type: "GLAccount",
                relationName: "AccountToGLAccount"
            }, {
                name: "goals",
                type: "Goal",
                relationName: "AccountToGoal"
            }, {
                name: "transactions",
                type: "Transaction",
                relationName: "AccountToTransaction"
            }]
    }, {
        name: "BankConnection",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "BankConnectionToEntity"
            }, {
                name: "accounts",
                type: "Account",
                relationName: "AccountToBankConnection"
            }, {
                name: "feedTxns",
                type: "BankFeedTransaction",
                relationName: "BankConnectionToBankFeedTransaction"
            }]
    }, {
        name: "BankFeedTransaction",
        fields: [{
                name: "account",
                type: "Account",
                relationName: "AccountToBankFeedTransaction"
            }, {
                name: "bankConnection",
                type: "BankConnection",
                relationName: "BankConnectionToBankFeedTransaction"
            }, {
                name: "transactionMatches",
                type: "TransactionMatch",
                relationName: "BankFeedTransactionToTransactionMatch"
            }]
    }, {
        name: "Transaction",
        fields: [{
                name: "account",
                type: "Account",
                relationName: "AccountToTransaction"
            }, {
                name: "category",
                type: "Category",
                relationName: "CategoryToTransaction"
            }, {
                name: "importBatch",
                type: "ImportBatch",
                relationName: "ImportBatchToTransaction"
            }, {
                name: "journalEntry",
                type: "JournalEntry",
                relationName: "JournalEntryToTransaction"
            }, {
                name: "matches",
                type: "TransactionMatch",
                relationName: "TransactionToTransactionMatch"
            }, {
                name: "splits",
                type: "TransactionSplit",
                relationName: "TransactionToTransactionSplit"
            }]
    }, {
        name: "TransactionSplit",
        fields: [{
                name: "category",
                type: "Category",
                relationName: "CategoryToTransactionSplit"
            }, {
                name: "glAccount",
                type: "GLAccount",
                relationName: "GLAccountToTransactionSplit"
            }, {
                name: "transaction",
                type: "Transaction",
                relationName: "TransactionToTransactionSplit"
            }]
    }, {
        name: "TransactionMatch",
        fields: [{
                name: "bankFeedTransaction",
                type: "BankFeedTransaction",
                relationName: "BankFeedTransactionToTransactionMatch"
            }, {
                name: "transaction",
                type: "Transaction",
                relationName: "TransactionToTransactionMatch"
            }]
    }, {
        name: "Category",
        fields: [{
                name: "tenant",
                type: "Tenant",
                relationName: "CategoryToTenant"
            }, {
                name: "billLines",
                type: "BillLine",
                relationName: "BillLineToCategory"
            }, {
                name: "budgets",
                type: "Budget",
                relationName: "BudgetToCategory"
            }, {
                name: "defaultGLAccount",
                type: "GLAccount",
                relationName: "CategoryDefaultGL"
            }, {
                name: "parentCategory",
                type: "Category",
                relationName: "CategoryHierarchy"
            }, {
                name: "childCategories",
                type: "Category",
                relationName: "CategoryHierarchy"
            }, {
                name: "goals",
                type: "Goal",
                relationName: "CategoryToGoal"
            }, {
                name: "invoiceLines",
                type: "InvoiceLine",
                relationName: "CategoryToInvoiceLine"
            }, {
                name: "snapshots",
                type: "Snapshot",
                relationName: "CategoryToSnapshot"
            }, {
                name: "transactions",
                type: "Transaction",
                relationName: "CategoryToTransaction"
            }, {
                name: "transactionSplits",
                type: "TransactionSplit",
                relationName: "CategoryToTransactionSplit"
            }]
    }, {
        name: "Budget",
        fields: [{
                name: "category",
                type: "Category",
                relationName: "BudgetToCategory"
            }, {
                name: "entity",
                type: "Entity",
                relationName: "BudgetToEntity"
            }, {
                name: "glAccount",
                type: "GLAccount",
                relationName: "BudgetGLAccount"
            }]
    }, {
        name: "Goal",
        fields: [{
                name: "account",
                type: "Account",
                relationName: "AccountToGoal"
            }, {
                name: "category",
                type: "Category",
                relationName: "CategoryToGoal"
            }, {
                name: "entity",
                type: "Entity",
                relationName: "EntityToGoal"
            }, {
                name: "glAccount",
                type: "GLAccount",
                relationName: "GoalGLAccount"
            }]
    }, {
        name: "Forecast",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToForecast"
            }]
    }, {
        name: "Insight",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToInsight"
            }]
    }, {
        name: "Rule",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToRule"
            }]
    }, {
        name: "Project",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToProject"
            }]
    }, {
        name: "Snapshot",
        fields: [{
                name: "category",
                type: "Category",
                relationName: "CategoryToSnapshot"
            }]
    }, {
        name: "FXRate",
        fields: []
    }, {
        name: "AuditLog",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "AuditLogToEntity"
            }, {
                name: "tenant",
                type: "Tenant",
                relationName: "AuditLogToTenant"
            }, {
                name: "user",
                type: "User",
                relationName: "AuditLogToUser"
            }]
    }, {
        name: "DomainEvent",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "DomainEventToEntity"
            }, {
                name: "tenant",
                type: "Tenant",
                relationName: "DomainEventToTenant"
            }]
    }, {
        name: "ImportBatch",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToImportBatch"
            }, {
                name: "tenant",
                type: "Tenant",
                relationName: "ImportBatchToTenant"
            }, {
                name: "transactions",
                type: "Transaction",
                relationName: "ImportBatchToTransaction"
            }]
    }, {
        name: "AccountingPolicy",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "AccountingPolicyToEntity"
            }, {
                name: "tenant",
                type: "Tenant",
                relationName: "AccountingPolicyToTenant"
            }]
    }, {
        name: "ConsolidationElimination",
        fields: []
    }, {
        name: "OnboardingProgress",
        fields: [{
                name: "tenant",
                type: "Tenant",
                relationName: "OnboardingProgressToTenant"
            }]
    }, {
        name: "OnboardingWizardState",
        fields: []
    }, {
        name: "RuleSuggestion",
        fields: []
    }, {
        name: "FixedAsset",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "EntityToFixedAsset"
            }, {
                name: "assetGLAccount",
                type: "GLAccount",
                relationName: "AssetGLAccount"
            }, {
                name: "depreciationExpenseGLAccount",
                type: "GLAccount",
                relationName: "DepreciationExpenseGLAccount"
            }, {
                name: "accumulatedDepreciationGLAccount",
                type: "GLAccount",
                relationName: "AccumulatedDepreciationGLAccount"
            }, {
                name: "depreciationEntries",
                type: "DepreciationEntry",
                relationName: "DepreciationEntryToFixedAsset"
            }]
    }, {
        name: "DepreciationEntry",
        fields: [{
                name: "fixedAsset",
                type: "FixedAsset",
                relationName: "DepreciationEntryToFixedAsset"
            }, {
                name: "journalEntry",
                type: "JournalEntry",
                relationName: "DepreciationEntryToJournalEntry"
            }]
    }, {
        name: "AIAction",
        fields: [{
                name: "entity",
                type: "Entity",
                relationName: "AIActionToEntity"
            }]
    }, {
        name: "AIDecisionLog",
        fields: [{
                name: "tenant",
                type: "Tenant",
                relationName: "AIDecisionLogToTenant"
            }, {
                name: "entity",
                type: "Entity",
                relationName: "AIDecisionLogToEntity"
            }]
    }];

type TenantScalarOrEnumFields = {
    name: string;
    region: TenantRegion;
    status: TenantStatus;
    plan: TenantPlan;
};

type TenantonboardingProgressFactory = {
    _factoryFor: "OnboardingProgress";
    build: () => PromiseLike<Prisma.OnboardingProgressCreateNestedOneWithoutTenantInput["create"]>;
};

type TenantFactoryDefineInput = {
    id?: string;
    name?: string;
    region?: TenantRegion;
    status?: TenantStatus;
    plan?: TenantPlan;
    createdAt?: Date;
    updatedAt?: Date;
    onboardingStatus?: OnboardingStatus;
    onboardingStep?: string | null;
    onboardingData?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    onboardingCompletedAt?: Date | null;
    aiMonthlyBudgetCents?: number | null;
    aiCurrentMonthSpendCents?: number;
    aiSpendResetDate?: Date | null;
    accountingPolicies?: Prisma.AccountingPolicyCreateNestedManyWithoutTenantInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutTenantInput;
    events?: Prisma.DomainEventCreateNestedManyWithoutTenantInput;
    entities?: Prisma.EntityCreateNestedManyWithoutTenantInput;
    importBatches?: Prisma.ImportBatchCreateNestedManyWithoutTenantInput;
    memberships?: Prisma.TenantUserCreateNestedManyWithoutTenantInput;
    categories?: Prisma.CategoryCreateNestedManyWithoutTenantInput;
    onboardingProgress?: TenantonboardingProgressFactory | Prisma.OnboardingProgressCreateNestedOneWithoutTenantInput;
    aiDecisionLogs?: Prisma.AIDecisionLogCreateNestedManyWithoutTenantInput;
    aiConsents?: Prisma.AIConsentCreateNestedManyWithoutTenantInput;
};

type TenantTransientFields = Record<string, unknown> & Partial<Record<keyof TenantFactoryDefineInput, never>>;

type TenantFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TenantFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Tenant, Prisma.TenantCreateInput, TTransients>;

type TenantFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<TenantFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: TenantFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Tenant, Prisma.TenantCreateInput, TTransients>;

function isTenantonboardingProgressFactory(x: TenantonboardingProgressFactory | Prisma.OnboardingProgressCreateNestedOneWithoutTenantInput | undefined): x is TenantonboardingProgressFactory {
    return (x as any)?._factoryFor === "OnboardingProgress";
}

type TenantTraitKeys<TOptions extends TenantFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface TenantFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Tenant";
    build(inputData?: Partial<Prisma.TenantCreateInput & TTransients>): PromiseLike<Prisma.TenantCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TenantCreateInput & TTransients>): PromiseLike<Prisma.TenantCreateInput>;
    buildList(list: readonly Partial<Prisma.TenantCreateInput & TTransients>[]): PromiseLike<Prisma.TenantCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TenantCreateInput & TTransients>): PromiseLike<Prisma.TenantCreateInput[]>;
    pickForConnect(inputData: Tenant): Pick<Tenant, "id">;
    create(inputData?: Partial<Prisma.TenantCreateInput & TTransients>): PromiseLike<Tenant>;
    createList(list: readonly Partial<Prisma.TenantCreateInput & TTransients>[]): PromiseLike<Tenant[]>;
    createList(count: number, item?: Partial<Prisma.TenantCreateInput & TTransients>): PromiseLike<Tenant[]>;
    createForConnect(inputData?: Partial<Prisma.TenantCreateInput & TTransients>): PromiseLike<Pick<Tenant, "id">>;
}

export interface TenantFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TenantFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TenantFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateTenantScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TenantScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Tenant", fieldName: "name", isId: false, isUnique: false, seq }),
        region: "CA",
        status: "TRIAL",
        plan: "FREE"
    };
}

function defineTenantFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends TenantFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): TenantFactoryInterface<TTransients, TenantTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly TenantTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Tenant", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.TenantCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTenantScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<TenantFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<TenantFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                onboardingProgress: isTenantonboardingProgressFactory(defaultData.onboardingProgress) ? {
                    create: await defaultData.onboardingProgress.build()
                } : defaultData.onboardingProgress
            } as Prisma.TenantCreateInput;
            const data: Prisma.TenantCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TenantCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Tenant) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.TenantCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().tenant.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TenantCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.TenantCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Tenant" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: TenantTraitKeys<TOptions>, ...names: readonly TenantTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface TenantFactoryBuilder {
    <TOptions extends TenantFactoryDefineOptions>(options?: TOptions): TenantFactoryInterface<{}, TenantTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TenantTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TenantFactoryDefineOptions<TTransients>>(options?: TOptions) => TenantFactoryInterface<TTransients, TenantTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Tenant} model.
 *
 * @param options
 * @returns factory {@link TenantFactoryInterface}
 */
export const defineTenantFactory = (<TOptions extends TenantFactoryDefineOptions>(options?: TOptions): TenantFactoryInterface<TOptions> => {
    return defineTenantFactoryInternal(options ?? {}, {});
}) as TenantFactoryBuilder;

defineTenantFactory.withTransientFields = defaultTransientFieldValues => options => defineTenantFactoryInternal(options ?? {}, defaultTransientFieldValues);

type TenantUserScalarOrEnumFields = {
    role: TenantUserRole;
};

type TenantUsertenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutMembershipsInput["create"]>;
};

type TenantUseruserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutMembershipsInput["create"]>;
};

type TenantUserFactoryDefineInput = {
    id?: string;
    role?: TenantUserRole;
    createdAt?: Date;
    tenant: TenantUsertenantFactory | Prisma.TenantCreateNestedOneWithoutMembershipsInput;
    user: TenantUseruserFactory | Prisma.UserCreateNestedOneWithoutMembershipsInput;
};

type TenantUserTransientFields = Record<string, unknown> & Partial<Record<keyof TenantUserFactoryDefineInput, never>>;

type TenantUserFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TenantUserFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TenantUser, Prisma.TenantUserCreateInput, TTransients>;

type TenantUserFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TenantUserFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TenantUserFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TenantUser, Prisma.TenantUserCreateInput, TTransients>;

function isTenantUsertenantFactory(x: TenantUsertenantFactory | Prisma.TenantCreateNestedOneWithoutMembershipsInput | undefined): x is TenantUsertenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

function isTenantUseruserFactory(x: TenantUseruserFactory | Prisma.UserCreateNestedOneWithoutMembershipsInput | undefined): x is TenantUseruserFactory {
    return (x as any)?._factoryFor === "User";
}

type TenantUserTraitKeys<TOptions extends TenantUserFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface TenantUserFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TenantUser";
    build(inputData?: Partial<Prisma.TenantUserCreateInput & TTransients>): PromiseLike<Prisma.TenantUserCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TenantUserCreateInput & TTransients>): PromiseLike<Prisma.TenantUserCreateInput>;
    buildList(list: readonly Partial<Prisma.TenantUserCreateInput & TTransients>[]): PromiseLike<Prisma.TenantUserCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TenantUserCreateInput & TTransients>): PromiseLike<Prisma.TenantUserCreateInput[]>;
    pickForConnect(inputData: TenantUser): Pick<TenantUser, "id">;
    create(inputData?: Partial<Prisma.TenantUserCreateInput & TTransients>): PromiseLike<TenantUser>;
    createList(list: readonly Partial<Prisma.TenantUserCreateInput & TTransients>[]): PromiseLike<TenantUser[]>;
    createList(count: number, item?: Partial<Prisma.TenantUserCreateInput & TTransients>): PromiseLike<TenantUser[]>;
    createForConnect(inputData?: Partial<Prisma.TenantUserCreateInput & TTransients>): PromiseLike<Pick<TenantUser, "id">>;
}

export interface TenantUserFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TenantUserFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TenantUserFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateTenantUserScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TenantUserScalarOrEnumFields {
    return {
        role: "OWNER"
    };
}

function defineTenantUserFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends TenantUserFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): TenantUserFactoryInterface<TTransients, TenantUserTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly TenantUserTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TenantUser", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.TenantUserCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTenantUserScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<TenantUserFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<TenantUserFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                tenant: isTenantUsertenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant,
                user: isTenantUseruserFactory(defaultData.user) ? {
                    create: await defaultData.user.build()
                } : defaultData.user
            } as Prisma.TenantUserCreateInput;
            const data: Prisma.TenantUserCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TenantUserCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: TenantUser) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.TenantUserCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().tenantUser.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TenantUserCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.TenantUserCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TenantUser" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: TenantUserTraitKeys<TOptions>, ...names: readonly TenantUserTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface TenantUserFactoryBuilder {
    <TOptions extends TenantUserFactoryDefineOptions>(options: TOptions): TenantUserFactoryInterface<{}, TenantUserTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TenantUserTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TenantUserFactoryDefineOptions<TTransients>>(options: TOptions) => TenantUserFactoryInterface<TTransients, TenantUserTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link TenantUser} model.
 *
 * @param options
 * @returns factory {@link TenantUserFactoryInterface}
 */
export const defineTenantUserFactory = (<TOptions extends TenantUserFactoryDefineOptions>(options: TOptions): TenantUserFactoryInterface<TOptions> => {
    return defineTenantUserFactoryInternal(options, {});
}) as TenantUserFactoryBuilder;

defineTenantUserFactory.withTransientFields = defaultTransientFieldValues => options => defineTenantUserFactoryInternal(options, defaultTransientFieldValues);

type UserScalarOrEnumFields = {
    email: string;
};

type UseraiConsentFactory = {
    _factoryFor: "AIConsent";
    build: () => PromiseLike<Prisma.AIConsentCreateNestedOneWithoutUserInput["create"]>;
};

type UserFactoryDefineInput = {
    id?: string;
    email?: string;
    name?: string | null;
    phoneNumber?: string | null;
    timezone?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    clerkUserId?: string | null;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutUserInput;
    memberships?: Prisma.TenantUserCreateNestedManyWithoutUserInput;
    aiConsent?: UseraiConsentFactory | Prisma.AIConsentCreateNestedOneWithoutUserInput;
};

type UserTransientFields = Record<string, unknown> & Partial<Record<keyof UserFactoryDefineInput, never>>;

type UserFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<User, Prisma.UserCreateInput, TTransients>;

type UserFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<UserFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: UserFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<User, Prisma.UserCreateInput, TTransients>;

function isUseraiConsentFactory(x: UseraiConsentFactory | Prisma.AIConsentCreateNestedOneWithoutUserInput | undefined): x is UseraiConsentFactory {
    return (x as any)?._factoryFor === "AIConsent";
}

type UserTraitKeys<TOptions extends UserFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface UserFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "User";
    build(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput>;
    buildList(list: readonly Partial<Prisma.UserCreateInput & TTransients>[]): PromiseLike<Prisma.UserCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput[]>;
    pickForConnect(inputData: User): Pick<User, "id">;
    create(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<User>;
    createList(list: readonly Partial<Prisma.UserCreateInput & TTransients>[]): PromiseLike<User[]>;
    createList(count: number, item?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<User[]>;
    createForConnect(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Pick<User, "id">>;
}

export interface UserFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateUserScalarsOrEnums({ seq }: {
    readonly seq: number;
}): UserScalarOrEnumFields {
    return {
        email: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "email", isId: false, isUnique: true, seq })
    };
}

function defineUserFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends UserFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): UserFactoryInterface<TTransients, UserTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly UserTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("User", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.UserCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<UserFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<UserFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                aiConsent: isUseraiConsentFactory(defaultData.aiConsent) ? {
                    create: await defaultData.aiConsent.build()
                } : defaultData.aiConsent
            } as Prisma.UserCreateInput;
            const data: Prisma.UserCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.UserCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: User) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.UserCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().user.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.UserCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.UserCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "User" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: UserTraitKeys<TOptions>, ...names: readonly UserTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface UserFactoryBuilder {
    <TOptions extends UserFactoryDefineOptions>(options?: TOptions): UserFactoryInterface<{}, UserTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserFactoryDefineOptions<TTransients>>(options?: TOptions) => UserFactoryInterface<TTransients, UserTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export const defineUserFactory = (<TOptions extends UserFactoryDefineOptions>(options?: TOptions): UserFactoryInterface<TOptions> => {
    return defineUserFactoryInternal(options ?? {}, {});
}) as UserFactoryBuilder;

defineUserFactory.withTransientFields = defaultTransientFieldValues => options => defineUserFactoryInternal(options ?? {}, defaultTransientFieldValues);

type AIConsentScalarOrEnumFields = {};

type AIConsentuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutAiConsentInput["create"]>;
};

type AIConsenttenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutAiConsentsInput["create"]>;
};

type AIConsentFactoryDefineInput = {
    id?: string;
    autoCreateBills?: boolean;
    autoCreateInvoices?: boolean;
    autoMatchTransactions?: boolean;
    autoCategorize?: boolean;
    useCorrectionsForLearning?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    user: AIConsentuserFactory | Prisma.UserCreateNestedOneWithoutAiConsentInput;
    tenant: AIConsenttenantFactory | Prisma.TenantCreateNestedOneWithoutAiConsentsInput;
};

type AIConsentTransientFields = Record<string, unknown> & Partial<Record<keyof AIConsentFactoryDefineInput, never>>;

type AIConsentFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AIConsentFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<AIConsent, Prisma.AIConsentCreateInput, TTransients>;

type AIConsentFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<AIConsentFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: AIConsentFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<AIConsent, Prisma.AIConsentCreateInput, TTransients>;

function isAIConsentuserFactory(x: AIConsentuserFactory | Prisma.UserCreateNestedOneWithoutAiConsentInput | undefined): x is AIConsentuserFactory {
    return (x as any)?._factoryFor === "User";
}

function isAIConsenttenantFactory(x: AIConsenttenantFactory | Prisma.TenantCreateNestedOneWithoutAiConsentsInput | undefined): x is AIConsenttenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

type AIConsentTraitKeys<TOptions extends AIConsentFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface AIConsentFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "AIConsent";
    build(inputData?: Partial<Prisma.AIConsentCreateInput & TTransients>): PromiseLike<Prisma.AIConsentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AIConsentCreateInput & TTransients>): PromiseLike<Prisma.AIConsentCreateInput>;
    buildList(list: readonly Partial<Prisma.AIConsentCreateInput & TTransients>[]): PromiseLike<Prisma.AIConsentCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AIConsentCreateInput & TTransients>): PromiseLike<Prisma.AIConsentCreateInput[]>;
    pickForConnect(inputData: AIConsent): Pick<AIConsent, "id">;
    create(inputData?: Partial<Prisma.AIConsentCreateInput & TTransients>): PromiseLike<AIConsent>;
    createList(list: readonly Partial<Prisma.AIConsentCreateInput & TTransients>[]): PromiseLike<AIConsent[]>;
    createList(count: number, item?: Partial<Prisma.AIConsentCreateInput & TTransients>): PromiseLike<AIConsent[]>;
    createForConnect(inputData?: Partial<Prisma.AIConsentCreateInput & TTransients>): PromiseLike<Pick<AIConsent, "id">>;
}

export interface AIConsentFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AIConsentFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AIConsentFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateAIConsentScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AIConsentScalarOrEnumFields {
    return {};
}

function defineAIConsentFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends AIConsentFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): AIConsentFactoryInterface<TTransients, AIConsentTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly AIConsentTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("AIConsent", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.AIConsentCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAIConsentScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<AIConsentFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<AIConsentFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                user: isAIConsentuserFactory(defaultData.user) ? {
                    create: await defaultData.user.build()
                } : defaultData.user,
                tenant: isAIConsenttenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant
            } as Prisma.AIConsentCreateInput;
            const data: Prisma.AIConsentCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AIConsentCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: AIConsent) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.AIConsentCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().aIConsent.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AIConsentCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.AIConsentCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "AIConsent" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: AIConsentTraitKeys<TOptions>, ...names: readonly AIConsentTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface AIConsentFactoryBuilder {
    <TOptions extends AIConsentFactoryDefineOptions>(options: TOptions): AIConsentFactoryInterface<{}, AIConsentTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AIConsentTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AIConsentFactoryDefineOptions<TTransients>>(options: TOptions) => AIConsentFactoryInterface<TTransients, AIConsentTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link AIConsent} model.
 *
 * @param options
 * @returns factory {@link AIConsentFactoryInterface}
 */
export const defineAIConsentFactory = (<TOptions extends AIConsentFactoryDefineOptions>(options: TOptions): AIConsentFactoryInterface<TOptions> => {
    return defineAIConsentFactoryInternal(options, {});
}) as AIConsentFactoryBuilder;

defineAIConsentFactory.withTransientFields = defaultTransientFieldValues => options => defineAIConsentFactoryInternal(options, defaultTransientFieldValues);

type EntityScalarOrEnumFields = {
    name: string;
    type: EntityType;
    country: string;
    functionalCurrency: string;
    reportingCurrency: string;
};

type EntitytenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutEntitiesInput["create"]>;
};

type EntityFactoryDefineInput = {
    id?: string;
    name?: string;
    type?: EntityType;
    status?: EntityStatus;
    country?: string;
    taxId?: string | null;
    functionalCurrency?: string;
    reportingCurrency?: string;
    createdAt?: Date;
    updatedAt?: Date;
    fiscalYearStart?: number | null;
    entitySubType?: string | null;
    registrationDate?: Date | null;
    industryCode?: string | null;
    coaTemplateUsed?: string | null;
    setupCompletedAt?: Date | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    industry?: string | null;
    businessSize?: string | null;
    accounts?: Prisma.AccountCreateNestedManyWithoutEntityInput;
    accountingPolicies?: Prisma.AccountingPolicyCreateNestedManyWithoutEntityInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutEntityInput;
    bankConnections?: Prisma.BankConnectionCreateNestedManyWithoutEntityInput;
    bills?: Prisma.BillCreateNestedManyWithoutEntityInput;
    budgets?: Prisma.BudgetCreateNestedManyWithoutEntityInput;
    clients?: Prisma.ClientCreateNestedManyWithoutEntityInput;
    creditNotes?: Prisma.CreditNoteCreateNestedManyWithoutEntityInput;
    events?: Prisma.DomainEventCreateNestedManyWithoutEntityInput;
    tenant: EntitytenantFactory | Prisma.TenantCreateNestedOneWithoutEntitiesInput;
    fiscalCalendars?: Prisma.FiscalCalendarCreateNestedManyWithoutEntityInput;
    glAccounts?: Prisma.GLAccountCreateNestedManyWithoutEntityInput;
    forecasts?: Prisma.ForecastCreateNestedManyWithoutEntityInput;
    goals?: Prisma.GoalCreateNestedManyWithoutEntityInput;
    importBatches?: Prisma.ImportBatchCreateNestedManyWithoutEntityInput;
    insights?: Prisma.InsightCreateNestedManyWithoutEntityInput;
    invoices?: Prisma.InvoiceCreateNestedManyWithoutEntityInput;
    journalEntries?: Prisma.JournalEntryCreateNestedManyWithoutEntityInput;
    payments?: Prisma.PaymentCreateNestedManyWithoutEntityInput;
    projects?: Prisma.ProjectCreateNestedManyWithoutEntityInput;
    rules?: Prisma.RuleCreateNestedManyWithoutEntityInput;
    fixedAssets?: Prisma.FixedAssetCreateNestedManyWithoutEntityInput;
    taxRates?: Prisma.TaxRateCreateNestedManyWithoutEntityInput;
    vendors?: Prisma.VendorCreateNestedManyWithoutEntityInput;
    aiActions?: Prisma.AIActionCreateNestedManyWithoutEntityInput;
    aiDecisionLogs?: Prisma.AIDecisionLogCreateNestedManyWithoutEntityInput;
};

type EntityTransientFields = Record<string, unknown> & Partial<Record<keyof EntityFactoryDefineInput, never>>;

type EntityFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<EntityFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Entity, Prisma.EntityCreateInput, TTransients>;

type EntityFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<EntityFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: EntityFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Entity, Prisma.EntityCreateInput, TTransients>;

function isEntitytenantFactory(x: EntitytenantFactory | Prisma.TenantCreateNestedOneWithoutEntitiesInput | undefined): x is EntitytenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

type EntityTraitKeys<TOptions extends EntityFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface EntityFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Entity";
    build(inputData?: Partial<Prisma.EntityCreateInput & TTransients>): PromiseLike<Prisma.EntityCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.EntityCreateInput & TTransients>): PromiseLike<Prisma.EntityCreateInput>;
    buildList(list: readonly Partial<Prisma.EntityCreateInput & TTransients>[]): PromiseLike<Prisma.EntityCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.EntityCreateInput & TTransients>): PromiseLike<Prisma.EntityCreateInput[]>;
    pickForConnect(inputData: Entity): Pick<Entity, "id">;
    create(inputData?: Partial<Prisma.EntityCreateInput & TTransients>): PromiseLike<Entity>;
    createList(list: readonly Partial<Prisma.EntityCreateInput & TTransients>[]): PromiseLike<Entity[]>;
    createList(count: number, item?: Partial<Prisma.EntityCreateInput & TTransients>): PromiseLike<Entity[]>;
    createForConnect(inputData?: Partial<Prisma.EntityCreateInput & TTransients>): PromiseLike<Pick<Entity, "id">>;
}

export interface EntityFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends EntityFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): EntityFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateEntityScalarsOrEnums({ seq }: {
    readonly seq: number;
}): EntityScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Entity", fieldName: "name", isId: false, isUnique: false, seq }),
        type: "PERSONAL",
        country: getScalarFieldValueGenerator().String({ modelName: "Entity", fieldName: "country", isId: false, isUnique: false, seq }),
        functionalCurrency: getScalarFieldValueGenerator().String({ modelName: "Entity", fieldName: "functionalCurrency", isId: false, isUnique: false, seq }),
        reportingCurrency: getScalarFieldValueGenerator().String({ modelName: "Entity", fieldName: "reportingCurrency", isId: false, isUnique: false, seq })
    };
}

function defineEntityFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends EntityFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): EntityFactoryInterface<TTransients, EntityTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly EntityTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Entity", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.EntityCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateEntityScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<EntityFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<EntityFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                tenant: isEntitytenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant
            } as Prisma.EntityCreateInput;
            const data: Prisma.EntityCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.EntityCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Entity) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.EntityCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().entity.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.EntityCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.EntityCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Entity" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: EntityTraitKeys<TOptions>, ...names: readonly EntityTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface EntityFactoryBuilder {
    <TOptions extends EntityFactoryDefineOptions>(options: TOptions): EntityFactoryInterface<{}, EntityTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends EntityTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends EntityFactoryDefineOptions<TTransients>>(options: TOptions) => EntityFactoryInterface<TTransients, EntityTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Entity} model.
 *
 * @param options
 * @returns factory {@link EntityFactoryInterface}
 */
export const defineEntityFactory = (<TOptions extends EntityFactoryDefineOptions>(options: TOptions): EntityFactoryInterface<TOptions> => {
    return defineEntityFactoryInternal(options, {});
}) as EntityFactoryBuilder;

defineEntityFactory.withTransientFields = defaultTransientFieldValues => options => defineEntityFactoryInternal(options, defaultTransientFieldValues);

type GLAccountScalarOrEnumFields = {
    code: string;
    name: string;
    type: GLAccountType;
    normalBalance: NormalBalance;
};

type GLAccountentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutGlAccountsInput["create"]>;
};

type GLAccountparentAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutChildAccountsInput["create"]>;
};

type GLAccountFactoryDefineInput = {
    id?: string;
    code?: string;
    name?: string;
    type?: GLAccountType;
    normalBalance?: NormalBalance;
    description?: string | null;
    isActive?: boolean;
    isCTAAccount?: boolean;
    isEliminationAccount?: boolean;
    consolidationCode?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    bankAccounts?: Prisma.AccountCreateNestedManyWithoutGlAccountInput;
    billLines?: Prisma.BillLineCreateNestedManyWithoutGlAccountInput;
    entity: GLAccountentityFactory | Prisma.EntityCreateNestedOneWithoutGlAccountsInput;
    parentAccount?: GLAccountparentAccountFactory | Prisma.GLAccountCreateNestedOneWithoutChildAccountsInput;
    childAccounts?: Prisma.GLAccountCreateNestedManyWithoutParentAccountInput;
    invoiceLines?: Prisma.InvoiceLineCreateNestedManyWithoutGlAccountInput;
    journalLines?: Prisma.JournalLineCreateNestedManyWithoutGlAccountInput;
    transactionSplits?: Prisma.TransactionSplitCreateNestedManyWithoutGlAccountInput;
    categoriesAsDefault?: Prisma.CategoryCreateNestedManyWithoutDefaultGLAccountInput;
    budgetsAsGLAccount?: Prisma.BudgetCreateNestedManyWithoutGlAccountInput;
    goalsAsGLAccount?: Prisma.GoalCreateNestedManyWithoutGlAccountInput;
    fixedAssetsAsAsset?: Prisma.FixedAssetCreateNestedManyWithoutAssetGLAccountInput;
    fixedAssetsAsDepreciationExpense?: Prisma.FixedAssetCreateNestedManyWithoutDepreciationExpenseGLAccountInput;
    fixedAssetsAsAccumulatedDepr?: Prisma.FixedAssetCreateNestedManyWithoutAccumulatedDepreciationGLAccountInput;
};

type GLAccountTransientFields = Record<string, unknown> & Partial<Record<keyof GLAccountFactoryDefineInput, never>>;

type GLAccountFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<GLAccountFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<GLAccount, Prisma.GLAccountCreateInput, TTransients>;

type GLAccountFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<GLAccountFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: GLAccountFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<GLAccount, Prisma.GLAccountCreateInput, TTransients>;

function isGLAccountentityFactory(x: GLAccountentityFactory | Prisma.EntityCreateNestedOneWithoutGlAccountsInput | undefined): x is GLAccountentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isGLAccountparentAccountFactory(x: GLAccountparentAccountFactory | Prisma.GLAccountCreateNestedOneWithoutChildAccountsInput | undefined): x is GLAccountparentAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

type GLAccountTraitKeys<TOptions extends GLAccountFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface GLAccountFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "GLAccount";
    build(inputData?: Partial<Prisma.GLAccountCreateInput & TTransients>): PromiseLike<Prisma.GLAccountCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.GLAccountCreateInput & TTransients>): PromiseLike<Prisma.GLAccountCreateInput>;
    buildList(list: readonly Partial<Prisma.GLAccountCreateInput & TTransients>[]): PromiseLike<Prisma.GLAccountCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.GLAccountCreateInput & TTransients>): PromiseLike<Prisma.GLAccountCreateInput[]>;
    pickForConnect(inputData: GLAccount): Pick<GLAccount, "id">;
    create(inputData?: Partial<Prisma.GLAccountCreateInput & TTransients>): PromiseLike<GLAccount>;
    createList(list: readonly Partial<Prisma.GLAccountCreateInput & TTransients>[]): PromiseLike<GLAccount[]>;
    createList(count: number, item?: Partial<Prisma.GLAccountCreateInput & TTransients>): PromiseLike<GLAccount[]>;
    createForConnect(inputData?: Partial<Prisma.GLAccountCreateInput & TTransients>): PromiseLike<Pick<GLAccount, "id">>;
}

export interface GLAccountFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends GLAccountFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): GLAccountFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateGLAccountScalarsOrEnums({ seq }: {
    readonly seq: number;
}): GLAccountScalarOrEnumFields {
    return {
        code: getScalarFieldValueGenerator().String({ modelName: "GLAccount", fieldName: "code", isId: false, isUnique: true, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "GLAccount", fieldName: "name", isId: false, isUnique: false, seq }),
        type: "ASSET",
        normalBalance: "DEBIT"
    };
}

function defineGLAccountFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends GLAccountFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): GLAccountFactoryInterface<TTransients, GLAccountTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly GLAccountTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("GLAccount", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.GLAccountCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateGLAccountScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<GLAccountFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<GLAccountFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isGLAccountentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                parentAccount: isGLAccountparentAccountFactory(defaultData.parentAccount) ? {
                    create: await defaultData.parentAccount.build()
                } : defaultData.parentAccount
            } as Prisma.GLAccountCreateInput;
            const data: Prisma.GLAccountCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.GLAccountCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: GLAccount) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.GLAccountCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().gLAccount.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.GLAccountCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.GLAccountCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "GLAccount" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: GLAccountTraitKeys<TOptions>, ...names: readonly GLAccountTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface GLAccountFactoryBuilder {
    <TOptions extends GLAccountFactoryDefineOptions>(options: TOptions): GLAccountFactoryInterface<{}, GLAccountTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends GLAccountTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends GLAccountFactoryDefineOptions<TTransients>>(options: TOptions) => GLAccountFactoryInterface<TTransients, GLAccountTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link GLAccount} model.
 *
 * @param options
 * @returns factory {@link GLAccountFactoryInterface}
 */
export const defineGLAccountFactory = (<TOptions extends GLAccountFactoryDefineOptions>(options: TOptions): GLAccountFactoryInterface<TOptions> => {
    return defineGLAccountFactoryInternal(options, {});
}) as GLAccountFactoryBuilder;

defineGLAccountFactory.withTransientFields = defaultTransientFieldValues => options => defineGLAccountFactoryInternal(options, defaultTransientFieldValues);

type JournalEntryScalarOrEnumFields = {
    date: Date;
    memo: string;
    status: JournalEntryStatus;
    createdBy: string;
};

type JournalEntryentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutJournalEntriesInput["create"]>;
};

type JournalEntrylinkedEntryFactory = {
    _factoryFor: "JournalEntry";
    build: () => PromiseLike<Prisma.JournalEntryCreateNestedOneWithoutLinkedFromInput["create"]>;
};

type JournalEntryFactoryDefineInput = {
    id?: string;
    entryNumber?: string | null;
    date?: Date;
    memo?: string;
    sourceType?: JournalEntrySourceType | null;
    sourceId?: string | null;
    sourceDocument?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    status?: JournalEntryStatus;
    createdBy?: string;
    updatedBy?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: JournalEntryentityFactory | Prisma.EntityCreateNestedOneWithoutJournalEntriesInput;
    linkedEntry?: JournalEntrylinkedEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutLinkedFromInput;
    linkedFrom?: Prisma.JournalEntryCreateNestedManyWithoutLinkedEntryInput;
    journalLines?: Prisma.JournalLineCreateNestedManyWithoutJournalEntryInput;
    transactions?: Prisma.TransactionCreateNestedManyWithoutJournalEntryInput;
    depreciationEntries?: Prisma.DepreciationEntryCreateNestedManyWithoutJournalEntryInput;
};

type JournalEntryTransientFields = Record<string, unknown> & Partial<Record<keyof JournalEntryFactoryDefineInput, never>>;

type JournalEntryFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<JournalEntryFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<JournalEntry, Prisma.JournalEntryCreateInput, TTransients>;

type JournalEntryFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<JournalEntryFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: JournalEntryFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<JournalEntry, Prisma.JournalEntryCreateInput, TTransients>;

function isJournalEntryentityFactory(x: JournalEntryentityFactory | Prisma.EntityCreateNestedOneWithoutJournalEntriesInput | undefined): x is JournalEntryentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isJournalEntrylinkedEntryFactory(x: JournalEntrylinkedEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutLinkedFromInput | undefined): x is JournalEntrylinkedEntryFactory {
    return (x as any)?._factoryFor === "JournalEntry";
}

type JournalEntryTraitKeys<TOptions extends JournalEntryFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface JournalEntryFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "JournalEntry";
    build(inputData?: Partial<Prisma.JournalEntryCreateInput & TTransients>): PromiseLike<Prisma.JournalEntryCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.JournalEntryCreateInput & TTransients>): PromiseLike<Prisma.JournalEntryCreateInput>;
    buildList(list: readonly Partial<Prisma.JournalEntryCreateInput & TTransients>[]): PromiseLike<Prisma.JournalEntryCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.JournalEntryCreateInput & TTransients>): PromiseLike<Prisma.JournalEntryCreateInput[]>;
    pickForConnect(inputData: JournalEntry): Pick<JournalEntry, "id">;
    create(inputData?: Partial<Prisma.JournalEntryCreateInput & TTransients>): PromiseLike<JournalEntry>;
    createList(list: readonly Partial<Prisma.JournalEntryCreateInput & TTransients>[]): PromiseLike<JournalEntry[]>;
    createList(count: number, item?: Partial<Prisma.JournalEntryCreateInput & TTransients>): PromiseLike<JournalEntry[]>;
    createForConnect(inputData?: Partial<Prisma.JournalEntryCreateInput & TTransients>): PromiseLike<Pick<JournalEntry, "id">>;
}

export interface JournalEntryFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends JournalEntryFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): JournalEntryFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateJournalEntryScalarsOrEnums({ seq }: {
    readonly seq: number;
}): JournalEntryScalarOrEnumFields {
    return {
        date: getScalarFieldValueGenerator().DateTime({ modelName: "JournalEntry", fieldName: "date", isId: false, isUnique: false, seq }),
        memo: getScalarFieldValueGenerator().String({ modelName: "JournalEntry", fieldName: "memo", isId: false, isUnique: false, seq }),
        status: "DRAFT",
        createdBy: getScalarFieldValueGenerator().String({ modelName: "JournalEntry", fieldName: "createdBy", isId: false, isUnique: false, seq })
    };
}

function defineJournalEntryFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends JournalEntryFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): JournalEntryFactoryInterface<TTransients, JournalEntryTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly JournalEntryTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("JournalEntry", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.JournalEntryCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateJournalEntryScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<JournalEntryFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<JournalEntryFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isJournalEntryentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                linkedEntry: isJournalEntrylinkedEntryFactory(defaultData.linkedEntry) ? {
                    create: await defaultData.linkedEntry.build()
                } : defaultData.linkedEntry
            } as Prisma.JournalEntryCreateInput;
            const data: Prisma.JournalEntryCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.JournalEntryCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: JournalEntry) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.JournalEntryCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().journalEntry.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.JournalEntryCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.JournalEntryCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "JournalEntry" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: JournalEntryTraitKeys<TOptions>, ...names: readonly JournalEntryTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface JournalEntryFactoryBuilder {
    <TOptions extends JournalEntryFactoryDefineOptions>(options: TOptions): JournalEntryFactoryInterface<{}, JournalEntryTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends JournalEntryTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends JournalEntryFactoryDefineOptions<TTransients>>(options: TOptions) => JournalEntryFactoryInterface<TTransients, JournalEntryTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link JournalEntry} model.
 *
 * @param options
 * @returns factory {@link JournalEntryFactoryInterface}
 */
export const defineJournalEntryFactory = (<TOptions extends JournalEntryFactoryDefineOptions>(options: TOptions): JournalEntryFactoryInterface<TOptions> => {
    return defineJournalEntryFactoryInternal(options, {});
}) as JournalEntryFactoryBuilder;

defineJournalEntryFactory.withTransientFields = defaultTransientFieldValues => options => defineJournalEntryFactoryInternal(options, defaultTransientFieldValues);

type JournalLineScalarOrEnumFields = {
    debitAmount: number;
    creditAmount: number;
};

type JournalLineglAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutJournalLinesInput["create"]>;
};

type JournalLinejournalEntryFactory = {
    _factoryFor: "JournalEntry";
    build: () => PromiseLike<Prisma.JournalEntryCreateNestedOneWithoutJournalLinesInput["create"]>;
};

type JournalLineFactoryDefineInput = {
    id?: string;
    debitAmount?: number;
    creditAmount?: number;
    memo?: string | null;
    currency?: string | null;
    exchangeRate?: number | null;
    baseCurrencyDebit?: number | null;
    baseCurrencyCredit?: number | null;
    deletedAt?: Date | null;
    glAccount: JournalLineglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutJournalLinesInput;
    journalEntry: JournalLinejournalEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutJournalLinesInput;
};

type JournalLineTransientFields = Record<string, unknown> & Partial<Record<keyof JournalLineFactoryDefineInput, never>>;

type JournalLineFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<JournalLineFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<JournalLine, Prisma.JournalLineCreateInput, TTransients>;

type JournalLineFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<JournalLineFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: JournalLineFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<JournalLine, Prisma.JournalLineCreateInput, TTransients>;

function isJournalLineglAccountFactory(x: JournalLineglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutJournalLinesInput | undefined): x is JournalLineglAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

function isJournalLinejournalEntryFactory(x: JournalLinejournalEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutJournalLinesInput | undefined): x is JournalLinejournalEntryFactory {
    return (x as any)?._factoryFor === "JournalEntry";
}

type JournalLineTraitKeys<TOptions extends JournalLineFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface JournalLineFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "JournalLine";
    build(inputData?: Partial<Prisma.JournalLineCreateInput & TTransients>): PromiseLike<Prisma.JournalLineCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.JournalLineCreateInput & TTransients>): PromiseLike<Prisma.JournalLineCreateInput>;
    buildList(list: readonly Partial<Prisma.JournalLineCreateInput & TTransients>[]): PromiseLike<Prisma.JournalLineCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.JournalLineCreateInput & TTransients>): PromiseLike<Prisma.JournalLineCreateInput[]>;
    pickForConnect(inputData: JournalLine): Pick<JournalLine, "id">;
    create(inputData?: Partial<Prisma.JournalLineCreateInput & TTransients>): PromiseLike<JournalLine>;
    createList(list: readonly Partial<Prisma.JournalLineCreateInput & TTransients>[]): PromiseLike<JournalLine[]>;
    createList(count: number, item?: Partial<Prisma.JournalLineCreateInput & TTransients>): PromiseLike<JournalLine[]>;
    createForConnect(inputData?: Partial<Prisma.JournalLineCreateInput & TTransients>): PromiseLike<Pick<JournalLine, "id">>;
}

export interface JournalLineFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends JournalLineFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): JournalLineFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateJournalLineScalarsOrEnums({ seq }: {
    readonly seq: number;
}): JournalLineScalarOrEnumFields {
    return {
        debitAmount: getScalarFieldValueGenerator().Int({ modelName: "JournalLine", fieldName: "debitAmount", isId: false, isUnique: false, seq }),
        creditAmount: getScalarFieldValueGenerator().Int({ modelName: "JournalLine", fieldName: "creditAmount", isId: false, isUnique: false, seq })
    };
}

function defineJournalLineFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends JournalLineFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): JournalLineFactoryInterface<TTransients, JournalLineTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly JournalLineTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("JournalLine", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.JournalLineCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateJournalLineScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<JournalLineFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<JournalLineFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                glAccount: isJournalLineglAccountFactory(defaultData.glAccount) ? {
                    create: await defaultData.glAccount.build()
                } : defaultData.glAccount,
                journalEntry: isJournalLinejournalEntryFactory(defaultData.journalEntry) ? {
                    create: await defaultData.journalEntry.build()
                } : defaultData.journalEntry
            } as Prisma.JournalLineCreateInput;
            const data: Prisma.JournalLineCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.JournalLineCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: JournalLine) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.JournalLineCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().journalLine.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.JournalLineCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.JournalLineCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "JournalLine" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: JournalLineTraitKeys<TOptions>, ...names: readonly JournalLineTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface JournalLineFactoryBuilder {
    <TOptions extends JournalLineFactoryDefineOptions>(options: TOptions): JournalLineFactoryInterface<{}, JournalLineTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends JournalLineTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends JournalLineFactoryDefineOptions<TTransients>>(options: TOptions) => JournalLineFactoryInterface<TTransients, JournalLineTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link JournalLine} model.
 *
 * @param options
 * @returns factory {@link JournalLineFactoryInterface}
 */
export const defineJournalLineFactory = (<TOptions extends JournalLineFactoryDefineOptions>(options: TOptions): JournalLineFactoryInterface<TOptions> => {
    return defineJournalLineFactoryInternal(options, {});
}) as JournalLineFactoryBuilder;

defineJournalLineFactory.withTransientFields = defaultTransientFieldValues => options => defineJournalLineFactoryInternal(options, defaultTransientFieldValues);

type TaxRateScalarOrEnumFields = {
    code: string;
    name: string;
    rate: number;
    rateBasisPoints: number;
    jurisdiction: string;
    isInclusive: boolean;
    isActive: boolean;
    effectiveFrom: Date;
};

type TaxRateentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutTaxRatesInput["create"]>;
};

type TaxRateFactoryDefineInput = {
    id?: string;
    code?: string;
    name?: string;
    rate?: number;
    rateBasisPoints?: number;
    jurisdiction?: string;
    isInclusive?: boolean;
    glAccountId?: string | null;
    isActive?: boolean;
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
    entity?: TaxRateentityFactory | Prisma.EntityCreateNestedOneWithoutTaxRatesInput;
    invoiceLines?: Prisma.InvoiceLineCreateNestedManyWithoutTaxRateInput;
    billLines?: Prisma.BillLineCreateNestedManyWithoutTaxRateInput;
};

type TaxRateTransientFields = Record<string, unknown> & Partial<Record<keyof TaxRateFactoryDefineInput, never>>;

type TaxRateFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TaxRateFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TaxRate, Prisma.TaxRateCreateInput, TTransients>;

type TaxRateFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<TaxRateFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: TaxRateFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TaxRate, Prisma.TaxRateCreateInput, TTransients>;

function isTaxRateentityFactory(x: TaxRateentityFactory | Prisma.EntityCreateNestedOneWithoutTaxRatesInput | undefined): x is TaxRateentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type TaxRateTraitKeys<TOptions extends TaxRateFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface TaxRateFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TaxRate";
    build(inputData?: Partial<Prisma.TaxRateCreateInput & TTransients>): PromiseLike<Prisma.TaxRateCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaxRateCreateInput & TTransients>): PromiseLike<Prisma.TaxRateCreateInput>;
    buildList(list: readonly Partial<Prisma.TaxRateCreateInput & TTransients>[]): PromiseLike<Prisma.TaxRateCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TaxRateCreateInput & TTransients>): PromiseLike<Prisma.TaxRateCreateInput[]>;
    pickForConnect(inputData: TaxRate): Pick<TaxRate, "id">;
    create(inputData?: Partial<Prisma.TaxRateCreateInput & TTransients>): PromiseLike<TaxRate>;
    createList(list: readonly Partial<Prisma.TaxRateCreateInput & TTransients>[]): PromiseLike<TaxRate[]>;
    createList(count: number, item?: Partial<Prisma.TaxRateCreateInput & TTransients>): PromiseLike<TaxRate[]>;
    createForConnect(inputData?: Partial<Prisma.TaxRateCreateInput & TTransients>): PromiseLike<Pick<TaxRate, "id">>;
}

export interface TaxRateFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TaxRateFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TaxRateFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateTaxRateScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TaxRateScalarOrEnumFields {
    return {
        code: getScalarFieldValueGenerator().String({ modelName: "TaxRate", fieldName: "code", isId: false, isUnique: true, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "TaxRate", fieldName: "name", isId: false, isUnique: false, seq }),
        rate: getScalarFieldValueGenerator().Float({ modelName: "TaxRate", fieldName: "rate", isId: false, isUnique: false, seq }),
        rateBasisPoints: getScalarFieldValueGenerator().Int({ modelName: "TaxRate", fieldName: "rateBasisPoints", isId: false, isUnique: false, seq }),
        jurisdiction: getScalarFieldValueGenerator().String({ modelName: "TaxRate", fieldName: "jurisdiction", isId: false, isUnique: false, seq }),
        isInclusive: getScalarFieldValueGenerator().Boolean({ modelName: "TaxRate", fieldName: "isInclusive", isId: false, isUnique: false, seq }),
        isActive: getScalarFieldValueGenerator().Boolean({ modelName: "TaxRate", fieldName: "isActive", isId: false, isUnique: false, seq }),
        effectiveFrom: getScalarFieldValueGenerator().DateTime({ modelName: "TaxRate", fieldName: "effectiveFrom", isId: false, isUnique: false, seq })
    };
}

function defineTaxRateFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends TaxRateFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): TaxRateFactoryInterface<TTransients, TaxRateTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly TaxRateTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TaxRate", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.TaxRateCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTaxRateScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<TaxRateFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<TaxRateFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isTaxRateentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.TaxRateCreateInput;
            const data: Prisma.TaxRateCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TaxRateCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: TaxRate) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.TaxRateCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().taxRate.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TaxRateCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.TaxRateCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TaxRate" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: TaxRateTraitKeys<TOptions>, ...names: readonly TaxRateTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface TaxRateFactoryBuilder {
    <TOptions extends TaxRateFactoryDefineOptions>(options?: TOptions): TaxRateFactoryInterface<{}, TaxRateTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TaxRateTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TaxRateFactoryDefineOptions<TTransients>>(options?: TOptions) => TaxRateFactoryInterface<TTransients, TaxRateTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link TaxRate} model.
 *
 * @param options
 * @returns factory {@link TaxRateFactoryInterface}
 */
export const defineTaxRateFactory = (<TOptions extends TaxRateFactoryDefineOptions>(options?: TOptions): TaxRateFactoryInterface<TOptions> => {
    return defineTaxRateFactoryInternal(options ?? {}, {});
}) as TaxRateFactoryBuilder;

defineTaxRateFactory.withTransientFields = defaultTransientFieldValues => options => defineTaxRateFactoryInternal(options ?? {}, defaultTransientFieldValues);

type FiscalCalendarScalarOrEnumFields = {
    year: number;
    startDate: Date;
    endDate: Date;
};

type FiscalCalendarentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutFiscalCalendarsInput["create"]>;
};

type FiscalCalendarFactoryDefineInput = {
    id?: string;
    year?: number;
    startDate?: Date;
    endDate?: Date;
    entity: FiscalCalendarentityFactory | Prisma.EntityCreateNestedOneWithoutFiscalCalendarsInput;
    periods?: Prisma.FiscalPeriodCreateNestedManyWithoutFiscalCalendarInput;
};

type FiscalCalendarTransientFields = Record<string, unknown> & Partial<Record<keyof FiscalCalendarFactoryDefineInput, never>>;

type FiscalCalendarFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FiscalCalendarFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FiscalCalendar, Prisma.FiscalCalendarCreateInput, TTransients>;

type FiscalCalendarFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<FiscalCalendarFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: FiscalCalendarFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FiscalCalendar, Prisma.FiscalCalendarCreateInput, TTransients>;

function isFiscalCalendarentityFactory(x: FiscalCalendarentityFactory | Prisma.EntityCreateNestedOneWithoutFiscalCalendarsInput | undefined): x is FiscalCalendarentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type FiscalCalendarTraitKeys<TOptions extends FiscalCalendarFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface FiscalCalendarFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FiscalCalendar";
    build(inputData?: Partial<Prisma.FiscalCalendarCreateInput & TTransients>): PromiseLike<Prisma.FiscalCalendarCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FiscalCalendarCreateInput & TTransients>): PromiseLike<Prisma.FiscalCalendarCreateInput>;
    buildList(list: readonly Partial<Prisma.FiscalCalendarCreateInput & TTransients>[]): PromiseLike<Prisma.FiscalCalendarCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FiscalCalendarCreateInput & TTransients>): PromiseLike<Prisma.FiscalCalendarCreateInput[]>;
    pickForConnect(inputData: FiscalCalendar): Pick<FiscalCalendar, "id">;
    create(inputData?: Partial<Prisma.FiscalCalendarCreateInput & TTransients>): PromiseLike<FiscalCalendar>;
    createList(list: readonly Partial<Prisma.FiscalCalendarCreateInput & TTransients>[]): PromiseLike<FiscalCalendar[]>;
    createList(count: number, item?: Partial<Prisma.FiscalCalendarCreateInput & TTransients>): PromiseLike<FiscalCalendar[]>;
    createForConnect(inputData?: Partial<Prisma.FiscalCalendarCreateInput & TTransients>): PromiseLike<Pick<FiscalCalendar, "id">>;
}

export interface FiscalCalendarFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FiscalCalendarFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FiscalCalendarFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateFiscalCalendarScalarsOrEnums({ seq }: {
    readonly seq: number;
}): FiscalCalendarScalarOrEnumFields {
    return {
        year: getScalarFieldValueGenerator().Int({ modelName: "FiscalCalendar", fieldName: "year", isId: false, isUnique: true, seq }),
        startDate: getScalarFieldValueGenerator().DateTime({ modelName: "FiscalCalendar", fieldName: "startDate", isId: false, isUnique: false, seq }),
        endDate: getScalarFieldValueGenerator().DateTime({ modelName: "FiscalCalendar", fieldName: "endDate", isId: false, isUnique: false, seq })
    };
}

function defineFiscalCalendarFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends FiscalCalendarFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): FiscalCalendarFactoryInterface<TTransients, FiscalCalendarTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly FiscalCalendarTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FiscalCalendar", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.FiscalCalendarCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFiscalCalendarScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<FiscalCalendarFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<FiscalCalendarFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isFiscalCalendarentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.FiscalCalendarCreateInput;
            const data: Prisma.FiscalCalendarCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FiscalCalendarCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: FiscalCalendar) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.FiscalCalendarCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().fiscalCalendar.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FiscalCalendarCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.FiscalCalendarCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FiscalCalendar" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: FiscalCalendarTraitKeys<TOptions>, ...names: readonly FiscalCalendarTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface FiscalCalendarFactoryBuilder {
    <TOptions extends FiscalCalendarFactoryDefineOptions>(options: TOptions): FiscalCalendarFactoryInterface<{}, FiscalCalendarTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FiscalCalendarTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FiscalCalendarFactoryDefineOptions<TTransients>>(options: TOptions) => FiscalCalendarFactoryInterface<TTransients, FiscalCalendarTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link FiscalCalendar} model.
 *
 * @param options
 * @returns factory {@link FiscalCalendarFactoryInterface}
 */
export const defineFiscalCalendarFactory = (<TOptions extends FiscalCalendarFactoryDefineOptions>(options: TOptions): FiscalCalendarFactoryInterface<TOptions> => {
    return defineFiscalCalendarFactoryInternal(options, {});
}) as FiscalCalendarFactoryBuilder;

defineFiscalCalendarFactory.withTransientFields = defaultTransientFieldValues => options => defineFiscalCalendarFactoryInternal(options, defaultTransientFieldValues);

type FiscalPeriodScalarOrEnumFields = {
    periodNumber: number;
    name: string;
    startDate: Date;
    endDate: Date;
    status: FiscalPeriodStatus;
};

type FiscalPeriodfiscalCalendarFactory = {
    _factoryFor: "FiscalCalendar";
    build: () => PromiseLike<Prisma.FiscalCalendarCreateNestedOneWithoutPeriodsInput["create"]>;
};

type FiscalPeriodFactoryDefineInput = {
    id?: string;
    periodNumber?: number;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    status?: FiscalPeriodStatus;
    fiscalCalendar: FiscalPeriodfiscalCalendarFactory | Prisma.FiscalCalendarCreateNestedOneWithoutPeriodsInput;
};

type FiscalPeriodTransientFields = Record<string, unknown> & Partial<Record<keyof FiscalPeriodFactoryDefineInput, never>>;

type FiscalPeriodFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FiscalPeriodFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FiscalPeriod, Prisma.FiscalPeriodCreateInput, TTransients>;

type FiscalPeriodFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<FiscalPeriodFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: FiscalPeriodFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FiscalPeriod, Prisma.FiscalPeriodCreateInput, TTransients>;

function isFiscalPeriodfiscalCalendarFactory(x: FiscalPeriodfiscalCalendarFactory | Prisma.FiscalCalendarCreateNestedOneWithoutPeriodsInput | undefined): x is FiscalPeriodfiscalCalendarFactory {
    return (x as any)?._factoryFor === "FiscalCalendar";
}

type FiscalPeriodTraitKeys<TOptions extends FiscalPeriodFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface FiscalPeriodFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FiscalPeriod";
    build(inputData?: Partial<Prisma.FiscalPeriodCreateInput & TTransients>): PromiseLike<Prisma.FiscalPeriodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FiscalPeriodCreateInput & TTransients>): PromiseLike<Prisma.FiscalPeriodCreateInput>;
    buildList(list: readonly Partial<Prisma.FiscalPeriodCreateInput & TTransients>[]): PromiseLike<Prisma.FiscalPeriodCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FiscalPeriodCreateInput & TTransients>): PromiseLike<Prisma.FiscalPeriodCreateInput[]>;
    pickForConnect(inputData: FiscalPeriod): Pick<FiscalPeriod, "id">;
    create(inputData?: Partial<Prisma.FiscalPeriodCreateInput & TTransients>): PromiseLike<FiscalPeriod>;
    createList(list: readonly Partial<Prisma.FiscalPeriodCreateInput & TTransients>[]): PromiseLike<FiscalPeriod[]>;
    createList(count: number, item?: Partial<Prisma.FiscalPeriodCreateInput & TTransients>): PromiseLike<FiscalPeriod[]>;
    createForConnect(inputData?: Partial<Prisma.FiscalPeriodCreateInput & TTransients>): PromiseLike<Pick<FiscalPeriod, "id">>;
}

export interface FiscalPeriodFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FiscalPeriodFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FiscalPeriodFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateFiscalPeriodScalarsOrEnums({ seq }: {
    readonly seq: number;
}): FiscalPeriodScalarOrEnumFields {
    return {
        periodNumber: getScalarFieldValueGenerator().Int({ modelName: "FiscalPeriod", fieldName: "periodNumber", isId: false, isUnique: false, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "FiscalPeriod", fieldName: "name", isId: false, isUnique: false, seq }),
        startDate: getScalarFieldValueGenerator().DateTime({ modelName: "FiscalPeriod", fieldName: "startDate", isId: false, isUnique: false, seq }),
        endDate: getScalarFieldValueGenerator().DateTime({ modelName: "FiscalPeriod", fieldName: "endDate", isId: false, isUnique: false, seq }),
        status: "OPEN"
    };
}

function defineFiscalPeriodFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends FiscalPeriodFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): FiscalPeriodFactoryInterface<TTransients, FiscalPeriodTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly FiscalPeriodTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FiscalPeriod", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.FiscalPeriodCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFiscalPeriodScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<FiscalPeriodFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<FiscalPeriodFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                fiscalCalendar: isFiscalPeriodfiscalCalendarFactory(defaultData.fiscalCalendar) ? {
                    create: await defaultData.fiscalCalendar.build()
                } : defaultData.fiscalCalendar
            } as Prisma.FiscalPeriodCreateInput;
            const data: Prisma.FiscalPeriodCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FiscalPeriodCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: FiscalPeriod) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.FiscalPeriodCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().fiscalPeriod.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FiscalPeriodCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.FiscalPeriodCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FiscalPeriod" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: FiscalPeriodTraitKeys<TOptions>, ...names: readonly FiscalPeriodTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface FiscalPeriodFactoryBuilder {
    <TOptions extends FiscalPeriodFactoryDefineOptions>(options: TOptions): FiscalPeriodFactoryInterface<{}, FiscalPeriodTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FiscalPeriodTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FiscalPeriodFactoryDefineOptions<TTransients>>(options: TOptions) => FiscalPeriodFactoryInterface<TTransients, FiscalPeriodTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link FiscalPeriod} model.
 *
 * @param options
 * @returns factory {@link FiscalPeriodFactoryInterface}
 */
export const defineFiscalPeriodFactory = (<TOptions extends FiscalPeriodFactoryDefineOptions>(options: TOptions): FiscalPeriodFactoryInterface<TOptions> => {
    return defineFiscalPeriodFactoryInternal(options, {});
}) as FiscalPeriodFactoryBuilder;

defineFiscalPeriodFactory.withTransientFields = defaultTransientFieldValues => options => defineFiscalPeriodFactoryInternal(options, defaultTransientFieldValues);

type ClientScalarOrEnumFields = {
    name: string;
};

type CliententityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutClientsInput["create"]>;
};

type ClientFactoryDefineInput = {
    id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    paymentTerms?: string | null;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: CliententityFactory | Prisma.EntityCreateNestedOneWithoutClientsInput;
    invoices?: Prisma.InvoiceCreateNestedManyWithoutClientInput;
    payments?: Prisma.PaymentCreateNestedManyWithoutClientInput;
};

type ClientTransientFields = Record<string, unknown> & Partial<Record<keyof ClientFactoryDefineInput, never>>;

type ClientFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ClientFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Client, Prisma.ClientCreateInput, TTransients>;

type ClientFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<ClientFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: ClientFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Client, Prisma.ClientCreateInput, TTransients>;

function isCliententityFactory(x: CliententityFactory | Prisma.EntityCreateNestedOneWithoutClientsInput | undefined): x is CliententityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type ClientTraitKeys<TOptions extends ClientFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface ClientFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Client";
    build(inputData?: Partial<Prisma.ClientCreateInput & TTransients>): PromiseLike<Prisma.ClientCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ClientCreateInput & TTransients>): PromiseLike<Prisma.ClientCreateInput>;
    buildList(list: readonly Partial<Prisma.ClientCreateInput & TTransients>[]): PromiseLike<Prisma.ClientCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ClientCreateInput & TTransients>): PromiseLike<Prisma.ClientCreateInput[]>;
    pickForConnect(inputData: Client): Pick<Client, "id">;
    create(inputData?: Partial<Prisma.ClientCreateInput & TTransients>): PromiseLike<Client>;
    createList(list: readonly Partial<Prisma.ClientCreateInput & TTransients>[]): PromiseLike<Client[]>;
    createList(count: number, item?: Partial<Prisma.ClientCreateInput & TTransients>): PromiseLike<Client[]>;
    createForConnect(inputData?: Partial<Prisma.ClientCreateInput & TTransients>): PromiseLike<Pick<Client, "id">>;
}

export interface ClientFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ClientFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ClientFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateClientScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ClientScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Client", fieldName: "name", isId: false, isUnique: false, seq })
    };
}

function defineClientFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends ClientFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): ClientFactoryInterface<TTransients, ClientTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly ClientTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Client", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.ClientCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateClientScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<ClientFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<ClientFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isCliententityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.ClientCreateInput;
            const data: Prisma.ClientCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ClientCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Client) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.ClientCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().client.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ClientCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.ClientCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Client" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: ClientTraitKeys<TOptions>, ...names: readonly ClientTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface ClientFactoryBuilder {
    <TOptions extends ClientFactoryDefineOptions>(options: TOptions): ClientFactoryInterface<{}, ClientTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ClientTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ClientFactoryDefineOptions<TTransients>>(options: TOptions) => ClientFactoryInterface<TTransients, ClientTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Client} model.
 *
 * @param options
 * @returns factory {@link ClientFactoryInterface}
 */
export const defineClientFactory = (<TOptions extends ClientFactoryDefineOptions>(options: TOptions): ClientFactoryInterface<TOptions> => {
    return defineClientFactoryInternal(options, {});
}) as ClientFactoryBuilder;

defineClientFactory.withTransientFields = defaultTransientFieldValues => options => defineClientFactoryInternal(options, defaultTransientFieldValues);

type InvoiceScalarOrEnumFields = {
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    currency: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    status: InvoiceStatus;
    paidAmount: number;
};

type InvoiceclientFactory = {
    _factoryFor: "Client";
    build: () => PromiseLike<Prisma.ClientCreateNestedOneWithoutInvoicesInput["create"]>;
};

type InvoiceentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutInvoicesInput["create"]>;
};

type InvoiceFactoryDefineInput = {
    id?: string;
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    currency?: string;
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    status?: InvoiceStatus;
    paidAmount?: number;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    client: InvoiceclientFactory | Prisma.ClientCreateNestedOneWithoutInvoicesInput;
    entity: InvoiceentityFactory | Prisma.EntityCreateNestedOneWithoutInvoicesInput;
    invoiceLines?: Prisma.InvoiceLineCreateNestedManyWithoutInvoiceInput;
    paymentAllocations?: Prisma.PaymentAllocationCreateNestedManyWithoutInvoiceInput;
    creditNotes?: Prisma.CreditNoteCreateNestedManyWithoutLinkedInvoiceInput;
};

type InvoiceTransientFields = Record<string, unknown> & Partial<Record<keyof InvoiceFactoryDefineInput, never>>;

type InvoiceFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<InvoiceFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Invoice, Prisma.InvoiceCreateInput, TTransients>;

type InvoiceFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<InvoiceFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: InvoiceFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Invoice, Prisma.InvoiceCreateInput, TTransients>;

function isInvoiceclientFactory(x: InvoiceclientFactory | Prisma.ClientCreateNestedOneWithoutInvoicesInput | undefined): x is InvoiceclientFactory {
    return (x as any)?._factoryFor === "Client";
}

function isInvoiceentityFactory(x: InvoiceentityFactory | Prisma.EntityCreateNestedOneWithoutInvoicesInput | undefined): x is InvoiceentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type InvoiceTraitKeys<TOptions extends InvoiceFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface InvoiceFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Invoice";
    build(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildList(list: readonly Partial<Prisma.InvoiceCreateInput & TTransients>[]): PromiseLike<Prisma.InvoiceCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Prisma.InvoiceCreateInput[]>;
    pickForConnect(inputData: Invoice): Pick<Invoice, "id">;
    create(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Invoice>;
    createList(list: readonly Partial<Prisma.InvoiceCreateInput & TTransients>[]): PromiseLike<Invoice[]>;
    createList(count: number, item?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Invoice[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Pick<Invoice, "id">>;
}

export interface InvoiceFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends InvoiceFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): InvoiceFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateInvoiceScalarsOrEnums({ seq }: {
    readonly seq: number;
}): InvoiceScalarOrEnumFields {
    return {
        invoiceNumber: getScalarFieldValueGenerator().String({ modelName: "Invoice", fieldName: "invoiceNumber", isId: false, isUnique: true, seq }),
        issueDate: getScalarFieldValueGenerator().DateTime({ modelName: "Invoice", fieldName: "issueDate", isId: false, isUnique: false, seq }),
        dueDate: getScalarFieldValueGenerator().DateTime({ modelName: "Invoice", fieldName: "dueDate", isId: false, isUnique: false, seq }),
        currency: getScalarFieldValueGenerator().String({ modelName: "Invoice", fieldName: "currency", isId: false, isUnique: false, seq }),
        subtotal: getScalarFieldValueGenerator().Int({ modelName: "Invoice", fieldName: "subtotal", isId: false, isUnique: false, seq }),
        taxAmount: getScalarFieldValueGenerator().Int({ modelName: "Invoice", fieldName: "taxAmount", isId: false, isUnique: false, seq }),
        total: getScalarFieldValueGenerator().Int({ modelName: "Invoice", fieldName: "total", isId: false, isUnique: false, seq }),
        status: "DRAFT",
        paidAmount: getScalarFieldValueGenerator().Int({ modelName: "Invoice", fieldName: "paidAmount", isId: false, isUnique: false, seq })
    };
}

function defineInvoiceFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends InvoiceFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): InvoiceFactoryInterface<TTransients, InvoiceTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly InvoiceTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Invoice", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.InvoiceCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateInvoiceScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<InvoiceFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<InvoiceFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                client: isInvoiceclientFactory(defaultData.client) ? {
                    create: await defaultData.client.build()
                } : defaultData.client,
                entity: isInvoiceentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.InvoiceCreateInput;
            const data: Prisma.InvoiceCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.InvoiceCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Invoice) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.InvoiceCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().invoice.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.InvoiceCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.InvoiceCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Invoice" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: InvoiceTraitKeys<TOptions>, ...names: readonly InvoiceTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface InvoiceFactoryBuilder {
    <TOptions extends InvoiceFactoryDefineOptions>(options: TOptions): InvoiceFactoryInterface<{}, InvoiceTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends InvoiceTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends InvoiceFactoryDefineOptions<TTransients>>(options: TOptions) => InvoiceFactoryInterface<TTransients, InvoiceTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Invoice} model.
 *
 * @param options
 * @returns factory {@link InvoiceFactoryInterface}
 */
export const defineInvoiceFactory = (<TOptions extends InvoiceFactoryDefineOptions>(options: TOptions): InvoiceFactoryInterface<TOptions> => {
    return defineInvoiceFactoryInternal(options, {});
}) as InvoiceFactoryBuilder;

defineInvoiceFactory.withTransientFields = defaultTransientFieldValues => options => defineInvoiceFactoryInternal(options, defaultTransientFieldValues);

type InvoiceLineScalarOrEnumFields = {
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    amount: number;
};

type InvoiceLinecategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutInvoiceLinesInput["create"]>;
};

type InvoiceLineglAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutInvoiceLinesInput["create"]>;
};

type InvoiceLineinvoiceFactory = {
    _factoryFor: "Invoice";
    build: () => PromiseLike<Prisma.InvoiceCreateNestedOneWithoutInvoiceLinesInput["create"]>;
};

type InvoiceLinetaxRateFactory = {
    _factoryFor: "TaxRate";
    build: () => PromiseLike<Prisma.TaxRateCreateNestedOneWithoutInvoiceLinesInput["create"]>;
};

type InvoiceLineFactoryDefineInput = {
    id?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxAmount?: number;
    amount?: number;
    deletedAt?: Date | null;
    category?: InvoiceLinecategoryFactory | Prisma.CategoryCreateNestedOneWithoutInvoiceLinesInput;
    glAccount?: InvoiceLineglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutInvoiceLinesInput;
    invoice: InvoiceLineinvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutInvoiceLinesInput;
    taxRate?: InvoiceLinetaxRateFactory | Prisma.TaxRateCreateNestedOneWithoutInvoiceLinesInput;
};

type InvoiceLineTransientFields = Record<string, unknown> & Partial<Record<keyof InvoiceLineFactoryDefineInput, never>>;

type InvoiceLineFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<InvoiceLineFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<InvoiceLine, Prisma.InvoiceLineCreateInput, TTransients>;

type InvoiceLineFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<InvoiceLineFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: InvoiceLineFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<InvoiceLine, Prisma.InvoiceLineCreateInput, TTransients>;

function isInvoiceLinecategoryFactory(x: InvoiceLinecategoryFactory | Prisma.CategoryCreateNestedOneWithoutInvoiceLinesInput | undefined): x is InvoiceLinecategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

function isInvoiceLineglAccountFactory(x: InvoiceLineglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutInvoiceLinesInput | undefined): x is InvoiceLineglAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

function isInvoiceLineinvoiceFactory(x: InvoiceLineinvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutInvoiceLinesInput | undefined): x is InvoiceLineinvoiceFactory {
    return (x as any)?._factoryFor === "Invoice";
}

function isInvoiceLinetaxRateFactory(x: InvoiceLinetaxRateFactory | Prisma.TaxRateCreateNestedOneWithoutInvoiceLinesInput | undefined): x is InvoiceLinetaxRateFactory {
    return (x as any)?._factoryFor === "TaxRate";
}

type InvoiceLineTraitKeys<TOptions extends InvoiceLineFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface InvoiceLineFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "InvoiceLine";
    build(inputData?: Partial<Prisma.InvoiceLineCreateInput & TTransients>): PromiseLike<Prisma.InvoiceLineCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceLineCreateInput & TTransients>): PromiseLike<Prisma.InvoiceLineCreateInput>;
    buildList(list: readonly Partial<Prisma.InvoiceLineCreateInput & TTransients>[]): PromiseLike<Prisma.InvoiceLineCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.InvoiceLineCreateInput & TTransients>): PromiseLike<Prisma.InvoiceLineCreateInput[]>;
    pickForConnect(inputData: InvoiceLine): Pick<InvoiceLine, "id">;
    create(inputData?: Partial<Prisma.InvoiceLineCreateInput & TTransients>): PromiseLike<InvoiceLine>;
    createList(list: readonly Partial<Prisma.InvoiceLineCreateInput & TTransients>[]): PromiseLike<InvoiceLine[]>;
    createList(count: number, item?: Partial<Prisma.InvoiceLineCreateInput & TTransients>): PromiseLike<InvoiceLine[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceLineCreateInput & TTransients>): PromiseLike<Pick<InvoiceLine, "id">>;
}

export interface InvoiceLineFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends InvoiceLineFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): InvoiceLineFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateInvoiceLineScalarsOrEnums({ seq }: {
    readonly seq: number;
}): InvoiceLineScalarOrEnumFields {
    return {
        description: getScalarFieldValueGenerator().String({ modelName: "InvoiceLine", fieldName: "description", isId: false, isUnique: false, seq }),
        quantity: getScalarFieldValueGenerator().Int({ modelName: "InvoiceLine", fieldName: "quantity", isId: false, isUnique: false, seq }),
        unitPrice: getScalarFieldValueGenerator().Int({ modelName: "InvoiceLine", fieldName: "unitPrice", isId: false, isUnique: false, seq }),
        taxAmount: getScalarFieldValueGenerator().Int({ modelName: "InvoiceLine", fieldName: "taxAmount", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "InvoiceLine", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}

function defineInvoiceLineFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends InvoiceLineFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): InvoiceLineFactoryInterface<TTransients, InvoiceLineTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly InvoiceLineTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("InvoiceLine", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.InvoiceLineCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateInvoiceLineScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<InvoiceLineFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<InvoiceLineFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                category: isInvoiceLinecategoryFactory(defaultData.category) ? {
                    create: await defaultData.category.build()
                } : defaultData.category,
                glAccount: isInvoiceLineglAccountFactory(defaultData.glAccount) ? {
                    create: await defaultData.glAccount.build()
                } : defaultData.glAccount,
                invoice: isInvoiceLineinvoiceFactory(defaultData.invoice) ? {
                    create: await defaultData.invoice.build()
                } : defaultData.invoice,
                taxRate: isInvoiceLinetaxRateFactory(defaultData.taxRate) ? {
                    create: await defaultData.taxRate.build()
                } : defaultData.taxRate
            } as Prisma.InvoiceLineCreateInput;
            const data: Prisma.InvoiceLineCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.InvoiceLineCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: InvoiceLine) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.InvoiceLineCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().invoiceLine.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.InvoiceLineCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.InvoiceLineCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "InvoiceLine" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: InvoiceLineTraitKeys<TOptions>, ...names: readonly InvoiceLineTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface InvoiceLineFactoryBuilder {
    <TOptions extends InvoiceLineFactoryDefineOptions>(options: TOptions): InvoiceLineFactoryInterface<{}, InvoiceLineTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends InvoiceLineTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends InvoiceLineFactoryDefineOptions<TTransients>>(options: TOptions) => InvoiceLineFactoryInterface<TTransients, InvoiceLineTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link InvoiceLine} model.
 *
 * @param options
 * @returns factory {@link InvoiceLineFactoryInterface}
 */
export const defineInvoiceLineFactory = (<TOptions extends InvoiceLineFactoryDefineOptions>(options: TOptions): InvoiceLineFactoryInterface<TOptions> => {
    return defineInvoiceLineFactoryInternal(options, {});
}) as InvoiceLineFactoryBuilder;

defineInvoiceLineFactory.withTransientFields = defaultTransientFieldValues => options => defineInvoiceLineFactoryInternal(options, defaultTransientFieldValues);

type VendorScalarOrEnumFields = {
    name: string;
};

type VendorentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutVendorsInput["create"]>;
};

type VendorFactoryDefineInput = {
    id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    paymentTerms?: string | null;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    bills?: Prisma.BillCreateNestedManyWithoutVendorInput;
    payments?: Prisma.PaymentCreateNestedManyWithoutVendorInput;
    entity: VendorentityFactory | Prisma.EntityCreateNestedOneWithoutVendorsInput;
};

type VendorTransientFields = Record<string, unknown> & Partial<Record<keyof VendorFactoryDefineInput, never>>;

type VendorFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<VendorFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Vendor, Prisma.VendorCreateInput, TTransients>;

type VendorFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<VendorFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: VendorFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Vendor, Prisma.VendorCreateInput, TTransients>;

function isVendorentityFactory(x: VendorentityFactory | Prisma.EntityCreateNestedOneWithoutVendorsInput | undefined): x is VendorentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type VendorTraitKeys<TOptions extends VendorFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface VendorFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Vendor";
    build(inputData?: Partial<Prisma.VendorCreateInput & TTransients>): PromiseLike<Prisma.VendorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.VendorCreateInput & TTransients>): PromiseLike<Prisma.VendorCreateInput>;
    buildList(list: readonly Partial<Prisma.VendorCreateInput & TTransients>[]): PromiseLike<Prisma.VendorCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.VendorCreateInput & TTransients>): PromiseLike<Prisma.VendorCreateInput[]>;
    pickForConnect(inputData: Vendor): Pick<Vendor, "id">;
    create(inputData?: Partial<Prisma.VendorCreateInput & TTransients>): PromiseLike<Vendor>;
    createList(list: readonly Partial<Prisma.VendorCreateInput & TTransients>[]): PromiseLike<Vendor[]>;
    createList(count: number, item?: Partial<Prisma.VendorCreateInput & TTransients>): PromiseLike<Vendor[]>;
    createForConnect(inputData?: Partial<Prisma.VendorCreateInput & TTransients>): PromiseLike<Pick<Vendor, "id">>;
}

export interface VendorFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends VendorFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): VendorFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateVendorScalarsOrEnums({ seq }: {
    readonly seq: number;
}): VendorScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Vendor", fieldName: "name", isId: false, isUnique: false, seq })
    };
}

function defineVendorFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends VendorFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): VendorFactoryInterface<TTransients, VendorTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly VendorTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Vendor", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.VendorCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateVendorScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<VendorFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<VendorFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isVendorentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.VendorCreateInput;
            const data: Prisma.VendorCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.VendorCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Vendor) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.VendorCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().vendor.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.VendorCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.VendorCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Vendor" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: VendorTraitKeys<TOptions>, ...names: readonly VendorTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface VendorFactoryBuilder {
    <TOptions extends VendorFactoryDefineOptions>(options: TOptions): VendorFactoryInterface<{}, VendorTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends VendorTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends VendorFactoryDefineOptions<TTransients>>(options: TOptions) => VendorFactoryInterface<TTransients, VendorTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Vendor} model.
 *
 * @param options
 * @returns factory {@link VendorFactoryInterface}
 */
export const defineVendorFactory = (<TOptions extends VendorFactoryDefineOptions>(options: TOptions): VendorFactoryInterface<TOptions> => {
    return defineVendorFactoryInternal(options, {});
}) as VendorFactoryBuilder;

defineVendorFactory.withTransientFields = defaultTransientFieldValues => options => defineVendorFactoryInternal(options, defaultTransientFieldValues);

type BillScalarOrEnumFields = {
    billNumber: string;
    issueDate: Date;
    dueDate: Date;
    currency: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    status: BillStatus;
    paidAmount: number;
};

type BillentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutBillsInput["create"]>;
};

type BillvendorFactory = {
    _factoryFor: "Vendor";
    build: () => PromiseLike<Prisma.VendorCreateNestedOneWithoutBillsInput["create"]>;
};

type BillFactoryDefineInput = {
    id?: string;
    billNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    currency?: string;
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    status?: BillStatus;
    paidAmount?: number;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: BillentityFactory | Prisma.EntityCreateNestedOneWithoutBillsInput;
    vendor: BillvendorFactory | Prisma.VendorCreateNestedOneWithoutBillsInput;
    billLines?: Prisma.BillLineCreateNestedManyWithoutBillInput;
    paymentAllocations?: Prisma.PaymentAllocationCreateNestedManyWithoutBillInput;
    creditNotes?: Prisma.CreditNoteCreateNestedManyWithoutLinkedBillInput;
};

type BillTransientFields = Record<string, unknown> & Partial<Record<keyof BillFactoryDefineInput, never>>;

type BillFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<BillFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Bill, Prisma.BillCreateInput, TTransients>;

type BillFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<BillFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: BillFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Bill, Prisma.BillCreateInput, TTransients>;

function isBillentityFactory(x: BillentityFactory | Prisma.EntityCreateNestedOneWithoutBillsInput | undefined): x is BillentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isBillvendorFactory(x: BillvendorFactory | Prisma.VendorCreateNestedOneWithoutBillsInput | undefined): x is BillvendorFactory {
    return (x as any)?._factoryFor === "Vendor";
}

type BillTraitKeys<TOptions extends BillFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface BillFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Bill";
    build(inputData?: Partial<Prisma.BillCreateInput & TTransients>): PromiseLike<Prisma.BillCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.BillCreateInput & TTransients>): PromiseLike<Prisma.BillCreateInput>;
    buildList(list: readonly Partial<Prisma.BillCreateInput & TTransients>[]): PromiseLike<Prisma.BillCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.BillCreateInput & TTransients>): PromiseLike<Prisma.BillCreateInput[]>;
    pickForConnect(inputData: Bill): Pick<Bill, "id">;
    create(inputData?: Partial<Prisma.BillCreateInput & TTransients>): PromiseLike<Bill>;
    createList(list: readonly Partial<Prisma.BillCreateInput & TTransients>[]): PromiseLike<Bill[]>;
    createList(count: number, item?: Partial<Prisma.BillCreateInput & TTransients>): PromiseLike<Bill[]>;
    createForConnect(inputData?: Partial<Prisma.BillCreateInput & TTransients>): PromiseLike<Pick<Bill, "id">>;
}

export interface BillFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends BillFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): BillFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateBillScalarsOrEnums({ seq }: {
    readonly seq: number;
}): BillScalarOrEnumFields {
    return {
        billNumber: getScalarFieldValueGenerator().String({ modelName: "Bill", fieldName: "billNumber", isId: false, isUnique: true, seq }),
        issueDate: getScalarFieldValueGenerator().DateTime({ modelName: "Bill", fieldName: "issueDate", isId: false, isUnique: false, seq }),
        dueDate: getScalarFieldValueGenerator().DateTime({ modelName: "Bill", fieldName: "dueDate", isId: false, isUnique: false, seq }),
        currency: getScalarFieldValueGenerator().String({ modelName: "Bill", fieldName: "currency", isId: false, isUnique: false, seq }),
        subtotal: getScalarFieldValueGenerator().Int({ modelName: "Bill", fieldName: "subtotal", isId: false, isUnique: false, seq }),
        taxAmount: getScalarFieldValueGenerator().Int({ modelName: "Bill", fieldName: "taxAmount", isId: false, isUnique: false, seq }),
        total: getScalarFieldValueGenerator().Int({ modelName: "Bill", fieldName: "total", isId: false, isUnique: false, seq }),
        status: "DRAFT",
        paidAmount: getScalarFieldValueGenerator().Int({ modelName: "Bill", fieldName: "paidAmount", isId: false, isUnique: false, seq })
    };
}

function defineBillFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends BillFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): BillFactoryInterface<TTransients, BillTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly BillTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Bill", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.BillCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateBillScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<BillFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<BillFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isBillentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                vendor: isBillvendorFactory(defaultData.vendor) ? {
                    create: await defaultData.vendor.build()
                } : defaultData.vendor
            } as Prisma.BillCreateInput;
            const data: Prisma.BillCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BillCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Bill) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.BillCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().bill.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BillCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.BillCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Bill" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: BillTraitKeys<TOptions>, ...names: readonly BillTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface BillFactoryBuilder {
    <TOptions extends BillFactoryDefineOptions>(options: TOptions): BillFactoryInterface<{}, BillTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends BillTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends BillFactoryDefineOptions<TTransients>>(options: TOptions) => BillFactoryInterface<TTransients, BillTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Bill} model.
 *
 * @param options
 * @returns factory {@link BillFactoryInterface}
 */
export const defineBillFactory = (<TOptions extends BillFactoryDefineOptions>(options: TOptions): BillFactoryInterface<TOptions> => {
    return defineBillFactoryInternal(options, {});
}) as BillFactoryBuilder;

defineBillFactory.withTransientFields = defaultTransientFieldValues => options => defineBillFactoryInternal(options, defaultTransientFieldValues);

type BillLineScalarOrEnumFields = {
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    amount: number;
};

type BillLinebillFactory = {
    _factoryFor: "Bill";
    build: () => PromiseLike<Prisma.BillCreateNestedOneWithoutBillLinesInput["create"]>;
};

type BillLinecategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutBillLinesInput["create"]>;
};

type BillLineglAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutBillLinesInput["create"]>;
};

type BillLinetaxRateFactory = {
    _factoryFor: "TaxRate";
    build: () => PromiseLike<Prisma.TaxRateCreateNestedOneWithoutBillLinesInput["create"]>;
};

type BillLineFactoryDefineInput = {
    id?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxAmount?: number;
    amount?: number;
    deletedAt?: Date | null;
    bill: BillLinebillFactory | Prisma.BillCreateNestedOneWithoutBillLinesInput;
    category?: BillLinecategoryFactory | Prisma.CategoryCreateNestedOneWithoutBillLinesInput;
    glAccount?: BillLineglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutBillLinesInput;
    taxRate?: BillLinetaxRateFactory | Prisma.TaxRateCreateNestedOneWithoutBillLinesInput;
};

type BillLineTransientFields = Record<string, unknown> & Partial<Record<keyof BillLineFactoryDefineInput, never>>;

type BillLineFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<BillLineFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<BillLine, Prisma.BillLineCreateInput, TTransients>;

type BillLineFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<BillLineFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: BillLineFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<BillLine, Prisma.BillLineCreateInput, TTransients>;

function isBillLinebillFactory(x: BillLinebillFactory | Prisma.BillCreateNestedOneWithoutBillLinesInput | undefined): x is BillLinebillFactory {
    return (x as any)?._factoryFor === "Bill";
}

function isBillLinecategoryFactory(x: BillLinecategoryFactory | Prisma.CategoryCreateNestedOneWithoutBillLinesInput | undefined): x is BillLinecategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

function isBillLineglAccountFactory(x: BillLineglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutBillLinesInput | undefined): x is BillLineglAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

function isBillLinetaxRateFactory(x: BillLinetaxRateFactory | Prisma.TaxRateCreateNestedOneWithoutBillLinesInput | undefined): x is BillLinetaxRateFactory {
    return (x as any)?._factoryFor === "TaxRate";
}

type BillLineTraitKeys<TOptions extends BillLineFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface BillLineFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "BillLine";
    build(inputData?: Partial<Prisma.BillLineCreateInput & TTransients>): PromiseLike<Prisma.BillLineCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.BillLineCreateInput & TTransients>): PromiseLike<Prisma.BillLineCreateInput>;
    buildList(list: readonly Partial<Prisma.BillLineCreateInput & TTransients>[]): PromiseLike<Prisma.BillLineCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.BillLineCreateInput & TTransients>): PromiseLike<Prisma.BillLineCreateInput[]>;
    pickForConnect(inputData: BillLine): Pick<BillLine, "id">;
    create(inputData?: Partial<Prisma.BillLineCreateInput & TTransients>): PromiseLike<BillLine>;
    createList(list: readonly Partial<Prisma.BillLineCreateInput & TTransients>[]): PromiseLike<BillLine[]>;
    createList(count: number, item?: Partial<Prisma.BillLineCreateInput & TTransients>): PromiseLike<BillLine[]>;
    createForConnect(inputData?: Partial<Prisma.BillLineCreateInput & TTransients>): PromiseLike<Pick<BillLine, "id">>;
}

export interface BillLineFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends BillLineFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): BillLineFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateBillLineScalarsOrEnums({ seq }: {
    readonly seq: number;
}): BillLineScalarOrEnumFields {
    return {
        description: getScalarFieldValueGenerator().String({ modelName: "BillLine", fieldName: "description", isId: false, isUnique: false, seq }),
        quantity: getScalarFieldValueGenerator().Int({ modelName: "BillLine", fieldName: "quantity", isId: false, isUnique: false, seq }),
        unitPrice: getScalarFieldValueGenerator().Int({ modelName: "BillLine", fieldName: "unitPrice", isId: false, isUnique: false, seq }),
        taxAmount: getScalarFieldValueGenerator().Int({ modelName: "BillLine", fieldName: "taxAmount", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "BillLine", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}

function defineBillLineFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends BillLineFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): BillLineFactoryInterface<TTransients, BillLineTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly BillLineTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("BillLine", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.BillLineCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateBillLineScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<BillLineFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<BillLineFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                bill: isBillLinebillFactory(defaultData.bill) ? {
                    create: await defaultData.bill.build()
                } : defaultData.bill,
                category: isBillLinecategoryFactory(defaultData.category) ? {
                    create: await defaultData.category.build()
                } : defaultData.category,
                glAccount: isBillLineglAccountFactory(defaultData.glAccount) ? {
                    create: await defaultData.glAccount.build()
                } : defaultData.glAccount,
                taxRate: isBillLinetaxRateFactory(defaultData.taxRate) ? {
                    create: await defaultData.taxRate.build()
                } : defaultData.taxRate
            } as Prisma.BillLineCreateInput;
            const data: Prisma.BillLineCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BillLineCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: BillLine) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.BillLineCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().billLine.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BillLineCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.BillLineCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "BillLine" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: BillLineTraitKeys<TOptions>, ...names: readonly BillLineTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface BillLineFactoryBuilder {
    <TOptions extends BillLineFactoryDefineOptions>(options: TOptions): BillLineFactoryInterface<{}, BillLineTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends BillLineTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends BillLineFactoryDefineOptions<TTransients>>(options: TOptions) => BillLineFactoryInterface<TTransients, BillLineTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link BillLine} model.
 *
 * @param options
 * @returns factory {@link BillLineFactoryInterface}
 */
export const defineBillLineFactory = (<TOptions extends BillLineFactoryDefineOptions>(options: TOptions): BillLineFactoryInterface<TOptions> => {
    return defineBillLineFactoryInternal(options, {});
}) as BillLineFactoryBuilder;

defineBillLineFactory.withTransientFields = defaultTransientFieldValues => options => defineBillLineFactoryInternal(options, defaultTransientFieldValues);

type PaymentScalarOrEnumFields = {
    date: Date;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
};

type PaymentclientFactory = {
    _factoryFor: "Client";
    build: () => PromiseLike<Prisma.ClientCreateNestedOneWithoutPaymentsInput["create"]>;
};

type PaymententityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutPaymentsInput["create"]>;
};

type PaymentvendorFactory = {
    _factoryFor: "Vendor";
    build: () => PromiseLike<Prisma.VendorCreateNestedOneWithoutPaymentsInput["create"]>;
};

type PaymentFactoryDefineInput = {
    id?: string;
    date?: Date;
    amount?: number;
    currency?: string;
    paymentMethod?: PaymentMethod;
    reference?: string | null;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    client?: PaymentclientFactory | Prisma.ClientCreateNestedOneWithoutPaymentsInput;
    entity: PaymententityFactory | Prisma.EntityCreateNestedOneWithoutPaymentsInput;
    vendor?: PaymentvendorFactory | Prisma.VendorCreateNestedOneWithoutPaymentsInput;
    allocations?: Prisma.PaymentAllocationCreateNestedManyWithoutPaymentInput;
};

type PaymentTransientFields = Record<string, unknown> & Partial<Record<keyof PaymentFactoryDefineInput, never>>;

type PaymentFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PaymentFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Payment, Prisma.PaymentCreateInput, TTransients>;

type PaymentFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<PaymentFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: PaymentFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Payment, Prisma.PaymentCreateInput, TTransients>;

function isPaymentclientFactory(x: PaymentclientFactory | Prisma.ClientCreateNestedOneWithoutPaymentsInput | undefined): x is PaymentclientFactory {
    return (x as any)?._factoryFor === "Client";
}

function isPaymententityFactory(x: PaymententityFactory | Prisma.EntityCreateNestedOneWithoutPaymentsInput | undefined): x is PaymententityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isPaymentvendorFactory(x: PaymentvendorFactory | Prisma.VendorCreateNestedOneWithoutPaymentsInput | undefined): x is PaymentvendorFactory {
    return (x as any)?._factoryFor === "Vendor";
}

type PaymentTraitKeys<TOptions extends PaymentFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface PaymentFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Payment";
    build(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Prisma.PaymentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Prisma.PaymentCreateInput>;
    buildList(list: readonly Partial<Prisma.PaymentCreateInput & TTransients>[]): PromiseLike<Prisma.PaymentCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Prisma.PaymentCreateInput[]>;
    pickForConnect(inputData: Payment): Pick<Payment, "id">;
    create(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Payment>;
    createList(list: readonly Partial<Prisma.PaymentCreateInput & TTransients>[]): PromiseLike<Payment[]>;
    createList(count: number, item?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Payment[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Pick<Payment, "id">>;
}

export interface PaymentFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PaymentFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PaymentFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGeneratePaymentScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PaymentScalarOrEnumFields {
    return {
        date: getScalarFieldValueGenerator().DateTime({ modelName: "Payment", fieldName: "date", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "Payment", fieldName: "amount", isId: false, isUnique: false, seq }),
        currency: getScalarFieldValueGenerator().String({ modelName: "Payment", fieldName: "currency", isId: false, isUnique: false, seq }),
        paymentMethod: "CARD"
    };
}

function definePaymentFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends PaymentFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): PaymentFactoryInterface<TTransients, PaymentTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly PaymentTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Payment", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.PaymentCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePaymentScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<PaymentFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<PaymentFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                client: isPaymentclientFactory(defaultData.client) ? {
                    create: await defaultData.client.build()
                } : defaultData.client,
                entity: isPaymententityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                vendor: isPaymentvendorFactory(defaultData.vendor) ? {
                    create: await defaultData.vendor.build()
                } : defaultData.vendor
            } as Prisma.PaymentCreateInput;
            const data: Prisma.PaymentCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.PaymentCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Payment) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.PaymentCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().payment.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.PaymentCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.PaymentCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Payment" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: PaymentTraitKeys<TOptions>, ...names: readonly PaymentTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface PaymentFactoryBuilder {
    <TOptions extends PaymentFactoryDefineOptions>(options: TOptions): PaymentFactoryInterface<{}, PaymentTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PaymentTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PaymentFactoryDefineOptions<TTransients>>(options: TOptions) => PaymentFactoryInterface<TTransients, PaymentTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Payment} model.
 *
 * @param options
 * @returns factory {@link PaymentFactoryInterface}
 */
export const definePaymentFactory = (<TOptions extends PaymentFactoryDefineOptions>(options: TOptions): PaymentFactoryInterface<TOptions> => {
    return definePaymentFactoryInternal(options, {});
}) as PaymentFactoryBuilder;

definePaymentFactory.withTransientFields = defaultTransientFieldValues => options => definePaymentFactoryInternal(options, defaultTransientFieldValues);

type PaymentAllocationScalarOrEnumFields = {
    amount: number;
};

type PaymentAllocationpaymentFactory = {
    _factoryFor: "Payment";
    build: () => PromiseLike<Prisma.PaymentCreateNestedOneWithoutAllocationsInput["create"]>;
};

type PaymentAllocationinvoiceFactory = {
    _factoryFor: "Invoice";
    build: () => PromiseLike<Prisma.InvoiceCreateNestedOneWithoutPaymentAllocationsInput["create"]>;
};

type PaymentAllocationbillFactory = {
    _factoryFor: "Bill";
    build: () => PromiseLike<Prisma.BillCreateNestedOneWithoutPaymentAllocationsInput["create"]>;
};

type PaymentAllocationFactoryDefineInput = {
    id?: string;
    amount?: number;
    createdAt?: Date;
    payment: PaymentAllocationpaymentFactory | Prisma.PaymentCreateNestedOneWithoutAllocationsInput;
    invoice?: PaymentAllocationinvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutPaymentAllocationsInput;
    bill?: PaymentAllocationbillFactory | Prisma.BillCreateNestedOneWithoutPaymentAllocationsInput;
};

type PaymentAllocationTransientFields = Record<string, unknown> & Partial<Record<keyof PaymentAllocationFactoryDefineInput, never>>;

type PaymentAllocationFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PaymentAllocationFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PaymentAllocation, Prisma.PaymentAllocationCreateInput, TTransients>;

type PaymentAllocationFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<PaymentAllocationFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: PaymentAllocationFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PaymentAllocation, Prisma.PaymentAllocationCreateInput, TTransients>;

function isPaymentAllocationpaymentFactory(x: PaymentAllocationpaymentFactory | Prisma.PaymentCreateNestedOneWithoutAllocationsInput | undefined): x is PaymentAllocationpaymentFactory {
    return (x as any)?._factoryFor === "Payment";
}

function isPaymentAllocationinvoiceFactory(x: PaymentAllocationinvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutPaymentAllocationsInput | undefined): x is PaymentAllocationinvoiceFactory {
    return (x as any)?._factoryFor === "Invoice";
}

function isPaymentAllocationbillFactory(x: PaymentAllocationbillFactory | Prisma.BillCreateNestedOneWithoutPaymentAllocationsInput | undefined): x is PaymentAllocationbillFactory {
    return (x as any)?._factoryFor === "Bill";
}

type PaymentAllocationTraitKeys<TOptions extends PaymentAllocationFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface PaymentAllocationFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PaymentAllocation";
    build(inputData?: Partial<Prisma.PaymentAllocationCreateInput & TTransients>): PromiseLike<Prisma.PaymentAllocationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentAllocationCreateInput & TTransients>): PromiseLike<Prisma.PaymentAllocationCreateInput>;
    buildList(list: readonly Partial<Prisma.PaymentAllocationCreateInput & TTransients>[]): PromiseLike<Prisma.PaymentAllocationCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PaymentAllocationCreateInput & TTransients>): PromiseLike<Prisma.PaymentAllocationCreateInput[]>;
    pickForConnect(inputData: PaymentAllocation): Pick<PaymentAllocation, "id">;
    create(inputData?: Partial<Prisma.PaymentAllocationCreateInput & TTransients>): PromiseLike<PaymentAllocation>;
    createList(list: readonly Partial<Prisma.PaymentAllocationCreateInput & TTransients>[]): PromiseLike<PaymentAllocation[]>;
    createList(count: number, item?: Partial<Prisma.PaymentAllocationCreateInput & TTransients>): PromiseLike<PaymentAllocation[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentAllocationCreateInput & TTransients>): PromiseLike<Pick<PaymentAllocation, "id">>;
}

export interface PaymentAllocationFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PaymentAllocationFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PaymentAllocationFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGeneratePaymentAllocationScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PaymentAllocationScalarOrEnumFields {
    return {
        amount: getScalarFieldValueGenerator().Int({ modelName: "PaymentAllocation", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}

function definePaymentAllocationFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends PaymentAllocationFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): PaymentAllocationFactoryInterface<TTransients, PaymentAllocationTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly PaymentAllocationTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PaymentAllocation", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.PaymentAllocationCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePaymentAllocationScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<PaymentAllocationFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<PaymentAllocationFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                payment: isPaymentAllocationpaymentFactory(defaultData.payment) ? {
                    create: await defaultData.payment.build()
                } : defaultData.payment,
                invoice: isPaymentAllocationinvoiceFactory(defaultData.invoice) ? {
                    create: await defaultData.invoice.build()
                } : defaultData.invoice,
                bill: isPaymentAllocationbillFactory(defaultData.bill) ? {
                    create: await defaultData.bill.build()
                } : defaultData.bill
            } as Prisma.PaymentAllocationCreateInput;
            const data: Prisma.PaymentAllocationCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.PaymentAllocationCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: PaymentAllocation) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.PaymentAllocationCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().paymentAllocation.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.PaymentAllocationCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.PaymentAllocationCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PaymentAllocation" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: PaymentAllocationTraitKeys<TOptions>, ...names: readonly PaymentAllocationTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface PaymentAllocationFactoryBuilder {
    <TOptions extends PaymentAllocationFactoryDefineOptions>(options: TOptions): PaymentAllocationFactoryInterface<{}, PaymentAllocationTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PaymentAllocationTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PaymentAllocationFactoryDefineOptions<TTransients>>(options: TOptions) => PaymentAllocationFactoryInterface<TTransients, PaymentAllocationTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link PaymentAllocation} model.
 *
 * @param options
 * @returns factory {@link PaymentAllocationFactoryInterface}
 */
export const definePaymentAllocationFactory = (<TOptions extends PaymentAllocationFactoryDefineOptions>(options: TOptions): PaymentAllocationFactoryInterface<TOptions> => {
    return definePaymentAllocationFactoryInternal(options, {});
}) as PaymentAllocationFactoryBuilder;

definePaymentAllocationFactory.withTransientFields = defaultTransientFieldValues => options => definePaymentAllocationFactoryInternal(options, defaultTransientFieldValues);

type CreditNoteScalarOrEnumFields = {
    creditNoteNumber: string;
    date: Date;
    currency: string;
    amount: number;
    reason: string;
};

type CreditNoteentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutCreditNotesInput["create"]>;
};

type CreditNotelinkedInvoiceFactory = {
    _factoryFor: "Invoice";
    build: () => PromiseLike<Prisma.InvoiceCreateNestedOneWithoutCreditNotesInput["create"]>;
};

type CreditNotelinkedBillFactory = {
    _factoryFor: "Bill";
    build: () => PromiseLike<Prisma.BillCreateNestedOneWithoutCreditNotesInput["create"]>;
};

type CreditNoteFactoryDefineInput = {
    id?: string;
    creditNoteNumber?: string;
    date?: Date;
    currency?: string;
    amount?: number;
    appliedAmount?: number;
    reason?: string;
    notes?: string | null;
    status?: CreditNoteStatus;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: CreditNoteentityFactory | Prisma.EntityCreateNestedOneWithoutCreditNotesInput;
    linkedInvoice?: CreditNotelinkedInvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutCreditNotesInput;
    linkedBill?: CreditNotelinkedBillFactory | Prisma.BillCreateNestedOneWithoutCreditNotesInput;
};

type CreditNoteTransientFields = Record<string, unknown> & Partial<Record<keyof CreditNoteFactoryDefineInput, never>>;

type CreditNoteFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CreditNoteFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<CreditNote, Prisma.CreditNoteCreateInput, TTransients>;

type CreditNoteFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<CreditNoteFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: CreditNoteFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<CreditNote, Prisma.CreditNoteCreateInput, TTransients>;

function isCreditNoteentityFactory(x: CreditNoteentityFactory | Prisma.EntityCreateNestedOneWithoutCreditNotesInput | undefined): x is CreditNoteentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isCreditNotelinkedInvoiceFactory(x: CreditNotelinkedInvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutCreditNotesInput | undefined): x is CreditNotelinkedInvoiceFactory {
    return (x as any)?._factoryFor === "Invoice";
}

function isCreditNotelinkedBillFactory(x: CreditNotelinkedBillFactory | Prisma.BillCreateNestedOneWithoutCreditNotesInput | undefined): x is CreditNotelinkedBillFactory {
    return (x as any)?._factoryFor === "Bill";
}

type CreditNoteTraitKeys<TOptions extends CreditNoteFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface CreditNoteFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "CreditNote";
    build(inputData?: Partial<Prisma.CreditNoteCreateInput & TTransients>): PromiseLike<Prisma.CreditNoteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CreditNoteCreateInput & TTransients>): PromiseLike<Prisma.CreditNoteCreateInput>;
    buildList(list: readonly Partial<Prisma.CreditNoteCreateInput & TTransients>[]): PromiseLike<Prisma.CreditNoteCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CreditNoteCreateInput & TTransients>): PromiseLike<Prisma.CreditNoteCreateInput[]>;
    pickForConnect(inputData: CreditNote): Pick<CreditNote, "id">;
    create(inputData?: Partial<Prisma.CreditNoteCreateInput & TTransients>): PromiseLike<CreditNote>;
    createList(list: readonly Partial<Prisma.CreditNoteCreateInput & TTransients>[]): PromiseLike<CreditNote[]>;
    createList(count: number, item?: Partial<Prisma.CreditNoteCreateInput & TTransients>): PromiseLike<CreditNote[]>;
    createForConnect(inputData?: Partial<Prisma.CreditNoteCreateInput & TTransients>): PromiseLike<Pick<CreditNote, "id">>;
}

export interface CreditNoteFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CreditNoteFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CreditNoteFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateCreditNoteScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CreditNoteScalarOrEnumFields {
    return {
        creditNoteNumber: getScalarFieldValueGenerator().String({ modelName: "CreditNote", fieldName: "creditNoteNumber", isId: false, isUnique: true, seq }),
        date: getScalarFieldValueGenerator().DateTime({ modelName: "CreditNote", fieldName: "date", isId: false, isUnique: false, seq }),
        currency: getScalarFieldValueGenerator().String({ modelName: "CreditNote", fieldName: "currency", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "CreditNote", fieldName: "amount", isId: false, isUnique: false, seq }),
        reason: getScalarFieldValueGenerator().String({ modelName: "CreditNote", fieldName: "reason", isId: false, isUnique: false, seq })
    };
}

function defineCreditNoteFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends CreditNoteFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): CreditNoteFactoryInterface<TTransients, CreditNoteTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly CreditNoteTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("CreditNote", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.CreditNoteCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCreditNoteScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<CreditNoteFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<CreditNoteFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isCreditNoteentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                linkedInvoice: isCreditNotelinkedInvoiceFactory(defaultData.linkedInvoice) ? {
                    create: await defaultData.linkedInvoice.build()
                } : defaultData.linkedInvoice,
                linkedBill: isCreditNotelinkedBillFactory(defaultData.linkedBill) ? {
                    create: await defaultData.linkedBill.build()
                } : defaultData.linkedBill
            } as Prisma.CreditNoteCreateInput;
            const data: Prisma.CreditNoteCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.CreditNoteCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: CreditNote) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.CreditNoteCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().creditNote.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.CreditNoteCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.CreditNoteCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "CreditNote" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: CreditNoteTraitKeys<TOptions>, ...names: readonly CreditNoteTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface CreditNoteFactoryBuilder {
    <TOptions extends CreditNoteFactoryDefineOptions>(options: TOptions): CreditNoteFactoryInterface<{}, CreditNoteTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CreditNoteTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CreditNoteFactoryDefineOptions<TTransients>>(options: TOptions) => CreditNoteFactoryInterface<TTransients, CreditNoteTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link CreditNote} model.
 *
 * @param options
 * @returns factory {@link CreditNoteFactoryInterface}
 */
export const defineCreditNoteFactory = (<TOptions extends CreditNoteFactoryDefineOptions>(options: TOptions): CreditNoteFactoryInterface<TOptions> => {
    return defineCreditNoteFactoryInternal(options, {});
}) as CreditNoteFactoryBuilder;

defineCreditNoteFactory.withTransientFields = defaultTransientFieldValues => options => defineCreditNoteFactoryInternal(options, defaultTransientFieldValues);

type AccountScalarOrEnumFields = {
    name: string;
    type: AccountType;
    currency: string;
    country: string;
    currentBalance: number;
};

type AccountentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutAccountsInput["create"]>;
};

type AccountbankConnectionFactory = {
    _factoryFor: "BankConnection";
    build: () => PromiseLike<Prisma.BankConnectionCreateNestedOneWithoutAccountsInput["create"]>;
};

type AccountglAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutBankAccountsInput["create"]>;
};

type AccountFactoryDefineInput = {
    id?: string;
    name?: string;
    type?: AccountType;
    institution?: string | null;
    currency?: string;
    country?: string;
    currentBalance?: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: AccountentityFactory | Prisma.EntityCreateNestedOneWithoutAccountsInput;
    bankConnection?: AccountbankConnectionFactory | Prisma.BankConnectionCreateNestedOneWithoutAccountsInput;
    feedTxns?: Prisma.BankFeedTransactionCreateNestedManyWithoutAccountInput;
    glAccount?: AccountglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutBankAccountsInput;
    goals?: Prisma.GoalCreateNestedManyWithoutAccountInput;
    transactions?: Prisma.TransactionCreateNestedManyWithoutAccountInput;
};

type AccountTransientFields = Record<string, unknown> & Partial<Record<keyof AccountFactoryDefineInput, never>>;

type AccountFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AccountFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Account, Prisma.AccountCreateInput, TTransients>;

type AccountFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<AccountFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: AccountFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Account, Prisma.AccountCreateInput, TTransients>;

function isAccountentityFactory(x: AccountentityFactory | Prisma.EntityCreateNestedOneWithoutAccountsInput | undefined): x is AccountentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isAccountbankConnectionFactory(x: AccountbankConnectionFactory | Prisma.BankConnectionCreateNestedOneWithoutAccountsInput | undefined): x is AccountbankConnectionFactory {
    return (x as any)?._factoryFor === "BankConnection";
}

function isAccountglAccountFactory(x: AccountglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutBankAccountsInput | undefined): x is AccountglAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

type AccountTraitKeys<TOptions extends AccountFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface AccountFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Account";
    build(inputData?: Partial<Prisma.AccountCreateInput & TTransients>): PromiseLike<Prisma.AccountCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AccountCreateInput & TTransients>): PromiseLike<Prisma.AccountCreateInput>;
    buildList(list: readonly Partial<Prisma.AccountCreateInput & TTransients>[]): PromiseLike<Prisma.AccountCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AccountCreateInput & TTransients>): PromiseLike<Prisma.AccountCreateInput[]>;
    pickForConnect(inputData: Account): Pick<Account, "id">;
    create(inputData?: Partial<Prisma.AccountCreateInput & TTransients>): PromiseLike<Account>;
    createList(list: readonly Partial<Prisma.AccountCreateInput & TTransients>[]): PromiseLike<Account[]>;
    createList(count: number, item?: Partial<Prisma.AccountCreateInput & TTransients>): PromiseLike<Account[]>;
    createForConnect(inputData?: Partial<Prisma.AccountCreateInput & TTransients>): PromiseLike<Pick<Account, "id">>;
}

export interface AccountFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AccountFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AccountFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateAccountScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AccountScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Account", fieldName: "name", isId: false, isUnique: false, seq }),
        type: "BANK",
        currency: getScalarFieldValueGenerator().String({ modelName: "Account", fieldName: "currency", isId: false, isUnique: false, seq }),
        country: getScalarFieldValueGenerator().String({ modelName: "Account", fieldName: "country", isId: false, isUnique: false, seq }),
        currentBalance: getScalarFieldValueGenerator().Int({ modelName: "Account", fieldName: "currentBalance", isId: false, isUnique: false, seq })
    };
}

function defineAccountFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends AccountFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): AccountFactoryInterface<TTransients, AccountTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly AccountTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Account", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.AccountCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAccountScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<AccountFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<AccountFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isAccountentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                bankConnection: isAccountbankConnectionFactory(defaultData.bankConnection) ? {
                    create: await defaultData.bankConnection.build()
                } : defaultData.bankConnection,
                glAccount: isAccountglAccountFactory(defaultData.glAccount) ? {
                    create: await defaultData.glAccount.build()
                } : defaultData.glAccount
            } as Prisma.AccountCreateInput;
            const data: Prisma.AccountCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AccountCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Account) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.AccountCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().account.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AccountCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.AccountCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Account" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: AccountTraitKeys<TOptions>, ...names: readonly AccountTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface AccountFactoryBuilder {
    <TOptions extends AccountFactoryDefineOptions>(options: TOptions): AccountFactoryInterface<{}, AccountTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AccountTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AccountFactoryDefineOptions<TTransients>>(options: TOptions) => AccountFactoryInterface<TTransients, AccountTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Account} model.
 *
 * @param options
 * @returns factory {@link AccountFactoryInterface}
 */
export const defineAccountFactory = (<TOptions extends AccountFactoryDefineOptions>(options: TOptions): AccountFactoryInterface<TOptions> => {
    return defineAccountFactoryInternal(options, {});
}) as AccountFactoryBuilder;

defineAccountFactory.withTransientFields = defaultTransientFieldValues => options => defineAccountFactoryInternal(options, defaultTransientFieldValues);

type BankConnectionScalarOrEnumFields = {
    provider: BankConnectionProvider;
    institutionId: string;
    institutionName: string;
    status: BankConnectionStatus;
};

type BankConnectionentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutBankConnectionsInput["create"]>;
};

type BankConnectionFactoryDefineInput = {
    id?: string;
    provider?: BankConnectionProvider;
    providerItemId?: string | null;
    institutionId?: string;
    institutionName?: string;
    status?: BankConnectionStatus;
    lastSyncAt?: Date | null;
    errorMessage?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: BankConnectionentityFactory | Prisma.EntityCreateNestedOneWithoutBankConnectionsInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutBankConnectionInput;
    feedTxns?: Prisma.BankFeedTransactionCreateNestedManyWithoutBankConnectionInput;
};

type BankConnectionTransientFields = Record<string, unknown> & Partial<Record<keyof BankConnectionFactoryDefineInput, never>>;

type BankConnectionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<BankConnectionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<BankConnection, Prisma.BankConnectionCreateInput, TTransients>;

type BankConnectionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<BankConnectionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: BankConnectionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<BankConnection, Prisma.BankConnectionCreateInput, TTransients>;

function isBankConnectionentityFactory(x: BankConnectionentityFactory | Prisma.EntityCreateNestedOneWithoutBankConnectionsInput | undefined): x is BankConnectionentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type BankConnectionTraitKeys<TOptions extends BankConnectionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface BankConnectionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "BankConnection";
    build(inputData?: Partial<Prisma.BankConnectionCreateInput & TTransients>): PromiseLike<Prisma.BankConnectionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.BankConnectionCreateInput & TTransients>): PromiseLike<Prisma.BankConnectionCreateInput>;
    buildList(list: readonly Partial<Prisma.BankConnectionCreateInput & TTransients>[]): PromiseLike<Prisma.BankConnectionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.BankConnectionCreateInput & TTransients>): PromiseLike<Prisma.BankConnectionCreateInput[]>;
    pickForConnect(inputData: BankConnection): Pick<BankConnection, "id">;
    create(inputData?: Partial<Prisma.BankConnectionCreateInput & TTransients>): PromiseLike<BankConnection>;
    createList(list: readonly Partial<Prisma.BankConnectionCreateInput & TTransients>[]): PromiseLike<BankConnection[]>;
    createList(count: number, item?: Partial<Prisma.BankConnectionCreateInput & TTransients>): PromiseLike<BankConnection[]>;
    createForConnect(inputData?: Partial<Prisma.BankConnectionCreateInput & TTransients>): PromiseLike<Pick<BankConnection, "id">>;
}

export interface BankConnectionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends BankConnectionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): BankConnectionFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateBankConnectionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): BankConnectionScalarOrEnumFields {
    return {
        provider: "FLINKS",
        institutionId: getScalarFieldValueGenerator().String({ modelName: "BankConnection", fieldName: "institutionId", isId: false, isUnique: false, seq }),
        institutionName: getScalarFieldValueGenerator().String({ modelName: "BankConnection", fieldName: "institutionName", isId: false, isUnique: false, seq }),
        status: "ACTIVE"
    };
}

function defineBankConnectionFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends BankConnectionFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): BankConnectionFactoryInterface<TTransients, BankConnectionTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly BankConnectionTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("BankConnection", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.BankConnectionCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateBankConnectionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<BankConnectionFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<BankConnectionFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isBankConnectionentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.BankConnectionCreateInput;
            const data: Prisma.BankConnectionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BankConnectionCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: BankConnection) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.BankConnectionCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().bankConnection.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BankConnectionCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.BankConnectionCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "BankConnection" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: BankConnectionTraitKeys<TOptions>, ...names: readonly BankConnectionTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface BankConnectionFactoryBuilder {
    <TOptions extends BankConnectionFactoryDefineOptions>(options: TOptions): BankConnectionFactoryInterface<{}, BankConnectionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends BankConnectionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends BankConnectionFactoryDefineOptions<TTransients>>(options: TOptions) => BankConnectionFactoryInterface<TTransients, BankConnectionTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link BankConnection} model.
 *
 * @param options
 * @returns factory {@link BankConnectionFactoryInterface}
 */
export const defineBankConnectionFactory = (<TOptions extends BankConnectionFactoryDefineOptions>(options: TOptions): BankConnectionFactoryInterface<TOptions> => {
    return defineBankConnectionFactoryInternal(options, {});
}) as BankConnectionFactoryBuilder;

defineBankConnectionFactory.withTransientFields = defaultTransientFieldValues => options => defineBankConnectionFactoryInternal(options, defaultTransientFieldValues);

type BankFeedTransactionScalarOrEnumFields = {
    bankTransactionId: string;
    date: Date;
    description: string;
    amount: number;
    currency: string;
};

type BankFeedTransactionaccountFactory = {
    _factoryFor: "Account";
    build: () => PromiseLike<Prisma.AccountCreateNestedOneWithoutFeedTxnsInput["create"]>;
};

type BankFeedTransactionbankConnectionFactory = {
    _factoryFor: "BankConnection";
    build: () => PromiseLike<Prisma.BankConnectionCreateNestedOneWithoutFeedTxnsInput["create"]>;
};

type BankFeedTransactionFactoryDefineInput = {
    id?: string;
    bankTransactionId?: string;
    date?: Date;
    description?: string;
    amount?: number;
    currency?: string;
    balance?: number | null;
    rawData?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    merchantHints?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    status?: BankFeedStatus;
    statusHistory?: Prisma.BankFeedTransactionCreatestatusHistoryInput | Array<Prisma.InputJsonValue>;
    postedToJournalId?: string | null;
    createdAt?: Date;
    deletedAt?: Date | null;
    account: BankFeedTransactionaccountFactory | Prisma.AccountCreateNestedOneWithoutFeedTxnsInput;
    bankConnection: BankFeedTransactionbankConnectionFactory | Prisma.BankConnectionCreateNestedOneWithoutFeedTxnsInput;
    transactionMatches?: Prisma.TransactionMatchCreateNestedManyWithoutBankFeedTransactionInput;
};

type BankFeedTransactionTransientFields = Record<string, unknown> & Partial<Record<keyof BankFeedTransactionFactoryDefineInput, never>>;

type BankFeedTransactionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<BankFeedTransactionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<BankFeedTransaction, Prisma.BankFeedTransactionCreateInput, TTransients>;

type BankFeedTransactionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<BankFeedTransactionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: BankFeedTransactionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<BankFeedTransaction, Prisma.BankFeedTransactionCreateInput, TTransients>;

function isBankFeedTransactionaccountFactory(x: BankFeedTransactionaccountFactory | Prisma.AccountCreateNestedOneWithoutFeedTxnsInput | undefined): x is BankFeedTransactionaccountFactory {
    return (x as any)?._factoryFor === "Account";
}

function isBankFeedTransactionbankConnectionFactory(x: BankFeedTransactionbankConnectionFactory | Prisma.BankConnectionCreateNestedOneWithoutFeedTxnsInput | undefined): x is BankFeedTransactionbankConnectionFactory {
    return (x as any)?._factoryFor === "BankConnection";
}

type BankFeedTransactionTraitKeys<TOptions extends BankFeedTransactionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface BankFeedTransactionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "BankFeedTransaction";
    build(inputData?: Partial<Prisma.BankFeedTransactionCreateInput & TTransients>): PromiseLike<Prisma.BankFeedTransactionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.BankFeedTransactionCreateInput & TTransients>): PromiseLike<Prisma.BankFeedTransactionCreateInput>;
    buildList(list: readonly Partial<Prisma.BankFeedTransactionCreateInput & TTransients>[]): PromiseLike<Prisma.BankFeedTransactionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.BankFeedTransactionCreateInput & TTransients>): PromiseLike<Prisma.BankFeedTransactionCreateInput[]>;
    pickForConnect(inputData: BankFeedTransaction): Pick<BankFeedTransaction, "id">;
    create(inputData?: Partial<Prisma.BankFeedTransactionCreateInput & TTransients>): PromiseLike<BankFeedTransaction>;
    createList(list: readonly Partial<Prisma.BankFeedTransactionCreateInput & TTransients>[]): PromiseLike<BankFeedTransaction[]>;
    createList(count: number, item?: Partial<Prisma.BankFeedTransactionCreateInput & TTransients>): PromiseLike<BankFeedTransaction[]>;
    createForConnect(inputData?: Partial<Prisma.BankFeedTransactionCreateInput & TTransients>): PromiseLike<Pick<BankFeedTransaction, "id">>;
}

export interface BankFeedTransactionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends BankFeedTransactionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): BankFeedTransactionFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateBankFeedTransactionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): BankFeedTransactionScalarOrEnumFields {
    return {
        bankTransactionId: getScalarFieldValueGenerator().String({ modelName: "BankFeedTransaction", fieldName: "bankTransactionId", isId: false, isUnique: false, seq }),
        date: getScalarFieldValueGenerator().DateTime({ modelName: "BankFeedTransaction", fieldName: "date", isId: false, isUnique: false, seq }),
        description: getScalarFieldValueGenerator().String({ modelName: "BankFeedTransaction", fieldName: "description", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "BankFeedTransaction", fieldName: "amount", isId: false, isUnique: false, seq }),
        currency: getScalarFieldValueGenerator().String({ modelName: "BankFeedTransaction", fieldName: "currency", isId: false, isUnique: false, seq })
    };
}

function defineBankFeedTransactionFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends BankFeedTransactionFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): BankFeedTransactionFactoryInterface<TTransients, BankFeedTransactionTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly BankFeedTransactionTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("BankFeedTransaction", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.BankFeedTransactionCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateBankFeedTransactionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<BankFeedTransactionFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<BankFeedTransactionFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                account: isBankFeedTransactionaccountFactory(defaultData.account) ? {
                    create: await defaultData.account.build()
                } : defaultData.account,
                bankConnection: isBankFeedTransactionbankConnectionFactory(defaultData.bankConnection) ? {
                    create: await defaultData.bankConnection.build()
                } : defaultData.bankConnection
            } as Prisma.BankFeedTransactionCreateInput;
            const data: Prisma.BankFeedTransactionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BankFeedTransactionCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: BankFeedTransaction) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.BankFeedTransactionCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().bankFeedTransaction.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BankFeedTransactionCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.BankFeedTransactionCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "BankFeedTransaction" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: BankFeedTransactionTraitKeys<TOptions>, ...names: readonly BankFeedTransactionTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface BankFeedTransactionFactoryBuilder {
    <TOptions extends BankFeedTransactionFactoryDefineOptions>(options: TOptions): BankFeedTransactionFactoryInterface<{}, BankFeedTransactionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends BankFeedTransactionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends BankFeedTransactionFactoryDefineOptions<TTransients>>(options: TOptions) => BankFeedTransactionFactoryInterface<TTransients, BankFeedTransactionTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link BankFeedTransaction} model.
 *
 * @param options
 * @returns factory {@link BankFeedTransactionFactoryInterface}
 */
export const defineBankFeedTransactionFactory = (<TOptions extends BankFeedTransactionFactoryDefineOptions>(options: TOptions): BankFeedTransactionFactoryInterface<TOptions> => {
    return defineBankFeedTransactionFactoryInternal(options, {});
}) as BankFeedTransactionFactoryBuilder;

defineBankFeedTransactionFactory.withTransientFields = defaultTransientFieldValues => options => defineBankFeedTransactionFactoryInternal(options, defaultTransientFieldValues);

type TransactionScalarOrEnumFields = {
    date: Date;
    description: string;
    amount: number;
    currency: string;
    sourceType: TransactionSourceType;
};

type TransactionaccountFactory = {
    _factoryFor: "Account";
    build: () => PromiseLike<Prisma.AccountCreateNestedOneWithoutTransactionsInput["create"]>;
};

type TransactioncategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutTransactionsInput["create"]>;
};

type TransactionimportBatchFactory = {
    _factoryFor: "ImportBatch";
    build: () => PromiseLike<Prisma.ImportBatchCreateNestedOneWithoutTransactionsInput["create"]>;
};

type TransactionjournalEntryFactory = {
    _factoryFor: "JournalEntry";
    build: () => PromiseLike<Prisma.JournalEntryCreateNestedOneWithoutTransactionsInput["create"]>;
};

type TransactionFactoryDefineInput = {
    id?: string;
    date?: Date;
    description?: string;
    amount?: number;
    currency?: string;
    notes?: string | null;
    sourceType?: TransactionSourceType;
    sourceId?: string | null;
    isStaged?: boolean;
    isSplit?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    account: TransactionaccountFactory | Prisma.AccountCreateNestedOneWithoutTransactionsInput;
    category?: TransactioncategoryFactory | Prisma.CategoryCreateNestedOneWithoutTransactionsInput;
    importBatch?: TransactionimportBatchFactory | Prisma.ImportBatchCreateNestedOneWithoutTransactionsInput;
    journalEntry?: TransactionjournalEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutTransactionsInput;
    matches?: Prisma.TransactionMatchCreateNestedManyWithoutTransactionInput;
    splits?: Prisma.TransactionSplitCreateNestedManyWithoutTransactionInput;
};

type TransactionTransientFields = Record<string, unknown> & Partial<Record<keyof TransactionFactoryDefineInput, never>>;

type TransactionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TransactionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Transaction, Prisma.TransactionCreateInput, TTransients>;

type TransactionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TransactionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TransactionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Transaction, Prisma.TransactionCreateInput, TTransients>;

function isTransactionaccountFactory(x: TransactionaccountFactory | Prisma.AccountCreateNestedOneWithoutTransactionsInput | undefined): x is TransactionaccountFactory {
    return (x as any)?._factoryFor === "Account";
}

function isTransactioncategoryFactory(x: TransactioncategoryFactory | Prisma.CategoryCreateNestedOneWithoutTransactionsInput | undefined): x is TransactioncategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

function isTransactionimportBatchFactory(x: TransactionimportBatchFactory | Prisma.ImportBatchCreateNestedOneWithoutTransactionsInput | undefined): x is TransactionimportBatchFactory {
    return (x as any)?._factoryFor === "ImportBatch";
}

function isTransactionjournalEntryFactory(x: TransactionjournalEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutTransactionsInput | undefined): x is TransactionjournalEntryFactory {
    return (x as any)?._factoryFor === "JournalEntry";
}

type TransactionTraitKeys<TOptions extends TransactionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface TransactionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Transaction";
    build(inputData?: Partial<Prisma.TransactionCreateInput & TTransients>): PromiseLike<Prisma.TransactionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TransactionCreateInput & TTransients>): PromiseLike<Prisma.TransactionCreateInput>;
    buildList(list: readonly Partial<Prisma.TransactionCreateInput & TTransients>[]): PromiseLike<Prisma.TransactionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TransactionCreateInput & TTransients>): PromiseLike<Prisma.TransactionCreateInput[]>;
    pickForConnect(inputData: Transaction): Pick<Transaction, "id">;
    create(inputData?: Partial<Prisma.TransactionCreateInput & TTransients>): PromiseLike<Transaction>;
    createList(list: readonly Partial<Prisma.TransactionCreateInput & TTransients>[]): PromiseLike<Transaction[]>;
    createList(count: number, item?: Partial<Prisma.TransactionCreateInput & TTransients>): PromiseLike<Transaction[]>;
    createForConnect(inputData?: Partial<Prisma.TransactionCreateInput & TTransients>): PromiseLike<Pick<Transaction, "id">>;
}

export interface TransactionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TransactionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TransactionFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateTransactionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TransactionScalarOrEnumFields {
    return {
        date: getScalarFieldValueGenerator().DateTime({ modelName: "Transaction", fieldName: "date", isId: false, isUnique: false, seq }),
        description: getScalarFieldValueGenerator().String({ modelName: "Transaction", fieldName: "description", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "Transaction", fieldName: "amount", isId: false, isUnique: false, seq }),
        currency: getScalarFieldValueGenerator().String({ modelName: "Transaction", fieldName: "currency", isId: false, isUnique: false, seq }),
        sourceType: "BANK_FEED"
    };
}

function defineTransactionFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends TransactionFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): TransactionFactoryInterface<TTransients, TransactionTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly TransactionTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Transaction", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.TransactionCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTransactionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<TransactionFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<TransactionFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                account: isTransactionaccountFactory(defaultData.account) ? {
                    create: await defaultData.account.build()
                } : defaultData.account,
                category: isTransactioncategoryFactory(defaultData.category) ? {
                    create: await defaultData.category.build()
                } : defaultData.category,
                importBatch: isTransactionimportBatchFactory(defaultData.importBatch) ? {
                    create: await defaultData.importBatch.build()
                } : defaultData.importBatch,
                journalEntry: isTransactionjournalEntryFactory(defaultData.journalEntry) ? {
                    create: await defaultData.journalEntry.build()
                } : defaultData.journalEntry
            } as Prisma.TransactionCreateInput;
            const data: Prisma.TransactionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TransactionCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Transaction) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.TransactionCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().transaction.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TransactionCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.TransactionCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Transaction" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: TransactionTraitKeys<TOptions>, ...names: readonly TransactionTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface TransactionFactoryBuilder {
    <TOptions extends TransactionFactoryDefineOptions>(options: TOptions): TransactionFactoryInterface<{}, TransactionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TransactionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TransactionFactoryDefineOptions<TTransients>>(options: TOptions) => TransactionFactoryInterface<TTransients, TransactionTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Transaction} model.
 *
 * @param options
 * @returns factory {@link TransactionFactoryInterface}
 */
export const defineTransactionFactory = (<TOptions extends TransactionFactoryDefineOptions>(options: TOptions): TransactionFactoryInterface<TOptions> => {
    return defineTransactionFactoryInternal(options, {});
}) as TransactionFactoryBuilder;

defineTransactionFactory.withTransientFields = defaultTransientFieldValues => options => defineTransactionFactoryInternal(options, defaultTransientFieldValues);

type TransactionSplitScalarOrEnumFields = {
    amount: number;
};

type TransactionSplitcategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutTransactionSplitsInput["create"]>;
};

type TransactionSplitglAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutTransactionSplitsInput["create"]>;
};

type TransactionSplittransactionFactory = {
    _factoryFor: "Transaction";
    build: () => PromiseLike<Prisma.TransactionCreateNestedOneWithoutSplitsInput["create"]>;
};

type TransactionSplitFactoryDefineInput = {
    id?: string;
    amount?: number;
    description?: string | null;
    notes?: string | null;
    projectId?: string | null;
    tags?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    createdAt?: Date;
    updatedAt?: Date;
    category?: TransactionSplitcategoryFactory | Prisma.CategoryCreateNestedOneWithoutTransactionSplitsInput;
    glAccount?: TransactionSplitglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutTransactionSplitsInput;
    transaction: TransactionSplittransactionFactory | Prisma.TransactionCreateNestedOneWithoutSplitsInput;
};

type TransactionSplitTransientFields = Record<string, unknown> & Partial<Record<keyof TransactionSplitFactoryDefineInput, never>>;

type TransactionSplitFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TransactionSplitFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TransactionSplit, Prisma.TransactionSplitCreateInput, TTransients>;

type TransactionSplitFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TransactionSplitFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TransactionSplitFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TransactionSplit, Prisma.TransactionSplitCreateInput, TTransients>;

function isTransactionSplitcategoryFactory(x: TransactionSplitcategoryFactory | Prisma.CategoryCreateNestedOneWithoutTransactionSplitsInput | undefined): x is TransactionSplitcategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

function isTransactionSplitglAccountFactory(x: TransactionSplitglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutTransactionSplitsInput | undefined): x is TransactionSplitglAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

function isTransactionSplittransactionFactory(x: TransactionSplittransactionFactory | Prisma.TransactionCreateNestedOneWithoutSplitsInput | undefined): x is TransactionSplittransactionFactory {
    return (x as any)?._factoryFor === "Transaction";
}

type TransactionSplitTraitKeys<TOptions extends TransactionSplitFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface TransactionSplitFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TransactionSplit";
    build(inputData?: Partial<Prisma.TransactionSplitCreateInput & TTransients>): PromiseLike<Prisma.TransactionSplitCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TransactionSplitCreateInput & TTransients>): PromiseLike<Prisma.TransactionSplitCreateInput>;
    buildList(list: readonly Partial<Prisma.TransactionSplitCreateInput & TTransients>[]): PromiseLike<Prisma.TransactionSplitCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TransactionSplitCreateInput & TTransients>): PromiseLike<Prisma.TransactionSplitCreateInput[]>;
    pickForConnect(inputData: TransactionSplit): Pick<TransactionSplit, "id">;
    create(inputData?: Partial<Prisma.TransactionSplitCreateInput & TTransients>): PromiseLike<TransactionSplit>;
    createList(list: readonly Partial<Prisma.TransactionSplitCreateInput & TTransients>[]): PromiseLike<TransactionSplit[]>;
    createList(count: number, item?: Partial<Prisma.TransactionSplitCreateInput & TTransients>): PromiseLike<TransactionSplit[]>;
    createForConnect(inputData?: Partial<Prisma.TransactionSplitCreateInput & TTransients>): PromiseLike<Pick<TransactionSplit, "id">>;
}

export interface TransactionSplitFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TransactionSplitFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TransactionSplitFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateTransactionSplitScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TransactionSplitScalarOrEnumFields {
    return {
        amount: getScalarFieldValueGenerator().Int({ modelName: "TransactionSplit", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}

function defineTransactionSplitFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends TransactionSplitFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): TransactionSplitFactoryInterface<TTransients, TransactionSplitTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly TransactionSplitTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TransactionSplit", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.TransactionSplitCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTransactionSplitScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<TransactionSplitFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<TransactionSplitFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                category: isTransactionSplitcategoryFactory(defaultData.category) ? {
                    create: await defaultData.category.build()
                } : defaultData.category,
                glAccount: isTransactionSplitglAccountFactory(defaultData.glAccount) ? {
                    create: await defaultData.glAccount.build()
                } : defaultData.glAccount,
                transaction: isTransactionSplittransactionFactory(defaultData.transaction) ? {
                    create: await defaultData.transaction.build()
                } : defaultData.transaction
            } as Prisma.TransactionSplitCreateInput;
            const data: Prisma.TransactionSplitCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TransactionSplitCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: TransactionSplit) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.TransactionSplitCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().transactionSplit.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TransactionSplitCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.TransactionSplitCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TransactionSplit" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: TransactionSplitTraitKeys<TOptions>, ...names: readonly TransactionSplitTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface TransactionSplitFactoryBuilder {
    <TOptions extends TransactionSplitFactoryDefineOptions>(options: TOptions): TransactionSplitFactoryInterface<{}, TransactionSplitTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TransactionSplitTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TransactionSplitFactoryDefineOptions<TTransients>>(options: TOptions) => TransactionSplitFactoryInterface<TTransients, TransactionSplitTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link TransactionSplit} model.
 *
 * @param options
 * @returns factory {@link TransactionSplitFactoryInterface}
 */
export const defineTransactionSplitFactory = (<TOptions extends TransactionSplitFactoryDefineOptions>(options: TOptions): TransactionSplitFactoryInterface<TOptions> => {
    return defineTransactionSplitFactoryInternal(options, {});
}) as TransactionSplitFactoryBuilder;

defineTransactionSplitFactory.withTransientFields = defaultTransientFieldValues => options => defineTransactionSplitFactoryInternal(options, defaultTransientFieldValues);

type TransactionMatchScalarOrEnumFields = {
    status: TransactionMatchStatus;
};

type TransactionMatchbankFeedTransactionFactory = {
    _factoryFor: "BankFeedTransaction";
    build: () => PromiseLike<Prisma.BankFeedTransactionCreateNestedOneWithoutTransactionMatchesInput["create"]>;
};

type TransactionMatchtransactionFactory = {
    _factoryFor: "Transaction";
    build: () => PromiseLike<Prisma.TransactionCreateNestedOneWithoutMatchesInput["create"]>;
};

type TransactionMatchFactoryDefineInput = {
    id?: string;
    journalEntryId?: string | null;
    status?: TransactionMatchStatus;
    confidence?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    bankFeedTransaction: TransactionMatchbankFeedTransactionFactory | Prisma.BankFeedTransactionCreateNestedOneWithoutTransactionMatchesInput;
    transaction?: TransactionMatchtransactionFactory | Prisma.TransactionCreateNestedOneWithoutMatchesInput;
};

type TransactionMatchTransientFields = Record<string, unknown> & Partial<Record<keyof TransactionMatchFactoryDefineInput, never>>;

type TransactionMatchFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TransactionMatchFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TransactionMatch, Prisma.TransactionMatchCreateInput, TTransients>;

type TransactionMatchFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TransactionMatchFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TransactionMatchFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TransactionMatch, Prisma.TransactionMatchCreateInput, TTransients>;

function isTransactionMatchbankFeedTransactionFactory(x: TransactionMatchbankFeedTransactionFactory | Prisma.BankFeedTransactionCreateNestedOneWithoutTransactionMatchesInput | undefined): x is TransactionMatchbankFeedTransactionFactory {
    return (x as any)?._factoryFor === "BankFeedTransaction";
}

function isTransactionMatchtransactionFactory(x: TransactionMatchtransactionFactory | Prisma.TransactionCreateNestedOneWithoutMatchesInput | undefined): x is TransactionMatchtransactionFactory {
    return (x as any)?._factoryFor === "Transaction";
}

type TransactionMatchTraitKeys<TOptions extends TransactionMatchFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface TransactionMatchFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TransactionMatch";
    build(inputData?: Partial<Prisma.TransactionMatchCreateInput & TTransients>): PromiseLike<Prisma.TransactionMatchCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TransactionMatchCreateInput & TTransients>): PromiseLike<Prisma.TransactionMatchCreateInput>;
    buildList(list: readonly Partial<Prisma.TransactionMatchCreateInput & TTransients>[]): PromiseLike<Prisma.TransactionMatchCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TransactionMatchCreateInput & TTransients>): PromiseLike<Prisma.TransactionMatchCreateInput[]>;
    pickForConnect(inputData: TransactionMatch): Pick<TransactionMatch, "id">;
    create(inputData?: Partial<Prisma.TransactionMatchCreateInput & TTransients>): PromiseLike<TransactionMatch>;
    createList(list: readonly Partial<Prisma.TransactionMatchCreateInput & TTransients>[]): PromiseLike<TransactionMatch[]>;
    createList(count: number, item?: Partial<Prisma.TransactionMatchCreateInput & TTransients>): PromiseLike<TransactionMatch[]>;
    createForConnect(inputData?: Partial<Prisma.TransactionMatchCreateInput & TTransients>): PromiseLike<Pick<TransactionMatch, "id">>;
}

export interface TransactionMatchFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TransactionMatchFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TransactionMatchFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateTransactionMatchScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TransactionMatchScalarOrEnumFields {
    return {
        status: "MATCHED"
    };
}

function defineTransactionMatchFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends TransactionMatchFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): TransactionMatchFactoryInterface<TTransients, TransactionMatchTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly TransactionMatchTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TransactionMatch", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.TransactionMatchCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTransactionMatchScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<TransactionMatchFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<TransactionMatchFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                bankFeedTransaction: isTransactionMatchbankFeedTransactionFactory(defaultData.bankFeedTransaction) ? {
                    create: await defaultData.bankFeedTransaction.build()
                } : defaultData.bankFeedTransaction,
                transaction: isTransactionMatchtransactionFactory(defaultData.transaction) ? {
                    create: await defaultData.transaction.build()
                } : defaultData.transaction
            } as Prisma.TransactionMatchCreateInput;
            const data: Prisma.TransactionMatchCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TransactionMatchCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: TransactionMatch) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.TransactionMatchCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().transactionMatch.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.TransactionMatchCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.TransactionMatchCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TransactionMatch" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: TransactionMatchTraitKeys<TOptions>, ...names: readonly TransactionMatchTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface TransactionMatchFactoryBuilder {
    <TOptions extends TransactionMatchFactoryDefineOptions>(options: TOptions): TransactionMatchFactoryInterface<{}, TransactionMatchTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TransactionMatchTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TransactionMatchFactoryDefineOptions<TTransients>>(options: TOptions) => TransactionMatchFactoryInterface<TTransients, TransactionMatchTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link TransactionMatch} model.
 *
 * @param options
 * @returns factory {@link TransactionMatchFactoryInterface}
 */
export const defineTransactionMatchFactory = (<TOptions extends TransactionMatchFactoryDefineOptions>(options: TOptions): TransactionMatchFactoryInterface<TOptions> => {
    return defineTransactionMatchFactoryInternal(options, {});
}) as TransactionMatchFactoryBuilder;

defineTransactionMatchFactory.withTransientFields = defaultTransientFieldValues => options => defineTransactionMatchFactoryInternal(options, defaultTransientFieldValues);

type CategoryScalarOrEnumFields = {
    name: string;
    type: CategoryType;
};

type CategorytenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutCategoriesInput["create"]>;
};

type CategorydefaultGLAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutCategoriesAsDefaultInput["create"]>;
};

type CategoryparentCategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutChildCategoriesInput["create"]>;
};

type CategoryFactoryDefineInput = {
    id?: string;
    name?: string;
    type?: CategoryType;
    color?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    tenant: CategorytenantFactory | Prisma.TenantCreateNestedOneWithoutCategoriesInput;
    billLines?: Prisma.BillLineCreateNestedManyWithoutCategoryInput;
    budgets?: Prisma.BudgetCreateNestedManyWithoutCategoryInput;
    defaultGLAccount?: CategorydefaultGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutCategoriesAsDefaultInput;
    parentCategory?: CategoryparentCategoryFactory | Prisma.CategoryCreateNestedOneWithoutChildCategoriesInput;
    childCategories?: Prisma.CategoryCreateNestedManyWithoutParentCategoryInput;
    goals?: Prisma.GoalCreateNestedManyWithoutCategoryInput;
    invoiceLines?: Prisma.InvoiceLineCreateNestedManyWithoutCategoryInput;
    snapshots?: Prisma.SnapshotCreateNestedManyWithoutCategoryInput;
    transactions?: Prisma.TransactionCreateNestedManyWithoutCategoryInput;
    transactionSplits?: Prisma.TransactionSplitCreateNestedManyWithoutCategoryInput;
};

type CategoryTransientFields = Record<string, unknown> & Partial<Record<keyof CategoryFactoryDefineInput, never>>;

type CategoryFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CategoryFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Category, Prisma.CategoryCreateInput, TTransients>;

type CategoryFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<CategoryFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: CategoryFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Category, Prisma.CategoryCreateInput, TTransients>;

function isCategorytenantFactory(x: CategorytenantFactory | Prisma.TenantCreateNestedOneWithoutCategoriesInput | undefined): x is CategorytenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

function isCategorydefaultGLAccountFactory(x: CategorydefaultGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutCategoriesAsDefaultInput | undefined): x is CategorydefaultGLAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

function isCategoryparentCategoryFactory(x: CategoryparentCategoryFactory | Prisma.CategoryCreateNestedOneWithoutChildCategoriesInput | undefined): x is CategoryparentCategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

type CategoryTraitKeys<TOptions extends CategoryFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface CategoryFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Category";
    build(inputData?: Partial<Prisma.CategoryCreateInput & TTransients>): PromiseLike<Prisma.CategoryCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CategoryCreateInput & TTransients>): PromiseLike<Prisma.CategoryCreateInput>;
    buildList(list: readonly Partial<Prisma.CategoryCreateInput & TTransients>[]): PromiseLike<Prisma.CategoryCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CategoryCreateInput & TTransients>): PromiseLike<Prisma.CategoryCreateInput[]>;
    pickForConnect(inputData: Category): Pick<Category, "id">;
    create(inputData?: Partial<Prisma.CategoryCreateInput & TTransients>): PromiseLike<Category>;
    createList(list: readonly Partial<Prisma.CategoryCreateInput & TTransients>[]): PromiseLike<Category[]>;
    createList(count: number, item?: Partial<Prisma.CategoryCreateInput & TTransients>): PromiseLike<Category[]>;
    createForConnect(inputData?: Partial<Prisma.CategoryCreateInput & TTransients>): PromiseLike<Pick<Category, "id">>;
}

export interface CategoryFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CategoryFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CategoryFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateCategoryScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CategoryScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Category", fieldName: "name", isId: false, isUnique: false, seq }),
        type: "INCOME"
    };
}

function defineCategoryFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends CategoryFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): CategoryFactoryInterface<TTransients, CategoryTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly CategoryTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Category", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.CategoryCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCategoryScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<CategoryFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<CategoryFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                tenant: isCategorytenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant,
                defaultGLAccount: isCategorydefaultGLAccountFactory(defaultData.defaultGLAccount) ? {
                    create: await defaultData.defaultGLAccount.build()
                } : defaultData.defaultGLAccount,
                parentCategory: isCategoryparentCategoryFactory(defaultData.parentCategory) ? {
                    create: await defaultData.parentCategory.build()
                } : defaultData.parentCategory
            } as Prisma.CategoryCreateInput;
            const data: Prisma.CategoryCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.CategoryCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Category) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.CategoryCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().category.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.CategoryCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.CategoryCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Category" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: CategoryTraitKeys<TOptions>, ...names: readonly CategoryTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface CategoryFactoryBuilder {
    <TOptions extends CategoryFactoryDefineOptions>(options: TOptions): CategoryFactoryInterface<{}, CategoryTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CategoryTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CategoryFactoryDefineOptions<TTransients>>(options: TOptions) => CategoryFactoryInterface<TTransients, CategoryTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Category} model.
 *
 * @param options
 * @returns factory {@link CategoryFactoryInterface}
 */
export const defineCategoryFactory = (<TOptions extends CategoryFactoryDefineOptions>(options: TOptions): CategoryFactoryInterface<TOptions> => {
    return defineCategoryFactoryInternal(options, {});
}) as CategoryFactoryBuilder;

defineCategoryFactory.withTransientFields = defaultTransientFieldValues => options => defineCategoryFactoryInternal(options, defaultTransientFieldValues);

type BudgetScalarOrEnumFields = {
    name: string;
    amount: number;
    period: BudgetPeriod;
    startDate: Date;
    endDate: Date;
};

type BudgetcategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutBudgetsInput["create"]>;
};

type BudgetentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutBudgetsInput["create"]>;
};

type BudgetglAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutBudgetsAsGLAccountInput["create"]>;
};

type BudgetFactoryDefineInput = {
    id?: string;
    name?: string;
    amount?: number;
    period?: BudgetPeriod;
    startDate?: Date;
    endDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    category?: BudgetcategoryFactory | Prisma.CategoryCreateNestedOneWithoutBudgetsInput;
    entity: BudgetentityFactory | Prisma.EntityCreateNestedOneWithoutBudgetsInput;
    glAccount?: BudgetglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutBudgetsAsGLAccountInput;
};

type BudgetTransientFields = Record<string, unknown> & Partial<Record<keyof BudgetFactoryDefineInput, never>>;

type BudgetFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<BudgetFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Budget, Prisma.BudgetCreateInput, TTransients>;

type BudgetFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<BudgetFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: BudgetFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Budget, Prisma.BudgetCreateInput, TTransients>;

function isBudgetcategoryFactory(x: BudgetcategoryFactory | Prisma.CategoryCreateNestedOneWithoutBudgetsInput | undefined): x is BudgetcategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

function isBudgetentityFactory(x: BudgetentityFactory | Prisma.EntityCreateNestedOneWithoutBudgetsInput | undefined): x is BudgetentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isBudgetglAccountFactory(x: BudgetglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutBudgetsAsGLAccountInput | undefined): x is BudgetglAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

type BudgetTraitKeys<TOptions extends BudgetFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface BudgetFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Budget";
    build(inputData?: Partial<Prisma.BudgetCreateInput & TTransients>): PromiseLike<Prisma.BudgetCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.BudgetCreateInput & TTransients>): PromiseLike<Prisma.BudgetCreateInput>;
    buildList(list: readonly Partial<Prisma.BudgetCreateInput & TTransients>[]): PromiseLike<Prisma.BudgetCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.BudgetCreateInput & TTransients>): PromiseLike<Prisma.BudgetCreateInput[]>;
    pickForConnect(inputData: Budget): Pick<Budget, "id">;
    create(inputData?: Partial<Prisma.BudgetCreateInput & TTransients>): PromiseLike<Budget>;
    createList(list: readonly Partial<Prisma.BudgetCreateInput & TTransients>[]): PromiseLike<Budget[]>;
    createList(count: number, item?: Partial<Prisma.BudgetCreateInput & TTransients>): PromiseLike<Budget[]>;
    createForConnect(inputData?: Partial<Prisma.BudgetCreateInput & TTransients>): PromiseLike<Pick<Budget, "id">>;
}

export interface BudgetFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends BudgetFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): BudgetFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateBudgetScalarsOrEnums({ seq }: {
    readonly seq: number;
}): BudgetScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Budget", fieldName: "name", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "Budget", fieldName: "amount", isId: false, isUnique: false, seq }),
        period: "MONTHLY",
        startDate: getScalarFieldValueGenerator().DateTime({ modelName: "Budget", fieldName: "startDate", isId: false, isUnique: false, seq }),
        endDate: getScalarFieldValueGenerator().DateTime({ modelName: "Budget", fieldName: "endDate", isId: false, isUnique: false, seq })
    };
}

function defineBudgetFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends BudgetFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): BudgetFactoryInterface<TTransients, BudgetTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly BudgetTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Budget", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.BudgetCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateBudgetScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<BudgetFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<BudgetFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                category: isBudgetcategoryFactory(defaultData.category) ? {
                    create: await defaultData.category.build()
                } : defaultData.category,
                entity: isBudgetentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                glAccount: isBudgetglAccountFactory(defaultData.glAccount) ? {
                    create: await defaultData.glAccount.build()
                } : defaultData.glAccount
            } as Prisma.BudgetCreateInput;
            const data: Prisma.BudgetCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BudgetCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Budget) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.BudgetCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().budget.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.BudgetCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.BudgetCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Budget" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: BudgetTraitKeys<TOptions>, ...names: readonly BudgetTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface BudgetFactoryBuilder {
    <TOptions extends BudgetFactoryDefineOptions>(options: TOptions): BudgetFactoryInterface<{}, BudgetTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends BudgetTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends BudgetFactoryDefineOptions<TTransients>>(options: TOptions) => BudgetFactoryInterface<TTransients, BudgetTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Budget} model.
 *
 * @param options
 * @returns factory {@link BudgetFactoryInterface}
 */
export const defineBudgetFactory = (<TOptions extends BudgetFactoryDefineOptions>(options: TOptions): BudgetFactoryInterface<TOptions> => {
    return defineBudgetFactoryInternal(options, {});
}) as BudgetFactoryBuilder;

defineBudgetFactory.withTransientFields = defaultTransientFieldValues => options => defineBudgetFactoryInternal(options, defaultTransientFieldValues);

type GoalScalarOrEnumFields = {
    name: string;
    type: GoalType;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    status: GoalStatus;
};

type GoalaccountFactory = {
    _factoryFor: "Account";
    build: () => PromiseLike<Prisma.AccountCreateNestedOneWithoutGoalsInput["create"]>;
};

type GoalcategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutGoalsInput["create"]>;
};

type GoalentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutGoalsInput["create"]>;
};

type GoalglAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutGoalsAsGLAccountInput["create"]>;
};

type GoalFactoryDefineInput = {
    id?: string;
    name?: string;
    type?: GoalType;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: Date;
    status?: GoalStatus;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    account?: GoalaccountFactory | Prisma.AccountCreateNestedOneWithoutGoalsInput;
    category?: GoalcategoryFactory | Prisma.CategoryCreateNestedOneWithoutGoalsInput;
    entity: GoalentityFactory | Prisma.EntityCreateNestedOneWithoutGoalsInput;
    glAccount?: GoalglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutGoalsAsGLAccountInput;
};

type GoalTransientFields = Record<string, unknown> & Partial<Record<keyof GoalFactoryDefineInput, never>>;

type GoalFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<GoalFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Goal, Prisma.GoalCreateInput, TTransients>;

type GoalFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<GoalFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: GoalFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Goal, Prisma.GoalCreateInput, TTransients>;

function isGoalaccountFactory(x: GoalaccountFactory | Prisma.AccountCreateNestedOneWithoutGoalsInput | undefined): x is GoalaccountFactory {
    return (x as any)?._factoryFor === "Account";
}

function isGoalcategoryFactory(x: GoalcategoryFactory | Prisma.CategoryCreateNestedOneWithoutGoalsInput | undefined): x is GoalcategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

function isGoalentityFactory(x: GoalentityFactory | Prisma.EntityCreateNestedOneWithoutGoalsInput | undefined): x is GoalentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isGoalglAccountFactory(x: GoalglAccountFactory | Prisma.GLAccountCreateNestedOneWithoutGoalsAsGLAccountInput | undefined): x is GoalglAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

type GoalTraitKeys<TOptions extends GoalFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface GoalFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Goal";
    build(inputData?: Partial<Prisma.GoalCreateInput & TTransients>): PromiseLike<Prisma.GoalCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.GoalCreateInput & TTransients>): PromiseLike<Prisma.GoalCreateInput>;
    buildList(list: readonly Partial<Prisma.GoalCreateInput & TTransients>[]): PromiseLike<Prisma.GoalCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.GoalCreateInput & TTransients>): PromiseLike<Prisma.GoalCreateInput[]>;
    pickForConnect(inputData: Goal): Pick<Goal, "id">;
    create(inputData?: Partial<Prisma.GoalCreateInput & TTransients>): PromiseLike<Goal>;
    createList(list: readonly Partial<Prisma.GoalCreateInput & TTransients>[]): PromiseLike<Goal[]>;
    createList(count: number, item?: Partial<Prisma.GoalCreateInput & TTransients>): PromiseLike<Goal[]>;
    createForConnect(inputData?: Partial<Prisma.GoalCreateInput & TTransients>): PromiseLike<Pick<Goal, "id">>;
}

export interface GoalFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends GoalFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): GoalFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateGoalScalarsOrEnums({ seq }: {
    readonly seq: number;
}): GoalScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Goal", fieldName: "name", isId: false, isUnique: false, seq }),
        type: "SAVINGS",
        targetAmount: getScalarFieldValueGenerator().Int({ modelName: "Goal", fieldName: "targetAmount", isId: false, isUnique: false, seq }),
        currentAmount: getScalarFieldValueGenerator().Int({ modelName: "Goal", fieldName: "currentAmount", isId: false, isUnique: false, seq }),
        targetDate: getScalarFieldValueGenerator().DateTime({ modelName: "Goal", fieldName: "targetDate", isId: false, isUnique: false, seq }),
        status: "ACTIVE"
    };
}

function defineGoalFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends GoalFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): GoalFactoryInterface<TTransients, GoalTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly GoalTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Goal", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.GoalCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateGoalScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<GoalFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<GoalFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                account: isGoalaccountFactory(defaultData.account) ? {
                    create: await defaultData.account.build()
                } : defaultData.account,
                category: isGoalcategoryFactory(defaultData.category) ? {
                    create: await defaultData.category.build()
                } : defaultData.category,
                entity: isGoalentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                glAccount: isGoalglAccountFactory(defaultData.glAccount) ? {
                    create: await defaultData.glAccount.build()
                } : defaultData.glAccount
            } as Prisma.GoalCreateInput;
            const data: Prisma.GoalCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.GoalCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Goal) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.GoalCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().goal.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.GoalCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.GoalCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Goal" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: GoalTraitKeys<TOptions>, ...names: readonly GoalTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface GoalFactoryBuilder {
    <TOptions extends GoalFactoryDefineOptions>(options: TOptions): GoalFactoryInterface<{}, GoalTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends GoalTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends GoalFactoryDefineOptions<TTransients>>(options: TOptions) => GoalFactoryInterface<TTransients, GoalTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Goal} model.
 *
 * @param options
 * @returns factory {@link GoalFactoryInterface}
 */
export const defineGoalFactory = (<TOptions extends GoalFactoryDefineOptions>(options: TOptions): GoalFactoryInterface<TOptions> => {
    return defineGoalFactoryInternal(options, {});
}) as GoalFactoryBuilder;

defineGoalFactory.withTransientFields = defaultTransientFieldValues => options => defineGoalFactoryInternal(options, defaultTransientFieldValues);

type ForecastScalarOrEnumFields = {
    name: string;
    type: ForecastType;
    scenario: ForecastScenario;
    periodStart: Date;
    periodEnd: Date;
    data: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};

type ForecastentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutForecastsInput["create"]>;
};

type ForecastFactoryDefineInput = {
    id?: string;
    name?: string;
    type?: ForecastType;
    scenario?: ForecastScenario;
    periodStart?: Date;
    periodEnd?: Date;
    data?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    assumptions?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: ForecastentityFactory | Prisma.EntityCreateNestedOneWithoutForecastsInput;
};

type ForecastTransientFields = Record<string, unknown> & Partial<Record<keyof ForecastFactoryDefineInput, never>>;

type ForecastFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ForecastFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Forecast, Prisma.ForecastCreateInput, TTransients>;

type ForecastFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<ForecastFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: ForecastFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Forecast, Prisma.ForecastCreateInput, TTransients>;

function isForecastentityFactory(x: ForecastentityFactory | Prisma.EntityCreateNestedOneWithoutForecastsInput | undefined): x is ForecastentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type ForecastTraitKeys<TOptions extends ForecastFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface ForecastFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Forecast";
    build(inputData?: Partial<Prisma.ForecastCreateInput & TTransients>): PromiseLike<Prisma.ForecastCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ForecastCreateInput & TTransients>): PromiseLike<Prisma.ForecastCreateInput>;
    buildList(list: readonly Partial<Prisma.ForecastCreateInput & TTransients>[]): PromiseLike<Prisma.ForecastCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ForecastCreateInput & TTransients>): PromiseLike<Prisma.ForecastCreateInput[]>;
    pickForConnect(inputData: Forecast): Pick<Forecast, "id">;
    create(inputData?: Partial<Prisma.ForecastCreateInput & TTransients>): PromiseLike<Forecast>;
    createList(list: readonly Partial<Prisma.ForecastCreateInput & TTransients>[]): PromiseLike<Forecast[]>;
    createList(count: number, item?: Partial<Prisma.ForecastCreateInput & TTransients>): PromiseLike<Forecast[]>;
    createForConnect(inputData?: Partial<Prisma.ForecastCreateInput & TTransients>): PromiseLike<Pick<Forecast, "id">>;
}

export interface ForecastFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ForecastFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ForecastFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateForecastScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ForecastScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Forecast", fieldName: "name", isId: false, isUnique: false, seq }),
        type: "CASH_FLOW",
        scenario: "BASELINE",
        periodStart: getScalarFieldValueGenerator().DateTime({ modelName: "Forecast", fieldName: "periodStart", isId: false, isUnique: false, seq }),
        periodEnd: getScalarFieldValueGenerator().DateTime({ modelName: "Forecast", fieldName: "periodEnd", isId: false, isUnique: false, seq }),
        data: getScalarFieldValueGenerator().Json({ modelName: "Forecast", fieldName: "data", isId: false, isUnique: false, seq })
    };
}

function defineForecastFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends ForecastFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): ForecastFactoryInterface<TTransients, ForecastTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly ForecastTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Forecast", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.ForecastCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateForecastScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<ForecastFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<ForecastFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isForecastentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.ForecastCreateInput;
            const data: Prisma.ForecastCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ForecastCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Forecast) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.ForecastCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().forecast.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ForecastCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.ForecastCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Forecast" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: ForecastTraitKeys<TOptions>, ...names: readonly ForecastTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface ForecastFactoryBuilder {
    <TOptions extends ForecastFactoryDefineOptions>(options: TOptions): ForecastFactoryInterface<{}, ForecastTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ForecastTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ForecastFactoryDefineOptions<TTransients>>(options: TOptions) => ForecastFactoryInterface<TTransients, ForecastTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Forecast} model.
 *
 * @param options
 * @returns factory {@link ForecastFactoryInterface}
 */
export const defineForecastFactory = (<TOptions extends ForecastFactoryDefineOptions>(options: TOptions): ForecastFactoryInterface<TOptions> => {
    return defineForecastFactoryInternal(options, {});
}) as ForecastFactoryBuilder;

defineForecastFactory.withTransientFields = defaultTransientFieldValues => options => defineForecastFactoryInternal(options, defaultTransientFieldValues);

type InsightScalarOrEnumFields = {
    triggerId: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    actionable: boolean;
    status: string;
};

type InsightentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutInsightsInput["create"]>;
};

type InsightFactoryDefineInput = {
    id?: string;
    triggerId?: string;
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    impact?: number | null;
    confidence?: number | null;
    actionable?: boolean;
    status?: string;
    deadline?: Date | null;
    dismissedAt?: Date | null;
    dismissedBy?: string | null;
    snoozedUntil?: Date | null;
    metadata?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    createdAt?: Date;
    updatedAt?: Date;
    entity: InsightentityFactory | Prisma.EntityCreateNestedOneWithoutInsightsInput;
};

type InsightTransientFields = Record<string, unknown> & Partial<Record<keyof InsightFactoryDefineInput, never>>;

type InsightFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<InsightFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Insight, Prisma.InsightCreateInput, TTransients>;

type InsightFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<InsightFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: InsightFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Insight, Prisma.InsightCreateInput, TTransients>;

function isInsightentityFactory(x: InsightentityFactory | Prisma.EntityCreateNestedOneWithoutInsightsInput | undefined): x is InsightentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type InsightTraitKeys<TOptions extends InsightFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface InsightFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Insight";
    build(inputData?: Partial<Prisma.InsightCreateInput & TTransients>): PromiseLike<Prisma.InsightCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InsightCreateInput & TTransients>): PromiseLike<Prisma.InsightCreateInput>;
    buildList(list: readonly Partial<Prisma.InsightCreateInput & TTransients>[]): PromiseLike<Prisma.InsightCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.InsightCreateInput & TTransients>): PromiseLike<Prisma.InsightCreateInput[]>;
    pickForConnect(inputData: Insight): Pick<Insight, "id">;
    create(inputData?: Partial<Prisma.InsightCreateInput & TTransients>): PromiseLike<Insight>;
    createList(list: readonly Partial<Prisma.InsightCreateInput & TTransients>[]): PromiseLike<Insight[]>;
    createList(count: number, item?: Partial<Prisma.InsightCreateInput & TTransients>): PromiseLike<Insight[]>;
    createForConnect(inputData?: Partial<Prisma.InsightCreateInput & TTransients>): PromiseLike<Pick<Insight, "id">>;
}

export interface InsightFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends InsightFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): InsightFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateInsightScalarsOrEnums({ seq }: {
    readonly seq: number;
}): InsightScalarOrEnumFields {
    return {
        triggerId: getScalarFieldValueGenerator().String({ modelName: "Insight", fieldName: "triggerId", isId: false, isUnique: true, seq }),
        title: getScalarFieldValueGenerator().String({ modelName: "Insight", fieldName: "title", isId: false, isUnique: false, seq }),
        description: getScalarFieldValueGenerator().String({ modelName: "Insight", fieldName: "description", isId: false, isUnique: false, seq }),
        type: getScalarFieldValueGenerator().String({ modelName: "Insight", fieldName: "type", isId: false, isUnique: false, seq }),
        priority: getScalarFieldValueGenerator().String({ modelName: "Insight", fieldName: "priority", isId: false, isUnique: false, seq }),
        actionable: getScalarFieldValueGenerator().Boolean({ modelName: "Insight", fieldName: "actionable", isId: false, isUnique: false, seq }),
        status: getScalarFieldValueGenerator().String({ modelName: "Insight", fieldName: "status", isId: false, isUnique: false, seq })
    };
}

function defineInsightFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends InsightFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): InsightFactoryInterface<TTransients, InsightTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly InsightTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Insight", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.InsightCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateInsightScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<InsightFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<InsightFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isInsightentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.InsightCreateInput;
            const data: Prisma.InsightCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.InsightCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Insight) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.InsightCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().insight.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.InsightCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.InsightCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Insight" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: InsightTraitKeys<TOptions>, ...names: readonly InsightTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface InsightFactoryBuilder {
    <TOptions extends InsightFactoryDefineOptions>(options: TOptions): InsightFactoryInterface<{}, InsightTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends InsightTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends InsightFactoryDefineOptions<TTransients>>(options: TOptions) => InsightFactoryInterface<TTransients, InsightTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Insight} model.
 *
 * @param options
 * @returns factory {@link InsightFactoryInterface}
 */
export const defineInsightFactory = (<TOptions extends InsightFactoryDefineOptions>(options: TOptions): InsightFactoryInterface<TOptions> => {
    return defineInsightFactoryInternal(options, {});
}) as InsightFactoryBuilder;

defineInsightFactory.withTransientFields = defaultTransientFieldValues => options => defineInsightFactoryInternal(options, defaultTransientFieldValues);

type RuleScalarOrEnumFields = {
    name: string;
    conditions: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    action: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    isActive: boolean;
    source: RuleSource;
};

type RuleentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutRulesInput["create"]>;
};

type RuleFactoryDefineInput = {
    id?: string;
    name?: string;
    conditions?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    action?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    isActive?: boolean;
    source?: RuleSource;
    aiConfidence?: number | null;
    aiModelVersion?: string | null;
    userApprovedAt?: Date | null;
    executionCount?: number;
    successRate?: number;
    createdAt?: Date;
    updatedAt?: Date;
    entity: RuleentityFactory | Prisma.EntityCreateNestedOneWithoutRulesInput;
};

type RuleTransientFields = Record<string, unknown> & Partial<Record<keyof RuleFactoryDefineInput, never>>;

type RuleFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<RuleFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Rule, Prisma.RuleCreateInput, TTransients>;

type RuleFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<RuleFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: RuleFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Rule, Prisma.RuleCreateInput, TTransients>;

function isRuleentityFactory(x: RuleentityFactory | Prisma.EntityCreateNestedOneWithoutRulesInput | undefined): x is RuleentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type RuleTraitKeys<TOptions extends RuleFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface RuleFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Rule";
    build(inputData?: Partial<Prisma.RuleCreateInput & TTransients>): PromiseLike<Prisma.RuleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.RuleCreateInput & TTransients>): PromiseLike<Prisma.RuleCreateInput>;
    buildList(list: readonly Partial<Prisma.RuleCreateInput & TTransients>[]): PromiseLike<Prisma.RuleCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.RuleCreateInput & TTransients>): PromiseLike<Prisma.RuleCreateInput[]>;
    pickForConnect(inputData: Rule): Pick<Rule, "id">;
    create(inputData?: Partial<Prisma.RuleCreateInput & TTransients>): PromiseLike<Rule>;
    createList(list: readonly Partial<Prisma.RuleCreateInput & TTransients>[]): PromiseLike<Rule[]>;
    createList(count: number, item?: Partial<Prisma.RuleCreateInput & TTransients>): PromiseLike<Rule[]>;
    createForConnect(inputData?: Partial<Prisma.RuleCreateInput & TTransients>): PromiseLike<Pick<Rule, "id">>;
}

export interface RuleFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends RuleFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): RuleFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateRuleScalarsOrEnums({ seq }: {
    readonly seq: number;
}): RuleScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Rule", fieldName: "name", isId: false, isUnique: false, seq }),
        conditions: getScalarFieldValueGenerator().Json({ modelName: "Rule", fieldName: "conditions", isId: false, isUnique: false, seq }),
        action: getScalarFieldValueGenerator().Json({ modelName: "Rule", fieldName: "action", isId: false, isUnique: false, seq }),
        isActive: getScalarFieldValueGenerator().Boolean({ modelName: "Rule", fieldName: "isActive", isId: false, isUnique: false, seq }),
        source: "USER_MANUAL"
    };
}

function defineRuleFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends RuleFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): RuleFactoryInterface<TTransients, RuleTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly RuleTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Rule", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.RuleCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateRuleScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<RuleFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<RuleFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isRuleentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.RuleCreateInput;
            const data: Prisma.RuleCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.RuleCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Rule) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.RuleCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().rule.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.RuleCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.RuleCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Rule" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: RuleTraitKeys<TOptions>, ...names: readonly RuleTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface RuleFactoryBuilder {
    <TOptions extends RuleFactoryDefineOptions>(options: TOptions): RuleFactoryInterface<{}, RuleTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends RuleTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends RuleFactoryDefineOptions<TTransients>>(options: TOptions) => RuleFactoryInterface<TTransients, RuleTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Rule} model.
 *
 * @param options
 * @returns factory {@link RuleFactoryInterface}
 */
export const defineRuleFactory = (<TOptions extends RuleFactoryDefineOptions>(options: TOptions): RuleFactoryInterface<TOptions> => {
    return defineRuleFactoryInternal(options, {});
}) as RuleFactoryBuilder;

defineRuleFactory.withTransientFields = defaultTransientFieldValues => options => defineRuleFactoryInternal(options, defaultTransientFieldValues);

type ProjectScalarOrEnumFields = {
    name: string;
    code: string;
    status: string;
};

type ProjectentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutProjectsInput["create"]>;
};

type ProjectFactoryDefineInput = {
    id?: string;
    name?: string;
    code?: string;
    description?: string | null;
    status?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    entity: ProjectentityFactory | Prisma.EntityCreateNestedOneWithoutProjectsInput;
};

type ProjectTransientFields = Record<string, unknown> & Partial<Record<keyof ProjectFactoryDefineInput, never>>;

type ProjectFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ProjectFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Project, Prisma.ProjectCreateInput, TTransients>;

type ProjectFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<ProjectFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: ProjectFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Project, Prisma.ProjectCreateInput, TTransients>;

function isProjectentityFactory(x: ProjectentityFactory | Prisma.EntityCreateNestedOneWithoutProjectsInput | undefined): x is ProjectentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type ProjectTraitKeys<TOptions extends ProjectFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface ProjectFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Project";
    build(inputData?: Partial<Prisma.ProjectCreateInput & TTransients>): PromiseLike<Prisma.ProjectCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ProjectCreateInput & TTransients>): PromiseLike<Prisma.ProjectCreateInput>;
    buildList(list: readonly Partial<Prisma.ProjectCreateInput & TTransients>[]): PromiseLike<Prisma.ProjectCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ProjectCreateInput & TTransients>): PromiseLike<Prisma.ProjectCreateInput[]>;
    pickForConnect(inputData: Project): Pick<Project, "id">;
    create(inputData?: Partial<Prisma.ProjectCreateInput & TTransients>): PromiseLike<Project>;
    createList(list: readonly Partial<Prisma.ProjectCreateInput & TTransients>[]): PromiseLike<Project[]>;
    createList(count: number, item?: Partial<Prisma.ProjectCreateInput & TTransients>): PromiseLike<Project[]>;
    createForConnect(inputData?: Partial<Prisma.ProjectCreateInput & TTransients>): PromiseLike<Pick<Project, "id">>;
}

export interface ProjectFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ProjectFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ProjectFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateProjectScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ProjectScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Project", fieldName: "name", isId: false, isUnique: false, seq }),
        code: getScalarFieldValueGenerator().String({ modelName: "Project", fieldName: "code", isId: false, isUnique: false, seq }),
        status: getScalarFieldValueGenerator().String({ modelName: "Project", fieldName: "status", isId: false, isUnique: false, seq })
    };
}

function defineProjectFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends ProjectFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): ProjectFactoryInterface<TTransients, ProjectTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly ProjectTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Project", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.ProjectCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateProjectScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<ProjectFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<ProjectFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isProjectentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.ProjectCreateInput;
            const data: Prisma.ProjectCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ProjectCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Project) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.ProjectCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().project.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ProjectCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.ProjectCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Project" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: ProjectTraitKeys<TOptions>, ...names: readonly ProjectTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface ProjectFactoryBuilder {
    <TOptions extends ProjectFactoryDefineOptions>(options: TOptions): ProjectFactoryInterface<{}, ProjectTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ProjectTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ProjectFactoryDefineOptions<TTransients>>(options: TOptions) => ProjectFactoryInterface<TTransients, ProjectTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Project} model.
 *
 * @param options
 * @returns factory {@link ProjectFactoryInterface}
 */
export const defineProjectFactory = (<TOptions extends ProjectFactoryDefineOptions>(options: TOptions): ProjectFactoryInterface<TOptions> => {
    return defineProjectFactoryInternal(options, {});
}) as ProjectFactoryBuilder;

defineProjectFactory.withTransientFields = defaultTransientFieldValues => options => defineProjectFactoryInternal(options, defaultTransientFieldValues);

type SnapshotScalarOrEnumFields = {
    entityId: string;
    date: Date;
    balance: number;
};

type SnapshotcategoryFactory = {
    _factoryFor: "Category";
    build: () => PromiseLike<Prisma.CategoryCreateNestedOneWithoutSnapshotsInput["create"]>;
};

type SnapshotFactoryDefineInput = {
    id?: string;
    entityId?: string;
    date?: Date;
    glAccountId?: string | null;
    balance?: number;
    createdAt?: Date;
    category?: SnapshotcategoryFactory | Prisma.CategoryCreateNestedOneWithoutSnapshotsInput;
};

type SnapshotTransientFields = Record<string, unknown> & Partial<Record<keyof SnapshotFactoryDefineInput, never>>;

type SnapshotFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SnapshotFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Snapshot, Prisma.SnapshotCreateInput, TTransients>;

type SnapshotFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<SnapshotFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: SnapshotFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Snapshot, Prisma.SnapshotCreateInput, TTransients>;

function isSnapshotcategoryFactory(x: SnapshotcategoryFactory | Prisma.CategoryCreateNestedOneWithoutSnapshotsInput | undefined): x is SnapshotcategoryFactory {
    return (x as any)?._factoryFor === "Category";
}

type SnapshotTraitKeys<TOptions extends SnapshotFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface SnapshotFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Snapshot";
    build(inputData?: Partial<Prisma.SnapshotCreateInput & TTransients>): PromiseLike<Prisma.SnapshotCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SnapshotCreateInput & TTransients>): PromiseLike<Prisma.SnapshotCreateInput>;
    buildList(list: readonly Partial<Prisma.SnapshotCreateInput & TTransients>[]): PromiseLike<Prisma.SnapshotCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SnapshotCreateInput & TTransients>): PromiseLike<Prisma.SnapshotCreateInput[]>;
    pickForConnect(inputData: Snapshot): Pick<Snapshot, "id">;
    create(inputData?: Partial<Prisma.SnapshotCreateInput & TTransients>): PromiseLike<Snapshot>;
    createList(list: readonly Partial<Prisma.SnapshotCreateInput & TTransients>[]): PromiseLike<Snapshot[]>;
    createList(count: number, item?: Partial<Prisma.SnapshotCreateInput & TTransients>): PromiseLike<Snapshot[]>;
    createForConnect(inputData?: Partial<Prisma.SnapshotCreateInput & TTransients>): PromiseLike<Pick<Snapshot, "id">>;
}

export interface SnapshotFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SnapshotFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SnapshotFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateSnapshotScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SnapshotScalarOrEnumFields {
    return {
        entityId: getScalarFieldValueGenerator().String({ modelName: "Snapshot", fieldName: "entityId", isId: false, isUnique: false, seq }),
        date: getScalarFieldValueGenerator().DateTime({ modelName: "Snapshot", fieldName: "date", isId: false, isUnique: false, seq }),
        balance: getScalarFieldValueGenerator().Int({ modelName: "Snapshot", fieldName: "balance", isId: false, isUnique: false, seq })
    };
}

function defineSnapshotFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends SnapshotFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): SnapshotFactoryInterface<TTransients, SnapshotTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly SnapshotTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Snapshot", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.SnapshotCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSnapshotScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<SnapshotFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<SnapshotFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                category: isSnapshotcategoryFactory(defaultData.category) ? {
                    create: await defaultData.category.build()
                } : defaultData.category
            } as Prisma.SnapshotCreateInput;
            const data: Prisma.SnapshotCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.SnapshotCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: Snapshot) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.SnapshotCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().snapshot.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.SnapshotCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.SnapshotCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Snapshot" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: SnapshotTraitKeys<TOptions>, ...names: readonly SnapshotTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface SnapshotFactoryBuilder {
    <TOptions extends SnapshotFactoryDefineOptions>(options?: TOptions): SnapshotFactoryInterface<{}, SnapshotTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SnapshotTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SnapshotFactoryDefineOptions<TTransients>>(options?: TOptions) => SnapshotFactoryInterface<TTransients, SnapshotTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link Snapshot} model.
 *
 * @param options
 * @returns factory {@link SnapshotFactoryInterface}
 */
export const defineSnapshotFactory = (<TOptions extends SnapshotFactoryDefineOptions>(options?: TOptions): SnapshotFactoryInterface<TOptions> => {
    return defineSnapshotFactoryInternal(options ?? {}, {});
}) as SnapshotFactoryBuilder;

defineSnapshotFactory.withTransientFields = defaultTransientFieldValues => options => defineSnapshotFactoryInternal(options ?? {}, defaultTransientFieldValues);

type FXRateScalarOrEnumFields = {
    base: string;
    quote: string;
    date: Date;
    source: string;
    rate: number;
};

type FXRateFactoryDefineInput = {
    id?: string;
    base?: string;
    quote?: string;
    date?: Date;
    source?: string;
    rate?: number;
    createdAt?: Date;
};

type FXRateTransientFields = Record<string, unknown> & Partial<Record<keyof FXRateFactoryDefineInput, never>>;

type FXRateFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FXRateFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FXRate, Prisma.FXRateCreateInput, TTransients>;

type FXRateFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<FXRateFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: FXRateFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FXRate, Prisma.FXRateCreateInput, TTransients>;

type FXRateTraitKeys<TOptions extends FXRateFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface FXRateFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FXRate";
    build(inputData?: Partial<Prisma.FXRateCreateInput & TTransients>): PromiseLike<Prisma.FXRateCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FXRateCreateInput & TTransients>): PromiseLike<Prisma.FXRateCreateInput>;
    buildList(list: readonly Partial<Prisma.FXRateCreateInput & TTransients>[]): PromiseLike<Prisma.FXRateCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FXRateCreateInput & TTransients>): PromiseLike<Prisma.FXRateCreateInput[]>;
    pickForConnect(inputData: FXRate): Pick<FXRate, "id">;
    create(inputData?: Partial<Prisma.FXRateCreateInput & TTransients>): PromiseLike<FXRate>;
    createList(list: readonly Partial<Prisma.FXRateCreateInput & TTransients>[]): PromiseLike<FXRate[]>;
    createList(count: number, item?: Partial<Prisma.FXRateCreateInput & TTransients>): PromiseLike<FXRate[]>;
    createForConnect(inputData?: Partial<Prisma.FXRateCreateInput & TTransients>): PromiseLike<Pick<FXRate, "id">>;
}

export interface FXRateFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FXRateFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FXRateFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateFXRateScalarsOrEnums({ seq }: {
    readonly seq: number;
}): FXRateScalarOrEnumFields {
    return {
        base: getScalarFieldValueGenerator().String({ modelName: "FXRate", fieldName: "base", isId: false, isUnique: true, seq }),
        quote: getScalarFieldValueGenerator().String({ modelName: "FXRate", fieldName: "quote", isId: false, isUnique: true, seq }),
        date: getScalarFieldValueGenerator().DateTime({ modelName: "FXRate", fieldName: "date", isId: false, isUnique: true, seq }),
        source: getScalarFieldValueGenerator().String({ modelName: "FXRate", fieldName: "source", isId: false, isUnique: true, seq }),
        rate: getScalarFieldValueGenerator().Float({ modelName: "FXRate", fieldName: "rate", isId: false, isUnique: false, seq })
    };
}

function defineFXRateFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends FXRateFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): FXRateFactoryInterface<TTransients, FXRateTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly FXRateTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FXRate", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.FXRateCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFXRateScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<FXRateFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<FXRateFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {} as Prisma.FXRateCreateInput;
            const data: Prisma.FXRateCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FXRateCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: FXRate) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.FXRateCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().fXRate.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FXRateCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.FXRateCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FXRate" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: FXRateTraitKeys<TOptions>, ...names: readonly FXRateTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface FXRateFactoryBuilder {
    <TOptions extends FXRateFactoryDefineOptions>(options?: TOptions): FXRateFactoryInterface<{}, FXRateTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FXRateTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FXRateFactoryDefineOptions<TTransients>>(options?: TOptions) => FXRateFactoryInterface<TTransients, FXRateTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link FXRate} model.
 *
 * @param options
 * @returns factory {@link FXRateFactoryInterface}
 */
export const defineFXRateFactory = (<TOptions extends FXRateFactoryDefineOptions>(options?: TOptions): FXRateFactoryInterface<TOptions> => {
    return defineFXRateFactoryInternal(options ?? {}, {});
}) as FXRateFactoryBuilder;

defineFXRateFactory.withTransientFields = defaultTransientFieldValues => options => defineFXRateFactoryInternal(options ?? {}, defaultTransientFieldValues);

type AuditLogScalarOrEnumFields = {
    model: string;
    recordId: string;
    action: AuditAction;
};

type AuditLogentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutAuditLogsInput["create"]>;
};

type AuditLogtenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutAuditLogsInput["create"]>;
};

type AuditLoguserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutAuditLogsInput["create"]>;
};

type AuditLogFactoryDefineInput = {
    id?: string;
    model?: string;
    recordId?: string;
    action?: AuditAction;
    before?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    after?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    integrityHash?: string | null;
    previousHash?: string | null;
    sequenceNumber?: number | null;
    createdAt?: Date;
    entity?: AuditLogentityFactory | Prisma.EntityCreateNestedOneWithoutAuditLogsInput;
    tenant: AuditLogtenantFactory | Prisma.TenantCreateNestedOneWithoutAuditLogsInput;
    user?: AuditLoguserFactory | Prisma.UserCreateNestedOneWithoutAuditLogsInput;
};

type AuditLogTransientFields = Record<string, unknown> & Partial<Record<keyof AuditLogFactoryDefineInput, never>>;

type AuditLogFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AuditLogFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<AuditLog, Prisma.AuditLogCreateInput, TTransients>;

type AuditLogFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<AuditLogFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: AuditLogFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<AuditLog, Prisma.AuditLogCreateInput, TTransients>;

function isAuditLogentityFactory(x: AuditLogentityFactory | Prisma.EntityCreateNestedOneWithoutAuditLogsInput | undefined): x is AuditLogentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isAuditLogtenantFactory(x: AuditLogtenantFactory | Prisma.TenantCreateNestedOneWithoutAuditLogsInput | undefined): x is AuditLogtenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

function isAuditLoguserFactory(x: AuditLoguserFactory | Prisma.UserCreateNestedOneWithoutAuditLogsInput | undefined): x is AuditLoguserFactory {
    return (x as any)?._factoryFor === "User";
}

type AuditLogTraitKeys<TOptions extends AuditLogFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface AuditLogFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "AuditLog";
    build(inputData?: Partial<Prisma.AuditLogCreateInput & TTransients>): PromiseLike<Prisma.AuditLogCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AuditLogCreateInput & TTransients>): PromiseLike<Prisma.AuditLogCreateInput>;
    buildList(list: readonly Partial<Prisma.AuditLogCreateInput & TTransients>[]): PromiseLike<Prisma.AuditLogCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AuditLogCreateInput & TTransients>): PromiseLike<Prisma.AuditLogCreateInput[]>;
    pickForConnect(inputData: AuditLog): Pick<AuditLog, "id">;
    create(inputData?: Partial<Prisma.AuditLogCreateInput & TTransients>): PromiseLike<AuditLog>;
    createList(list: readonly Partial<Prisma.AuditLogCreateInput & TTransients>[]): PromiseLike<AuditLog[]>;
    createList(count: number, item?: Partial<Prisma.AuditLogCreateInput & TTransients>): PromiseLike<AuditLog[]>;
    createForConnect(inputData?: Partial<Prisma.AuditLogCreateInput & TTransients>): PromiseLike<Pick<AuditLog, "id">>;
}

export interface AuditLogFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AuditLogFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AuditLogFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateAuditLogScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AuditLogScalarOrEnumFields {
    return {
        model: getScalarFieldValueGenerator().String({ modelName: "AuditLog", fieldName: "model", isId: false, isUnique: false, seq }),
        recordId: getScalarFieldValueGenerator().String({ modelName: "AuditLog", fieldName: "recordId", isId: false, isUnique: false, seq }),
        action: "CREATE"
    };
}

function defineAuditLogFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends AuditLogFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): AuditLogFactoryInterface<TTransients, AuditLogTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly AuditLogTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("AuditLog", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.AuditLogCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAuditLogScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<AuditLogFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<AuditLogFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isAuditLogentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                tenant: isAuditLogtenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant,
                user: isAuditLoguserFactory(defaultData.user) ? {
                    create: await defaultData.user.build()
                } : defaultData.user
            } as Prisma.AuditLogCreateInput;
            const data: Prisma.AuditLogCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AuditLogCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: AuditLog) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.AuditLogCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().auditLog.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AuditLogCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.AuditLogCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "AuditLog" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: AuditLogTraitKeys<TOptions>, ...names: readonly AuditLogTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface AuditLogFactoryBuilder {
    <TOptions extends AuditLogFactoryDefineOptions>(options: TOptions): AuditLogFactoryInterface<{}, AuditLogTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AuditLogTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AuditLogFactoryDefineOptions<TTransients>>(options: TOptions) => AuditLogFactoryInterface<TTransients, AuditLogTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link AuditLog} model.
 *
 * @param options
 * @returns factory {@link AuditLogFactoryInterface}
 */
export const defineAuditLogFactory = (<TOptions extends AuditLogFactoryDefineOptions>(options: TOptions): AuditLogFactoryInterface<TOptions> => {
    return defineAuditLogFactoryInternal(options, {});
}) as AuditLogFactoryBuilder;

defineAuditLogFactory.withTransientFields = defaultTransientFieldValues => options => defineAuditLogFactoryInternal(options, defaultTransientFieldValues);

type DomainEventScalarOrEnumFields = {
    type: string;
    payload: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};

type DomainEvententityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutEventsInput["create"]>;
};

type DomainEventtenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutEventsInput["create"]>;
};

type DomainEventFactoryDefineInput = {
    id?: string;
    type?: string;
    aggregateId?: string | null;
    aggregate?: string | null;
    payload?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    createdAt?: Date;
    processedAt?: Date | null;
    entity?: DomainEvententityFactory | Prisma.EntityCreateNestedOneWithoutEventsInput;
    tenant: DomainEventtenantFactory | Prisma.TenantCreateNestedOneWithoutEventsInput;
};

type DomainEventTransientFields = Record<string, unknown> & Partial<Record<keyof DomainEventFactoryDefineInput, never>>;

type DomainEventFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<DomainEventFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<DomainEvent, Prisma.DomainEventCreateInput, TTransients>;

type DomainEventFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<DomainEventFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: DomainEventFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<DomainEvent, Prisma.DomainEventCreateInput, TTransients>;

function isDomainEvententityFactory(x: DomainEvententityFactory | Prisma.EntityCreateNestedOneWithoutEventsInput | undefined): x is DomainEvententityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isDomainEventtenantFactory(x: DomainEventtenantFactory | Prisma.TenantCreateNestedOneWithoutEventsInput | undefined): x is DomainEventtenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

type DomainEventTraitKeys<TOptions extends DomainEventFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface DomainEventFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "DomainEvent";
    build(inputData?: Partial<Prisma.DomainEventCreateInput & TTransients>): PromiseLike<Prisma.DomainEventCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.DomainEventCreateInput & TTransients>): PromiseLike<Prisma.DomainEventCreateInput>;
    buildList(list: readonly Partial<Prisma.DomainEventCreateInput & TTransients>[]): PromiseLike<Prisma.DomainEventCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.DomainEventCreateInput & TTransients>): PromiseLike<Prisma.DomainEventCreateInput[]>;
    pickForConnect(inputData: DomainEvent): Pick<DomainEvent, "id">;
    create(inputData?: Partial<Prisma.DomainEventCreateInput & TTransients>): PromiseLike<DomainEvent>;
    createList(list: readonly Partial<Prisma.DomainEventCreateInput & TTransients>[]): PromiseLike<DomainEvent[]>;
    createList(count: number, item?: Partial<Prisma.DomainEventCreateInput & TTransients>): PromiseLike<DomainEvent[]>;
    createForConnect(inputData?: Partial<Prisma.DomainEventCreateInput & TTransients>): PromiseLike<Pick<DomainEvent, "id">>;
}

export interface DomainEventFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends DomainEventFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): DomainEventFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateDomainEventScalarsOrEnums({ seq }: {
    readonly seq: number;
}): DomainEventScalarOrEnumFields {
    return {
        type: getScalarFieldValueGenerator().String({ modelName: "DomainEvent", fieldName: "type", isId: false, isUnique: false, seq }),
        payload: getScalarFieldValueGenerator().Json({ modelName: "DomainEvent", fieldName: "payload", isId: false, isUnique: false, seq })
    };
}

function defineDomainEventFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends DomainEventFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): DomainEventFactoryInterface<TTransients, DomainEventTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly DomainEventTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("DomainEvent", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.DomainEventCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateDomainEventScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<DomainEventFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<DomainEventFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isDomainEvententityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                tenant: isDomainEventtenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant
            } as Prisma.DomainEventCreateInput;
            const data: Prisma.DomainEventCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.DomainEventCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: DomainEvent) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.DomainEventCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().domainEvent.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.DomainEventCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.DomainEventCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "DomainEvent" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: DomainEventTraitKeys<TOptions>, ...names: readonly DomainEventTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface DomainEventFactoryBuilder {
    <TOptions extends DomainEventFactoryDefineOptions>(options: TOptions): DomainEventFactoryInterface<{}, DomainEventTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends DomainEventTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends DomainEventFactoryDefineOptions<TTransients>>(options: TOptions) => DomainEventFactoryInterface<TTransients, DomainEventTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link DomainEvent} model.
 *
 * @param options
 * @returns factory {@link DomainEventFactoryInterface}
 */
export const defineDomainEventFactory = (<TOptions extends DomainEventFactoryDefineOptions>(options: TOptions): DomainEventFactoryInterface<TOptions> => {
    return defineDomainEventFactoryInternal(options, {});
}) as DomainEventFactoryBuilder;

defineDomainEventFactory.withTransientFields = defaultTransientFieldValues => options => defineDomainEventFactoryInternal(options, defaultTransientFieldValues);

type ImportBatchScalarOrEnumFields = {
    sourceType: ImportBatchSourceType;
    status: ImportBatchStatus;
};

type ImportBatchentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutImportBatchesInput["create"]>;
};

type ImportBatchtenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutImportBatchesInput["create"]>;
};

type ImportBatchFactoryDefineInput = {
    id?: string;
    sourceType?: ImportBatchSourceType;
    status?: ImportBatchStatus;
    error?: string | null;
    createdAt?: Date;
    entity?: ImportBatchentityFactory | Prisma.EntityCreateNestedOneWithoutImportBatchesInput;
    tenant: ImportBatchtenantFactory | Prisma.TenantCreateNestedOneWithoutImportBatchesInput;
    transactions?: Prisma.TransactionCreateNestedManyWithoutImportBatchInput;
};

type ImportBatchTransientFields = Record<string, unknown> & Partial<Record<keyof ImportBatchFactoryDefineInput, never>>;

type ImportBatchFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ImportBatchFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<ImportBatch, Prisma.ImportBatchCreateInput, TTransients>;

type ImportBatchFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<ImportBatchFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: ImportBatchFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<ImportBatch, Prisma.ImportBatchCreateInput, TTransients>;

function isImportBatchentityFactory(x: ImportBatchentityFactory | Prisma.EntityCreateNestedOneWithoutImportBatchesInput | undefined): x is ImportBatchentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isImportBatchtenantFactory(x: ImportBatchtenantFactory | Prisma.TenantCreateNestedOneWithoutImportBatchesInput | undefined): x is ImportBatchtenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

type ImportBatchTraitKeys<TOptions extends ImportBatchFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface ImportBatchFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "ImportBatch";
    build(inputData?: Partial<Prisma.ImportBatchCreateInput & TTransients>): PromiseLike<Prisma.ImportBatchCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ImportBatchCreateInput & TTransients>): PromiseLike<Prisma.ImportBatchCreateInput>;
    buildList(list: readonly Partial<Prisma.ImportBatchCreateInput & TTransients>[]): PromiseLike<Prisma.ImportBatchCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ImportBatchCreateInput & TTransients>): PromiseLike<Prisma.ImportBatchCreateInput[]>;
    pickForConnect(inputData: ImportBatch): Pick<ImportBatch, "id">;
    create(inputData?: Partial<Prisma.ImportBatchCreateInput & TTransients>): PromiseLike<ImportBatch>;
    createList(list: readonly Partial<Prisma.ImportBatchCreateInput & TTransients>[]): PromiseLike<ImportBatch[]>;
    createList(count: number, item?: Partial<Prisma.ImportBatchCreateInput & TTransients>): PromiseLike<ImportBatch[]>;
    createForConnect(inputData?: Partial<Prisma.ImportBatchCreateInput & TTransients>): PromiseLike<Pick<ImportBatch, "id">>;
}

export interface ImportBatchFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ImportBatchFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ImportBatchFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateImportBatchScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ImportBatchScalarOrEnumFields {
    return {
        sourceType: "CSV",
        status: "PENDING"
    };
}

function defineImportBatchFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends ImportBatchFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): ImportBatchFactoryInterface<TTransients, ImportBatchTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly ImportBatchTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("ImportBatch", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.ImportBatchCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateImportBatchScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<ImportBatchFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<ImportBatchFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isImportBatchentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                tenant: isImportBatchtenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant
            } as Prisma.ImportBatchCreateInput;
            const data: Prisma.ImportBatchCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ImportBatchCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: ImportBatch) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.ImportBatchCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().importBatch.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ImportBatchCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.ImportBatchCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "ImportBatch" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: ImportBatchTraitKeys<TOptions>, ...names: readonly ImportBatchTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface ImportBatchFactoryBuilder {
    <TOptions extends ImportBatchFactoryDefineOptions>(options: TOptions): ImportBatchFactoryInterface<{}, ImportBatchTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ImportBatchTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ImportBatchFactoryDefineOptions<TTransients>>(options: TOptions) => ImportBatchFactoryInterface<TTransients, ImportBatchTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link ImportBatch} model.
 *
 * @param options
 * @returns factory {@link ImportBatchFactoryInterface}
 */
export const defineImportBatchFactory = (<TOptions extends ImportBatchFactoryDefineOptions>(options: TOptions): ImportBatchFactoryInterface<TOptions> => {
    return defineImportBatchFactoryInternal(options, {});
}) as ImportBatchFactoryBuilder;

defineImportBatchFactory.withTransientFields = defaultTransientFieldValues => options => defineImportBatchFactoryInternal(options, defaultTransientFieldValues);

type AccountingPolicyScalarOrEnumFields = {
    key: string;
    value: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    effectiveFrom: Date;
};

type AccountingPolicyentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutAccountingPoliciesInput["create"]>;
};

type AccountingPolicytenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutAccountingPoliciesInput["create"]>;
};

type AccountingPolicyFactoryDefineInput = {
    id?: string;
    key?: string;
    value?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    entity?: AccountingPolicyentityFactory | Prisma.EntityCreateNestedOneWithoutAccountingPoliciesInput;
    tenant: AccountingPolicytenantFactory | Prisma.TenantCreateNestedOneWithoutAccountingPoliciesInput;
};

type AccountingPolicyTransientFields = Record<string, unknown> & Partial<Record<keyof AccountingPolicyFactoryDefineInput, never>>;

type AccountingPolicyFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AccountingPolicyFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<AccountingPolicy, Prisma.AccountingPolicyCreateInput, TTransients>;

type AccountingPolicyFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<AccountingPolicyFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: AccountingPolicyFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<AccountingPolicy, Prisma.AccountingPolicyCreateInput, TTransients>;

function isAccountingPolicyentityFactory(x: AccountingPolicyentityFactory | Prisma.EntityCreateNestedOneWithoutAccountingPoliciesInput | undefined): x is AccountingPolicyentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isAccountingPolicytenantFactory(x: AccountingPolicytenantFactory | Prisma.TenantCreateNestedOneWithoutAccountingPoliciesInput | undefined): x is AccountingPolicytenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

type AccountingPolicyTraitKeys<TOptions extends AccountingPolicyFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface AccountingPolicyFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "AccountingPolicy";
    build(inputData?: Partial<Prisma.AccountingPolicyCreateInput & TTransients>): PromiseLike<Prisma.AccountingPolicyCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AccountingPolicyCreateInput & TTransients>): PromiseLike<Prisma.AccountingPolicyCreateInput>;
    buildList(list: readonly Partial<Prisma.AccountingPolicyCreateInput & TTransients>[]): PromiseLike<Prisma.AccountingPolicyCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AccountingPolicyCreateInput & TTransients>): PromiseLike<Prisma.AccountingPolicyCreateInput[]>;
    pickForConnect(inputData: AccountingPolicy): Pick<AccountingPolicy, "id">;
    create(inputData?: Partial<Prisma.AccountingPolicyCreateInput & TTransients>): PromiseLike<AccountingPolicy>;
    createList(list: readonly Partial<Prisma.AccountingPolicyCreateInput & TTransients>[]): PromiseLike<AccountingPolicy[]>;
    createList(count: number, item?: Partial<Prisma.AccountingPolicyCreateInput & TTransients>): PromiseLike<AccountingPolicy[]>;
    createForConnect(inputData?: Partial<Prisma.AccountingPolicyCreateInput & TTransients>): PromiseLike<Pick<AccountingPolicy, "id">>;
}

export interface AccountingPolicyFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AccountingPolicyFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AccountingPolicyFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateAccountingPolicyScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AccountingPolicyScalarOrEnumFields {
    return {
        key: getScalarFieldValueGenerator().String({ modelName: "AccountingPolicy", fieldName: "key", isId: false, isUnique: false, seq }),
        value: getScalarFieldValueGenerator().Json({ modelName: "AccountingPolicy", fieldName: "value", isId: false, isUnique: false, seq }),
        effectiveFrom: getScalarFieldValueGenerator().DateTime({ modelName: "AccountingPolicy", fieldName: "effectiveFrom", isId: false, isUnique: false, seq })
    };
}

function defineAccountingPolicyFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends AccountingPolicyFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): AccountingPolicyFactoryInterface<TTransients, AccountingPolicyTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly AccountingPolicyTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("AccountingPolicy", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.AccountingPolicyCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAccountingPolicyScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<AccountingPolicyFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<AccountingPolicyFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isAccountingPolicyentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                tenant: isAccountingPolicytenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant
            } as Prisma.AccountingPolicyCreateInput;
            const data: Prisma.AccountingPolicyCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AccountingPolicyCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: AccountingPolicy) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.AccountingPolicyCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().accountingPolicy.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AccountingPolicyCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.AccountingPolicyCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "AccountingPolicy" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: AccountingPolicyTraitKeys<TOptions>, ...names: readonly AccountingPolicyTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface AccountingPolicyFactoryBuilder {
    <TOptions extends AccountingPolicyFactoryDefineOptions>(options: TOptions): AccountingPolicyFactoryInterface<{}, AccountingPolicyTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AccountingPolicyTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AccountingPolicyFactoryDefineOptions<TTransients>>(options: TOptions) => AccountingPolicyFactoryInterface<TTransients, AccountingPolicyTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link AccountingPolicy} model.
 *
 * @param options
 * @returns factory {@link AccountingPolicyFactoryInterface}
 */
export const defineAccountingPolicyFactory = (<TOptions extends AccountingPolicyFactoryDefineOptions>(options: TOptions): AccountingPolicyFactoryInterface<TOptions> => {
    return defineAccountingPolicyFactoryInternal(options, {});
}) as AccountingPolicyFactoryBuilder;

defineAccountingPolicyFactory.withTransientFields = defaultTransientFieldValues => options => defineAccountingPolicyFactoryInternal(options, defaultTransientFieldValues);

type ConsolidationEliminationScalarOrEnumFields = {
    fiscalPeriodId: string;
    fromEntityId: string;
    toEntityId: string;
    amount: number;
    description: string;
};

type ConsolidationEliminationFactoryDefineInput = {
    id?: string;
    fiscalPeriodId?: string;
    fromEntityId?: string;
    toEntityId?: string;
    amount?: number;
    description?: string;
    journalEntryId?: string | null;
    createdAt?: Date;
};

type ConsolidationEliminationTransientFields = Record<string, unknown> & Partial<Record<keyof ConsolidationEliminationFactoryDefineInput, never>>;

type ConsolidationEliminationFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ConsolidationEliminationFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<ConsolidationElimination, Prisma.ConsolidationEliminationCreateInput, TTransients>;

type ConsolidationEliminationFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<ConsolidationEliminationFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: ConsolidationEliminationFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<ConsolidationElimination, Prisma.ConsolidationEliminationCreateInput, TTransients>;

type ConsolidationEliminationTraitKeys<TOptions extends ConsolidationEliminationFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface ConsolidationEliminationFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "ConsolidationElimination";
    build(inputData?: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>): PromiseLike<Prisma.ConsolidationEliminationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>): PromiseLike<Prisma.ConsolidationEliminationCreateInput>;
    buildList(list: readonly Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>[]): PromiseLike<Prisma.ConsolidationEliminationCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>): PromiseLike<Prisma.ConsolidationEliminationCreateInput[]>;
    pickForConnect(inputData: ConsolidationElimination): Pick<ConsolidationElimination, "id">;
    create(inputData?: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>): PromiseLike<ConsolidationElimination>;
    createList(list: readonly Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>[]): PromiseLike<ConsolidationElimination[]>;
    createList(count: number, item?: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>): PromiseLike<ConsolidationElimination[]>;
    createForConnect(inputData?: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>): PromiseLike<Pick<ConsolidationElimination, "id">>;
}

export interface ConsolidationEliminationFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ConsolidationEliminationFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ConsolidationEliminationFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateConsolidationEliminationScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ConsolidationEliminationScalarOrEnumFields {
    return {
        fiscalPeriodId: getScalarFieldValueGenerator().String({ modelName: "ConsolidationElimination", fieldName: "fiscalPeriodId", isId: false, isUnique: false, seq }),
        fromEntityId: getScalarFieldValueGenerator().String({ modelName: "ConsolidationElimination", fieldName: "fromEntityId", isId: false, isUnique: false, seq }),
        toEntityId: getScalarFieldValueGenerator().String({ modelName: "ConsolidationElimination", fieldName: "toEntityId", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "ConsolidationElimination", fieldName: "amount", isId: false, isUnique: false, seq }),
        description: getScalarFieldValueGenerator().String({ modelName: "ConsolidationElimination", fieldName: "description", isId: false, isUnique: false, seq })
    };
}

function defineConsolidationEliminationFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends ConsolidationEliminationFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): ConsolidationEliminationFactoryInterface<TTransients, ConsolidationEliminationTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly ConsolidationEliminationTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("ConsolidationElimination", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateConsolidationEliminationScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<ConsolidationEliminationFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<ConsolidationEliminationFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {} as Prisma.ConsolidationEliminationCreateInput;
            const data: Prisma.ConsolidationEliminationCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: ConsolidationElimination) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().consolidationElimination.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.ConsolidationEliminationCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.ConsolidationEliminationCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "ConsolidationElimination" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: ConsolidationEliminationTraitKeys<TOptions>, ...names: readonly ConsolidationEliminationTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface ConsolidationEliminationFactoryBuilder {
    <TOptions extends ConsolidationEliminationFactoryDefineOptions>(options?: TOptions): ConsolidationEliminationFactoryInterface<{}, ConsolidationEliminationTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ConsolidationEliminationTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ConsolidationEliminationFactoryDefineOptions<TTransients>>(options?: TOptions) => ConsolidationEliminationFactoryInterface<TTransients, ConsolidationEliminationTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link ConsolidationElimination} model.
 *
 * @param options
 * @returns factory {@link ConsolidationEliminationFactoryInterface}
 */
export const defineConsolidationEliminationFactory = (<TOptions extends ConsolidationEliminationFactoryDefineOptions>(options?: TOptions): ConsolidationEliminationFactoryInterface<TOptions> => {
    return defineConsolidationEliminationFactoryInternal(options ?? {}, {});
}) as ConsolidationEliminationFactoryBuilder;

defineConsolidationEliminationFactory.withTransientFields = defaultTransientFieldValues => options => defineConsolidationEliminationFactoryInternal(options ?? {}, defaultTransientFieldValues);

type OnboardingProgressScalarOrEnumFields = {};

type OnboardingProgresstenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutOnboardingProgressInput["create"]>;
};

type OnboardingProgressFactoryDefineInput = {
    id?: string;
    completedSteps?: Prisma.OnboardingProgressCreatecompletedStepsInput | Array<string>;
    skippedSteps?: Prisma.OnboardingProgressCreateskippedStepsInput | Array<string>;
    basicInfoComplete?: boolean;
    entitySetupComplete?: boolean;
    businessDetailsComplete?: boolean;
    bankConnectionComplete?: boolean;
    goalsSetupComplete?: boolean;
    completionPercentage?: number;
    lastNudgedAt?: Date | null;
    dashboardCardDismissedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    tenant: OnboardingProgresstenantFactory | Prisma.TenantCreateNestedOneWithoutOnboardingProgressInput;
};

type OnboardingProgressTransientFields = Record<string, unknown> & Partial<Record<keyof OnboardingProgressFactoryDefineInput, never>>;

type OnboardingProgressFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<OnboardingProgressFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<OnboardingProgress, Prisma.OnboardingProgressCreateInput, TTransients>;

type OnboardingProgressFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<OnboardingProgressFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: OnboardingProgressFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<OnboardingProgress, Prisma.OnboardingProgressCreateInput, TTransients>;

function isOnboardingProgresstenantFactory(x: OnboardingProgresstenantFactory | Prisma.TenantCreateNestedOneWithoutOnboardingProgressInput | undefined): x is OnboardingProgresstenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

type OnboardingProgressTraitKeys<TOptions extends OnboardingProgressFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface OnboardingProgressFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "OnboardingProgress";
    build(inputData?: Partial<Prisma.OnboardingProgressCreateInput & TTransients>): PromiseLike<Prisma.OnboardingProgressCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.OnboardingProgressCreateInput & TTransients>): PromiseLike<Prisma.OnboardingProgressCreateInput>;
    buildList(list: readonly Partial<Prisma.OnboardingProgressCreateInput & TTransients>[]): PromiseLike<Prisma.OnboardingProgressCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.OnboardingProgressCreateInput & TTransients>): PromiseLike<Prisma.OnboardingProgressCreateInput[]>;
    pickForConnect(inputData: OnboardingProgress): Pick<OnboardingProgress, "id">;
    create(inputData?: Partial<Prisma.OnboardingProgressCreateInput & TTransients>): PromiseLike<OnboardingProgress>;
    createList(list: readonly Partial<Prisma.OnboardingProgressCreateInput & TTransients>[]): PromiseLike<OnboardingProgress[]>;
    createList(count: number, item?: Partial<Prisma.OnboardingProgressCreateInput & TTransients>): PromiseLike<OnboardingProgress[]>;
    createForConnect(inputData?: Partial<Prisma.OnboardingProgressCreateInput & TTransients>): PromiseLike<Pick<OnboardingProgress, "id">>;
}

export interface OnboardingProgressFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends OnboardingProgressFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): OnboardingProgressFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateOnboardingProgressScalarsOrEnums({ seq }: {
    readonly seq: number;
}): OnboardingProgressScalarOrEnumFields {
    return {};
}

function defineOnboardingProgressFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends OnboardingProgressFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): OnboardingProgressFactoryInterface<TTransients, OnboardingProgressTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly OnboardingProgressTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("OnboardingProgress", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.OnboardingProgressCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateOnboardingProgressScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<OnboardingProgressFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<OnboardingProgressFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                tenant: isOnboardingProgresstenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant
            } as Prisma.OnboardingProgressCreateInput;
            const data: Prisma.OnboardingProgressCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.OnboardingProgressCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: OnboardingProgress) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.OnboardingProgressCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().onboardingProgress.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.OnboardingProgressCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.OnboardingProgressCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "OnboardingProgress" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: OnboardingProgressTraitKeys<TOptions>, ...names: readonly OnboardingProgressTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface OnboardingProgressFactoryBuilder {
    <TOptions extends OnboardingProgressFactoryDefineOptions>(options: TOptions): OnboardingProgressFactoryInterface<{}, OnboardingProgressTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends OnboardingProgressTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends OnboardingProgressFactoryDefineOptions<TTransients>>(options: TOptions) => OnboardingProgressFactoryInterface<TTransients, OnboardingProgressTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link OnboardingProgress} model.
 *
 * @param options
 * @returns factory {@link OnboardingProgressFactoryInterface}
 */
export const defineOnboardingProgressFactory = (<TOptions extends OnboardingProgressFactoryDefineOptions>(options: TOptions): OnboardingProgressFactoryInterface<TOptions> => {
    return defineOnboardingProgressFactoryInternal(options, {});
}) as OnboardingProgressFactoryBuilder;

defineOnboardingProgressFactory.withTransientFields = defaultTransientFieldValues => options => defineOnboardingProgressFactoryInternal(options, defaultTransientFieldValues);

type OnboardingWizardStateScalarOrEnumFields = {
    clerkUserId: string;
};

type OnboardingWizardStateFactoryDefineInput = {
    id?: string;
    clerkUserId?: string;
    currentStep?: number;
    stepData?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
};

type OnboardingWizardStateTransientFields = Record<string, unknown> & Partial<Record<keyof OnboardingWizardStateFactoryDefineInput, never>>;

type OnboardingWizardStateFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<OnboardingWizardStateFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<OnboardingWizardState, Prisma.OnboardingWizardStateCreateInput, TTransients>;

type OnboardingWizardStateFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<OnboardingWizardStateFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: OnboardingWizardStateFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<OnboardingWizardState, Prisma.OnboardingWizardStateCreateInput, TTransients>;

type OnboardingWizardStateTraitKeys<TOptions extends OnboardingWizardStateFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface OnboardingWizardStateFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "OnboardingWizardState";
    build(inputData?: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>): PromiseLike<Prisma.OnboardingWizardStateCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>): PromiseLike<Prisma.OnboardingWizardStateCreateInput>;
    buildList(list: readonly Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>[]): PromiseLike<Prisma.OnboardingWizardStateCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>): PromiseLike<Prisma.OnboardingWizardStateCreateInput[]>;
    pickForConnect(inputData: OnboardingWizardState): Pick<OnboardingWizardState, "id">;
    create(inputData?: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>): PromiseLike<OnboardingWizardState>;
    createList(list: readonly Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>[]): PromiseLike<OnboardingWizardState[]>;
    createList(count: number, item?: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>): PromiseLike<OnboardingWizardState[]>;
    createForConnect(inputData?: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>): PromiseLike<Pick<OnboardingWizardState, "id">>;
}

export interface OnboardingWizardStateFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends OnboardingWizardStateFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): OnboardingWizardStateFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateOnboardingWizardStateScalarsOrEnums({ seq }: {
    readonly seq: number;
}): OnboardingWizardStateScalarOrEnumFields {
    return {
        clerkUserId: getScalarFieldValueGenerator().String({ modelName: "OnboardingWizardState", fieldName: "clerkUserId", isId: false, isUnique: true, seq })
    };
}

function defineOnboardingWizardStateFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends OnboardingWizardStateFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): OnboardingWizardStateFactoryInterface<TTransients, OnboardingWizardStateTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly OnboardingWizardStateTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("OnboardingWizardState", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateOnboardingWizardStateScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<OnboardingWizardStateFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<OnboardingWizardStateFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {} as Prisma.OnboardingWizardStateCreateInput;
            const data: Prisma.OnboardingWizardStateCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: OnboardingWizardState) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().onboardingWizardState.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.OnboardingWizardStateCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.OnboardingWizardStateCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "OnboardingWizardState" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: OnboardingWizardStateTraitKeys<TOptions>, ...names: readonly OnboardingWizardStateTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface OnboardingWizardStateFactoryBuilder {
    <TOptions extends OnboardingWizardStateFactoryDefineOptions>(options?: TOptions): OnboardingWizardStateFactoryInterface<{}, OnboardingWizardStateTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends OnboardingWizardStateTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends OnboardingWizardStateFactoryDefineOptions<TTransients>>(options?: TOptions) => OnboardingWizardStateFactoryInterface<TTransients, OnboardingWizardStateTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link OnboardingWizardState} model.
 *
 * @param options
 * @returns factory {@link OnboardingWizardStateFactoryInterface}
 */
export const defineOnboardingWizardStateFactory = (<TOptions extends OnboardingWizardStateFactoryDefineOptions>(options?: TOptions): OnboardingWizardStateFactoryInterface<TOptions> => {
    return defineOnboardingWizardStateFactoryInternal(options ?? {}, {});
}) as OnboardingWizardStateFactoryBuilder;

defineOnboardingWizardStateFactory.withTransientFields = defaultTransientFieldValues => options => defineOnboardingWizardStateFactoryInternal(options ?? {}, defaultTransientFieldValues);

type RuleSuggestionScalarOrEnumFields = {
    entityId: string;
    triggeredBy: string;
    suggestedRule: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    aiReasoning: string;
    aiConfidence: number;
    aiModelVersion: string;
    status: RuleSuggestionStatus;
};

type RuleSuggestionFactoryDefineInput = {
    id?: string;
    entityId?: string;
    triggeredBy?: string;
    suggestedRule?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    aiReasoning?: string;
    aiConfidence?: number;
    aiModelVersion?: string;
    status?: RuleSuggestionStatus;
    createdAt?: Date;
    reviewedAt?: Date | null;
    reviewedBy?: string | null;
};

type RuleSuggestionTransientFields = Record<string, unknown> & Partial<Record<keyof RuleSuggestionFactoryDefineInput, never>>;

type RuleSuggestionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<RuleSuggestionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<RuleSuggestion, Prisma.RuleSuggestionCreateInput, TTransients>;

type RuleSuggestionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<RuleSuggestionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: RuleSuggestionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<RuleSuggestion, Prisma.RuleSuggestionCreateInput, TTransients>;

type RuleSuggestionTraitKeys<TOptions extends RuleSuggestionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface RuleSuggestionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "RuleSuggestion";
    build(inputData?: Partial<Prisma.RuleSuggestionCreateInput & TTransients>): PromiseLike<Prisma.RuleSuggestionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.RuleSuggestionCreateInput & TTransients>): PromiseLike<Prisma.RuleSuggestionCreateInput>;
    buildList(list: readonly Partial<Prisma.RuleSuggestionCreateInput & TTransients>[]): PromiseLike<Prisma.RuleSuggestionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.RuleSuggestionCreateInput & TTransients>): PromiseLike<Prisma.RuleSuggestionCreateInput[]>;
    pickForConnect(inputData: RuleSuggestion): Pick<RuleSuggestion, "id">;
    create(inputData?: Partial<Prisma.RuleSuggestionCreateInput & TTransients>): PromiseLike<RuleSuggestion>;
    createList(list: readonly Partial<Prisma.RuleSuggestionCreateInput & TTransients>[]): PromiseLike<RuleSuggestion[]>;
    createList(count: number, item?: Partial<Prisma.RuleSuggestionCreateInput & TTransients>): PromiseLike<RuleSuggestion[]>;
    createForConnect(inputData?: Partial<Prisma.RuleSuggestionCreateInput & TTransients>): PromiseLike<Pick<RuleSuggestion, "id">>;
}

export interface RuleSuggestionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends RuleSuggestionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): RuleSuggestionFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateRuleSuggestionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): RuleSuggestionScalarOrEnumFields {
    return {
        entityId: getScalarFieldValueGenerator().String({ modelName: "RuleSuggestion", fieldName: "entityId", isId: false, isUnique: false, seq }),
        triggeredBy: getScalarFieldValueGenerator().String({ modelName: "RuleSuggestion", fieldName: "triggeredBy", isId: false, isUnique: false, seq }),
        suggestedRule: getScalarFieldValueGenerator().Json({ modelName: "RuleSuggestion", fieldName: "suggestedRule", isId: false, isUnique: false, seq }),
        aiReasoning: getScalarFieldValueGenerator().String({ modelName: "RuleSuggestion", fieldName: "aiReasoning", isId: false, isUnique: false, seq }),
        aiConfidence: getScalarFieldValueGenerator().Float({ modelName: "RuleSuggestion", fieldName: "aiConfidence", isId: false, isUnique: false, seq }),
        aiModelVersion: getScalarFieldValueGenerator().String({ modelName: "RuleSuggestion", fieldName: "aiModelVersion", isId: false, isUnique: false, seq }),
        status: "PENDING"
    };
}

function defineRuleSuggestionFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends RuleSuggestionFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): RuleSuggestionFactoryInterface<TTransients, RuleSuggestionTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly RuleSuggestionTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("RuleSuggestion", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.RuleSuggestionCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateRuleSuggestionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<RuleSuggestionFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<RuleSuggestionFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {} as Prisma.RuleSuggestionCreateInput;
            const data: Prisma.RuleSuggestionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.RuleSuggestionCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: RuleSuggestion) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.RuleSuggestionCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().ruleSuggestion.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.RuleSuggestionCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.RuleSuggestionCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "RuleSuggestion" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: RuleSuggestionTraitKeys<TOptions>, ...names: readonly RuleSuggestionTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface RuleSuggestionFactoryBuilder {
    <TOptions extends RuleSuggestionFactoryDefineOptions>(options?: TOptions): RuleSuggestionFactoryInterface<{}, RuleSuggestionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends RuleSuggestionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends RuleSuggestionFactoryDefineOptions<TTransients>>(options?: TOptions) => RuleSuggestionFactoryInterface<TTransients, RuleSuggestionTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link RuleSuggestion} model.
 *
 * @param options
 * @returns factory {@link RuleSuggestionFactoryInterface}
 */
export const defineRuleSuggestionFactory = (<TOptions extends RuleSuggestionFactoryDefineOptions>(options?: TOptions): RuleSuggestionFactoryInterface<TOptions> => {
    return defineRuleSuggestionFactoryInternal(options ?? {}, {});
}) as RuleSuggestionFactoryBuilder;

defineRuleSuggestionFactory.withTransientFields = defaultTransientFieldValues => options => defineRuleSuggestionFactoryInternal(options ?? {}, defaultTransientFieldValues);

type FixedAssetScalarOrEnumFields = {
    name: string;
    category: AssetCategory;
    acquiredDate: Date;
    cost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    depreciationMethod: DepreciationMethod;
};

type FixedAssetentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutFixedAssetsInput["create"]>;
};

type FixedAssetassetGLAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsAssetInput["create"]>;
};

type FixedAssetdepreciationExpenseGLAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsDepreciationExpenseInput["create"]>;
};

type FixedAssetaccumulatedDepreciationGLAccountFactory = {
    _factoryFor: "GLAccount";
    build: () => PromiseLike<Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsAccumulatedDeprInput["create"]>;
};

type FixedAssetFactoryDefineInput = {
    id?: string;
    name?: string;
    description?: string | null;
    category?: AssetCategory;
    acquiredDate?: Date;
    cost?: number;
    salvageValue?: number;
    usefulLifeMonths?: number;
    depreciationMethod?: DepreciationMethod;
    accumulatedDepreciation?: number;
    status?: AssetStatus;
    disposedDate?: Date | null;
    disposalAmount?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    entity: FixedAssetentityFactory | Prisma.EntityCreateNestedOneWithoutFixedAssetsInput;
    assetGLAccount?: FixedAssetassetGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsAssetInput;
    depreciationExpenseGLAccount?: FixedAssetdepreciationExpenseGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsDepreciationExpenseInput;
    accumulatedDepreciationGLAccount?: FixedAssetaccumulatedDepreciationGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsAccumulatedDeprInput;
    depreciationEntries?: Prisma.DepreciationEntryCreateNestedManyWithoutFixedAssetInput;
};

type FixedAssetTransientFields = Record<string, unknown> & Partial<Record<keyof FixedAssetFactoryDefineInput, never>>;

type FixedAssetFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FixedAssetFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FixedAsset, Prisma.FixedAssetCreateInput, TTransients>;

type FixedAssetFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<FixedAssetFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: FixedAssetFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FixedAsset, Prisma.FixedAssetCreateInput, TTransients>;

function isFixedAssetentityFactory(x: FixedAssetentityFactory | Prisma.EntityCreateNestedOneWithoutFixedAssetsInput | undefined): x is FixedAssetentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

function isFixedAssetassetGLAccountFactory(x: FixedAssetassetGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsAssetInput | undefined): x is FixedAssetassetGLAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

function isFixedAssetdepreciationExpenseGLAccountFactory(x: FixedAssetdepreciationExpenseGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsDepreciationExpenseInput | undefined): x is FixedAssetdepreciationExpenseGLAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

function isFixedAssetaccumulatedDepreciationGLAccountFactory(x: FixedAssetaccumulatedDepreciationGLAccountFactory | Prisma.GLAccountCreateNestedOneWithoutFixedAssetsAsAccumulatedDeprInput | undefined): x is FixedAssetaccumulatedDepreciationGLAccountFactory {
    return (x as any)?._factoryFor === "GLAccount";
}

type FixedAssetTraitKeys<TOptions extends FixedAssetFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface FixedAssetFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FixedAsset";
    build(inputData?: Partial<Prisma.FixedAssetCreateInput & TTransients>): PromiseLike<Prisma.FixedAssetCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FixedAssetCreateInput & TTransients>): PromiseLike<Prisma.FixedAssetCreateInput>;
    buildList(list: readonly Partial<Prisma.FixedAssetCreateInput & TTransients>[]): PromiseLike<Prisma.FixedAssetCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FixedAssetCreateInput & TTransients>): PromiseLike<Prisma.FixedAssetCreateInput[]>;
    pickForConnect(inputData: FixedAsset): Pick<FixedAsset, "id">;
    create(inputData?: Partial<Prisma.FixedAssetCreateInput & TTransients>): PromiseLike<FixedAsset>;
    createList(list: readonly Partial<Prisma.FixedAssetCreateInput & TTransients>[]): PromiseLike<FixedAsset[]>;
    createList(count: number, item?: Partial<Prisma.FixedAssetCreateInput & TTransients>): PromiseLike<FixedAsset[]>;
    createForConnect(inputData?: Partial<Prisma.FixedAssetCreateInput & TTransients>): PromiseLike<Pick<FixedAsset, "id">>;
}

export interface FixedAssetFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FixedAssetFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FixedAssetFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateFixedAssetScalarsOrEnums({ seq }: {
    readonly seq: number;
}): FixedAssetScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "FixedAsset", fieldName: "name", isId: false, isUnique: false, seq }),
        category: "BUILDING",
        acquiredDate: getScalarFieldValueGenerator().DateTime({ modelName: "FixedAsset", fieldName: "acquiredDate", isId: false, isUnique: false, seq }),
        cost: getScalarFieldValueGenerator().Int({ modelName: "FixedAsset", fieldName: "cost", isId: false, isUnique: false, seq }),
        salvageValue: getScalarFieldValueGenerator().Int({ modelName: "FixedAsset", fieldName: "salvageValue", isId: false, isUnique: false, seq }),
        usefulLifeMonths: getScalarFieldValueGenerator().Int({ modelName: "FixedAsset", fieldName: "usefulLifeMonths", isId: false, isUnique: false, seq }),
        depreciationMethod: "STRAIGHT_LINE"
    };
}

function defineFixedAssetFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends FixedAssetFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): FixedAssetFactoryInterface<TTransients, FixedAssetTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly FixedAssetTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FixedAsset", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.FixedAssetCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFixedAssetScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<FixedAssetFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<FixedAssetFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isFixedAssetentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity,
                assetGLAccount: isFixedAssetassetGLAccountFactory(defaultData.assetGLAccount) ? {
                    create: await defaultData.assetGLAccount.build()
                } : defaultData.assetGLAccount,
                depreciationExpenseGLAccount: isFixedAssetdepreciationExpenseGLAccountFactory(defaultData.depreciationExpenseGLAccount) ? {
                    create: await defaultData.depreciationExpenseGLAccount.build()
                } : defaultData.depreciationExpenseGLAccount,
                accumulatedDepreciationGLAccount: isFixedAssetaccumulatedDepreciationGLAccountFactory(defaultData.accumulatedDepreciationGLAccount) ? {
                    create: await defaultData.accumulatedDepreciationGLAccount.build()
                } : defaultData.accumulatedDepreciationGLAccount
            } as Prisma.FixedAssetCreateInput;
            const data: Prisma.FixedAssetCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FixedAssetCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: FixedAsset) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.FixedAssetCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().fixedAsset.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.FixedAssetCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.FixedAssetCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FixedAsset" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: FixedAssetTraitKeys<TOptions>, ...names: readonly FixedAssetTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface FixedAssetFactoryBuilder {
    <TOptions extends FixedAssetFactoryDefineOptions>(options: TOptions): FixedAssetFactoryInterface<{}, FixedAssetTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FixedAssetTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FixedAssetFactoryDefineOptions<TTransients>>(options: TOptions) => FixedAssetFactoryInterface<TTransients, FixedAssetTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link FixedAsset} model.
 *
 * @param options
 * @returns factory {@link FixedAssetFactoryInterface}
 */
export const defineFixedAssetFactory = (<TOptions extends FixedAssetFactoryDefineOptions>(options: TOptions): FixedAssetFactoryInterface<TOptions> => {
    return defineFixedAssetFactoryInternal(options, {});
}) as FixedAssetFactoryBuilder;

defineFixedAssetFactory.withTransientFields = defaultTransientFieldValues => options => defineFixedAssetFactoryInternal(options, defaultTransientFieldValues);

type DepreciationEntryScalarOrEnumFields = {
    periodDate: Date;
    amount: number;
    method: DepreciationMethod;
};

type DepreciationEntryfixedAssetFactory = {
    _factoryFor: "FixedAsset";
    build: () => PromiseLike<Prisma.FixedAssetCreateNestedOneWithoutDepreciationEntriesInput["create"]>;
};

type DepreciationEntryjournalEntryFactory = {
    _factoryFor: "JournalEntry";
    build: () => PromiseLike<Prisma.JournalEntryCreateNestedOneWithoutDepreciationEntriesInput["create"]>;
};

type DepreciationEntryFactoryDefineInput = {
    id?: string;
    periodDate?: Date;
    amount?: number;
    method?: DepreciationMethod;
    createdAt?: Date;
    fixedAsset: DepreciationEntryfixedAssetFactory | Prisma.FixedAssetCreateNestedOneWithoutDepreciationEntriesInput;
    journalEntry?: DepreciationEntryjournalEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutDepreciationEntriesInput;
};

type DepreciationEntryTransientFields = Record<string, unknown> & Partial<Record<keyof DepreciationEntryFactoryDefineInput, never>>;

type DepreciationEntryFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<DepreciationEntryFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<DepreciationEntry, Prisma.DepreciationEntryCreateInput, TTransients>;

type DepreciationEntryFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<DepreciationEntryFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: DepreciationEntryFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<DepreciationEntry, Prisma.DepreciationEntryCreateInput, TTransients>;

function isDepreciationEntryfixedAssetFactory(x: DepreciationEntryfixedAssetFactory | Prisma.FixedAssetCreateNestedOneWithoutDepreciationEntriesInput | undefined): x is DepreciationEntryfixedAssetFactory {
    return (x as any)?._factoryFor === "FixedAsset";
}

function isDepreciationEntryjournalEntryFactory(x: DepreciationEntryjournalEntryFactory | Prisma.JournalEntryCreateNestedOneWithoutDepreciationEntriesInput | undefined): x is DepreciationEntryjournalEntryFactory {
    return (x as any)?._factoryFor === "JournalEntry";
}

type DepreciationEntryTraitKeys<TOptions extends DepreciationEntryFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface DepreciationEntryFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "DepreciationEntry";
    build(inputData?: Partial<Prisma.DepreciationEntryCreateInput & TTransients>): PromiseLike<Prisma.DepreciationEntryCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.DepreciationEntryCreateInput & TTransients>): PromiseLike<Prisma.DepreciationEntryCreateInput>;
    buildList(list: readonly Partial<Prisma.DepreciationEntryCreateInput & TTransients>[]): PromiseLike<Prisma.DepreciationEntryCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.DepreciationEntryCreateInput & TTransients>): PromiseLike<Prisma.DepreciationEntryCreateInput[]>;
    pickForConnect(inputData: DepreciationEntry): Pick<DepreciationEntry, "id">;
    create(inputData?: Partial<Prisma.DepreciationEntryCreateInput & TTransients>): PromiseLike<DepreciationEntry>;
    createList(list: readonly Partial<Prisma.DepreciationEntryCreateInput & TTransients>[]): PromiseLike<DepreciationEntry[]>;
    createList(count: number, item?: Partial<Prisma.DepreciationEntryCreateInput & TTransients>): PromiseLike<DepreciationEntry[]>;
    createForConnect(inputData?: Partial<Prisma.DepreciationEntryCreateInput & TTransients>): PromiseLike<Pick<DepreciationEntry, "id">>;
}

export interface DepreciationEntryFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends DepreciationEntryFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): DepreciationEntryFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateDepreciationEntryScalarsOrEnums({ seq }: {
    readonly seq: number;
}): DepreciationEntryScalarOrEnumFields {
    return {
        periodDate: getScalarFieldValueGenerator().DateTime({ modelName: "DepreciationEntry", fieldName: "periodDate", isId: false, isUnique: true, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "DepreciationEntry", fieldName: "amount", isId: false, isUnique: false, seq }),
        method: "STRAIGHT_LINE"
    };
}

function defineDepreciationEntryFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends DepreciationEntryFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): DepreciationEntryFactoryInterface<TTransients, DepreciationEntryTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly DepreciationEntryTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("DepreciationEntry", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.DepreciationEntryCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateDepreciationEntryScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<DepreciationEntryFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<DepreciationEntryFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                fixedAsset: isDepreciationEntryfixedAssetFactory(defaultData.fixedAsset) ? {
                    create: await defaultData.fixedAsset.build()
                } : defaultData.fixedAsset,
                journalEntry: isDepreciationEntryjournalEntryFactory(defaultData.journalEntry) ? {
                    create: await defaultData.journalEntry.build()
                } : defaultData.journalEntry
            } as Prisma.DepreciationEntryCreateInput;
            const data: Prisma.DepreciationEntryCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.DepreciationEntryCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: DepreciationEntry) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.DepreciationEntryCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().depreciationEntry.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.DepreciationEntryCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.DepreciationEntryCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "DepreciationEntry" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: DepreciationEntryTraitKeys<TOptions>, ...names: readonly DepreciationEntryTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface DepreciationEntryFactoryBuilder {
    <TOptions extends DepreciationEntryFactoryDefineOptions>(options: TOptions): DepreciationEntryFactoryInterface<{}, DepreciationEntryTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends DepreciationEntryTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends DepreciationEntryFactoryDefineOptions<TTransients>>(options: TOptions) => DepreciationEntryFactoryInterface<TTransients, DepreciationEntryTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link DepreciationEntry} model.
 *
 * @param options
 * @returns factory {@link DepreciationEntryFactoryInterface}
 */
export const defineDepreciationEntryFactory = (<TOptions extends DepreciationEntryFactoryDefineOptions>(options: TOptions): DepreciationEntryFactoryInterface<TOptions> => {
    return defineDepreciationEntryFactoryInternal(options, {});
}) as DepreciationEntryFactoryBuilder;

defineDepreciationEntryFactory.withTransientFields = defaultTransientFieldValues => options => defineDepreciationEntryFactoryInternal(options, defaultTransientFieldValues);

type AIActionScalarOrEnumFields = {
    type: AIActionType;
    title: string;
    payload: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};

type AIActionentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutAiActionsInput["create"]>;
};

type AIActionFactoryDefineInput = {
    id?: string;
    type?: AIActionType;
    title?: string;
    description?: string | null;
    status?: AIActionStatus;
    confidence?: number | null;
    priority?: AIActionPriority;
    payload?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    aiProvider?: string | null;
    aiModel?: string | null;
    metadata?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    reviewedAt?: Date | null;
    reviewedBy?: string | null;
    expiresAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    entity: AIActionentityFactory | Prisma.EntityCreateNestedOneWithoutAiActionsInput;
};

type AIActionTransientFields = Record<string, unknown> & Partial<Record<keyof AIActionFactoryDefineInput, never>>;

type AIActionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AIActionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<AIAction, Prisma.AIActionCreateInput, TTransients>;

type AIActionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<AIActionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: AIActionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<AIAction, Prisma.AIActionCreateInput, TTransients>;

function isAIActionentityFactory(x: AIActionentityFactory | Prisma.EntityCreateNestedOneWithoutAiActionsInput | undefined): x is AIActionentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type AIActionTraitKeys<TOptions extends AIActionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface AIActionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "AIAction";
    build(inputData?: Partial<Prisma.AIActionCreateInput & TTransients>): PromiseLike<Prisma.AIActionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AIActionCreateInput & TTransients>): PromiseLike<Prisma.AIActionCreateInput>;
    buildList(list: readonly Partial<Prisma.AIActionCreateInput & TTransients>[]): PromiseLike<Prisma.AIActionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AIActionCreateInput & TTransients>): PromiseLike<Prisma.AIActionCreateInput[]>;
    pickForConnect(inputData: AIAction): Pick<AIAction, "id">;
    create(inputData?: Partial<Prisma.AIActionCreateInput & TTransients>): PromiseLike<AIAction>;
    createList(list: readonly Partial<Prisma.AIActionCreateInput & TTransients>[]): PromiseLike<AIAction[]>;
    createList(count: number, item?: Partial<Prisma.AIActionCreateInput & TTransients>): PromiseLike<AIAction[]>;
    createForConnect(inputData?: Partial<Prisma.AIActionCreateInput & TTransients>): PromiseLike<Pick<AIAction, "id">>;
}

export interface AIActionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AIActionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AIActionFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateAIActionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AIActionScalarOrEnumFields {
    return {
        type: "CATEGORIZATION",
        title: getScalarFieldValueGenerator().String({ modelName: "AIAction", fieldName: "title", isId: false, isUnique: false, seq }),
        payload: getScalarFieldValueGenerator().Json({ modelName: "AIAction", fieldName: "payload", isId: false, isUnique: false, seq })
    };
}

function defineAIActionFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends AIActionFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): AIActionFactoryInterface<TTransients, AIActionTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly AIActionTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("AIAction", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.AIActionCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAIActionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<AIActionFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<AIActionFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                entity: isAIActionentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.AIActionCreateInput;
            const data: Prisma.AIActionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AIActionCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: AIAction) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.AIActionCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().aIAction.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AIActionCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.AIActionCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "AIAction" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: AIActionTraitKeys<TOptions>, ...names: readonly AIActionTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface AIActionFactoryBuilder {
    <TOptions extends AIActionFactoryDefineOptions>(options: TOptions): AIActionFactoryInterface<{}, AIActionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AIActionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AIActionFactoryDefineOptions<TTransients>>(options: TOptions) => AIActionFactoryInterface<TTransients, AIActionTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link AIAction} model.
 *
 * @param options
 * @returns factory {@link AIActionFactoryInterface}
 */
export const defineAIActionFactory = (<TOptions extends AIActionFactoryDefineOptions>(options: TOptions): AIActionFactoryInterface<TOptions> => {
    return defineAIActionFactoryInternal(options, {});
}) as AIActionFactoryBuilder;

defineAIActionFactory.withTransientFields = defaultTransientFieldValues => options => defineAIActionFactoryInternal(options, defaultTransientFieldValues);

type AIDecisionLogScalarOrEnumFields = {
    decisionType: AIDecisionType;
    inputHash: string;
    modelVersion: string;
    routingResult: AIRoutingResult;
};

type AIDecisionLogtenantFactory = {
    _factoryFor: "Tenant";
    build: () => PromiseLike<Prisma.TenantCreateNestedOneWithoutAiDecisionLogsInput["create"]>;
};

type AIDecisionLogentityFactory = {
    _factoryFor: "Entity";
    build: () => PromiseLike<Prisma.EntityCreateNestedOneWithoutAiDecisionLogsInput["create"]>;
};

type AIDecisionLogFactoryDefineInput = {
    id?: string;
    documentId?: string | null;
    decisionType?: AIDecisionType;
    inputHash?: string;
    modelVersion?: string;
    confidence?: number | null;
    extractedData?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    routingResult?: AIRoutingResult;
    aiExplanation?: string | null;
    consentStatus?: string | null;
    processingTimeMs?: number | null;
    tokensUsed?: number | null;
    createdAt?: Date;
    tenant: AIDecisionLogtenantFactory | Prisma.TenantCreateNestedOneWithoutAiDecisionLogsInput;
    entity?: AIDecisionLogentityFactory | Prisma.EntityCreateNestedOneWithoutAiDecisionLogsInput;
};

type AIDecisionLogTransientFields = Record<string, unknown> & Partial<Record<keyof AIDecisionLogFactoryDefineInput, never>>;

type AIDecisionLogFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AIDecisionLogFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<AIDecisionLog, Prisma.AIDecisionLogCreateInput, TTransients>;

type AIDecisionLogFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<AIDecisionLogFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: AIDecisionLogFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<AIDecisionLog, Prisma.AIDecisionLogCreateInput, TTransients>;

function isAIDecisionLogtenantFactory(x: AIDecisionLogtenantFactory | Prisma.TenantCreateNestedOneWithoutAiDecisionLogsInput | undefined): x is AIDecisionLogtenantFactory {
    return (x as any)?._factoryFor === "Tenant";
}

function isAIDecisionLogentityFactory(x: AIDecisionLogentityFactory | Prisma.EntityCreateNestedOneWithoutAiDecisionLogsInput | undefined): x is AIDecisionLogentityFactory {
    return (x as any)?._factoryFor === "Entity";
}

type AIDecisionLogTraitKeys<TOptions extends AIDecisionLogFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;

export interface AIDecisionLogFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "AIDecisionLog";
    build(inputData?: Partial<Prisma.AIDecisionLogCreateInput & TTransients>): PromiseLike<Prisma.AIDecisionLogCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AIDecisionLogCreateInput & TTransients>): PromiseLike<Prisma.AIDecisionLogCreateInput>;
    buildList(list: readonly Partial<Prisma.AIDecisionLogCreateInput & TTransients>[]): PromiseLike<Prisma.AIDecisionLogCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AIDecisionLogCreateInput & TTransients>): PromiseLike<Prisma.AIDecisionLogCreateInput[]>;
    pickForConnect(inputData: AIDecisionLog): Pick<AIDecisionLog, "id">;
    create(inputData?: Partial<Prisma.AIDecisionLogCreateInput & TTransients>): PromiseLike<AIDecisionLog>;
    createList(list: readonly Partial<Prisma.AIDecisionLogCreateInput & TTransients>[]): PromiseLike<AIDecisionLog[]>;
    createList(count: number, item?: Partial<Prisma.AIDecisionLogCreateInput & TTransients>): PromiseLike<AIDecisionLog[]>;
    createForConnect(inputData?: Partial<Prisma.AIDecisionLogCreateInput & TTransients>): PromiseLike<Pick<AIDecisionLog, "id">>;
}

export interface AIDecisionLogFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AIDecisionLogFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AIDecisionLogFactoryInterfaceWithoutTraits<TTransients>;
}

function autoGenerateAIDecisionLogScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AIDecisionLogScalarOrEnumFields {
    return {
        decisionType: "BILL_EXTRACTION",
        inputHash: getScalarFieldValueGenerator().String({ modelName: "AIDecisionLog", fieldName: "inputHash", isId: false, isUnique: false, seq }),
        modelVersion: getScalarFieldValueGenerator().String({ modelName: "AIDecisionLog", fieldName: "modelVersion", isId: false, isUnique: false, seq }),
        routingResult: "AUTO_CREATED"
    };
}

function defineAIDecisionLogFactoryInternal<TTransients extends Record<string, unknown>, TOptions extends AIDecisionLogFactoryDefineOptions<TTransients>>({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }: TOptions, defaultTransientFieldValues: TTransients): AIDecisionLogFactoryInterface<TTransients, AIDecisionLogTraitKeys<TOptions>> {
    const getFactoryWithTraits = (traitKeys: readonly AIDecisionLogTraitKeys<TOptions>[] = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("AIDecisionLog", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData: Partial<Prisma.AIDecisionLogCreateInput & TTransients> = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAIDecisionLogScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver<AIDecisionLogFactoryDefineInput, BuildDataOptions<any>>(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver<Partial<AIDecisionLogFactoryDefineInput>, BuildDataOptions<TTransients>>(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                tenant: isAIDecisionLogtenantFactory(defaultData.tenant) ? {
                    create: await defaultData.tenant.build()
                } : defaultData.tenant,
                entity: isAIDecisionLogentityFactory(defaultData.entity) ? {
                    create: await defaultData.entity.build()
                } : defaultData.entity
            } as Prisma.AIDecisionLogCreateInput;
            const data: Prisma.AIDecisionLogCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AIDecisionLogCreateInput & TTransients>>(...args).map(data => build(data)));
        const pickForConnect = (inputData: AIDecisionLog) => ({
            id: inputData.id
        });
        const create = async (inputData: Partial<Prisma.AIDecisionLogCreateInput & TTransients> = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient<PrismaClient>().aIDecisionLog.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args: unknown[]) => Promise.all(normalizeList<Partial<Prisma.AIDecisionLogCreateInput & TTransients>>(...args).map(data => create(data)));
        const createForConnect = (inputData: Partial<Prisma.AIDecisionLogCreateInput & TTransients> = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "AIDecisionLog" as const,
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name: AIDecisionLogTraitKeys<TOptions>, ...names: readonly AIDecisionLogTraitKeys<TOptions>[]) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}

interface AIDecisionLogFactoryBuilder {
    <TOptions extends AIDecisionLogFactoryDefineOptions>(options: TOptions): AIDecisionLogFactoryInterface<{}, AIDecisionLogTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AIDecisionLogTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AIDecisionLogFactoryDefineOptions<TTransients>>(options: TOptions) => AIDecisionLogFactoryInterface<TTransients, AIDecisionLogTraitKeys<TOptions>>;
}

/**
 * Define factory for {@link AIDecisionLog} model.
 *
 * @param options
 * @returns factory {@link AIDecisionLogFactoryInterface}
 */
export const defineAIDecisionLogFactory = (<TOptions extends AIDecisionLogFactoryDefineOptions>(options: TOptions): AIDecisionLogFactoryInterface<TOptions> => {
    return defineAIDecisionLogFactoryInternal(options, {});
}) as AIDecisionLogFactoryBuilder;

defineAIDecisionLogFactory.withTransientFields = defaultTransientFieldValues => options => defineAIDecisionLogFactoryInternal(options, defaultTransientFieldValues);
