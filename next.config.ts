import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Disable pages directory processing to avoid conflicts
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
