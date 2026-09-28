"use client";
import { useRef, useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { ElectronicsEditor } from "@/components/dashboard/sector-design/electronics-editor";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { DESIGNS, designsForSector, defaultContent, newDesignDocument, type DesignId, type DesignDocument } from "@/lib/storefront/sector-design/config";
import type { Category, StorefrontProduct, Tenant, TenantStorefrontSettings } from "@/lib/types";

export function ElectronicsReview({ tenant, products, categories, settings, initialTheme }: { tenant: Tenant; products: StorefrontProduct[]; categories: Category[]; settings: TenantStorefrontSettings; initialTheme: DesignId }) {
  const [document, setDocument] = useState<DesignDocument>(() => newDesignDocument(initialTheme));
  const dialog = useRef<HTMLDialogElement>(null);
  const design = DESIGNS.find(d => d.id === document.themeId)!;
  const resolved = { ...settings, sector_design: document, theme_key: design.overlayTheme, font_key: design.font };
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 font-sans text-slate-900">
      <span className="text-xs font-medium text-slate-500">{tenant.sector === "kozmetik" ? "Kozmetik ve kişisel bakım" : tenant.sector === "hirdavat" ? "Hırdavat, nalburiye ve yapı" : tenant.sector === "tekstil" ? "Tekstil, giyim ve ayakkabı" : tenant.sector === "gida" ? "Gıda ve içecek" : "Elektronik"} · Yerel önizleme · Fiyatlar örnektir</span>
      <nav className="flex items-center gap-1" aria-label="Tema tasarımları">{designsForSector(tenant.sector).map(d => <button key={d.id} aria-pressed={document.themeId === d.id} onClick={() => setDocument(current => ({ ...current, themeId: d.id, content: { ...current.content, [d.id]: current.content[d.id] ?? defaultContent(d.id) } }))} className={`rounded-md px-4 py-2 text-xs font-semibold ${document.themeId === d.id ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>{d.name}</button>)}</nav>
      <div className="flex items-center gap-3"><label className="text-xs"><span className="sr-only">Satış biçimi önizlemesi</span><select className="rounded-md border border-slate-200 bg-white px-2 py-2" value={document.mode} onChange={e => setDocument(current => ({ ...current, mode: e.target.value as DesignDocument["mode"] }))}><option value="retail">Perakende</option><option value="wholesale">Toptan</option></select></label><button onClick={() => dialog.current?.showModal()} className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-xs font-semibold text-white"><SlidersHorizontal size={14} />Temayı düzenle</button></div>
    </div>
    <StorefrontPageShell storefrontSettings={resolved} subdomain={tenant.subdomain} hidePoweredBy>
      <StorefrontClient tenant={tenant} categories={categories} initialProducts={products} initialProductTotal={products.length} promoProducts={[]} bestSellerProducts={[]} recommendationPool={[]} storefrontSettings={resolved} sectionMode inlineProductNavigation homeHref={tenant.sector === "kozmetik" ? "/tema-inceleme/kozmetik" : tenant.sector === "hirdavat" ? "/tema-inceleme/hirdavat" : tenant.sector === "tekstil" ? "/tema-inceleme/tekstil" : tenant.sector === "gida" ? "/tema-inceleme/gida" : "/tema-inceleme"} />
    </StorefrontPageShell>
    <dialog ref={dialog} aria-label="Temaya özel alanları düzenle" className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%_-_24px)] max-w-[960px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 backdrop:bg-black/50 sm:p-8"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900">Temaya özel alanlar</h2><p className="mt-1 text-xs text-slate-600">Değişiklikler arka plandaki vitrinde anında görünür. Canlı mağazaya kayıt yapılmaz.</p></div><button aria-label="Editörü kapat" onClick={() => dialog.current?.close()} className="rounded-full border border-slate-300 bg-white p-2"><X size={20} /></button></div><ElectronicsEditor sector={tenant.sector!} key={`${document.themeId}-${document.mode}`} initial={document} categories={categories} products={products.map(p => ({ id: p.id, name: p.product_name }))} previewOnly onDraftChange={setDocument} /></dialog>
  </>;
}
