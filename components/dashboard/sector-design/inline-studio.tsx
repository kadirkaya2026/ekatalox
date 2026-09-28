"use client";
import { useEffect, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type CSSProperties } from "react";
import { Pencil, X } from "lucide-react";
import { SectorPreviewFrame } from "./preview-frame";
import { sections, ProductChoice, type Field } from "./electronics-editor";
import { textilePalettes } from "@/components/storefront/sector-design/palette";
import { DESIGNS, defaultContent, designsForSector, getDesignContent, newDesignDocument, prepareDesignUpdate, readDesignDocument, type DesignContent, type DesignDocument, type DesignId } from "@/lib/storefront/sector-design/config";
import { publicationRevision, previousPublication } from "@/lib/storefront/sector-design/publication";
import s from "./inline-studio.module.css";

type Props = ComponentProps<typeof SectorPreviewFrame> & { initialTheme?: DesignId };
const generalFields: Field[] = [{key:"announcement",label:"Üst bilgi şeridi",max:120},{key:"catalogTitle",label:"Ürün bölümünün başlığı",max:70}];
export function InlineThemeStudio(props: Props) {
  const sector = props.tenant.sector!;
  const [saved,setSaved] = useState<DesignDocument|null>(()=>readDesignDocument(props.settings.sector_design,sector));
  const [draft,setDraft] = useState<DesignDocument>(()=>{
    const stored=readDesignDocument(props.settings.sector_design,sector);
    const id=DESIGNS.find(d=>d.id===props.initialTheme)?.id ?? stored?.themeId ?? designsForSector(sector)[0].id;
    return {...(stored??newDesignDocument(id)),themeId:id,content:{...stored?.content,[id]:stored?.content[id]??defaultContent(id)}};
  });
  const [baseline,setBaseline] = useState(draft);
  const [revision,setRevision] = useState(()=>publicationRevision(props.settings.sector_design));
  const [baselineRevision,setBaselineRevision]=useState(revision);
  const [previous,setPrevious] = useState(()=>previousPublication(props.settings.sector_design,sector));
  const [recovery,setRecovery] = useState<{document:DesignDocument;revision:string;date:string}|null>(null);
  const [storageReady,setStorageReady] = useState(false);
  const [phone,setPhone] = useState(false);
  const phoneFrame=useRef<HTMLIFrameElement>(null);
  const storageKey=`ekx-theme-draft:${props.tenant.id}:${draft.themeId}`;
  const sessionId=useRef("");
  const [storageConflict,setStorageConflict]=useState(false);
  const [area,setArea] = useState<string|null>(null);
  const [editing,setEditing] = useState(true);
  const [pending,setPending] = useState(false);
  const [uploading,setUploading] = useState<string|null>(null);
  const [message,setMessage] = useState("");
  const [failed,setFailed] = useState(false);
  const [hover,setHover] = useState<{key:string;top:number;left:number}|null>(null);
  const panel = useRef<HTMLElement>(null);
  const toolbar = useRef<HTMLElement>(null);
  const [toolbarHeight,setToolbarHeight]=useState(80);
  useEffect(()=>{const observer=new ResizeObserver(entries=>setToolbarHeight(entries[0].contentRect.height+24));if(toolbar.current)observer.observe(toolbar.current);return ()=>observer.disconnect();},[]);
  const activeElement = useRef<HTMLElement|null>(null);
  const content=getDesignContent(draft);
  const values=content as Record<string,string|boolean|undefined>;
  const themeSections=useMemo(()=>sections[draft.themeId]??[],[draft.themeId]);
  const active=themeSections.find(x=>x.visible===area);
  const palette=textilePalettes[draft.themeId as keyof typeof textilePalettes];
  const dirty=JSON.stringify(draft)!==JSON.stringify(baseline);
  const needsPublication=dirty||draft.themeId!==saved?.themeId;
  useEffect(()=>{
    sessionId.current=crypto.randomUUID();
    // Local storage is unavailable during server rendering; hydrate the recovery prompt after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { const raw=localStorage.getItem(storageKey); if(raw){const stored=JSON.parse(raw);const document=readDesignDocument(stored.document,sector);if(document&&document.themeId===draft.themeId&&typeof stored.revision==="string")setRecovery({document,revision:stored.revision,date:stored.date});} }
    catch { setFailed(true);setMessage("Bu tarayıcıda taslak kaydı kullanılamıyor. Sekmeyi kapatmadan yayınlayın."); }
    setStorageReady(true);
    const changed=(e:StorageEvent)=>{if(e.key===storageKey&&e.newValue){try{if(JSON.parse(e.newValue).session!==sessionId.current){setStorageConflict(true);setFailed(true);setMessage("Bu temanın taslağı başka sekmede değişti. Bu sekmede otomatik taslak kaydı durduruldu; açık değişiklikleriniz korunuyor.");}}catch{}}};
    window.addEventListener("storage",changed);return ()=>window.removeEventListener("storage",changed);
  },[storageKey,sector,draft.themeId]);
  useEffect(()=>{
    if(!storageReady||recovery||storageConflict||!dirty)return;
    const persist=()=>{try{localStorage.setItem(storageKey,JSON.stringify({document:draft,revision,date:new Date().toISOString(),session:sessionId.current}));}catch{setFailed(true);setMessage("Taslak cihazda saklanamadı. Sekmeyi kapatmadan yayınlayın.");}};
    const timer=setTimeout(persist,350);window.addEventListener("pagehide",persist);
    return ()=>{clearTimeout(timer);window.removeEventListener("pagehide",persist);};
  },[draft,revision,storageKey,storageReady,recovery,storageConflict,dirty]);
  useEffect(()=>{
    const send=()=>phoneFrame.current?.contentWindow?.postMessage({type:"ekx-theme-draft",document:draft,editing},location.origin);
    const ready=(e:MessageEvent)=>{if(e.origin!==location.origin||e.source!==phoneFrame.current?.contentWindow)return;if(e.data?.type==="ekx-theme-ready")send();if(e.data?.type==="ekx-theme-area"&&["brand","general",...themeSections.map(x=>x.visible)].includes(e.data.area))setArea(e.data.area);};
    send();window.addEventListener("message",ready);return ()=>window.removeEventListener("message",ready);
  },[draft,phone,editing,themeSections]);
  function clearStored(){try{localStorage.removeItem(storageKey);}catch{}}
  function discard(){setDraft(baseline);setRevision(baselineRevision);setArea(null);setHover(null);setRecovery(null);clearStored();setFailed(false);setMessage("Taslak değişiklikleri geri alındı.");}

  const busy=pending||!!uploading||!!recovery;
  const title=area==="brand"?"Mağaza adı ve logo":area==="images"?"Görsel yerleşimi":area==="general"?"Yazılar ve duyuru":area==="colors"?"Tema renkleri":area==="mode"?"Satış biçimi":active?.title??"Alanı düzenle";
  useEffect(()=>{
    if(!dirty || props.fixture) return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[dirty,props.fixture]);
  useEffect(()=>{
    if (!area) return;
    const previous=document.activeElement as HTMLElement|null;
    panel.current?.focus();
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setArea(null);previous?.focus();}};
    window.addEventListener("keydown",escape);
    return ()=>window.removeEventListener("keydown",escape);
  },[area]);
  useEffect(()=>{
    const clear=()=>setHover(null);
    window.addEventListener("scroll",clear,{passive:true});window.addEventListener("resize",clear);
    return ()=>{window.removeEventListener("scroll",clear);window.removeEventListener("resize",clear);};
  },[]);
  function field(key:string,value:string|boolean){setDraft(d=>({...d,content:{...d.content,[d.themeId]:{...getDesignContent(d),[key]:value} as DesignContent}}));setMessage("");}
  function openArea(key:string){setEditing(true);setArea(key);setHover(null);}
  function inspect(event:MouseEvent<HTMLDivElement>){
    if(!editing||busy||(event.target as Element).closest("[data-inline-control]"))return;
    const element=(event.target as Element).closest<HTMLElement>("[data-theme-area]");
    if(!element){if(activeElement.current){activeElement.current=null;setHover(null);}return;}
    if(activeElement.current===element)return;
    activeElement.current=element;
    const rect=element.getBoundingClientRect();
    setHover({key:element.dataset.themeArea!,top:Math.max(toolbarHeight+8,rect.top+10),left:Math.min(window.innerWidth-175,Math.max(10,rect.left+12))});
  }
  function selectArea(event:MouseEvent<HTMLDivElement>){
    if(!editing||(event.target as Element).closest("[data-inline-control]"))return;
    const element=(event.target as Element).closest<HTMLElement>("[data-theme-area]");
    if(!element)return;
    event.preventDefault();event.stopPropagation();
    if(!busy)openArea(element.dataset.themeArea!);
  }
  async function upload(key:string,file?:File){
    if(!file)return;
    if(props.fixture){setMessage("Örnek incelemede görsel bağlantısı kullanın. Dosya yükleme gerçek panelde kullanılabilir.");setFailed(false);return;}
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5*1024*1024){setMessage("PNG, JPEG veya WebP seçin; en fazla 5 MB.");setFailed(true);return;}
    setUploading(key);setMessage("");
    try{const form=new FormData();form.set("image",file);const response=await fetch("/api/tenant/settings/sector-design/image",{method:"POST",body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||"Görsel yüklenemedi.");field(key,data.url);}
    catch(error){setFailed(true);setMessage(error instanceof Error?error.message:"Görsel yüklenemedi.");}finally{setUploading(null);}
  }
  async function publish(restore=false){
    if(busy)return;
    const validation=prepareDesignUpdate(sector,{themeId:draft.themeId,mode:draft.mode,content},saved);
    if("error" in validation){setMessage(validation.error??"Alanları kontrol edin.");setFailed(true);return;}
    if(props.fixture){setMessage("Örnek inceleme: değişiklikler vitrinde görünüyor; canlı mağazaya yayın yapılmadı.");setFailed(false);return;}
    setPending(true);setMessage("");
    try{const response=await fetch("/api/tenant/settings/sector-design",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({themeId:draft.themeId,mode:draft.mode,content,baseRevision:revision,restore})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Tema yayınlanamadı.");setSaved(data.design);setDraft(data.design);setBaseline(data.design);setRevision(data.revision);setBaselineRevision(data.revision);setPrevious(data.previous);setRecovery(null);clearStored();try{localStorage.setItem("ekx-theme-published",JSON.stringify({tenant:props.tenant.id,revision:data.revision}));}catch{}setFailed(false);setMessage("Tema kaydedildi ve mağazanızda yayınlandı.");}
    catch(error){setFailed(true);setMessage(error instanceof Error?error.message:"Yayınlanamadı. Taslağınız korunuyor.");}finally{setPending(false);}
  }
  function renderField(f:Field){
    const value=typeof values[f.key]==="string"?values[f.key] as string:"";
    return <label key={f.key}>{f.label}{f.kind==="product"?<ProductChoice value={value} onChange={id=>field(f.key,id)} products={props.products.map(p=>({id:p.id,name:p.product_name}))} previewOnly={!!props.fixture} disabled={busy}/>:f.kind==="category"?<select value={value} disabled={busy} onChange={e=>field(f.key,e.target.value)}><option value="all">Tüm ürünler</option>{props.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}{value&&value!=="all"&&!props.categories.some(c=>c.id===value)&&<option value={value}>Kaydedilmiş kategori</option>}</select>:f.kind==="area"?<textarea value={value} maxLength={f.max} rows={4} disabled={busy} onChange={e=>field(f.key,e.target.value)}/>:<input value={value} maxLength={f.kind==="image"?2048:f.max} disabled={busy} placeholder={f.kind==="image"?"https://… veya boş bırakın":undefined} onChange={e=>field(f.key,e.target.value)}/>}{f.kind==="image"&&<><small>PNG, JPEG veya WebP · En fazla 5 MB. Boş bırakırsanız varsayılan görsel kullanılır.</small><input aria-label={`${f.label} yükle`} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>void upload(f.key,e.target.files?.[0])}/>{uploading===f.key&&<small role="status">Görsel yükleniyor…</small>}</>}</label>;
  }
  return <div className={s.studio} style={{"--studio-toolbar-height":`${toolbarHeight}px`} as CSSProperties}>
    <header ref={toolbar} className={s.toolbar}><div><strong>{props.tenant.company_name} · {DESIGNS.find(d=>d.id===draft.themeId)?.name}</strong><p>{props.fixture?"Örnek ürünlerle yerel inceleme":dirty?"Yayınlanmamış taslak · Bu cihazda saklanır":needsPublication?"Seçilen tema henüz yayınlanmadı":"Mağazanızın kayıtlı görünümü"}</p></div><div className={s.actions}>
      <button aria-pressed={editing} disabled={busy} onClick={()=>{setEditing(!editing);setArea(null);setHover(null);}}>{editing?"Önizlemeyi dene":"Düzenlemeye dön"}</button>
      <select aria-label="Düzenlenecek alan" value={area??""} disabled={busy} onChange={e=>{if(e.target.value)openArea(e.target.value);}}><option value="">Alan seç</option><option value="brand">Mağaza adı ve logo</option><option value="general">Yazılar ve duyuru</option><option value="images">Görsel yerleşimi</option>{themeSections.map(x=><option key={x.visible} value={x.visible}>{x.title}{!values[x.visible]?" (gizli)":""}</option>)}{palette&&<option value="colors">Tema renkleri</option>}<option value="mode">Satış biçimi</option></select>
      <button disabled={busy||!dirty} onClick={discard}>Vazgeç</button>
      <button className={s.publish} disabled={busy||!needsPublication||!!recovery} onClick={()=>void publish()}>{pending?"Yayınlanıyor…":"Kaydet ve yayınla"}</button>
      <button aria-pressed={phone} onClick={()=>{setPhone(!phone);setHover(null);}}>{phone?"Masaüstü":"Telefon"}</button>
      {previous&&<button disabled={busy||dirty||!!recovery} onClick={()=>void publish(true)}>Önceki yayına dön</button>}
      {!props.fixture&&<a href={`https://${props.tenant.subdomain}.ekatalox.com`} target="_blank" rel="noopener noreferrer">Mağazayı aç ↗</a>}
    </div></header>
    {recovery&&<div className={s.status} role="status">Bu cihazda {new Date(recovery.date).toLocaleString("tr-TR")} tarihli bir taslak var. {recovery.revision!==revision&&"Taslağın ardından mağaza güncellenmiş; doğrudan yayınlanamaz."} <button onClick={()=>{setDraft(recovery.document);setRevision(recovery.revision);setRecovery(null);}}>Taslağa devam et</button> <button onClick={()=>{setRecovery(null);clearStored();}}>Taslağı sil</button></div>}
    {phone&&<div className={s.phoneWrap}><iframe ref={phoneFrame} title="Telefon görünümü" src={typeof window!=="undefined"?`${location.pathname}?priceList=${encodeURIComponent(props.priceListId)}`:undefined}/></div>}
    {message&&<p role={failed?"alert":"status"} className={s.status} data-error={failed}>{message}</p>}
    {editing&&<p className={s.status}>Düzenlemek için banner veya yazının üzerine gelin ve tıklayın. Telefonda alana dokunun.</p>}
    <div className={s.canvas} style={phone?{display:"none"}:undefined} data-editing={editing} data-panel={!!area} onMouseOver={inspect} onMouseLeave={()=>{activeElement.current=null;setHover(null);}} onClickCapture={selectArea}><SectorPreviewFrame {...props} designDocument={draft}/>{editing&&hover&&!area&&<button data-inline-control className={s.hint} style={{top:hover.top,left:hover.left}} onClick={()=>openArea(hover.key)}><Pencil size={14}/>{themeSections.find(x=>x.visible===hover.key)?.title??"Yazı"} · Düzenle</button>}</div>
    <aside ref={panel} tabIndex={-1} hidden={!area} className={s.panel} aria-label={title} style={!area?{display:"none"}:undefined}>
      <div className={s.panelHeader}><h2>{title}</h2><button aria-label="Alan ayarlarını kapat" onClick={()=>setArea(null)}><X size={18}/></button></div>
      <div className={s.fields}>
        {active&&<><button className={s.toggle} type="button" role="switch" aria-label="Bu alanı mağazada göster" aria-checked={!!values[active.visible]} disabled={busy} onClick={()=>field(active.visible,!values[active.visible])}>{values[active.visible]?"● Gösteriliyor":"○ Gizli"} · Bu alanı mağazada göster</button>{active.fields.map(renderField)}</>}
        {area==="brand"&&([{key:"storefrontTitle",label:"Mağaza adı",max:80},{key:"logoUrl",label:"Mağaza logosu",kind:"image"}] as Field[]).map(renderField)}
        {area==="images"&&<><label>Banner görselleri<select disabled={busy} value={String(values.imageFit||"contain")} onChange={e=>field("imageFit",e.target.value)}><option value="contain">Tamamını göster</option><option value="cover">Alanı doldur</option></select></label><label>Görsel odağı<select disabled={busy} value={String(values.imagePosition||"center")} onChange={e=>field("imagePosition",e.target.value)}>{[["center","Orta"],["top","Üst"],["bottom","Alt"],["left","Sol"],["right","Sağ"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><small>Banner için 1600 × 1000, kampanya kartları için 900 × 600, logo için 400 × 400 piksel önerilir. Alanı doldur seçimi görselin kenarlarını kırpabilir.</small></>}
        {area==="general"&&generalFields.map(renderField)}
        {area==="colors"&&palette&&(["accentColor","backgroundColor","surfaceColor"] as const).map((key,i)=><label key={key}>{["Ana renk","Sayfa zemini","Vitrin ve vurgu zemini"][i]}<input type="color" value={String(values[key]||(i===0&&draft.themeId.startsWith("electronics-")?props.settings.brand_primary_color:null)||palette[i])} disabled={busy} onInput={e=>field(key,e.currentTarget.value)} onChange={e=>field(key,e.target.value)}/></label>)}
        {area==="mode"&&<label>Satış biçimi<select value={draft.mode} disabled={busy} onChange={e=>setDraft(d=>({...d,mode:e.target.value as DesignDocument["mode"]}))}><option value="retail">Perakende</option><option value="wholesale">Toptan</option></select><small>Bu seçim sunumu değiştirir; fiyat ve sipariş kuralları kendi ayarlarında korunur.</small></label>}
        <small>Değişiklikleri mağazada anında görürsünüz. Yayına almak için üstteki Kaydet ve yayınla düğmesini kullanın.</small>
      </div>
    </aside>
  </div>;
}
