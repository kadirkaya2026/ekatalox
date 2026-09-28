import { WHOLESALE_SECTORS } from "@/lib/marketing/sectors";
import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/marketing/blog";
import { MARKETING_FEATURES } from "@/lib/marketing/features";

const BASE_URL = "https://www.ekatalox.com";

// /musteriler gerçek referans gelene kadar noindex; sitemap'te yok.
const STATIC: Array<[string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
  ["/", "weekly", 1],
  ["/blog", "weekly", 0.8],
  ["/temalar", "monthly", 0.8],
  ["/sektorler", "monthly", 0.8],
  ["/sektorler/market-bakkal", "monthly", 0.8],
  ["/basvuru", "monthly", 0.9],
  ["/fiyatlandirma", "monthly", 0.9],
  ["/nasil-calisir", "monthly", 0.8],
  ["/ozellikler", "monthly", 0.8],
  ["/sss", "monthly", 0.7],
  ["/hakkimizda", "monthly", 0.5],
  ["/iletisim", "monthly", 0.6],
  ["/yardim", "monthly", 0.5],
  ["/yenilikler", "weekly", 0.5],
  ["/kullanim-sartlari", "yearly", 0.3],
  ["/gizlilik-ve-kvkk", "yearly", 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Omit lastModified until actual content revision dates are tracked.
  return [
    ...WHOLESALE_SECTORS.map(({ slug }) => ({ url: `${BASE_URL}/sektorler/${slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...STATIC.map(([path, changeFrequency, priority]) => ({ url: `${BASE_URL}${path}`, changeFrequency, priority })),
    ...getBlogPosts().map((post) => ({ url: `${BASE_URL}/blog/${post.slug}`, lastModified: post.updatedAt ?? post.publishedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...MARKETING_FEATURES.map(({ slug }) => ({ url: `${BASE_URL}/ozellikler/${slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
