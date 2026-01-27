import { useState, useRef, useEffect } from 'react'

export function useSpotlight() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const spotlightStyle = isHovering
    ? {
      background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(230, 137, 70, 0.25), transparent 35%)`,
    }
    : {}

  return { elementRef, spotlightStyle }
}
