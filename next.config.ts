import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  webpack(config) {
    config.externals.push({ '@lancedb/lancedb': '@lancedb/lancedb' })
    return config;
  }
};

export default nextConfig;
