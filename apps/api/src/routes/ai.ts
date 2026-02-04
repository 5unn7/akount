import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { aiService } from '../services/ai/aiService';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { validateBody } from '../middleware/validation';
import { categorizeTransaction } from '../services/categorizationService';

// Validation schemas
const chatBodySchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
        })
    ),
    options: z.object({
        provider: z.string().optional(),
        model: z.string().optional(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
        systemPrompt: z.string().optional(),
    }).optional(),
});

const categorizationBodySchema = z.object({
    description: z.string(),
    amount: z.number().int(), // Cents must be an integer
});

export async function aiRoutes(fastify: FastifyInstance) {
    // Chat endpoint
    fastify.post(
        '/ai/chat',
        {
            onRequest: [authMiddleware, tenantMiddleware, validateBody(chatBodySchema)],
        },
        async (request, reply) => {
            const { messages, options } = request.body as any;

            try {
                const response = await aiService.chat(messages, options);
                return response;
            } catch (error: any) {
                return reply.status(500).send({ error: error.message });
            }
        }
    );

    // Test categorization endpoint
    fastify.post(
        '/ai/test-categorization',
        {
            onRequest: [authMiddleware, tenantMiddleware, validateBody(categorizationBodySchema)],
        },
        async (request, reply) => {
            const { description, amount } = request.body as any;
            const tenantId = request.tenantId!; // Injected by tenantMiddleware

            try {
                const suggestion = await categorizeTransaction(description, amount, tenantId);
                return suggestion;
            } catch (error: any) {
                return reply.status(500).send({ error: error.message });
            }
        }
    );
}
