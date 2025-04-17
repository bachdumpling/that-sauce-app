import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mir-s3-cdn-cf.behance.net",
      },
      {
        protocol: "https",
        hostname: "tzkhvlquyavzxlrvujhy.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
      },
      {
        protocol: "https",
        hostname: "muse-bucket.s3.us-east-2.amazonaws.com",
      },
    ],
  },
  webpack: (config) => {
    // GLB file handling
    config.module.rules.push({
      test: /\.glb$/,
      use: ["url-loader"],
    });

    return config;
  },
  // Updated configuration for external packages
  serverExternalPackages: ["@vercel/og"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
