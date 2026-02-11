import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

interface OnboardingStatus {
    status: 'new' | 'in_progress' | 'completed'
    tenantId?: string
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    // Check onboarding status — redirect to onboarding if not completed
    try {
        const onboarding = await apiClient<OnboardingStatus>(
            '/api/system/onboarding/status'
        )
        if (onboarding.status !== 'completed') {
            redirect('/onboarding')
        }
    } catch {
        // If status check fails (no user record, no tenant), redirect to onboarding
        redirect('/onboarding')
    }

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-[#0F0F17] text-foreground">
                <Sidebar />
            </div>
            <main className="md:pl-72">
                <Navbar />
                {children}
            </main>
        </div>
    );
}
