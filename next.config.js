/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Frontend-only mode - no backend required
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
    // Allow unoptimized images for data URLs (handled by browser)
    unoptimized: true,
  },
}

module.exports = nextConfig
