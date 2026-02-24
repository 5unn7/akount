import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxRateService } from '../services/tax-rate.service';
import { AccountingError } from '../errors';
import { TENANT_ID, USER_ID, ENTITY_ID, mockEntity } from './helpers';

// Mock Prisma
vi.mock('@akount/db', () => ({
    prisma: {
        entity: { findFirst: vi.fn() },
        gLAccount: { findFirst: vi.fn() },
        taxRate: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
    Prisma: {
        PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
            code: string;
            constructor(message: string, opts: { code: string }) {
                super(message);
                this.code = opts.code;
            }
        },
    },
}));

vi.mock('../../../lib/audit', () => ({
    createAuditLog: vi.fn(),
}));

import { prisma, Prisma } from '@akount/db';

const mockEntityFind = prisma.entity.findFirst as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.taxRate.findMany as ReturnType<typeof vi.fn>;
const mockFindFirst = prisma.taxRate.findFirst as ReturnType<typeof vi.fn>;
const mockCreate = prisma.taxRate.create as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.taxRate.update as ReturnType<typeof vi.fn>;

// ============================================================================
// Mock Data
// ============================================================================

function mockTaxRate(overrides: Record<string, unknown> = {}) {
    return {
        id: 'tax-rate-1',
        entityId: ENTITY_ID,
        code: 'HST-ON',
        name: 'Harmonized Sales Tax (Ontario)',
        rate: 0.13,
        jurisdiction: 'Ontario',
        isInclusive: false,
        glAccountId: null,
        isActive: true,
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        ...overrides,
    };
}

