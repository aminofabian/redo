/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'alexawriters.s3.eu-north-1.amazonaws.com',
      'images.unsplash.com',
      
      // Keep any existing domains here
    ],
  },
  // Other existing configuration...
  webpack: (config) => {
    // Remove the specific next-auth alias that's causing problems
    if (config.resolve.alias) {
      delete config.resolve.alias['next-auth'];
    }
    return config;
  },
  // Add headers configuration for CSP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' https://*.stripe.com https://alexawriters.s3.eu-north-1.amazonaws.com data:;"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
