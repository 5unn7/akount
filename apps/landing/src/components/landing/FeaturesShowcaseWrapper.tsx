'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

/**
 * Client Component wrapper for FeaturesShowcase
 *
 * Isolates the 3D component (which requires browser WebGL) from the Server Component page.
 * Uses client-side only rendering to avoid Next.js 16 SSR evaluation issues with @react-three/fiber.
 */
const FeaturesShowcase = dynamic(
  () => import('./FeaturesShowcase').then((mod) => mod.FeaturesShowcase),
  {
    loading: () => (
      <div className="relative py-24 px-6 bg-[#09090F] flex items-center justify-center min-h-[500px]">
        <div className="text-muted-foreground animate-pulse">Loading features...</div>
      </div>
    ),
    ssr: false, // Disable SSR for 3D component (WebGL requires browser)
  }
);

export function FeaturesShowcaseWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client to avoid SSR evaluation of @react-three/fiber
  if (!mounted) {
    return (
      <div className="relative py-24 px-6 bg-[#09090F] flex items-center justify-center min-h-[500px]">
        <div className="text-muted-foreground animate-pulse">Loading features...</div>
      </div>
    );
  }

  return <FeaturesShowcase />;
}