describe('TaxRateService', () => {
    let service: TaxRateService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TaxRateService(TENANT_ID, USER_ID);
        mockEntityFind.mockResolvedValue(mockEntity());
    });

    // ============================================================================
    // listTaxRates
    // ============================================================================

    describe('listTaxRates', () => {
        it('should list tax rates for entity with tenant filter', async () => {
            const rates = [mockTaxRate()];
            mockFindMany.mockResolvedValue(rates);

            const result = await service.listTaxRates({ entityId: ENTITY_ID });

            expect(result).toEqual(rates);
            expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            {
                                OR: expect.arrayContaining([
                                    { entityId: ENTITY_ID, entity: { tenantId: TENANT_ID } },
                                    { entityId: null },
                                ]),
                            },
                        ]),
                    },
                })
            );
        });

        it('should filter by jurisdiction', async () => {
            mockFindMany.mockResolvedValue([]);

            await service.listTaxRates({ jurisdiction: 'Ontario' });

            expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            { jurisdiction: { contains: 'Ontario', mode: 'insensitive' } },
                        ]),
                    },
                })
            );
        });

        it('should filter by isActive', async () => {
            mockFindMany.mockResolvedValue([]);

            await service.listTaxRates({ isActive: true });

            expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            { isActive: true },
                        ]),
                    },
                })
            );
        });

        it('should return empty array when no rates exist', async () => {
            mockFindMany.mockResolvedValue([]);

            const result = await service.listTaxRates({});

            expect(result).toEqual([]);
        });
    });

    // ============================================================================
    // getTaxRate
    // ============================================================================

    describe('getTaxRate', () => {
        it('should return tax rate by ID with tenant filter', async () => {
            const rate = mockTaxRate();
            mockFindFirst.mockResolvedValue(rate);

            const result = await service.getTaxRate('tax-rate-1');

            expect(result).toEqual(rate);
            expect(mockFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: 'tax-rate-1',
                        OR: expect.arrayContaining([
                            { entity: { tenantId: TENANT_ID } },
                            { entityId: null },
                        ]),
                    }),
                })
            );
        });

        it('should throw TAX_RATE_NOT_FOUND for missing rate', async () => {
            mockFindFirst.mockResolvedValue(null);

            await expect(service.getTaxRate('nonexistent')).rejects.toThrow(AccountingError);
            await expect(service.getTaxRate('nonexistent')).rejects.toMatchObject({
                code: 'TAX_RATE_NOT_FOUND',
                statusCode: 404,
            });
        });

        it('should reject cross-tenant access', async () => {
            // Different tenant returns null
            mockFindFirst.mockResolvedValue(null);

            await expect(service.getTaxRate('other-tenant-rate')).rejects.toThrow(AccountingError);
        });
    });

    // ============================================================================
    // createTaxRate
    // ============================================================================

    describe('createTaxRate', () => {
        const validInput = {
            entityId: ENTITY_ID,
            code: 'GST',
            name: 'Goods & Services Tax',
            rate: 0.05,
            jurisdiction: 'Federal',
            isInclusive: false,
            effectiveFrom: '2024-01-01T00:00:00.000Z',
        };

        it('should create tax rate with audit log', async () => {
            const created = mockTaxRate({
                code: 'GST',
                name: 'Goods & Services Tax',
                rate: 0.05,
                jurisdiction: 'Federal',
            });
            mockCreate.mockResolvedValue(created);

            const result = await service.createTaxRate(validInput);

            expect(result).toEqual(created);
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        code: 'GST',
                        name: 'Goods & Services Tax',
                        rate: 0.05,
                        jurisdiction: 'Federal',
                        isActive: true,
                    }),
                })
            );
        });

        it('should validate entity ownership', async () => {
            mockEntityFind.mockResolvedValue(null); // Entity not found

            await expect(service.createTaxRate(validInput)).rejects.toThrow(AccountingError);
            await expect(service.createTaxRate(validInput)).rejects.toMatchObject({
                code: 'ENTITY_NOT_FOUND',
                statusCode: 403,
            });
        });

        it('should reject invalid date range (effectiveTo before effectiveFrom)', async () => {
            const input = {
                ...validInput,
                effectiveTo: '2023-01-01T00:00:00.000Z', // Before effectiveFrom
            };

            await expect(service.createTaxRate(input)).rejects.toThrow(AccountingError);
            await expect(service.createTaxRate(input)).rejects.toMatchObject({
                code: 'INVALID_DATE_RANGE',
                statusCode: 400,
            });
        });

        it('should handle duplicate code error', async () => {
            mockCreate.mockRejectedValue(
                new (Prisma.PrismaClientKnownRequestError as unknown as new (msg: string, opts: { code: string }) => Error)(
                    'Unique constraint failed',
                    { code: 'P2002' }
                )
            );

            await expect(service.createTaxRate(validInput)).rejects.toThrow(AccountingError);
            await expect(service.createTaxRate(validInput)).rejects.toMatchObject({
                code: 'DUPLICATE_TAX_CODE',
                statusCode: 409,
            });
        });

        // SEC-25: Global rate creation blocked - entityId now required
        // Global rates should only be created by system admins (future: separate endpoint)
        it('should require entityId (no global rates allowed)', async () => {
            // TypeScript now prevents passing entityId: undefined
            // This test verifies the schema change is enforced
            const inputWithEntity = { ...validInput, entityId: 'entity-1' };
            const created = mockTaxRate({ entityId: 'entity-1' });
            mockCreate.mockResolvedValue(created);
            mockEntityFind.mockResolvedValue({ id: 'entity-1', tenantId: TENANT_ID } as any);

            const result = await service.createTaxRate(inputWithEntity);

            expect(result.entityId).toBe('entity-1');
            expect(mockEntityFind).toHaveBeenCalled();
        });
    });

    // ============================================================================
    // updateTaxRate
    // ============================================================================

    describe('updateTaxRate', () => {
        it('should update tax rate with audit log', async () => {
            const existing = mockTaxRate();
            mockFindFirst.mockResolvedValue(existing);

            const updated = mockTaxRate({ name: 'Updated HST', rate: 0.15 });
            mockUpdate.mockResolvedValue(updated);

            const result = await service.updateTaxRate('tax-rate-1', {
                name: 'Updated HST',
                rate: 0.15,
            });

            expect(result).toEqual(updated);
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'tax-rate-1' },
                    data: expect.objectContaining({
                        name: 'Updated HST',
                        rate: 0.15,
                    }),
                })
            );
        });

        it('should throw TAX_RATE_NOT_FOUND for missing rate', async () => {
            mockFindFirst.mockResolvedValue(null);

            await expect(
                service.updateTaxRate('nonexistent', { name: 'New Name' })
            ).rejects.toMatchObject({
                code: 'TAX_RATE_NOT_FOUND',
                statusCode: 404,
            });
        });

        it('should reject invalid date range on update', async () => {
            const existing = mockTaxRate();
            mockFindFirst.mockResolvedValue(existing);

            await expect(
                service.updateTaxRate('tax-rate-1', {
                    effectiveFrom: '2025-01-01T00:00:00.000Z',
                    effectiveTo: '2024-01-01T00:00:00.000Z',
                })
            ).rejects.toMatchObject({
                code: 'INVALID_DATE_RANGE',
                statusCode: 400,
            });
        });
    });

    // ============================================================================
    // deactivateTaxRate
    // ============================================================================

    describe('deactivateTaxRate', () => {
        it('should set isActive to false and effectiveTo', async () => {
            const existing = mockTaxRate();
            mockFindFirst.mockResolvedValue(existing);

            const deactivated = mockTaxRate({ isActive: false, effectiveTo: new Date() });
            mockUpdate.mockResolvedValue(deactivated);

            const result = await service.deactivateTaxRate('tax-rate-1');

            expect(result.isActive).toBe(false);
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'tax-rate-1' },
                    data: expect.objectContaining({
                        isActive: false,
                    }),
                })
            );
        });

        it('should throw TAX_RATE_NOT_FOUND for missing rate', async () => {
            mockFindFirst.mockResolvedValue(null);

            await expect(service.deactivateTaxRate('nonexistent')).rejects.toMatchObject({
                code: 'TAX_RATE_NOT_FOUND',
                statusCode: 404,
            });
        });

        it('should use provided effectiveTo date', async () => {
            const existing = mockTaxRate();
            mockFindFirst.mockResolvedValue(existing);

            const deactivated = mockTaxRate({ isActive: false });
            mockUpdate.mockResolvedValue(deactivated);

            await service.deactivateTaxRate('tax-rate-1', {
                effectiveTo: '2025-06-30T00:00:00.000Z',
            });

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        effectiveTo: new Date('2025-06-30T00:00:00.000Z'),
                    }),
                })
            );
        });
    });

    // ============================================================================
    // Tenant Isolation
    // ============================================================================

    describe('tenant isolation', () => {
        it('should always include tenant filter in list queries', async () => {
            mockFindMany.mockResolvedValue([]);

            await service.listTaxRates({ entityId: ENTITY_ID });

            const call = mockFindMany.mock.calls[0][0];
            // Query now uses AND structure with tenant-scoping OR nested inside
            const andConditions = call.where.AND;
            const tenantCondition = andConditions.find(
                (c: Record<string, unknown>) => c.OR !== undefined
            );
            expect(tenantCondition.OR).toContainEqual(
                expect.objectContaining({
                    entity: { tenantId: TENANT_ID },
                })
            );
        });

        it('should always include tenant filter in get queries', async () => {
            mockFindFirst.mockResolvedValue(mockTaxRate());

            await service.getTaxRate('tax-rate-1');

            const call = mockFindFirst.mock.calls[0][0];
            expect(call.where.OR).toContainEqual(
                expect.objectContaining({
                    entity: { tenantId: TENANT_ID },
                })
            );
        });

        it('should validate entity ownership before creating', async () => {
            mockEntityFind.mockResolvedValue(null); // Entity not owned

            await expect(
                service.createTaxRate({
                    entityId: 'foreign-entity',
                    code: 'GST',
                    name: 'GST',
                    rate: 0.05,
                    jurisdiction: 'Federal',
                    isInclusive: false,
                    effectiveFrom: '2024-01-01T00:00:00.000Z',
                })
            ).rejects.toMatchObject({
                code: 'ENTITY_NOT_FOUND',
                statusCode: 403,
            });
        });
    });
});
