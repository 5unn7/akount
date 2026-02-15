import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Akount Brand Portal',
  description: 'Design system, components, and brand guidelines for Akount',
};

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
