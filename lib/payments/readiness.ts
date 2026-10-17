import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";
import { getLegalProfileProblems, readLegalProfile } from "@/lib/legal/tenant-legal";
import { getTenantPaymentProviderSummary, isPaymentCredentialStoreReady } from "@/lib/payments/credentials";

// Online ödeme ancak üç koşul birlikteyken açılabilir / kullanılabilir (0185):
// Kurumsal paket, eksiksiz yasal bilgiler (0178) ve doğrulanmış sağlayıcı
// anahtarı. Panel açma anahtarı, vitrin ve sipariş ucu aynı kontrolü kullanır.
export async function getOnlinePaymentProblems(params: {
  supabase: SupabaseClient;
  tenantId: string;
  plan: TenantPlan;
  legalProfile: unknown;
}): Promise<string[]> {
  const problems: string[] = [];
  if (!hasPlanFeature(params.plan, "online_payment")) problems.push("Kurumsal paket gerekli");
  if (getLegalProfileProblems(readLegalProfile(params.legalProfile)).length) {
    problems.push("Yasal bilgiler eksik");
  }
  if (!isPaymentCredentialStoreReady()) {
    problems.push("Ödeme anahtarı kasası yapılandırılmamış");
    return problems;
  }
  const provider = await getTenantPaymentProviderSummary(params.supabase, params.tenantId);
  if (!provider) problems.push("Sağlayıcı anahtarları girilmemiş");
  else if (!provider.verified_at) problems.push("Sağlayıcı anahtarları doğrulanmadı");
  return problems;
}

/** Koşullardan biri bozulunca (anahtar silindi/doğrulanamadı, yasal bilgi
 *  eksildi) vitrindeki Online seçeneği kapatılır. */
export async function disableOnlinePaymentMethod(supabase: SupabaseClient, tenantId: string) {
  const { data } = await supabase
    .from("tenant_storefront_settings")
    .select("payment_methods")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const methods = (data?.payment_methods ?? null) as Record<string, boolean> | null;
  if (methods?.online) {
    await supabase
      .from("tenant_storefront_settings")
      .update({ payment_methods: { ...methods, online: false } })
      .eq("tenant_id", tenantId);
  }
}
