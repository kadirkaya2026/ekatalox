import { z } from "zod";

export const ELECTRONICS_SECTOR = "telefon-aksesuar";
export const DESIGN_IDS = ["electronics-forma", "electronics-akim", "electronics-modul"] as const;
export type DesignId = typeof DESIGN_IDS[number];
export type SalesMode = "retail" | "wholesale";
const text = (max: number) => z.string().trim().max(max);
const image = z.string().max(2048).refine((v) => !v || /^https:\/\/[^\s]+$/i.test(v) || /^\/(?!\/)[^\s]*$/.test(v), "Görsel için HTTPS adresi kullanın.");
const common = { announcement: text(120), catalogTitle: text(70), heroVisible: z.boolean(), heroTitle: text(80), heroBody: text(180), heroImage: image, buttonLabel: text(32), heroCategoryId: text(100) };
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
] as const;
export function isDesignId(value: unknown): value is DesignId { return DESIGN_IDS.includes(value as DesignId); }
export function schemaFor(id: DesignId) { return id === "electronics-forma" ? formaSchema : id === "electronics-akim" ? akimSchema : modulSchema; }
export function defaultContent(id: DesignId): DesignContent {
  const base = { announcement: "", catalogTitle: "Ürünleri keşfedin", heroVisible: true, heroTitle: "Günlük hayatın yeni favorileri.", heroBody: "İşinize, masanıza ve hayatınıza eşlik edecek teknoloji ve aksesuarları keşfedin.", heroImage: "", buttonLabel: "Ürünleri keşfet", heroCategoryId: "all" };
  if (id === "electronics-forma") return { ...base, collectionVisible: true, collectionTitle: "Küçük detaylar. Büyük fark.", collectionBody: "Tarzınıza ve ihtiyaçlarınıza uyan aksesuarlarla tanışın.", collectionImage: "", collectionCategoryId: "all" };
  if (id === "electronics-akim") return { ...base, heroTitle: "Teknoloji. Kendi ritminde.", heroBody: "Bağlantıda kalmak, üretmek ve keyif almak için seçiminizi yapın.", featureVisible: true, featureTitle: "Yakından tanışın.", featureBody: "Bir sonraki favorinizin detaylarını keşfedin.", featureProductId: "", featureImage: "" };
  return { ...base, heroTitle: "Aradığınız teknoloji, burada.", heroBody: "Kategorilere göz atın, ürünleri karşılaştırın ve siparişinizi kolayca oluşturun.", promoVisible: true, promoTitle: "İhtiyacınıza göre seçin.", promoBody: "Kataloğumuzdaki ürünleri keşfedin.", promoCategoryId: "all", secondTitle: "Aksesuarları tamamlayın.", secondBody: "Birlikte kullanacağınız ürünlere göz atın.", secondCategoryId: "all" };
}
export function newDesignDocument(themeId: DesignId = "electronics-forma", mode: SalesMode = "retail"): DesignDocument { return { version: 1, themeId, mode, content: { [themeId]: defaultContent(themeId) } }; }
export function readDesignDocument(raw: unknown, sector: string | null | undefined): DesignDocument | null {
  if (sector !== ELECTRONICS_SECTOR || !raw || typeof raw !== "object") return null;
  const doc = raw as DesignDocument;
  if (doc.version !== 1 || !isDesignId(doc.themeId) || !["retail", "wholesale"].includes(doc.mode)) return null;
  const content: DesignDocument["content"] = {};
  for (const id of DESIGN_IDS) { const parsed = schemaFor(id).safeParse(doc.content?.[id]); if (parsed.success) content[id] = parsed.data; }
  return { version: 1, themeId: doc.themeId, mode: doc.mode, content };
}
export function getDesignContent(doc: DesignDocument) { return doc.content[doc.themeId] ?? defaultContent(doc.themeId); }
export function prepareDesignUpdate(sector: string | null | undefined, raw: unknown, previous: unknown) {
  if (sector !== ELECTRONICS_SECTOR) return { error: "Bu temaları yalnız telefon aksesuarı ve elektronik sektöründeki mağazalar kullanabilir." } as const;
  const request = z.object({ themeId: z.enum(DESIGN_IDS), mode: z.enum(["retail", "wholesale"]), content: z.unknown() }).strict().safeParse(raw);
  if (!request.success) return { error: "Tema seçimi veya satış biçimi geçersiz." } as const;
  const content = schemaFor(request.data.themeId).safeParse(request.data.content);
  if (!content.success) return { error: content.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" ") } as const;
  const old = readDesignDocument(previous, sector);
  const document: DesignDocument = { version: 1, themeId: request.data.themeId, mode: request.data.mode, content: { ...old?.content, [request.data.themeId]: content.data } };
  return { document } as const;
}
