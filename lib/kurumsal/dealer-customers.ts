import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DealerProfile } from "@/lib/kurumsal/dealer-profile";
import { getPushReach, hasPushReach } from "@/lib/push/reach";

export { formatDealerAddress, formatDealerDisplayName, type DealerProfile } from "@/lib/kurumsal/dealer-profile";

// Bayi müşterileri (0138, yalnız Kurumsal paket). Onaylanan bayi başvurusuna
// kişiye özel şifre verilir: access_codes satırı (is_personal=true) + müşteri
// bilgileri. Bu şifreyle giren müşterinin sepetinde ad/telefon/adres alanı
// sorulmaz; sipariş fişine buradaki bilgiler sunucuda yazılır.

export interface DealerCustomer {
  id: string;
  password_code: string;
  price_list_id: string;
  price_list_name: string | null;
  customer_company: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_note: string | null;
  dealer_application_id: string | null;
  created_at: string;
  order_count: number;
  last_order_at: string | null;
  /** Bildirim ulaşabilir mi (lib/push/reach.ts). */
  has_push: boolean;
}

function optionalText(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );
}

export const dealerCustomerInfoSchema = z.object({
  customer_company: optionalText(120),
  customer_name: z.string().trim().min(2, "Müşteri adını yazın.").max(80, "Ad en fazla 80 karakter."),
  customer_phone: optionalText(20),
  customer_address: optionalText(400),
  customer_city: optionalText(40),
  customer_note: optionalText(500),
});

export const dealerPasswordSchema = z
  .string()
  .trim()
  .min(3, "Şifre en az 3 karakter olmalı.")
  .max(40, "Şifre en fazla 40 karakter olabilir.")
  .refine((value) => !/\s/.test(value), "Şifrede boşluk olmasın.");

export const dealerApproveSchema = dealerCustomerInfoSchema.extend({
  price_list_id: z.string().uuid("Fiyat listesi seçin."),
  password_code: dealerPasswordSchema,
});

export const dealerCustomerUpdateSchema = dealerCustomerInfoSchema.partial().extend({
  price_list_id: z.string().uuid("Fiyat listesi seçin.").optional(),
  password_code: dealerPasswordSchema.optional(),
});

/** Postgres unique ihlali: şifre bu mağazada zaten kullanılıyor. */
export function isDuplicatePasswordError(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "23505" || error.message?.includes("duplicate key")));
}

export const DUPLICATE_PASSWORD_MESSAGE =
  "Bu şifre zaten kullanılıyor (başka bir müşteride ya da ortak liste şifresinde). Farklı bir şifre yazın.";

/** Şifre kişiye özelse müşteri bilgisini döner; ortak şifrede null. */
export async function getDealerProfileByAccessCode(
  supabase: SupabaseClient,
  tenantId: string,
  accessCodeId: string | null | undefined,
): Promise<DealerProfile | null> {
  if (!accessCodeId) return null;
  const { data } = await supabase
    .from("access_codes")
    .select("id, is_personal, customer_company, customer_name, customer_phone, customer_address, customer_city")
    .eq("tenant_id", tenantId)
    .eq("id", accessCodeId)
    .maybeSingle();
  if (!data?.is_personal) return null;
  return {
    accessCodeId: data.id,
    company: data.customer_company ?? null,
    name: data.customer_name ?? null,
    phone: data.customer_phone ?? null,
    address: data.customer_address ?? null,
    city: data.customer_city ?? null,
  };
}

export async function getTenantDealerCustomers(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<DealerCustomer[]> {
  const { data, error } = await supabase
    .from("access_codes")
    .select(
      "id, password_code, price_list_id, customer_company, customer_name, customer_phone, customer_address, customer_city, customer_note, dealer_application_id, created_at, price_list:price_lists(name)",
    )
    .eq("tenant_id", tenantId)
    .eq("is_personal", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[bayi-musteri] okunamadı:", error.message);
    return [];
  }
  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const stats = new Map<string, { count: number; last: string | null }>();
  const reach = await getPushReach(supabase, tenantId);
  if (ids.length) {
    const { data: orders } = await supabase
      .from("orders")
      .select("access_code_id, created_at")
      .eq("tenant_id", tenantId)
      .in("access_code_id", ids)
      .neq("status", "cancelled");
    for (const order of orders ?? []) {
      const key = order.access_code_id as string;
      const current = stats.get(key) ?? { count: 0, last: null };
      current.count += 1;
      if (!current.last || order.created_at > current.last) current.last = order.created_at;
      stats.set(key, current);
    }
  }
  return rows.map((row) => {
    const list = Array.isArray(row.price_list) ? row.price_list[0] : row.price_list;
    const stat = stats.get(row.id);
    return {
      id: row.id,
      password_code: row.password_code,
      price_list_id: row.price_list_id,
      price_list_name: (list as { name?: string } | null)?.name ?? null,
      customer_company: row.customer_company,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      customer_address: row.customer_address,
      customer_city: row.customer_city,
      customer_note: row.customer_note,
      dealer_application_id: row.dealer_application_id,
      created_at: row.created_at,
      order_count: stat?.count ?? 0,
      last_order_at: stat?.last ?? null,
      has_push: hasPushReach(reach, { accessCodeId: row.id, phone: row.customer_phone }),
    };
  });
}

/** Vitrin/sipariş: çerezdeki şifre kişiye özelse ve paket izin veriyorsa müşteri bilgisi. */
export async function resolveStorefrontDealerProfile(
  tenant: { id: string; plan?: TenantPlan | null },
  accessCodeId: string | null | undefined,
): Promise<DealerProfile | null> {
  if (!accessCodeId || !hasPlanFeature(tenant.plan ?? "baslangic", "kurumsal_site")) return null;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  return getDealerProfileByAccessCode(supabase, tenant.id, accessCodeId);
}

export interface DealerCustomerOrder {
  id: string;
  order_no: number | null;
  order_number: string;
  status: "new" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  currency: string;
  total_amount: number;
  item_count: number;
}

/** Müşteri sayfası (/customers/[id]): müşteri + siparişleri (orders.access_code_id). */
export async function getDealerCustomerDetail(
  supabase: SupabaseClient,
  tenantId: string,
  id: string,
): Promise<{ customer: DealerCustomer; orders: DealerCustomerOrder[] } | null> {
  const customers = await getTenantDealerCustomers(supabase, tenantId);
  const customer = customers.find((entry) => entry.id === id);
  if (!customer) return null;
  const { data } = await supabase
    .from("orders")
    .select("id, order_no, order_number, status, created_at, currency, total_amount, item_count")
    .eq("tenant_id", tenantId)
    .eq("access_code_id", id)
    .order("created_at", { ascending: false })
    .limit(500);
  return { customer, orders: (data ?? []) as DealerCustomerOrder[] };
}
