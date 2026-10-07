"use client";
import { paletteStyle } from "./palette";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Search, ShoppingBag, Plus, Minus, Grid2X2, List, SlidersHorizontal, Package, Bell, X, ChevronRight, Leaf, ShoppingBasket, PackageSearch } from "lucide-react";
import { type SectorStorefrontProps, sectorUi } from "./electronics-storefront";
import { getDesignContent, type FormaContent, type ModulContent, type AkimContent } from "@/lib/storefront/sector-design/config";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { StorefrontLogoutButton } from "@/components/storefront/storefront-logout-button";
import { ProductPrice } from "@/components/storefront/storefront-product-card";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import s from "./food.module.css";
import { SectorBrandLogo } from "@/components/storefront/sector-design/sector-brand-logo";

function Photo({src,alt,priority=false}:{src?:string|null;alt:string;priority?:boolean}) {
  if (!src || (!/^https:\/\//i.test(src) && !/^\/(?!\/)/.test(src))) return <Package size={38} aria-hidden="true" />;
  return src.startsWith("/") || src.includes(".supabase.co/") ? <StorefrontImage src={src} alt={alt} sizes="(max-width:640px) 46vw, 440px" className={s.photo} priority={priority} /> : <img className={s.photo} src={src} alt={alt} loading={priority ? "eager" : "lazy"} referrerPolicy="no-referrer" />;
}
export function FoodStorefront(p:SectorStorefrontProps) {
  const {locale,setLocale}=useStorefrontLocale(); const t=sectorUi[locale]; const theme=useStorefrontTheme();
  const variant=p.design.themeId.replace("food-",""); const wholesale=p.design.mode==="wholesale";
  const [view,setView]=useState<"list"|"grid"|null>(null); const [filters,setFilters]=useState(false);
  const list=(view ?? (variant==="kiler" && wholesale ? "list":"grid"))==="list";
  const c=getDesignContent(p.design); const roots=p.categories.filter(x=>!x.parent_id);
  const landing=!p.detailOpen && p.selectedCategory==="all" && !p.search.trim();
  const heroProduct=p.initialProducts.find(x=>x.image_url); const image=c.heroImage || heroProduct?.image_url;
  const featured=p.initialProducts.find(x=>x.id===(c as AkimContent).featureProductId) ?? heroProduct;
  const heading=p.categories.find(x=>x.id===p.selectedCategory)?.name ?? c.catalogTitle;
  function choose(id:string){p.onCategory(id);setFilters(false);requestAnimationFrame(()=>document.getElementById("sector-catalog")?.scrollIntoView({behavior:"instant",block:"start"}));}
  const search=<form className={s.search} role="search" onSubmit={e=>{e.preventDefault();p.onSearchSubmit();}}><Search size={19}/><input aria-label={t.search} placeholder={t.search} value={p.search} onChange={e=>p.onSearch(e.target.value)}/><button aria-label={t.search}><ArrowRight size={19}/></button></form>;
  const navigation=<nav className={s.categoryNav} aria-label={t.categories}><button aria-pressed={p.selectedCategory==="all"} onClick={()=>choose("all")}><Grid2X2 size={17}/>{t.all}</button>{roots.map(cat=><button key={cat.id} aria-pressed={p.selectedCategory===cat.id} onClick={()=>choose(cat.id)}>{cat.name}<ChevronRight size={14}/></button>)}</nav>;
  const heroCopy=<div className={s.heroCopy}><p className={s.kicker}>{wholesale?t.wholesale:t.retail}</p><h1>{c.heroTitle}</h1><p className={s.heroBody}>{c.heroBody}</p><button className={s.primary} onClick={()=>choose(c.heroCategoryId || "all")}>{c.buttonLabel || t.discover}<ArrowUpRight size={19}/></button></div>;
  const categoryTiles=<div className={s.categoryTiles}>{roots.map(cat=><button key={cat.id} onClick={()=>choose(cat.id)}><span className={s.categoryPhoto}><Photo src={cat.tile_image_url || p.initialProducts.find(x=>x.category_id===cat.id)?.image_url} alt=""/></span><span>{cat.name}</span></button>)}</div>;
  const promos=c as ModulContent;
  return <div className={`${s.root} ${s[variant]} ${theme.isDark?s.dark:""} ${p.detailOpen?s.detailHeader:""}`} style={paletteStyle(p.design,theme.isDark)} data-image-fit={c.imageFit||c.imagePosition?true:undefined} data-sector-design={p.design.themeId}>
    {c.announcement && <div data-theme-area="general" className={s.announcement}>{c.announcement}</div>}
    <header className={s.header}>
      <button data-theme-area="brand" className={s.brand} onClick={p.onHome} aria-label={`${p.title} — ${t.all}`}><SectorBrandLogo logoUrl={p.settings.logo_url} title={p.title} fallback={variant==="hasat"?<Leaf size={29}/>:<ShoppingBasket size={28}/>}/></button>
      <div className={s.desktopSearch}>{search}</div><div className={s.actions}>
        <button className={s.icon} aria-label={t.campaigns} onClick={p.onCampaigns}><Bell size={20}/></button>
        {p.orderTrackingHref ? <a className={s.icon} href={p.orderTrackingHref} aria-label={t.trackOrders} title={t.trackOrders}><PackageSearch size={20}/></a> : null}
        <select aria-label="Language / Dil" value={locale} onChange={e=>setLocale(e.target.value as typeof locale)}><option value="tr">TR</option><option value="en">EN</option><option value="de">DE</option><option value="ru">RU</option></select>
        {p.settings.is_theme_toggle_visible && <StorefrontThemeToggle/>}
        <button className={s.cart} aria-label={`${t.cart} ${p.cartCount}`} onClick={p.onCart}><ShoppingBag size={19}/><span>{t.cart}</span><b>{p.cartCount}</b></button>
        {p.subdomain && p.settings.is_logout_button_visible && <StorefrontLogoutButton subdomain={p.subdomain} tenantId={p.tenantId}/>}
      </div>
    </header><div className={s.mobileSearch}>{search}</div>
    {variant==="hasat" && navigation}
    {!p.detailOpen && <>
      {variant==="hasat" && landing && c.heroVisible && <section data-theme-area="heroVisible" className={s.hasatHero}>{heroCopy}<div className={s.harvestImage}><Photo src={image} alt={c.heroImage?c.heroTitle:heroProduct?.product_name??""} priority/></div></section>}
      {variant==="mahalle" && <><div className={s.mahalleCategories}>{categoryTiles}</div>{landing && c.heroVisible && <section data-theme-area="heroVisible" className={s.mahalleHero}>{heroCopy}<div className={s.marketImage}><Photo src={image} alt={c.heroImage?c.heroTitle:heroProduct?.product_name??""} priority/></div></section>}{landing && promos.promoVisible && <section data-theme-area="promoVisible" className={s.promos}><button onClick={()=>choose(promos.promoCategoryId || "all")}><>{promos.promoImage && <Photo src={promos.promoImage} alt=""/>}</><span><strong>{promos.promoTitle}</strong><small>{promos.promoBody}</small></span><ArrowRight size={24}/></button><button onClick={()=>choose(promos.secondCategoryId || "all")}><>{promos.secondImage && <Photo src={promos.secondImage} alt=""/>}</><span><strong>{promos.secondTitle}</strong><small>{promos.secondBody}</small></span><ArrowRight size={24}/></button></section>}</>}
      {variant==="hasat" && landing && categoryTiles}
      <div className={s.catalogLayout}>
        {variant==="kiler" && <aside className={s.sidebar}><h2>{t.categories}</h2>{navigation}</aside>}
        <div className={s.catalogMain}>
          {variant==="kiler" && landing && c.heroVisible && <section data-theme-area="heroVisible" className={s.kilerHero}>{heroCopy}<div className={s.kilerImage}><Photo src={image} alt={c.heroImage?c.heroTitle:heroProduct?.product_name??""} priority/></div></section>}
          <section id="sector-catalog" className={s.catalog} aria-busy={p.loading}>
            <div className={s.catalogHeading}><div><p className={s.kicker}>{wholesale?t.wholesale:t.retail}</p><h2 data-theme-area="general">{heading}</h2></div><div className={s.controls}><span>{p.total} {t.products}</span><button aria-label={t.categories} aria-expanded={filters} onClick={()=>setFilters(!filters)}><SlidersHorizontal size={19}/></button><button aria-label={t.grid} aria-pressed={!list} onClick={()=>setView("grid")}><Grid2X2 size={18}/></button><button aria-label={t.list} aria-pressed={list} onClick={()=>setView("list")}><List size={19}/></button></div></div>
            {filters && <div className={s.filters}><button className={s.filterClose} aria-label={t.close} onClick={()=>setFilters(false)}><X size={20}/></button><button onClick={()=>choose("all")}>{t.all}</button>{p.categories.map(cat=><button key={cat.id} aria-pressed={p.selectedCategory===cat.id} onClick={()=>choose(cat.id)}>{cat.parent_id?"↳ ":""}{cat.name}<ChevronRight size={15}/></button>)}</div>}
            <div className={`${s.products} ${list?s.list:""}`}>
              {p.products.map(product=>{const quantity=(product.has_variants?p.variantCounts:p.quantities).get(product.id)??0;return <article key={product.id} className={s.product}>
                <button className={s.productImage} aria-label={`${t.detail}: ${product.product_name}`} onClick={()=>p.onDetail(product.id)}><Photo src={product.image_url} alt={product.product_name}/>{!!product.discount_percentage && product.discount_percentage>0 && <span className={s.discount}>−%{Math.round(product.discount_percentage)}</span>}</button>
                <div className={s.productInfo}><p className={s.productCategory}>{p.categories.find(cat=>cat.id===product.category_id)?.name}</p><button className={s.productName} onClick={()=>p.onDetail(product.id)}>{product.product_name}</button>{wholesale && <><p className={s.sku}>{product.sku_code}</p><div className={s.pack}>{product.package_quantity?<span>{t.package}: {product.package_quantity} {t.units}</span>:null}{product.carton_quantity?<span>{t.carton}: {product.carton_quantity} {t.units}</span>:null}</div></>}</div>
                <div className={s.productBottom}><ProductPrice product={product} size="compact"/>{product.is_in_stock?<div className={s.stepper}>{quantity>0 && <><button aria-label={`${product.has_variants?t.cart:t.remove}: ${product.product_name}`} onClick={()=>product.has_variants?p.onCart():p.onDecrease(product.id)}>{product.has_variants?<ShoppingBag size={16}/>:<Minus size={16}/>}</button><span aria-live="polite">{quantity}</span></>}<button aria-label={`${t.add}: ${product.product_name}`} onClick={()=>p.onAdd(product.id)}><Plus size={19}/></button></div>:<span className={s.sku}>{t.stock}</span>}</div>
              </article>;})}
            </div>
            {!p.products.length && !p.loading && <div className={s.empty}><Search size={30}/><h3>{t.empty}</h3><p>{t.emptyBody}</p><button className={s.primary} onClick={()=>{p.onSearch("");choose("all");}}>{t.all}<ArrowRight size={18}/></button></div>}
            {p.loading && <p className={s.empty} role="status">{t.loading}</p>}
            {p.products.length<p.total && <button className={s.loadMore} disabled={p.loading} onClick={p.onMore}>{p.loading?t.loading:t.more}<ArrowRight size={18}/></button>}
          </section>
        </div>
      </div>
      {variant==="hasat" && landing && (c as FormaContent).collectionVisible && <section data-theme-area="collectionVisible" className={s.collection}><div className={s.collectionImage}><Photo src={(c as FormaContent).collectionImage || p.initialProducts[1]?.image_url} alt={(c as FormaContent).collectionTitle}/></div><div><Leaf size={32}/><h2>{(c as FormaContent).collectionTitle}</h2><p>{(c as FormaContent).collectionBody}</p><button className={s.primary} onClick={()=>choose((c as FormaContent).collectionCategoryId || "all")}>{t.discover}<ArrowUpRight size={19}/></button></div></section>}
      {variant==="kiler" && landing && (c as AkimContent).featureVisible && featured && <section data-theme-area="featureVisible" className={s.feature}><div><p className={s.kicker}>{t.discover}</p><h2>{(c as AkimContent).featureTitle}</h2><p>{(c as AkimContent).featureBody}</p><button className={s.primary} onClick={()=>p.onDetail(featured.id)}>{t.detail}<ArrowUpRight size={18}/></button></div><div className={s.featureImage}><Photo src={(c as AkimContent).featureImage || featured.image_url} alt={featured.product_name}/></div></section>}
      {p.settings.is_footer_visible && <footer className={s.footer}><strong>{p.title}</strong><span>{wholesale?t.wholesale:t.retail}</span><button onClick={()=>choose("all")}>{t.all}<ArrowRight size={18}/></button></footer>}
      {p.cartCount>0 && <button className={s.mobileCart} onClick={p.onCart}><ShoppingBag size={20}/><span>{t.cart}</span><b>{p.cartCount}</b><ArrowRight size={20}/></button>}
    </>}
  </div>;
}
