import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ESLint errors will now fail the build
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript errors will now fail the build
    ignoreBuildErrors: false,
  },
  // Optimize production builds
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  // Image optimization
  images: {
    domains: ['images.unsplash.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
