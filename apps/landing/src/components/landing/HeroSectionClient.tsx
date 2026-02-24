'use client';

import dynamic from 'next/dynamic';

// Dynamically import HeroSection with ssr: false to prevent 3D rendering issues
export const HeroSectionClient = dynamic(
  () => import('./HeroSection').then((mod) => ({ default: mod.HeroSection })),
  { ssr: false }
);
