import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase the request body size limit to 10MB
    },
  },
};

export default nextConfig;
