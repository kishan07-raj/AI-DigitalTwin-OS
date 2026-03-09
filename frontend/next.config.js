/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable StrictMode in development to prevent duplicate API calls
  // Keep it enabled in production for best practices
  reactStrictMode: process.env.NODE_ENV === 'production',
  swcMinify: true,
  output: 'standalone',
  // Windows and OneDrive-specific fixes
  experimental: {
    // Disable some features that cause issues on Windows/OneDrive
    optimizeCss: false,
  },
  // Disable webpack caching that can cause issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.symlinks = false;
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

