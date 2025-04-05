/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'alexawriters.s3.eu-north-1.amazonaws.com',
      // Keep any existing domains here
    ],
  },
  // Other existing configuration...
};

export default nextConfig;
