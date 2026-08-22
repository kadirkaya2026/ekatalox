import { z } from "zod";

// DİKKAT — bu projede iki kez ısırdı: z.coerce.number() null'ı 0'a çeviriyor.
// Boş bırakılabilen sayısal/tarih alanlarında önce preprocess ile boş
// string/undefined -> null yapılıyor, birleşimde de z.null() ÖNCE geliyor;
// aksi halde "boş bırakıldı" ile "0 girildi" ayırt edilemiyor.
const nullableNumber = (message: string) =>
  z.preprocess(
    (value) =>
      value === undefined || value === null || (typeof value === "string" && value.trim() === "")
        ? null
        : value,
    z.union([z.null(), z.coerce.number().min(0, message)]),
  );

const nullableTrimmedText = (max: number, message: string) =>
  z.preprocess(
    (value) =>
      value === undefined || (typeof value === "string" && value.trim() === "") ? null : value,
    z.union([z.null(), z.string().trim().max(max, message)]),
  );

const nullableIsoDate = z.preprocess(
  (value) =>
    value === undefined || value === null || (typeof value === "string" && value.trim() === "")
      ? null
      : value,
  z.union([
    z.null(),
    z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), "Tarih geçersiz."),
  ]),
);

const nullableUuid = z.preprocess(
  (value) =>
    value === undefined || value === null || (typeof value === "string" && value.trim() === "")
      ? null
      : value,
  z.union([z.null(), z.string().uuid("Kategori seçimi geçersiz.")]),
);

export const campaignSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Kampanya başlığı zorunludur.")
      .max(80, "Başlık en fazla 80 karakter olabilir."),
    description: nullableTrimmedText(280, "Açıklama en fazla 280 karakter olabilir."),
    image_url: nullableTrimmedText(500, "Görsel adresi çok uzun."),
    badge_label: nullableTrimmedText(24, "Rozet en fazla 24 karakter olabilir."),
    starts_at: nullableIsoDate,
    ends_at: nullableIsoDate,
    is_active: z.boolean().default(true),
    link_category_id: nullableUuid,
    display_order: z.coerce.number().int().min(0).default(0),

    rule_type: z.enum(["none", "cart_threshold"]).default("none"),
    min_cart_amount: nullableNumber("Minimum sepet tutarı sıfırdan küçük olamaz."),
    discount_kind: z.preprocess(
      (value) =>
        value === undefined || value === null || (typeof value === "string" && value.trim() === "")
          ? null
          : value,
      z.union([z.null(), z.enum(["amount", "percentage"])]),
    ),
    discount_value: nullableNumber("İndirim değeri sıfırdan küçük olamaz."),
    payment_method: z.enum(["any", "cash", "card"]).default("any"),
    excluded_category_ids: z
      .array(z.string().uuid("Kategori seçimi geçersiz."))
      .max(50, "En fazla 50 kategori hariç tutabilirsiniz.")
      .default([]),
  })
  .superRefine((value, ctx) => {
    if (value.rule_type === "cart_threshold") {
      if (value.min_cart_amount === null || value.min_cart_amount <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["min_cart_amount"],
          message: "Sepet indirimi için minimum sepet tutarı girin.",
        });
      }

      if (value.discount_kind === null) {
        ctx.addIssue({
          code: "custom",
          path: ["discount_kind"],
          message: "İndirim tipini seçin.",
        });
      }

      if (value.discount_value === null || value.discount_value <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["discount_value"],
          message: "İndirim değeri sıfırdan büyük olmalıdır.",
        });
      } else if (value.discount_kind === "percentage" && value.discount_value > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["discount_value"],
          message: "Yüzde indirim 100'den büyük olamaz.",
        });
      } else if (
        value.discount_kind === "amount" &&
        value.min_cart_amount !== null &&
        value.discount_value >= value.min_cart_amount
      ) {
        // Aksi halde sepet bedavaya geliyor.
        ctx.addIssue({
          code: "custom",
          path: ["discount_value"],
          message: "İndirim tutarı minimum sepet tutarından küçük olmalıdır.",
        });
      }
    }

    if (value.starts_at && value.ends_at) {
      if (new Date(value.ends_at).getTime() <= new Date(value.starts_at).getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["ends_at"],
          message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır.",
        });
      }
    }
  });

export type CampaignInput = z.infer<typeof campaignSchema>;

// Kampanya görselleri banner bucket'ına yazılıyor (aynı tenant öneki, aynı
// RLS — bkz. 0011_storefront_banners_bucket.sql). Banner'daki birebir
// çözünürlük zorunluluğu burada YOK: kampanya kartı daha küçük, sadece
// mime ve boyut sınırı uygulanıyor.
export const allowedCampaignImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const maxCampaignImageSizeBytes = 4 * 1024 * 1024;

// Vitrinde ve admin önizlemesinde aynı cümleyi üretmek için tek kaynak —
// bayi kuralı bir kez tanımlıyor, metni ayrıca yazmak zorunda kalmıyor.
export function buildCampaignRuleSentence(params: {
  minCartAmount: number | null;
  discountKind: "amount" | "percentage" | null;
  discountValue: number | null;
  paymentMethod: "any" | "cash" | "card";
  formatAmount: (value: number) => string;
  labels: {
    template: (threshold: string, benefit: string) => string;
    cashOnly: string;
    cardOnly: string;
  };
}): string | null {
  const { minCartAmount, discountKind, discountValue, paymentMethod, formatAmount, labels } =
    params;

  if (minCartAmount === null || discountKind === null || discountValue === null) {
    return null;
  }

  const benefit = discountKind === "percentage" ? `%${discountValue}` : formatAmount(discountValue);
  const sentence = labels.template(formatAmount(minCartAmount), benefit);

  if (paymentMethod === "cash") return `${sentence} ${labels.cashOnly}`;
  if (paymentMethod === "card") return `${sentence} ${labels.cardOnly}`;
  return sentence;
}
