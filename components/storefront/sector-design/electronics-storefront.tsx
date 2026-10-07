"use client";
import { paletteStyle } from "./palette";

import { ArrowRight, ArrowUpRight, Search, ShoppingBag, Plus, Minus, Grid2X2, List, SlidersHorizontal, Package, Bell, X, ChevronRight, ChevronDown, LayoutGrid, Moon, Sun, PackageSearch } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Category, StorefrontProduct, TenantStorefrontSettings } from "@/lib/types";
import { type DesignDocument, type FormaContent, type AkimContent, type ModulContent, getDesignContent } from "@/lib/storefront/sector-design/config";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { ProductPrice } from "@/components/storefront/storefront-product-card";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { StorefrontLogoutButton } from "@/components/storefront/storefront-logout-button";
import styles from "./electronics.module.css";
import { SectorBrandLogo } from "@/components/storefront/sector-design/sector-brand-logo";
import { setAkimDayMode, useAkimDayMode } from "@/lib/storefront/akim-mode";
import { SectorBannerSlider } from "@/components/storefront/sector-design/sector-banner-slider";

export type SectorStorefrontProps = {
  tenantId: string; subdomain?: string;
  design: DesignDocument; settings: TenantStorefrontSettings; title: string; products: StorefrontProduct[];
  initialProducts: StorefrontProduct[]; categories: Category[]; selectedCategory: string; search: string; total: number; loading: boolean; detailOpen: boolean;
  cartCount: number; variantCounts: Map<string, number>; quantities: Map<string, number>; onSearch: (value: string) => void; onSearchSubmit: () => void;
  onCategory: (id: string) => void; onCart: () => void; onCampaigns: () => void; onDetail: (id: string) => void;
  onAdd: (id: string) => void; onDecrease: (id: string) => void; onMore: () => void; onHome: () => void;
  /** Sipariş Takip (/siparislerim) açıksa başlıkta ikon (bkz. hasOrderTracking; 7 Eki 2026). */
  orderTrackingHref?: string;
};
export const sectorUi = {
  tr: { trackOrders: "Siparişlerim", allCategories: "Tüm kategoriler", all: "Tüm ürünler", categories: "Kategoriler", discover: "Keşfet", search: "Ürün veya model ara", cart: "Sepetim", campaigns: "Kampanyalar", retail: "Ürün kataloğu", wholesale: "Toptan sipariş", products: "ürün", add: "Sepete ekle", remove: "Adedi azalt", detail: "Ürünü incele", catalog: "Kataloğa dön", more: "Daha fazla ürün", empty: "Aradığınız ürün bulunamadı.", emptyBody: "Başka bir arama yapın veya tüm ürünlere göz atın.", stock: "Stokta yok", package: "Paket", carton: "Koli", units: "adet", grid: "Izgara görünümü", list: "Liste görünümü", loading: "Ürünler yükleniyor", close: "Kapat" },
  en: { trackOrders: "My orders", allCategories: "All categories", all: "All products", categories: "Categories", discover: "Explore", search: "Search product or model", cart: "My cart", campaigns: "Campaigns", retail: "Product catalog", wholesale: "Wholesale orders", products: "products", add: "Add to cart", remove: "Decrease quantity", detail: "View product", catalog: "Back to catalog", more: "More products", empty: "No products found.", emptyBody: "Try another search or browse all products.", stock: "Out of stock", package: "Pack", carton: "Carton", units: "units", grid: "Grid view", list: "List view", loading: "Loading products", close: "Close" },
  de: { trackOrders: "Meine Bestellungen", allCategories: "Alle Kategorien", all: "Alle Produkte", categories: "Kategorien", discover: "Entdecken", search: "Produkt oder Modell suchen", cart: "Warenkorb", campaigns: "Aktionen", retail: "Produktkatalog", wholesale: "Großhandel", products: "Produkte", add: "In den Warenkorb", remove: "Menge verringern", detail: "Produkt ansehen", catalog: "Zum Katalog", more: "Weitere Produkte", empty: "Keine Produkte gefunden.", emptyBody: "Suchen Sie erneut oder sehen Sie alle Produkte an.", stock: "Nicht verfügbar", package: "Packung", carton: "Karton", units: "Stück", grid: "Rasteransicht", list: "Listenansicht", loading: "Produkte werden geladen", close: "Schließen" },
  ru: { trackOrders: "Мои заказы", allCategories: "Все категории", all: "Все товары", categories: "Категории", discover: "Смотреть", search: "Найти товар или модель", cart: "Корзина", campaigns: "Акции", retail: "Каталог товаров", wholesale: "Оптовый заказ", products: "товаров", add: "В корзину", remove: "Уменьшить количество", detail: "Открыть товар", catalog: "В каталог", more: "Больше товаров", empty: "Товары не найдены.", emptyBody: "Измените запрос или откройте все товары.", stock: "Нет в наличии", package: "Упаковка", carton: "Коробка", units: "шт.", grid: "Сетка", list: "Список", loading: "Загрузка товаров", close: "Закрыть" },
};

