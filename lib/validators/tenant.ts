import { z } from "zod";
import {
  isReservedSubdomain,
  normalizeSubdomain,
  RESERVED_SUBDOMAIN_MESSAGE,
} from "@/lib/tenancy/reserved-subdomains";

const subdomainSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeSubdomain(value) : value),
  z
    .string()
    .min(2, "Alt alan adı zorunludur.")
    .regex(
      /^[a-z0-9-]+$/,
      "Alt alan adı yalnız küçük harf, rakam ve tire içerebilir.",
    )
    .refine((value) => !isReservedSubdomain(value), RESERVED_SUBDOMAIN_MESSAGE),
);

export const tenantSchema = z.object({
  company_name: z.string().min(2, "Firma adı zorunludur."),
  subdomain: subdomainSchema,
  max_product_limit: z.union([z.literal(300), z.literal(500), z.literal(1000)]),
  whatsapp_number: z.string().min(10, "WhatsApp numarası zorunludur."),
});

export const tenantUpdateSchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  max_product_limit: z.union([z.literal(300), z.literal(500), z.literal(1000)]).optional(),
  whatsapp_number: z.string().min(10).optional(),
});