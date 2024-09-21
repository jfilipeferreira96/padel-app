/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV ?? "development",
    NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API,
    NEXT_URL_API_VIDEOS: process.env.NEXT_URL_API_VIDEOS,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
