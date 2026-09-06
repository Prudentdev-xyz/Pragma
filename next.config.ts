import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Set the filesystem root to resolve package-lock.json outside the git repo
    root: '/home/prudent/Documents',
  },
};

export default nextConfig;
