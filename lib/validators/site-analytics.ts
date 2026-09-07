import { z } from "zod";

const shortText = (max: number) => z.string().trim().max(max).optional().nullable();

export const siteAnalyticsEventSchema = z
  .object({
    type: z.enum(["pageview", "click", "leave"]),
    path: z.string().trim().min(1).max(300),
    title: shortText(200),
    referrer: shortText(500),
    utmSource: shortText(100),
    utmMedium: shortText(100),
    utmCampaign: shortText(150),
    targetText: shortText(120),
    targetHref: shortText(500),
    targetTag: shortText(20),
    scrollPct: z.number().int().min(0).max(100).optional().nullable(),
    timeOnPageMs: z.number().int().min(0).max(7_200_000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    // Yalnız site içi yollar; tam URL veya garip değerler yazılmasın.
    if (!value.path.startsWith("/") || value.path.includes("//")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Geçersiz yol.", path: ["path"] });
    }
  });

export const siteAnalyticsBatchSchema = z.object({
  v: z.literal(1),
  visitorKey: z.string().trim().min(8).max(64),
  sessionKey: z.string().trim().min(8).max(64),
  screen: shortText(20),
  events: z.array(siteAnalyticsEventSchema).min(1).max(20),
});

export type SiteAnalyticsBatch = z.infer<typeof siteAnalyticsBatchSchema>;

export const siteAnalyticsRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bucket: z.enum(["day", "week", "month"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
