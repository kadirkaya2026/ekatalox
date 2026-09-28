import { notFound } from "next/navigation";
import { SectorLiveEditor } from "@/components/dashboard/sector-design/live-editor";
import { categories, lists, fixtureProducts } from "./fixture";
import { newDesignDocument } from "@/lib/storefront/sector-design/config";
export const metadata = { title: "Canlı tema editörü — yerel inceleme", robots: { index: false, follow: false } };
export default function Page() {
 if (process.env.NODE_ENV !== "development") notFound();
 return <main className="min-h-screen bg-slate-50 p-6"><h1 className="mb-2 text-2xl font-semibold">Tema editörü · Yerel inceleme</h1><p className="mb-6 text-sm text-slate-600">Bu sayfada örnek ürünler kullanılır. Gerçek mağaza paneli yalnız oturum açan işletmenin ürünlerini yükler. Buradan canlı mağazaya kayıt yapılmaz.</p><SectorLiveEditor sector="telefon-aksesuar" initial={newDesignDocument("electronics-forma")} categories={categories} products={fixtureProducts(lists[0].id).map(p => ({id:p.id,name:p.product_name}))} priceLists={lists} previewOnly previewSrc="/tema-inceleme/panel/vitrin" /></main>;
}
