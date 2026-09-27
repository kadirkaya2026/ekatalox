import {
  AccessCodesManager,
  type MissingPrices,
  type PersonalCodeSummary,
} from "@/components/dashboard/access-codes-manager";
import { Header } from "@/components/dashboard/header";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantAccessCodes, getTenantPriceLists } from "@/lib/data";
import { formatDealerDisplayName } from "@/lib/kurumsal/dealer-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Fiyat Listeleri (eski "Şifreler", 28 Eyl 2026): liste kartları + şifreler +
// fiyatı girilmemiş ürün uyarısı (0139) + kişiye özel müşteri şifreleri (0138).
async function getListExtras(tenantId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { missingPrices: {} as MissingPrices, personalCodes: [] as PersonalCodeSummary[] };
  const [{ data: missingRows }, { data: personalRows }] = await Promise.all([
    supabase.rpc("price_list_missing_prices", { p_tenant_id: tenantId, p_sample: 50 }),
    supabase
      .from("access_codes")
      .select("id, price_list_id, customer_company, customer_name")
      .eq("tenant_id", tenantId)
      .eq("is_personal", true)
      .order("created_at", { ascending: false }),
  ]);
  const missingPrices: MissingPrices = {};
  for (const row of (missingRows ?? []) as Array<{ price_list_id: string; missing_count: number; sample: MissingPrices[string]["sample"] }>) {
    missingPrices[row.price_list_id] = { count: Number(row.missing_count), sample: row.sample ?? [] };
  }
  const personalCodes: PersonalCodeSummary[] = (personalRows ?? []).map((row) => ({
    id: row.id,
    price_list_id: row.price_list_id,
    label: formatDealerDisplayName({ company: row.customer_company, name: row.customer_name }) || "Müşteri",
  }));
  return { missingPrices, personalCodes };
}

export default async function TenantAccessCodesPage() {
  const session = await requireTenantAdminPage();
  const tenantId = session.tenant!.id;
  const [codes, priceLists, extras] = await Promise.all([
    getTenantAccessCodes(tenantId),
    getTenantPriceLists(tenantId),
    getListExtras(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Fiyat Listeleri"
        title="Fiyat listeleri ve şifreler"
        description="Her liste kendi fiyatlarıyla açılır; listeye bağlı şifreyle giren müşteri o fiyatları görür. Fiyatı girilmemiş ürün kalırsa listede uyarı çıkar."
      />

      <AccessCodesManager
        tenant={session.tenant!}
        initialCodes={codes}
        priceLists={priceLists}
        missingPrices={extras.missingPrices}
        personalCodes={extras.personalCodes}
      />
    </div>
  );
}
