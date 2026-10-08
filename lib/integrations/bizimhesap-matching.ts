// BizimHesap ürün eşleştirme (8 Eki 2026, Lucatech): eKatalox ürün/varyantı ↔
// BizimHesap stok kartı. Otomatik öneri sırası: stok kodu, barkod, ad; yalnız
// TEK aday çıkarsa eşleştirilir (yanlış ürüne yazmaktansa eşleşmemiş kalsın).

export type BizimHesapProduct = {
  id: string;
  code: string | null;
  barcode: string | null;
  title: string;
  variantName: string | null;
  price: number | null;
  currency: string | null;
  isActive: boolean;
};

export function normalizeBizimHesapProducts(json: unknown): BizimHesapProduct[] {
  const data = (json as { data?: { products?: unknown } } | null)?.data?.products;
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : typeof r.id === "number" ? String(r.id) : "";
    const title = typeof r.title === "string" ? r.title.trim() : "";
    if (!id || !title) return [];
    const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
    return [
      {
        id,
        code: text(r.code),
        barcode: text(r.barcode),
        title,
        variantName: text(r.variantName),
        price: typeof r.price === "number" ? r.price : Number(r.price) || null,
        currency: text(r.currency),
        isActive: r.isActive !== false,
      },
    ];
  });
}

/** Karşılaştırma anahtarı: Türkçe küçük harf, yalnız harf/rakam. */
export function matchKey(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export type MatchTarget = {
  /** Ürünün stok kodu (model kodu). */
  code: string | null;
  /** Ürün adı. */
  name: string;
  /** Varyant satırıysa varyant adı (ör. "12 PROMAX"). */
  variantName?: string | null;
};

export function buildBizimHesapIndex(products: BizimHesapProduct[]) {
  const byCode = new Map<string, BizimHesapProduct[]>();
  const byBarcode = new Map<string, BizimHesapProduct[]>();
  const byTitle = new Map<string, BizimHesapProduct[]>();
  const push = (map: Map<string, BizimHesapProduct[]>, key: string, product: BizimHesapProduct) => {
    if (!key) return;
    const list = map.get(key) ?? [];
    list.push(product);
    map.set(key, list);
  };
  for (const product of products) {
    if (!product.isActive) continue;
    push(byCode, matchKey(product.code), product);
    push(byBarcode, matchKey(product.barcode), product);
    push(byTitle, matchKey(product.title), product);
    if (product.variantName) push(byTitle, matchKey(`${product.title} ${product.variantName}`), product);
  }
  return { byCode, byBarcode, byTitle, products };
}

export type BizimHesapIndex = ReturnType<typeof buildBizimHesapIndex>;

const single = (list: BizimHesapProduct[] | undefined) => (list && list.length === 1 ? list[0] : null);

/** Tek ve kesin aday varsa onu döner; yoksa null (panelden elle seçilir). */
export function autoMatch(index: BizimHesapIndex, target: MatchTarget): BizimHesapProduct | null {
  const code = matchKey(target.code);
  if (target.variantName) {
    const variant = matchKey(target.variantName);
    // Varyant: "<kod> <model>" ya da "<ad> <model>" BizimHesap kodu/adıyla birebir.
    return (
      single(index.byCode.get(code + variant)) ??
      single(index.byTitle.get(code + variant)) ??
      single(index.byTitle.get(matchKey(target.name) + variant)) ??
      single(
        index.products.filter(
          (p) =>
            p.isActive &&
            (matchKey(p.code) === code || matchKey(p.title).includes(code)) &&
            matchKey(p.variantName ?? p.title).includes(variant),
        ),
      )
    );
  }
  return (
    single(index.byCode.get(code)) ??
    single(index.byBarcode.get(code)) ??
    single(index.byTitle.get(matchKey(target.name)))
  );
}

/** Panelde arama/öneri için puanlı aday listesi (en iyi 8). */
export function suggestMatches(index: BizimHesapIndex, target: MatchTarget, limit = 8) {
  const code = matchKey(target.code);
  const words = [target.name, target.variantName ?? ""]
    .join(" ")
    .toLocaleLowerCase("tr")
    .split(/[^a-z0-9ğüşöçıi]+/i)
    .map(matchKey)
    .filter((word) => word.length >= 2);
  const variant = matchKey(target.variantName);
  const scored = index.products
    .filter((p) => p.isActive)
    .map((p) => {
      const hay = matchKey(`${p.code ?? ""} ${p.title} ${p.variantName ?? ""} ${p.barcode ?? ""}`);
      let score = 0;
      if (code && matchKey(p.code) === code) score += 50;
      else if (code && hay.includes(code)) score += 25;
      if (variant && hay.includes(variant)) score += 30;
      for (const word of words) if (hay.includes(word)) score += 3;
      return { product: p, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((entry) => entry.product);
}
