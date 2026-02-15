import Link from 'next/link';

export const metadata = {
  title: 'Access Denied | Akount',
  description: 'You do not have permission to access this page.',
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 text-6xl font-bold text-finance-expense">403</div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Access Denied
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          You don&apos;t have permission to access this page. If you believe this
          is an error, please contact your administrator.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/overview"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
