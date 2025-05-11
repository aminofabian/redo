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
    domains: [
      'alexawriters.s3.eu-north-1.amazonaws.com',  // Your S3 bucket
      'images.unsplash.com',  // For placeholder images
      'placehold.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'alexawriters.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      }
    ],
  },

  ContentSecurityPolicy: {
    'img-src': ["'self'", "https://*.stripe.com", "data:", "https://alexawriters.s3.eu-north-1.amazonaws.com"],
    'style-src': ["'self'", "'unsafe-inline'"],
    // other CSP directives...
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paypal.com https://js.stripe.com https://*.stripe.com; connect-src 'self' https://*.paypal.com https://*.paypalobjects.com https://*.stripe.com; frame-src 'self' https://*.paypal.com https://*.paypalobjects.com https://*.stripe.com; img-src 'self' data: https://*.paypal.com https://*.stripe.com https://alexawriters.s3.eu-north-1.amazonaws.com; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig; 