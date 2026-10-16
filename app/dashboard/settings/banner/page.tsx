import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { DESIGNS, readDesignDocument } from "@/lib/storefront/sector-design/config";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";
import { HeroClusterBannerForm } from "@/components/dashboard/hero-cluster-banner-form";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { TenantBannerForm } from "@/components/dashboard/tenant-banner-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export const metadata = { title: "Anasayfa Banner'ı" };

export default async function TenantBannerSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
  // Sektör temalarında banner'lar ana sayfanın en üstünde kayan şerit olarak
  // görünür (Akım 30 Eyl, tüm sektör temaları 17 Eki 2026). Eskiden bu sayfa
  // "sektör temasında görünmez" kartı gösteriyordu.
  const design = readDesignDocument(storefrontSettings.sector_design, session.tenant!.sector);
  const themeName = design ? (DESIGNS.find((item) => item.id === design.themeId)?.name ?? "Sektör teması") : null;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Anasayfa Banner'ı"
        title="Anasayfa Banner Görselleri"
        description="Mağaza vitrin carousel alanı için kampanya, duyuru ve indirim banner'ları yönetin. Bu banner yalnızca anasayfa vitrin carousel'ında görünür — kategori sayfalarındaki banner'lar Kategoriler ekranından ayrı yönetilir."
      />

      <PlanFeatureGate feature="banner_settings" plan={tenant.plan} companyName={tenant.company_name}>
        <div className="space-y-6">
          {themeName ? (
            <Card className="flex items-start gap-3 p-4 text-sm text-slate-600">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ImageIcon className="size-4" />
              </span>
              <p>
                <strong className="text-slate-900">&ldquo;{themeName}&rdquo;</strong> temasında banner&apos;larınız ana
                sayfanın en üstünde kayan şerit olarak görünür (3:1 oranında görsel önerilir). Temanın kendi büyük
                görseli <Link href="/dashboard/settings/theme" className="font-semibold text-emerald-700 underline">Tema ayarlarından</Link>{" "}
                yönetilir.
              </p>
            </Card>
          ) : null}
          <TenantBannerForm initialStorefrontSettings={storefrontSettings} />
          {themeName ? null : <HeroClusterBannerForm initialStorefrontSettings={storefrontSettings} />}
        </div>
      </PlanFeatureGate>
    </div>
  );
}
