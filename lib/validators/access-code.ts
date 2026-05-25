import { z } from "zod";

export const accessCodeSchema = z.object({
  tenant_id: z.string().min(1, "Tenant seçimi zorunludur."),
  password_code: z.string().min(3, "Şifre kodu zorunludur."),
  price_tier_level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});