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
  async rewrites() {
    return [
      // Tekel saha uygulaması: gizli statik sayfa (public/saha/<token>/index.html)
      { source: "/saha/:token", destination: "/saha/:token/index.html" },
    ];
  },
  async headers() {
    return [
      {
        // Saha uygulaması ve API'si arama motorlarına kapalı (adres gizli)
        source: "/saha/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/kvkk",
        destination: "/gizlilik-ve-kvkk",
        permanent: true,
      },
      // 8 Eyl 2026 yeniden konumlandırma: eski kayıt ve tema sayfaları
      { source: "/kayit", destination: "/basvuru", permanent: true },
      { source: "/temalar", destination: "/ozellikler", permanent: true },
    ];
  },
  images: {
    // Varsayılan 60 saniye: aynı ürün görseli her ~1 dakikada bir yeniden
    // indirilip yeniden boyutlandırılıyordu — yoğun trafikte "resimler geç
    // geliyor" hissinin büyük kısmı buydu (kullanıcı isteği, 4 Eyl 2026).
    // 7 gün: ürün görseli değişince zaten farklı bir dosya adına/yola
    // yükleniyor (bkz. storage yükleme kodları), o yüzden bayatlama riski yok.
    minimumCacheTTL: 60 * 60 * 24 * 7,
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
