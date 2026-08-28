import { z } from "zod";
import { diffDays } from "@/lib/dates/istanbul";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG olmalı.");

export const salesReportQuerySchema = z
  .object({
    from: isoDate,
    to: isoDate,
    bucket: z.enum(["day", "week", "month"]).default("day"),
  })
  .refine((v) => v.from <= v.to, { message: "Başlangıç bitişten sonra olamaz.", path: ["from"] })
  .refine((v) => diffDays(v.from, v.to) <= 400, { message: "Aralık en fazla 400 gün olabilir.", path: ["to"] });
