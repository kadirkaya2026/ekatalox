"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Building2,
  Clock,
  Contact,
  CreditCard,
  FolderTree,
  Globe,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  PanelBottom,
  Palette,
  PlusCircle,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Store,
  UploadCloud,
  UserCircle,
  Wallet,
} from "lucide-react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { SidebarLogoutButton } from "@/components/dashboard/sidebar-logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { hasPlanFeature, type PlanFeature, type TenantPlan } from "@/lib/billing/plans";
import type { TenantBusinessType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SubLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredFeature?: PlanFeature;
  requiredBusinessType?: TenantBusinessType;
  group?: string;
}

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredFeature?: PlanFeature;
  requiredBusinessType?: TenantBusinessType;
  children?: SubLink[];
}

const tenantLinks: SidebarLink[] = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  {
    href: "/products",
    label: "Ürünler",
    icon: Building2,
    children: [
      { href: "/products/add", label: "Ürün Ekle", icon: PlusCircle },
      { href: "/products/bulk", label: "Toplu Ürün Ekleme", icon: UploadCloud },
      {
        href: "/products/market-catalog",
        label: "Master Katalog",
        icon: Store,
        requiredBusinessType: "market",
      },
      {
        href: "/products/showcase",
        label: "Öne Çıkan Bölümler",
        icon: Star,
        requiredFeature: "showcase_products",
      },
    ],
  },
  { href: "/categories", label: "Kategoriler", icon: FolderTree },
  { href: "/access-codes", label: "Şifreler", icon: KeyRound },
  { href: "/reports", label: "Raporlar", icon: BarChart3 },
  {
    href: "/customers",
    label: "Müşteriler",
    icon: Contact,
    requiredBusinessType: "market",
  },
  {
    href: "/settings",
    label: "Ayarlar",
    icon: Settings,
    children: [
      { href: "/settings", label: "Hesap ve Üyelik", icon: UserCircle, group: "Hesap" },
      {
        href: "/settings/domain",
        label: "Özel Alan Adı",
        icon: Globe,
        group: "Hesap",
        requiredFeature: "custom_domain",
      },
      {
        href: "/settings/theme",
        label: "Tema & Marka Renkleri",
        icon: Palette,
        group: "Marka & Görünüm",
      },
      {
        href: "/settings/identity",
        label: "Mağaza Kimliği",
        icon: Store,
        group: "Marka & Görünüm",
      },
      {
        href: "/settings/homepage",
        label: "Ana Sayfa İçerikleri",
        icon: LayoutTemplate,
        group: "Marka & Görünüm",
      },
      {
        href: "/settings/banner",
        label: "Anasayfa Banner'ı",
        icon: ImageIcon,
        group: "Marka & Görünüm",
      },
      {
        href: "/settings/hours",
        label: "Çalışma Saatleri",
        icon: Clock,
        group: "İçerik & İletişim",
      },
      {
        href: "/settings/min-order",
        label: "Minimum Sepet Tutarı",
        icon: Wallet,
        group: "İçerik & İletişim",
      },
      {
        href: "/settings/announcement",
        label: "Duyuru Modalı",
        icon: Megaphone,
        group: "İçerik & İletişim",
      },
      {
        href: "/settings/age-verification",
        label: "Yaş Doğrulama (18+)",
        icon: ShieldCheck,
        group: "İçerik & İletişim",
        requiredBusinessType: "market",
      },
      {
        href: "/settings/footer",
        label: "Footer (Sayfa Altı)",
        icon: PanelBottom,
        group: "İçerik & İletişim",
      },
      {
        href: "/settings/payment",
        label: "Ödeme ve Kampanyalar",
        icon: CreditCard,
        group: "Ödeme",
        requiredFeature: "payment_settings",
      },
    ],
  },
];

const adminLinks: SidebarLink[] = [
  { href: "/", label: "Tenant Yönetimi", icon: Building2 },
  { href: "/logs", label: "Giriş Logları", icon: ScrollText },
];

function filterLinksForTenant(
  links: SidebarLink[],
  plan: TenantPlan,
  businessType: TenantBusinessType,
): SidebarLink[] {
  return links
    .filter(
      (link) =>
        (!link.requiredFeature || hasPlanFeature(plan, link.requiredFeature)) &&
        (!link.requiredBusinessType || link.requiredBusinessType === businessType),
    )
    .map((link) => {
      if (!link.children) {
        return link;
      }

      const children = link.children.filter(
        (child) =>
          (!child.requiredFeature || hasPlanFeature(plan, child.requiredFeature)) &&
          (!child.requiredBusinessType || child.requiredBusinessType === businessType),
      );

      return { ...link, children };
    });
}

export function Sidebar({
  mode,
  title,
  subtitle,
  plan = "baslangic",
  businessType = "general",
}: {
  mode: "admin" | "tenant";
  title: string;
  subtitle: string;
  plan?: TenantPlan;
  businessType?: TenantBusinessType;
}) {
  const pathname = usePathname();
  const links =
    mode === "admin" ? adminLinks : filterLinksForTenant(tenantLinks, plan, businessType);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/dashboard" || pathname === "/admin";
    }
    return (
      pathname === `/dashboard${href}` ||
      pathname === `/admin${href}` ||
      pathname?.endsWith(href)
    );
  }

  function isParentActive(link: SidebarLink) {
    if (isActive(link.href)) return true;
    return link.children?.some((child) => isActive(child.href)) ?? false;
  }

  function groupChildren(children: SubLink[]) {
    const sections: { group?: string; items: SubLink[] }[] = [];

    for (const child of children) {
      const lastSection = sections[sections.length - 1];
      if (lastSection && lastSection.group === child.group) {
        lastSection.items.push(child);
      } else {
        sections.push({ group: child.group, items: [child] });
      }
    }

    return sections;
  }

  return (
    <aside className="flex h-full w-full flex-col bg-slate-900 text-white md:sticky md:top-0 md:h-screen">
      <div className="border-b border-slate-800 px-6 py-6">
        <Link href="/#top" className="inline-flex">
          <EkataloxLogo className="h-8 w-[148px]" priority />
        </Link>
        <p className="mt-3 text-xl font-semibold">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {links.map((link) => {
          const parentActive = isParentActive(link);
          const exactActive = isActive(link.href);

          return (
            <div key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  exactActive
                    ? "bg-white text-slate-900"
                    : parentActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                <link.icon className="size-4" />
                <span>{link.label}</span>
              </Link>

              <AnimatePresence initial={false}>
                {link.children && parentActive ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="ml-1 mt-1.5 space-y-4 overflow-hidden"
                  >
                  {groupChildren(link.children).map((section, sectionIndex) => (
                    <div key={section.group ?? `ungrouped-${sectionIndex}`}>
                      {section.group ? (
                        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-emerald-500/70">
                          {section.group}
                        </p>
                      ) : null}
                      <div className="space-y-0.5">
                        {section.items.map((child) => {
                          const childActive = isActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                                childActive
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                              )}
                            >
                              <child.icon
                                className={cn(
                                  "size-4 shrink-0",
                                  childActive ? "text-emerald-400" : "text-slate-500",
                                )}
                              />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-slate-800 p-4">
        {mode === "admin" ? <ThemeToggle /> : null}
        <SidebarLogoutButton mode={mode} />
      </div>
    </aside>
  );
}
