'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface CursorContextValue {
  isTracking: boolean
  startTracking: () => void
  stopTracking: () => void
}

const CursorContext = createContext<CursorContextValue | null>(null)

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [trackingCount, setTrackingCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const listenerRef = useRef<((e: MouseEvent) => void) | null>(null)

  const isTracking = trackingCount > 0

  useEffect(() => {
    // Cleanup previous listener
    if (listenerRef.current) {
      window.removeEventListener('mousemove', listenerRef.current)
      listenerRef.current = null
    }

    if (!isTracking) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      // Clear CSS variables
      if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty('--cursor-x')
        document.documentElement.style.removeProperty('--cursor-y')
      }
      return
    }

    const updatePosition = (e: MouseEvent): void => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`)
          document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`)
        }
        rafRef.current = null
      })
    }

    listenerRef.current = updatePosition
    window.addEventListener('mousemove', updatePosition, { passive: true })

    return () => {
      if (listenerRef.current) {
        window.removeEventListener('mousemove', listenerRef.current)
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isTracking])

  const startTracking = () => setTrackingCount(c => c + 1)
  const stopTracking = () => setTrackingCount(c => Math.max(0, c - 1))

  return (
    <CursorContext.Provider value={{ isTracking, startTracking, stopTracking }}>
      {children}
    </CursorContext.Provider>
  )
}

export function useCursorTracking(enabled: boolean = true): boolean {
  const context = useContext(CursorContext)
  if (!context) {
    throw new Error('useCursorTracking must be used within CursorProvider')
  }

  useEffect(() => {
    if (enabled) {
      context.startTracking()
      return () => context.stopTracking()
    }
  }, [enabled, context])

  return context.isTracking
}
