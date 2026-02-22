import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FiscalPeriodService } from '../services/fiscal-period.service';
import { AccountingError } from '../errors';
import { TENANT_ID, USER_ID, ENTITY_ID, mockEntity } from './helpers';

// Mock Prisma
const mockTransaction = vi.fn();
vi.mock('@akount/db', () => ({
    prisma: {
        entity: { findFirst: vi.fn() },
        fiscalCalendar: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
        },
        fiscalPeriod: {
            findFirst: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        $transaction: (...args: unknown[]) => mockTransaction(...args),
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
const mockCalendarFindMany = prisma.fiscalCalendar.findMany as ReturnType<typeof vi.fn>;
const mockCalendarFindFirst = prisma.fiscalCalendar.findFirst as ReturnType<typeof vi.fn>;
const mockPeriodFindFirst = prisma.fiscalPeriod.findFirst as ReturnType<typeof vi.fn>;
const mockPeriodUpdate = prisma.fiscalPeriod.update as ReturnType<typeof vi.fn>;
const mockPeriodCount = prisma.fiscalPeriod.count as ReturnType<typeof vi.fn>;

// ============================================================================
// Mock Data
// ============================================================================

function mockCalendar(overrides: Record<string, unknown> = {}) {
    return {
        id: 'cal-1',
        entityId: ENTITY_ID,
        year: 2026,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        periods: [
            mockPeriod({ periodNumber: 1, name: 'January 2026' }),
            mockPeriod({ periodNumber: 2, name: 'February 2026', id: 'period-2' }),
            mockPeriod({ periodNumber: 3, name: 'March 2026', id: 'period-3' }),
        ],
        ...overrides,
    };
}

function mockPeriod(overrides: Record<string, unknown> = {}) {
    return {
        id: 'period-1',
        fiscalCalendarId: 'cal-1',
        periodNumber: 1,
        name: 'January 2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        status: 'OPEN',
        ...overrides,
    };
}

function mockPeriodWithCalendar(overrides: Record<string, unknown> = {}) {
    return {
        ...mockPeriod(overrides),
        fiscalCalendar: { entityId: ENTITY_ID },
    };
}

describe('FiscalPeriodService', () => {
    let service: FiscalPeriodService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new FiscalPeriodService(TENANT_ID, USER_ID);
        mockEntityFind.mockResolvedValue(mockEntity());
    });

    // ============================================================================
    // listCalendars
    // ============================================================================

    describe('listCalendars', () => {
        it('should list calendars for entity with tenant filter', async () => {
            const calendars = [mockCalendar()];
            mockCalendarFindMany.mockResolvedValue(calendars);

            const result = await service.listCalendars({ entityId: ENTITY_ID });

            expect(result).toEqual(calendars);
            expect(mockCalendarFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        entityId: ENTITY_ID,
                        entity: { tenantId: TENANT_ID },
                    },
                    orderBy: { year: 'desc' },
                })
            );
        });

        it('should return empty array when no calendars exist', async () => {
            mockCalendarFindMany.mockResolvedValue([]);

            const result = await service.listCalendars({ entityId: ENTITY_ID });

            expect(result).toEqual([]);
        });
    });

    // ============================================================================
    // getCalendar
    // ============================================================================

    describe('getCalendar', () => {
        it('should return calendar with periods', async () => {
            const calendar = mockCalendar();
            mockCalendarFindFirst.mockResolvedValue(calendar);

            const result = await service.getCalendar('cal-1');

            expect(result).toEqual(calendar);
            expect(mockCalendarFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id: 'cal-1',
                        entity: { tenantId: TENANT_ID },
                    },
                })
            );
        });

        it('should throw CALENDAR_NOT_FOUND for missing calendar', async () => {
            mockCalendarFindFirst.mockResolvedValue(null);

            await expect(service.getCalendar('nonexistent')).rejects.toThrow(AccountingError);
            await expect(service.getCalendar('nonexistent')).rejects.toMatchObject({
                code: 'CALENDAR_NOT_FOUND',
                statusCode: 404,
            });
        });

        it('should reject cross-tenant access', async () => {
            mockCalendarFindFirst.mockResolvedValue(null);

            await expect(service.getCalendar('other-tenant-cal')).rejects.toThrow(AccountingError);
        });
    });

    // ============================================================================
    // createCalendar
    // ============================================================================

    describe('createCalendar', () => {
        const validInput = {
            entityId: ENTITY_ID,
            year: 2026,
            startMonth: 1,
        };

        it('should create calendar with 12 monthly periods', async () => {
            const createdCalendar = mockCalendar();
            mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                const tx = {
                    fiscalCalendar: {
                        create: vi.fn().mockResolvedValue({ id: 'cal-1' }),
                        findUnique: vi.fn().mockResolvedValue(createdCalendar),
                    },
                    fiscalPeriod: {
                        createMany: vi.fn().mockResolvedValue({ count: 12 }),
                    },
                };
                return fn(tx);
            });

            const result = await service.createCalendar(validInput);

            expect(result).toEqual(createdCalendar);
        });

        it('should validate entity ownership', async () => {
            mockEntityFind.mockResolvedValue(null);

            await expect(service.createCalendar(validInput)).rejects.toThrow(AccountingError);
            await expect(service.createCalendar(validInput)).rejects.toMatchObject({
                code: 'ENTITY_NOT_FOUND',
                statusCode: 403,
            });
        });

        it('should handle duplicate year error', async () => {
            mockTransaction.mockRejectedValue(
                new (Prisma.PrismaClientKnownRequestError as unknown as new (msg: string, opts: { code: string }) => Error)(
                    'Unique constraint failed',
                    { code: 'P2002' }
                )
            );

            await expect(service.createCalendar(validInput)).rejects.toThrow(AccountingError);
            await expect(service.createCalendar(validInput)).rejects.toMatchObject({
                code: 'DUPLICATE_CALENDAR_YEAR',
                statusCode: 409,
            });
        });

        it('should handle fiscal year starting in non-January month', async () => {
            const aprilInput = { entityId: ENTITY_ID, year: 2026, startMonth: 4 };
            const aprilCalendar = mockCalendar({
                startDate: new Date('2026-04-01'),
                endDate: new Date('2027-03-31'),
            });

            mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                const mockCreate = vi.fn();
                const tx = {
                    fiscalCalendar: {
                        create: mockCreate.mockResolvedValue({ id: 'cal-1' }),
                        findUnique: vi.fn().mockResolvedValue(aprilCalendar),
                    },
                    fiscalPeriod: {
                        createMany: vi.fn().mockResolvedValue({ count: 12 }),
                    },
                };
                const result = await fn(tx);

                // Verify the calendar was created with correct dates
                const createCall = mockCreate.mock.calls[0][0];
                expect(new Date(createCall.data.startDate).getUTCMonth()).toBe(3); // April = index 3
                expect(new Date(createCall.data.startDate).getUTCFullYear()).toBe(2026);

                return result;
            });

            const result = await service.createCalendar(aprilInput);
            expect(result).toEqual(aprilCalendar);
        });
    });

    // ============================================================================
    // lockPeriod
    // ============================================================================

    describe('lockPeriod', () => {
        it('should lock an OPEN period', async () => {
            const period = mockPeriodWithCalendar({ status: 'OPEN' });
            mockPeriodFindFirst.mockResolvedValue(period);

            const locked = mockPeriod({ status: 'LOCKED' });
            mockPeriodUpdate.mockResolvedValue(locked);

            const result = await service.lockPeriod('period-1');

            expect(result.status).toBe('LOCKED');
            expect(mockPeriodUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'period-1' },
                    data: { status: 'LOCKED' },
                })
            );
        });

        it('should reject locking an already locked period', async () => {
            const period = mockPeriodWithCalendar({ status: 'LOCKED' });
            mockPeriodFindFirst.mockResolvedValue(period);

            await expect(service.lockPeriod('period-1')).rejects.toMatchObject({
                code: 'PERIOD_ALREADY_LOCKED',
                statusCode: 400,
            });
        });

        it('should reject locking a closed period', async () => {
            const period = mockPeriodWithCalendar({ status: 'CLOSED' });
            mockPeriodFindFirst.mockResolvedValue(period);

            await expect(service.lockPeriod('period-1')).rejects.toMatchObject({
                code: 'CANNOT_LOCK_CLOSED_PERIOD',
                statusCode: 400,
            });
        });

        it('should throw PERIOD_NOT_FOUND for missing period', async () => {
            mockPeriodFindFirst.mockResolvedValue(null);

            await expect(service.lockPeriod('nonexistent')).rejects.toMatchObject({
                code: 'PERIOD_NOT_FOUND',
                statusCode: 404,
            });
        });
    });

    // ============================================================================
    // closePeriod
    // ============================================================================

    describe('closePeriod', () => {
        it('should close a LOCKED period', async () => {
            const period = mockPeriodWithCalendar({ status: 'LOCKED' });
            mockPeriodFindFirst.mockResolvedValue(period);
            mockPeriodCount.mockResolvedValue(0); // No prior unclosed periods

            const closed = mockPeriod({ status: 'CLOSED' });
            mockPeriodUpdate.mockResolvedValue(closed);

            const result = await service.closePeriod('period-1');

            expect(result.status).toBe('CLOSED');
            expect(mockPeriodUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'period-1' },
                    data: { status: 'CLOSED' },
                })
            );
        });

        it('should reject closing an already closed period', async () => {
            const period = mockPeriodWithCalendar({ status: 'CLOSED' });
            mockPeriodFindFirst.mockResolvedValue(period);

            await expect(service.closePeriod('period-1')).rejects.toMatchObject({
                code: 'PERIOD_ALREADY_CLOSED',
                statusCode: 400,
            });
        });

        it('should reject closing an OPEN period (must lock first)', async () => {
            const period = mockPeriodWithCalendar({ status: 'OPEN' });
            mockPeriodFindFirst.mockResolvedValue(period);

            await expect(service.closePeriod('period-1')).rejects.toMatchObject({
                code: 'PERIOD_NOT_LOCKED',
                statusCode: 400,
            });
        });

        it('should reject closing if prior periods are not closed', async () => {
            const period = mockPeriodWithCalendar({
                status: 'LOCKED',
                periodNumber: 3,
            });
            mockPeriodFindFirst.mockResolvedValue(period);
            mockPeriodCount.mockResolvedValue(2); // 2 prior periods not closed

            await expect(service.closePeriod('period-1')).rejects.toMatchObject({
                code: 'PREVIOUS_PERIODS_NOT_CLOSED',
                statusCode: 400,
            });
        });
    });

    // ============================================================================
    // reopenPeriod
    // ============================================================================

    describe('reopenPeriod', () => {
        it('should reopen a LOCKED period', async () => {
            const period = mockPeriodWithCalendar({ status: 'LOCKED' });
            mockPeriodFindFirst.mockResolvedValue(period);

            const reopened = mockPeriod({ status: 'OPEN' });
            mockPeriodUpdate.mockResolvedValue(reopened);

            const result = await service.reopenPeriod('period-1');

            expect(result.status).toBe('OPEN');
        });

        it('should reopen a CLOSED period', async () => {
            const period = mockPeriodWithCalendar({ status: 'CLOSED' });
            mockPeriodFindFirst.mockResolvedValue(period);

            const reopened = mockPeriod({ status: 'OPEN' });
            mockPeriodUpdate.mockResolvedValue(reopened);

            const result = await service.reopenPeriod('period-1');

            expect(result.status).toBe('OPEN');
        });

        it('should reject reopening an already OPEN period', async () => {
            const period = mockPeriodWithCalendar({ status: 'OPEN' });
            mockPeriodFindFirst.mockResolvedValue(period);

            await expect(service.reopenPeriod('period-1')).rejects.toMatchObject({
                code: 'PERIOD_NOT_CLOSED',
                statusCode: 400,
            });
        });
    });

    // ============================================================================
    // validatePeriodOpen
    // ============================================================================

    describe('validatePeriodOpen', () => {
        it('should allow posting when period is OPEN', async () => {
            mockPeriodFindFirst.mockResolvedValue({
                id: 'period-1',
                status: 'OPEN',
                name: 'January 2026',
            });

            // Should not throw
            await expect(
                service.validatePeriodOpen(ENTITY_ID, new Date('2026-01-15'))
            ).resolves.toBeUndefined();
        });

        it('should allow posting when no fiscal period exists', async () => {
            mockPeriodFindFirst.mockResolvedValue(null);

            // Graceful degradation — no calendar = allow
            await expect(
                service.validatePeriodOpen(ENTITY_ID, new Date('2026-01-15'))
            ).resolves.toBeUndefined();
        });

        it('should reject posting to LOCKED period', async () => {
            mockPeriodFindFirst.mockResolvedValue({
                id: 'period-1',
                status: 'LOCKED',
                name: 'January 2026',
            });

            await expect(
                service.validatePeriodOpen(ENTITY_ID, new Date('2026-01-15'))
            ).rejects.toMatchObject({
                code: 'FISCAL_PERIOD_CLOSED',
                statusCode: 400,
            });
        });

        it('should reject posting to CLOSED period', async () => {
            mockPeriodFindFirst.mockResolvedValue({
                id: 'period-1',
                status: 'CLOSED',
                name: 'January 2026',
            });

            await expect(
                service.validatePeriodOpen(ENTITY_ID, new Date('2026-01-15'))
            ).rejects.toMatchObject({
                code: 'FISCAL_PERIOD_CLOSED',
                statusCode: 400,
            });
        });
    });

    // ============================================================================
    // Tenant Isolation
    // ============================================================================

    describe('tenant isolation', () => {
        it('should include tenant filter in listCalendars', async () => {
            mockCalendarFindMany.mockResolvedValue([]);

            await service.listCalendars({ entityId: ENTITY_ID });

            const call = mockCalendarFindMany.mock.calls[0][0];
            expect(call.where.entity).toEqual({ tenantId: TENANT_ID });
        });

        it('should include tenant filter in getCalendar', async () => {
            mockCalendarFindFirst.mockResolvedValue(mockCalendar());

            await service.getCalendar('cal-1');

            const call = mockCalendarFindFirst.mock.calls[0][0];
            expect(call.where.entity).toEqual({ tenantId: TENANT_ID });
        });

        it('should validate entity ownership before creating', async () => {
            mockEntityFind.mockResolvedValue(null);

            await expect(
                service.createCalendar({
                    entityId: 'foreign-entity',
                    year: 2026,
                    startMonth: 1,
                })
            ).rejects.toMatchObject({
                code: 'ENTITY_NOT_FOUND',
                statusCode: 403,
            });
        });

        it('should include tenant filter in period actions', async () => {
            mockPeriodFindFirst.mockResolvedValue(null);

            await expect(service.lockPeriod('any-period')).rejects.toMatchObject({
                code: 'PERIOD_NOT_FOUND',
            });

            // Verify the tenant filter was included
            const call = mockPeriodFindFirst.mock.calls[0][0];
            expect(call.where.fiscalCalendar.entity).toEqual({ tenantId: TENANT_ID });
        });
    });
});
