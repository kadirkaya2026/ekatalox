import { Sidebar } from "@/components/dashboard/sidebar";
import { requireTenantAdminPage } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireTenantAdminPage();

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:h-screen md:grid-cols-[280px_1fr] md:overflow-hidden">
      <div className="hidden md:block md:h-screen">
        <Sidebar
          mode="tenant"
          title={session.tenant?.company_name ?? "Tenant Paneli"}
          subtitle={session.tenant?.subdomain ?? "yönetim"}
        />
      </div>
      <main className="container-shell py-6 md:h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}