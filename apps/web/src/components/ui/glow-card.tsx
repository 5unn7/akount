'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, type cardVariants } from './card'
import type { VariantProps } from 'class-variance-authority'

interface GlowCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** CSS color for the radial glow. Defaults to primary amber. */
  glowColor?: string
}

/**
 * Card with a mouse-tracking radial glow effect.
 *
 * Renders a `<Card>` wrapped with the `glow-track` CSS utility.
 * The glow follows the cursor via CSS custom properties.
 *
 * @example
 * <GlowCard variant="glass">
 *   <CardContent>...</CardContent>
 * </GlowCard>
 *
 * @example Custom glow color
 * <GlowCard variant="glass" glowColor="rgba(139, 92, 246, 0.04)">
 *   <CardContent>AI Insight</CardContent>
 * </GlowCard>
 */
const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, glowColor, onMouseMove, style, variant, children, ...props }, ref) => {
    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        e.currentTarget.style.setProperty('--glow-x', `${x}%`)
        e.currentTarget.style.setProperty('--glow-y', `${y}%`)
        onMouseMove?.(e)
      },
      [onMouseMove],
    )

    const mergedStyle = glowColor
      ? { ...style, '--glow-color': glowColor } as React.CSSProperties
      : style

    return (
      <Card
        ref={ref}
        variant={variant}
        className={cn('glow-track transition-all duration-300', className)}
        onMouseMove={handleMouseMove}
        style={mergedStyle}
        {...props}
      >
        {children}
      </Card>
    )
  },
)
GlowCard.displayName = 'GlowCard'

export { GlowCard }
