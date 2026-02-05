import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @example
 * cn('px-2 py-1', 'px-4') // → 'py-1 px-4' (px-4 wins)
 * cn('text-red-500', condition && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
