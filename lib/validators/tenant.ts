import { z } from "zod";
import {
  getLimitForPlan,
  TENANT_PLAN_IDS,
} from "@/lib/billing/plans";
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

const tenantPlanSchema = z.enum(TENANT_PLAN_IDS, {
  error: "Geçerli bir paket seçin.",
});

const maxProductLimitSchema = z.union([
  z.literal(500),
  z.literal(1000),
  z.literal(2500),
]);

export const tenantSchema = z
  .object({
    company_name: z.string().min(2, "Firma adı zorunludur."),
    subdomain: subdomainSchema,
    plan: tenantPlanSchema,
    max_product_limit: maxProductLimitSchema.optional(),
    whatsapp_number: z.string().min(10, "WhatsApp numarası zorunludur."),
    tenant_admin_email: z.email("Geçerli bir tenant admin e-postası girin."),
    tenant_admin_full_name: z.string().min(2, "Tenant admin adı zorunludur.").optional(),
    is_trial: z.boolean().optional(),
  })
  .transform((data) => ({
    ...data,
    max_product_limit: data.max_product_limit ?? getLimitForPlan(data.plan),
  }))
  .refine((data) => data.max_product_limit === getLimitForPlan(data.plan), {
    message: "Plan ve ürün limiti uyuşmuyor.",
    path: ["plan"],
  });

export const tenantUpdateSchema = z
  .object({
    status: z.enum(["active", "suspended"]).optional(),
    plan: tenantPlanSchema.optional(),
    max_product_limit: maxProductLimitSchema.optional(),
    whatsapp_number: z.string().min(10).optional(),
    end_trial: z.boolean().optional(),
  })
  .transform((data) => {
    // end_trial DB kolonu değil; trial_ends_at'e çevrilir. Süper admin bir
    // paket atadığında deneme süresi sona erdirilir.
    const { end_trial, ...rest } = data;
    const mapped = end_trial ? { ...rest, trial_ends_at: null } : rest;

    if (mapped.plan) {
      return {
        ...mapped,
        max_product_limit: getLimitForPlan(mapped.plan),
      };
    }

    return mapped;
  })
  .refine(
    (data) => {
      if (data.plan && data.max_product_limit) {
        return data.max_product_limit === getLimitForPlan(data.plan);
      }

      return true;
    },
    {
      message: "Plan ve ürün limiti uyuşmuyor.",
      path: ["plan"],
    },
  );
