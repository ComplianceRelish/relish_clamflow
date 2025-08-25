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
  // Disable static optimization for dynamic pages
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;