"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { cn } from "@/lib/utils";

interface SubLink {
  href: string;
  label: string;
}

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SubLink[];
}

const tenantLinks: SidebarLink[] = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  {
    href: "/products",
    label: "Ürünler",
    icon: Building2,
    children: [
      { href: "/products/add", label: "Ürün Ekle" },
      { href: "/products/bulk", label: "Toplu Ürün Ekleme" },
    ],
  },
  { href: "/categories", label: "Kategoriler", icon: FolderTree },
  { href: "/access-codes", label: "Şifreler", icon: KeyRound },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

const adminLinks: SidebarLink[] = [
  { href: "/", label: "Tenant Yönetimi", icon: Building2 },
];

export function Sidebar({
  mode,
  title,
  subtitle,
}: {
  mode: "admin" | "tenant";
  title: string;
  subtitle: string;
}) {
  const pathname = usePathname();
  const links = mode === "admin" ? adminLinks : tenantLinks;

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

  return (
    <aside className="flex h-full w-full flex-col bg-slate-900 text-white md:sticky md:top-0 md:h-screen">
      <div className="border-b border-slate-800 px-6 py-6">
        <Link href="/#top" className="inline-flex">
          <EkataloxLogo className="h-8 w-[148px]" priority />
        </Link>
        <h2 className="mt-3 text-xl font-semibold">{title}</h2>
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

              {link.children && parentActive ? (
                <div className="ml-7 mt-1 flex flex-col gap-1 border-l-2 border-slate-600 pl-4">
                  {link.children.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition",
                          childActive
                            ? "bg-white text-slate-900"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white",
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
