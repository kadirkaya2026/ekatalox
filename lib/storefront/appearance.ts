import type {
  ProductImageBackgroundKey,
  StorefrontThemeKey,
  TenantStorefrontSettings,
} from "@/lib/types";

/**
 * Vitrin görünüm ayarları.
 *
 * Bu dosyada "use client" YOK ve olmamalı: askıya alma / deneme süresi
 * bitti / saat dışı / ziyaretçi kotası ekranlarını render eden sayfalar
 * sunucu bileşeni ve bu fonksiyonu sunucudan çağırıyorlar. Tip ve
 * fonksiyon theme-context.tsx içindeyken (o dosya "use client")
 * Next "client fonksiyonu sunucudan çağrılamaz" diyip 500 veriyordu.
 */
export interface StorefrontAppearanceSettings {
  theme_key: StorefrontThemeKey | string;
  brand_primary_color?: string | null;
  brand_accent_color?: string | null;
  product_image_background?: ProductImageBackgroundKey | null;
}

export function getAppearanceFromSettings(
  settings: Pick<
    TenantStorefrontSettings,
    "theme_key" | "brand_primary_color" | "brand_accent_color" | "product_image_background"
  >,
): StorefrontAppearanceSettings {
  return {
    theme_key: settings.theme_key,
    brand_primary_color: settings.brand_primary_color,
    brand_accent_color: settings.brand_accent_color,
    product_image_background: settings.product_image_background,
  };
}
