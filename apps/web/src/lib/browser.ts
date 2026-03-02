/**
 * Type-safe check for browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Safely check user motion preference
 */
export function prefersReducedMotion(): boolean {
  if (!isBrowser()) return false

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
