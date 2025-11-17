/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,  
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Image optimization
  images: {
    domains: ['ozbckmkhxaldcxbqxwlu.supabase.co'],
    unoptimized: false,
  },

  // API proxy
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://clamflowbackend-production.up.railway.app/:path*',
      },
    ];
  },

  // Build settings
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ KEEP THIS
  experimental: {
    missingSuspenseWithCSRBailout: true,
  },

  // ❌ REMOVE THIS LINE - IT BREAKS MOBILE PWA
  // output: 'export',

  // ✅ PWA Headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Mobile optimizations
  compress: true,
  poweredByHeader: false,
  
  // Generate unique build IDs
  generateBuildId: async () => {
    return `clamflow-mobile-${Date.now()}`;
  },
};

module.exports = nextConfig;