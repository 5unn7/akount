import { LandingLayout } from '@/components/landing/LandingLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { CTASection } from '@/components/landing/CTASection';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

// Lazy load 3D component (below the fold, performance optimization)
const FeaturesShowcase = dynamic(
  () => import('@/components/landing/FeaturesShowcase').then((mod) => mod.FeaturesShowcase),
  {
    loading: () => (
      <div className="relative py-24 px-6 bg-[#09090F] flex items-center justify-center min-h-[500px]">
        <div className="text-muted-foreground animate-pulse">Loading features...</div>
      </div>
    ),
    ssr: false, // Disable SSR for 3D component (WebGL requires browser)
  }
);

export const metadata: Metadata = {
  title: 'Akount — Financial Command Center for Global Solopreneurs',
  description:
    'Track every dollar across currencies, entities, and accounts. AI handles the complexity. Multi-currency invoicing, automated journal entries, real-time reports.',
};

export default function Home() {
  return (
    <LandingLayout>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesShowcase />
      <StatsSection />
      <CTASection />
    </LandingLayout>
  );
}
