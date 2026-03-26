/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'asset.brandfetch.io',
      },
    ],
  },
}
module.exports = nextConfig
