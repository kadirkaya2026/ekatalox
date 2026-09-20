import type { MetadataRoute } from "next";

const BASE_URL = "https://www.ekatalox.com";

// /musteriler gerçek referans gelene kadar noindex; sitemap'te yok.
const STATIC: Array<[string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
  ["/", "weekly", 1],
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
  const lastModified = new Date();
  return STATIC.map(([path, changeFrequency, priority]) => ({ url: `${BASE_URL}${path}`, lastModified, changeFrequency, priority }));
}
