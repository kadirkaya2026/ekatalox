import { EsnafThemePicker } from "@/components/dashboard/esnaf-theme-picker";
import { Header } from "@/components/dashboard/header";
import { TenantThemeForm } from "@/components/dashboard/tenant-theme-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantStorefrontSettings } from "@/lib/data";
import type { EsnafThemeKey } from "@/lib/storefront/esnaf-themes";
import { appEnv } from "@/lib/env";

type ThemePageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function TenantThemeSettingsPage(props: ThemePageProps) {
  const sp = (await props.searchParams) ?? {};
  const pick = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  // Önizleme sekmesindeki "Bu temayı uygula" buraya ?apply=1&... ile döner;
  // form açılınca aynı PATCH yoluyla kaydeder (yetki/plan kontrolü panelde).
  const autoApply = pick("apply") === "1"
    ? { preset: pick("preset"), theme: pick("theme"), layout: pick("layout"), header: pick("header"), footer: pick("footer"), hero: pick("hero"), bp: pick("bp"), ba: pick("ba"), pal: pick("pal") }
    : null;
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
  const isEsnaf = tenant.business_type === "market";

  if (!isEsnaf) {

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
          previewUrl={`https://${tenant.subdomain}.${appEnv.rootDomain}/?preview=1`}
          autoApply={autoApply}
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
