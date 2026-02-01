'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useCursorTracking } from '@/components/providers/CursorProvider'

interface CardWithGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass'
}

export const CardWithGlow = React.forwardRef<HTMLDivElement, CardWithGlowProps>(
  ({ className, variant = 'glass', children, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)

    // Uses global cursor provider (single RAF loop)
    useCursorTracking(isHovered)

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border shadow glass",
          "relative overflow-hidden",
          "transition-all duration-300",
          "hover:-translate-y-2 hover:shadow-lg",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Cursor glow effect */}
        {isHovered && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: '200px',
              height: '200px',
              left: 'var(--cursor-x)',
              top: 'var(--cursor-y)',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, hsla(25, 95%, 53%, 0.15), transparent 70%)',
              transition: 'opacity 300ms ease',
            }}
          />
        )}
        {children}
      </div>
    )
  }
)
CardWithGlow.displayName = 'CardWithGlow'
