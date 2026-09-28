"use client";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Search, ShoppingBag, Plus, Minus, Grid2X2, List, SlidersHorizontal, Package, Bell, X, ChevronRight } from "lucide-react";
import { type SectorStorefrontProps, sectorUi } from "./electronics-storefront";
import { getDesignContent, type FormaContent, type ModulContent, type AkimContent } from "@/lib/storefront/sector-design/config";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { StorefrontLogoutButton } from "@/components/storefront/storefront-logout-button";
import { ProductPrice } from "@/components/storefront/storefront-product-card";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { paletteStyle } from "./palette";
import s from "./homeware.module.css";
import { SectorBrandLogo } from "@/components/storefront/sector-design/sector-brand-logo";

function Photo({src,alt,priority=false,sizes="(max-width:640px) 46vw, 440px"}:{src?:string|null;alt:string;priority?:boolean;sizes?:string}) {
  if (!src || (!/^https:\/\//i.test(src) && !/^\/(?!\/)/.test(src))) return <Package size={38} aria-hidden="true" />;
  return src.startsWith("/") || src.includes(".supabase.co/") ? <StorefrontImage src={src} alt={alt} sizes={sizes} className={s.photo} priority={priority} /> : <img className={s.photo} src={src} alt={alt} loading={priority ? "eager" : "lazy"} referrerPolicy="no-referrer" />;
}
export function HomewareStorefront(p:SectorStorefrontProps) {
  const {locale,setLocale}=useStorefrontLocale(); const t=sectorUi[locale]; const theme=useStorefrontTheme();
  const selectOptions = {tr:"Seçenekleri seç",en:"Choose options",de:"Optionen wählen",ru:"Выбрать варианты"}[locale];
  const variant=p.design.themeId.replace("homeware-",""); const wholesale=p.design.mode==="wholesale";
  const [view,setView]=useState<"list"|"grid"|null>(null); const [filters,setFilters]=useState(false);
  const list=(view ?? (variant==="istif"?"list":"grid"))==="list";
  const c=getDesignContent(p.design); const roots=p.categories.filter(x=>!x.parent_id);
  const landing=!p.detailOpen && p.selectedCategory==="all" && !p.search.trim();
  const heroProduct=p.initialProducts.find(x=>x.image_url); const image=c.heroImage || "/temalar/homeware/yuva-banner.png";
  const featured=p.initialProducts.find(x=>x.id===(c as AkimContent).featureProductId) ?? heroProduct;
  const heading=p.categories.find(x=>x.id===p.selectedCategory)?.name ?? c.catalogTitle;
  function choose(id:string){p.onCategory(id);setFilters(false);requestAnimationFrame(()=>document.getElementById("sector-catalog")?.scrollIntoView({behavior:"instant",block:"start"}));}
  const search=<form className={s.search} role="search" onSubmit={e=>{e.preventDefault();p.onSearchSubmit();}}><Search size={19}/><input aria-label={t.search} placeholder={t.search} value={p.search} onChange={e=>p.onSearch(e.target.value)}/><button aria-label={t.search}><ArrowRight size={19}/></button></form>;
  const navigation=<nav className={s.categoryNav} aria-label={t.categories}><button aria-pressed={p.selectedCategory==="all"} onClick={()=>choose("all")}><Grid2X2 size={17}/>{t.all}</button>{roots.map(cat=><button key={cat.id} aria-pressed={p.selectedCategory===cat.id} onClick={()=>choose(cat.id)}>{cat.name}<ChevronRight size={14}/></button>)}</nav>;
  const heroCopy=<div className={s.heroCopy}><p className={s.kicker}>{wholesale?t.wholesale:t.retail}</p><h1>{c.heroTitle}</h1><p className={s.heroBody}>{c.heroBody}</p><button className={s.primary} onClick={()=>choose(c.heroCategoryId || "all")}>{c.buttonLabel || t.discover}<ArrowUpRight size={19}/></button></div>;
  const categoryTiles=<div className={s.categoryTiles}>{roots.map(cat=><button key={cat.id} onClick={()=>choose(cat.id)}><span className={s.categoryPhoto}><Photo src={cat.tile_image_url || p.initialProducts.find(x=>x.category_id===cat.id)?.image_url} alt=""/></span><span>{cat.name}</span></button>)}</div>;
  const promos=c as ModulContent;
  const retailBanner=<section data-theme-area="heroVisible" className={s.retailBanner}>{heroCopy}{variant==="sofra" && !c.heroImage ? <div className={s.productStage}>{p.initialProducts.filter(x=>x.image_url).slice(0,3).map((x,i)=><button key={x.id} className={s.stageItem} onClick={()=>p.onDetail(x.id)} aria-label={`${t.detail}: ${x.product_name}`}><span className={s.stageNumber}>0{i+1}</span><span className={s.stagePhoto}><Photo src={x.image_url} alt={x.product_name} priority sizes="(max-width:640px) 35vw, 300px"/></span><span className={s.stageName}>{x.product_name}</span><ArrowUpRight size={20}/></button>)}</div> : <div className={s.bannerImage}><Photo src={image} alt="" priority sizes="(max-width:640px) 100vw, 55vw"/></div>}</section>;
  const promoImage=(id:string)=>p.categories.find(cat=>cat.id===id)?.tile_image_url || p.initialProducts.find(x=>x.category_id===id)?.image_url;
  return <div className={`${s.root} ${s[variant]} ${theme.isDark?s.dark:""} ${p.detailOpen?s.detailHeader:""}`} style={paletteStyle(p.design, theme.isDark)} data-image-fit={c.imageFit||c.imagePosition?true:undefined} data-sector-design={p.design.themeId}>
    {c.announcement && <div data-theme-area="general" className={s.announcement}>{c.announcement}</div>}
    <header className={s.header}>
      <button data-theme-area="brand" className={s.brand} onClick={p.onHome} aria-label={`${p.title} — ${t.all}`}><SectorBrandLogo logoUrl={p.settings.logo_url} title={p.title}/></button>
      <div className={s.desktopSearch}>{search}</div><div className={s.actions}>
        <button className={s.icon} aria-label={t.campaigns} onClick={p.onCampaigns}><Bell size={20}/></button>
        <select aria-label="Language / Dil" value={locale} onChange={e=>setLocale(e.target.value as typeof locale)}><option value="tr">TR</option><option value="en">EN</option><option value="de">DE</option><option value="ru">RU</option></select>
        {p.settings.is_theme_toggle_visible && <StorefrontThemeToggle/>}
        <button className={s.cart} aria-label={`${t.cart} ${p.cartCount}`} onClick={p.onCart}><ShoppingBag size={19}/><span>{t.cart}</span><b>{p.cartCount}</b></button>
        {p.subdomain && p.settings.is_logout_button_visible && <StorefrontLogoutButton subdomain={p.subdomain} tenantId={p.tenantId}/>}
      </div>
    </header><div className={s.mobileSearch}>{search}</div>
    <div className={s.navBand}>{navigation}</div>
    {!p.detailOpen && <>
      
      {variant==="sofra" && landing && categoryTiles}
      {variant==="yuva" && landing && c.heroVisible && retailBanner}
      {variant==="sofra" && landing && c.heroVisible && retailBanner}
      {variant==="yuva" && landing && categoryTiles}
      {variant==="sofra" && landing && promos.promoVisible && <section data-theme-area="promoVisible" className={s.promos}><button onClick={()=>choose(promos.promoCategoryId || "all")}><span><strong>{promos.promoTitle}</strong><small>{promos.promoBody}</small><span className={s.promoLink}>{t.discover}<ArrowUpRight size={17}/></span></span><div className={s.promoPhoto}><Photo src={promos.promoImage || promoImage(promos.promoCategoryId) || p.initialProducts[0]?.image_url} alt=""/></div></button><button onClick={()=>choose(promos.secondCategoryId || "all")}><span><strong>{promos.secondTitle}</strong><small>{promos.secondBody}</small><span className={s.promoLink}>{t.discover}<ArrowUpRight size={17}/></span></span><div className={s.promoPhoto}><Photo src={promos.secondImage || promoImage(promos.secondCategoryId) || p.initialProducts[1]?.image_url} alt=""/></div></button></section>}
      <div className={s.catalogLayout}>
        {variant==="istif" && <aside className={s.sidebar}><h2>{t.categories}</h2>{navigation}<div className={s.sidebarNote}><Package size={23}/><strong>{wholesale?t.wholesale:t.retail}</strong><p>{c.heroBody}</p></div></aside>}
        <div className={s.catalogMain}>
          {variant==="istif" && landing && c.heroVisible && <section data-theme-area="heroVisible" className={s.istifHero}>{c.heroImage && <div className={s.bannerImage}><Photo src={c.heroImage} alt="" sizes="60vw"/></div>}{heroCopy}</section>}
          <section id="sector-catalog" className={s.catalog} aria-busy={p.loading}>
            <div className={s.catalogHeading}><div><p className={s.kicker}>{wholesale?t.wholesale:t.retail}</p><h2 data-theme-area="general">{heading}</h2></div><div className={s.controls}><span>{p.total} {t.products}</span><button aria-label={t.categories} aria-expanded={filters} onClick={()=>setFilters(!filters)}><SlidersHorizontal size={19}/></button><button aria-label={t.grid} aria-pressed={!list} onClick={()=>setView("grid")}><Grid2X2 size={18}/></button><button aria-label={t.list} aria-pressed={list} onClick={()=>setView("list")}><List size={19}/></button></div></div>
            {filters && <div className={s.filters}><button className={s.filterClose} aria-label={t.close} onClick={()=>setFilters(false)}><X size={20}/></button><button onClick={()=>choose("all")}>{t.all}</button>{p.categories.map(cat=><button key={cat.id} aria-pressed={p.selectedCategory===cat.id} onClick={()=>choose(cat.id)}>{cat.parent_id?"↳ ":""}{cat.name}<ChevronRight size={15}/></button>)}</div>}
            <div className={`${s.products} ${list?s.list:""}`}>
              {p.products.map(product=>{const quantity=(product.has_variants?p.variantCounts:p.quantities).get(product.id)??0;return <article key={product.id} className={s.product}>
                <button className={s.productImage} aria-label={`${t.detail}: ${product.product_name}`} onClick={()=>p.onDetail(product.id)}><Photo src={product.image_url} alt={product.product_name}/>{!!product.discount_percentage && product.discount_percentage>0 && <span className={s.discount}>−%{Math.round(product.discount_percentage)}</span>}</button>
                <div className={s.productInfo}><p className={s.productCategory}>{p.categories.find(cat=>cat.id===product.category_id)?.name}</p><button className={s.productName} onClick={()=>p.onDetail(product.id)}>{product.product_name}</button>{product.has_variants && <div className={s.variants} aria-label={locale === "tr" ? "Ürün seçenekleri" : "Product options"}>{product.variants.slice(0,4).map(v=><span key={v.id} className={!v.is_purchasable?s.soldOut:""}>{v.model_name}</span>)}{product.variants.length>4 && <span>+{product.variants.length-4}</span>}</div>}{wholesale && <><p className={s.sku}>{product.sku_code}</p><div className={s.pack}>{product.package_quantity?<span>{t.package}: {product.package_quantity} {t.units}</span>:null}{product.carton_quantity?<span>{t.carton}: {product.carton_quantity} {t.units}</span>:null}</div></>}</div>
                <div className={s.productBottom}><ProductPrice product={product} size="compact"/>{product.is_in_stock?<div className={s.stepper}>{quantity>0 && <><button aria-label={`${product.has_variants?t.cart:t.remove}: ${product.product_name}`} onClick={()=>product.has_variants?p.onCart():p.onDecrease(product.id)}>{product.has_variants?<ShoppingBag size={16}/>:<Minus size={16}/>}</button><span aria-live="polite">{quantity}</span></>}<button className={s.addButton} aria-label={`${product.has_variants?selectOptions:t.add}: ${product.product_name}`} onClick={()=>p.onAdd(product.id)}>{product.has_variants?selectOptions:<><Plus size={17}/><span>{t.add}</span></>}</button></div>:<span className={s.sku}>{t.stock}</span>}</div>
              </article>;})}
            </div>
            {!p.products.length && !p.loading && <div className={s.empty}><Search size={30}/><h3>{t.empty}</h3><p>{t.emptyBody}</p><button className={s.primary} onClick={()=>{p.onSearch("");choose("all");}}>{t.all}<ArrowRight size={18}/></button></div>}
            {p.loading && <p className={s.empty} role="status">{t.loading}</p>}
            {p.products.length<p.total && <button className={s.loadMore} disabled={p.loading} onClick={p.onMore}>{p.loading?t.loading:t.more}<ArrowRight size={18}/></button>}
          </section>
        </div>
      </div>
      {variant==="yuva" && landing && (c as FormaContent).collectionVisible && <section data-theme-area="collectionVisible" className={s.collection}><div className={s.collectionImage}><Photo src={(c as FormaContent).collectionImage || promoImage((c as FormaContent).collectionCategoryId) || p.initialProducts[0]?.image_url} alt={(c as FormaContent).collectionTitle}/></div><div><h2>{(c as FormaContent).collectionTitle}</h2><p>{(c as FormaContent).collectionBody}</p><button className={s.primary} onClick={()=>choose((c as FormaContent).collectionCategoryId || "all")}>{t.discover}<ArrowUpRight size={19}/></button></div></section>}
      {variant==="istif" && landing && (c as AkimContent).featureVisible && featured && <section data-theme-area="featureVisible" className={s.feature}><div><p className={s.kicker}>{t.discover}</p><h2>{(c as AkimContent).featureTitle}</h2><p>{(c as AkimContent).featureBody}</p><button className={s.primary} onClick={()=>p.onDetail(featured.id)}>{t.detail}<ArrowUpRight size={18}/></button></div><div className={s.featureImage}><Photo src={(c as AkimContent).featureImage || featured.image_url} alt={featured.product_name}/></div></section>}
      {p.settings.is_footer_visible && <footer className={s.footer}><strong>{p.title}</strong><span>{wholesale?t.wholesale:t.retail}</span><button onClick={()=>choose("all")}>{t.all}<ArrowRight size={18}/></button></footer>}

    </>}
  </div>;
}
