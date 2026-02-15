import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { ReactQueryProvider } from '@/providers/query-provider';
import { listEntities, type Entity } from '@/lib/api/entities';
import type { Role } from '@akount/types';

interface OnboardingStatus {
    status: 'new' | 'in_progress' | 'completed'
    tenantId?: string
}

/**
 * Check onboarding status with a short timeout.
 * Returns the status if reachable, or null if the API is down.
 */
async function checkOnboardingStatus(): Promise<OnboardingStatus | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const result = await apiClient<OnboardingStatus>(
            '/api/system/onboarding/status',
            { signal: controller.signal }
        );
        return result;
    } catch (error) {
        // API responded with an HTTP error (user has no tenant, etc.) → needs onboarding
        if (error instanceof Error && error.message.startsWith('API error:')) {
            return { status: 'new' };
        }
        // Network error or timeout → API is unreachable
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId, sessionClaims } = await auth()
    if (!userId) redirect('/sign-in')

    const role = ((sessionClaims?.metadata as Record<string, unknown>)?.role as Role) || undefined;

    const [onboarding, entities] = await Promise.all([
        checkOnboardingStatus(),
        listEntities().catch(() => [] as Entity[]),
    ]);

    // API is unreachable — show connection error instead of black screen
    if (onboarding === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="max-w-md text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/[0.14] flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-heading text-foreground">API Server Unavailable</h1>
                        <p className="text-sm text-muted-foreground">
                            Could not connect to the API server. Make sure it&apos;s running:
                        </p>
                        <code className="block text-xs text-primary bg-primary/[0.08] px-4 py-2 rounded-lg font-mono mt-3">
                            pnpm --filter api dev
                        </code>
                    </div>
                    <a
                        href="/overview"
                        className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                    >
                        Retry
                    </a>
                </div>
            </div>
        );
    }

    // Hard redirect for brand-new users (never started onboarding)
    if (onboarding.status === 'new') {
        redirect('/onboarding')
    }

    // Soft overlay for in-progress users (started but didn't finish)
    const showOnboardingOverlay = onboarding.status !== 'completed'

    return (
        <ReactQueryProvider>
            <div className="h-full relative">
                <Sidebar role={role} />
                <main className="md:pl-64">
                    <Navbar entities={entities} />
                    <div className="px-4 md:px-6 py-6">
                        {children}
                    </div>
                </main>
                {showOnboardingOverlay && <OnboardingOverlay />}
            </div>
        </ReactQueryProvider>
    );
}
