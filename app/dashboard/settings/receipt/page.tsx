import { Header } from "@/components/dashboard/header";
import { TenantReceiptSettingsForm } from "@/components/dashboard/tenant-receipt-settings-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Sipariş Fişi" };

export default async function TenantReceiptSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenantId = session.tenant!.id;
  const supabase = createSupabaseAdminClient();
  const { data } = supabase
    ? await supabase.from("tenants").select("receipt_show_images").eq("id", tenantId).maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Sipariş Fişi"
        title="Sipariş Fişi"
        description="Müşterinizin WhatsApp'tan size gönderdiği PDF sipariş fişinin görünümü."
      />
      <TenantReceiptSettingsForm initialShowImages={data?.receipt_show_images !== false} />
    </div>
  );
}
