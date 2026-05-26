import { z } from "zod";

export const categorySchema = z.object({
  tenant_id: z.string().min(1).optional(),
  parent_id: z.string().min(1).nullable().optional(),
  name: z.string().min(2, "Kategori adı zorunludur."),
});