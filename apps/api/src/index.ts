import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { prisma } from '@akount/db';
import { env } from './lib/env';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
// Validation middleware available for routes (removed debug endpoints for security)
import { HealthService } from './services/health.service';
import { UserService, UserNotFoundError } from './services/user.service';
import { entitiesRoutes } from './routes/entities';
import { importRoutes } from './routes/import';
import { onboardingRoutes } from './routes/onboarding';
import { accountsRoutes } from './routes/accounts';
import { dashboardRoutes } from './routes/dashboard';
import { aiRoutes } from './routes/ai';

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

server.register(cors, {
    origin: env.NODE_ENV === 'production'
        ? ALLOWED_ORIGINS
        : true, // Allow all in development
    credentials: true,
});

// Multipart/form-data support for file uploads
server.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 1, // Only allow 1 file at a time for now (phase 1)
    },
});

// Register API routes
server.register(entitiesRoutes, { prefix: '/api' });
server.register(importRoutes, { prefix: '/api' });
server.register(onboardingRoutes, { prefix: '/api' });
server.register(accountsRoutes, { prefix: '/api' });
server.register(dashboardRoutes, { prefix: '/api' });
server.register(aiRoutes, { prefix: '/api' });

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

const start = async () => {
    try {
        await server.listen({ port: env.PORT, host: env.HOST });
        server.log.info(`✓ Server listening on ${env.HOST}:${env.PORT}`);
    } catch (err) {
        server.log.error(err);
        await prisma.$disconnect();
        process.exit(1);
    }
};

start();
