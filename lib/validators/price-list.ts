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

export const productPriceEntrySchema = z.object({
  price_list_id: z.string().uuid("Geçerli bir fiyat listesi seçin."),
  price: z.coerce.number().min(0, "Fiyat sıfırdan küçük olamaz."),
});

export const productPricesSchema = z.array(productPriceEntrySchema);
