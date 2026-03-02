/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@akount/ui", "@akount/types"],

    // INFRA-15: Security headers for Next.js API routes and pages
    async headers() {
        return [
            {
                // Apply security headers to all routes
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY', // Prevent clickjacking
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff', // Prevent MIME sniffing
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block', // Legacy XSS protection (still useful for older browsers)
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin', // Control referrer information
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()', // Restrict browser features
                    },
                    {
                        // CSP: Allow Flinks Connect iframe while blocking all other external frames
                        key: 'Content-Security-Policy',
                        value: "frame-src 'self' https://toolbox-iframe.private.fin.ag https://*.private.fin.ag;",
                    },
                ],
            },
            {
                // Additional headers for API routes
                source: '/api/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains', // HSTS - force HTTPS for 1 year
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
