import { notFound } from "next/navigation";
import { ElectronicsReview } from "@/components/storefront/sector-design/electronics-review";
import { isDesignId } from "@/lib/storefront/sector-design/config";
import { getDefaultTenantStorefrontSettings } from "@/lib/data";
import { demoTenants, demoProducts } from "@/lib/demo-data";
import type { StorefrontProduct } from "@/lib/types";

export const metadata = { title: "Elektronik tema incelemesi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Yerel tasarım incelemesi; canlı ortamda ve arama motorlarında açılmaz. */
export default async function ThemeReview({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { tema } = await searchParams;
  const tenant = { ...demoTenants[0], id: "theme-review-electronics", subdomain: "theme-review", company_name: "elektra", sector: "telefon-aksesuar", whatsapp_number: "", is_demo: true };
  const settings = { ...getDefaultTenantStorefrontSettings(tenant.id), storefront_title: tenant.company_name, storefront_description: "Telefon, teknoloji ve aksesuar kataloğu", is_hero_visible: false, is_theme_toggle_visible: true };
  const samples = [{"name": "JBL Flip 6 Taşınabilir Bluetooth Hoparlör", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/050036384384.jpg", "price": 499, "category": "speakers"}, {"name": "JBL HARMAN TUNE 520BT BLUETOOTH KULAKLIK SİYAH", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/050036394963.jpg", "price": 699, "category": "headphones"}, {"name": "JBL HARMAN TUNE 770NC BLUETOOTH KULAKLIK MAVİ", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/050036396028.jpg", "price": 899, "category": "headphones"}, {"name": "JBL Go4 Bluetooth Hoparlör", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/050036399340.jpg", "price": 1099, "category": "speakers"}, {"name": "JBL Junior 320BT Çocuklara Özel Bluetooth Kulaklık", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/050036405546.jpg", "price": 1299, "category": "headphones"}, {"name": "JBL Junior 320BT Çocuklara Özel Kablolu Kulaklık Pembe", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/050036405607.jpg", "price": 1499, "category": "headphones"}];
  const products: StorefrontProduct[] = samples.map((sample, index) => ({ ...demoProducts[0], id: `theme-sample-${index}`, category_id: sample.category, sku_code: `TEK-${1000 + index}`, product_name: sample.name, image_url: sample.image, price: sample.price, package_quantity: 6, carton_quantity: 24, stock_quantity: 48, has_variants: false, variants: [], volume_pricing: null }));
  const categories = [{ id: "headphones", name: "Kulaklıklar" }, { id: "speakers", name: "Hoparlörler" }].map((c, index) => ({ ...c, tenant_id: tenant.id, parent_id: null, banner_item: null, tile_image_url: null, is_discount_category: false, is_hidden_from_storefront: false, display_order: index, created_at: "2026-01-01T00:00:00Z" }));
  return <ElectronicsReview tenant={tenant} products={products} categories={categories} settings={settings} initialTheme={isDesignId(tema) && tema.startsWith("electronics-") ? tema : "electronics-forma"} />;
}
