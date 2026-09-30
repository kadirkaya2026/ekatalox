import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { DESIGNS, getDesignContent, readDesignDocument } from "@/lib/storefront/sector-design/config";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";
import { HeroClusterBannerForm } from "@/components/dashboard/hero-cluster-banner-form";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { TenantBannerForm } from "@/components/dashboard/tenant-banner-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";

export default async function TenantBannerSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
  // Sektör teması kullanan mağazada bu banner'lar vitrinde görünmez; tema kendi
  // "Vitrin görseli" alanını kullanır. Eskiden sessizce Tema sayfasına
  // yönlendiriliyordu, müşteri banner'ın nereye gittiğini anlamıyordu
  // (29 Eyl 2026, Yaşatan Kozmetik) → açıklama + yönlendirme butonu.
  const design = readDesignDocument(storefrontSettings.sector_design, session.tenant!.sector);
  // Akım teması kayan banner şeridini gösterir (30 Eyl 2026); o temada normal form açılır.
  if (design && design.themeId !== "electronics-akim") {
    const themeName = DESIGNS.find((item) => item.id === design.themeId)?.name ?? "seçtiğiniz tema";
    const content = getDesignContent(design) as { heroVisible?: boolean; heroImage?: string };
    const heroHidden = content.heroVisible === false;
    const heroEmpty = !content.heroImage;
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Ayarlar / Anasayfa Banner'ı"
          title="Anasayfa Banner Görselleri"
          description="Mağazanız sektör teması kullandığı için ana sayfa görseli tema ayarlarından yönetilir."
        />
        <Card className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ImageIcon className="size-5" />
            </span>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="text-base font-semibold text-slate-900">
                &ldquo;{themeName}&rdquo; teması kendi ana görsel alanını kullanıyor
              </p>
              <p>
                Bu sayfadaki banner&apos;lar sektör temalarında vitrinde görünmez. Ana sayfanızın üstündeki büyük
                görseli <strong>Tema &amp; Marka Renkleri</strong> sayfasında, düzenleyicinin ilk bölümündeki{" "}
                <strong>&ldquo;Vitrin görseli&rdquo;</strong> alanından yükleyebilirsiniz.
              </p>
              {heroHidden ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                  Şu an bu ana görsel alanı <strong>kapalı</strong>. Açmak için düzenleyicide ilk bölümün görünürlük
                  anahtarını açın.
                </p>
              ) : heroEmpty ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                  Henüz vitrin görseli yüklenmemiş; tema şimdilik ilk ürününüzün fotoğrafını gösteriyor.
                </p>
              ) : null}
            </div>
          </div>
          <Link
            href="/dashboard/settings/theme"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Tema ayarlarına git
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Anasayfa Banner'ı"
        title="Anasayfa Banner Görselleri"
        description="Mağaza vitrin carousel alanı için kampanya, duyuru ve indirim banner'ları yönetin. Bu banner yalnızca anasayfa vitrin carousel'ında görünür — kategori sayfalarındaki banner'lar Kategoriler ekranından ayrı yönetilir."
      />

      <PlanFeatureGate feature="banner_settings" plan={tenant.plan} companyName={tenant.company_name}>
        <div className="space-y-6">
          <TenantBannerForm initialStorefrontSettings={storefrontSettings} />
          <HeroClusterBannerForm initialStorefrontSettings={storefrontSettings} />
        </div>
      </PlanFeatureGate>
    </div>
  );
}
