import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbEntry {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    breadcrumbs?: BreadcrumbEntry[];
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ breadcrumbs, title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <Breadcrumb>
                            {breadcrumbs.map((crumb, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                return (
                                    <BreadcrumbItem key={crumb.label}>
                                        {index > 0 && <BreadcrumbSeparator />}
                                        {isLast ? (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={crumb.href ?? '#'}>
                                                {crumb.label}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                );
                            })}
                        </Breadcrumb>
                    )}
                    {title && (
                        <h1 className="text-2xl font-heading font-normal tracking-tight mt-1">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-3 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
