import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '@clerk/backend'

/**
 * Authentication middleware for Fastify
 * Verifies Clerk JWT token from Authorization header using networkless verification
 * Populates request.userId with the authenticated user's ID
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  // Check for Authorization header
  if (!authHeader) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing Authorization header',
    })
  }

  // Verify Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <token>',
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Verify the JWT token using networkless verification (modern Clerk approach)
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })

    if (!payload || !payload.sub) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
    }

    // Attach userId to request for use in route handlers
    request.userId = payload.sub

    request.log.info({ userId: payload.sub }, 'User authenticated')
  } catch (error) {
    request.log.error({ error }, 'Authentication error')

    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Failed to verify token',
    })
  }
}

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't require it
 * Useful for endpoints that work differently for authenticated users
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without userId
    return
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })

    if (payload?.sub) {
      request.userId = payload.sub
      request.log.info({ userId: payload.sub }, 'User optionally authenticated')
    }
  } catch (error) {
    // Ignore errors for optional auth
    request.log.debug({ error }, 'Optional auth failed')
  }
}
