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
    // DİKKAT: z.union([z.coerce.number(), z.null()]) YAZMAYIN. Union
    // seçenekleri sırayla denenir ve z.coerce.number() null'ı 0'a çevirir
    // (Number(null) === 0), yani "indirim yok" değeri sessizce "indirim: 0"
    // olur; aşağıdaki erken çıkış çalışmaz ve fiyatı girilmemiş her liste
    // için hata üretilir. Bu yüzden boş/null önce preprocess'te
    // sabitleniyor, sayıya dönüştürme ondan sonra deneniyor.
    discount_price: z.preprocess(
      (value) =>
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
          ? null
          : value,
      z.union([
        z.null(),
        z.coerce.number().min(0, "İndirimli fiyat sıfırdan küçük olamaz."),
      ]),
    ),
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
