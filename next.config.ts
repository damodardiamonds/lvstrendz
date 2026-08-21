import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
      allowedOrigins: [
        "lvstrendz.com",
        "*.lvstrendz.com",
        "localhost:3000",
        "localhost:3001",
        "localhost:3002",
        "127.0.0.1:3000",
        "127.0.0.1:3001",
        "127.0.0.1:3002",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lvstrendz.com",
      },
      {
        protocol: "http",
        hostname: "lvstrendz.com",
      },
      {
        protocol: "https",
        hostname: "*.woocommerce.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
