import { useEffect, useRef, useState } from 'react';

/**
 * Hook for scroll-triggered fade-in animations
 * @param threshold - Intersection threshold (0-1), default 0.3
 * @param triggerOnce - Whether to trigger only once, default true
 */
export function useScrollAnimation(threshold = 0.3, triggerOnce = true) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, isVisible };
}

/**
 * Preload critical fonts for landing page
 * Call this in the root layout or page component
 */
export function preloadFonts() {
  if (typeof document === 'undefined') return;

  // Fonts are already loaded via next/font in layout.tsx
  // This function exists for future custom font preloading if needed
}
