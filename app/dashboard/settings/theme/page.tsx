import { EsnafThemePicker } from "@/components/dashboard/esnaf-theme-picker";
import { Header } from "@/components/dashboard/header";
import { TenantThemeForm } from "@/components/dashboard/tenant-theme-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantProducts, getTenantStorefrontSettings } from "@/lib/data";
import type { EsnafThemeKey } from "@/lib/storefront/esnaf-themes";

export default async function TenantThemeSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
  const isEsnaf = tenant.business_type === "market";

  if (!isEsnaf) {
    // Önizlemede sahte ürün yerine mağazanın gerçek ürünleri görünsün:
    // bayi, temayı seçince vitrinin gerçekten nasıl görüneceğini görür.
    const products = await getTenantProducts(tenant.id);
    const previewProducts = products.slice(0, 8).map((product) => ({
      name: product.product_name,
      price: product.prices?.[0]?.price ?? product.discount_price ?? null,
      currency: product.currency,
      inStock: product.is_in_stock,
      imageUrl: product.image_url,
    }));

    return (
      <div className="space-y-6">
        <Header
          eyebrow="Ayarlar / Tema & Marka Renkleri"
          title="Tema & Marka Renkleri"
          description="Marka renkleri, hazır tema, vitrin düzeni, sepet önerileri ve (üst paketlerde) yazı tipi/kart/header/footer stillerini yönetin."
        />
        <TenantThemeForm
          initialStorefrontSettings={storefrontSettings}
          tenantPlan={tenant.plan ?? "baslangic"}
          companyName={tenant.company_name}
          previewProducts={previewProducts}
        />
      </div>
    );
  }

  const currentTheme = (storefrontSettings?.esnaf_theme_key ?? null) as EsnafThemeKey | null;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Tema"
        title="Mağaza teması"
        description="Üç hazır temadan birini seçin; ürünleriniz, logonuz ve içeriğiniz değişmez, yalnız görünüm değişir. Marka renkleri ve ince ayarlar aşağıdaki gelişmiş bölümde."
      />
      <EsnafThemePicker currentTheme={currentTheme} />
      <details className="rounded-xl border border-slate-200 bg-card p-4 dark:border-slate-800">
        <summary className="cursor-pointer text-sm font-semibold">Gelişmiş görünüm ayarları (marka renkleri, sepet önerileri, yazı tipi)</summary>
        <div className="mt-4">
          <TenantThemeForm
            initialStorefrontSettings={storefrontSettings}
            tenantPlan={tenant.plan ?? "baslangic"}
            companyName={tenant.company_name}
          />
        </div>
      </details>
    </div>
  );
}
