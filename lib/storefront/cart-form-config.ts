// Sepet formu alan ayarları (kullanıcı isteği, 16 Eyl 2026): bayi, sipariş
// verirken müşteriden istenen alanları (cari adı, telefon, adres, not) kendi
// belirlesin — görünür mü, zorunlu mu, etiketi ne. Ayar
// tenant_storefront_settings.cart_form_config (jsonb, 0118) kolonunda tutulur;
// NULL = eski davranış (aşağıdaki getDefaultCartFormConfig), böylece mevcut
// tenantlarda hiçbir şey değişmez.
//
// Hem vitrin (istemci doğrulaması + görünüm) hem generate-pdf (sunucu
// doğrulaması) AYNI resolve fonksiyonunu kullanır; istemciye güvenilmez.

import type { TenantBusinessType } from "@/lib/types";

export const CART_FORM_FIELD_KEYS = [
  "customer_name",
  "customer_phone",
  "customer_address",
  "order_note",
] as const;

export type CartFormFieldKey = (typeof CART_FORM_FIELD_KEYS)[number];

export interface CartFormFieldConfig {
  is_visible: boolean;
  is_required: boolean;
  /** Bayinin verdiği etiket; null = vitrin dilindeki varsayılan metin. */
  label: string | null;
}

export type CartFormConfig = Record<CartFormFieldKey, CartFormFieldConfig>;

/** DB'de saklanan biçim: her alan isteğe bağlı, eksikler varsayılandan dolar. */
export type StoredCartFormConfig = Partial<
  Record<CartFormFieldKey, Partial<CartFormFieldConfig>>
> | null;

export const CART_FORM_LABEL_MAX_LENGTH = 40;

/**
 * Ayar yapılmamış tenantın davranışı (0118 öncesi kod ne yapıyorsa o):
 * - Cari adı: herkeste görünür; market'te zorunlu, diğerlerinde isteğe bağlı.
 * - Telefon + adres: yalnız market tipinde görünür ve zorunlu.
 * - Sipariş notu: herkeste görünür, isteğe bağlı.
 */
export function getDefaultCartFormConfig(
  businessType: TenantBusinessType | null | undefined,
): CartFormConfig {
  const isMarket = businessType === "market";
  return {
    customer_name: { is_visible: true, is_required: isMarket, label: null },
    customer_phone: { is_visible: isMarket, is_required: isMarket, label: null },
    customer_address: { is_visible: isMarket, is_required: isMarket, label: null },
    order_note: { is_visible: true, is_required: false, label: null },
  };
}

export function resolveCartFormConfig(
  stored: StoredCartFormConfig | undefined,
  businessType: TenantBusinessType | null | undefined,
): CartFormConfig {
  const defaults = getDefaultCartFormConfig(businessType);
  if (!stored || typeof stored !== "object") return defaults;

  const resolved = { ...defaults };
  for (const key of CART_FORM_FIELD_KEYS) {
    const entry = stored[key];
    if (!entry || typeof entry !== "object") continue;
    const isVisible =
      typeof entry.is_visible === "boolean" ? entry.is_visible : defaults[key].is_visible;
    const label =
      typeof entry.label === "string" && entry.label.trim()
        ? entry.label.trim().slice(0, CART_FORM_LABEL_MAX_LENGTH)
        : null;
    resolved[key] = {
      is_visible: isVisible,
      // Gizli alan zorunlu olamaz — aksi halde müşteri hiç dolduramayacağı
      // bir alanda takılır.
      is_required:
        isVisible &&
        (typeof entry.is_required === "boolean"
          ? entry.is_required
          : defaults[key].is_required),
      label,
    };
  }
  return resolved;
}

/** Sunucu tarafı: zorunlu olup boş gelen alanların anahtarları. */
export function findMissingRequiredCartFields(
  config: CartFormConfig,
  values: Partial<Record<CartFormFieldKey, string | null | undefined>>,
): CartFormFieldKey[] {
  return CART_FORM_FIELD_KEYS.filter(
    (key) => config[key].is_visible && config[key].is_required && !(values[key] ?? "").trim(),
  );
}
