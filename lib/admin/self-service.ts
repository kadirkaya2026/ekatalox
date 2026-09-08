// Süper admin: self-servis kayıt (signup_requests) ve kayıt kuponları
// (signup_coupons) için ortak sorgu + doğrulama. Şema: 0113_self_service_signup.
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SignupCoupon, SignupRequest, SignupRequestStatus } from "@/lib/types";

export const SIGNUP_PAGE_SIZE = 50;
export const SIGNUP_STATUSES: SignupRequestStatus[] = ["created", "failed", "cancelled"];
export const COUPON_PLAN_IDS = ["pro", "business"] as const;
export const COUPON_PERIODS = ["monthly", "yearly"] as const;

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

/** Kupon kodu: boşluksuz, büyük harf, 3-32 karakter (A-Z 0-9 - _). */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

const couponCodeSchema = z
  .string()
  .transform(normalizeCouponCode)
  .refine((value) => CODE_PATTERN.test(value), {
    message: "Kupon kodu 3-32 karakter olmalı; yalnız harf, rakam, - ve _ kullanılabilir.",
  });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length ? value : null))
    .nullable()
    .optional();

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null))
  .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), {
    message: "Geçersiz tarih.",
  })
  .nullable()
  .optional();

const optionalMaxUses = z.coerce.number().int().min(1).max(1_000_000).nullable().optional();

const nullableArray = <T extends z.ZodTypeAny>(item: T) =>
  z
    .array(item)
    .transform((list) => (list.length ? Array.from(new Set(list)) : null))
    .nullable()
    .optional();

export const couponCreateSchema = z
  .object({
    code: couponCodeSchema,
    description: optionalText(300),
    discount_type: z.enum(["percent", "amount"], { message: "İndirim türü seçin." }),
    discount_value: z.coerce.number().positive({ message: "İndirim değeri 0'dan büyük olmalı." }),
    applies_to_plans: nullableArray(z.enum(COUPON_PLAN_IDS)),
    applies_to_periods: nullableArray(z.enum(COUPON_PERIODS)),
    valid_from: optionalDate,
    valid_until: optionalDate,
    max_uses: optionalMaxUses,
    is_active: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.discount_type === "percent" && value.discount_value > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Yüzde indirimi 100'ü aşamaz.",
        path: ["discount_value"],
      });
    }
    if (value.valid_from && value.valid_until && new Date(value.valid_from) > new Date(value.valid_until)) {
      ctx.addIssue({
        code: "custom",
        message: "Bitiş tarihi başlangıçtan önce olamaz.",
        path: ["valid_until"],
      });
    }
  });

export type CouponCreateInput = z.infer<typeof couponCreateSchema>;

export const couponUpdateSchema = z
  .object({
    is_active: z.boolean().optional(),
    description: optionalText(300),
    valid_until: optionalDate,
    max_uses: optionalMaxUses,
  })
  .refine((value) => Object.keys(value).length > 0, { message: "Güncellenecek alan yok." });

export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const signupListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(SIGNUP_STATUSES).optional(),
});

export interface SignupRequestPage {
  rows: SignupRequest[];
  total: number;
  page: number;
  pageSize: number;
  status: SignupRequestStatus | null;
}

export async function listSignupCoupons(): Promise<SignupCoupon[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("signup_coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SignupCoupon[];
}

export async function listSignupRequests(params: {
  page: number;
  status?: SignupRequestStatus | null;
}): Promise<SignupRequestPage> {
  const page = Math.max(1, params.page);
  const status = params.status ?? null;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { rows: [], total: 0, page, pageSize: SIGNUP_PAGE_SIZE, status };
  }

  const from = (page - 1) * SIGNUP_PAGE_SIZE;
  let query = supabase
    .from("signup_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + SIGNUP_PAGE_SIZE - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: (data ?? []) as SignupRequest[],
    total: count ?? 0,
    page,
    pageSize: SIGNUP_PAGE_SIZE,
    status,
  };
}
