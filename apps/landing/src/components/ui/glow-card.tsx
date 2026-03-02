import * as React from 'react';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'default';
}

export function GlowCard({
  className = '',
  variant = 'default',
  children,
  ...props
}: GlowCardProps) {
  const baseStyles = 'rounded-xl transition-all duration-300';

  const variants = {
    glass: 'glass border border-ak-border',
    default: 'bg-ak-bg-2 border border-ak-border',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
