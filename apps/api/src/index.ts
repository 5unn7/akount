import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { prisma } from '@akount/db';
import { env } from './lib/env';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { csrfProtection, getCsrfToken } from './middleware/csrf';
// Validation middleware available for routes (removed debug endpoints for security)
import { HealthService } from './domains/system/services/health.service';
import { UserService, UserNotFoundError } from './domains/system/services/user.service';

// Domain routes (Phase 4 restructure)
import { overviewRoutes } from './domains/overview';
import { bankingRoutes } from './domains/banking';
import { businessRoutes } from './domains/business';
import { accountingRoutes } from './domains/accounting';
import { planningRoutes } from './domains/planning';
import { aiRoutes } from './domains/ai';
import { servicesRoutes } from './domains/services';
import { systemRoutes } from './domains/system';
import { reportCache } from './domains/accounting/services/report-cache';
import { InsightGeneratorService } from './domains/ai/services/insight-generator.service';

let insightTimer: ReturnType<typeof setInterval> | undefined;

const server: FastifyInstance = Fastify({
    logger: true,
    // Trust proxy headers (X-Forwarded-For) for correct client IP behind reverse proxy
    // Required for rate limiting to work correctly in production
    trustProxy: true,
});

// Initialize services
const healthService = new HealthService();
const userService = new UserService();

// Register error handler
server.setErrorHandler(errorHandler);

