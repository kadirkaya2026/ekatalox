import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Client router cache: revisiting a page within this window serves instantly
  // from cache. Every dashboard mutation calls router.refresh(), which clears
  // this cache, so a saved change is always fetched fresh on the next view.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  turbopack: {
    root: currentDirectory,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
