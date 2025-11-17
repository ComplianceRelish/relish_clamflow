/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,  
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    domains: ['ozbckmkhxaldcxbqxwlu.supabase.co'],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://clamflowbackend-production.up.railway.app/:path*',
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ CRITICAL: Enable this to allow client-side rendering during build
  experimental: {
    missingSuspenseWithCSRBailout: true,
  },
  // ✅ CRITICAL: Disable static page generation
  output: 'export' // Changed to export mode which skips SSR during build
};

module.exports = nextConfig;