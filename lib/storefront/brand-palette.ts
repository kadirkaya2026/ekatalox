/**
 * Buton / bölüm bazlı marka renkleri (kullanıcı isteği, 25 Eyl 2026).
 *
 * Eskiden yalnız iki renk vardı (brand_primary_color / brand_accent_color);
 * tenant artık HER butonu ve birkaç vitrin bölümünü ayrı renklendirebiliyor.
 * Bu dosya tek doğruluk kaynağıdır: rol listesi (etiket + "nerede
 * kullanılır" metni), çözümleme kuralı ve önizleme URL'i kodlaması.
 *
 * Çözümleme: rolün kendi rengi → yoksa eski iki renkten biri (legacy) →
 * yoksa temanın kendi rengi. Böylece "Ana renk" tek seçimle her şeyi
 * boyamaya devam eder, roller yalnız üstüne yazar.
 *
 * "use client" YOK: sunucu (validator, API, sayfa) ve istemci birlikte
 * kullanıyor.
 */

export const BRAND_COLOR_ROLE_KEYS = [
  "addToCart",
  "qtyStepper",
  "stickyCart",
  "whatsappCheckout",
  "gateSubmit",
  "headerCart",
  "campaignButton",
  "price",
  "activeCategory",
  "variantBadge",
  "discountBadge",
  "headerBg",
  "footerBg",
  "pageBg",
] as const;

export type BrandColorRoleKey = (typeof BRAND_COLOR_ROLE_KEYS)[number];

/** DB'deki tenant_storefront_settings.brand_palette (jsonb). Yalnız
 *  ayarlanmış roller bulunur; değer "#rrggbb". */
export type BrandPalette = Partial<Record<BrandColorRoleKey, string>>;

export type BrandColorRoleGroup = "buttons" | "texts" | "sections";

export const BRAND_COLOR_ROLE_GROUPS: Array<{ key: BrandColorRoleGroup; label: string; hint?: string }> = [
  { key: "buttons", label: "Butonlar" },
  { key: "texts", label: "Yazılar ve rozetler" },
  {
    key: "sections",
    label: "Bölümler",
    hint: "Yazı ve ikon renkleri okunaklı kalacak şekilde otomatik ayarlanır. Bu üç renk yalnız açık (gündüz) modda uygulanır; gece modunda temanın koyu renkleri korunur.",
  },
];

export interface BrandColorRole {
  key: BrandColorRoleKey;
  label: string;
  group: BrandColorRoleGroup;
  /** "Nerede kullanılır" açıklaması (panelde rolün altında görünür). */
  where: string;
  /** Rol boşsa hangi eski renge düşer: "primary" = Ana renk,
   *  "accent" = Rozet rengi, null = temanın rengi. */
  legacy: "primary" | "accent" | null;
}

export const BRAND_COLOR_ROLES: BrandColorRole[] = [
  {
    key: "addToCart",
    label: "Sepete ekle (+) butonu",
    group: "buttons",
    where: "Ürün kartında ve liste görünümündeki + butonu; sepete eklenince görselin etrafını dolanan çizgi de bu renktir.",
    legacy: "primary",
  },
  {
    key: "qtyStepper",
    label: "Adet artır / azalt",
    group: "buttons",
    where: "Sepetteki ürünün kartında beliren − / + adet sayacı.",
    legacy: "primary",
  },
  {
    key: "stickyCart",
    label: "Alttaki sepet çubuğu (Devam)",
    group: "buttons",
    where: "Sayfanın altındaki sipariş özeti çubuğundaki Devam butonu.",
    legacy: "primary",
  },
  {
    key: "whatsappCheckout",
    label: "WhatsApp ile Siparişi Tamamla",
    group: "buttons",
    where: "Sepet penceresindeki sipariş gönderme, Devam ve Siparişi takip et butonları; seçili ödeme yöntemi.",
    legacy: "primary",
  },
  {
    key: "gateSubmit",
    label: "Mağaza'ya Gir",
    group: "buttons",
    where: "Şifre ekranındaki giriş butonu ve yaş doğrulama onay butonu (ekranın üstündeki küçük başlık da bu renkte).",
    legacy: "primary",
  },
  {
    key: "headerCart",
    label: "Üstteki sepet butonu",
    group: "buttons",
    where: "Sepette ürün varken üst bardaki sepet butonu ve içindeki adet.",
    legacy: "primary",
  },
  {
    key: "campaignButton",
    label: "Kampanya ve diğer butonlar",
    group: "buttons",
    where: "Kampanya penceresi, banner/hero butonu, bildirim daveti, siparişlerim ve diğer genel butonlar.",
    legacy: "primary",
  },
  {
    key: "price",
    label: "Fiyatlar",
    group: "texts",
    where: "Ürün kartlarındaki ve listedeki fiyat yazısı.",
    legacy: "primary",
  },
  {
    key: "activeCategory",
    label: "Seçili kategori",
    group: "texts",
    where: "Seçili kategori: üstteki kategori butonları, mobil kategori şeridi, alt kategori butonları ve soldaki kategori listesi.",
    legacy: "primary",
  },
  {
    key: "variantBadge",
    label: "Model / varyant rozeti",
    group: "texts",
    where: "Ürün kartındaki \"3 Model\" gibi rozetler ve sepete eklenen varyant sayısı.",
    legacy: "accent",
  },
  {
    key: "discountBadge",
    label: "İndirim rozeti",
    group: "texts",
    where: "Ürün görselinin sol üstündeki \"%15\" indirim etiketi (ürün kartı ve indirimli ürünler şeridi).",
    legacy: null,
  },
  {
    key: "headerBg",
    label: "Üst bar zemini",
    group: "sections",
    where: "Logo, arama ve kategori menüsünün bulunduğu üst bölümün arka planı.",
    legacy: null,
  },
  {
    key: "footerBg",
    label: "Alt bilgi zemini",
    group: "sections",
    where: "Sayfanın en altındaki iletişim / sosyal medya bölümünün arka planı.",
    legacy: null,
  },
  {
    key: "pageBg",
    label: "Sayfa zemini",
    group: "sections",
    where: "Ürünlerin dizildiği ana sayfa arka planı. Açık tonlar önerilir; çok koyu seçilirse bazı başlıklar zor okunabilir.",
    legacy: null,
  },
];

