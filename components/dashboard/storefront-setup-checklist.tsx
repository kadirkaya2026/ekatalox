"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TenantStorefrontSettings } from "@/lib/types";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

function buildSetupSteps(settings: TenantStorefrontSettings): SetupStep[] {
  const hasBrandColors = Boolean(
    settings.brand_primary_color || settings.brand_accent_color,
  );
  const hasCustomTheme =
    settings.theme_key !== "minimal" || settings.layout_key !== "classic-grid";
  const hasLogo = Boolean(settings.logo_url);
  const hasBanner = (settings.banner_items ?? []).length > 0;
  const hasFooterContent = Boolean(
    settings.footer_location ||
      settings.footer_phone ||
      settings.footer_email ||
      settings.footer_instagram_url,
  );

  return [
    {
      id: "theme",
      title: "Tema ve düzen seçin",
      description: "Hazır tema ve vitrin düzeni ile rakiplerden ayrışın.",
      href: "/dashboard/settings/theme",
      completed: hasCustomTheme || hasBrandColors,
    },
    {
      id: "logo",
      title: "Logo yükleyin",
      description: "Header’da firmanızın logosu görünsün.",
      href: "/dashboard/settings/site",
      completed: hasLogo,
    },
    {
      id: "hero",
      title: "Hero metnini tanımlayın",
      description: "Ana sayfada firmanızı anlatan kısa bir metin ekleyin.",
      href: "/dashboard/settings/site",
      completed: Boolean(settings.hero_heading || settings.storefront_description),
    },
    {
      id: "banner",
      title: "Banner ekleyin",
      description: "Kampanya veya marka görselleriyle vitrini renklendirin.",
      href: "/dashboard/settings/banner",
      completed: hasBanner,
    },
    {
      id: "footer",
      title: "Footer bilgilerini doldurun",
      description: "İletişim, konum ve sosyal medya bağlantılarını ekleyin.",
      href: "/dashboard/settings/storefront",
      completed: hasFooterContent,
    },
  ];
}

export function StorefrontSetupChecklist({
  storefrontSettings,
}: {
  storefrontSettings: TenantStorefrontSettings;
}) {
  const steps = buildSetupSteps(storefrontSettings);
  const completedCount = steps.filter((step) => step.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  if (completedCount === steps.length) {
    return null;
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Vitrininizi özelleştirin</p>
          <p className="mt-1 text-sm text-emerald-900/80">
            Mağazanızın diğer firmalardan farklı görünmesi için aşağıdaki adımları tamamlayın.
          </p>
          <p className="mt-3 text-sm font-medium text-emerald-800">
            Tamamlanan: {completedCount}/{steps.length} ({progress}%)
          </p>
        </div>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-emerald-100 lg:mt-2">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 transition hover:border-emerald-300 hover:bg-white"
          >
            {step.completed ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="mt-0.5 size-5 shrink-0 text-slate-300" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-1 text-sm text-slate-600">{step.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
