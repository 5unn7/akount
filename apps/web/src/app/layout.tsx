import type { Metadata } from 'next';
import { Newsreader, Manrope, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
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
            <ClerkProvider
                appearance={{
                    baseTheme: dark,
                    variables: {
                        colorPrimary: '#F59E0B',
                        colorBackground: '#15151F',
                        colorInputBackground: '#0F0F17',
                        colorNeutral: '#e4e4e7',
                        colorText: '#e4e4e7',
                        colorTextSecondary: '#71717A',
                        colorDanger: '#F87171',
                        colorSuccess: '#34D399',
                        fontFamily: 'var(--font-body), sans-serif',
                        borderRadius: '0.5rem',
                    },
                }}
            >
                <body className={`${newsreader.variable} ${manrope.variable} ${jetbrainsMono.variable} font-sans`}>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </body>
            </ClerkProvider>
        </html>
    );
}
