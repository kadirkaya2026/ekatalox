import { z } from "zod";

export const accessCodeSchema = z.object({
  tenant_id: z.string().min(1, "Tenant seçimi zorunludur."),
  password_code: z.string().min(3, "Şifre kodu zorunludur."),
  price_list_id: z.string().uuid("Geçerli bir fiyat listesi seçin."),
});

export const accessCodeUpdateSchema = z
  .object({
    id: z.string().min(1, "Güncellenecek şifre seçilmedi."),
    password_code: z.string().min(3, "Şifre kodu zorunludur.").optional(),
    price_list_id: z.string().uuid("Geçerli bir fiyat listesi seçin.").optional(),
  })
  .refine(
    (data) => data.password_code !== undefined || data.price_list_id !== undefined,
    { message: "Güncellenecek en az bir alan gerekli." },
  );
