import { Sidebar } from "@/components/dashboard/sidebar";
import { requireSuperAdminPage } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSuperAdminPage();

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:h-screen md:grid-cols-[280px_1fr] md:overflow-hidden">
      <div className="hidden md:block md:h-screen">
        <Sidebar
          mode="admin"
          title="Süper Admin"
          subtitle="Tenant ve şifre yönetimi"
        />
      </div>
      <main className="container-shell py-6 md:h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}