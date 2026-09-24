"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, Clock, ClipboardList, CreditCard, Globe, ImageIcon, LayoutTemplate,
  Megaphone, PanelBottom, Palette, ShieldCheck, Store, Ticket, Truck,
  UserCircle, type LucideIcon,
} from "lucide-react";
import { hasPlanFeature, type PlanFeature, type TenantPlan } from "@/lib/billing/plans";
import type { TenantBusinessType } from "@/lib/types";
import { cn } from "@/lib/utils";

// 360katalog benzeri tek sayfa + dikey alt-sekme düzeni. Sekmeler eski ayar
// sayfalarının aynısına gider (rota ve formlar değişmedi); yalnız gezinme
// tek Ayarlar sayfasının soluna toplandı. Sıra ve etiketler sidebar'daki
// eski "Ayarlar" grubuyla birebir.
type Tab = {
  href: string;
  label: string;
  group: string;
  icon: LucideIcon;
  requiredFeature?: PlanFeature;
  requiredBusinessType?: TenantBusinessType;
};

const TABS: Tab[] = [
  { href: "/settings", label: "Hesap ve Üyelik", icon: UserCircle, group: "Hesap" },
  { href: "/settings/domain", label: "Özel Alan Adı", icon: Globe, group: "Hesap", requiredFeature: "custom_domain" },
  { href: "/settings/theme", label: "Tema & Marka Renkleri", icon: Palette, group: "Marka & Görünüm" },
  { href: "/settings/identity", label: "Mağaza Kimliği", icon: Store, group: "Marka & Görünüm" },
  { href: "/settings/homepage", label: "Ana Sayfa İçerikleri", icon: LayoutTemplate, group: "Marka & Görünüm" },
  { href: "/settings/banner", label: "Anasayfa Banner'ı", icon: ImageIcon, group: "Marka & Görünüm" },
  { href: "/settings/kurumsal", label: "Kurumsal Site", icon: Building2, group: "Marka & Görünüm", requiredBusinessType: "general" },
  { href: "/settings/hours", label: "Çalışma Saatleri", icon: Clock, group: "İçerik & İletişim" },
  { href: "/settings/cart", label: "Sepet Ayarları", icon: ClipboardList, group: "İçerik & İletişim" },
  { href: "/settings/delivery-fee", label: "Getirme Ücreti", icon: Truck, group: "İçerik & İletişim", requiredBusinessType: "market" },
  { href: "/settings/campaigns", label: "Bildirim & Kampanyalar", icon: Ticket, group: "İçerik & İletişim" },
  { href: "/settings/announcement", label: "Duyuru Modalı", icon: Megaphone, group: "İçerik & İletişim" },
  { href: "/settings/age-verification", label: "Yaş Doğrulama (18+)", icon: ShieldCheck, group: "İçerik & İletişim", requiredBusinessType: "market" },
  { href: "/settings/footer", label: "Footer (Sayfa Altı)", icon: PanelBottom, group: "İçerik & İletişim" },
  { href: "/settings/payment", label: "Ödeme ve Kampanyalar", icon: CreditCard, group: "Ödeme", requiredFeature: "payment_settings" },
];

const GROUP_ORDER = ["Hesap", "Marka & Görünüm", "İçerik & İletişim", "Ödeme"];

export function SettingsNav({
  plan,
  businessType,
}: {
  plan: TenantPlan;
  businessType: TenantBusinessType;
}) {
  const pathname = usePathname();
  const visible = TABS.filter(
    (t) =>
      (!t.requiredFeature || hasPlanFeature(plan, t.requiredFeature)) &&
      (!t.requiredBusinessType || t.requiredBusinessType === businessType),
  );

  return (
    <nav className="lg:w-64 lg:shrink-0">
      <div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-2">
        {GROUP_ORDER.map((group) => {
          const items = visible.filter((t) => t.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="lg:mb-1 lg:mt-2 lg:first:mt-0">
              <p className="hidden px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:block">
                {group}
              </p>
              {items.map((t) => {
                const active = pathname === t.href;
                const Icon = t.icon;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {t.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
