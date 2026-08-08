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
    // Proxy varsayılan olarak istek gövdesini 10MB'a kadar buffer'lar ve
    // aşan kısmı hata vermeden sessizce keser. Ürün fotoğrafı yüklemeleri
    // (max 10MB, bkz. lib/storage/product-images.ts) multipart overhead'i
    // ile bu sınırı aşabildiğinden marj bırakıyoruz.
    proxyClientMaxBodySize: "15mb",
  },
  turbopack: {
    root: currentDirectory,
  },
  async redirects() {
    return [
      {
        source: "/kvkk",
        destination: "/gizlilik-ve-kvkk",
        permanent: true,
      },
    ];
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
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.migrosone.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