function ProductPhoto({ src, alt, priority = false }: { src: string | null; alt: string; priority?: boolean }) {
  if (src && !/^https:\/\//i.test(src) && !/^\/(?!\/)/.test(src)) return <Package size={48} aria-hidden="true" />;
  // Merchant-uploaded HTTPS images may use a host outside Next's optimizer allowlist.
  if (src && !src.startsWith("/") && !src.includes(".supabase.co/")) return <img src={src} alt={alt} className={styles.productPhoto} loading={priority ? "eager" : "lazy"} referrerPolicy="no-referrer" />;
  return src ? <StorefrontImage src={src} alt={alt} sizes="(max-width: 640px) 48vw, 400px" className={styles.productPhoto} priority={priority} /> : <Package size={48} aria-hidden="true" />;
}

export function ElectronicsStorefront(p: SectorStorefrontProps) {
  const { locale, setLocale } = useStorefrontLocale();
  const labels = sectorUi[locale];
  const theme = useStorefrontTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  // Akım: masaüstünde arama solunda "Tüm kategoriler" açılır paneli
  // (demotoptan'daki klasik başlık seçicisi gibi; 30 Eyl 2026, Autovale).
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointer = (event: PointerEvent) => { if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPickerOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [pickerOpen]);
  const [view, setView] = useState<"grid" | "list" | null>(null);
  const c = getDesignContent(p.design);
  const variant = p.design.themeId.replace("electronics-", "");
  const akimToggle = variant === "akim" && Boolean(p.settings.is_theme_toggle_visible);
  const akimDay = useAkimDayMode(akimToggle);
  const wholesale = p.design.mode === "wholesale";
  const listView = (view ?? (variant === "modul" && wholesale ? "list" : "grid")) === "list";
  const heroProduct = p.initialProducts.find(x => x.image_url);
  const featuredId = (c as AkimContent).featureProductId;
  const featured = featuredId ? p.initialProducts.find(x => x.id === featuredId) : heroProduct;
  const showLanding = !p.detailOpen && p.selectedCategory === "all" && !p.search.trim();
  const primaryCategories = p.categories.filter(x => !x.parent_id);
  const categoryName = p.categories.find(x => x.id === p.selectedCategory)?.name ?? c.catalogTitle;
  const rootStyle = { "--merchant-accent": p.settings.brand_primary_color || undefined } as CSSProperties;
  function choose(id: string, scroll = true) {
    p.onCategory(id); setMenuOpen(false); setPickerOpen(false);
    if (scroll) requestAnimationFrame(() => document.getElementById("sector-catalog")?.scrollIntoView({ behavior: "instant", block: "start" }));
  }
  function browseHero() { choose(c.heroCategoryId || "all"); }
  const search = <form className={styles.search} onSubmit={e => { e.preventDefault(); p.onSearchSubmit(); }} role="search"><Search size={19} aria-hidden="true" /><input aria-label={labels.search} placeholder={labels.search} value={p.search} onChange={e => p.onSearch(e.target.value)} /><button type="submit" aria-label={labels.search}><ArrowRight size={18} /></button></form>;
  const nav = <nav aria-label={labels.categories} className={styles.categoryNav}><button aria-pressed={p.selectedCategory === "all"} onClick={() => choose("all")}>{labels.all}</button>{primaryCategories.map(cat => <button key={cat.id} aria-pressed={p.selectedCategory === cat.id} onClick={() => choose(cat.id)}>{cat.name}</button>)}</nav>;
  const pickerLabel = p.selectedCategory === "all" ? labels.allCategories : (primaryCategories.find(x => x.id === p.selectedCategory)?.name ?? labels.allCategories);
  const picker = <div ref={pickerRef} className={styles.catPicker}>
    <button type="button" className={styles.catPickerButton} onClick={() => setPickerOpen(v => !v)} aria-expanded={pickerOpen} aria-haspopup="true"><LayoutGrid size={16} aria-hidden="true" /><span>{pickerLabel}</span><ChevronDown size={16} aria-hidden="true" className={pickerOpen ? styles.catPickerChevronOpen : undefined} /></button>
    {pickerOpen && <div className={styles.catPanel} role="menu">
      <button type="button" role="menuitem" className={styles.catPanelAll} aria-pressed={p.selectedCategory === "all"} onClick={() => choose("all")}><LayoutGrid size={17} aria-hidden="true" />{labels.all}</button>
      <div className={styles.catPanelGrid}>{primaryCategories.map(cat => { const img = cat.tile_image_url || p.initialProducts.find(x => x.category_id === cat.id && x.image_url)?.image_url || null; return <button type="button" role="menuitem" key={cat.id} aria-pressed={p.selectedCategory === cat.id} onClick={() => choose(cat.id)}><span className={styles.catPanelImage}><ProductPhoto src={img} alt="" /></span><span>{cat.name}</span></button>; })}</div>
    </div>}
  </div>;
  const heroImage = c.heroImage || heroProduct?.image_url || null;
  const heroCopy = <div className={styles.heroCopy}><span className={styles.heroKicker}>{wholesale ? labels.wholesale : labels.retail}</span><h1>{c.heroTitle}</h1><p>{c.heroBody}</p><button className={styles.primary} onClick={browseHero}>{c.buttonLabel || labels.discover}<ArrowUpRight size={19} /></button></div>;
  const photo = <div className={styles.heroPhoto}><ProductPhoto src={heroImage} alt={c.heroImage ? c.heroTitle : heroProduct?.product_name ?? ""} priority /></div>;
  return <div className={`${styles.root} ${styles[variant]} ${p.detailOpen ? styles.detailHeader : ""} ${(theme.isDark || variant === "akim") && !akimDay ? styles.dark : ""} ${akimDay ? styles.akimDay : ""}`} style={{...rootStyle,...paletteStyle(p.design, theme.isDark, akimDay)}} data-image-fit={c.imageFit||c.imagePosition?true:undefined} data-sector-design={p.design.themeId}>
    {c.announcement && <div data-theme-area="general" className={styles.announcement}>{c.announcement}</div>}
    <header className={styles.header}>
      <button data-theme-area="brand" className={styles.wordmark} onClick={p.onHome} aria-label={`${p.title} — ${labels.all}`}>
        <SectorBrandLogo logoUrl={p.settings.logo_url} title={p.title} className={styles.logo} fallback={<span className={styles.brandMark} aria-hidden="true"><span /><span /><span /></span>} />
      </button>
      <div className={`${styles.desktopSearch} ${variant === "akim" ? styles.withPicker : ""}`}>{variant === "akim" && picker}{search}</div>
      <div className={styles.headerActions}>
        <button className={styles.iconButton} onClick={p.onCampaigns} aria-label={labels.campaigns}><Bell size={20} /></button>
        {p.orderTrackingHref ? <a className={styles.iconButton} href={p.orderTrackingHref} aria-label={labels.trackOrders} title={labels.trackOrders}><PackageSearch size={20}/></a> : null}
        <select className={styles.language} aria-label="Language / Dil" value={locale} onChange={e => setLocale(e.target.value as typeof locale)}><option value="tr">TR</option><option value="en">EN</option><option value="de">DE</option><option value="ru">RU</option></select>
        {p.settings.is_theme_toggle_visible && variant !== "akim" && <span className={styles.themeToggle}><StorefrontThemeToggle /></span>}
        {akimToggle && <button type="button" className={styles.iconButton} onClick={() => setAkimDayMode(!akimDay)} aria-label={akimDay ? "Gece moduna geç" : "Gündüz moduna geç"} title={akimDay ? "Gece modu" : "Gündüz modu"}>{akimDay ? <Moon size={20} /> : <Sun size={20} />}</button>}
        <button className={styles.cart} aria-label={`${labels.cart} ${p.cartCount}`} onClick={p.onCart}><ShoppingBag size={20} /><span>{labels.cart}</span><b>{p.cartCount}</b></button>
        {p.subdomain && p.settings.is_logout_button_visible && <StorefrontLogoutButton subdomain={p.subdomain} tenantId={p.tenantId} />}
      </div>
    </header>
    <div className={styles.mobileSearch}>{search}</div>
    {variant !== "modul" && nav}
    {p.detailOpen ? null : <>
      {variant === "forma" && showLanding && c.heroVisible && <section data-theme-area="heroVisible" className={styles.formaHero}>{heroCopy}{photo}<span className={styles.heroSideNote}>{p.title} / {labels.discover}</span></section>}
      {variant === "akim" && showLanding && <SectorBannerSlider items={p.settings.banner_items ?? []} />}
      {variant === "akim" && showLanding && c.heroVisible && <section data-theme-area="heroVisible" className={styles.akimHero}><div className={styles.akimWord} aria-hidden="true">{p.title.toLocaleUpperCase("tr")}</div>{heroCopy}{photo}<div className={styles.akimCaption}>{heroProduct?.product_name}<ArrowUpRight size={25} /></div></section>}
      {variant === "modul" && <div className={styles.modulLanding}>
        <aside className={styles.sidebar}><h2><Grid2X2 size={19} />{labels.categories}</h2>{nav}</aside>
        {showLanding && c.heroVisible ? <section data-theme-area="heroVisible" className={styles.modulHero}>{heroCopy}{photo}</section> : <div className={styles.modulIntro}><h1>{categoryName}</h1><p>{wholesale ? labels.wholesale : labels.retail}</p></div>}
      </div>}
      {variant === "forma" && showLanding && <div className={styles.categoryTiles}>{primaryCategories.map((cat) => { const product = p.initialProducts.find(x => x.category_id === cat.id && x.image_url); return <button key={cat.id} onClick={() => choose(cat.id)}><span className={styles.categoryTileImage}><ProductPhoto src={cat.tile_image_url || product?.image_url || null} alt="" /></span><span>{cat.name}</span><ArrowUpRight size={17} /></button>; })}</div>}
      {variant === "modul" && showLanding && (c as ModulContent).promoVisible && <section data-theme-area="promoVisible" className={styles.promos}><button onClick={() => choose((c as ModulContent).promoCategoryId || "all")}><>{(c as ModulContent).promoImage && <ProductPhoto src={(c as ModulContent).promoImage ?? null} alt=""/>}</><span><strong>{(c as ModulContent).promoTitle}</strong><small>{(c as ModulContent).promoBody}</small></span><ArrowUpRight size={25} /></button><button onClick={() => choose((c as ModulContent).secondCategoryId || "all")}><>{(c as ModulContent).secondImage && <ProductPhoto src={(c as ModulContent).secondImage ?? null} alt=""/>}</><span><strong>{(c as ModulContent).secondTitle}</strong><small>{(c as ModulContent).secondBody}</small></span><ArrowUpRight size={25} /></button></section>}
      <section id="sector-catalog" className={styles.catalog} aria-busy={p.loading}>
        <div className={styles.catalogHeading}><div><p>{wholesale ? labels.wholesale : labels.retail}</p><h2 data-theme-area="general">{categoryName || labels.all}</h2></div><div className={styles.catalogControls}><span aria-live="polite">{p.total} {labels.products}</span><button onClick={() => setMenuOpen(!menuOpen)} className={styles.filter} aria-label={labels.categories} aria-expanded={menuOpen}><SlidersHorizontal size={19} /></button><button onClick={() => setView("grid")} aria-label={labels.grid} aria-pressed={!listView}><Grid2X2 size={19} /></button><button onClick={() => setView("list")} aria-label={labels.list} aria-pressed={listView}><List size={19} /></button></div></div>
        {menuOpen && <div className={styles.filterPanel}><button className={styles.filterClose} onClick={() => setMenuOpen(false)} aria-label={labels.close}><X size={20} /></button>{p.categories.map(cat => <button key={cat.id} aria-pressed={p.selectedCategory === cat.id} onClick={() => choose(cat.id)}>{cat.parent_id ? "↳ " : ""}{cat.name}<ChevronRight size={16} /></button>)}<button onClick={() => choose("all")}>{labels.all}</button></div>}
        <div className={`${styles.products} ${listView ? styles.listProducts : ""}`}>
          {p.products.map(product => { const quantity = (product.has_variants ? p.variantCounts : p.quantities).get(product.id) ?? 0; return <article className={styles.product} key={product.id}>
            <button className={styles.productImage} onClick={() => p.onDetail(product.id)} aria-label={`${labels.detail}: ${product.product_name}`}><ProductPhoto src={product.image_url} alt={product.product_name} />{product.discount_percentage != null && product.discount_percentage > 0 && <span className={styles.discount}>−%{Math.round(product.discount_percentage)}</span>}</button>
            <div className={styles.productInfo}><p className={styles.productCategory}>{p.categories.find(cat => cat.id === product.category_id)?.name}</p><button className={styles.productName} onClick={() => p.onDetail(product.id)}>{product.product_name}</button>{wholesale && <p className={styles.sku}>{product.sku_code}</p>}{wholesale && (product.package_quantity || product.carton_quantity) && <div className={styles.packInfo}>{product.package_quantity ? <span>{labels.package}: {product.package_quantity} {labels.units}</span> : null}{product.carton_quantity ? <span>{labels.carton}: {product.carton_quantity} {labels.units}</span> : null}</div>}</div>
            <div className={styles.productBottom}><div className={styles.price}><ProductPrice product={product} size="compact" /></div>{product.is_in_stock ? <div className={styles.stepper}>{quantity > 0 && <><button onClick={() => product.has_variants ? p.onCart() : p.onDecrease(product.id)} aria-label={`${product.has_variants ? labels.cart : labels.remove}: ${product.product_name}`}>{product.has_variants ? <ShoppingBag size={16} /> : <Minus size={16} />}</button><span aria-live="polite">{quantity}</span></>}<button onClick={() => p.onAdd(product.id)} aria-label={`${labels.add}: ${product.product_name}`}><Plus size={19} /></button></div> : <span className={styles.unavailable}>{labels.stock}</span>}</div>
          </article>; })}
        </div>
        {!p.products.length && !p.loading && <div className={styles.empty}><Search size={28} /><h3>{labels.empty}</h3><p>{labels.emptyBody}</p><button className={styles.primary} onClick={() => { p.onSearch(""); choose("all"); }}>{labels.all}<ArrowRight size={18} /></button></div>}
        {p.loading && <div className={styles.skeletons} aria-label={labels.loading}><div /><div /><div /></div>}
        {p.products.length < p.total && <button className={styles.loadMore} disabled={p.loading} onClick={p.onMore}>{p.loading ? labels.loading : labels.more}<ArrowRight size={18} /></button>}
      </section>
      {variant === "forma" && showLanding && (c as FormaContent).collectionVisible && <section data-theme-area="collectionVisible" className={styles.collection}><div className={styles.collectionPhoto}><ProductPhoto src={(c as FormaContent).collectionImage || p.initialProducts[1]?.image_url || heroImage} alt={(c as FormaContent).collectionTitle} /></div><div><h2>{(c as FormaContent).collectionTitle}</h2><p>{(c as FormaContent).collectionBody}</p><button className={styles.primary} onClick={() => choose((c as FormaContent).collectionCategoryId || "all")}>{labels.discover}<ArrowUpRight size={18} /></button></div></section>}
      {variant === "akim" && showLanding && (c as AkimContent).featureVisible && <section data-theme-area="featureVisible" className={styles.feature}><div><p>{labels.discover}</p><h2>{(c as AkimContent).featureTitle}</h2><p>{(c as AkimContent).featureBody}</p>{featured && <button className={styles.primary} onClick={() => p.onDetail(featured.id)}>{labels.detail}<ArrowUpRight size={19} /></button>}</div><div className={styles.featurePhoto}><ProductPhoto src={(c as AkimContent).featureImage || featured?.image_url || null} alt={featured?.product_name ?? ""} /></div></section>}
      {p.settings.is_footer_visible && <footer className={styles.footer}><strong>{p.title}</strong><span>{wholesale ? labels.wholesale : labels.retail}</span><button onClick={() => choose("all")}>{labels.all}<ArrowUpRight size={17} /></button></footer>}
    </>}
  </div>;
}
