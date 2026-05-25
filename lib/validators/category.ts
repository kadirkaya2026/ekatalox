import { z } from "zod";

export const categorySchema = z.object({
  tenant_id: z.string().min(1).optional(),
  name: z.string().min(2, "Kategori adı zorunludur."),
});