/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: []
  },
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;