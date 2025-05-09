/** @type {import('next').NextConfig} */
const nextConfig = {
  // other config
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  swcMinify: false,
  productionBrowserSourceMaps: false,
  output: 'standalone',
  poweredByHeader: false,
  
  // Add Images configuration to allow the S3 bucket domain
  images: {
    // Remove or comment out the old domains config
    // domains: ['example.com'],
    
    // Add the new remotePatterns config
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.your-domain.com',
        pathname: '/images/**',
      },
    ],
    domains: ['your-storage-domain.com'],
  }
}

module.exports = nextConfig; 