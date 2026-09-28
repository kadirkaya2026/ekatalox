import { notFound } from "next/navigation";
import { ElectronicsReview } from "@/components/storefront/sector-design/electronics-review";
import { isDesignId } from "@/lib/storefront/sector-design/config";
import { getDefaultTenantStorefrontSettings } from "@/lib/data";
import { demoTenants, demoProducts } from "@/lib/demo-data";
import type { StorefrontProduct } from "@/lib/types";
export const metadata = { title: "Hırdavat tema incelemesi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function HardwareReview({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { tema } = await searchParams;
  const tenant = { ...demoTenants[0], id: "theme-review-hardware", subdomain: "theme-review-hardware", company_name: "USTA TEDARİK", sector: "hirdavat", whatsapp_number: "", is_demo: true };
  const settings = { ...getDefaultTenantStorefrontSettings(tenant.id), storefront_title: tenant.company_name, storefront_description: "Hırdavat, nalburiye ve yapı kataloğu", is_hero_visible: false, is_theme_toggle_visible: true };
  // Existing catalog photography; prices and inventory below are local demo data.
  const samples = [{"name": "Knitex Şerit Metre 3 M", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/44010059.jpg", "category": "measure", "price": 149}, {"name": "Knitex Tornavida Düz 5 x 125", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/44010056.jpg", "category": "tools", "price": 89}, {"name": "Evvon Çekiç 100 G", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/44010139.jpg", "category": "tools", "price": 179}, {"name": "Knitex Maket Bıçağı Yedekli", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/44250079.jpg", "category": "tools", "price": 119}, {"name": "Knitex Sunta Vidası 3.5 x 18 KTX-2607 18'li", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/44057251.jpg", "category": "fasteners", "price": 39}, {"name": "Knitex Asma Kilit 30 Mm", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/44250087.jpg", "category": "security", "price": 129}, {"name": "Pattex %100 Yapıştırıcı 50 G", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/44250909.jpg", "category": "repair", "price": 159}, {"name": "Knitex Metal Duş Hortumu", "image": "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/40990137.jpg", "category": "plumbing", "price": 229}];
  const products: StorefrontProduct[] = samples.map((x,i)=>({...demoProducts[0],id:`hardware-sample-${i}`,category_id:x.category,sku_code:`HRD-${1000+i}`,product_name:x.name,image_url:x.image,image_url_2:null,image_url_3:null,price:x.price,package_quantity:6,carton_quantity:24,stock_quantity:120,is_in_stock:true,has_variants:false,variants:[],volume_pricing:null}));
  const categories=[{id:"tools",name:"El Aletleri"},{id:"measure",name:"Ölçüm"},{id:"fasteners",name:"Bağlantı Elemanları"},{id:"security",name:"Kilit & Güvenlik"},{id:"repair",name:"Tamir & Bakım"},{id:"plumbing",name:"Tesisat"}].map((c,i)=>({...c,tenant_id:tenant.id,parent_id:null,banner_item:null,tile_image_url:null,is_discount_category:false,is_hidden_from_storefront:false,display_order:i,created_at:"2026-01-01T00:00:00Z"}));
  return <ElectronicsReview tenant={tenant} products={products} categories={categories} settings={settings} initialTheme={isDesignId(tema) && tema.startsWith("hardware-")?tema:"hardware-usta"}/>;
}
