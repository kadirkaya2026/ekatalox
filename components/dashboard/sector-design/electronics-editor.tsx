"use client";
import { useEffect, useState } from "react";
import { Check, ArrowUpRight, Save, Upload, Monitor, ShoppingBag, Package } from "lucide-react";
import { DESIGNS, type DesignDocument, type DesignContent, type DesignId, type SalesMode, defaultContent, newDesignDocument, prepareDesignUpdate, ELECTRONICS_SECTOR, designsForSector } from "@/lib/storefront/sector-design/config";

import { textilePalettes } from "@/components/storefront/sector-design/palette";

type Choice = { id: string; name: string };
type Field = { key: string; label: string; kind?: "area" | "image" | "category" | "product"; max?: number };
const heroFields: Field[] = [{ key: "heroTitle", label: "Ana başlık", max: 80 }, { key: "heroBody", label: "Açıklama", kind: "area", max: 180 }, { key: "heroImage", label: "Vitrin görseli", kind: "image" }, { key: "buttonLabel", label: "Buton yazısı", max: 32 }, { key: "heroCategoryId", label: "Butonun açacağı kategori", kind: "category" }];
const sections: Partial<Record<DesignId, { title: string; visible: string; fields: Field[] }[]>> = {
  "electronics-forma": [{ title: "Ana vitrin", visible: "heroVisible", fields: heroFields }, { title: "Koleksiyon alanı", visible: "collectionVisible", fields: [{ key: "collectionTitle", label: "Koleksiyon başlığı", max: 70 }, { key: "collectionBody", label: "Koleksiyon açıklaması", kind: "area", max: 160 }, { key: "collectionImage", label: "Koleksiyon görseli", kind: "image" }, { key: "collectionCategoryId", label: "Koleksiyon kategorisi", kind: "category" }] }],
  "electronics-akim": [{ title: "Tanıtım sahnesi", visible: "heroVisible", fields: heroFields }, { title: "Öne çıkan ürün sahnesi", visible: "featureVisible", fields: [{ key: "featureTitle", label: "Sahne başlığı", max: 70 }, { key: "featureBody", label: "Ürün açıklaması", kind: "area", max: 160 }, { key: "featureProductId", label: "Öne çıkan ürün", kind: "product" }, { key: "featureImage", label: "Sahne görseli", kind: "image" }] }],
  "electronics-modul": [{ title: "Mağaza karşılama alanı", visible: "heroVisible", fields: heroFields }, { title: "İkili kampanya alanı", visible: "promoVisible", fields: [{ key: "promoTitle", label: "Sol kampanya başlığı", max: 70 }, { key: "promoBody", label: "Sol kampanya açıklaması", kind: "area", max: 160 }, { key: "promoCategoryId", label: "Sol kampanya kategorisi", kind: "category" }, { key: "secondTitle", label: "Sağ kampanya başlığı", max: 70 }, { key: "secondBody", label: "Sağ kampanya açıklaması", kind: "area", max: 160 }, { key: "secondCategoryId", label: "Sağ kampanya kategorisi", kind: "category" }] }],
};

