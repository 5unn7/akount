import { LandingLayout } from '@/components/landing/LandingLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { FeaturesShowcase } from '@/components/landing/FeaturesShowcase';
import { StatsSection } from '@/components/landing/StatsSection';
import { CTASection } from '@/components/landing/CTASection';
import type { Metadata } from 'next';

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
