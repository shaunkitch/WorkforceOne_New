import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    CUSTOM_KEY: 'value',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig