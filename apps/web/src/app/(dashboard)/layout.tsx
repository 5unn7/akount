import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { ContentPanel } from "@/components/shared/ContentPanel";
import { DomainTabs } from "@/components/shared/DomainTabs";
import { KeyboardShortcutsModal } from "@/components/shared/KeyboardShortcutsModal";
import { ReactQueryProvider } from '@/providers/query-provider';
import { EntityProvider } from '@/providers/entity-provider';
import { listEntities, type Entity } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import type { Role } from '@akount/types';

interface OnboardingStatus {
    status: 'new' | 'in_progress' | 'completed'
    tenantId?: string
}

/**
 * Check onboarding status with a short timeout.
 * Returns the status if reachable, or null if the API is down.
 *
 * Uses fetch directly (not apiClient) so we can distinguish
 * HTTP errors (404 = user needs onboarding) from network errors (API down).
 */
async function checkOnboardingStatus(): Promise<OnboardingStatus | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const { getToken } = await auth();
        const token = await getToken();
        if (!token) return { status: 'new' };

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/system/onboarding/status`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });

        if (res.ok) {
            return await res.json();
        }

        // API responded with HTTP error (404 user not found, etc.) → needs onboarding
        return { status: 'new' };
    } catch {
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

    // Read entity selection from cookie and validate against user's entities
    const { entityId: rawEntityId, currency } = await getEntitySelection();
    const validatedEntityId = validateEntityId(rawEntityId, entities);

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
            <EntityProvider
                entities={entities}
                initialEntityId={validatedEntityId}
                initialCurrency={currency}
            >
                <div className="h-full relative">
                    <Sidebar role={role} />
                    <main className="md:pl-16">
                        <Navbar entities={entities} />
                        <div className="px-4 md:px-6 py-4 space-y-4">
                            <DomainTabs />
                            <ContentPanel>{children}</ContentPanel>
                        </div>
                    </main>
                    {showOnboardingOverlay && <OnboardingOverlay />}
                    <KeyboardShortcutsModal />
                    <Toaster
                        theme="dark"
                        position="bottom-right"
                        toastOptions={{
                            className: 'glass border-ak-border text-foreground',
                        }}
                    />
                </div>
            </EntityProvider>
        </ReactQueryProvider>
    );
}
