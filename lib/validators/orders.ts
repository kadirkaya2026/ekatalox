import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orders/status";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG olmalı.");

export const orderListQuerySchema = z.object({
  status: z.enum(["all", ...ORDER_STATUSES] as [string, ...string[]]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(25),
  q: z.string().trim().max(80).optional(),
  // "open": yalnız açık veresiyeler (credit_marked_at dolu, credit_paid_at boş).
  credit: z.enum(["open"]).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const orderStatusPatchSchema = z
  .object({
    to_status: z.enum(ORDER_STATUSES as [string, ...string[]]),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.to_status !== "cancelled" || (v.reason?.length ?? 0) >= 3, {
    message: "İptal sebebi gerekli (en az 3 karakter).",
    path: ["reason"],
  });

// Fiş düzenleme (0151): mevcut kalem sırasıyla yeni adetler; 0 = satırı çıkar.
export const orderItemsPatchSchema = z.object({
  quantities: z
    .array(z.number().int("Adet tam sayı olmalı.").min(0, "Adet eksi olamaz.").max(1_000_000, "Adet çok büyük."))
    .min(1, "Kalem yok.")
    .max(500),
});

// Sipariş düzenleme v2 (0154): fiş baştan kurulur. index = mevcut satır (adet/fiyat
// değişebilir), product_id = yeni eklenen ürün (satırı sunucu ürün kaydından üretir).
export const orderEditSchema = z.object({
  items: z
    .array(
      z.object({
        index: z.number().int().min(0).optional(),
        product_id: z.string().uuid().optional(),
        quantity: z.number().int("Adet tam sayı olmalı.").min(1, "Adet en az 1 olmalı.").max(1_000_000, "Adet çok büyük."),
        price: z.number().min(0, "Fiyat eksi olamaz.").max(100_000_000).optional(),
      }).refine((line) => line.index !== undefined || line.product_id !== undefined, "Satır geçersiz."),
    )
    .min(1, "Fişte en az bir ürün kalmalı; tamamını kaldırmak için siparişi iptal edin.")
    .max(500),
  customer: z
    .object({
      customer_name: z.string().max(120).optional(),
      customer_phone: z.string().max(40).optional(),
      customer_address: z.string().max(500).optional(),
      note: z.string().max(1000).optional(),
    })
    .optional(),
});
