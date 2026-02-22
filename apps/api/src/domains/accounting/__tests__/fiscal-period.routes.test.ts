import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { fiscalPeriodRoutes } from '../routes/fiscal-period';
import { AccountingError } from '../errors';

// Mock middleware
vi.mock('../../../middleware/auth', () => ({
    authMiddleware: vi.fn(async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        request.userId = 'test-user-id';
    }),
}));

vi.mock('../../../middleware/tenant', () => ({
    tenantMiddleware: vi.fn(async (request) => {
        request.tenantId = 'tenant-abc-123';
        request.tenantRole = 'OWNER';
    }),
}));

vi.mock('../../../middleware/rbac', () => ({
    withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/validation', () => ({
    validateQuery: vi.fn(() => async () => {}),
    validateParams: vi.fn(() => async () => {}),
    validateBody: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/withPermission', () => ({
    withPermission: vi.fn(() => ({
        preHandler: async (request: Record<string, unknown>) => {
            request.userId = 'test-user-id';
            request.tenantId = 'tenant-abc-123';
            request.tenantRole = 'OWNER';
        },
    })),
}));

// Mock FiscalPeriodService
const mockListCalendars = vi.fn();
const mockGetCalendar = vi.fn();
const mockCreateCalendar = vi.fn();
const mockLockPeriod = vi.fn();
const mockClosePeriod = vi.fn();
const mockReopenPeriod = vi.fn();

vi.mock('../services/fiscal-period.service', () => ({
    FiscalPeriodService: function (this: Record<string, unknown>) {
        this.listCalendars = mockListCalendars;
        this.getCalendar = mockGetCalendar;
        this.createCalendar = mockCreateCalendar;
        this.lockPeriod = mockLockPeriod;
        this.closePeriod = mockClosePeriod;
        this.reopenPeriod = mockReopenPeriod;
    },
}));

const MOCK_PERIOD = {
    id: 'period-1',
    fiscalCalendarId: 'cal-1',
    periodNumber: 1,
    name: 'January 2026',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-31T00:00:00.000Z',
    status: 'OPEN',
};

const MOCK_CALENDAR = {
    id: 'cal-1',
    entityId: 'entity-1',
    year: 2026,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    periods: [MOCK_PERIOD],
};

