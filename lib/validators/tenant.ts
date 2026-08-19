import { z } from "zod";
import {
  getLimitForPlan,
  TENANT_PLAN_IDS,
} from "@/lib/billing/plans";
import { getPlanPeriodEnd } from "@/lib/billing/membership";
import { getTrialEndDate } from "@/lib/billing/trial";
import {
  isReservedSubdomain,
  normalizeSubdomain,
  RESERVED_SUBDOMAIN_MESSAGE,
} from "@/lib/tenancy/reserved-subdomains";
import { customDomainFieldSchema } from "@/lib/validators/custom-domain";

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
  z.literal(200),
  z.literal(500),
  z.literal(1000),
  z.literal(2000),
  z.literal(2500),
  z.literal(5000),
]);

const businessTypeSchema = z.enum(["general", "market"]);

export const tenantSchema = z
  .object({
    company_name: z.string().min(2, "Firma adı zorunludur."),
    subdomain: subdomainSchema,
    plan: tenantPlanSchema,
    max_product_limit: maxProductLimitSchema.optional(),
    // Telefon numarası artık zorunlu değil; girildiyse en az 10 hane olmalı.
    whatsapp_number: z
      .string()
      .refine((value) => value === "" || value.length >= 10, {
        message: "WhatsApp numarası girilecekse en az 10 haneli olmalı.",
      })
      .optional()
      .default(""),
    tenant_admin_email: z.email("Geçerli bir tenant admin e-postası girin."),
    tenant_admin_full_name: z.string().min(2, "Tenant admin adı zorunludur.").optional(),
    is_trial: z.boolean().optional(),
    business_type: businessTypeSchema.optional(),
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
    company_name: z.string().min(2, "Firma adı zorunludur.").optional(),
    status: z.enum(["active", "suspended"]).optional(),
    plan: tenantPlanSchema.optional(),
    business_type: businessTypeSchema.optional(),
    // Alkol/sigara bayii (tekel) — yasal olarak dağıtım/teslimat
    // yapamayan market tenant'lar için (kullanıcı isteği, 20 Ağu 2026).
    // true olduğunda storefront adres toplamaz, sepet/checkout metinleri
    // "sipariş listesi hazırlama" diline döner (bkz. lib/storefront/cart.ts).
    is_tekel: z.boolean().optional(),
    max_product_limit: maxProductLimitSchema.optional(),
    visitor_limit_addon: z.number().int().min(0).optional(),
    product_limit_addon: z.number().int().min(0).optional(),
    whatsapp_number: z.string().min(10).optional(),
    custom_domain: customDomainFieldSchema.optional(),
    end_trial: z.boolean().optional(),
    start_trial: z.boolean().optional(),
    gift_months: z.number().int().min(1).max(24).optional(),
  })
  .transform((data) => {
    // end_trial / start_trial DB kolonu değil; trial_ends_at'e çevrilir.
    // end_trial: süper admin paket atadığında deneme sonlanır.
    // start_trial: mevcut hesap bugünden itibaren 14 günlük denemeye alınır.
    // gift_months route'ta işlenir (mevcut bitişe göre hesap gerekir).
    const { end_trial, start_trial, ...rest } = data;
    const mapped = end_trial
      ? { ...rest, trial_ends_at: null }
      : start_trial
        ? { ...rest, trial_ends_at: getTrialEndDate() }
        : rest;

    if (mapped.plan) {
      // Paket onayı: ödeme alındı, üyelik dönemi o günden itibaren 12 ay.
      return {
        ...mapped,
        max_product_limit: getLimitForPlan(mapped.plan),
        plan_started_at: new Date().toISOString(),
        plan_expires_at: getPlanPeriodEnd(),
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
