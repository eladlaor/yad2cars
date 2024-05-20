/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, { dev, isServer }) {
    if (dev) {
      config.devtool = "inline-source-map";
    }
    return config;
  },
};

module.exports = nextConfig;
