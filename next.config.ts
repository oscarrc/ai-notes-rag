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
    config.externals.push({ '@lancedb/lancedb': '@lancedb/lancedb' });
    config.externals.push({ 'onnxruntime-node': 'commonjs onnxruntime-node' });
    return config;
  },
};

export default nextConfig;
