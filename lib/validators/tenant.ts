import { z } from "zod";
import {
  getLimitForPlan,
  TENANT_PLAN_IDS,
} from "@/lib/billing/plans";
import { getPlanPeriodEnd } from "@/lib/billing/membership";
import { getTrialEndDate } from "@/lib/billing/trial";
import { getPlanTrialEndDate } from "@/lib/billing/plan-trial";
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
  z.literal(250),
  z.literal(500),
  z.literal(1000),
  z.literal(2000),
  z.literal(2500),
  z.literal(5000),
  z.literal(20000),
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

const tenantUpdateObject = z
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
    // start_trial / start_plan_trial ile birlikte: kaç günlük deneme (süper admin sorar).
    trial_days: z.number().int().min(1).max(365).optional(),
    // Ücretli paket denemesi (0132): plan + trial_days ile mağaza o pakete alınır,
    // süre dolunca cron Ücretsiz'e düşürür. end_plan_trial: ödeme alınmadan
    // sonlandır → hemen Ücretsiz plana düşer (limit üstü ürünler gizlenir).
    start_plan_trial: z.boolean().optional(),
    end_plan_trial: z.boolean().optional(),
    gift_months: z.number().int().min(1).max(24).optional(),
    // Ücretli paket denemesindeki mağazadan ödeme alındı: deneme biter,
    // mevcut paket bugünden itibaren 12 aylık üyeliğe döner (0132).
    confirm_plan_payment: z.boolean().optional(),
    // Süper admin "ödeme alındı" işareti (0156): plan_paid_at/plan_paid_note'a çevrilir.
    // Süper admin "Demo Mağazalar" sekmesi (0158).
    is_internal_demo: z.boolean().optional(),
    mark_plan_paid: z.boolean().optional(),
    unmark_plan_paid: z.boolean().optional(),
    plan_paid_note: z.string().trim().max(200).optional(),
  });

type TenantUpdateInput = Omit<
  z.infer<typeof tenantUpdateObject>,
  "mark_plan_paid" | "unmark_plan_paid" | "plan_paid_note"
>;

export const tenantUpdateSchema = tenantUpdateObject.transform(
  ({ mark_plan_paid, unmark_plan_paid, plan_paid_note, ...data }) => {
    const nowIso = new Date().toISOString();
    const paidPatch =
      mark_plan_paid || data.confirm_plan_payment
        ? { plan_paid_at: nowIso, plan_paid_note: plan_paid_note || null }
        : unmark_plan_paid
          ? { plan_paid_at: null, plan_paid_note: null }
          : {};
    return { ...mapTenantUpdate(data), ...paidPatch };
  },
)
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

function mapTenantUpdate(data: TenantUpdateInput) {
    // end_trial / start_trial DB kolonu değil; trial_ends_at'e çevrilir.
    // end_trial: süper admin paket atadığında deneme sonlanır.
    // start_trial: mevcut hesap bugünden itibaren trial_days (yoksa varsayılan) günlük denemeye alınır.
    // gift_months route'ta işlenir (mevcut bitişe göre hesap gerekir).
    const { end_trial, start_trial, trial_days, start_plan_trial, end_plan_trial, confirm_plan_payment, ...rest } = data;
    if (start_plan_trial && rest.plan) {
      const from = new Date();
      const end = new Date(from);
      end.setDate(end.getDate() + (trial_days ?? 14));
      return {
        ...rest,
        max_product_limit: getLimitForPlan(rest.plan),
        plan_trial_ends_at: trial_days ? end.toISOString() : getPlanTrialEndDate(from),
        plan_trial_reminder_sent_at: null,
        trial_ends_at: null,
      };
    }
    if (end_plan_trial) {
      return {
        ...rest,
        plan: "free" as const,
        max_product_limit: getLimitForPlan("free"),
        plan_trial_ends_at: null,
        plan_trial_reminder_sent_at: null,
        trial_ends_at: null,
      };
    }
    if (confirm_plan_payment) {
      return {
        ...rest,
        plan_trial_ends_at: null,
        plan_trial_reminder_sent_at: null,
        plan_started_at: new Date().toISOString(),
        plan_expires_at: getPlanPeriodEnd(),
      };
    }
    const mapped = end_trial
      ? { ...rest, trial_ends_at: null }
      : start_trial
        ? { ...rest, trial_ends_at: getTrialEndDate(new Date(), trial_days) }
        : rest;

    if (mapped.plan) {
      // Paket onayı: ödeme alındı, üyelik dönemi o günden itibaren 12 ay.
      // Elle paket atamak ücretli paket denemesini de bitirir.
      return {
        ...mapped,
        max_product_limit: getLimitForPlan(mapped.plan),
        plan_started_at: new Date().toISOString(),
        plan_expires_at: getPlanPeriodEnd(),
        plan_trial_ends_at: null,
        plan_trial_reminder_sent_at: null,
      };
    }

    return mapped;
}
