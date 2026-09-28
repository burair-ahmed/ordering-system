import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 160, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  // ── Tree-shake icon / UI libs at compile time ────────────────────────────────
  // Named exports are individually resolved, so only imported icons are bundled
  // (instead of the whole lucide-react / react-icons barrel being shipped).
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'react-icons/fa',
      'react-icons/fi',
      'react-icons/hi',
      'react-icons/io',
      'react-icons/md',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
    ],
  },

  // ── Turbopack: pin workspace root to suppress monorepo lockfile warning ──────
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Disable pages directory processing to avoid conflicts
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