sections["food-hasat"] = [{ title: "Sofra vitrini", visible: "heroVisible", fields: heroFields }, { title: "Lezzet seçkisi", visible: "collectionVisible", fields: sections["electronics-forma"]![1].fields.map(f => ({ ...f, label: f.label.replace("Koleksiyon", "Seçki") })) }];
sections["food-mahalle"] = [{ title: "Market karşılama alanı", visible: "heroVisible", fields: heroFields }, { title: "Alışveriş kısayolları", visible: "promoVisible", fields: sections["electronics-modul"]![1].fields }];
sections["food-kiler"] = [{ title: "Tedarik kataloğu girişi", visible: "heroVisible", fields: heroFields }, { title: "Rafın öne çıkan ürünü", visible: "featureVisible", fields: sections["electronics-akim"]![1].fields }];
sections["textile-atelier"] = [{ title: "Editoryal vitrin", visible: "heroVisible", fields: heroFields }, { title: "Koleksiyon hikâyesi", visible: "collectionVisible", fields: sections["electronics-forma"]![1].fields }];
sections["textile-vitrin"] = [{ title: "Koleksiyon sahnesi", visible: "heroVisible", fields: heroFields }, { title: "İki koleksiyon kısayolu", visible: "promoVisible", fields: sections["electronics-modul"]![1].fields.map(f => ({ ...f, label: f.label.replace("kampanya", "koleksiyon") })) }];
sections["textile-seri"] = [{ title: "Katalog karşılama alanı", visible: "heroVisible", fields: heroFields }, { title: "Öne çıkan model", visible: "featureVisible", fields: sections["electronics-akim"]![1].fields.map(f => ({ ...f, label: f.label.replace("Sahne", "Model").replace("ürün", "model") })) }];
sections["hardware-usta"] = [{ title: "Ekipman vitrini", visible: "heroVisible", fields: heroFields }, { title: "Proje seçkisi", visible: "collectionVisible", fields: sections["electronics-forma"]![1].fields.map(f => ({...f, label: f.label.replace("Koleksiyon", "Proje")})) }];
sections["hardware-yapi"] = [{ title: "Mağaza karşılama alanı", visible: "heroVisible", fields: heroFields }, { title: "İki ihtiyaç alanı", visible: "promoVisible", fields: sections["electronics-modul"]![1].fields }];
sections["hardware-depo"] = [{ title: "Tedarik masası", visible: "heroVisible", fields: heroFields }, { title: "Öne çıkan ekipman", visible: "featureVisible", fields: sections["electronics-akim"]![1].fields }];

