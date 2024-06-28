/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV ?? "development",
    NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API,
  },
};

module.exports = nextConfig;