const ROLE_KEY_SET = new Set<string>(BRAND_COLOR_ROLE_KEYS);

export function isBrandColorRoleKey(value: string): value is BrandColorRoleKey {
  return ROLE_KEY_SET.has(value);
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_RE.test(value.trim());
}

export function normalizeHexColor(color: string): string {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/) ?? [];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

/**
 * DB / URL / istemciden gelen her şeyi güvenli palete çevirir: bilinmeyen
 * anahtarlar ve geçersiz renkler atılır, null/"" = rol temizlenmiş.
 * Kolon henüz yokken (migration 0136 uygulanmadan) undefined gelir → {}.
 */
export function normalizeBrandPalette(value: unknown): BrandPalette {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result: BrandPalette = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (isBrandColorRoleKey(key) && isHexColor(raw)) {
      result[key] = normalizeHexColor(raw);
    }
  }
  return result;
}

export function hasBrandPaletteColors(palette: BrandPalette | null | undefined): boolean {
  return Boolean(palette && Object.values(palette).some(Boolean));
}

export interface BrandPaletteSource {
  brand_primary_color: string | null;
  brand_accent_color: string | null;
  brand_palette?: BrandPalette | null;
}

export type ResolvedBrandPalette = Record<BrandColorRoleKey, string | null>;

const ROLE_BY_KEY = new Map(BRAND_COLOR_ROLES.map((role) => [role.key, role]));

/** Her rol için geçerli rengi (#rrggbb) ya da null (= temanın rengi). */
export function resolveBrandPalette(source: BrandPaletteSource): ResolvedBrandPalette {
  const primaryRaw = isHexColor(source.brand_primary_color) ? source.brand_primary_color : null;
  const accentRaw = isHexColor(source.brand_accent_color) ? source.brand_accent_color : null;
  // Eski davranış: Ana renk yoksa Rozet rengi (ve tersi) her yerde kullanılırdı.
  const legacyPrimary = primaryRaw ?? accentRaw;
  const legacyAccent = accentRaw ?? primaryRaw;
  const palette = normalizeBrandPalette(source.brand_palette);

  const resolved = {} as ResolvedBrandPalette;
  for (const key of BRAND_COLOR_ROLE_KEYS) {
    const own = palette[key];
    const legacy = ROLE_BY_KEY.get(key)?.legacy;
    const fallback =
      legacy === "primary" ? legacyPrimary : legacy === "accent" ? legacyAccent : null;
    const value = own ?? fallback;
    resolved[key] = value ? normalizeHexColor(value) : null;
  }
  return resolved;
}

/** CSS değişken adı: addToCart → --ek-add-to-cart */
export function brandRoleCssVar(key: BrandColorRoleKey, suffix?: "fg" | "soft" | "border" | "muted" | "line"): string {
  const kebab = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `--ek-${kebab}${suffix ? `-${suffix}` : ""}`;
}

// ---------------------------------------------------------------------------
// Önizleme URL'i (?pal=): ayarlanmış rollerin kısa JSON'u, base64url.
// Anahtarlar ve hex değerler ASCII olduğundan btoa/atob (Node 16+ ve tarayıcı)
// güvenle kullanılabilir.
// ---------------------------------------------------------------------------

/** Boş palet ("{}") — önizleme/uygula linkinde "tüm roller temadan" demek. */
export const EMPTY_BRAND_PALETTE_PARAM = "e30";

export function encodeBrandPaletteParam(palette: BrandPalette | null | undefined): string | null {
  const clean = normalizeBrandPalette(palette);
  const entries = Object.entries(clean);
  if (!entries.length) return null;
  const compact = Object.fromEntries(entries.map(([key, value]) => [key, value.replace("#", "")]));
  return btoa(JSON.stringify(compact)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBrandPaletteParam(param: string | null | undefined): BrandPalette | null {
  if (!param || param.length > 2000) return null;
  try {
    const base64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as Record<string, unknown>;
    const withHash = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, typeof value === "string" ? `#${value.replace(/^#/, "")}` : value]),
    );
    return normalizeBrandPalette(withHash);
  } catch {
    return null;
  }
}
