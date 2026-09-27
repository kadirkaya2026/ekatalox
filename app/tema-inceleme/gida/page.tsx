import { notFound } from "next/navigation";
import { ElectronicsReview } from "@/components/storefront/sector-design/electronics-review";
import { isDesignId } from "@/lib/storefront/sector-design/config";
import { getDefaultTenantStorefrontSettings } from "@/lib/data";
import { demoTenants, demoProducts } from "@/lib/demo-data";
import type { StorefrontProduct } from "@/lib/types";
export const metadata = { title: "Gıda ve içecek tema incelemesi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function FoodReview({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { tema } = await searchParams;
  const tenant = { ...demoTenants[0], id: "theme-review-food", subdomain: "theme-review-food", company_name: "sofra", sector: "gida", whatsapp_number: "", is_demo: true };
  const settings = { ...getDefaultTenantStorefrontSettings(tenant.id), storefront_title: tenant.company_name, storefront_description: "Gıda ve içecek kataloğu", is_hero_visible: false, is_theme_toggle_visible: true };
  const samples = [
    {name:"Komili Natürel Sızma Zeytinyağı 500 ml",image:"8699300270002",price:249.90,category:"pantry"},
    {name:"Balparmak Narenciye Balı 460 g",image:"07079673",price:219.90,category:"breakfast"},
    {name:"İçim Süt 1 L",image:"11013025",price:49.90,category:"dairy"},
    {name:"Filiz Burgu Makarna 500 g",image:"5030352",price:29.90,category:"pantry"},
    {name:"Çaykur Rize Turist Çay 1 kg",image:"03111303",price:249.90,category:"drinks"},
    {name:"Duru Pilavlık Bulgur 1 kg",image:"01075029",price:54.90,category:"pantry"},
    {name:"Halis Komili Kekikli Yeşil Zeytin 170 g",image:"16021312",price:79.90,category:"breakfast"},
    {name:"Torku Sütlü Çikolata 60 g",image:"07030995",price:39.90,category:"snacks"},
    {name:"Tamek Domates Salçası 700 g",image:"09010295",price:89.90,category:"cooking"},
    {name:"Eker Ayran 1 L",image:"11550100",price:39.90,category:"dairy"},
    {name:"Torku Tam Yağlı Doğal Yoğurt 750 g",image:"12500201",price:69.90,category:"dairy"},
    {name:"Torku Tam Yulaflı Bisküvi 375 g",image:"07013837",price:44.90,category:"snacks"},
  ];
  const products: StorefrontProduct[] = samples.map((x,i)=>({...demoProducts[0],id:`food-sample-${i}`,category_id:x.category,sku_code:`GDA-${1000+i}`,product_name:x.name,image_url:`https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/market-catalog-images/${x.image}.jpg`,price:x.price,package_quantity:6,carton_quantity:24,stock_quantity:120,has_variants:false,variants:[],volume_pricing:null,description:"Bu katalog tasarım incelemesi içindir. Fiyatlar örnektir; ürün ve sipariş bilgileri mağaza panelinden yönetilir."}));
  const categories=[{id:"breakfast",name:"Kahvaltılık"},{id:"dairy",name:"Süt & Süt Ürünleri"},{id:"pantry",name:"Temel Gıda"},{id:"drinks",name:"İçecekler"},{id:"snacks",name:"Atıştırmalık"},{id:"cooking",name:"Yemeklik"}].map((c,i)=>({...c,tenant_id:tenant.id,parent_id:null,banner_item:null,tile_image_url:null,is_discount_category:false,is_hidden_from_storefront:false,display_order:i,created_at:"2026-01-01T00:00:00Z"}));
  return <ElectronicsReview tenant={tenant} products={products} categories={categories} settings={settings} initialTheme={isDesignId(tema) && tema.startsWith("food-")?tema:"food-hasat"}/>;
}
