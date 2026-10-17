import { notFound } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { TenantHelpPagesForm } from "@/components/dashboard/tenant-help-pages-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { readHelpPages } from "@/lib/storefront/help-pages";

export const metadata = { title: "Yardım Sayfaları" };

// Market vitrini Hesabım > Yardım (0184, 17 Eki 2026).
export default async function HelpPagesSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") notFound();
  const settings = await getTenantStorefrontSettings(tenant.id);
  const storeUrl = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Yardım Sayfaları"
        title="Yardım Sayfaları"
        description="Müşterileriniz vitrinde Hesabım > Yardım'da müşteri hizmetleri, Hakkımızda, Sıkça Sorulan Sorular ve sözleşmeleri görür."
      />
      <TenantHelpPagesForm initial={readHelpPages(settings.help_pages)} storeUrl={storeUrl} />
    </div>
  );
}
