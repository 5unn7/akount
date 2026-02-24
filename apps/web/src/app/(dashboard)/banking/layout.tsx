// Reserved for future domain-specific layout wrapping (breadcrumbs, providers, domain-level error boundaries, etc.)
// Currently delegates to root dashboard layout for DomainTabs rendering.
export default function BankingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
