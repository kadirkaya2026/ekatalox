import { z } from "zod";

export const priceListCreateSchema = z.object({
  name: z.string().trim().min(1, "Liste adı zorunludur.").max(80, "Liste adı en fazla 80 karakter olabilir."),
});

export const priceListUpdateSchema = z.object({
  id: z.string().uuid("Geçerli bir liste seçin."),
  name: z.string().trim().min(1, "Liste adı zorunludur.").max(80, "Liste adı en fazla 80 karakter olabilir.").optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});

export const priceListDeleteSchema = z.object({
  id: z.string().uuid("Geçerli bir liste seçin."),
});

export const productPriceEntrySchema = z
  .object({
    price_list_id: z.string().uuid("Geçerli bir fiyat listesi seçin."),
    price: z.coerce.number().min(0, "Fiyat sıfırdan küçük olamaz."),
    // Liste başına indirimli fiyat. Boş bırakılırsa bu listede indirim yok
    // (kullanıcı isteği, 21 Ağu 2026). Eskiden tek bir products.discount_price
    // tüm listelere uygulanıyordu.
    discount_price: z
      .union([
        z.coerce.number().min(0, "İndirimli fiyat sıfırdan küçük olamaz."),
        z.null(),
        z.literal(""),
      ])
      .default(null)
      .transform((value) => (value === "" || value === null ? null : value)),
  })
  .superRefine((entry, ctx) => {
    if (entry.discount_price === null) return;

    if (entry.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "İndirim girmek için bu listenin fiyatı sıfırdan büyük olmalıdır.",
        path: ["discount_price"],
      });
      return;
    }

    if (entry.discount_price >= entry.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "İndirimli fiyat, o listenin fiyatından düşük olmalıdır.",
        path: ["discount_price"],
      });
    }
  });

export const productPricesSchema = z.array(productPriceEntrySchema);
