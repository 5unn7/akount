import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

export function Breadcrumb({ children, className, ...props }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn('flex items-center', className)} {...props}>
            <ol className="flex items-center gap-1.5 text-sm">
                {children}
            </ol>
        </nav>
    );
}

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
    children: React.ReactNode;
}

export function BreadcrumbItem({ children, className, ...props }: BreadcrumbItemProps) {
    return (
        <li className={cn('inline-flex items-center gap-1.5', className)} {...props}>
            {children}
        </li>
    );
}

interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
}

export function BreadcrumbLink({ href, children, className, ...props }: BreadcrumbLinkProps) {
    return (
        <a
            href={href}
            className={cn(
                'text-muted-foreground hover:text-foreground transition-colors font-medium',
                className
            )}
            {...props}
        >
            {children}
        </a>
    );
}

interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
}

export function BreadcrumbPage({ children, className, ...props }: BreadcrumbPageProps) {
    return (
        <span
            role="link"
            aria-disabled="true"
            aria-current="page"
            className={cn('text-foreground font-medium', className)}
            {...props}
        >
            {children}
        </span>
    );
}

export function BreadcrumbSeparator({ className }: { className?: string }) {
    return (
        <li role="presentation" aria-hidden="true" className={cn('text-muted-foreground', className)}>
            <ChevronRight className="h-3.5 w-3.5" />
        </li>
    );
}