// Rate limiting - Protect against brute force and API abuse
server.register(rateLimit, {
    max: 100, // 100 requests per minute
    timeWindow: '1 minute',
    keyGenerator: (request) => {
        // Rate limit by authenticated user ID if available, otherwise by IP
        return request.userId || request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.round(Number(context.after) / 1000)} seconds.`,
        statusCode: 429,
        retryAfter: String(context.after),
    }),
    addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
    },
    allowList: (request) => {
        // Don't rate limit health check endpoints
        return request.url === '/' || request.url === '/health';
    },
});

// Security headers - Protection against common attacks
server.register(helmet, {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for API responses
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny', // Prevent clickjacking
    },
    xssFilter: true, // Enable XSS filter
    noSniff: true, // Prevent MIME-sniffing
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
});

// CORS configuration - environment-based origin whitelist
const ALLOWED_ORIGINS = env.CORS_ORIGINS.split(',');

// SEC-41: Development whitelist instead of wildcard (security best practice)
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

server.register(cors, {
    origin: env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : DEV_ORIGINS,
    credentials: true,
});

// Multipart/form-data support for file uploads
server.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 1, // Only allow 1 file at a time for now (phase 1)
    },
});

// SEC-40: CSRF protection for state-changing endpoints
// Protects POST/PUT/PATCH/DELETE from Cross-Site Request Forgery
server.register(csrfProtection);

// CSRF token endpoint - Client fetches token before making state-changing requests
server.get('/api/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = getCsrfToken(request);
    return reply.status(200).send({ token });
});

// Register domain routes with prefixes (Phase 4 restructure)
server.register(overviewRoutes, { prefix: '/api/overview' });
server.register(bankingRoutes, { prefix: '/api/banking' });
server.register(businessRoutes, { prefix: '/api/business' });
server.register(accountingRoutes, { prefix: '/api/accounting' });
server.register(planningRoutes, { prefix: '/api/planning' });
server.register(aiRoutes, { prefix: '/api/ai' });
server.register(servicesRoutes, { prefix: '/api/services' });
server.register(systemRoutes, { prefix: '/api/system' });

// Define response types for type safety
type HealthCheckResponse = {
    status: 'ok' | 'error';
    timestamp: string;
};

type AuthTestResponse = {
    authenticated: true;
    userId: string;
    message: string;
};

type UserNotFoundResponse = {
    error: 'User not found';
    message: string;
};

type InternalServerError = {
    error: 'Internal Server Error';
    message: string;
};

type UserMeResponse = {
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


// Health check endpoint - minimal, fast, no sensitive data
server.get<{ Reply: HealthCheckResponse }>(
    '/health',
    async (request: FastifyRequest, reply: FastifyReply): Promise<HealthCheckResponse> => {
        try {
            const healthStatus = await healthService.getHealthStatus();

            if (healthStatus.status === 'error') {
                return reply.status(503).send(healthStatus);
            }

            return healthStatus;
        } catch (error) {
            // Type-safe error handling
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            server.log.error({
                msg: 'Health check error',
                error: errorMessage,
                // Only include stack trace in development
                ...(env.NODE_ENV === 'development' &&
                    error instanceof Error &&
                    { stack: error.stack }
                ),
            });

            return reply.status(503).send({
                status: 'error',
                timestamp: new Date().toISOString(),
            });
        }
    }
);

// Root endpoint redirects to health for convenience
server.get('/', async (request, reply) => {
    return reply.redirect('/health');
});

// Simple auth test endpoint - just verifies token is valid
server.get<{ Reply: AuthTestResponse }>(
    '/auth/test',
    {
        onRequest: [authMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<AuthTestResponse> => {
        return {
            authenticated: true,
            userId: request.userId as string,
            message: 'Authentication successful!',
        };
    }
);

// Protected endpoint - requires authentication
server.get<{ Reply: UserMeResponse | UserNotFoundResponse | InternalServerError }>(
    '/me',
    {
        onRequest: [authMiddleware]
    },
    async (
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<UserMeResponse | UserNotFoundResponse | InternalServerError> => {
        try {
            const user = await userService.getUserByClerkId(request.userId as string);
            return user;
        } catch (error) {
            if (error instanceof UserNotFoundError) {
                return reply.status(404).send({
                    error: 'User not found',
                    message: 'User exists in Clerk but not in database. Please sync user.',
                });
            }

            request.log.error({ error }, 'Error fetching user');
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to fetch user data',
            });
        }
    }
);

// Graceful shutdown handler
const gracefulShutdown = async () => {
    server.log.info('Shutting down gracefully...');
    try {
        await server.close();
        if (insightTimer) clearInterval(insightTimer);
        reportCache.destroy(); // Cleanup report cache
        await prisma.$disconnect();
        server.log.info('✓ Server and database connections closed gracefully');
        process.exit(0);
    } catch (error) {
        server.log.error(
            error instanceof Error ? error : new Error('Unknown shutdown error'),
            'Error during shutdown'
        );
        process.exit(1);
    }
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/** Start scheduled insight generation (if INSIGHT_GENERATION_INTERVAL_MS > 0) */
function startInsightTimer(): void {
    const intervalMs = env.INSIGHT_GENERATION_INTERVAL_MS;
    if (!intervalMs || intervalMs <= 0) return;

    server.log.info(
        { intervalMs, intervalMin: Math.round(intervalMs / 60000) },
        'Starting scheduled insight generation timer'
    );

    insightTimer = setInterval(async () => {
        try {
            const entities = await prisma.entity.findMany({
                select: { id: true, tenantId: true },
            });

            let totalInsights = 0;
            for (const entity of entities) {
                const generator = new InsightGeneratorService(entity.tenantId, 'system', entity.id);
                const summary = await generator.generateAll();
                totalInsights += summary.generated;
            }

            server.log.info(
                { entityCount: entities.length, insightCount: totalInsights },
                'Scheduled insight generation complete'
            );
        } catch (error) {
            server.log.error(error, 'Scheduled insight generation failed');
        }
    }, intervalMs);

    // Don't keep process alive just for this timer
    insightTimer.unref();
}

const start = async () => {
    try {
        await server.listen({ port: env.PORT, host: env.HOST });
        server.log.info(`✓ Server listening on ${env.HOST}:${env.PORT}`);

        // Start optional background insight generation
        startInsightTimer();
    } catch (err) {
        server.log.error(err);
        await prisma.$disconnect();
        process.exit(1);
    }
};

start();
