import { notFound } from "next/navigation";
import { ElectronicsReview } from "@/components/storefront/sector-design/electronics-review";
import { isDesignId } from "@/lib/storefront/sector-design/config";
import { getDefaultTenantStorefrontSettings } from "@/lib/data";
import { demoTenants, demoProducts } from "@/lib/demo-data";
import type { StorefrontProduct } from "@/lib/types";
export const metadata = { title: "Tekstil tema incelemesi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function TextileReview({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { tema } = await searchParams;
  const tenant = { ...demoTenants[0], id: "theme-review-textile", subdomain: "theme-review-textile", company_name: "VELIRA", sector: "tekstil", whatsapp_number: "", is_demo: true };
  const settings = { ...getDefaultTenantStorefrontSettings(tenant.id), storefront_title: tenant.company_name, storefront_description: "Giyim ve tekstil kataloğu", is_hero_visible: false, is_theme_toggle_visible: true };
  // Public product photography from the user's demo-giyim catalog; local sample prices and size inventory.
  const samples = [
    {name:"Pudra V Yaka Taş Detaylı Elbise",image:"8181bfb6-c31b-4b63-ad11-5b715c326df1",price:4499,category:"dresses"},
    {name:"Siyah Straplez Drape Detaylı Abiye",image:"d66d4745-f4f8-43e0-b0ba-72508ae2bc47",price:13499,category:"dresses"},
    {name:"Yağ Yeşili Desenli Bol Kesim Gömlek",image:"f89a3040-4496-4eb8-9493-b4e906bf5e50",price:6999,category:"tops"},
    {name:"Zümrüt Pile Detaylı Bol Kesim Pantolon",image:"2e583626-9a68-44ed-be55-a20fe9e043c3",price:4299,category:"bottoms"},
    {name:"Siyah Korsaj Detaylı Midi Boy Etek",image:"c08cc7a6-eb7e-4ed9-a4a1-34b8ef9918c3",price:3999,category:"bottoms"},
    {name:"Siyah Düğme Detaylı Midi Boy Kaban",image:"55abcedd-bc98-4094-9628-7b5f86d1c39c",price:11999,category:"outerwear"},
    {name:"Lila Oversize Baskı Detaylı Sweatshirt",image:"56880669-e670-4a3b-979b-5cc888a1a0dd",price:1699,category:"tops"},
    {name:"Siyah Puantiyeli Ceket",image:"9b0dd95c-7606-48e4-8d86-ee665a4676d5",price:7999,category:"outerwear"},
  ];
  const products: StorefrontProduct[] = samples.map((x,i)=>({...demoProducts[0],id:`textile-sample-${i}`,category_id:x.category,sku_code:`MDL-${1000+i}`,product_name:x.name,image_url:`https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/product-images/adc6dba9-f9de-4548-9163-34cbf4bdb736/products/${x.image}-g.jpg`,image_url_2:null,image_url_3:null,price:x.price,package_quantity:6,carton_quantity:24,stock_quantity:120,has_variants:true,variants:['S','M','L','XL'].map((size,j)=>({id:`textile-${i}-${size}`,product_id:`textile-sample-${i}`,model_name:size,stock_quantity:j===3?0:30,package_quantity:6,carton_quantity:24,is_available_for_sale:j!==3,is_purchasable:j!==3,display_order:j,price:x.price})),volume_pricing:null,description:"Tasarım önizlemesindeki fiyatlar ve beden stokları örnektir. Mağazanızın ürün bilgileri ve satış seçenekleri panelden yönetilir."}));
  const categories=[{id:"dresses",name:"Elbise & Tulum"},{id:"tops",name:"Üst Giyim"},{id:"bottoms",name:"Alt Giyim"},{id:"outerwear",name:"Dış Giyim"}].map((c,i)=>({...c,tenant_id:tenant.id,parent_id:null,banner_item:null,tile_image_url:null,is_discount_category:false,is_hidden_from_storefront:false,display_order:i,created_at:"2026-01-01T00:00:00Z"}));
  return <ElectronicsReview tenant={tenant} products={products} categories={categories} settings={settings} initialTheme={isDesignId(tema) && tema.startsWith("textile-")?tema:"textile-atelier"}/>;
}