function ProductChoice({ value, onChange, products, previewOnly, disabled }: { value: string; onChange: (id: string) => void; products: Choice[]; previewOnly: boolean; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState(products);
  const [error, setError] = useState("");
  useEffect(() => {
    if (previewOnly || !query.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/tenant/settings/sector-design/products?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async response => { if (!response.ok) throw new Error("Ürünler yüklenemedi."); return response.json(); })
        .then(data => { setOptions(data.products); setError(""); })
        .catch(e => { if (e.name !== "AbortError") setError("Arama yapılamadı. Tekrar deneyin."); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, previewOnly]);
  const visible = !query.trim() ? products : previewOnly ? products.filter(p => p.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))) : options;
  const current = products.find(p => p.id === value) ?? options.find(p => p.id === value);
  return <span className="block space-y-2"><input aria-label="Öne çıkarılacak ürünü ara" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Tüm ürünlerinizde adıyla arayın..." value={query} disabled={disabled} onChange={e => setQuery(e.target.value)} /><select aria-label="Öne çıkan ürün" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={value} disabled={disabled} onChange={e => onChange(e.target.value)}><option value="">Otomatik: ilk görselli ürün</option>{visible.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}{value && !visible.some(p => p.id === value) && <option value={value}>{current?.name ?? "Kaydedilmiş ürün"}</option>}</select>{error && <span role="alert" className="block text-xs text-red-700">{error}</span>}</span>;
}

export function ElectronicsEditor({ initial, categories, products = [], previewUrl, previewOnly = false, onDraftChange, sector = ELECTRONICS_SECTOR }: { sector?: string; initial: DesignDocument | null; categories: Choice[]; products?: Choice[]; previewUrl?: string; previewOnly?: boolean; onDraftChange?: (doc: DesignDocument) => void }) {
  const [draft, setDraft] = useState<DesignDocument>(initial ?? newDesignDocument(designsForSector(sector)[0]?.id));
  const [saved, setSaved] = useState<DesignDocument | null>(initial);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const content = draft.content[draft.themeId] ?? defaultContent(draft.themeId);
  const values = content as Record<string, string | boolean | undefined>;
  useEffect(() => { onDraftChange?.(draft); }, [draft, onDraftChange]);
  function field(key: string, value: string | boolean) { setDraft(current => ({ ...current, content: { ...current.content, [current.themeId]: { ...(current.content[current.themeId] ?? defaultContent(current.themeId)), [key]: value } as DesignContent } })); setMessage(""); }
  function select(themeId: DesignId) { setDraft(current => ({ ...current, themeId, content: { ...current.content, [themeId]: current.content[themeId] ?? defaultContent(themeId) } })); setMessage(""); }
  async function save() {
    const result = prepareDesignUpdate(sector, { themeId: draft.themeId, mode: draft.mode, content }, saved);
    if ("error" in result) { setMessage(result.error ?? "Alanları kontrol edin."); setFailed(true); return; }
    if (previewOnly) { setSaved(draft); setFailed(false); setMessage("Yerel önizleme güncellendi. Canlı mağazaya kaydedilmedi."); return; }
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/tenant/settings/sector-design", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themeId: draft.themeId, mode: draft.mode, content }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tema kaydedilemedi.");
      setDraft(current => ({ ...data.design, content: { ...data.design.content, ...current.content, [data.design.themeId]: data.design.content[data.design.themeId] } })); setSaved(data.design); setFailed(false); setMessage("Tema ve bu temaya ait alanlar kaydedildi.");
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Bağlantı kurulamadı. Tekrar deneyin."); }
    finally { setPending(false); }
  }
  async function upload(key: string, file?: File) {
    if (!file) return;
    if (previewOnly) { setFailed(true); setMessage("Yerel önizlemede HTTPS görsel adresi kullanabilirsiniz. Dosya yükleme mağaza panelinde kullanılabilir."); return; }
    setUploading(key); setMessage("");
    try {
      const form = new FormData(); form.set("image", file);
      const response = await fetch("/api/tenant/settings/sector-design/image", { method: "POST", body: form });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Görsel yüklenemedi."); field(key, data.url);
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Görsel yüklenemedi."); }
    finally { setUploading(null); }
  }
  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15";
  function renderField(f: Field) {
    const value = typeof values[f.key] === "string" ? values[f.key] as string : "";
    return <label key={f.key} className="block space-y-2 text-sm font-medium text-slate-700"><span>{f.label}</span>
      {f.kind === "product" ? <ProductChoice value={value} onChange={id => field(f.key, id)} products={products} previewOnly={previewOnly} disabled={pending} /> : f.kind === "category" ? <select className={inputClass} value={value} disabled={pending} onChange={e => field(f.key, e.target.value)}><option value={"all"}>{"Tüm ürünler"}</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}{value && value !== "all" && !categories.some(x => x.id === value) && <option value={value}>Seçili kayıt ({value})</option>}</select>
      : f.kind === "area" ? <textarea className={inputClass} value={value} disabled={pending} maxLength={f.max} rows={3} onChange={e => field(f.key, e.target.value)} />
      : <input className={inputClass} type="text" value={value} disabled={pending} maxLength={f.kind === "image" ? 2048 : f.max} onChange={e => field(f.key, e.target.value)} placeholder={f.kind === "image" ? "https://... veya boş bırakın" : undefined} />}
      {f.kind === "image" && <><span className="block text-xs font-normal leading-5 text-slate-500">Boş bırakırsanız ürün görseli kullanılır. PNG, JPEG veya WebP; en fazla 5 MB.</span><span className="flex items-center gap-2 text-xs"><Upload size={14} /><input aria-label={`${f.label} yükle`} type="file" accept="image/png,image/jpeg,image/webp" disabled={pending || !!uploading} onChange={e => void upload(f.key, e.target.files?.[0])} /></span>{uploading === f.key && <span className="block text-xs" role="status">Görsel yükleniyor...</span>}</>}
    </label>;
  }
  return <div className="space-y-7 text-slate-900">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><p className="text-xs font-semibold text-emerald-800">{sector === "hirdavat" ? "Hırdavat, nalburiye ve yapı" : sector === "tekstil" ? "Tekstil, giyim ve ayakkabı" : sector === "gida" ? "Gıda ve içecek" : "Telefon aksesuarı ve elektronik"}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Mağazanıza bir karakter seçin.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Üç ayrı tasarım, her birine özel düzenleme alanları. Ürünleriniz ve fiyat listeleriniz korunur.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">{designsForSector(sector).map(design => <button key={design.id} type="button" disabled={pending || !!uploading} aria-pressed={draft.themeId === design.id} onClick={() => select(design.id)} className={`overflow-hidden rounded-xl border-2 text-left transition ${draft.themeId === design.id ? "border-emerald-700 ring-2 ring-emerald-700/10" : "border-slate-200 hover:border-slate-400"}`}><div className="relative aspect-[16/9] overflow-hidden bg-slate-100"><img className="h-full w-full object-cover object-top" src={`/temalar/${design.id}-desktop.png`} alt={`${design.name} mağaza görünümü`} />{draft.themeId === design.id && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-white"><Check size={13} />Seçili</span>}</div><div className="p-4"><h3 className="font-semibold">{design.name}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{design.description}</p></div></button>)}</div>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h3 className="text-lg font-semibold">Satış biçimi</h3><div className="mt-4 grid grid-cols-2 gap-3">{([{ id: "retail", title: "Perakende", icon: ShoppingBag, body: "Ürün ve görsel odaklı alışveriş." }, { id: "wholesale", title: "Toptan", icon: Package, body: "Model, paket ve koli bilgileriyle sipariş." }] as const).map(option => <button type="button" key={option.id} disabled={pending} aria-pressed={draft.mode === option.id} onClick={() => setDraft(current => ({ ...current, mode: option.id as SalesMode }))} className={`rounded-xl border p-4 text-left ${draft.mode === option.id ? "border-emerald-700 bg-emerald-50" : "border-slate-200"}`}><option.icon size={21} /><strong className="mt-2 block text-sm">{option.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{option.body}</span></button>)}</div><p className="mt-3 text-xs leading-5 text-slate-500">Bu seçim sunumu düzenler. Fiyat listeleri, ürün adetleri ve sipariş kuralları kendi ayarlarından yönetilir.</p></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h3 className="mb-5 text-lg font-semibold">{DESIGNS.find(d => d.id === draft.themeId)?.name} · Genel alanlar</h3><div className="space-y-4">{renderField({ key: "announcement", label: "Üst bilgi şeridi (isteğe bağlı)", max: 120 })}{renderField({ key: "catalogTitle", label: "Ürün bölümünün başlığı", max: 70 })}</div></div>
    {(draft.themeId in textilePalettes) && <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h3 className="text-lg font-semibold">Tema renkleri</h3><p className="mt-2 text-sm text-slate-500">Renkler bu temaya özel kaydedilir. Zemin renkleri gündüz görünümüne uygulanır.</p><div className="mt-5 grid gap-4 sm:grid-cols-3">{(["accentColor", "backgroundColor", "surfaceColor"] as const).map((key, i) => <label key={key} className="flex items-center gap-3 text-sm"><input type="color" aria-label={["Ana renk", "Sayfa zemini", "Vitrin ve vurgu zemini"][i]} value={String(values[key] || textilePalettes[draft.themeId as keyof typeof textilePalettes][i])} disabled={pending} onInput={e => field(key, e.currentTarget.value)} onChange={e => field(key, e.target.value)} className="h-11 w-14 cursor-pointer rounded border" />{["Ana renk", "Sayfa zemini", "Vitrin ve vurgu zemini"][i]}</label>)}</div><button type="button" className="mt-4 text-sm underline" disabled={pending} onClick={() => setDraft(current => { const next = { ...(current.content[current.themeId] ?? defaultContent(current.themeId)) }; delete next.accentColor; delete next.backgroundColor; delete next.surfaceColor; return { ...current, content: { ...current.content, [current.themeId]: next } }; })}>Varsayılan renklere dön</button></section>}
    {sections[draft.themeId]!.map(section => <section key={`${draft.themeId}-${section.visible}`} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><h3 className="text-lg font-semibold">{section.title}</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(values[section.visible])} disabled={pending} onChange={e => field(section.visible, e.target.checked)} className="size-4 accent-emerald-700" />Göster</label></div>{values[section.visible] && <div className="mt-6 grid gap-5 sm:grid-cols-2">{section.fields.map(renderField)}</div>}</section>)}
    <div className="sticky bottom-3 z-20 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-600">{dirty ? "Kaydedilmemiş değişiklikler var." : "Değişiklik yok."}</span><div className="flex gap-3">{previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm"><Monitor size={16} />Kaydedileni aç<ArrowUpRight size={14} /></a>}<button disabled={pending || !!uploading || !dirty} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{pending ? "Kaydediliyor..." : previewOnly ? "Önizlemeyi güncelle" : "Temayı ve alanları kaydet"}</button></div></div>{message && <p role={failed ? "alert" : "status"} className={`mt-3 text-sm ${failed ? "text-red-700" : "text-emerald-800"}`}>{message}</p>}</div>
  </div>;
}
