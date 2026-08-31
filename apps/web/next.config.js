/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    const apiUrl = rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
      ? rawApiUrl
      : `https://${rawApiUrl}`;
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
