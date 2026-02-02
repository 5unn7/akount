import { prisma } from '@akount/db';

export class AccountService {
    constructor(private tenantId: string) { }

    async listAccounts(filters: { entityId?: string; type?: string; isActive?: boolean } = {}) {
        // Query accounts with tenant isolation
        const { entityId, type, isActive } = filters;

        return prisma.account.findMany({
            where: {
                entity: {
                    tenantId: this.tenantId,
                    ...(entityId && { id: entityId }),
                },
                ...(type && { type: type as any }),
                ...(isActive !== undefined && { isActive }),
            },
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
        });
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
