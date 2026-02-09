import type { Metadata } from 'next';
import { Newsreader, Manrope, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import 'shadcn-glass-ui/styles.css';
import './globals.css';

const newsreader = Newsreader({
    subsets: ['latin'],
    variable: '--font-heading',
    display: 'swap',
});

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Akount',
    description: 'Financial Command Center',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <ClerkProvider>
                <body className={`${newsreader.variable} ${manrope.variable} ${jetbrainsMono.variable} font-sans`}>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </body>
            </ClerkProvider>
        </html>
    );
}
