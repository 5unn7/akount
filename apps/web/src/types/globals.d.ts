/**
 * Clerk Session Claims Type Declaration
 *
 * Maps the custom session token claim configured in Clerk Dashboard:
 *   { "metadata": "{{user.public_metadata}}" }
 *
 * This makes sessionClaims.metadata typed across middleware and server components.
 */
declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      tenantId?: string
      role?: string
      onboardingCompleted?: boolean
    }
  }
}

export {}
