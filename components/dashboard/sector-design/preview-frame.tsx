"use client";
import { useEffect, useState, useRef, type ComponentProps } from "react";
import s from "./inline-studio.module.css";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { DESIGNS, readDesignDocument, newDesignDocument, designsForSector, getDesignContent, type DesignDocument } from "@/lib/storefront/sector-design/config";
import type { Tenant, TenantStorefrontSettings, Category, StorefrontProduct } from "@/lib/types";

type Extras=Pick<ComponentProps<typeof StorefrontClient>,"campaigns"|"promoProducts"|"promoProductCount"|"bestSellerProducts"|"recommendationPool"|"sections"|"categoryRepresentativeImages">;
export function SectorPreviewFrame({ tenant, settings, categories, products, total, priceListId, isCatalogOnly, fixture = false, designDocument, extras }: { tenant: Tenant; settings: TenantStorefrontSettings; categories: Category[]; products: StorefrontProduct[]; total: number; priceListId: string; isCatalogOnly: boolean; fixture?: boolean; designDocument?: DesignDocument; extras?: Partial<Extras> }) {
  const [frameEditing,setFrameEditing]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const [receivedDraft, setDraft] = useState<DesignDocument>(() => readDesignDocument(settings.sector_design, tenant.sector) ?? newDesignDocument(designsForSector(tenant.sector)[0].id));
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== "ekx-theme-draft") return;
      const next = readDesignDocument(event.data.document, tenant.sector);
      if (next) {setDraft(next);setFrameEditing(event.data.editing===true);}
    }
    window.addEventListener("message", receive);
    parent.postMessage({ type: "ekx-theme-ready" }, location.origin);
    // Keep link clicks inside the preview; product navigation is handled inline.
    function keepPreview(event: MouseEvent) {
      if (root.current?.contains(event.target as Node) && (event.target as Element)?.closest?.("a[href]")) event.preventDefault();
    }
    document.addEventListener("click", keepPreview, true);
    return () => { window.removeEventListener("message", receive); document.removeEventListener("click", keepPreview, true); };
  }, [tenant.sector]);
  const draft = designDocument ?? receivedDraft;
  const content = getDesignContent(draft);
  const featuredId = "featureProductId" in content ? content.featureProductId : "";
  const [featured, setFeatured] = useState<StorefrontProduct[]>([]);
  useEffect(() => {
    if (!featuredId || fixture || products.some(p => p.id === featuredId)) return;
    const controller = new AbortController();
    void fetch(`/api/tenant/settings/sector-design/preview?priceList=${encodeURIComponent(priceListId)}&productId=${encodeURIComponent(featuredId)}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null).then(data => { if (!controller.signal.aborted) setFeatured(data?.products ?? []); }).catch(() => undefined);
    return () => controller.abort();
  }, [featuredId, fixture, products, priceListId]);
  const design = DESIGNS.find(d => d.id === draft.themeId)!;
  const resolved = { ...settings, sector_design: draft, theme_key: design.overlayTheme, font_key: design.font };
  return <div ref={root} className={frameEditing?s.embeddedEditing:undefined} onClickCapture={event=>{if(!frameEditing)return;const area=(event.target as Element).closest<HTMLElement>("[data-theme-area]");if(area){event.preventDefault();event.stopPropagation();parent.postMessage({type:"ekx-theme-area",area:area.dataset.themeArea},location.origin);}}}><StorefrontPageShell storefrontSettings={resolved} subdomain={`preview-${tenant.subdomain}`} hidePoweredBy>
    <StorefrontClient tenant={tenant} categories={categories} initialProducts={products} initialProductTotal={total} {...extras} promoProducts={extras?.promoProducts??[]} bestSellerProducts={extras?.bestSellerProducts??[]} recommendationPool={[...(extras?.recommendationPool??[]),...featured.filter(p => p.id === featuredId)]} storefrontSettings={resolved} inlineProductNavigation sectionMode={fixture} previewMode previewPriceListId={priceListId} isCatalogOnly={isCatalogOnly} subdomain={tenant.subdomain} homeHref="/tema-onizleme" />
  </StorefrontPageShell></div>;
}
