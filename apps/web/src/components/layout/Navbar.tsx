import { MobileSidebar } from "./Sidebar";
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
    return (
        <div className="flex items-center p-4 h-16 glass border-t-0 border-x-0 rounded-none">
            <MobileSidebar />
            <div className="flex w-full justify-end items-center gap-4">
                <ThemeToggle />
                <SignedIn>
                    {/* User is signed in - show Clerk user button with profile/sign out */}
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: "h-8 w-8"
                            }
                        }}
                    />
                </SignedIn>
                <SignedOut>
                    {/* User is signed out - show sign in button */}
                    <SignInButton mode="modal">
                        <Button variant="outline" size="sm">
                            Sign In
                        </Button>
                    </SignInButton>
                </SignedOut>
            </div>
        </div>
    );
}
