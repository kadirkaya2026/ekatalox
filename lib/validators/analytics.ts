import { z } from "zod";

export const analyticsPeriodSchema = z.enum(["daily", "weekly", "monthly"]);

export const storefrontAnalyticsEventSchema = z
  .object({
    subdomain: z.string().trim().min(1, "Mağaza bilgisi gerekli."),
    event: z.enum(["visit", "product_view", "cart_add", "search"]),
    productId: z.string().uuid("Geçersiz ürün.").optional(),
    visitorKey: z.string().trim().min(1).max(64).optional(),
    query: z.string().trim().min(2).max(80).optional(),
    resultCount: z.number().int().nonnegative().optional(),
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

    if (value.event === "search" && !value.query) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Arama metni gerekli.",
        path: ["query"],
      });
    }
  });

export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;
