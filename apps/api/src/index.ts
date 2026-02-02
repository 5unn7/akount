import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { prisma } from '@akount/db';
import { env } from './lib/env';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { validateBody, validateQuery } from './middleware/validation';
import { createTestDataSchema, testQuerySchema } from './schemas/common';
import { HealthService } from './services/health.service';
import { UserService, UserNotFoundError } from './services/user.service';
import { entitiesRoutes } from './routes/entities';
import { importRoutes } from './routes/import';
import { onboardingRoutes } from './routes/onboarding';
import { accountsRoutes } from './routes/accounts';
import { dashboardRoutes } from './routes/dashboard';
import { aiRoutes } from './routes/ai';

const server: FastifyInstance = Fastify({
    logger: true
});

// Initialize services
const healthService = new HealthService();
const userService = new UserService();

// Register error handler
server.setErrorHandler(errorHandler);

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

type ValidationSuccessResponse = {
    message: string;
    received: any;
};

type ValidationQueryResponse = {
    message: string;
    filters: any;
};

type DebugResponse = {
    body: any;
    bodyType: string;
    headers: any;
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
    return reply.redirect(302, '/health');
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

// Debug endpoint to check body parsing
server.post<{ Reply: DebugResponse }>(
    '/validation/debug',
    async (request: FastifyRequest, reply: FastifyReply): Promise<DebugResponse> => {
        return {
            body: request.body,
            bodyType: typeof request.body,
            headers: request.headers,
        };
    }
);

// Validation test endpoint - POST with body validation
server.post<{ Reply: ValidationSuccessResponse }>(
    '/validation/test',
    {
        preValidation: [validateBody(createTestDataSchema)]
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<ValidationSuccessResponse> => {
        const data = request.body as any;
        return {
            message: 'Validation successful!',
            received: data,
        };
    }
);

// Validation test endpoint - GET with query validation
server.get<{ Reply: ValidationQueryResponse }>(
    '/validation/query',
    {
        preValidation: [validateQuery(testQuerySchema)]
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<ValidationQueryResponse> => {
        const query = request.query as any;
        return {
            message: 'Query validation successful!',
            filters: query,
        };
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
