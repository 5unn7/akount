import { prisma } from '@akount/db';
import type { Account, BankConnection, ImportBatch } from '@prisma/client';
import { normalizeInstitutionName } from './parserService';

/**
 * Account Matcher Service
 *
 * Enables seamless transition from manual CSV imports to live bank feeds
 * by matching incoming bank connections to existing accounts based on
 * external identifiers stored in ImportBatch metadata.
 *
 * This ensures stable account linkage when users connect Plaid/Flinks later.
 */

export interface ExternalAccountData {
  accountId: string; // Plaid account_id or Flinks account number
  mask: string; // Last 4 digits (e.g., "1234")
  institutionId: string; // Plaid institution_id or Flinks institution ID
  type: string; // checking, savings, credit
  currency: string; // ISO 4217 currency code
}

export interface AccountMatchResult {
  account: Account | null;
  confidence: number; // 0-100
  reason: string;
}

/**
 * Matches an incoming bank connection to an existing Account based on external identifiers
 */
export async function matchAccountToBankConnection(
  entityId: string,
  bankConnection: BankConnection,
  externalAccountData: ExternalAccountData
): Promise<AccountMatchResult> {
  // Query existing Accounts for this Entity
  const candidates = await prisma.account.findMany({
    where: { entityId },
    include: {
      transactions: {
        include: {
          importBatch: true,
        },
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (candidates.length === 0) {
    return {
      account: null,
      confidence: 0,
      reason: 'No existing accounts found for this entity',
    };
  }

  // Score each candidate account
  let bestMatch: { account: Account; score: number; reasons: string[] } | null = null;

  for (const account of candidates) {
    let score = 0;
    const reasons: string[] = [];

    // Match currency (required)
    if (account.currency === externalAccountData.currency) {
      score += 30;
      reasons.push('Currency match');
    } else {
      continue; // Skip if currency doesn't match
    }

    // Check import batch metadata for external identifiers
    const importBatch = account.transactions[0]?.importBatch;
    if (importBatch?.metadata) {
      const metadata = importBatch.metadata as any;
      const externalData = metadata.externalAccountData || {};

      // Match masked account number (high confidence)
      if (externalData.externalAccountId?.endsWith(externalAccountData.mask)) {
        score += 40;
        reasons.push(`Account number match (last 4: ${externalAccountData.mask})`);
      }

      // Match institution name (medium confidence)
      if (externalData.institutionName) {
        const normalizedImportInstitution = normalizeInstitutionName(externalData.institutionName);
        const normalizedBankInstitution = normalizeInstitutionName(externalAccountData.institutionId);

        if (normalizedImportInstitution === normalizedBankInstitution) {
          score += 20;
          reasons.push('Institution match');
        } else if (normalizedImportInstitution.includes(normalizedBankInstitution) ||
                   normalizedBankInstitution.includes(normalizedImportInstitution)) {
          score += 10;
          reasons.push('Institution partial match');
        }
      }

      // Match account type (low confidence)
      if (externalData.accountType === externalAccountData.type) {
        score += 10;
        reasons.push('Account type match');
      }
    }

    // Update best match if this score is higher
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { account, score, reasons };
    }
  }

  if (!bestMatch) {
    return {
      account: null,
      confidence: 0,
      reason: 'No matching account found',
    };
  }

  // High confidence match (score ≥80): Auto-link
  // Medium confidence (50-79): Suggest to user
  // Low confidence (<50): Don't suggest
  return {
    account: bestMatch.account,
    confidence: bestMatch.score,
    reason: bestMatch.reasons.join(', '),
  };
}

/**
 * Find potential duplicate accounts in same entity (for manual review)
 */
export async function findDuplicateAccounts(
  entityId: string,
  newAccountData: {
    currency: string;
    type?: string;
    name?: string;
  }
): Promise<Account[]> {
  const candidates = await prisma.account.findMany({
    where: {
      entityId,
      currency: newAccountData.currency,
      isActive: true,
    },
  });

  // Filter by type if provided
  if (newAccountData.type) {
    return candidates.filter(a => a.type.toLowerCase() === newAccountData.type?.toLowerCase());
  }

  return candidates;
}
