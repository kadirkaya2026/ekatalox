import { z } from "zod";

export const ELECTRONICS_SECTOR = "telefon-aksesuar";
export const FOOD_SECTOR = "gida";
export const COSMETICS_SECTOR = "kozmetik";
export const HARDWARE_SECTOR = "hirdavat";
export const TEXTILE_SECTOR = "tekstil";
export const DESIGN_IDS = ["electronics-forma", "electronics-akim", "electronics-modul", "food-hasat", "food-mahalle", "food-kiler", "textile-atelier", "textile-vitrin", "textile-seri", "hardware-usta", "hardware-yapi", "hardware-depo", "cosmetics-duru", "cosmetics-aura", "cosmetics-rituel"] as const;
export function designSector(id: DesignId) { return id.startsWith("cosmetics-") ? COSMETICS_SECTOR : id.startsWith("hardware-") ? HARDWARE_SECTOR : id.startsWith("textile-") ? TEXTILE_SECTOR : id.startsWith("food-") ? FOOD_SECTOR : ELECTRONICS_SECTOR; }
export function hasSectorDesign(sector: string | null | undefined) { return sector === ELECTRONICS_SECTOR || sector === FOOD_SECTOR || sector === TEXTILE_SECTOR || sector === HARDWARE_SECTOR || sector === COSMETICS_SECTOR; }
export function designsForSector(sector: string | null | undefined) { return DESIGNS.filter(d => designSector(d.id) === sector); }
export type DesignId = typeof DESIGN_IDS[number];
export type SalesMode = "retail" | "wholesale";
const text = (max: number) => z.string().trim().max(max);
const image = z.string().max(2048).refine((v) => !v || /^https:\/\/[^\s]+$/i.test(v) || /^\/(?!\/)[^\s]*$/.test(v), "Görsel için HTTPS adresi kullanın.");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();
const common = { accentColor: color, backgroundColor: color, surfaceColor: color, announcement: text(120), catalogTitle: text(70), heroVisible: z.boolean(), heroTitle: text(80), heroBody: text(180), heroImage: image, buttonLabel: text(32), heroCategoryId: text(100) };
export const formaSchema = z.object({ ...common, collectionVisible: z.boolean(), collectionTitle: text(70), collectionBody: text(160), collectionImage: image, collectionCategoryId: text(100) }).strict();
export const akimSchema = z.object({ ...common, featureVisible: z.boolean(), featureTitle: text(70), featureBody: text(160), featureProductId: text(100), featureImage: image }).strict();
export const modulSchema = z.object({ ...common, promoVisible: z.boolean(), promoTitle: text(70), promoBody: text(160), promoCategoryId: text(100), secondTitle: text(70), secondBody: text(160), secondCategoryId: text(100) }).strict();
export type FormaContent = z.infer<typeof formaSchema>;
export type AkimContent = z.infer<typeof akimSchema>;
export type ModulContent = z.infer<typeof modulSchema>;
export type DesignContent = FormaContent | AkimContent | ModulContent;
export type DesignDocument = { version: 1; themeId: DesignId; mode: SalesMode; content: Partial<Record<DesignId, DesignContent>> };

