import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/activate",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

