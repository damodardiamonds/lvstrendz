import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
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
