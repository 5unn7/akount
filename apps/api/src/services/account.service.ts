import { prisma } from '@akount/db';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Types for pagination
export interface ListAccountsParams {
    entityId?: string;
    type?: string;
    isActive?: boolean;
    cursor?: string;
    limit?: number;
}

export interface PaginatedAccounts {
    accounts: Awaited<ReturnType<typeof prisma.account.findMany>>;
    nextCursor?: string;
    hasMore: boolean;
}

export class AccountService {
    constructor(private tenantId: string) { }

    async listAccounts(params: ListAccountsParams = {}): Promise<PaginatedAccounts> {
        const { entityId, type, isActive, cursor } = params;

        // Ensure limit is within bounds
        const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

        // Build where clause with tenant isolation
        const where = {
            entity: {
                tenantId: this.tenantId,
                ...(entityId && { id: entityId }),
            },
            ...(type && { type: type as Parameters<typeof prisma.account.findMany>[0] extends { where?: { type?: infer T } } ? T : never }),
            ...(isActive !== undefined && { isActive }),
            deletedAt: null, // Soft delete filter
        };

        // Fetch one extra to determine if there are more results
        const accounts = await prisma.account.findMany({
            where,
            include: {
                entity: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1, // Skip the cursor record itself
            }),
        });

        // Check if there are more results
        const hasMore = accounts.length > limit;

        // Return only the requested number of results
        const data = hasMore ? accounts.slice(0, limit) : accounts;

        return {
            accounts: data,
            nextCursor: hasMore ? data[data.length - 1].id : undefined,
            hasMore,
        };
    }

    async getAccount(id: string) {
        return prisma.account.findFirst({
            where: {
                id,
                entity: {
                    tenantId: this.tenantId,
                },
            },
            include: {
                entity: true,
            },
        });
    }
}
