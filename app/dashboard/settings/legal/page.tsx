import { Header } from "@/components/dashboard/header";
import { SettingsTabShell } from "@/components/dashboard/settings-tab-shell";
import {
  LegalStatusBanner,
  TenantLegalDocumentsForm,
  TenantLegalProfileForm,
} from "@/components/dashboard/tenant-legal-form";
import { getTenantStorefrontSettings } from "@/lib/data";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { appEnv } from "@/lib/env";
import { getLegalProfileProblems, readLegalProfile } from "@/lib/legal/tenant-legal";

export const metadata = { title: "Yasal Bilgiler" };

// 17 Eki 2026: online ödeme hazırlığı. Satıcı bilgileri + sözleşmeler; ikisi
// ayrı sekme (ayar sayfalarında alt alta yığma yok).
export default async function LegalSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const settings = await getTenantStorefrontSettings(tenant.id);
  const profile = readLegalProfile(settings.legal_profile);
  const problems = getLegalProfileProblems(profile);
  const storeUrl = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;
  const storeName = settings.storefront_title?.trim() || tenant.company_name;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Yasal Bilgiler"
        title="Yasal Bilgiler ve Sözleşmeler"
        description="Online ödeme için zorunlu satıcı bilgileri ve mağazanızda yayınlanacak sözleşmeler (mesafeli satış, ön bilgilendirme, iptal/iade, KVKK)."
      />
      <LegalStatusBanner problems={problems} />
      <SettingsTabShell
        layoutId="legal-settings-tabs"
        tabs={[
          { key: "profile", label: "İşletme Bilgileri" },
          { key: "documents", label: "Sözleşmeler" },
        ]}
        panels={{
          profile: <TenantLegalProfileForm initialProfile={profile} />,
          documents: (
            <TenantLegalDocumentsForm
              initialProfile={profile}
              storeName={storeName}
              storeUrl={storeUrl}
              isPublished={problems.length === 0}
            />
          ),
        }}
      />
    </div>
  );
}
