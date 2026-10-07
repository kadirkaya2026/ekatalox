import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isTrialExpired } from "@/lib/billing/trial";
import { getStorefrontTenant } from "@/lib/data";
import { resolveStorefrontDealerProfile } from "@/lib/kurumsal/dealer-customers";
import type { DealerProfile } from "@/lib/kurumsal/dealer-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isStorefrontPriceListStateValid, readStorefrontPriceList } from "@/lib/storefront/session";
import { hasAccountPage } from "@/lib/storefront/white-label";

// Vitrin "Hesabım" (8 Eki 2026): kimlik telefon numarasından DEĞİL, vitrin
// çerezindeki kişiye özel şifreden (access_codes.is_personal) gelir — başkası
// numarayı yazarak birinin siparişlerini göremez.

export type StorefrontAccountContext = {
  tenant: NonNullable<Awaited<ReturnType<typeof getStorefrontTenant>>>;
  profile: DealerProfile;
  supabase: SupabaseClient;
};

export async function resolveStorefrontAccount(subdomain: string | null | undefined): Promise<StorefrontAccountContext | null> {
  if (!subdomain) return null;
  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant || tenant.status !== "active" || isTrialExpired(tenant) || !hasAccountPage(tenant)) return null;
  const cookie = await readStorefrontPriceList(subdomain);
  if (!cookie || !isStorefrontPriceListStateValid({ cookieState: cookie, tenant })) return null;
  const profile = await resolveStorefrontDealerProfile(tenant, cookie.accessCodeId);
  const supabase = createSupabaseAdminClient();
  if (!profile || !supabase) return null;
  return { tenant, profile, supabase };
}

function optionalText(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );
}

export const accountInfoSchema = z.object({
  customer_company: optionalText(120),
  customer_name: z.string().trim().min(2, "Ad soyad yazın.").max(80, "Ad en fazla 80 karakter."),
  customer_phone: z
    .string()
    .trim()
    .max(20, "Telefon en fazla 20 karakter.")
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Geçerli bir telefon numarası yazın."),
});

export const accountAddressSchema = z.object({
  label: optionalText(40),
  address: z.string().trim().min(5, "Adresi yazın.").max(400, "Adres en fazla 400 karakter."),
  city: optionalText(40),
});

export const MAX_EXTRA_ADDRESSES = 10;
