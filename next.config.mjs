/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'alexawriters.s3.eu-north-1.amazonaws.com',
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
  }
};

export default nextConfig;
