import { z } from "zod";
import { bannerItemSchema } from "@/lib/validators/storefront-settings";

export const categoryBannerItemSchema = bannerItemSchema;

export const categoryBannerUpdateSchema = z.object({
  id: z.string().min(1, "Geçerli bir kategori kimliği girin."),
  banner_item: categoryBannerItemSchema.nullable(),
});
