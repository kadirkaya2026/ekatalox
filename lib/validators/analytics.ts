import { z } from "zod";

export const analyticsPeriodSchema = z.enum(["daily", "weekly", "monthly"]);

export const storefrontAnalyticsEventSchema = z
  .object({
    subdomain: z.string().trim().min(1, "Mağaza bilgisi gerekli."),
    event: z.enum(["visit", "product_view", "cart_add"]),
    productId: z.string().uuid("Geçersiz ürün.").optional(),
    visitorKey: z.string().trim().min(1).max(64).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.event === "visit" && !value.visitorKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ziyaretçi anahtarı gerekli.",
        path: ["visitorKey"],
      });
    }

    if (
      (value.event === "product_view" || value.event === "cart_add") &&
      !value.productId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ürün bilgisi gerekli.",
        path: ["productId"],
      });
    }
  });

export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;
