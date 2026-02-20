import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@akount/db'
import { logger } from '@/lib/logger'

/**
 * Clerk Webhook Handler
 *
 * Handles user.created events from Clerk to automatically sync users
 * to the Akount database when they sign up.
 *
 * This ensures users exist in the database before they access the app,
 * allowing the middleware to properly handle tenant creation redirects.
 */
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    logger.error('Webhook secret not configured', { service: 'clerk-webhook' })
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.error('Missing required webhook headers', {
      service: 'clerk-webhook',
      headers: { svix_id: !!svix_id, svix_timestamp: !!svix_timestamp, svix_signature: !!svix_signature }
    })
    return new Response('Missing required webhook headers', { status: 400 })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    logger.error('Invalid webhook signature', {
      service: 'clerk-webhook',
      error: err instanceof Error ? err.message : 'Unknown error'
    })
    return new Response('Invalid webhook signature', { status: 400 })
  }

  // Handle user.created event
  if (evt.type === 'user.created') {
    const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data

    if (!email_addresses || email_addresses.length === 0) {
      logger.error('No email address in user.created event', {
        service: 'clerk-webhook',
        eventType: 'user.created',
        clerkUserId
      })
      return new Response('No email address provided', { status: 400 })
    }

    const email = email_addresses[0].email_address
    const name = [first_name, last_name].filter(Boolean).join(' ') || null

    try {
      // Create user in database
      const user = await prisma.user.create({
        data: {
          clerkUserId,
          email,
          name,
        },
      })

      logger.info('User created successfully', {
        service: 'clerk-webhook',
        userId: user.id,
        email,
        clerkUserId
      })
      return new Response(JSON.stringify({ success: true, userId: user.id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      // Check if user already exists (race condition with simultaneous events)
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        logger.warn('User already exists', {
          service: 'clerk-webhook',
          email,
          clerkUserId
        })
        return new Response(
          JSON.stringify({ success: true, message: 'User already exists' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      logger.error('Error creating user in database', {
        service: 'clerk-webhook',
        email,
        clerkUserId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return new Response('Error processing webhook', { status: 500 })
    }
  }

  // Silently ignore other event types (user.updated, user.deleted, etc.)
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
