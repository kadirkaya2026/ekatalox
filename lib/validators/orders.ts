import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orders/status";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG olmalı.");

export const orderListQuerySchema = z.object({
  status: z.enum(["all", ...ORDER_STATUSES] as [string, ...string[]]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(25),
  q: z.string().trim().max(80).optional(),
  // "open": yalnız açık veresiyeler (credit_marked_at dolu, credit_paid_at boş).
  credit: z.enum(["open"]).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const orderStatusPatchSchema = z
  .object({
    to_status: z.enum(ORDER_STATUSES as [string, ...string[]]),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.to_status !== "cancelled" || (v.reason?.length ?? 0) >= 3, {
    message: "İptal sebebi gerekli (en az 3 karakter).",
    path: ["reason"],
  });