describe('FiscalPeriod Routes', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockListCalendars.mockResolvedValue([MOCK_CALENDAR]);
        mockGetCalendar.mockResolvedValue(MOCK_CALENDAR);
        mockCreateCalendar.mockResolvedValue(MOCK_CALENDAR);
        mockLockPeriod.mockResolvedValue({ ...MOCK_PERIOD, status: 'LOCKED' });
        mockClosePeriod.mockResolvedValue({ ...MOCK_PERIOD, status: 'CLOSED' });
        mockReopenPeriod.mockResolvedValue({ ...MOCK_PERIOD, status: 'OPEN' });

        app = Fastify({ logger: false });
        await app.register(fiscalPeriodRoutes, { prefix: '/fiscal-periods' });
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    // ============================================================================
    // GET /fiscal-periods
    // ============================================================================

    describe('GET /fiscal-periods', () => {
        it('should return list of calendars', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/fiscal-periods?entityId=entity-1',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body).toEqual([MOCK_CALENDAR]);
            expect(mockListCalendars).toHaveBeenCalled();
        });

        it('should return empty array when no calendars exist', async () => {
            mockListCalendars.mockResolvedValue([]);

            const response = await app.inject({
                method: 'GET',
                url: '/fiscal-periods?entityId=entity-1',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual([]);
        });
    });

    // ============================================================================
    // GET /fiscal-periods/:id
    // ============================================================================

    describe('GET /fiscal-periods/:id', () => {
        it('should return calendar with periods', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/fiscal-periods/cal-1',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body).toEqual(MOCK_CALENDAR);
        });

        it('should return 404 for non-existent calendar', async () => {
            mockGetCalendar.mockRejectedValue(
                new AccountingError('Fiscal calendar not found', 'CALENDAR_NOT_FOUND', 404)
            );

            const response = await app.inject({
                method: 'GET',
                url: '/fiscal-periods/nonexistent',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(404);
            expect(response.json().error).toBe('CALENDAR_NOT_FOUND');
        });
    });

    // ============================================================================
    // POST /fiscal-periods
    // ============================================================================

    describe('POST /fiscal-periods', () => {
        it('should create calendar and return 201', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods',
                headers: { authorization: 'Bearer test-token' },
                payload: { entityId: 'entity-1', year: 2026, startMonth: 1 },
            });

            expect(response.statusCode).toBe(201);
            expect(response.json()).toEqual(MOCK_CALENDAR);
            expect(mockCreateCalendar).toHaveBeenCalled();
        });

        it('should return 409 for duplicate year', async () => {
            mockCreateCalendar.mockRejectedValue(
                new AccountingError(
                    'Fiscal calendar for year 2026 already exists',
                    'DUPLICATE_CALENDAR_YEAR',
                    409
                )
            );

            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods',
                headers: { authorization: 'Bearer test-token' },
                payload: { entityId: 'entity-1', year: 2026, startMonth: 1 },
            });

            expect(response.statusCode).toBe(409);
            expect(response.json().error).toBe('DUPLICATE_CALENDAR_YEAR');
        });

        it('should return 403 for invalid entity', async () => {
            mockCreateCalendar.mockRejectedValue(
                new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403)
            );

            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods',
                headers: { authorization: 'Bearer test-token' },
                payload: { entityId: 'foreign-entity', year: 2026, startMonth: 1 },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    // ============================================================================
    // POST /fiscal-periods/periods/:id/lock
    // ============================================================================

    describe('POST /fiscal-periods/periods/:id/lock', () => {
        it('should lock a period', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/period-1/lock',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json().status).toBe('LOCKED');
            expect(mockLockPeriod).toHaveBeenCalledWith('period-1');
        });

        it('should return 400 for already locked period', async () => {
            mockLockPeriod.mockRejectedValue(
                new AccountingError('Period is already locked', 'PERIOD_ALREADY_LOCKED', 400)
            );

            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/period-1/lock',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('PERIOD_ALREADY_LOCKED');
        });

        it('should return 404 for non-existent period', async () => {
            mockLockPeriod.mockRejectedValue(
                new AccountingError('Fiscal period not found', 'PERIOD_NOT_FOUND', 404)
            );

            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/nonexistent/lock',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    // ============================================================================
    // POST /fiscal-periods/periods/:id/close
    // ============================================================================

    describe('POST /fiscal-periods/periods/:id/close', () => {
        it('should close a period', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/period-1/close',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json().status).toBe('CLOSED');
            expect(mockClosePeriod).toHaveBeenCalledWith('period-1');
        });

        it('should return 400 when prior periods are not closed', async () => {
            mockClosePeriod.mockRejectedValue(
                new AccountingError(
                    'All prior periods must be closed first',
                    'PREVIOUS_PERIODS_NOT_CLOSED',
                    400
                )
            );

            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/period-1/close',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('PREVIOUS_PERIODS_NOT_CLOSED');
        });

        it('should return 400 when period is not locked', async () => {
            mockClosePeriod.mockRejectedValue(
                new AccountingError(
                    'Period must be locked before closing',
                    'PERIOD_NOT_LOCKED',
                    400
                )
            );

            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/period-1/close',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('PERIOD_NOT_LOCKED');
        });
    });

    // ============================================================================
    // POST /fiscal-periods/periods/:id/reopen
    // ============================================================================

    describe('POST /fiscal-periods/periods/:id/reopen', () => {
        it('should reopen a period', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/period-1/reopen',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json().status).toBe('OPEN');
            expect(mockReopenPeriod).toHaveBeenCalledWith('period-1');
        });

        it('should return 400 when period is already open', async () => {
            mockReopenPeriod.mockRejectedValue(
                new AccountingError('Period is already open', 'PERIOD_NOT_CLOSED', 400)
            );

            const response = await app.inject({
                method: 'POST',
                url: '/fiscal-periods/periods/period-1/reopen',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('PERIOD_NOT_CLOSED');
        });
    });

    // ============================================================================
    // Error Handling
    // ============================================================================

    describe('error handling', () => {
        it('should map AccountingError to proper HTTP response', async () => {
            mockListCalendars.mockRejectedValue(
                new AccountingError('Test error', 'ENTITY_NOT_FOUND', 403, { detail: 'info' })
            );

            const response = await app.inject({
                method: 'GET',
                url: '/fiscal-periods?entityId=entity-1',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(403);
            const body = response.json();
            expect(body.error).toBe('ENTITY_NOT_FOUND');
            expect(body.message).toBe('Test error');
            expect(body.details).toEqual({ detail: 'info' });
        });

        it('should re-throw non-AccountingError errors', async () => {
            mockListCalendars.mockRejectedValue(new Error('Database connection failed'));

            const response = await app.inject({
                method: 'GET',
                url: '/fiscal-periods?entityId=entity-1',
                headers: { authorization: 'Bearer test-token' },
            });

            expect(response.statusCode).toBe(500);
        });
    });
});
