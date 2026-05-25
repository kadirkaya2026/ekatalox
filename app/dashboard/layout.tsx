import { Sidebar } from "@/components/dashboard/sidebar";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireTenantAdminPage();

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[280px_1fr]">
      <div className="hidden md:block">
        <Sidebar
          mode="tenant"
          title={session.tenant?.company_name ?? "Tenant Paneli"}
          subtitle={session.tenant?.subdomain ?? "yönetim"}
        />
      </div>
      <main className="container-shell py-6">{children}</main>
    </div>
  );
}