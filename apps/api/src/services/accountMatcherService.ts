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

    // Match account name with institution (medium confidence)
    const normalizedAccountName = normalizeInstitutionName(account.name);
    const normalizedBankInstitution = normalizeInstitutionName(externalAccountData.institutionId);

    if (normalizedAccountName.includes(normalizedBankInstitution) ||
        normalizedBankInstitution.includes(normalizedAccountName)) {
      score += 20;
      reasons.push('Account name matches institution');
    }

    // Match account type based on account name keywords (low confidence)
    const accountNameLower = account.name.toLowerCase();
    if (
      (externalAccountData.type === 'checking' && (accountNameLower.includes('checking') || accountNameLower.includes('chequing'))) ||
      (externalAccountData.type === 'savings' && accountNameLower.includes('savings')) ||
      (externalAccountData.type === 'credit' && (accountNameLower.includes('credit') || accountNameLower.includes('visa') || accountNameLower.includes('mastercard')))
    ) {
      score += 15;
      reasons.push('Account type match');
    }

    // Match last 4 digits if present in account name (high confidence)
    if (externalAccountData.mask && account.name.includes(externalAccountData.mask)) {
      score += 35;
      reasons.push(`Account number match (last 4: ${externalAccountData.mask})`);
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