export const DESIGNS = [
  { id: "electronics-forma", name: "Forma", description: "Ferah ürün vitrini. Asimetrik tanıtım, görselli koleksiyon ve geniş ürün kartları.", color: "#c94824", overlayTheme: "minimal", font: "dm-sans" },
  { id: "electronics-akim", name: "Akım", description: "Koyu bir teknoloji sahnesi. Büyük tipografi, ürün odak noktası ve yatay keşif alanları.", color: "#d7ff5f", overlayTheme: "noir", font: "plus-jakarta" },
  { id: "electronics-modul", name: "Modül", description: "Kategorileri öne çıkaran mağaza. Çift kampanya alanı, raf görünümü ve hızlı sipariş satırları.", color: "#146354", overlayTheme: "neutral", font: "source-sans" },
  { id: "food-hasat", name: "Hasat", description: "Doğal tonlar, büyük gıda vitrini ve görselli kategori rafları. Seçkilerini öne çıkaran mağazalar için.", color: "#416439", overlayTheme: "minimal", font: "dm-sans" },
  { id: "food-mahalle", name: "Mahalle", description: "Canlı market vitrini. Kategori kısayolları, iki kampanya alanı ve kolay ulaşılır sepet.", color: "#a52d3d", overlayTheme: "neutral", font: "plus-jakarta" },
  { id: "food-kiler", name: "Kiler", description: "Düzenli tedarik kataloğu. Solda kategoriler, paket ve koli bilgileri, hızlı sipariş listesi.", color: "#285861", overlayTheme: "neutral", font: "source-sans" },
  { id: "textile-atelier", name: "Atölye", description: "Editoryal moda vitrini. Büyük dikey fotoğraf, sade tipografi ve koleksiyon hikâyesi.", color: "#594338", overlayTheme: "minimal", font: "dm-sans" },
  { id: "textile-vitrin", name: "Vitrin", description: "Koleksiyonları öne çıkaran mağaza. İkili görsel sahne ve kategorilere açılan keşif alanları.", color: "#993645", overlayTheme: "neutral", font: "plus-jakarta" },
  { id: "textile-seri", name: "Seri", description: "Model ve beden odaklı katalog. Solda kategoriler, yoğun ürün sunumu ve hızlı sipariş listesi.", color: "#354a60", overlayTheme: "neutral", font: "source-sans" },
  { id: "hardware-usta", name: "Usta", description: "Güçlü ekipman vitrini. Büyük ürün sahnesi, numaralı kategori rehberi ve proje seçkisi.", color: "#ba421e", overlayTheme: "minimal", font: "plus-jakarta" },
  { id: "hardware-yapi", name: "Yapı", description: "Ferah yapı mağazası. Görselli kategoriler, iki ihtiyaç alanı ve açık ürün rafları.", color: "#245c50", overlayTheme: "neutral", font: "dm-sans" },
  { id: "hardware-depo", name: "Depo", description: "Profesyonel tedarik masası. Kategori dizini, ürün kodları ve toptan sipariş listesi.", color: "#2b516d", overlayTheme: "neutral", font: "source-sans" },
  { id: "cosmetics-duru", name: "Duru", description: "Sade bakım vitrini. Editoryal başlık, tek ürün sahnesi ve rutin seçkisi.", color: "#58694d", overlayTheme: "minimal", font: "dm-sans" },
  { id: "cosmetics-aura", name: "Aura", description: "Canlı güzellik mağazası. İkili ürün sahnesi, koleksiyon kısayolları ve görselli kategoriler.", color: "#993f55", overlayTheme: "neutral", font: "plus-jakarta" },
  { id: "cosmetics-rituel", name: "Ritüel", description: "Düzenli bakım kataloğu. Kategori dizini, ürün kodları ve toptan sipariş listesi.", color: "#356974", overlayTheme: "neutral", font: "source-sans" },
] as const;
export function isDesignId(value: unknown): value is DesignId { return DESIGN_IDS.includes(value as DesignId); }
export function schemaFor(id: DesignId) { return (id === "electronics-forma" || id === "food-hasat" || id === "textile-atelier" || id === "hardware-usta" || id === "cosmetics-duru") ? formaSchema : (id === "electronics-akim" || id === "food-kiler" || id === "textile-seri" || id === "hardware-depo" || id === "cosmetics-rituel") ? akimSchema : modulSchema; }
export function defaultContent(id: DesignId): DesignContent {
  if (id.startsWith("cosmetics-")) {
    const base = { announcement: "", catalogTitle: "Bakım seçkinizi oluşturun", heroVisible: true, heroTitle: "Kendinize ayırdığınız o an.", heroBody: "Günlük bakımınıza eşlik eden ürünleri keşfedin. Kendi rutininizi, kendi tercihlerinize göre tamamlayın.", heroImage: "", buttonLabel: "Seçkiyi keşfet", heroCategoryId: "all" };
    if (id === "cosmetics-duru") return { ...base, collectionVisible: true, collectionTitle: "Günün küçük bakım molası.", collectionBody: "Birlikte kullanmayı sevdiğiniz ürünlerle kendinize ait bir seçki oluşturun.", collectionImage: "", collectionCategoryId: "all" };
    if (id === "cosmetics-aura") return { ...base, heroTitle: "Güzelliğin kendi ritminde.", heroBody: "Renkler, dokular ve günlük favoriler. Sizi yansıtan ürünlerle tanışın.", promoVisible: true, promoTitle: "Bakımınıza yer açın.", promoBody: "Günlük rutininize eşlik edecek ürünleri keşfedin.", promoCategoryId: "all", secondTitle: "Renginizi bulun.", secondBody: "Makyaj seçkisini yakından inceleyin.", secondCategoryId: "all" };
    return { ...base, heroTitle: "Her bakımın bir düzeni var.", heroBody: "Kategorilerden ilerleyin, ürünleri karşılaştırın. Mağazanızın veya günlük bakımınızın ihtiyaçlarını tamamlayın.", buttonLabel: "Kataloğu incele", featureVisible: true, featureTitle: "Rutininizde ona yer açın.", featureBody: "Seçili ürünün detaylarını ve sipariş seçeneklerini inceleyin.", featureProductId: "", featureImage: "" };
  }
  if (id.startsWith("hardware-")) {
    const base = { announcement: "", catalogTitle: "İşinize uygun ekipman", heroVisible: true, heroTitle: "İyi iş, doğru aletle başlar.", heroBody: "El aletlerinden montaj malzemelerine, ihtiyacınız olan parçayı bulun. Projenizi tamamlayın.", heroImage: "", buttonLabel: "Ürünleri incele", heroCategoryId: "all" };
    if (id === "hardware-usta") return { ...base, collectionVisible: true, collectionTitle: "Bir sonraki işinize hazır olun.", collectionBody: "Tamir, montaj ve bakım için birlikte kullanacağınız ürünleri seçin.", collectionImage: "", collectionCategoryId: "all" };
    if (id === "hardware-yapi") return { ...base, heroTitle: "Küçük tamirler. Büyük yenilikler.", heroBody: "Evinizden atölyenize, her ihtiyaca uygun ürünleri keşfedin.", promoVisible: true, promoTitle: "Sağlam bir başlangıç.", promoBody: "Vida, dübel ve bağlantı elemanlarını inceleyin.", promoCategoryId: "all", secondTitle: "Son dokunuşu tamamlayın.", secondBody: "Tamir ve bakım ürünlerini keşfedin.", secondCategoryId: "all" };
    return { ...base, heroTitle: "Malzemeniz hazır. Sıra işinizde.", heroBody: "Ürün koduyla arayın, ölçü ve ambalaj bilgilerini karşılaştırın. Sipariş listenizi tek yerde hazırlayın.", featureVisible: true, featureTitle: "Tezgâhın öne çıkanı.", featureBody: "Ürün detaylarını ve mevcut sipariş seçeneklerini inceleyin.", featureProductId: "", featureImage: "" };
  }
  if (id.startsWith("textile-")) {
    const textile = { announcement: "", catalogTitle: "Koleksiyonu keşfedin", heroVisible: true, heroTitle: "Stil, detaylarda başlar.", heroBody: "Dokular, kesimler ve birlikte güzel duran parçalar. Kendi seçkinizi oluşturun.", heroImage: "", buttonLabel: "Koleksiyonu incele", heroCategoryId: "all" };
    if (id === "textile-atelier") return { ...textile, collectionVisible: true, collectionTitle: "Bir araya gelen parçalar.", collectionBody: "Gardırobunuzda yer açacağınız modelleri yakından inceleyin.", collectionImage: "", collectionCategoryId: "all" };
    if (id === "textile-vitrin") return { ...textile, heroTitle: "Kendin gibi giyin.", heroBody: "Günün her anına eşlik eden parçaları ve koleksiyonları keşfedin.", promoVisible: true, promoTitle: "Günün stilini bul.", promoBody: "Birlikte kullanabileceğiniz parçaları inceleyin.", promoCategoryId: "all", secondTitle: "Detaylarla tamamla.", secondBody: "Koleksiyonun diğer modellerine göz atın.", secondCategoryId: "all" };
    return { ...textile, heroTitle: "Koleksiyonunuz. Düzenli bir katalogda.", heroBody: "Modelleri karşılaştırın, uygun beden ve renk seçenekleriyle siparişinizi hazırlayın.", featureVisible: true, featureTitle: "Koleksiyonun odak noktası.", featureBody: "Seçili modelin detaylarını ve mevcut seçeneklerini keşfedin.", featureProductId: "", featureImage: "" };
  }
  if (id.startsWith("food-")) {
    const food = { announcement: "", catalogTitle: "Raflarımızdan seçin", heroVisible: true, heroTitle: "Sofranıza iyi gelen seçimler.", heroBody: "Kahvaltıdan akşam yemeğine, mutfağınızın ihtiyaçlarını tek bir yerde keşfedin.", heroImage: "", buttonLabel: "Alışverişe başla", heroCategoryId: "all" };
    if (id === "food-hasat") return { ...food, collectionVisible: true, collectionTitle: "Sofranın etrafında buluşalım.", collectionBody: "Birlikte güzel giden lezzetleri seçin, sofranızı kendi zevkinize göre tamamlayın.", collectionImage: "", collectionCategoryId: "all" };
    if (id === "food-mahalle") return { ...food, heroTitle: "Mahallenizin marketi, elinizin altında.", heroBody: "Günlük ihtiyaçlarınızı bulun, sepetinizi hazırlayın ve siparişinizi iletin.", promoVisible: true, promoTitle: "Kahvaltıya ne alalım?", promoBody: "Güne eşlik eden lezzetleri keşfedin.", promoCategoryId: "all", secondTitle: "Mutfakta eksik kalmasın.", secondBody: "Temel gıda ürünlerine göz atın.", secondCategoryId: "all" };
    return { ...food, heroTitle: "Rafınızın ihtiyacı. Tek bir katalog.", heroBody: "Ürünleri inceleyin, paket ve koli seçenekleriyle siparişinizi hazırlayın.", buttonLabel: "Kataloğu incele", featureVisible: true, featureTitle: "Rafın öne çıkanı.", featureBody: "Ürün bilgilerini ve sipariş seçeneklerini yakından inceleyin.", featureProductId: "", featureImage: "" };
  }
  const base = { announcement: "", catalogTitle: "Ürünleri keşfedin", heroVisible: true, heroTitle: "Günlük hayatın yeni favorileri.", heroBody: "İşinize, masanıza ve hayatınıza eşlik edecek teknoloji ve aksesuarları keşfedin.", heroImage: "", buttonLabel: "Ürünleri keşfet", heroCategoryId: "all" };
  if (id === "electronics-forma") return { ...base, collectionVisible: true, collectionTitle: "Küçük detaylar. Büyük fark.", collectionBody: "Tarzınıza ve ihtiyaçlarınıza uyan aksesuarlarla tanışın.", collectionImage: "", collectionCategoryId: "all" };
  if (id === "electronics-akim") return { ...base, heroTitle: "Teknoloji. Kendi ritminde.", heroBody: "Bağlantıda kalmak, üretmek ve keyif almak için seçiminizi yapın.", featureVisible: true, featureTitle: "Yakından tanışın.", featureBody: "Bir sonraki favorinizin detaylarını keşfedin.", featureProductId: "", featureImage: "" };
  return { ...base, heroTitle: "Aradığınız teknoloji, burada.", heroBody: "Kategorilere göz atın, ürünleri karşılaştırın ve siparişinizi kolayca oluşturun.", promoVisible: true, promoTitle: "İhtiyacınıza göre seçin.", promoBody: "Kataloğumuzdaki ürünleri keşfedin.", promoCategoryId: "all", secondTitle: "Aksesuarları tamamlayın.", secondBody: "Birlikte kullanacağınız ürünlere göz atın.", secondCategoryId: "all" };
}
export function newDesignDocument(themeId: DesignId = "electronics-forma", mode: SalesMode = "retail"): DesignDocument { return { version: 1, themeId, mode, content: { [themeId]: defaultContent(themeId) } }; }
export function readDesignDocument(raw: unknown, sector: string | null | undefined): DesignDocument | null {
  if (!hasSectorDesign(sector) || !raw || typeof raw !== "object") return null;
  const doc = raw as DesignDocument;
  if (doc.version !== 1 || !isDesignId(doc.themeId) || designSector(doc.themeId) !== sector || !["retail", "wholesale"].includes(doc.mode)) return null;
  const content: DesignDocument["content"] = {};
  for (const id of DESIGN_IDS.filter(id => designSector(id) === sector)) { const parsed = schemaFor(id).safeParse(doc.content?.[id]); if (parsed.success) content[id] = parsed.data; }
  return { version: 1, themeId: doc.themeId, mode: doc.mode, content };
}
export function getDesignContent(doc: DesignDocument) { return doc.content[doc.themeId] ?? defaultContent(doc.themeId); }
export function prepareDesignUpdate(sector: string | null | undefined, raw: unknown, previous: unknown) {
  if (!hasSectorDesign(sector)) return { error: "Bu sektör için tema koleksiyonu bulunmuyor." } as const;
  const request = z.object({ themeId: z.enum(DESIGN_IDS), mode: z.enum(["retail", "wholesale"]), content: z.unknown() }).strict().safeParse(raw);
  if (!request.success) return { error: "Tema seçimi veya satış biçimi geçersiz." } as const;
  if (designSector(request.data.themeId) !== sector) return { error: "Yalnız kayıtlı sektörünüze ait temaları kullanabilirsiniz." } as const;
  const content = schemaFor(request.data.themeId).safeParse(request.data.content);
  if (!content.success) return { error: content.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" ") } as const;
  const old = readDesignDocument(previous, sector);
  const document: DesignDocument = { version: 1, themeId: request.data.themeId, mode: request.data.mode, content: { ...old?.content, [request.data.themeId]: content.data } };
  return { document } as const;
}
