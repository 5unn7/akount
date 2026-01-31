import { prisma } from '@akount/db';

/**
 * User not found error
 */
export class UserNotFoundError extends Error {
    constructor(clerkUserId: string) {
        super(`User with Clerk ID ${clerkUserId} not found in database`);
        this.name = 'UserNotFoundError';
    }
}

/**
 * User data transfer object
 */
export type UserDTO = {
    id: string;
    clerkUserId: string;
    email: string;
    name: string | null;
    tenants: Array<{
        id: string;
        name: string;
        role: string;
    }>;
};

/**
 * User Service
 *
 * Handles user-related business logic including fetching user data
 * and managing user-tenant relationships.
 */
export class UserService {
    /**
     * Get user by Clerk user ID
     *
     * Fetches user from database including their tenant memberships.
     *
     * @param {string} clerkUserId - Clerk user ID
     * @returns {Promise<UserDTO>} User data with tenant memberships
     * @throws {UserNotFoundError} If user not found in database
     */
    async getUserByClerkId(clerkUserId: string): Promise<UserDTO> {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: {
                tenantUsers: {
                    include: {
                        tenant: true
                    }
                }
            }
        });

        if (!user) {
            throw new UserNotFoundError(clerkUserId);
        }

        return {
            id: user.id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            name: user.name,
            tenants: user.tenantUsers.map(tu => ({
                id: tu.tenant.id,
                name: tu.tenant.name,
                role: tu.role,
            })),
        };
    }

    /**
     * Check if user exists in database
     *
     * @param {string} clerkUserId - Clerk user ID
     * @returns {Promise<boolean>} True if user exists
     */
    async userExists(clerkUserId: string): Promise<boolean> {
        const count = await prisma.user.count({
            where: { clerkUserId }
        });

        return count > 0;
    }
}
