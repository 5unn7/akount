import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ReactQueryProvider } from '@/providers/query-provider';
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

    const onboarding = await checkOnboardingStatus();

    // API is unreachable — show connection error instead of black screen
    if (onboarding === null) {
        return (
            <div className="min-h-screen bg-[#09090F] flex items-center justify-center p-8">
                <div className="max-w-md text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[rgba(245,158,11,0.14)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-heading text-foreground">API Server Unavailable</h1>
                        <p className="text-sm text-muted-foreground">
                            Could not connect to the API server. Make sure it&apos;s running:
                        </p>
                        <code className="block text-xs text-[#F59E0B] bg-[rgba(245,158,11,0.08)] px-4 py-2 rounded-lg font-mono mt-3">
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

    // User hasn't completed onboarding → redirect
    if (onboarding.status !== 'completed') {
        redirect('/onboarding')
    }

    return (
        <ReactQueryProvider>
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-[#0F0F17] text-foreground">
                    <Sidebar role={role} />
                </div>
                <main className="md:pl-72">
                    <Navbar />
                    {children}
                </main>
            </div>
        </ReactQueryProvider>
    );
}
