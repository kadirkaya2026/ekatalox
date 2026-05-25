"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, KeyRound, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tenantLinks: SidebarLink[] = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/products", label: "Ürünler", icon: Building2 },
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

  return (
    <aside className="flex h-full w-full flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          eKatalox
        </p>
        <h2 className="mt-3 text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            pathname === `/dashboard${link.href}` ||
            pathname === `/admin${link.href}` ||
            (link.href !== "/" && pathname?.endsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-white text-slate-900"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <link.icon className="size-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}